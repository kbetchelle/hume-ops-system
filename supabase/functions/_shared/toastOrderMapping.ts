/**
 * Shared Toast order → DB row mapping for toast-backfill-sync and sync-toast-orders.
 * Handles amounts from order root or order.checks[] per Toast API schema.
 */

export interface OrderAmounts {
  net: number;
  gross: number;
}

/**
 * Extract net and gross amounts from a Toast order.
 * Tries order-level totalAmount/netAmount first; else sums from order.checks[].
 * Net and gross can differ (e.g. gross from totalAmount, net from netAmount or derived).
 */
export function extractOrderAmounts(order: Record<string, unknown>): OrderAmounts {
  const grossTop = Number(order.totalAmount ?? order.amount ?? 0) || 0;
  const netTop = Number(order.netAmount ?? 0) || 0;

  const checks = (order.checks as Array<{ 
    totalAmount?: number; amount?: number; taxAmount?: number 
  }>) ?? [];
  const grossChecks = checks.reduce(
    (s, c) => s + (Number(c.totalAmount ?? c.amount ?? 0) || 0), 0
  );
  const taxChecks = checks.reduce(
    (s, c) => s + (Number(c.taxAmount ?? 0) || 0), 0
  );

  // Prefer root-level if available, else derive from checks
  let gross = grossTop > 0 ? grossTop : grossChecks;
  let net = netTop > 0 ? netTop : Math.max(0, grossChecks - taxChecks);

  // Sanity: gross should always be >= net
  if (gross < net) {
    const tmp = gross;
    gross = net;
    net = tmp;
  }

  return { net, gross };
}

/**
 * Get business_date as yyyy-MM-dd from order.businessDate (integer yyyyMMdd) or fallback.
 */
export function toBusinessDate(
  _order: Record<string, unknown>, 
  fallbackDate: string
): string {
  // Always use the query date as canonical business_date.
  // The order's own businessDate integer may differ due to 
  // Toast timezone handling. Original value preserved in raw_data.
  return fallbackDate;
}

/**
 * Validate a staging row before promotion to toast_sales.
 */
export function validateStagingRow(row: Record<string, unknown>): { valid: boolean; reason?: string } {
  if (!row.order_guid || typeof row.order_guid !== 'string')
    return { valid: false, reason: 'missing order_guid' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(row.business_date)))
    return { valid: false, reason: 'invalid business_date format' };
  const net = Number(row.net_sales);
  const gross = Number(row.gross_sales);
  if (!isFinite(net) || net < 0 || !isFinite(gross) || gross < 0)
    return { valid: false, reason: 'invalid sales amounts' };
  return { valid: true };
}

export interface StagingRow {
  order_guid: string;
  business_date: string;
  net_sales: number;
  gross_sales: number;
  cafe_sales: number;
  order_count: number;
  raw_data: Record<string, unknown>;
  sync_batch_id: string;
  page_number?: number;
}

export interface SalesRow {
  order_guid: string;
  business_date: string;
  net_sales: number;
  gross_sales: number;
  cafe_sales: number;
  order_count: number;
  raw_data: Record<string, unknown>;
  sync_batch_id: string;
}

function getOrderGuid(order: Record<string, unknown>): string {
  if (order.guid != null) return String(order.guid);
  if (order.entityType != null) return String(order.entityType);
  return crypto.randomUUID();
}

export function mapOrderToStagingRow(
  order: Record<string, unknown>,
  businessDate: string,
  batchId: string,
  pageNumber?: number
): StagingRow {
  const orderGuid = getOrderGuid(order);
  const date = toBusinessDate(order, businessDate);
  const { net, gross } = extractOrderAmounts(order);
  const row: StagingRow = {
    order_guid: orderGuid,
    business_date: date,
    net_sales: net,
    gross_sales: gross,
    cafe_sales: net,
    order_count: 1,
    raw_data: order,
    sync_batch_id: batchId,
  };
  if (pageNumber != null) row.page_number = pageNumber;
  return row;
}

export function mapOrderToSalesRow(
  order: Record<string, unknown>,
  businessDate: string,
  batchId: string
): SalesRow {
  const orderGuid = getOrderGuid(order);
  const date = toBusinessDate(order, businessDate);
  const { net, gross } = extractOrderAmounts(order);
  return {
    order_guid: orderGuid,
    business_date: date,
    net_sales: net,
    gross_sales: gross,
    cafe_sales: net,
    order_count: 1,
    raw_data: order,
    sync_batch_id: batchId,
  };
}

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
  if (grossTop > 0 || netTop > 0) {
    return { gross: grossTop, net: netTop };
  }

  const checks = (order.checks as Array<{ totalAmount?: number; amount?: number; taxAmount?: number }>) ?? [];
  const gross = checks.reduce((s, c) => s + (Number(c.totalAmount ?? c.amount ?? 0) || 0), 0);
  const tax = checks.reduce((s, c) => s + (Number(c.taxAmount ?? 0) || 0), 0);
  return { net: Math.max(0, gross - tax), gross };
}

/**
 * Get business_date as yyyy-MM-dd from order.businessDate (integer yyyyMMdd) or fallback.
 */
export function toBusinessDate(order: Record<string, unknown>, fallbackDate: string): string {
  const bd = order.businessDate;
  if (bd != null && typeof bd === 'number' && bd > 0) {
    const s = String(bd);
    if (s.length === 8) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  }
  return fallbackDate;
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
  batchId: string
): StagingRow {
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

import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { fetchWithRetry } from '../_shared/retry.ts';
import { createSyncLogger, logSyncMetrics } from '../_shared/logger.ts';
import { logApiCall } from '../_shared/apiLogger.ts';

const TOAST_BASE_URL = 'https://ws-api.toasttab.com';
const PAGE_SIZE = 300;
const BATCH_UPSERT_SIZE = 100;

interface SyncRequest {
  action?: string;
  start_date?: string;
  end_date?: string;
  days_back?: number;
}

interface ToastAuthResponse {
  token: { tokenType: string; accessToken: string; expiresIn: number };
  status: string;
}

async function getToastToken(
  clientId: string,
  clientSecret: string,
): Promise<string> {
  const authUrl = `${TOAST_BASE_URL}/authentication/v1/authentication/login`;
  const { response, attempts } = await fetchWithRetry(authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, clientSecret, userAccessType: 'TOAST_MACHINE_CLIENT' }),
  }, { maxAttempts: 3, baseDelayMs: 1000, maxDelayMs: 5000, timeoutMs: 30000 });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Toast auth failed: ${response.status} - ${errorText}`);
  }
  const authData: ToastAuthResponse = await response.json();
  console.log(`[Toast API] Authenticated after ${attempts} attempt(s), status: ${authData.status}`);
  return authData.token.accessToken;
}

function toToastBusinessDateParam(isoDate: string): string {
  return isoDate.replace(/-/g, '');
}

async function fetchOrdersPage(
  token: string,
  restaurantGuid: string,
  businessDate: string,
  page: number,
  logger: ReturnType<typeof createSyncLogger>
): Promise<{ orders: Record<string, unknown>[]; hasMore: boolean }> {
  const businessDateParam = toToastBusinessDateParam(businessDate);
  const url = `${TOAST_BASE_URL}/orders/v2/ordersBulk?businessDate=${businessDateParam}&pageSize=${PAGE_SIZE}&page=${page}`;
  const { response, attempts } = await fetchWithRetry(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Toast-Restaurant-External-ID': restaurantGuid,
      'Content-Type': 'application/json',
    },
  }, { maxAttempts: 3, baseDelayMs: 1000, maxDelayMs: 10000, timeoutMs: 60000 });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Toast orders fetch failed: ${response.status} - ${errorText}`);
  }
  const ordersData = await response.json();
  const rawOrders = Array.isArray(ordersData) ? ordersData : (ordersData?.orders ?? ordersData?.data);
  const orders = Array.isArray(rawOrders) ? rawOrders : [];
  const hasMore = orders.length >= PAGE_SIZE;
  logger.info(`Fetched page ${page} for ${businessDate}: ${orders.length} orders (after ${attempts} attempt(s))`);
  return { orders, hasMore };
}

function dateRangeDays(startDate: string, endDate: string): string[] {
  const start = new Date(startDate + 'T00:00:00.000Z');
  const end = new Date(endDate + 'T00:00:00.000Z');
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];
  const out: string[] = [];
  const current = new Date(start);
  while (current <= end && out.length < 31) {
    out.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return out;
}

/** Fetch all orders for a date range, returning raw individual orders with their business date. */
async function fetchAllRawOrders(
  token: string,
  restaurantGuid: string,
  startDate: string,
  endDate: string,
  logger: ReturnType<typeof createSyncLogger>
): Promise<{ orders: Record<string, unknown>[]; businessDate: string }[]> {
  const days = dateRangeDays(startDate, endDate);
  logger.info(`Fetching raw orders for ${days.length} days (${startDate} to ${endDate})`);
  const results: { orders: Record<string, unknown>[]; businessDate: string }[] = [];
  for (const businessDate of days) {
    let page = 1;
    const allOrders: Record<string, unknown>[] = [];
    let hasMore = true;
    while (hasMore) {
      const { orders, hasMore: more } = await fetchOrdersPage(token, restaurantGuid, businessDate, page, logger);
      allOrders.push(...orders);
      hasMore = more && orders.length >= PAGE_SIZE;
      if (hasMore) page++;
      else break;
    }
    if (allOrders.length > 0) {
      results.push({ orders: allOrders, businessDate });
    }
  }
  return results;
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = getCorsHeaders(req);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const TOAST_CLIENT_ID = Deno.env.get('TOAST_CLIENT_ID');
    const TOAST_CLIENT_SECRET = Deno.env.get('TOAST_CLIENT_SECRET');
    const TOAST_RESTAURANT_GUID = Deno.env.get('TOAST_RESTAURANT_GUID');

    if (!TOAST_CLIENT_ID || !TOAST_CLIENT_SECRET || !TOAST_RESTAURANT_GUID) {
      const errMsg = 'Toast API credentials not configured.';
      await logApiCall(supabase, {
        apiName: 'toast_sales', endpoint: '/authentication/v1/authentication/login',
        syncSuccess: false, durationMs: 0, recordsProcessed: 0, recordsInserted: 0,
        errorMessage: errMsg, triggeredBy: 'manual',
      });
      return new Response(JSON.stringify({ error: errMsg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const logger = createSyncLogger('toast_sales');
    const startTime = Date.now();
    const body = await req.json().catch(() => ({})) as SyncRequest;

    const today = new Date().toISOString().split('T')[0];
    const daysBack = body.days_back || 14;
    const endDate = body.end_date || today;
    const startDateDefault = new Date();
    startDateDefault.setDate(startDateDefault.getDate() - daysBack);
    const startDate = body.start_date || startDateDefault.toISOString().split('T')[0];

    logger.info(`Starting Toast sync from ${startDate} to ${endDate}`);
    const batchId = crypto.randomUUID();

    let token: string;
    try {
      token = await getToastToken(TOAST_CLIENT_ID, TOAST_CLIENT_SECRET);
    } catch (authError) {
      const details = authError instanceof Error ? authError.message : String(authError);
      logger.error('Toast authentication failed', authError);
      await logApiCall(supabase, {
        apiName: 'toast_sales', endpoint: '/authentication/v1/authentication/login',
        syncSuccess: false, durationMs: Date.now() - startTime, recordsProcessed: 0,
        recordsInserted: 0, responseStatus: 401, errorMessage: `Toast auth failed: ${details}`, triggeredBy: 'manual',
      });
      return new Response(JSON.stringify({ error: 'Toast authentication failed', details }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let dayResults: { orders: Record<string, unknown>[]; businessDate: string }[];
    try {
      dayResults = await fetchAllRawOrders(token, TOAST_RESTAURANT_GUID, startDate, endDate, logger);
    } catch (fetchError) {
      const details = fetchError instanceof Error ? fetchError.message : String(fetchError);
      logger.error('Toast fetch failed', fetchError);
      await logApiCall(supabase, {
        apiName: 'toast_sales', endpoint: '/orders/v2/ordersBulk',
        syncSuccess: false, durationMs: Date.now() - startTime, recordsProcessed: 0,
        recordsInserted: 0, responseStatus: 500, errorMessage: `Toast fetch failed: ${details}`, triggeredBy: 'manual',
      });
      return new Response(JSON.stringify({ error: 'Failed to fetch Toast sales data', details }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const totalOrders = dayResults.reduce((sum, d) => sum + d.orders.length, 0);
    logger.info(`Fetched ${totalOrders} total orders across ${dayResults.length} days`);

    const syncedDates: string[] = [];
    let failedCount = 0;
    let totalInserted = 0;

    for (const { orders, businessDate } of dayResults) {
      try {
        // Batch upsert individual orders
        for (let i = 0; i < orders.length; i += BATCH_UPSERT_SIZE) {
          const batch = orders.slice(i, i + BATCH_UPSERT_SIZE);

          const stagingRows = batch.map((order) => ({
            order_guid: String(order.guid ?? crypto.randomUUID()),
            business_date: businessDate,
            net_sales: Number(order.netAmount ?? 0) || 0,
            gross_sales: Number(order.totalAmount ?? order.amount ?? 0) || 0,
            cafe_sales: Number(order.netAmount ?? order.totalAmount ?? 0) || 0,
            raw_data: order,
            sync_batch_id: batchId,
          }));

          const { error: stagingErr } = await (supabase.from('toast_staging') as any).upsert(stagingRows, { onConflict: 'order_guid' });
          if (stagingErr) { logger.error(`Staging error ${businessDate}`, stagingErr); throw stagingErr; }

          const salesRows = batch.map((order) => ({
            order_guid: String(order.guid ?? crypto.randomUUID()),
            business_date: businessDate,
            net_sales: Number(order.netAmount ?? 0) || 0,
            gross_sales: Number(order.totalAmount ?? order.amount ?? 0) || 0,
            cafe_sales: Number(order.netAmount ?? order.totalAmount ?? 0) || 0,
            order_count: 1,
            raw_data: order,
            sync_batch_id: batchId,
          }));

          const { error: salesErr } = await (supabase.from('toast_sales') as any).upsert(salesRows, { onConflict: 'order_guid' });
          if (salesErr) { logger.error(`Sales error ${businessDate}`, salesErr); throw salesErr; }

          totalInserted += batch.length;
        }
        syncedDates.push(businessDate);
      } catch (error) {
        logger.error(`Error syncing ${businessDate}`, error);
        failedCount++;
      }
    }

    const durationMs = Date.now() - startTime;
    await logSyncMetrics(supabase, {
      syncType: 'toast_sales', startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(), durationMs, recordsFetched: totalOrders,
      recordsSynced: totalInserted, recordsFailed: failedCount, retryCount: 0,
    });

    await supabase.from('api_sync_status').upsert({
      api_name: 'toast_sales', last_sync_at: new Date().toISOString(),
      last_sync_success: failedCount === 0, last_records_processed: totalOrders,
      last_records_inserted: totalInserted,
    }, { onConflict: 'api_name' });

    logger.info(`Sync completed: ${totalInserted} orders synced across ${syncedDates.length} days, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        success: true, syncedDates, totalFetched: totalOrders,
        syncedCount: totalInserted, failedCount, dateRange: { startDate, endDate }, batchId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const logger = createSyncLogger('toast_sales');
    logger.error('Sync failed', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

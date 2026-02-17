import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { fetchWithRetry } from '../_shared/retry.ts';
import { createSyncLogger, logSyncMetrics } from '../_shared/logger.ts';
import { logApiCall } from '../_shared/apiLogger.ts';
import { mapOrderToStagingRow, mapOrderToSalesRow } from '../_shared/toastOrderMapping.ts';

const TOAST_BASE_URL = 'https://ws-api.toasttab.com';
const PAGE_SIZE = 100;
const BATCH_UPSERT_SIZE = 100;
const TIME_BUDGET_MS = 50_000; // 50s budget, 10s buffer before 60s limit

interface SyncRequest {
  action?: string;
  start_date?: string;
  end_date?: string;
}

interface ToastAuthResponse {
  token: { tokenType: string; accessToken: string; expiresIn: number };
  status: string;
}

async function getToastToken(clientId: string, clientSecret: string): Promise<string> {
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

/** Get the max page_number already staged for a given business_date. Returns 0 if none. */
// deno-lint-ignore no-explicit-any
async function getResumePageForDate(supabase: any, businessDate: string): Promise<number> {
  const { data, error } = await supabase
    .from('toast_staging')
    .select('page_number')
    .eq('business_date', businessDate)
    .not('page_number', 'is', null)
    .order('page_number', { ascending: false })
    .limit(1);
  if (error || !data || data.length === 0) return 0;
  return data[0].page_number as number;
}

/** Promote all staged rows for a business_date to toast_sales, then clear staging for that date. */
// deno-lint-ignore no-explicit-any
async function promoteAndClearDate(supabase: any, businessDate: string, logger: ReturnType<typeof createSyncLogger>): Promise<number> {
  // Read staged rows in batches
  let promoted = 0;
  let from = 0;
  const batchSize = 500;
  while (true) {
    const { data: rows, error } = await supabase
      .from('toast_staging')
      .select('order_guid, business_date, net_sales, gross_sales, cafe_sales, order_count, raw_data, sync_batch_id')
      .eq('business_date', businessDate)
      .range(from, from + batchSize - 1);
    if (error) { logger.error(`Promote read error for ${businessDate}`, error); throw error; }
    if (!rows || rows.length === 0) break;

    const { error: upsertErr } = await supabase
      .from('toast_sales')
      .upsert(rows, { onConflict: 'order_guid' });
    if (upsertErr) { logger.error(`Promote upsert error for ${businessDate}`, upsertErr); throw upsertErr; }

    promoted += rows.length;
    if (rows.length < batchSize) break;
    from += batchSize;
  }

  // Clear staging for this date
  const { error: delErr } = await supabase
    .from('toast_staging')
    .delete()
    .eq('business_date', businessDate);
  if (delErr) logger.warn(`Staging cleanup warning for ${businessDate}: ${delErr.message}`);

  logger.info(`Promoted ${promoted} orders for ${businessDate} to toast_sales and cleared staging`);
  return promoted;
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

    // Default to yesterday only
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const defaultDate = yesterday.toISOString().split('T')[0];
    const startDate = body.start_date || defaultDate;
    const endDate = body.end_date || defaultDate;

    // Build date list
    const days: string[] = [];
    const startD = new Date(startDate + 'T00:00:00.000Z');
    const endD = new Date(endDate + 'T00:00:00.000Z');
    if (!isNaN(startD.getTime()) && !isNaN(endD.getTime()) && startD <= endD) {
      const cur = new Date(startD);
      while (cur <= endD && days.length < 31) {
        days.push(cur.toISOString().slice(0, 10));
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
    }

    logger.info(`Starting Toast sync for ${days.length} day(s): ${startDate} to ${endDate}`);
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

    const syncedDates: string[] = [];
    const partialDates: string[] = [];
    let failedCount = 0;
    let totalFetched = 0;
    let totalPromoted = 0;
    let timeBudgetExceeded = false;

    for (const businessDate of days) {
      if (timeBudgetExceeded) break;

      try {
        // Check resume point: which pages are already staged for this date?
        const maxStagedPage = await getResumePageForDate(supabase, businessDate);
        let page = maxStagedPage > 0 ? maxStagedPage + 1 : 1;
        let hasMore = true;
        let dayFetched = 0;

        while (hasMore) {
          // Time budget guard
          if (Date.now() - startTime > TIME_BUDGET_MS) {
            logger.warn(`Time budget exceeded after page ${page} of ${businessDate}, will resume next invocation`);
            timeBudgetExceeded = true;
            partialDates.push(businessDate);
            break;
          }

          const { orders, hasMore: more } = await fetchOrdersPage(token, TOAST_RESTAURANT_GUID, businessDate, page, logger);

          // Stage immediately
          if (orders.length > 0) {
            for (let i = 0; i < orders.length; i += BATCH_UPSERT_SIZE) {
              const batch = orders.slice(i, i + BATCH_UPSERT_SIZE);
              const stagingRows = batch.map((order) => mapOrderToStagingRow(order, businessDate, batchId, page));
              const { error: stagingErr } = await (supabase.from('toast_staging') as any).upsert(stagingRows, { onConflict: 'order_guid' });
              if (stagingErr) { logger.error(`Staging error ${businessDate} p${page}`, stagingErr); throw stagingErr; }
            }
            dayFetched += orders.length;
          }

          hasMore = more && orders.length >= PAGE_SIZE;
          if (hasMore) page++;
          else break;
        }

        totalFetched += dayFetched;

        // Only promote if all pages are fetched (not interrupted by time budget)
        if (!timeBudgetExceeded || !partialDates.includes(businessDate)) {
          const promoted = await promoteAndClearDate(supabase, businessDate, logger);
          totalPromoted += promoted;
          syncedDates.push(businessDate);
        }
      } catch (error) {
        logger.error(`Error syncing ${businessDate}`, error);
        failedCount++;
      }
    }

    const durationMs = Date.now() - startTime;
    await logSyncMetrics(supabase, {
      syncType: 'toast_sales', startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(), durationMs, recordsFetched: totalFetched,
      recordsSynced: totalPromoted, recordsFailed: failedCount, retryCount: 0,
    });

    await supabase.from('api_sync_status').upsert({
      api_name: 'toast_sales', last_sync_at: new Date().toISOString(),
      last_sync_success: failedCount === 0 && !timeBudgetExceeded,
      last_records_processed: totalFetched,
      last_records_inserted: totalPromoted,
    }, { onConflict: 'api_name' });

    logger.info(`Sync completed: ${totalPromoted} promoted, ${syncedDates.length} days done, ${partialDates.length} partial, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        partial: timeBudgetExceeded,
        syncedDates,
        partialDates,
        totalFetched,
        syncedCount: totalPromoted,
        failedCount,
        dateRange: { startDate, endDate },
        batchId,
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

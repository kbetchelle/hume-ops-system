/**
 * Toast API backfill: state-based cron (one day per call) or date-range manual run.
 * - With body.start_date + body.end_date: sync that range (max 31 days), do not update state.
 * - Without date range: use toast_backfill_state cursor (one day per call), update state.
 * Writes to toast_staging then toast_sales.
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { fetchWithRetry, withRetry, isRetryableSupabaseError } from '../_shared/retry.ts';
import { createSyncLogger } from '../_shared/logger.ts';

const TOAST_BASE_URL = 'https://ws-api.toasttab.com';
const BACKFILL_START_DATE = '2024-08-01'; // Through 08/01/24
const PAGE_SIZE = 100;

interface ToastAuthResponse {
  token: { tokenType: string; accessToken: string; expiresIn: number };
  status: string;
}

interface ToastBackfillState {
  id: string;
  cursor_date: string;
  cursor_page: number;
  status: string;
  last_error: string | null;
  last_synced_at: string | null;
  total_days_synced: number;
  total_records_synced: number;
}

interface ToastSalesData {
  businessDate: string;
  netSales: number;
  grossSales: number;
  cafeSales: number;
  totalOrders: number;
  [key: string]: unknown;
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
  return authData.token.accessToken;
}

/** Format YYYY-MM-DD as Toast businessDate (yyyymmdd). Toast filters by restaurant business day in local time when using businessDate. */
function toToastBusinessDate(isoDate: string): string {
  return isoDate.replace(/-/g, '');
}

/** Fetch one page of orders for a single business date. Uses businessDate (yyyymmdd) so Toast returns orders opened that business day in restaurant local time; startDate/endDate filter by modification time and often return 0. */
async function fetchOrdersPage(
  token: string,
  restaurantGuid: string,
  businessDate: string,
  page: number,
  logger: ReturnType<typeof createSyncLogger>
): Promise<{ orders: Record<string, unknown>[]; hasMore: boolean }> {
  const businessDateParam = toToastBusinessDate(businessDate);
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
  const rawOrders = Array.isArray(ordersData) ? ordersData : ordersData?.orders;
  const orders = Array.isArray(rawOrders) ? rawOrders : [];
  const hasMore = orders.length >= PAGE_SIZE;
  logger.info(`Fetched page ${page} for ${businessDate}: ${orders.length} orders`);
  return { orders, hasMore };
}

/** Aggregate orders into one row per business_date (toast_staging format). */
function aggregateOrdersByDate(orders: Record<string, unknown>[], businessDate: string): ToastSalesData | null {
  if (orders.length === 0) return null;
  let netSales = 0, grossSales = 0, cafeSales = 0;
  for (const order of orders) {
    const orderTotal = Number(order.totalAmount ?? order.amount ?? 0) || 0;
    const orderNet = order.netAmount != null ? Number(order.netAmount) : orderTotal;
    netSales += orderNet;
    grossSales += orderTotal;
    cafeSales += orderNet;
  }
  return {
    businessDate,
    netSales,
    grossSales,
    cafeSales,
    totalOrders: orders.length,
  };
}

const MAX_DAYS_PER_RUN = 31;

function parseDateRange(startDate: string, endDate: string): string[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];
  const dates: string[] = [];
  const current = new Date(start);
  while (current <= end && dates.length < MAX_DAYS_PER_RUN) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = getCorsHeaders(req);

  const logger = createSyncLogger('toast_backfill');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const TOAST_CLIENT_ID = Deno.env.get('TOAST_CLIENT_ID');
    const TOAST_CLIENT_SECRET = Deno.env.get('TOAST_CLIENT_SECRET');
    const TOAST_RESTAURANT_GUID = Deno.env.get('TOAST_RESTAURANT_GUID');

    if (!TOAST_CLIENT_ID || !TOAST_CLIENT_SECRET || !TOAST_RESTAURANT_GUID) {
      return new Response(
        JSON.stringify({ error: 'Toast API credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json().catch(() => ({})) as { start_date?: string; end_date?: string };
    const dateRange = body.start_date && body.end_date
      ? parseDateRange(body.start_date, body.end_date)
      : null;

    // Mode 1: Date range provided (manual backfill from UI) — process each day in range, do not touch state
    if (dateRange && dateRange.length > 0) {
      let token: string;
      try {
        token = await getToastToken(TOAST_CLIENT_ID, TOAST_CLIENT_SECRET);
      } catch (authError) {
        const errMsg = authError instanceof Error ? authError.message : String(authError);
        return new Response(
          JSON.stringify({ error: 'Toast authentication failed', details: errMsg }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let totalOrdersThisRun = 0;
      const datesProcessed: string[] = [];

      for (const businessDate of dateRange) {
        const batchId = crypto.randomUUID();
        let currentPage = 1;
        const allOrdersForDay: Record<string, unknown>[] = [];
        let hasMore = true;
        while (hasMore) {
          const { orders, hasMore: more } = await fetchOrdersPage(token, TOAST_RESTAURANT_GUID, businessDate, currentPage, logger);
          allOrdersForDay.push(...orders);
          hasMore = more && orders.length >= PAGE_SIZE;
          if (hasMore) currentPage++;
          else break;
        }

        if (allOrdersForDay.length > 0) {
          const aggregated = aggregateOrdersByDate(allOrdersForDay, businessDate);
          if (aggregated) {
            const stagingResult = await withRetry(
              async () => {
                const { error } = await supabase.from('toast_staging').upsert({
                  business_date: aggregated.businessDate,
                  net_sales: aggregated.netSales,
                  gross_sales: aggregated.grossSales,
                  cafe_sales: aggregated.cafeSales,
                  order_count: aggregated.totalOrders,
                  raw_data: aggregated,
                  sync_batch_id: batchId,
                }, { onConflict: 'business_date,sync_batch_id' });
                if (error && !isRetryableSupabaseError(error)) throw error;
                return { error };
              },
              { maxAttempts: 2 },
              `toast_staging ${businessDate}`
            );
            if (stagingResult.result.error) throw stagingResult.result.error;

            const targetResult = await withRetry(
              async () => {
                const { error } = await supabase.from('toast_sales').upsert({
                  business_date: aggregated.businessDate,
                  net_sales: aggregated.netSales,
                  gross_sales: aggregated.grossSales,
                  cafe_sales: aggregated.cafeSales,
                  raw_data: aggregated,
                  sync_batch_id: batchId,
                }, { onConflict: 'business_date' });
                if (error && !isRetryableSupabaseError(error)) throw error;
                return { error };
              },
              { maxAttempts: 2 },
              `toast_sales ${businessDate}`
            );
            if (targetResult.result.error) throw targetResult.result.error;

            totalOrdersThisRun += allOrdersForDay.length;
            datesProcessed.push(businessDate);
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          ordersThisRun: totalOrdersThisRun,
          daysSyncedThisRun: datesProcessed.length,
          datesProcessed,
          start_date: body.start_date,
          end_date: body.end_date,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mode 2: No date range — use state (cron / one-day-at-a-time)
    const { data: stateRow, error: stateError } = await supabase
      .from('toast_backfill_state')
      .select('*')
      .eq('id', 'toast_backfill')
      .single();

    if (stateError || !stateRow) {
      logger.error('Failed to load toast_backfill_state', stateError);
      return new Response(
        JSON.stringify({ error: 'Backfill state not found. Run migration 20260206120000_toast_backfill_state_and_cron.sql.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const state = stateRow as ToastBackfillState;
    if (state.status === 'completed') {
      return new Response(
        JSON.stringify({ success: true, completed: true, message: 'Backfill already completed through 08/01/24' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cursorDate = state.cursor_date;
    const cursorPage = state.cursor_page;
    const today = new Date().toISOString().split('T')[0];
    if (cursorDate > today) {
      await supabase.from('toast_backfill_state').update({
        status: 'completed',
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', 'toast_backfill');
      return new Response(
        JSON.stringify({ success: true, completed: true, message: 'Backfill finished through 08/01/24' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let token: string;
    try {
      token = await getToastToken(TOAST_CLIENT_ID, TOAST_CLIENT_SECRET);
    } catch (authError) {
      const errMsg = authError instanceof Error ? authError.message : String(authError);
      await supabase.from('toast_backfill_state').update({
        last_error: `Auth failed: ${errMsg}`,
        updated_at: new Date().toISOString(),
      }).eq('id', 'toast_backfill');
      return new Response(
        JSON.stringify({ error: 'Toast authentication failed', details: errMsg }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const batchId = crypto.randomUUID();
    let currentDate = cursorDate;
    let currentPage = cursorPage;
    const allOrdersForDay: Record<string, unknown>[] = [];

    try {
      let hasMore = true;
      while (hasMore) {
        const { orders, hasMore: more } = await fetchOrdersPage(token, TOAST_RESTAURANT_GUID, currentDate, currentPage, logger);
        allOrdersForDay.push(...orders);
        hasMore = more && orders.length >= PAGE_SIZE;
        if (hasMore) currentPage++;
        else break;
      }

      let totalOrdersThisRun = 0;
      let daysSyncedThisRun = 0;

      if (allOrdersForDay.length > 0) {
        const aggregated = aggregateOrdersByDate(allOrdersForDay, currentDate);
        if (aggregated) {
          const stagingResult = await withRetry(
            async () => {
              const { error } = await supabase.from('toast_staging').upsert({
                business_date: aggregated.businessDate,
                net_sales: aggregated.netSales,
                gross_sales: aggregated.grossSales,
                cafe_sales: aggregated.cafeSales,
                order_count: aggregated.totalOrders,
                raw_data: aggregated,
                sync_batch_id: batchId,
              }, { onConflict: 'business_date,sync_batch_id' });
              if (error && !isRetryableSupabaseError(error)) throw error;
              return { error };
            },
            { maxAttempts: 2 },
            `toast_staging ${currentDate}`
          );
          if (stagingResult.result.error) throw stagingResult.result.error;

          const targetResult = await withRetry(
            async () => {
              const { error } = await supabase.from('toast_sales').upsert({
                business_date: aggregated.businessDate,
                net_sales: aggregated.netSales,
                gross_sales: aggregated.grossSales,
                cafe_sales: aggregated.cafeSales,
                raw_data: aggregated,
                sync_batch_id: batchId,
              }, { onConflict: 'business_date' });
              if (error && !isRetryableSupabaseError(error)) throw error;
              return { error };
            },
            { maxAttempts: 2 },
            `toast_sales ${currentDate}`
          );
          if (targetResult.result.error) throw targetResult.result.error;

          totalOrdersThisRun = allOrdersForDay.length;
          daysSyncedThisRun = 1;
        }
      }

      const nextDateObj = new Date(currentDate);
      nextDateObj.setDate(nextDateObj.getDate() + 1);
      const nextDate = nextDateObj.toISOString().split('T')[0];

      await supabase.from('toast_backfill_state').update({
        cursor_date: nextDate,
        cursor_page: 1,
        status: nextDate > today ? 'completed' : 'running',
        last_error: null,
        last_synced_at: new Date().toISOString(),
        total_days_synced: state.total_days_synced + daysSyncedThisRun,
        total_records_synced: state.total_records_synced + totalOrdersThisRun,
        updated_at: new Date().toISOString(),
      }).eq('id', 'toast_backfill');

      return new Response(
        JSON.stringify({
          success: true,
          completed: nextDate > today,
          cursor_date: nextDate,
          cursor_page: 1,
          ordersThisRun: totalOrdersThisRun,
          daysSyncedThisRun,
          total_days_synced: state.total_days_synced + daysSyncedThisRun,
          total_records_synced: state.total_records_synced + totalOrdersThisRun,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error('Backfill error', err);
      await supabase.from('toast_backfill_state').update({
        last_error: errMsg,
        status: 'running',
        updated_at: new Date().toISOString(),
      }).eq('id', 'toast_backfill');
      return new Response(
        JSON.stringify({
          success: false,
          error: errMsg,
          resume_from: { cursor_date: currentDate, cursor_page: currentPage },
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    logger.error('Backfill failed', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Toast API backfill: state-based cron (one day per call) or date-range manual run.
 * - With body.start_date + body.end_date: sync that range (max 31 days), do not update state.
 * - Without date range: use toast_backfill_state cursor (one day per call), update state.
 * Writes individual raw orders to toast_staging then toast_sales (no aggregation).
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { fetchWithRetry, withRetry, isRetryableSupabaseError } from '../_shared/retry.ts';
import { createSyncLogger } from '../_shared/logger.ts';

const TOAST_BASE_URL = 'https://ws-api.toasttab.com';
const BACKFILL_START_DATE = '2024-08-01';
const PAGE_SIZE = 300;
const MAX_DAYS_PER_CRON_RUN = 5;
const DELAY_BETWEEN_DAYS_MS = 2000;
const BATCH_UPSERT_SIZE = 100;

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

function toToastBusinessDate(isoDate: string): string {
  return isoDate.replace(/-/g, '');
}

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
  const rawOrders = Array.isArray(ordersData)
    ? ordersData
    : (ordersData?.orders ?? ordersData?.data);
  const orders = Array.isArray(rawOrders) ? rawOrders : [];
  const hasMore = orders.length >= PAGE_SIZE;
  logger.info(`Fetched page ${page} for ${businessDate}: ${orders.length} orders`);
  return { orders, hasMore };
}

/** Upsert individual orders in batches to staging and sales tables. */
async function upsertRawOrders(
  supabase: ReturnType<typeof createClient>,
  orders: Record<string, unknown>[],
  businessDate: string,
  batchId: string,
  logger: ReturnType<typeof createSyncLogger>
): Promise<number> {
  let upsertedCount = 0;

  for (let i = 0; i < orders.length; i += BATCH_UPSERT_SIZE) {
    const batch = orders.slice(i, i + BATCH_UPSERT_SIZE);

    const stagingRows = batch.map((order) => ({
      order_guid: String(order.guid ?? order.entityType ?? crypto.randomUUID()),
      business_date: businessDate,
      net_sales: Number(order.netAmount ?? 0) || 0,
      gross_sales: Number(order.totalAmount ?? order.amount ?? 0) || 0,
      cafe_sales: Number(order.netAmount ?? order.totalAmount ?? 0) || 0,
      raw_data: order,
      sync_batch_id: batchId,
    }));

    const { error: stagingErr } = await (supabase.from('toast_staging') as any).upsert(
      stagingRows,
      { onConflict: 'order_guid' }
    );
    if (stagingErr) {
      logger.error(`Staging batch error for ${businessDate}`, stagingErr);
      throw stagingErr;
    }

    const salesRows = batch.map((order) => ({
      order_guid: String(order.guid ?? order.entityType ?? crypto.randomUUID()),
      business_date: businessDate,
      net_sales: Number(order.netAmount ?? 0) || 0,
      gross_sales: Number(order.totalAmount ?? order.amount ?? 0) || 0,
      cafe_sales: Number(order.netAmount ?? order.totalAmount ?? 0) || 0,
      order_count: 1,
      raw_data: order,
      sync_batch_id: batchId,
    }));

    const { error: salesErr } = await (supabase.from('toast_sales') as any).upsert(
      salesRows,
      { onConflict: 'order_guid' }
    );
    if (salesErr) {
      logger.error(`Sales batch error for ${businessDate}`, salesErr);
      throw salesErr;
    }

    upsertedCount += batch.length;
  }

  return upsertedCount;
}

const MAX_DAYS_PER_RUN = 31;

function parseDateRange(startDate: string, endDate: string): string[] {
  const start = new Date(startDate + 'T00:00:00.000Z');
  const end = new Date(endDate + 'T00:00:00.000Z');
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];
  const dates: string[] = [];
  const current = new Date(start);
  while (current <= end && dates.length < MAX_DAYS_PER_RUN) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
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

    // Mode 1: Date range provided (manual backfill from UI)
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
          const count = await upsertRawOrders(supabase, allOrdersForDay, businessDate, batchId, logger);
          totalOrdersThisRun += count;
          datesProcessed.push(businessDate);
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
        JSON.stringify({ error: 'Backfill state not found.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const state = stateRow as ToastBackfillState;
    if (state.status === 'completed') {
      return new Response(
        JSON.stringify({ success: true, completed: true, message: 'Backfill already completed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cursorDate = state.cursor_date;
    const today = new Date().toISOString().split('T')[0];
    if (cursorDate > today) {
      await supabase.from('toast_backfill_state').update({
        status: 'completed',
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', 'toast_backfill');
      return new Response(
        JSON.stringify({ success: true, completed: true, message: 'Backfill finished' }),
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

    let currentDate = cursorDate;
    let totalOrdersThisRun = 0;
    let daysSyncedThisRun = 0;
    let daysProcessed = 0;

    try {
      while (currentDate <= today && daysProcessed < MAX_DAYS_PER_CRON_RUN) {
        const batchId = crypto.randomUUID();
        const allOrdersForDay: Record<string, unknown>[] = [];
        let hasMore = true;
        let page = 1;

        while (hasMore) {
          const { orders, hasMore: more } = await fetchOrdersPage(token, TOAST_RESTAURANT_GUID, currentDate, page, logger);
          allOrdersForDay.push(...orders);
          hasMore = more && orders.length >= PAGE_SIZE;
          if (hasMore) page++;
          else break;
        }

        if (allOrdersForDay.length > 0) {
          const count = await upsertRawOrders(supabase, allOrdersForDay, currentDate, batchId, logger);
          totalOrdersThisRun += count;
          daysSyncedThisRun += 1;
        }

        const [y, m, d] = currentDate.split('-').map(Number);
        const nextDate = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
        currentDate = nextDate;
        daysProcessed += 1;

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

        if (nextDate > today) break;
        if (daysProcessed < MAX_DAYS_PER_CRON_RUN) {
          await new Promise((r) => setTimeout(r, DELAY_BETWEEN_DAYS_MS));
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          completed: currentDate > today,
          cursor_date: currentDate,
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
        JSON.stringify({ success: false, error: errMsg }),
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

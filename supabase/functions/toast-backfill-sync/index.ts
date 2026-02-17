/**
 * Toast API backfill: state-based cron (days per call) or date-range manual run.
 * Uses page-level cursor in toast_staging to resume mid-day on timeout.
 * Pipeline: fetch page -> stage immediately -> (all pages done) -> promote -> clear staging.
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { fetchWithRetry } from '../_shared/retry.ts';
import { createSyncLogger } from '../_shared/logger.ts';
import { mapOrderToStagingRow, validateStagingRow } from '../_shared/toastOrderMapping.ts';

const TOAST_BASE_URL = 'https://ws-api.toasttab.com';
const BACKFILL_START_DATE = '2024-08-01';
const PAGE_SIZE = 100;
const MAX_DAYS_PER_CRON_RUN = 5;
const DELAY_BETWEEN_DAYS_MS = 2000;
const BATCH_UPSERT_SIZE = 100;
const TIME_BUDGET_MS = 50_000; // 50s budget, 10s buffer

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

/** Promote all staged rows for a business_date to toast_sales (with validation), then clear staging. */
// deno-lint-ignore no-explicit-any
async function promoteAndClearDate(supabase: any, businessDate: string, logger: ReturnType<typeof createSyncLogger>): Promise<number> {
  let promoted = 0;
  let skipped = 0;
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

    const validRows: typeof rows = [];
    for (const row of rows) {
      const check = validateStagingRow(row);
      if (check.valid) {
        validRows.push(row);
      } else {
        skipped++;
        logger.warn(`Skipping invalid staging row ${row.order_guid ?? 'unknown'}: ${check.reason}`);
      }
    }

    if (validRows.length > 0) {
      const { error: upsertErr } = await supabase
        .from('toast_sales')
        .upsert(validRows, { onConflict: 'order_guid' });
      if (upsertErr) { logger.error(`Promote upsert error for ${businessDate}`, upsertErr); throw upsertErr; }
      promoted += validRows.length;
    }

    if (rows.length < batchSize) break;
    from += batchSize;
  }

  const { error: delErr } = await supabase
    .from('toast_staging')
    .delete()
    .eq('business_date', businessDate);
  if (delErr) logger.warn(`Staging cleanup warning for ${businessDate}: ${delErr.message}`);

  logger.info(`Promoted ${promoted} orders for ${businessDate} (${skipped} skipped) and cleared staging`);
  return promoted;
}

/**
 * Fetch-and-stage all pages for a single day, resuming from the last staged page.
 * Returns { complete, fetched, partial } where partial=true means time budget was exceeded.
 */
// deno-lint-ignore no-explicit-any
async function fetchAndStageDay(
  supabase: any,
  token: string,
  restaurantGuid: string,
  businessDate: string,
  batchId: string,
  startTime: number,
  logger: ReturnType<typeof createSyncLogger>
): Promise<{ complete: boolean; fetched: number; partial: boolean }> {
  const maxStagedPage = await getResumePageForDate(supabase, businessDate);
  const startingFresh = maxStagedPage === 0;
  let page = startingFresh ? 1 : maxStagedPage + 1;

  // Clear staging for this date only if starting fresh (not resuming)
  if (startingFresh) {
    const { error: clearErr } = await supabase
      .from('toast_staging')
      .delete()
      .eq('business_date', businessDate);
    if (clearErr) logger.warn(`Failed to clear staging for ${businessDate}: ${clearErr.message}`);
  }

  let hasMore = true;
  let fetched = 0;

  while (hasMore) {
    // Time budget guard
    if (Date.now() - startTime > TIME_BUDGET_MS) {
      logger.warn(`Time budget exceeded at page ${page} of ${businessDate}, will resume next invocation`);
      return { complete: false, fetched, partial: true };
    }

    const { orders, hasMore: more } = await fetchOrdersPage(token, restaurantGuid, businessDate, page, logger);

    if (orders.length > 0) {
      for (let i = 0; i < orders.length; i += BATCH_UPSERT_SIZE) {
        const batch = orders.slice(i, i + BATCH_UPSERT_SIZE);
        const stagingRows = batch.map((order) => mapOrderToStagingRow(order, businessDate, batchId, page));
        const { error: stagingErr } = await (supabase.from('toast_staging') as any).upsert(stagingRows, { onConflict: 'order_guid' });
        if (stagingErr) { logger.error(`Staging error ${businessDate} p${page}`, stagingErr); throw stagingErr; }
      }
      fetched += orders.length;
    }

    hasMore = more && orders.length >= PAGE_SIZE;
    if (hasMore) page++;
    else break;
  }

  return { complete: true, fetched, partial: false };
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

function nextDay(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = getCorsHeaders(req);

  const logger = createSyncLogger('toast_backfill');
  const startTime = Date.now();

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

    // ── Mode 1: Date range provided (manual backfill from UI) ──
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

      let totalOrders = 0;
      let totalPromoted = 0;
      const datesProcessed: string[] = [];
      const partialDates: string[] = [];
      let timeBudgetExceeded = false;

      for (const businessDate of dateRange) {
        if (timeBudgetExceeded) break;

        const batchId = crypto.randomUUID();
        const result = await fetchAndStageDay(supabase, token, TOAST_RESTAURANT_GUID, businessDate, batchId, startTime, logger);
        totalOrders += result.fetched;

        if (result.complete) {
          const promoted = await promoteAndClearDate(supabase, businessDate, logger);
          totalPromoted += promoted;
          datesProcessed.push(businessDate);
        } else {
          timeBudgetExceeded = true;
          partialDates.push(businessDate);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          partial: timeBudgetExceeded,
          ordersThisRun: totalOrders,
          promotedThisRun: totalPromoted,
          daysSyncedThisRun: datesProcessed.length,
          datesProcessed,
          partialDates,
          start_date: body.start_date,
          end_date: body.end_date,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Mode 2: No date range — use state (cron / cursor-based) ──
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

    const today = new Date().toISOString().split('T')[0];
    if (state.cursor_date > today) {
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

    let currentDate = state.cursor_date;
    let totalOrdersThisRun = 0;
    let totalPromotedThisRun = 0;
    let daysSyncedThisRun = 0;
    let daysProcessed = 0;
    let timeBudgetExceeded = false;

    try {
      while (currentDate <= today && daysProcessed < MAX_DAYS_PER_CRON_RUN && !timeBudgetExceeded) {
        const batchId = crypto.randomUUID();
        const result = await fetchAndStageDay(supabase, token, TOAST_RESTAURANT_GUID, currentDate, batchId, startTime, logger);
        totalOrdersThisRun += result.fetched;

        if (result.complete) {
          // All pages for this day are staged — promote and advance cursor
          const promoted = await promoteAndClearDate(supabase, currentDate, logger);
          totalPromotedThisRun += promoted;
          daysSyncedThisRun += 1;

          const nd = nextDay(currentDate);
          currentDate = nd;
          daysProcessed += 1;

          await supabase.from('toast_backfill_state').update({
            cursor_date: nd,
            cursor_page: 1,
            status: nd > today ? 'completed' : 'running',
            last_error: null,
            last_synced_at: new Date().toISOString(),
            total_days_synced: state.total_days_synced + daysSyncedThisRun,
            total_records_synced: state.total_records_synced + totalOrdersThisRun,
            updated_at: new Date().toISOString(),
          }).eq('id', 'toast_backfill');

          if (nd > today) break;
          if (daysProcessed < MAX_DAYS_PER_CRON_RUN) {
            await new Promise((r) => setTimeout(r, DELAY_BETWEEN_DAYS_MS));
          }
        } else {
          // Partial day — time budget exceeded. Save cursor_page for resume.
          timeBudgetExceeded = true;
          const maxPage = await getResumePageForDate(supabase, currentDate);
          await supabase.from('toast_backfill_state').update({
            cursor_date: currentDate,
            cursor_page: maxPage + 1,
            status: 'running',
            last_error: null,
            last_synced_at: new Date().toISOString(),
            total_records_synced: state.total_records_synced + totalOrdersThisRun,
            updated_at: new Date().toISOString(),
          }).eq('id', 'toast_backfill');
          logger.warn(`Partial day ${currentDate} — will resume from page ${maxPage + 1} next run`);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          partial: timeBudgetExceeded,
          completed: currentDate > today && !timeBudgetExceeded,
          cursor_date: currentDate,
          ordersThisRun: totalOrdersThisRun,
          promotedThisRun: totalPromotedThisRun,
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

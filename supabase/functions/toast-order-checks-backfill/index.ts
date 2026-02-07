/**
 * Toast order checks backfill: state-based cron (one day per call) or date-range manual run.
 * - With body.start_date + body.end_date: sync that range (max 31 days), write to order_checks_staging only; do not update state.
 * - Without date range: use order_checks_backfill_state cursor (one day per call), update state.
 * Writes only to order_checks_staging. Use sync-from-staging with api: "order_checks" to transfer to order_checks.
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { fetchWithRetry, withRetry, isRetryableSupabaseError } from '../_shared/retry.ts';
import { createSyncLogger } from '../_shared/logger.ts';

const TOAST_BASE_URL = 'https://ws-api.toasttab.com';
const PAGE_SIZE = 100;
const MAX_DAYS_PER_RUN = 31;
const STAGING_BATCH_SIZE = 100;

interface ToastAuthResponse {
  token: { tokenType: string; accessToken: string; expiresIn: number };
  status: string;
}

interface OrderChecksBackfillState {
  id: string;
  cursor_date: string;
  cursor_page: number;
  status: string;
  last_error: string | null;
  last_synced_at: string | null;
  total_checks_synced: number;
}

interface OrderCheckRow {
  check_guid: string;
  order_guid: string;
  business_date: string;
  amount: number | null;
  tax_amount: number | null;
  total_amount: number | null;
  payment_status: string | null;
  paid_date: string | null;
  closed_date: string | null;
  voided: boolean;
  void_date: string | null;
  raw_data: Record<string, unknown> | null;
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

/** Flatten orders into one row per check. businessDate is ISO YYYY-MM-DD. */
function flattenOrdersToChecks(orders: Record<string, unknown>[], businessDate: string): OrderCheckRow[] {
  const rows: OrderCheckRow[] = [];
  for (const order of orders) {
    const orderGuid = typeof order.guid === 'string' ? order.guid : '';
    if (!orderGuid) continue;
    const checks = order.checks;
    if (!Array.isArray(checks) || checks.length === 0) continue;
    for (const check of checks as Record<string, unknown>[]) {
      const checkGuid = typeof check.guid === 'string' ? check.guid : null;
      if (!checkGuid) continue;
      const amount = check.amount != null ? Number(check.amount) : null;
      const taxAmount = check.taxAmount != null ? Number(check.taxAmount) : null;
      const totalAmount = check.totalAmount != null ? Number(check.totalAmount) : null;
      const paymentStatus = typeof check.paymentStatus === 'string' ? check.paymentStatus : null;
      const paidDate = typeof check.paidDate === 'string' ? check.paidDate : null;
      const closedDate = typeof check.closedDate === 'string' ? check.closedDate : null;
      const voided = Boolean(check.voided);
      const voidDate = typeof check.voidDate === 'string' ? check.voidDate : null;
      rows.push({
        check_guid: checkGuid,
        order_guid: orderGuid,
        business_date: businessDate,
        amount: amount !== null && !Number.isNaN(amount) ? amount : null,
        tax_amount: taxAmount !== null && !Number.isNaN(taxAmount) ? taxAmount : null,
        total_amount: totalAmount !== null && !Number.isNaN(totalAmount) ? totalAmount : null,
        payment_status: paymentStatus,
        paid_date: paidDate,
        closed_date: closedDate,
        voided,
        void_date: voidDate,
        raw_data: check && typeof check === 'object' ? (check as Record<string, unknown>) : null,
      });
    }
  }
  return rows;
}

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

  const logger = createSyncLogger('order_checks_backfill');

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

    // Mode 1: Date range provided — fetch each day, flatten to checks, write to staging only
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

      let checksStagedThisRun = 0;
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

        const checkRows = flattenOrdersToChecks(allOrdersForDay, businessDate);
        if (checkRows.length > 0) {
          for (let i = 0; i < checkRows.length; i += STAGING_BATCH_SIZE) {
            const batch = checkRows.slice(i, i + STAGING_BATCH_SIZE).map((r) => ({
              check_guid: r.check_guid,
              order_guid: r.order_guid,
              business_date: r.business_date,
              amount: r.amount,
              tax_amount: r.tax_amount,
              total_amount: r.total_amount,
              payment_status: r.payment_status,
              paid_date: r.paid_date,
              closed_date: r.closed_date,
              voided: r.voided,
              void_date: r.void_date,
              raw_data: r.raw_data,
              sync_batch_id: batchId,
            }));
            const stagingResult = await withRetry(
              async () => {
                const { error } = await supabase
                  .from('order_checks_staging')
                  .upsert(batch, { onConflict: 'check_guid,sync_batch_id' });
                if (error && !isRetryableSupabaseError(error)) throw error;
                return { error };
              },
              { maxAttempts: 2 },
              `order_checks_staging ${businessDate} batch ${i / STAGING_BATCH_SIZE + 1}`
            );
            if (stagingResult.result.error) throw stagingResult.result.error;
          }
          checksStagedThisRun += checkRows.length;
          datesProcessed.push(businessDate);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          checksStagedThisRun,
          datesProcessed,
          start_date: body.start_date,
          end_date: body.end_date,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mode 2: No date range — use state (cron / one-day-at-a-time)
    const { data: stateRow, error: stateError } = await supabase
      .from('order_checks_backfill_state')
      .select('*')
      .eq('id', 'order_checks_backfill')
      .single();

    if (stateError || !stateRow) {
      logger.error('Failed to load order_checks_backfill_state', stateError);
      return new Response(
        JSON.stringify({ error: 'Backfill state not found. Run migration 20260212120000_order_checks_tables_and_backfill_state.sql.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const state = stateRow as OrderChecksBackfillState;
    if (state.status === 'completed') {
      return new Response(
        JSON.stringify({ success: true, completed: true, message: 'Order checks backfill already completed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cursorDate = state.cursor_date;
    const cursorPage = state.cursor_page;
    const today = new Date().toISOString().split('T')[0];
    if (cursorDate > today) {
      await supabase.from('order_checks_backfill_state').update({
        status: 'completed',
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', 'order_checks_backfill');
      return new Response(
        JSON.stringify({ success: true, completed: true, message: 'Order checks backfill finished' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let token: string;
    try {
      token = await getToastToken(TOAST_CLIENT_ID, TOAST_CLIENT_SECRET);
    } catch (authError) {
      const errMsg = authError instanceof Error ? authError.message : String(authError);
      await supabase.from('order_checks_backfill_state').update({
        last_error: `Auth failed: ${errMsg}`,
        updated_at: new Date().toISOString(),
      }).eq('id', 'order_checks_backfill');
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

      let checksStagedThisRun = 0;

      const checkRows = flattenOrdersToChecks(allOrdersForDay, currentDate);
      if (checkRows.length > 0) {
        for (let i = 0; i < checkRows.length; i += STAGING_BATCH_SIZE) {
          const batch = checkRows.slice(i, i + STAGING_BATCH_SIZE).map((r) => ({
            check_guid: r.check_guid,
            order_guid: r.order_guid,
            business_date: r.business_date,
            amount: r.amount,
            tax_amount: r.tax_amount,
            total_amount: r.total_amount,
            payment_status: r.payment_status,
            paid_date: r.paid_date,
            closed_date: r.closed_date,
            voided: r.voided,
            void_date: r.void_date,
            raw_data: r.raw_data,
            sync_batch_id: batchId,
          }));
          const stagingResult = await withRetry(
            async () => {
              const { error } = await supabase
                .from('order_checks_staging')
                .upsert(batch, { onConflict: 'check_guid,sync_batch_id' });
              if (error && !isRetryableSupabaseError(error)) throw error;
              return { error };
            },
            { maxAttempts: 2 },
            `order_checks_staging ${currentDate}`
          );
          if (stagingResult.result.error) throw stagingResult.result.error;
        }
        checksStagedThisRun = checkRows.length;
      }

      const [y, m, d] = currentDate.split('-').map(Number);
      const nextDate = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);

      await supabase.from('order_checks_backfill_state').update({
        cursor_date: nextDate,
        cursor_page: 1,
        status: nextDate > today ? 'completed' : 'running',
        last_error: null,
        last_synced_at: new Date().toISOString(),
        total_checks_synced: state.total_checks_synced + checksStagedThisRun,
        updated_at: new Date().toISOString(),
      }).eq('id', 'order_checks_backfill');

      return new Response(
        JSON.stringify({
          success: true,
          completed: nextDate > today,
          cursor_date: nextDate,
          cursor_page: 1,
          checksStagedThisRun,
          total_checks_synced: state.total_checks_synced + checksStagedThisRun,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error('Backfill error', err);
      await supabase.from('order_checks_backfill_state').update({
        last_error: errMsg,
        status: 'running',
        updated_at: new Date().toISOString(),
      }).eq('id', 'order_checks_backfill');
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

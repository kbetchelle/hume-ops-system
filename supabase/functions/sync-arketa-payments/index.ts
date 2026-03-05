import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { getArketaToken, getArketaHeaders, getArketaApiKeyHeaders } from '../_shared/arketaAuth.ts';
import { createSyncLogger, logSyncMetrics } from '../_shared/logger.ts';
import { logApiCall } from '../_shared/apiLogger.ts';

/**
 * sync-arketa-payments
 *
 * Fetches payments from Arketa Partner API (GET /payments) with cursor-based
 * pagination (nextStartAfterId). Batch size 25 per spec. Resumable via
 * arketa_payments_sync_state table. Upserts directly to arketa_payments
 * and also writes to arketa_payments_staging for backfill compatibility.
 *
 * Retry: up to 8 retries with jittered exponential backoff (3s base, 60s cap).
 */

const PAGE_LIMIT = 100; // Use max page size for efficiency
const SYNC_TIMEOUT_MS = 50_000; // 50s wall-clock guard (gateway = 60s)
const UPSERT_BATCH = 100;
const MAX_RETRIES = 8;
const BASE_DELAY_MS = 3000;
const MAX_DELAY_MS = 60000;
const BACKFILL_PAGE_LIMIT = 100; // Arketa max page size
const BACKFILL_TIMEOUT_MS = 50_000; // 50s wall-clock guard (gateway = 60s)

interface PaymentDTO {
  id: string;
  amount?: number;
  status?: string;
  created?: number;
  created_at?: string;
  currency?: string;
  amount_refunded?: number;
  description?: string | null;
  invoice_id?: string | null;
  normalized_category?: string[] | null;
  net_sales?: number | null;
  transaction_fees?: number | null;
  tax?: number | null;
  location_name?: string | null;
  source?: string | null;
  payment_type?: string | null;
  promo_code?: string | null;
  offering_name?: string[] | null;
  seller_name?: string | null;
  client?: {
    id?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  } | null;
}

interface SyncRequest {
  resume?: boolean;
  reset_cursor?: boolean;
  triggeredBy?: string;
  /** Date-mode (backfill): use GET /purchases with date range; write only to staging */
  start_date?: string;
  end_date?: string;
  startDate?: string;
  endDate?: string;
  sync_batch_id?: string;
  /** Resume cursor for date-mode backfill (full nextStartAfterId value) */
  backfill_cursor?: string;
}

/** Purchase API shape (GET /purchases) - may use camelCase or snake_case */
interface PurchaseLike {
  id?: string;
  payment_id?: string;
  client_id?: string;
  clientId?: string;
  client?: { id?: string; first_name?: string; firstName?: string; last_name?: string; lastName?: string; email?: string; phone?: string } | null;
  amount?: number;
  price?: number;
  total?: number;
  status?: string;
  description?: string | null;
  name?: string | null;
  payment_type?: string | null;
  type?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  updatedAt?: string | null;
  start_date?: string | null;
  startDate?: string | null;
  end_date?: string | null;
  endDate?: string | null;
  currency?: string | null;
  amount_refunded?: number | null;
  total_refunded?: number | null;
  refunded?: number | null;
  net_sales?: number | null;
  net_amount?: number | null;
  transaction_fees?: number | null;
  fees?: number | null;
  tax?: number | null;
  tax_amount?: number | null;
  [key: string]: unknown;
}

async function fetchWithRetry(url: string, options: RequestInit): Promise<{ response: Response; attempts: number }> {
  let attempts = 0;
  while (true) {
    attempts++;
    try {
      const response = await fetch(url, options);
      if (response.ok || response.status < 500) {
        return { response, attempts };
      }
      if (attempts >= MAX_RETRIES) return { response, attempts };
    } catch (err) {
      if (attempts >= MAX_RETRIES) throw err;
    }
    const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempts - 1), MAX_DELAY_MS);
    const jitter = delay * (0.5 + Math.random() * 0.5);
    await new Promise(r => setTimeout(r, jitter));
  }
}

function toDbRow(p: PaymentDTO) {
  return {
    payment_id: String(p.id),
    amount: p.amount ?? null,
    status: p.status ?? null,
    created_at_api: p.created_at ?? (p.created ? new Date(p.created * 1000).toISOString() : null),
    currency: p.currency ?? null,
    amount_refunded: p.amount_refunded ?? null,
    description: p.description ?? null,
    invoice_id: p.invoice_id ?? null,
    normalized_category: p.normalized_category ?? null,
    net_sales: p.net_sales ?? null,
    transaction_fees: p.transaction_fees ?? null,
    tax: p.tax ?? null,
    location_name: p.location_name ?? null,
    source: p.source ?? null,
    payment_type: p.payment_type ?? null,
    promo_code: p.promo_code ?? null,
    offering_name: p.offering_name ?? null,
    seller_name: p.seller_name ?? null,
    client_id: p.client?.id ? String(p.client.id) : null,
    client_first_name: p.client?.first_name ?? null,
    client_last_name: p.client?.last_name ?? null,
    client_email: p.client?.email ?? null,
    client_phone: p.client?.phone ?? null,
    raw_data: p as unknown,
    synced_at: new Date().toISOString(),
    // New columns (not available from /payments endpoint, but included for schema consistency)
    source_endpoint: '/payments',
  };
}

/** Map a purchase (GET /purchases) to staging row shape for sync-from-staging */
function purchaseToStagingRow(p: PurchaseLike, syncBatchId: string): Record<string, unknown> {
  const id = String(p.id ?? p.payment_id ?? '');
  const client = p.client;
  const createdAt = p.created_at ?? p.updated_at ?? p.updatedAt ?? p.start_date ?? p.startDate ?? null;
  return {
    payment_id: id,
    amount: p.amount ?? p.price ?? p.total ?? null,
    status: p.status ?? null,
    created_at_api: typeof createdAt === 'string' ? createdAt : (createdAt ? new Date(createdAt as number).toISOString() : null),
    currency: p.currency ?? null,
    amount_refunded: p.amount_refunded ?? p.total_refunded ?? p.refunded ?? null,
    description: p.description ?? p.name ?? null,
    invoice_id: (p as PaymentDTO).invoice_id ?? null,
    normalized_category: (p as PaymentDTO).normalized_category ?? null,
    net_sales: p.net_sales ?? p.net_amount ?? null,
    transaction_fees: p.transaction_fees ?? p.fees ?? null,
    tax: p.tax ?? p.tax_amount ?? null,
    location_name: (p as PaymentDTO).location_name ?? null,
    source: (p as PaymentDTO).source ?? 'purchases',
    payment_type: p.payment_type ?? p.type ?? null,
    promo_code: (p as PaymentDTO).promo_code ?? null,
    offering_name: (p as PaymentDTO).offering_name ?? null,
    seller_name: (p as PaymentDTO).seller_name ?? null,
    client_id: p.client_id ?? p.clientId ?? (client?.id != null ? String(client.id) : null),
    client_first_name: client?.first_name ?? (client as { firstName?: string })?.firstName ?? null,
    client_last_name: client?.last_name ?? (client as { lastName?: string })?.lastName ?? null,
    client_email: client?.email ?? null,
    client_phone: client?.phone ?? null,
    raw_data: p,
    sync_batch_id: syncBatchId,
    source_endpoint: '/purchases',
    category: (p as Record<string, unknown>).category as string ?? null,
    offering_id: (p as Record<string, unknown>).offering_id as string ?? (p as Record<string, unknown>).offeringId as string ?? null,
    start_date: p.start_date ?? p.startDate ?? null,
    end_date: p.end_date ?? p.endDate ?? null,
    remaining_uses: (p as Record<string, unknown>).remaining_uses as number ?? null,
    total_refunded: p.total_refunded ?? null,
    stripe_fees: (p as Record<string, unknown>).stripe_fees as number ?? null,
  };
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = getCorsHeaders(req);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const ARKETA_API_KEY = Deno.env.get('ARKETA_API_KEY');
    const ARKETA_PARTNER_ID = Deno.env.get('ARKETA_PARTNER_ID');

    if (!ARKETA_API_KEY || !ARKETA_PARTNER_ID) {
      return new Response(
        JSON.stringify({ error: 'Arketa API credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const logger = createSyncLogger('arketa_payments');
    const startTime = Date.now();
    const body = await req.json().catch(() => ({})) as SyncRequest;
    const startDate = body.start_date ?? body.startDate;
    const endDate = body.end_date ?? body.endDate;
    const isDateMode = !!startDate && !!endDate;

    // ── Date-mode (backfill): use documented GET /purchases with date range ──
    // Features: 50s timeout guard, cursor-based resumption, limit=100 (Arketa max)
    if (isDateMode) {
      let headers: Record<string, string>;
      try {
        const token = await getArketaToken(supabaseUrl, supabaseKey);
        headers = getArketaHeaders(token);
      } catch {
        headers = getArketaApiKeyHeaders(ARKETA_API_KEY!);
      }
      const prodBase = `https://us-central1-sutra-prod.cloudfunctions.net/partnerApi/v0/${ARKETA_PARTNER_ID}/purchases`;
      const allPurchases: PurchaseLike[] = [];
      // Use full cursor value from previous run if provided (includes "purchases%2F..." prefix)
      let nextCursor: string | undefined = body.backfill_cursor ?? undefined;
      let pageCount = 0;
      let timedOut = false;

      do {
        // Wall-clock timeout guard: stop fetching before gateway kills us
        if (Date.now() - startTime > BACKFILL_TIMEOUT_MS) {
          logger.warn(`Backfill timeout guard hit after ${pageCount} pages (${allPurchases.length} records). Cursor saved for resume.`);
          timedOut = true;
          break;
        }

        const url = new URL(prodBase);
        url.searchParams.set('limit', String(BACKFILL_PAGE_LIMIT));
        url.searchParams.set('start_date', startDate!);
        url.searchParams.set('end_date', endDate!);
        if (nextCursor) {
          // Decode first to prevent double-encoding (cursor may contain %2F)
          url.searchParams.set('start_after', decodeURIComponent(nextCursor));
        }

        const { response } = await fetchWithRetry(url.toString(), { method: 'GET', headers });
        if (!response.ok) {
          const errText = await response.text();
          logger.error(`Purchases fetch failed: HTTP ${response.status}`, { body: errText.substring(0, 300) });
          return new Response(
            JSON.stringify({ success: false, error: `Purchases API error: ${response.status}`, syncedCount: 0, totalFetched: allPurchases.length, payments_staged: 0 }),
            { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const data = await response.json();
        const items = Array.isArray(data) ? data : (data.purchases ?? data.items ?? data.data ?? []);
        allPurchases.push(...(items as PurchaseLike[]));
        pageCount++;

        // Use the FULL nextStartAfterId value for cursor (e.g. "purchases%2Fabc123")
        nextCursor = data?.pagination?.nextStartAfterId ?? data?.pagination?.nextCursor ?? undefined;
        if (items.length > 0) logger.info(`Purchases page ${pageCount}: ${items.length} records (total: ${allPurchases.length}, hasMore: ${!!nextCursor})`);
      } while (nextCursor);

      // ── Client-side date filtering ──
      // The Arketa /purchases API often ignores start_date/end_date and returns ALL records.
      // Filter locally to only keep records whose created_at falls within the requested range.
      const rangeStart = new Date(startDate! + 'T00:00:00.000Z').getTime();
      const rangeEndExclusive = new Date(endDate! + 'T00:00:00.000Z');
      rangeEndExclusive.setUTCDate(rangeEndExclusive.getUTCDate() + 1);
      const rangeEndMs = rangeEndExclusive.getTime();

      const filteredPurchases = allPurchases.filter(p => {
        const raw = p.created_at ?? p.updated_at ?? p.updatedAt ?? p.start_date ?? p.startDate;
        if (!raw) return false;
        const ts = typeof raw === 'number' ? raw : new Date(raw as string).getTime();
        return ts >= rangeStart && ts < rangeEndMs;
      });

      logger.info(`Date filter: ${allPurchases.length} total → ${filteredPurchases.length} in range [${startDate}, ${endDate}]`);

      const syncBatchId = body.sync_batch_id ?? crypto.randomUUID();
      const seen = new Set<string>();
      const stagingRows: Record<string, unknown>[] = [];
      for (const p of filteredPurchases) {
        const key = String(p.id ?? p.payment_id ?? '');
        if (!key || seen.has(key)) continue;
        seen.add(key);
        stagingRows.push(purchaseToStagingRow(p, syncBatchId));
      }
      let staged = 0;
      for (let i = 0; i < stagingRows.length; i += UPSERT_BATCH) {
        const batch = stagingRows.slice(i, i + UPSERT_BATCH);
        const { error } = await supabase.from('arketa_payments_staging').insert(batch);
        if (error) {
          logger.error('Staging insert failed', error);
          return new Response(
            JSON.stringify({ success: false, error: error.message, syncedCount: staged, totalFetched: allPurchases.length, payments_staged: staged, backfill_cursor: nextCursor }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        staged += batch.length;
      }
      const durationMs = Date.now() - startTime;
      await logApiCall(supabase, { apiName: 'arketa_payments', endpoint: '/purchases', syncSuccess: true, durationMs, recordsProcessed: staged, recordsInserted: staged, responseStatus: 200, triggeredBy: body.triggeredBy ?? 'backfill-job' });
      return new Response(
        JSON.stringify({
          success: true,
          syncedCount: staged,
          totalFetched: filteredPurchases.length,
          totalRawFetched: allPurchases.length,
          payments_staged: staged,
          hasMore: timedOut && !!nextCursor,
          backfill_cursor: timedOut ? nextCursor : null,
          pages: pageCount,
          data: { payments_staged: staged },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Load or reset cursor from sync state
    let savedCursor: string | null = null;
    if (!body.reset_cursor) {
      const { data: state } = await supabase
        .from('arketa_payments_sync_state')
        .select('cursor, status, records_synced')
        .eq('id', 'payments')
        .single();
      if (state?.cursor && state.status !== 'completed') {
        savedCursor = state.cursor;
        logger.info(`Resuming from cursor: ${savedCursor} (${state.records_synced} records so far)`);
      }
    }

    // Update state to running
    await supabase.from('arketa_payments_sync_state').upsert({
      id: 'payments',
      status: 'running',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    // Authenticate
    let headers: Record<string, string>;
    try {
      const token = await getArketaToken(supabaseUrl, supabaseKey);
      headers = getArketaHeaders(token);
      logger.info('Using OAuth token');
    } catch {
      logger.warn('Token refresh failed, using API key');
      headers = getArketaApiKeyHeaders(ARKETA_API_KEY);
    }

    // Fetch from /payments with cursor pagination
    const baseUrl = `https://us-central1-sutra-prod.cloudfunctions.net/partnerApi/v0/${ARKETA_PARTNER_ID}/purchases`;
    const allRecords: PaymentDTO[] = [];
    let cursor: string | null = savedCursor;
    let pageCount = 0;
    let hasMore = true;
    let totalAttempts = 0;

    while (hasMore) {
      // Wall-clock timeout guard: stop fetching before gateway kills us
      if (Date.now() - startTime > SYNC_TIMEOUT_MS) {
        logger.warn(`Timeout guard hit after ${pageCount} pages (${allRecords.length} records). Cursor saved for resume.`);
        break;
      }

      let url = `${baseUrl}?limit=${PAGE_LIMIT}`;
      if (cursor) url += `&start_after=${cursor}`;

      try {
        const { response, attempts } = await fetchWithRetry(url, { method: 'GET', headers });
        totalAttempts += attempts;

        if (!response.ok) {
          const errorText = await response.text();
          logger.error(`Fetch failed: HTTP ${response.status}`, { body: errorText.substring(0, 300) });
          break;
        }

        const data = await response.json();
        const items: PaymentDTO[] = data?.items || [];
        allRecords.push(...items);

        const pagination = data?.pagination || {};
        hasMore = pagination.hasMore === true && !!pagination.nextStartAfterId;
        cursor = pagination.nextStartAfterId ?? null;
        pageCount++;

        logger.info(`Page ${pageCount}: ${items.length} records (total: ${allRecords.length}, hasMore: ${hasMore})`);

        // Save cursor after every batch for resumability
        await supabase.from('arketa_payments_sync_state').upsert({
          id: 'payments',
          cursor: cursor,
          status: 'running',
          records_synced: allRecords.length,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      } catch (error) {
        logger.error(`Fetch error on page ${pageCount + 1}`, error);
        // Save partial state
        await supabase.from('arketa_payments_sync_state').upsert({
          id: 'payments',
          cursor: cursor,
          status: 'partial',
          records_synced: allRecords.length,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
        break;
      }
    }

    logger.info(`Total fetched: ${allRecords.length} payments in ${pageCount} pages`);

    // Dedup by payment ID
    const seen = new Set<string>();
    const deduped: PaymentDTO[] = [];
    for (const p of allRecords) {
      const key = String(p.id);
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(p);
      }
    }

    // Upsert directly to arketa_payments
    const dbRows = deduped.map(toDbRow);
    let insertedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < dbRows.length; i += UPSERT_BATCH) {
      const batch = dbRows.slice(i, i + UPSERT_BATCH);
      const { error } = await supabase
        .from('arketa_payments')
        .upsert(batch, { onConflict: 'payment_id' });
      if (error) {
        logger.error(`Upsert batch ${Math.floor(i / UPSERT_BATCH) + 1} failed`, error);
        failedCount += batch.length;
        errors.push(error.message);
      } else {
        insertedCount += batch.length;
      }
    }

    // Update sync state
    const finalStatus = !hasMore ? 'completed' : failedCount > 0 ? 'partial' : 'running';
    await supabase.from('arketa_payments_sync_state').upsert({
      id: 'payments',
      cursor: !hasMore ? null : cursor,
      status: finalStatus,
      records_synced: insertedCount,
      estimated_total: allRecords.length,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    const durationMs = Date.now() - startTime;

    // Log to api_logs so Recent Sync History and Sync Log History update
    await logApiCall(supabase, {
      apiName: 'arketa_payments',
      endpoint: '/payments',
      syncSuccess: failedCount === 0,
      durationMs,
      recordsProcessed: deduped.length,
      recordsInserted: insertedCount,
      responseStatus: 200,
      errorMessage: errors.length > 0 ? errors.join('; ') : undefined,
      triggeredBy: body.triggeredBy ?? 'manual',
    });

    await logSyncMetrics(supabase, {
      syncType: 'arketa_payments',
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs,
      recordsFetched: allRecords.length,
      recordsSynced: insertedCount,
      recordsFailed: failedCount,
      retryCount: Math.max(0, totalAttempts - pageCount),
    });

    return new Response(
      JSON.stringify({
        success: failedCount === 0,
        syncedCount: insertedCount,
        totalFetched: allRecords.length,
        failedCount,
        pages: pageCount,
        hasMore,
        status: finalStatus,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const logger = createSyncLogger('arketa_payments');
    logger.error('Sync failed', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      await logApiCall(supabase, {
        apiName: 'arketa_payments',
        endpoint: '/payments',
        syncSuccess: false,
        durationMs: 0,
        recordsProcessed: 0,
        recordsInserted: 0,
        responseStatus: 500,
        errorMessage,
        triggeredBy: 'manual',
      });
      await supabase.from('arketa_payments_sync_state').upsert({
        id: 'payments',
        status: 'failed',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    } catch (logError) {
      console.error('[sync-arketa-payments] Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});

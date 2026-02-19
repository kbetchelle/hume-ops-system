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

const PAGE_LIMIT = 25;
const MAX_PAGES = 30; // Cap at 30 pages (~750 records) per invocation to avoid timeout
const UPSERT_BATCH = 100;
const MAX_RETRIES = 8;
const BASE_DELAY_MS = 3000;
const MAX_DELAY_MS = 60000;

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
    const baseUrl = `https://us-central1-sutra-prod.cloudfunctions.net/partnerApiDev/v0/${ARKETA_PARTNER_ID}/payments`;
    const allRecords: PaymentDTO[] = [];
    let cursor: string | null = savedCursor;
    let pageCount = 0;
    let hasMore = true;
    let totalAttempts = 0;

    while (hasMore && pageCount < MAX_PAGES) {
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

    // Also write to staging for backfill pipeline compatibility
    const syncBatchId = crypto.randomUUID();
    const stagingRows = deduped.map(p => ({
      ...toDbRow(p),
      sync_batch_id: syncBatchId,
      cursor_position: cursor,
    }));

    for (let i = 0; i < stagingRows.length; i += UPSERT_BATCH) {
      const batch = stagingRows.slice(i, i + UPSERT_BATCH);
      const { error: stagingErr } = await supabase.from('arketa_payments_staging').insert(batch);
      if (stagingErr) console.warn('Staging insert error:', stagingErr.message);
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

    await supabase.from('api_sync_status').upsert({
      api_name: 'arketa_payments',
      last_sync_at: new Date().toISOString(),
      last_sync_success: failedCount === 0,
      last_records_processed: deduped.length,
      last_records_inserted: insertedCount,
    }, { onConflict: 'api_name' });

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

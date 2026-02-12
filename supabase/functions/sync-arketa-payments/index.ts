import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { fetchWithRetry } from '../_shared/retry.ts';
import { getArketaToken, getArketaHeaders, getArketaApiKeyHeaders, ARKETA_URLS } from '../_shared/arketaAuth.ts';
import { createSyncLogger, logSyncMetrics } from '../_shared/logger.ts';
import { logApiCall } from '../_shared/apiLogger.ts';

/**
 * sync-arketa-payments
 *
 * Fetches purchases from Arketa Partner API with cursor-based pagination
 * (start_after / pagination.hasMore). Writes to arketa_payments_staging
 * in batches of STAGING_BATCH_SIZE. The staging→history transfer is handled
 * by sync-from-staging.
 *
 * Arketa API limits:
 *   - max 100 items per page
 *   - 25 req/sec rate limit
 *   - cursor pagination via `start_after` query param
 *   - response shape: { items: [...], pagination: { hasMore, nextStartAfterId, limit } }
 */

const PAGE_LIMIT = 100; // Arketa API max per page
const MAX_PAGES = 50; // Safety cap: 50 pages × 100 = 5,000 records max
const STAGING_BATCH_SIZE = 100; // Insert staging rows in chunks

interface ArketaPurchase {
  id: string;
  client_id?: string;
  type?: string;
  offering_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  updated_at?: string;
  name?: string;
  remaining_uses?: number;
  price?: number;
  // Extended fields from actual API responses (may differ from swagger)
  amount?: number;
  total?: number;
  created_at?: string;
  date?: string;
  notes?: string;
  description?: string;
  currency?: string;
  amount_refunded?: number;
  refundedAmount?: number;
  net_sales?: number;
  netAmount?: number;
  transaction_fees?: number;
  fees?: number;
  stripe_fees?: number;
  tax?: number;
  tax_amount?: number;
  category?: string;
}

interface ArketaPagination {
  limit?: number;
  nextStartAfterId?: string | null;
  hasMore?: boolean;
}

interface SyncRequest {
  start_date?: string;
  end_date?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  triggeredBy?: string;
  isHistorical?: boolean;
  noLimit?: boolean;
}

/**
 * Fetch all pages from a single Arketa endpoint using cursor pagination.
 */
async function fetchAllPages(
  baseUrl: string,
  headers: Record<string, string>,
  startDate: string,
  endDate: string,
  logger: ReturnType<typeof createSyncLogger>,
): Promise<{ records: ArketaPurchase[]; totalAttempts: number; limitHit: boolean }> {
  const records: ArketaPurchase[] = [];
  let cursor: string | undefined;
  let totalAttempts = 0;
  let pageCount = 0;
  let hasMore = true;

  while (hasMore && pageCount < MAX_PAGES) {
    let url = `${baseUrl}?limit=${PAGE_LIMIT}&updated_at_min=${startDate}T00:00:00Z&updated_at_max=${endDate}T23:59:59Z`;
    if (cursor) {
      url += `&start_after=${cursor}`;
    }

    try {
      const { response, attempts } = await fetchWithRetry(url, {
        method: 'GET',
        headers,
      });
      totalAttempts += attempts;

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Fetch failed: HTTP ${response.status}`, { body: errorText.substring(0, 200) });
        break;
      }

      const data = await response.json();
      const items: ArketaPurchase[] = data?.items || (Array.isArray(data) ? data : []);
      records.push(...items);

      const pagination: ArketaPagination = data?.pagination || {};
      hasMore = pagination.hasMore === true && !!pagination.nextStartAfterId;
      cursor = pagination.nextStartAfterId ?? undefined;
      pageCount++;

      logger.info(`Page ${pageCount}: ${items.length} records (total: ${records.length}, hasMore: ${hasMore})`);
    } catch (error) {
      logger.error(`Fetch error on page ${pageCount + 1}`, error);
      break;
    }
  }

  const limitHit = hasMore && pageCount >= MAX_PAGES;
  if (limitHit) {
    logger.warn(`Hit MAX_PAGES cap (${MAX_PAGES}). Some records may be missing.`);
  }

  return { records, totalAttempts, limitHit };
}

/**
 * Map an Arketa purchase to a staging row.
 */
function toStagingRow(p: ArketaPurchase, sourceEndpoint: string, syncBatchId: string) {
  return {
    arketa_payment_id: String(p.id),
    source_endpoint: sourceEndpoint,
    payment_id: String(p.id),
    client_id: p.client_id ? String(p.client_id) : null,
    amount: p.amount ?? p.total ?? p.price ?? 0,
    status: p.status ?? 'ACTIVE',
    description: p.description ?? p.notes ?? p.name ?? null,
    payment_type: p.type ?? 'purchase',
    category: p.category ?? null,
    offering_id: p.offering_id ?? null,
    start_date: p.start_date ?? p.created_at ?? p.date ?? null,
    end_date: p.end_date ?? null,
    remaining_uses: p.remaining_uses ?? null,
    currency: p.currency ?? null,
    total_refunded: p.amount_refunded ?? p.refundedAmount ?? null,
    net_sales: p.net_sales ?? p.netAmount ?? p.amount ?? p.total ?? p.price ?? null,
    transaction_fees: p.transaction_fees ?? p.fees ?? null,
    stripe_fees: p.stripe_fees ?? null,
    tax: p.tax ?? p.tax_amount ?? null,
    updated_at: p.updated_at ?? null,
    sync_batch_id: syncBatchId,
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
    const today = new Date();
    const defaultStart = new Date(today);
    defaultStart.setDate(defaultStart.getDate() - 7);
    const defaultEnd = new Date(today);
    defaultEnd.setDate(defaultEnd.getDate() + 7);
    const startDate = body.startDate || body.start_date || defaultStart.toISOString().split('T')[0];
    const endDate = body.endDate || body.end_date || defaultEnd.toISOString().split('T')[0];

    logger.info(`Syncing payments from ${startDate} to ${endDate}`);

    // Authenticate — prefer OAuth, fall back to API key
    let headers: Record<string, string>;
    try {
      const token = await getArketaToken(supabaseUrl, supabaseKey);
      headers = getArketaHeaders(token);
      logger.info('Using OAuth token');
    } catch (tokenError) {
      logger.warn('Token refresh failed, using API key', { error: tokenError instanceof Error ? tokenError.message : String(tokenError) });
      headers = getArketaApiKeyHeaders(ARKETA_API_KEY);
    }

    // ── Fetch from /purchases with full pagination ──
    const purchasesBaseUrl = `${ARKETA_URLS.prod}/${ARKETA_PARTNER_ID}/purchases`;
    const { records: purchases, totalAttempts, limitHit } = await fetchAllPages(
      purchasesBaseUrl, headers, startDate, endDate, logger,
    );

    logger.info(`Total fetched: ${purchases.length} purchases`);

    // ── Dedup by ID (in case of any duplicates) ──
    const seen = new Set<string>();
    const dedupedPurchases: ArketaPurchase[] = [];
    for (const p of purchases) {
      const key = String(p.id);
      if (!seen.has(key)) {
        seen.add(key);
        dedupedPurchases.push(p);
      }
    }
    if (dedupedPurchases.length < purchases.length) {
      logger.info(`Deduped: ${purchases.length} → ${dedupedPurchases.length}`);
    }

    // ── Write to staging in batches ──
    const syncBatchId = crypto.randomUUID();
    const stagingRows = dedupedPurchases.map(p => toStagingRow(p, 'purchases', syncBatchId));

    let insertedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < stagingRows.length; i += STAGING_BATCH_SIZE) {
      const batch = stagingRows.slice(i, i + STAGING_BATCH_SIZE);
      const { error } = await supabase.from('arketa_payments_staging').insert(batch);
      if (error) {
        logger.error(`Staging batch ${Math.floor(i / STAGING_BATCH_SIZE) + 1} failed`, error);
        failedCount += batch.length;
        errors.push(error.message);
      } else {
        insertedCount += batch.length;
      }
    }

    const durationMs = Date.now() - startTime;
    await logSyncMetrics(supabase, {
      syncType: 'arketa_payments',
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs,
      recordsFetched: purchases.length,
      recordsSynced: insertedCount,
      recordsFailed: failedCount,
      retryCount: Math.max(0, totalAttempts - 1),
    });
    await supabase
      .from('api_sync_status')
      .upsert({
        api_name: 'arketa_payments',
        last_sync_at: new Date().toISOString(),
        last_sync_success: failedCount === 0,
        last_records_processed: dedupedPurchases.length,
        last_records_inserted: insertedCount,
      }, { onConflict: 'api_name' });

    return new Response(
      JSON.stringify({
        success: failedCount === 0,
        data: {
          payments_synced: insertedCount,
          payments_staged: insertedCount,
          records_processed: dedupedPurchases.length,
          records_inserted: insertedCount,
          limit_hit: limitHit,
        },
        totalFetched: purchases.length,
        syncedCount: insertedCount,
        failedCount,
        dateRange: { startDate, endDate },
        apiAttempts: totalAttempts,
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
        endpoint: '/purchases',
        syncSuccess: false,
        durationMs: 0,
        recordsProcessed: 0,
        recordsInserted: 0,
        responseStatus: 500,
        errorMessage: errorMessage,
        triggeredBy: 'manual',
      });
    } catch (logError) {
      console.error('[sync-arketa-payments] Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

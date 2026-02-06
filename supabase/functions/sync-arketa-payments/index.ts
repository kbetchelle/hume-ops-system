import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { fetchWithRetry, withRetry, isRetryableSupabaseError } from '../_shared/retry.ts';
import { getArketaToken, getArketaHeaders, getArketaApiKeyHeaders, ARKETA_URLS } from '../_shared/arketaAuth.ts';
import { createSyncLogger, logSyncMetrics } from '../_shared/logger.ts';
import { logApiCall } from '../_shared/apiLogger.ts';

interface ArketaPayment {
  id: string;
  amount?: number;
  total?: number;
  created_at?: string;
  date?: string;
  client_id?: string;
  type?: string;
  status?: string;
  notes?: string;
  description?: string;
  // Additional fields for complete sync
  currency?: string;
  amount_refunded?: number;
  refundedAmount?: number;
  source?: string;
  payment_source?: string;
  location?: { name?: string; id?: string };
  location_name?: string;
  offering?: { name?: string; id?: string };
  offering_name?: string;
  item_name?: string;
  promo_code?: string;
  coupon_code?: string;
  net_sales?: number;
  netAmount?: number;
  transaction_fees?: number;
  fees?: number;
  tax?: number;
  tax_amount?: number;
}

interface SyncRequest {
  start_date?: string;
  end_date?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  triggeredBy?: string;
  isHistorical?: boolean;
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
    const limit = body.limit ?? 400;

    logger.info(`Syncing payments from ${startDate} to ${endDate} (limit ${limit} per endpoint)`);

    // Try to get token via refresh flow, fall back to API key
    let headers: Record<string, string>;
    try {
      const token = await getArketaToken(supabaseUrl, supabaseKey);
      headers = getArketaHeaders(token);
      logger.info('Using OAuth token for authentication');
    } catch (tokenError) {
      logger.warn('Token refresh failed, using API key', { error: tokenError instanceof Error ? tokenError.message : String(tokenError) });
      headers = getArketaApiKeyHeaders(ARKETA_API_KEY);
    }

    let payments: ArketaPayment[] = [];
    let totalAttempts = 0;
    
    // Try purchases endpoint first with retry (400 records per sync)
    const purchasesUrl = `${ARKETA_URLS.prod}/${ARKETA_PARTNER_ID}/purchases?limit=${limit}&start_date=${startDate}&end_date=${endDate}`;
    
    try {
      const { response: purchasesResponse, attempts } = await fetchWithRetry(purchasesUrl, {
        method: 'GET',
        headers,
      });
      totalAttempts += attempts;

      if (purchasesResponse.ok) {
        const purchasesData = await purchasesResponse.json();
        // Arketa API returns data under 'items' key
        const purchasesArray = purchasesData?.items || (Array.isArray(purchasesData) ? purchasesData : []);
        payments = purchasesArray;
        logger.info(`Fetched ${payments.length} purchases after ${attempts} attempt(s)`, { 
          responseKeys: Object.keys(purchasesData || {}),
          hasItems: !!purchasesData?.items 
        });
      }
    } catch (error) {
      logger.error('Purchases endpoint failed', error);
    }

    // Also try payments endpoint and merge (400 records per sync)
    const paymentsUrl = `${ARKETA_URLS.prod}/${ARKETA_PARTNER_ID}/payments?limit=${limit}&start_date=${startDate}&end_date=${endDate}`;
    
    try {
      const { response: paymentsResponse, attempts } = await fetchWithRetry(paymentsUrl, {
        method: 'GET',
        headers,
      });
      totalAttempts += attempts;

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        // Arketa API returns data under 'items' key
        const paymentsArray = paymentsData?.items || (Array.isArray(paymentsData) ? paymentsData : []);
        if (paymentsArray.length > 0) {
          logger.info(`Fetched ${paymentsArray.length} additional payments after ${attempts} attempt(s)`, {
            responseKeys: Object.keys(paymentsData || {}),
            hasItems: !!paymentsData?.items
          });
          payments = [...payments, ...paymentsArray];
        }
      }
    } catch (error) {
      logger.error('Payments endpoint failed', error);
    }

    logger.info(`Total fetched: ${payments.length} payments`);

    // Write to staging - fields matching arketa_payments_history
    const syncBatchId = crypto.randomUUID();
    const stagingRows = payments.map((p) => ({
      source_endpoint: 'purchases',
      payment_id: String(p.id),
      client_id: p.client_id ? String(p.client_id) : null,
      amount: p.amount ?? p.total ?? 0,
      status: p.status ?? 'ACTIVE',
      description: p.description ?? p.notes ?? null,
      payment_type: p.type ?? 'purchase',
      category: (p as { category?: string }).category ?? null,
      offering_id: (p as { offering_id?: string }).offering_id ?? (p as { offering?: { id?: string } }).offering?.id ?? null,
      start_date: (p as { start_date?: string }).start_date ?? (p as { startDate?: string }).startDate ?? null,
      end_date: (p as { end_date?: string }).end_date ?? (p as { endDate?: string }).endDate ?? null,
      remaining_uses: (p as { remaining_uses?: number }).remaining_uses ?? null,
      currency: p.currency ?? null,
      total_refunded: p.amount_refunded ?? (p as { refundedAmount?: number }).refundedAmount ?? null,
      net_sales: p.net_sales ?? (p as { netAmount?: number }).netAmount ?? p.amount ?? p.total ?? null,
      transaction_fees: p.transaction_fees ?? (p as { fees?: number }).fees ?? null,
      stripe_fees: (p as { stripe_fees?: number }).stripe_fees ?? null,
      tax: p.tax ?? (p as { tax_amount?: number }).tax_amount ?? null,
      updated_at: (p as { updated_at?: string }).updated_at ?? (p as { updatedAt?: string }).updatedAt ?? null,
      sync_batch_id: syncBatchId,
    }));

    let failedCount = 0;
    if (stagingRows.length > 0) {
      const { error } = await supabase.from('arketa_payments_staging').insert(stagingRows);
      if (error) {
        logger.error('Failed to insert payments to staging', error);
        failedCount = stagingRows.length;
      }
    }
    const syncedCount = stagingRows.length - failedCount;

    const durationMs = Date.now() - startTime;
    await logSyncMetrics(supabase, {
      syncType: 'arketa_payments',
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs,
      recordsFetched: payments.length,
      recordsSynced: syncedCount,
      recordsFailed: failedCount,
      retryCount: Math.max(0, totalAttempts - 2),
    });
    await supabase
      .from('api_sync_status')
      .upsert({
        api_name: 'arketa_payments',
        last_sync_at: new Date().toISOString(),
        last_sync_success: failedCount === 0,
        last_records_processed: payments.length,
        last_records_inserted: syncedCount,
      }, { onConflict: 'api_name' });

    return new Response(
      JSON.stringify({
        success: failedCount === 0,
        data: {
          payments_synced: syncedCount,
          payments_staged: syncedCount,
          records_processed: payments.length,
          records_inserted: syncedCount,
        },
        totalFetched: payments.length,
        syncedCount,
        failedCount,
        dateRange: { startDate, endDate },
        apiAttempts: totalAttempts,
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
      console.error('[sync-arketa-payments] Failed to log error to api_logs:', logError);
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

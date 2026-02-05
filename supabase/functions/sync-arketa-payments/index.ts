import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
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
  limit?: number;
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
    
    // Default: 7 days back to 7 days forward
    const defaultStart = new Date(today);
    defaultStart.setDate(defaultStart.getDate() - 7);
    const defaultEnd = new Date(today);
    defaultEnd.setDate(defaultEnd.getDate() + 7);
    
    const startDate = body.start_date || defaultStart.toISOString().split('T')[0];
    const endDate = body.end_date || defaultEnd.toISOString().split('T')[0];
    // No limit parameter - fetch all records

    logger.info(`Syncing payments from ${startDate} to ${endDate}`);

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
    
    // Try purchases endpoint first with retry
    const purchasesUrl = `${ARKETA_URLS.prod}/${ARKETA_PARTNER_ID}/purchases?start_date=${startDate}&end_date=${endDate}`;
    
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

    // Also try payments endpoint and merge
    const paymentsUrl = `${ARKETA_URLS.prod}/${ARKETA_PARTNER_ID}/payments?start_date=${startDate}&end_date=${endDate}`;
    
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

    const syncedPayments = [];
    let totalRevenue = 0;
    let failedCount = 0;

    for (const payment of payments) {
      const amount = payment.amount ?? payment.total ?? 0;
      const paymentDate = payment.created_at || payment.date || new Date().toISOString();

      try {
        const { result } = await withRetry(
          async () => {
            const { error } = await supabase
              .from('arketa_payments')
              .upsert({
                external_id: String(payment.id),
                client_id: payment.client_id ? String(payment.client_id) : null,
                amount,
                payment_type: payment.type || 'purchase',
                status: payment.status || 'completed',
                payment_date: paymentDate,
                notes: payment.notes || null,
                // Additional fields
                description: payment.description || payment.notes || null,
                currency: payment.currency || 'USD',
                amount_refunded: payment.amount_refunded || payment.refundedAmount || 0,
                source: payment.source || payment.payment_source || null,
                location_name: payment.location?.name || payment.location_name || null,
                offering_name: payment.offering?.name || payment.offering_name || payment.item_name || null,
                promo_code: payment.promo_code || payment.coupon_code || null,
                net_sales: payment.net_sales || payment.netAmount || amount,
                transaction_fees: payment.transaction_fees || payment.fees || 0,
                tax: payment.tax || payment.tax_amount || 0,
                raw_data: payment,
                synced_at: new Date().toISOString(),
              }, {
                onConflict: 'external_id',
              });

            if (error && !isRetryableSupabaseError(error)) {
              throw error;
            }
            return { error };
          },
          { maxAttempts: 2 },
          `upsert payment ${payment.id}`
        );

        if (result.error) {
          logger.error(`Failed to upsert payment ${payment.id}`, result.error);
          failedCount++;
          continue;
        }

        totalRevenue += amount;
        syncedPayments.push({
          id: payment.id,
          amount,
          type: payment.type,
          status: payment.status,
          date: paymentDate,
        });
      } catch (error) {
        logger.error(`Error upserting payment ${payment.id}`, error);
        failedCount++;
      }
    }

    // Log sync metrics
    const durationMs = Date.now() - startTime;
    await logSyncMetrics(supabase, {
      syncType: 'arketa_payments',
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs,
      recordsFetched: payments.length,
      recordsSynced: syncedPayments.length,
      recordsFailed: failedCount,
      retryCount: Math.max(0, totalAttempts - 2), // Approx retries
    });

    // Update sync status
    await supabase
      .from('api_sync_status')
      .upsert({
        api_name: 'arketa_payments',
        last_sync_at: new Date().toISOString(),
        last_sync_success: true,
        last_records_processed: payments.length,
        last_records_inserted: syncedPayments.length,
      }, { onConflict: 'api_name' });

    return new Response(
      JSON.stringify({
        success: true,
        payments: syncedPayments,
        totalFetched: payments.length,
        syncedCount: syncedPayments.length,
        failedCount,
        totalRevenue,
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

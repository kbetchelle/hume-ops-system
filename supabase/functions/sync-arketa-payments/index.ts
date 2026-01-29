import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { fetchWithRetry, withRetry, isRetryableSupabaseError } from '../_shared/retry.ts';

const ARKETA_PROD_URL = 'https://us-central1-sutra-prod.cloudfunctions.net/partnerApi/v0';

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
    const ARKETA_API_KEY = Deno.env.get('ARKETA_API_KEY');
    const ARKETA_PARTNER_ID = Deno.env.get('ARKETA_PARTNER_ID');

    if (!ARKETA_API_KEY || !ARKETA_PARTNER_ID) {
      return new Response(
        JSON.stringify({ error: 'Arketa API credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({})) as SyncRequest;
    const today = new Date().toISOString().split('T')[0];
    const startDate = body.start_date || today;
    const endDate = body.end_date || today;
    const limit = body.limit || 500;

    console.log(`[Arketa Payments] Syncing payments from ${startDate} to ${endDate}`);

    let payments: ArketaPayment[] = [];
    let totalAttempts = 0;
    
    // Try purchases endpoint first with retry
    const purchasesUrl = `${ARKETA_PROD_URL}/${ARKETA_PARTNER_ID}/purchases?limit=${limit}&start_date=${startDate}&end_date=${endDate}`;
    
    try {
      const { response: purchasesResponse, attempts } = await fetchWithRetry(purchasesUrl, {
        method: 'GET',
        headers: {
          'x-api-key': ARKETA_API_KEY,
          'Content-Type': 'application/json',
        },
      });
      totalAttempts += attempts;

      if (purchasesResponse.ok) {
        const purchasesData = await purchasesResponse.json();
        payments = Array.isArray(purchasesData) ? purchasesData : [];
        console.log(`[Arketa Payments] Fetched ${payments.length} purchases after ${attempts} attempt(s)`);
      }
    } catch (error) {
      console.error('[Arketa Payments] Purchases endpoint failed:', error);
    }

    // Also try payments endpoint and merge
    const paymentsUrl = `${ARKETA_PROD_URL}/${ARKETA_PARTNER_ID}/payments?limit=${limit}&start_date=${startDate}&end_date=${endDate}`;
    
    try {
      const { response: paymentsResponse, attempts } = await fetchWithRetry(paymentsUrl, {
        method: 'GET',
        headers: {
          'x-api-key': ARKETA_API_KEY,
          'Content-Type': 'application/json',
        },
      });
      totalAttempts += attempts;

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        if (Array.isArray(paymentsData)) {
          console.log(`[Arketa Payments] Fetched ${paymentsData.length} additional payments after ${attempts} attempt(s)`);
          payments = [...payments, ...paymentsData];
        }
      }
    } catch (error) {
      console.error('[Arketa Payments] Payments endpoint failed:', error);
    }

    console.log(`[Arketa Payments] Total fetched: ${payments.length} payments`);

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
          console.error(`[Arketa Payments] Failed to upsert payment ${payment.id}:`, result.error);
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
        console.error(`[Arketa Payments] Error upserting payment ${payment.id}:`, error);
        failedCount++;
      }
    }

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
    console.error('[Arketa Payments] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

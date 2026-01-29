import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

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

    // Try purchases endpoint first, then payments
    let payments: ArketaPayment[] = [];
    
    // Try purchases endpoint
    const purchasesUrl = `${ARKETA_PROD_URL}/${ARKETA_PARTNER_ID}/purchases?limit=${limit}&start_date=${startDate}&end_date=${endDate}`;
    const purchasesResponse = await fetch(purchasesUrl, {
      method: 'GET',
      headers: {
        'x-api-key': ARKETA_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (purchasesResponse.ok) {
      const purchasesData = await purchasesResponse.json();
      payments = Array.isArray(purchasesData) ? purchasesData : [];
    }

    // Also try payments endpoint and merge
    const paymentsUrl = `${ARKETA_PROD_URL}/${ARKETA_PARTNER_ID}/payments?limit=${limit}&start_date=${startDate}&end_date=${endDate}`;
    const paymentsResponse = await fetch(paymentsUrl, {
      method: 'GET',
      headers: {
        'x-api-key': ARKETA_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (paymentsResponse.ok) {
      const paymentsData = await paymentsResponse.json();
      if (Array.isArray(paymentsData)) {
        payments = [...payments, ...paymentsData];
      }
    }

    console.log(`[Arketa Payments] Fetched ${payments.length} payments`);

    const syncedPayments = [];
    let totalRevenue = 0;

    for (const payment of payments) {
      const amount = payment.amount ?? payment.total ?? 0;
      const paymentDate = payment.created_at || payment.date || new Date().toISOString();

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

      if (error) {
        console.error(`[Arketa Payments] Failed to upsert payment ${payment.id}:`, error);
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
        totalRevenue,
        dateRange: { startDate, endDate },
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

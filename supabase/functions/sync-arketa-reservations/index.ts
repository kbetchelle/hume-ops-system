import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { fetchWithRetry, withRetry, isRetryableSupabaseError } from '../_shared/retry.ts';

const ARKETA_PROD_URL = 'https://us-central1-sutra-prod.cloudfunctions.net/partnerApi/v0';

interface ArketaReservation {
  id: string;
  class_id?: string;
  client_id?: string;
  client?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  checked_in?: boolean;
  status?: string;
  checkedInAt?: string;
  checked_in_at?: string;
  start_time?: string;
}

interface SyncRequest {
  start_date?: string;
  end_date?: string;
  class_id?: string;
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

    console.log(`[Arketa Reservations] Syncing reservations from ${startDate} to ${endDate}`);

    let reservations: ArketaReservation[] = [];
    let totalAttempts = 0;

    if (body.class_id) {
      // Fetch reservations for specific class
      const url = `${ARKETA_PROD_URL}/${ARKETA_PARTNER_ID}/classes/${body.class_id}/reservations?limit=${limit}`;
      
      try {
        const { response, attempts } = await fetchWithRetry(url, {
          method: 'GET',
          headers: {
            'x-api-key': ARKETA_API_KEY,
            'Content-Type': 'application/json',
          },
        });
        totalAttempts = attempts;

        if (response.ok) {
          reservations = await response.json();
        }
      } catch (error) {
        console.error(`[Arketa Reservations] Failed to fetch class reservations:`, error);
      }
    } else {
      // Fetch all reservations for date range
      const url = `${ARKETA_PROD_URL}/${ARKETA_PARTNER_ID}/reservations?limit=${limit}&start_date=${startDate}&end_date=${endDate}`;
      
      const { response, attempts } = await fetchWithRetry(url, {
        method: 'GET',
        headers: {
          'x-api-key': ARKETA_API_KEY,
          'Content-Type': 'application/json',
        },
      });
      totalAttempts = attempts;

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Arketa API error: ${response.status} - ${errorText}`);
      }

      reservations = await response.json();
    }

    console.log(`[Arketa Reservations] Fetched ${reservations.length} reservations after ${totalAttempts} attempt(s)`);

    const syncedReservations = [];
    let failedCount = 0;

    for (const res of reservations) {
      const clientName = res.client 
        ? `${res.client.firstName || ''} ${res.client.lastName || ''}`.trim()
        : null;
      const clientEmail = res.client?.email || null;
      const clientId = res.client_id || res.client?.id || null;
      const checkedInAt = res.checkedInAt || res.checked_in_at || null;

      try {
        const { result } = await withRetry(
          async () => {
            const { error } = await supabase
              .from('arketa_reservations')
              .upsert({
                external_id: String(res.id),
                class_id: String(res.class_id || ''),
                client_id: clientId ? String(clientId) : null,
                client_name: clientName,
                client_email: clientEmail,
                status: res.status || 'booked',
                checked_in: res.checked_in || false,
                checked_in_at: checkedInAt,
                raw_data: res,
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
          `upsert reservation ${res.id}`
        );

        if (result.error) {
          console.error(`[Arketa Reservations] Failed to upsert reservation ${res.id}:`, result.error);
          failedCount++;
          continue;
        }

        syncedReservations.push({
          id: res.id,
          classId: res.class_id,
          clientName,
          status: res.status,
          checkedIn: res.checked_in,
        });
      } catch (error) {
        console.error(`[Arketa Reservations] Error upserting reservation ${res.id}:`, error);
        failedCount++;
      }
    }

    // Update sync status
    await supabase
      .from('api_sync_status')
      .upsert({
        api_name: 'arketa_reservations',
        last_sync_at: new Date().toISOString(),
        last_sync_success: true,
        last_records_processed: reservations.length,
        last_records_inserted: syncedReservations.length,
      }, { onConflict: 'api_name' });

    // Calculate summary stats
    const checkedInCount = syncedReservations.filter(r => r.checkedIn).length;
    const noShowCount = syncedReservations.filter(r => r.status === 'no_show').length;

    return new Response(
      JSON.stringify({
        success: true,
        reservations: syncedReservations,
        totalFetched: reservations.length,
        syncedCount: syncedReservations.length,
        failedCount,
        summary: {
          total: syncedReservations.length,
          checkedIn: checkedInCount,
          noShows: noShowCount,
        },
        dateRange: { startDate, endDate },
        apiAttempts: totalAttempts,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Arketa Reservations] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

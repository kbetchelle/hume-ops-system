import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { fetchWithRetry, withRetry, isRetryableSupabaseError } from '../_shared/retry.ts';

const ARKETA_PROD_URL = 'https://us-central1-sutra-prod.cloudfunctions.net/partnerApi/v0';
const MAX_PAGES = 100; // Safety limit to prevent infinite loops

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

interface PaginatedResponse {
  data?: ArketaReservation[];
  reservations?: ArketaReservation[];
  pagination?: {
    nextCursor?: string;
    hasMore?: boolean;
  };
}

interface SyncRequest {
  start_date?: string;
  end_date?: string;
  class_id?: string;
  limit?: number;
}

// Fetch reservations with cursor-based pagination
async function fetchAllReservations(
  baseUrl: string,
  apiKey: string,
  partnerId: string,
  startDate: string,
  endDate: string,
  limit: number,
  classId?: string
): Promise<{ reservations: ArketaReservation[]; totalAttempts: number; pagesProcessed: number }> {
  let allReservations: ArketaReservation[] = [];
  let nextCursor: string | undefined = undefined;
  let hasMore = true;
  let pageCount = 0;
  let totalAttempts = 0;

  while (hasMore && pageCount < MAX_PAGES) {
    pageCount++;

    let url: URL;
    if (classId) {
      // Fetch reservations for specific class
      url = new URL(`${baseUrl}/${partnerId}/classes/${classId}/reservations`);
    } else {
      // Fetch all reservations for date range
      url = new URL(`${baseUrl}/${partnerId}/reservations`);
      url.searchParams.set('start_date', startDate);
      url.searchParams.set('end_date', endDate);
    }
    url.searchParams.set('limit', String(limit));
    if (nextCursor) {
      url.searchParams.set('cursor', nextCursor);
    }

    console.log(`[Arketa Reservations] Fetching page ${pageCount}...`);

    const { response, attempts } = await fetchWithRetry(url.toString(), {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });
    totalAttempts += attempts;

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Arketa API error: ${response.status} - ${errorText}`);
    }

    const responseData: PaginatedResponse | ArketaReservation[] = await response.json();

    // Handle both array response and paginated response formats
    let pageReservations: ArketaReservation[];
    if (Array.isArray(responseData)) {
      pageReservations = responseData;
      hasMore = false; // Array response means no pagination
    } else {
      pageReservations = responseData.data || responseData.reservations || [];
      nextCursor = responseData.pagination?.nextCursor;
      hasMore = responseData.pagination?.hasMore ?? false;
    }

    allReservations = [...allReservations, ...pageReservations];
    console.log(`[Arketa Reservations] Fetched page ${pageCount}, total records: ${allReservations.length}`);

    // If we got fewer than limit, we're done
    if (pageReservations.length < limit) {
      hasMore = false;
    }
  }

  if (pageCount >= MAX_PAGES) {
    console.warn(`[Arketa Reservations] Reached max page limit (${MAX_PAGES}), some records may be missing`);
  }

  return { reservations: allReservations, totalAttempts, pagesProcessed: pageCount };
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

    // Fetch all reservations with pagination
    const { reservations, totalAttempts, pagesProcessed } = await fetchAllReservations(
      ARKETA_PROD_URL,
      ARKETA_API_KEY,
      ARKETA_PARTNER_ID,
      startDate,
      endDate,
      limit,
      body.class_id
    );

    console.log(`[Arketa Reservations] Total fetched: ${reservations.length} reservations in ${pagesProcessed} page(s), ${totalAttempts} API attempt(s)`);

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
        pagesProcessed,
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

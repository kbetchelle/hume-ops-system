import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { fetchWithRetry, withRetry, isRetryableSupabaseError } from '../_shared/retry.ts';

const ARKETA_PROD_URL = 'https://us-central1-sutra-prod.cloudfunctions.net/partnerApi/v0';
const MAX_PAGES = 100; // Safety limit to prevent infinite loops

interface ArketaClass {
  id: string;
  name?: string;
  class_name?: string;
  start_time?: string;
  duration?: number;
  duration_minutes?: number;
  capacity?: number;
  max_capacity?: number;
  total_booked?: number;
  booked_count?: number;
  status?: string;
  is_cancelled?: boolean;
  cancelled?: boolean;
  is_waitlist_enabled?: boolean;
  waitlist_enabled?: boolean;
  waitlist_count?: number;
  room?: { id?: string; name?: string };
  room_id?: string;
  instructor_name?: string;
  instructor?: { first_name?: string; last_name?: string };
}

interface PaginatedResponse {
  data?: ArketaClass[];
  classes?: ArketaClass[];
  pagination?: {
    nextCursor?: string;
    hasMore?: boolean;
  };
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

    console.log(`[Arketa Classes] Syncing classes from ${startDate} to ${endDate}`);

    // Fetch all classes with cursor-based pagination
    let allClasses: ArketaClass[] = [];
    let nextCursor: string | undefined = undefined;
    let hasMore = true;
    let pageCount = 0;
    let totalAttempts = 0;

    while (hasMore && pageCount < MAX_PAGES) {
      pageCount++;
      
      const url = new URL(`${ARKETA_PROD_URL}/${ARKETA_PARTNER_ID}/classes`);
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('start_date', startDate);
      url.searchParams.set('end_date', endDate);
      if (nextCursor) {
        url.searchParams.set('cursor', nextCursor);
      }

      console.log(`[Arketa Classes] Fetching page ${pageCount}...`);

      const { response, attempts } = await fetchWithRetry(url.toString(), {
        method: 'GET',
        headers: {
          'x-api-key': ARKETA_API_KEY,
          'Content-Type': 'application/json',
        },
      });
      totalAttempts += attempts;

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Arketa API error: ${response.status} - ${errorText}`);
      }

      const responseData: PaginatedResponse | ArketaClass[] = await response.json();
      
      // Handle both array response and paginated response formats
      let pageClasses: ArketaClass[];
      if (Array.isArray(responseData)) {
        pageClasses = responseData;
        hasMore = false; // Array response means no pagination
      } else {
        pageClasses = responseData.data || responseData.classes || [];
        nextCursor = responseData.pagination?.nextCursor;
        hasMore = responseData.pagination?.hasMore ?? false;
      }

      allClasses = [...allClasses, ...pageClasses];
      console.log(`[Arketa Classes] Fetched page ${pageCount}, total records: ${allClasses.length}`);

      // If we got fewer than limit, we're done
      if (pageClasses.length < limit) {
        hasMore = false;
      }
    }

    if (pageCount >= MAX_PAGES) {
      console.warn(`[Arketa Classes] Reached max page limit (${MAX_PAGES}), some records may be missing`);
    }

    console.log(`[Arketa Classes] Total fetched: ${allClasses.length} classes in ${pageCount} page(s), ${totalAttempts} API attempt(s)`);

    const syncedClasses = [];
    let failedCount = 0;

    for (const cls of allClasses) {
      const name = cls.name || cls.class_name || 'Unknown Class';
      const instructorName = cls.instructor_name || 
        (cls.instructor ? `${cls.instructor.first_name || ''} ${cls.instructor.last_name || ''}`.trim() : null);
      const roomName = cls.room?.name || null;
      const isCancelled = cls.is_cancelled ?? cls.cancelled ?? false;
      const duration = cls.duration_minutes ?? cls.duration ?? null;
      const capacity = cls.capacity ?? cls.max_capacity ?? null;
      const bookedCount = cls.total_booked ?? cls.booked_count ?? 0;

      try {
        const { result } = await withRetry(
          async () => {
            const { error } = await supabase
              .from('arketa_classes')
              .upsert({
                external_id: String(cls.id),
                name,
                start_time: cls.start_time,
                duration_minutes: duration,
                capacity,
                booked_count: bookedCount,
                waitlist_count: cls.waitlist_count || 0,
                status: cls.status || 'scheduled',
                is_cancelled: isCancelled,
                room_name: roomName,
                instructor_name: instructorName,
                raw_data: cls,
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
          `upsert class ${cls.id}`
        );

        if (result.error) {
          console.error(`[Arketa Classes] Failed to upsert class ${cls.id}:`, result.error);
          failedCount++;
          continue;
        }

        syncedClasses.push({
          id: cls.id,
          name,
          startTime: cls.start_time,
          instructor: instructorName,
          booked: bookedCount,
          capacity,
        });
      } catch (error) {
        console.error(`[Arketa Classes] Error upserting class ${cls.id}:`, error);
        failedCount++;
      }
    }

    // Update sync status
    await supabase
      .from('api_sync_status')
      .upsert({
        api_name: 'arketa_classes',
        last_sync_at: new Date().toISOString(),
        last_sync_success: true,
        last_records_processed: allClasses.length,
        last_records_inserted: syncedClasses.length,
      }, { onConflict: 'api_name' });

    return new Response(
      JSON.stringify({
        success: true,
        classes: syncedClasses,
        totalFetched: allClasses.length,
        syncedCount: syncedClasses.length,
        failedCount,
        dateRange: { startDate, endDate },
        pagesProcessed: pageCount,
        apiAttempts: totalAttempts,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Arketa Classes] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

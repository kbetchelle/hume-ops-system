import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

const ARKETA_PROD_URL = 'https://us-central1-sutra-prod.cloudfunctions.net/partnerApi/v0';

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

    // Fetch classes from Arketa API
    const url = `${ARKETA_PROD_URL}/${ARKETA_PARTNER_ID}/classes?limit=${limit}&start_date=${startDate}&end_date=${endDate}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': ARKETA_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Arketa API error: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    const classes: ArketaClass[] = Array.isArray(responseData) 
      ? responseData 
      : (responseData.classes || responseData.data || []);
    console.log(`[Arketa Classes] Fetched ${classes.length} classes`);

    const syncedClasses = [];

    for (const cls of classes) {
      const name = cls.name || cls.class_name || 'Unknown Class';
      const instructorName = cls.instructor_name || 
        (cls.instructor ? `${cls.instructor.first_name || ''} ${cls.instructor.last_name || ''}`.trim() : null);
      const roomName = cls.room?.name || null;
      const isCancelled = cls.is_cancelled ?? cls.cancelled ?? false;
      const duration = cls.duration_minutes ?? cls.duration ?? null;
      const capacity = cls.capacity ?? cls.max_capacity ?? null;
      const bookedCount = cls.total_booked ?? cls.booked_count ?? 0;

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

      if (error) {
        console.error(`[Arketa Classes] Failed to upsert class ${cls.id}:`, error);
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
    }

    // Update sync status
    await supabase
      .from('api_sync_status')
      .upsert({
        api_name: 'arketa_classes',
        last_sync_at: new Date().toISOString(),
        last_sync_success: true,
        last_records_processed: classes.length,
        last_records_inserted: syncedClasses.length,
      }, { onConflict: 'api_name' });

    return new Response(
      JSON.stringify({
        success: true,
        classes: syncedClasses,
        totalFetched: classes.length,
        syncedCount: syncedClasses.length,
        dateRange: { startDate, endDate },
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

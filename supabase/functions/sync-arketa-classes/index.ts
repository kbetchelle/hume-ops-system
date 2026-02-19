/**
 * sync-arketa-classes: Populate arketa_classes for a date range via staging.
 * Fetches from API → inserts into arketa_classes_staging → upserts to arketa_classes on (external_id, class_date) → deletes from staging.
 * See docs/ARKETA_ARCHITECTURE.md — arketa_classes is the master catalog of class_ids for reservation sync.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { fetchWithRetry } from '../_shared/retry.ts';
import { getArketaApiKeyHeaders, ARKETA_URLS } from '../_shared/arketaAuth.ts';

interface SyncClassesRequest {
  start_date?: string;
  end_date?: string;
  startDate?: string;
  endDate?: string;
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

    const body = (await req.json().catch(() => ({}))) as SyncClassesRequest;
    const limit = body.limit ?? 500;

    // Use x-api-key auth exclusively per Arketa API spec
    const headers = getArketaApiKeyHeaders(ARKETA_API_KEY);

    // Fetch all classes historically (no date filter) — local filtering applied later
    const allClasses: any[] = [];
    let cursor: string | undefined;

    do {
      const url = new URL(`${ARKETA_URLS.prod}/${ARKETA_PARTNER_ID}/classes`);
      url.searchParams.set('limit', String(limit));
      if (cursor) url.searchParams.set('start_after', cursor);

      const { response } = await fetchWithRetry(url.toString(), { method: 'GET', headers });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Body unavailable');
        return new Response(
          JSON.stringify({ error: `Arketa classes API error: ${response.status}`, details: errorText }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      const page = Array.isArray(data) ? data : (data.items ?? data.classes ?? data.data ?? []);
      allClasses.push(...page);
      cursor = data.pagination?.nextCursor ?? (page.length === limit ? page[page.length - 1]?.id : undefined);
    } while (cursor);

    // Apply local date filtering based on request params
    const today = new Date();
    const defaultStart = new Date(today);
    defaultStart.setDate(defaultStart.getDate() - 30);
    const defaultEnd = new Date(today);
    defaultEnd.setDate(defaultEnd.getDate() + 7);
    const startDate = body.startDate ?? body.start_date ?? defaultStart.toISOString().split('T')[0];
    const endDate = body.endDate ?? body.end_date ?? defaultEnd.toISOString().split('T')[0];

    const syncBatchId = crypto.randomUUID();
    const syncedAt = new Date().toISOString();

    const stagingRows: Record<string, unknown>[] = [];
    for (const cls of allClasses) {
      const startTime = cls.start_time;
      if (!startTime) continue;

      const name = cls.name ?? cls.class_name ?? 'Unknown Class';
      const instructorName = cls.instructor_name ??
        (cls.instructor ? `${cls.instructor.first_name ?? ''} ${cls.instructor.last_name ?? ''}`.trim() : null);
      const dtf = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Los_Angeles',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const classDate = dtf.format(new Date(startTime));

      stagingRows.push({
        external_id: String(cls.id),
        class_date: classDate,
        start_time: startTime,
        duration_minutes: cls.duration_minutes ?? cls.duration ?? null,
        name,
        capacity: cls.capacity ?? cls.max_capacity ?? null,
        instructor_name: instructorName,
        is_cancelled: cls.is_cancelled ?? cls.cancelled ?? cls.canceled ?? false,
        is_deleted: cls.deleted ?? false,
        description: cls.description ?? null,
        booked_count: cls.total_booked ?? cls.booked_count ?? 0,
        waitlist_count: cls.waitlist_count ?? 0,
        status: cls.status ?? 'scheduled',
        room_name: cls.room?.name ?? null,
        location_id: cls.location_id ?? null,
        updated_at_api: cls.updated_at ?? cls.updatedAt ?? null,
        raw_data: cls,
        synced_at: syncedAt,
        sync_batch_id: syncBatchId,
      });
    }

    if (stagingRows.length > 0) {
      const chunkSize = 200;
      for (let i = 0; i < stagingRows.length; i += chunkSize) {
        const chunk = stagingRows.slice(i, i + chunkSize);
        const { error } = await supabase.from('arketa_classes_staging').insert(chunk);
        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: error.message, details: 'staging insert failed' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    const { data: upsertedCount, error: rpcError } = await supabase.rpc('upsert_arketa_classes_from_staging', {
      p_sync_batch_id: syncBatchId,
    });

    if (rpcError) {
      return new Response(
        JSON.stringify({ success: false, error: rpcError.message, details: 'upsert from staging failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const syncedCount = typeof upsertedCount === 'number' ? upsertedCount : stagingRows.length;

    return new Response(
      JSON.stringify({
        success: true,
        syncedCount,
        totalFetched: allClasses.length,
        startDate,
        endDate,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

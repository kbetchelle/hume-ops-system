/**
 * sync-arketa-classes: Populate arketa_classes for a date range.
 * See docs/ARKETA_ARCHITECTURE.md — arketa_classes is the master catalog of class_ids for reservation sync.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { fetchWithRetry } from '../_shared/retry.ts';
import { getArketaToken, getArketaHeaders, getArketaApiKeyHeaders, ARKETA_URLS } from '../_shared/arketaAuth.ts';

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
    const today = new Date();
    const defaultStart = new Date(today);
    defaultStart.setDate(defaultStart.getDate() - 30);
    const defaultEnd = new Date(today);
    defaultEnd.setDate(defaultEnd.getDate() + 7);
    const startDate = body.startDate ?? body.start_date ?? defaultStart.toISOString().split('T')[0];
    const endDate = body.endDate ?? body.end_date ?? defaultEnd.toISOString().split('T')[0];
    const limit = body.limit ?? 400;

    let headers: Record<string, string>;
    try {
      const token = await getArketaToken(supabaseUrl, supabaseKey);
      headers = getArketaHeaders(token);
    } catch {
      headers = getArketaApiKeyHeaders(ARKETA_API_KEY);
    }

    const allClasses: any[] = [];
    let cursor: string | undefined;

    do {
      const url = new URL(`${ARKETA_URLS.prod}/${ARKETA_PARTNER_ID}/classes`);
      url.searchParams.set('limit', String(limit));
      url.searchParams.set('start_date', startDate);
      url.searchParams.set('end_date', endDate);
      url.searchParams.set('include_cancelled', 'true');
      url.searchParams.set('include_past', 'true');
      url.searchParams.set('include_completed', 'true');
      if (cursor) url.searchParams.set('cursor', cursor);

      const { response } = await fetchWithRetry(url.toString(), { method: 'GET', headers });
      // Clone before reading so body-already-consumed errors are avoided
      const cloned = response.clone();
      if (!response.ok) {
        const text = await cloned.text().catch(() => 'Body unavailable');
        return new Response(
          JSON.stringify({ error: `Arketa classes API error: ${response.status}`, details: text }),
          { status: response.status >= 500 ? 502 : response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await cloned.json();
      const page = Array.isArray(data) ? data : (data.classes ?? data.data ?? data.items ?? []);
      allClasses.push(...page);
      cursor = data.pagination?.nextCursor;
    } while (cursor);

    let syncedCount = 0;
    for (const cls of allClasses) {
      const name = cls.name ?? cls.class_name ?? 'Unknown Class';
      const instructorName = cls.instructor_name ??
        (cls.instructor ? `${cls.instructor.first_name ?? ''} ${cls.instructor.last_name ?? ''}`.trim() : null);
      const startTime = cls.start_time;
      let classDate: string | null = null;
      if (startTime) {
        // Convert to America/Los_Angeles (PST/PDT) before extracting date
        const dtf = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/Los_Angeles',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
        classDate = dtf.format(new Date(startTime)); // returns YYYY-MM-DD
      }

      const { error } = await supabase
        .from('arketa_classes')
        .upsert(
          {
            external_id: String(cls.id),
            name,
            start_time: startTime,
            class_date: classDate,
            duration_minutes: cls.duration_minutes ?? cls.duration ?? null,
            capacity: cls.capacity ?? cls.max_capacity ?? null,
            booked_count: cls.total_booked ?? cls.booked_count ?? 0,
            waitlist_count: cls.waitlist_count ?? 0,
            status: cls.status ?? 'scheduled',
            is_cancelled: cls.is_cancelled ?? cls.cancelled ?? false,
            room_name: cls.room?.name ?? null,
            instructor_name: instructorName,
            raw_data: cls,
            synced_at: new Date().toISOString(),
          },
          { onConflict: 'external_id' }
        );

      if (!error) syncedCount++;
    }

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

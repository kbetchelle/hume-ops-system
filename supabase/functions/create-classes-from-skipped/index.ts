/**
 * create-classes-from-skipped: Creates arketa_classes entries for skipped reservation records
 * that have no matching class_id. Attempts to fetch from Arketa API first, falls back to stubs.
 * Then re-syncs reservations and refreshes daily schedule.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { fetchWithRetry } from '../_shared/retry.ts';
import { getArketaApiKeyHeaders, ARKETA_URLS } from '../_shared/arketaAuth.ts';

interface SkippedRecord {
  id: string;
  record_id: string;    // reservation_id
  secondary_id: string; // class_id
  details: {
    class_name?: string;
    class_date?: string;
    client_id?: string;
  } | null;
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
      return new Response(JSON.stringify({ success: false, error: 'Arketa credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json().catch(() => ({})) as { api_name?: string; record_ids?: string[] };

    // Fetch ALL skipped records with reason 'no_matching_class_id' (paginate to avoid 1000-row default limit)
    const PAGE_SIZE = 1000;
    let allSkippedRows: any[] = [];
    let page = 0;
    while (true) {
      let query = (supabase as any)
        .from('api_sync_skipped_records')
        .select('*')
        .eq('reason', 'no_matching_class_id')
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (body.api_name && body.api_name !== 'all') {
        query = query.eq('api_name', body.api_name);
      }
      if (body.record_ids?.length) {
        query = query.in('id', body.record_ids);
      }

      const { data: batch, error: fetchErr } = await query;
      if (fetchErr) throw new Error(`Failed to fetch skipped records: ${fetchErr.message}`);
      if (!batch?.length) break;
      allSkippedRows = allSkippedRows.concat(batch);
      if (batch.length < PAGE_SIZE) break;
      page++;
    }
    const skippedRows = allSkippedRows;
    console.log(`[create-classes-from-skipped] Fetched ${skippedRows.length} total skipped records`);
    if (!skippedRows?.length) {
      return new Response(JSON.stringify({ success: true, message: 'No skipped records to process', created: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const records = skippedRows as SkippedRecord[];
    const headers = getArketaApiKeyHeaders(ARKETA_API_KEY);

    // Group by unique class_id + class_date to avoid duplicate creation
    const classMap = new Map<string, { class_id: string; class_name: string; class_date: string; skipped_ids: string[] }>();
    for (const rec of records) {
      const classId = rec.secondary_id;
      const classDate = rec.details?.class_date;
      const className = rec.details?.class_name || 'Unknown Class';
      if (!classId) continue;

      const key = `${classId}::${classDate || 'unknown'}`;
      const existing = classMap.get(key);
      if (existing) {
        existing.skipped_ids.push(rec.id);
      } else {
        classMap.set(key, { class_id: classId, class_name: className, class_date: classDate || '', skipped_ids: [rec.id] });
      }
    }

    // Check which classes already exist
    const classIds = [...new Set([...classMap.values()].map(c => c.class_id))];
    const existingClassIds = new Set<string>();
    const CHUNK = 500;
    for (let i = 0; i < classIds.length; i += CHUNK) {
      const slice = classIds.slice(i, i + CHUNK);
      const { data: rows } = await supabase.from('arketa_classes').select('external_id').in('external_id', slice);
      for (const r of (rows ?? []) as { external_id: string }[]) existingClassIds.add(r.external_id);
    }

    // Filter to only missing classes
    const missing = [...classMap.values()].filter(c => !existingClassIds.has(c.class_id));
    console.log(`[create-classes-from-skipped] ${missing.length} missing classes to create (${existingClassIds.size} already exist)`);

    if (missing.length === 0) {
      // Classes already exist — just clean up skipped records
      const allSkippedIds = records.map(r => r.id);
      await (supabase as any).from('api_sync_skipped_records').delete().in('id', allSkippedIds);
      return new Response(JSON.stringify({ success: true, message: 'All classes already exist, cleaned up skipped records', created: 0, cleaned: allSkippedIds.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Try to fetch each class from API, fallback to stub
    let apiCreated = 0;
    let stubCreated = 0;
    const allSkippedIdsToClean: string[] = [];
    const syncBatchId = crypto.randomUUID();

    for (const entry of missing) {
      let classCreated = false;

      // Try API fetch first
      try {
        const classUrl = `${ARKETA_URLS.prod}/${ARKETA_PARTNER_ID}/classes/${entry.class_id}`;
        const { response } = await fetchWithRetry(classUrl, { method: 'GET', headers });

        if (response.ok) {
          const classData = await response.json();
          const cls = classData.items?.[0] || classData;

          if (cls && (cls.id || cls.external_id)) {
            const startTime = cls.start_time || cls.startTime;
            const classDate = entry.class_date || (startTime ? new Date(startTime).toISOString().split('T')[0] : null);

            const { error: insertErr } = await supabase.from('arketa_classes').upsert({
              external_id: String(cls.id || cls.external_id || entry.class_id),
              name: cls.name || cls.class_name || entry.class_name,
              start_time: startTime || new Date().toISOString(),
              class_date: classDate,
              duration_minutes: cls.duration_minutes || cls.duration || null,
              capacity: cls.capacity || cls.max_capacity || null,
              instructor_name: cls.instructor_name || (cls.instructor ? `${cls.instructor.first_name || ''} ${cls.instructor.last_name || ''}`.trim() : null),
              is_cancelled: cls.is_cancelled || cls.cancelled || false,
              description: cls.description || null,
              booked_count: cls.total_booked || cls.booked_count || 0,
              waitlist_count: cls.waitlist_count || 0,
              status: cls.status || 'scheduled',
              location_name: 'HUME',
              raw_data: cls,
              synced_at: new Date().toISOString(),
            }, { onConflict: 'external_id,class_date' });

            if (!insertErr) {
              classCreated = true;
              apiCreated++;
            }
          }
        }
      } catch {
        // API fetch failed, will use stub
      }

      // Fallback: create stub from skipped record data
      if (!classCreated) {
        const { error: stubErr } = await supabase.from('arketa_classes').upsert({
          external_id: entry.class_id,
          name: entry.class_name,
          start_time: new Date().toISOString(),
          class_date: entry.class_date || null,
          status: 'discovered_via_skipped_records',
          location_name: 'HUME',
          synced_at: new Date().toISOString(),
        }, { onConflict: 'external_id,class_date' });

        if (!stubErr) {
          stubCreated++;
          classCreated = true;
        } else {
          console.warn(`[create-classes-from-skipped] Failed to create stub for ${entry.class_id}: ${stubErr.message}`);
        }
      }

      if (classCreated) {
        allSkippedIdsToClean.push(...entry.skipped_ids);
      }
    }

    console.log(`[create-classes-from-skipped] Created ${apiCreated} from API, ${stubCreated} as stubs`);

    // Clean up processed skipped records
    if (allSkippedIdsToClean.length > 0) {
      for (let i = 0; i < allSkippedIdsToClean.length; i += CHUNK) {
        const slice = allSkippedIdsToClean.slice(i, i + CHUNK);
        await (supabase as any).from('api_sync_skipped_records').delete().in('id', slice);
      }
    }

    // Determine date range from created classes for re-sync
    const dates = missing.map(c => c.class_date).filter(Boolean).sort();
    const startDate = dates[0] || new Date().toISOString().split('T')[0];
    const endDate = dates[dates.length - 1] || startDate;

    // Re-sync reservations for the affected date range
    let resSyncResult: Record<string, unknown> = {};
    try {
      const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` };

      const resUrl = `${supabaseUrl}/functions/v1/sync-arketa-reservations`;
      const resResponse = await fetch(resUrl, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ startDate: startDate, endDate: endDate, triggeredBy: 'create-classes-from-skipped' }),
      });
      resSyncResult = resResponse.ok ? await resResponse.json().catch(() => ({})) : { error: await resResponse.text() };
    } catch (err) {
      resSyncResult = { error: err instanceof Error ? err.message : String(err) };
      console.warn('[create-classes-from-skipped] Re-sync reservations failed:', err);
    }

    // Sync from staging to history
    try {
      const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` };
      await fetch(`${supabaseUrl}/functions/v1/sync-from-staging`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ api: 'arketa_reservations', clear_staging: true }),
      });
    } catch (err) {
      console.warn('[create-classes-from-skipped] Sync-from-staging failed:', err);
    }

    // Refresh daily schedule
    try {
      const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}` };
      await fetch(`${supabaseUrl}/functions/v1/refresh-daily-schedule`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ start_date: startDate, end_date: endDate }),
      });
    } catch (err) {
      console.warn('[create-classes-from-skipped] Refresh daily schedule failed:', err);
    }

    return new Response(JSON.stringify({
      success: true,
      created: apiCreated + stubCreated,
      apiCreated,
      stubCreated,
      skippedCleaned: allSkippedIdsToClean.length,
      dateRange: { startDate, endDate },
      reservationSync: resSyncResult,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[create-classes-from-skipped] Error:', message);
    return new Response(JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

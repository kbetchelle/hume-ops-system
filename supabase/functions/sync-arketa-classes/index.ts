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

const MAX_PAGES = 30;

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
    const headers = getArketaApiKeyHeaders(ARKETA_API_KEY);

    // Compute date range for local filtering (default -7 to +30 days)
    const today = new Date();
    const defaultStart = new Date(today);
    defaultStart.setDate(defaultStart.getDate() - 7);
    const defaultEnd = new Date(today);
    defaultEnd.setDate(defaultEnd.getDate() + 30);
    const startDate = body.startDate ?? body.start_date ?? defaultStart.toISOString().split('T')[0];
    const endDate = body.endDate ?? body.end_date ?? defaultEnd.toISOString().split('T')[0];

    // --- Shared helpers ---

    const parseClassList = (data: unknown): any[] => {
      if (Array.isArray(data)) return data;
      const obj = data as Record<string, unknown>;
      return (obj.items ?? obj.data ?? obj.classes ?? []) as any[];
    };

    const extractPagination = (data: unknown): { nextCursor?: string; hasMore?: boolean } => {
      const obj = data as Record<string, unknown>;
      const p = obj.pagination as Record<string, unknown> | undefined;
      if (!p) return {};
      return { nextCursor: p.nextCursor as string | undefined, hasMore: p.hasMore as boolean | undefined };
    };

    const extractClassDate = (cls: any): string | null => {
      const st = cls.start_time ?? cls.startTime;
      if (!st) return cls.start_date ?? cls.startDate ?? cls.date ?? cls.class_date ?? null;
      try {
        const dtf = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/Los_Angeles',
          year: 'numeric', month: '2-digit', day: '2-digit',
        });
        return dtf.format(new Date(st));
      } catch { return null; }
    };

    const filterToRange = (list: any[]) =>
      list.filter(c => {
        const d = extractClassDate(c);
        return d && d >= startDate && d <= endDate;
      });

    // Returns true if every class on the page is past the target endDate (early exit signal)
    const allPastEndDate = (list: any[]): boolean => {
      if (list.length === 0) return false;
      return list.every(c => {
        const d = extractClassDate(c);
        return d && d > endDate;
      });
    };

    /**
     * Paginate through additional pages using cursor-based pagination.
     * Returns the classes collected across all subsequent pages plus total page count.
     */
    const paginateWithCursor = async (
      initialCursor: string | undefined,
      initialPageCount: number,
      baseUrl: string,
      extraParams?: Record<string, string>,
    ): Promise<{ classes: any[]; pageCount: number }> => {
      const collected: any[] = [];
      let cursor = initialCursor;
      let pageCount = initialPageCount;

      while (cursor && pageCount < MAX_PAGES) {
        try {
          const url = new URL(baseUrl);
          url.searchParams.set('limit', String(limit));
          url.searchParams.set('start_after', cursor);
          if (extraParams) {
            for (const [k, v] of Object.entries(extraParams)) url.searchParams.set(k, v);
          }

          console.log(`[classes-sync] Pagination page ${pageCount + 1}: cursor=${cursor}`);
          const { response } = await fetchWithRetry(url.toString(), { method: 'GET', headers });

          if (!response.ok) {
            console.log(`[classes-sync] Pagination page ${pageCount + 1} returned ${response.status}, stopping pagination`);
            break;
          }

          const data = await response.json();
          const pageClasses = parseClassList(data);
          const matched = filterToRange(pageClasses);
          const pagination = extractPagination(data);

          console.log(`[classes-sync] Page ${pageCount + 1}: ${pageClasses.length} classes, ${matched.length} in range`);
          collected.push(...matched);

          // Early exit: if all classes on this page are past the target range, stop
          if (allPastEndDate(pageClasses)) {
            console.log(`[classes-sync] All classes on page ${pageCount + 1} are past ${endDate}, stopping`);
            break;
          }

          cursor = pagination.nextCursor;
          if (pagination.hasMore === false) cursor = undefined;
          pageCount++;
        } catch (err) {
          console.log(`[classes-sync] Pagination error on page ${pageCount + 1}: ${err}`);
          break;
        }
      }

      return { classes: collected, pageCount };
    };

    // --- 3-tier fetch strategy ---
    const allClasses: any[] = [];
    let strategy = 'none';
    let totalPages = 0;
    const classesBaseUrl = `${ARKETA_URLS.prod}/${ARKETA_PARTNER_ID}/classes`;

    // Strategy A: Try reverse sort params to get newest classes first
    const sortParams = [
      { sort: 'created_at', order: 'desc' },
      { sort: 'start_time', order: 'desc' },
      { sort_by: 'date', sort_order: 'desc' },
      { order_by: 'start_date', direction: 'desc' },
    ];

    for (const params of sortParams) {
      if (allClasses.length > 0) break;
      try {
        const url = new URL(classesBaseUrl);
        url.searchParams.set('limit', String(limit));
        for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

        console.log(`[classes-sync] Strategy A: Trying reverse sort with ${JSON.stringify(params)}...`);
        const { response } = await fetchWithRetry(url.toString(), { method: 'GET', headers });

        if (response.ok) {
          const data = await response.json();
          const all = parseClassList(data);
          const matched = filterToRange(all);
          const pagination = extractPagination(data);

          const firstDate = extractClassDate(all[0]);
          const lastDate = extractClassDate(all[all.length - 1]);
          const isReversed = firstDate && lastDate && firstDate > lastDate;

          console.log(`[classes-sync] Strategy A: sort=${JSON.stringify(params)} → ${all.length} classes, range ${firstDate}–${lastDate}, reversed=${isReversed}, ${matched.length} in target window, nextCursor=${pagination.nextCursor ?? 'none'}`);

          if (matched.length > 0) {
            allClasses.push(...matched);
            strategy = `reverse_sort:${Object.values(params).join(',')}`;
            totalPages = 1;

            // Paginate for more
            if (pagination.nextCursor) {
              const { classes: more, pageCount } = await paginateWithCursor(
                pagination.nextCursor, 1, classesBaseUrl, params as Record<string, string>
              );
              allClasses.push(...more);
              totalPages = pageCount;
              console.log(`[classes-sync] Strategy A pagination: ${more.length} additional classes across ${pageCount - 1} extra pages`);
            }
            break;
          }
          if (!isReversed) continue;
        } else {
          console.log(`[classes-sync] Strategy A: sort ${JSON.stringify(params)} returned ${response.status}, trying next...`);
        }
      } catch {
        continue;
      }
    }

    // Strategy B: Cursor skip-ahead using a known recent class ID from the DB
    if (allClasses.length === 0) {
      const { data: cursorRow } = await supabase
        .from('arketa_classes')
        .select('external_id, class_date')
        .lt('class_date', startDate)
        .order('class_date', { ascending: false })
        .limit(1);

      const skipCursor = (cursorRow as { external_id: string; class_date: string }[] | null)?.[0];

      if (skipCursor) {
        console.log(`[classes-sync] Strategy B: Cursor skip-ahead from class ${skipCursor.external_id} (date ${skipCursor.class_date})...`);
        try {
          const url = new URL(classesBaseUrl);
          url.searchParams.set('limit', String(limit));
          url.searchParams.set('start_after', skipCursor.external_id);

          const { response } = await fetchWithRetry(url.toString(), { method: 'GET', headers });

          if (response.ok) {
            const data = await response.json();
            const all = parseClassList(data);
            const matched = filterToRange(all);
            const pagination = extractPagination(data);
            const firstDate = extractClassDate(all[0]);
            const lastDate = extractClassDate(all[all.length - 1]);

            console.log(`[classes-sync] Strategy B: Cursor skip returned ${all.length} classes, range ${firstDate}–${lastDate}, ${matched.length} in target window, nextCursor=${pagination.nextCursor ?? 'none'}`);
            if (matched.length > 0 || all.length > 0) {
              allClasses.push(...matched);
              strategy = 'cursor_skip_ahead';
              totalPages = 1;

              // Paginate for more
              if (pagination.nextCursor) {
                const { classes: more, pageCount } = await paginateWithCursor(
                  pagination.nextCursor, 1, classesBaseUrl
                );
                allClasses.push(...more);
                totalPages = pageCount;
                console.log(`[classes-sync] Strategy B pagination: ${more.length} additional classes across ${pageCount - 1} extra pages`);
              }
            }
          } else {
            console.log(`[classes-sync] Strategy B: Cursor skip returned ${response.status}`);
          }
        } catch (err) {
          console.log(`[classes-sync] Strategy B: Cursor skip failed: ${err}`);
        }
      } else {
        console.log('[classes-sync] Strategy B: No earlier class found in DB for cursor skip-ahead');
      }
    }

    // Strategy C: Plain first page (original fallback behavior)
    if (allClasses.length === 0) {
      console.log('[classes-sync] Strategy C: Falling back to plain first page fetch...');
      try {
        const url = new URL(classesBaseUrl);
        url.searchParams.set('limit', String(limit));

        const { response } = await fetchWithRetry(url.toString(), { method: 'GET', headers });

        if (response.ok) {
          const data = await response.json();
          const all = parseClassList(data);
          const matched = filterToRange(all);
          const pagination = extractPagination(data);

          console.log(`[classes-sync] Strategy C: Plain fetch returned ${all.length} classes, ${matched.length} in target window, nextCursor=${pagination.nextCursor ?? 'none'}`);
          allClasses.push(...matched);
          strategy = 'plain_first_page';
          totalPages = 1;

          // Paginate for more
          if (pagination.nextCursor) {
            const { classes: more, pageCount } = await paginateWithCursor(
              pagination.nextCursor, 1, classesBaseUrl
            );
            allClasses.push(...more);
            totalPages = pageCount;
            console.log(`[classes-sync] Strategy C pagination: ${more.length} additional classes across ${pageCount - 1} extra pages`);
          }
        }
      } catch (err) {
        console.log(`[classes-sync] Strategy C: Plain fetch failed: ${err}`);
      }
    }

    if (strategy === 'none' && allClasses.length === 0) {
      strategy = 'none_matched';
    }

    console.log(`[classes-sync] Final: ${allClasses.length} classes via strategy '${strategy}' (${totalPages} pages) for range ${startDate}–${endDate}`);

    const syncBatchId = crypto.randomUUID();
    const syncedAt = new Date().toISOString();

    const stagingRows: Record<string, unknown>[] = [];
    for (const cls of allClasses) {
      const startTime = cls.start_time ?? cls.startTime;
      if (!startTime) continue;

      const name = cls.name ?? cls.class_name ?? 'Unknown Class';
      const instructorName = cls.instructor_name ??
        (cls.instructor ? `${cls.instructor.first_name ?? ''} ${cls.instructor.last_name ?? ''}`.trim() : null);
      const classDate = extractClassDate(cls) ?? new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Los_Angeles',
        year: 'numeric', month: '2-digit', day: '2-digit',
      }).format(new Date(startTime));

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
        pagesFetched: totalPages,
        startDate,
        endDate,
        strategy,
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

import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { fetchWithRetry } from '../_shared/retry.ts';
import { ARKETA_URLS } from '../_shared/arketaAuth.ts';
import { createSyncLogger, logSyncMetrics } from '../_shared/logger.ts';
import { logApiCall } from '../_shared/apiLogger.ts';

// No MAX_PAGES limit - fetch all pages

interface ArketaReservation {
  id: string;
  class_id?: string;
  client_id?: string;
  client?: { id?: string; firstName?: string; lastName?: string; email?: string; first_name?: string; last_name?: string; phone?: string };
  reservation_type?: string;
  late_cancel?: boolean;
  gross_amount_paid?: number;
  net_amount_paid?: number;
  created_at?: string;
  updated_at?: string;
  checked_in?: boolean;
  status?: string;
  checkedInAt?: string;
  checked_in_at?: string;
  start_time?: string;
  spot_id?: string;
  spot_name?: string;
}

interface SyncRequest {
  start_date?: string;
  end_date?: string;
  startDate?: string;
  endDate?: string;
  class_id?: string;
  limit?: number;
  triggeredBy?: string;
  isHistorical?: boolean;
}

type ReservationWithMeta = ArketaReservation & { class_name?: string; class_date?: string };

// See docs/ARKETA_ARCHITECTURE.md: reservations are nested under classes; 3-tier fetch (direct /reservations → DB-driven → classes-based).
async function fetchAllReservations(
  partnerId: string,
  headers: Record<string, string>,
  startDate: string,
  endDate: string,
  limit: number,
  supabase: ReturnType<typeof createClient>,
  classId?: string,
  logger?: ReturnType<typeof createSyncLogger>
): Promise<{ reservations: ReservationWithMeta[]; totalAttempts: number; pagesProcessed: number }> {
  let totalAttempts = 0;
  let pagesProcessed = 0;

  // If a specific classId is provided, fetch reservations for that class only
  if (classId) {
    const allRes: ReservationWithMeta[] = [];
    let resCursor: string | undefined;
    do {
      const url = new URL(`${ARKETA_URLS.prod}/${partnerId}/classes/${classId}/reservations`);
      url.searchParams.set('limit', String(limit));
      if (resCursor) url.searchParams.set('start_after', resCursor);
      logger?.info(`Fetching reservations for class ${classId}...`);

      const { response, attempts } = await fetchWithRetry(url.toString(), { method: 'GET', headers });
      totalAttempts += attempts;
      pagesProcessed++;

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Arketa API error: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      const page: ArketaReservation[] = Array.isArray(responseData)
        ? responseData
        : (responseData.items || responseData.data || responseData.reservations || responseData.bookings || []);
      allRes.push(...(page as ReservationWithMeta[]));
      resCursor = responseData.pagination?.nextCursor ?? (page.length === limit ? page[page.length - 1]?.id : undefined);
    } while (resCursor);

    return { reservations: allRes, totalAttempts, pagesProcessed };
  }

  // Tier 1: Try direct /reservations (and fallback variants) with pagination
  const tier1Endpoints = [
    `${ARKETA_URLS.prod}/${partnerId}/reservations`,
    `${ARKETA_URLS.prod}/${partnerId}/bookings`,
    `${ARKETA_URLS.prod}/${partnerId}/schedule/reservations`,
  ];
  for (const tier1Base of tier1Endpoints) {
    try {
      const allTier1: ReservationWithMeta[] = [];
      let tier1Cursor: string | undefined;
      let tier1Failed = false;
      do {
        const url = new URL(tier1Base);
        url.searchParams.set('start_date', startDate);
        url.searchParams.set('end_date', endDate);
        url.searchParams.set('limit', String(limit));
        if (tier1Cursor) url.searchParams.set('start_after', tier1Cursor);

        const { response, attempts } = await fetchWithRetry(url.toString(), { method: 'GET', headers });
        totalAttempts += attempts;
        pagesProcessed++;
        if (!response.ok) { tier1Failed = true; break; }
        const data = await response.json();
        const list = Array.isArray(data) ? data : (data.items || data.data || data.reservations || data.bookings || []);
        if (list.length === 0) break;
        const withMeta: ReservationWithMeta[] = list.map((r: ArketaReservation) => ({
          ...r,
          class_id: r.class_id ?? (r as { classId?: string }).classId,
          class_name: (r as ReservationWithMeta).class_name ?? null,
          class_date: (r as ReservationWithMeta).class_date ?? (r.start_time ? new Date(r.start_time).toISOString().split('T')[0] : null),
        }));
        allTier1.push(...withMeta);
        tier1Cursor = data.pagination?.nextCursor ?? (list.length === limit ? list[list.length - 1]?.id : undefined);
      } while (tier1Cursor);

      if (!tier1Failed && allTier1.length > 0) {
        logger?.info(`Tier 1 returned ${allTier1.length} reservations`);
        return { reservations: allTier1, totalAttempts, pagesProcessed };
      }
    } catch {
      continue;
    }
  }

  // Tier 2: Per-class reservations (DB-driven from local arketa_classes for the date range)
  logger?.info(`Tier 2: Fetching per-class reservations for ${startDate} to ${endDate}...`);

  // Get class IDs from local DB for the date range
  const { data: classRows } = await supabase
    .from('arketa_classes')
    .select('external_id, name, start_time, class_date')
    .gte('class_date', startDate)
    .lte('class_date', endDate);

  let classes = (classRows ?? []) as { external_id: string; name?: string; start_time?: string; class_date?: string }[];
  logger?.info(`Found ${classes.length} classes in DB for date range`);

  // Tier 3: If DB has 0 classes, discover class IDs from the API using smart strategies
  if (classes.length === 0) {
    logger?.info(`Tier 3: No classes in DB for ${startDate}–${endDate}, trying API discovery...`);

    const parseClassList = (data: unknown): Record<string, unknown>[] => {
      if (Array.isArray(data)) return data;
      const obj = data as Record<string, unknown>;
      return (obj.items || obj.data || obj.classes || []) as Record<string, unknown>[];
    };

    const mapClassRecord = (c: Record<string, unknown>) => {
      const classDate = (c.start_date || c.startDate || c.date || c.class_date ||
        (c.start_time ? new Date(c.start_time as string).toISOString().split('T')[0] : null)) as string | null;
      return {
        external_id: String(c.id || c.external_id || ''),
        name: (c.name || c.title || 'Unknown Class') as string,
        start_time: (c.start_time || c.startTime || '') as string,
        class_date: classDate,
      };
    };

    const filterToRange = (list: ReturnType<typeof mapClassRecord>[]) =>
      list.filter(c => c.class_date && c.external_id && c.class_date >= startDate && c.class_date <= endDate);

    // Accumulate results across ALL strategies, then deduplicate
    const discoveredMap = new Map<string, ReturnType<typeof mapClassRecord>>();
    const addDiscovered = (items: ReturnType<typeof mapClassRecord>[], label: string) => {
      let added = 0;
      for (const item of items) {
        const key = `${item.external_id}::${item.class_date}`;
        if (!discoveredMap.has(key)) {
          discoveredMap.set(key, item);
          added++;
        }
      }
      logger?.info(`${label}: ${added} new unique classes added (${items.length} total matched, ${discoveredMap.size} cumulative)`);
    };

    /**
     * Decode cursor to avoid double-encoding by URL.searchParams.set().
     * API returns e.g. "classes%2FP8k22..." which must be decoded first.
     */
    const decodeCursor = (cursor: string): string => {
      try { return decodeURIComponent(cursor); } catch { return cursor; }
    };

    // Strategy A: Try reverse sort params to get newest classes first
    const sortParams = [
      { sort: 'created_at', order: 'desc' },
      { sort: 'start_time', order: 'desc' },
      { sort_by: 'date', sort_order: 'desc' },
      { order_by: 'start_date', direction: 'desc' },
    ];

    for (const params of sortParams) {
      try {
        const url = new URL(`${ARKETA_URLS.prod}/${partnerId}/classes`);
        url.searchParams.set('limit', '500');
        for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

        logger?.info(`Tier 3A: Trying reverse sort with ${JSON.stringify(params)}...`);
        const { response, attempts } = await fetchWithRetry(url.toString(), { method: 'GET', headers });
        totalAttempts += attempts;

        if (response.ok) {
          const data = await response.json();
          const all = parseClassList(data).map(mapClassRecord);
          const matched = filterToRange(all);

          const firstDate = all[0]?.class_date;
          const lastDate = all[all.length - 1]?.class_date;
          const isReversed = firstDate && lastDate && firstDate > lastDate;

          logger?.info(`Tier 3A: sort=${JSON.stringify(params)} → ${all.length} classes, range ${firstDate}–${lastDate}, reversed=${isReversed}, ${matched.length} in target window`);

          if (matched.length > 0) {
            addDiscovered(matched, `Tier 3A (${JSON.stringify(params)})`);
          }
          // If not reversed, this sort param had no effect — try next
          if (!isReversed) continue;
        } else {
          logger?.info(`Tier 3A: sort ${JSON.stringify(params)} returned ${response.status}, trying next...`);
        }
      } catch {
        continue;
      }
    }

    // Strategy B: Cursor skip-ahead with PAGINATION using full nextStartAfterId
    {
      const { data: cursorRow } = await supabase
        .from('arketa_classes')
        .select('external_id, class_date')
        .lt('class_date', startDate)
        .order('class_date', { ascending: false })
        .limit(1);

      const skipCursor = (cursorRow as { external_id: string; class_date: string }[] | null)?.[0];

      if (skipCursor) {
        logger?.info(`Tier 3B: Cursor skip-ahead from class ${skipCursor.external_id} (date ${skipCursor.class_date})...`);

        // Use the full cursor format: classes/{external_id}
        let currentCursor = `classes/${skipCursor.external_id}`;
        let pageCount = 0;
        const MAX_DISCOVERY_PAGES = 30;
        let pastTargetRange = false;

        while (pageCount < MAX_DISCOVERY_PAGES && !pastTargetRange) {
          try {
            const url = new URL(`${ARKETA_URLS.prod}/${partnerId}/classes`);
            url.searchParams.set('limit', '100');
            url.searchParams.set('start_after', decodeCursor(currentCursor));

            const { response, attempts } = await fetchWithRetry(url.toString(), { method: 'GET', headers });
            totalAttempts += attempts;
            pageCount++;

            if (!response.ok) {
              logger?.warn(`Tier 3B: Page ${pageCount} returned ${response.status}, stopping`);
              break;
            }

            const data = await response.json();
            const pageClasses = parseClassList(data).map(mapClassRecord);

            if (pageClasses.length === 0) {
              logger?.info(`Tier 3B: Page ${pageCount} returned 0 classes, done`);
              break;
            }

            const matched = filterToRange(pageClasses);
            if (matched.length > 0) {
              addDiscovered(matched, `Tier 3B page ${pageCount}`);
            }

            // Check if we've gone past the target range
            const lastClassDate = pageClasses[pageClasses.length - 1]?.class_date;
            if (lastClassDate && lastClassDate > endDate) {
              logger?.info(`Tier 3B: Last class date ${lastClassDate} > endDate ${endDate}, stopping`);
              pastTargetRange = true;
              break;
            }

            // Get next cursor from pagination response
            const obj = data as Record<string, unknown>;
            const pagination = obj.pagination as Record<string, unknown> | undefined;
            const nextCursor = (pagination?.nextStartAfterId ?? pagination?.nextCursor) as string | undefined;
            const hasMore = pagination?.hasMore as boolean | undefined;

            if (!nextCursor || hasMore === false) {
              logger?.info(`Tier 3B: No more pages after page ${pageCount}`);
              break;
            }

            currentCursor = nextCursor;

            // Stop if fewer than limit returned (last page)
            if (pageClasses.length < 100) break;
          } catch (err) {
            logger?.warn(`Tier 3B: Page ${pageCount} failed`, err as object);
            break;
          }
        }

        logger?.info(`Tier 3B: Completed ${pageCount} pages`);
      } else {
        logger?.info('Tier 3B: No earlier class found in DB for cursor skip-ahead');
      }
    }

    // Strategy C: Plain first page fetch (always runs to catch anything missed)
    {
      logger?.info('Tier 3C: Fetching plain first page...');
      try {
        const url = new URL(`${ARKETA_URLS.prod}/${partnerId}/classes`);
        url.searchParams.set('limit', '500');
        const { response, attempts } = await fetchWithRetry(url.toString(), { method: 'GET', headers });
        totalAttempts += attempts;

        if (response.ok) {
          const data = await response.json();
          const all = parseClassList(data).map(mapClassRecord);
          const matched = filterToRange(all);
          if (matched.length > 0) {
            addDiscovered(matched, 'Tier 3C');
          }
          logger?.info(`Tier 3C: Plain fetch returned ${all.length} classes, ${matched.length} in target window`);
        }
      } catch {
        logger?.warn('Tier 3C: Plain fetch failed');
      }
    }

    let discovered = [...discoveredMap.values()];
    logger?.info(`Tier 3 total: ${discovered.length} unique classes discovered across all strategies`);

    // Persist discovered classes as stubs
    if (discovered.length > 0) {
      classes = discovered as any;
      const stubRows = discovered.map(c => ({
        external_id: c.external_id,
        name: c.name,
        start_time: c.start_time || new Date().toISOString(),
        class_date: c.class_date ?? undefined,
        status: 'discovered_via_reservation_sync',
        synced_at: new Date().toISOString(),
      }));
      const { error: stubErr } = await supabase
        .from('arketa_classes')
        .upsert(stubRows as any, { onConflict: 'external_id,class_date' });
      if (stubErr) {
        logger?.warn('Failed to insert stub classes', stubErr);
      } else {
        logger?.info(`Inserted ${stubRows.length} stub classes into arketa_classes`);
      }
    } else {
      logger?.warn(`Tier 3: All strategies exhausted — no classes found for ${startDate}–${endDate}`);
    }
  }

  logger?.info(`Fetching reservations for ${classes.length} classes...`);

  const allReservations: ReservationWithMeta[] = [];
  for (const cls of classes) {
    const cid = cls.external_id;
    const className = cls.name || 'Unknown Class';
    const classDate = cls.class_date ?? (cls.start_time ? new Date(cls.start_time).toISOString().split('T')[0] : undefined);

    let resCursor: string | undefined;
    do {
      const resUrl = new URL(`${ARKETA_URLS.prod}/${partnerId}/classes/${cid}/reservations`);
      resUrl.searchParams.set('limit', String(limit));
      if (resCursor) resUrl.searchParams.set('start_after', resCursor);

      try {
        const { response, attempts } = await fetchWithRetry(resUrl.toString(), { method: 'GET', headers });
        totalAttempts += attempts;
        pagesProcessed++;

        if (!response.ok) {
          if (response.status === 404) break;
          logger?.warn(`Error fetching reservations for class ${cid}: ${response.status}`);
          break;
        }

        const resData = await response.json();
        const reservations: ArketaReservation[] = Array.isArray(resData)
          ? resData
          : (resData.items || resData.data || resData.reservations || resData.bookings || []);

        for (const res of reservations) {
          if (!res.class_id) res.class_id = cid;
          allReservations.push({ ...res, class_name: className, class_date: classDate });
        }
        resCursor = resData.pagination?.nextCursor ?? (reservations.length === limit ? reservations[reservations.length - 1]?.id : undefined);
      } catch (err) {
        logger?.warn(`Failed to fetch reservations for class ${cid}`);
        break;
      }
    } while (resCursor);
  }

  logger?.info(`Total fetched: ${allReservations.length} reservations from ${classes.length} classes`);

  return { reservations: allReservations, totalAttempts, pagesProcessed };
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

    const logger = createSyncLogger('arketa_reservations');
    const startTime = Date.now();

    const body = await req.json().catch(() => ({})) as SyncRequest;
    const today = new Date();
    const defaultStart = new Date(today);
    defaultStart.setDate(defaultStart.getDate() - 7);
    const defaultEnd = new Date(today);
    defaultEnd.setDate(defaultEnd.getDate() + 7);
    const startDate = body.startDate || body.start_date || defaultStart.toISOString().split('T')[0];
    const endDate = body.endDate || body.end_date || defaultEnd.toISOString().split('T')[0];
    const limit = body.limit || 500;

    logger.info(`Syncing reservations from ${startDate} to ${endDate}`);

    // Reservations endpoint uses API key as Bearer token
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${ARKETA_API_KEY}`,
      'Content-Type': 'application/json',
    };

    // Fetch all reservations with pagination
    const { reservations, totalAttempts, pagesProcessed } = await fetchAllReservations(
      ARKETA_PARTNER_ID,
      headers,
      startDate,
      endDate,
      limit,
      supabase as any,
      body.class_id,
      logger
    );

    logger.info(`Total fetched: ${reservations.length} reservations in ${pagesProcessed} page(s), ${totalAttempts} API attempt(s)`);

    // Map to CSV fields only - write to staging
    const syncBatchId = crypto.randomUUID();
    const checkedIn = (r: ArketaReservation) => r.checked_in === true || ['checked_in', 'ATTENDED', 'attended', 'completed', 'COMPLETED'].includes(r.status || '');
    const stagingRows = reservations
      .map((res) => {
        const resWithClass = res as ArketaReservation & { class_name?: string; class_date?: string };
        return {
          client_id: ((v: unknown) => v != null ? String(v) : null)(res.client_id ?? res.client?.id),
          reservation_id: String(res.id),
          reservation_type: res.reservation_type ?? (res as { type?: string }).type ?? 'class',
          class_id: String(res.class_id || ''),
          class_name: resWithClass.class_name ?? (res as { class_name?: string }).class_name ?? null,
          status: res.status || 'booked',
          checked_in: checkedIn(res),
          checked_in_at: res.checkedInAt || res.checked_in_at || null,
          late_cancel: res.late_cancel ?? (res as { lateCancel?: boolean }).lateCancel ?? false,
          gross_amount_paid: res.gross_amount_paid ?? (res as { grossAmountPaid?: number }).grossAmountPaid ?? (res as { amount?: number }).amount ?? 0,
          net_amount_paid: res.net_amount_paid ?? (res as { netAmountPaid?: number }).netAmountPaid ?? (res as { amount?: number }).amount ?? 0,
          class_date: resWithClass.class_date ?? (res as { class_date?: string }).class_date ?? null,
          created_at_api: res.created_at ?? null,
          updated_at_api: res.updated_at ?? (res as { updatedAt?: string }).updatedAt ?? null,
          spot_id: res.spot_id ?? (res as { spotId?: string }).spotId ?? null,
          spot_name: res.spot_name ?? (res as { spotName?: string }).spotName ?? null,
          client_email: res.client?.email ?? null,
          client_first_name: res.client?.first_name ?? res.client?.firstName ?? null,
          client_last_name: res.client?.last_name ?? res.client?.lastName ?? null,
          client_phone: res.client?.phone ?? null,
          sync_batch_id: syncBatchId,
          raw_data: res,
        };
      })
      .filter((r) => r.reservation_id);

    // Identify rows with no matching class_id and auto-upsert stubs for unknown classes
    const classIdsInBatch = [...new Set(stagingRows.map((r) => r.class_id).filter((id): id is string => Boolean(id && id.trim())))];
    let knownClassIds = new Set<string>();
    if (classIdsInBatch.length > 0) {
      const CHUNK = 500;
      for (let i = 0; i < classIdsInBatch.length; i += CHUNK) {
        const slice = classIdsInBatch.slice(i, i + CHUNK);
        const { data: classRows } = await supabase
          .from('arketa_classes')
          .select('external_id')
          .in('external_id', slice)
          .limit(slice.length);
        for (const r of (classRows ?? []) as { external_id: string }[]) {
          knownClassIds.add(r.external_id);
        }
      }
    }

    // Find reservations with unknown class_ids and auto-create stub class records
    const unknownClassRows = stagingRows.filter(
      (r) => Boolean(r.class_id?.trim()) && !knownClassIds.has(r.class_id)
    );
    if (unknownClassRows.length > 0) {
      // Build stub class records from reservation metadata (dedupe by external_id+class_date)
      const stubMap = new Map<string, { external_id: string; name: string; start_time: string; class_date: string; status: string; synced_at: string }>();
      for (const r of unknownClassRows) {
        const key = `${r.class_id}::${r.class_date ?? 'unknown'}`;
        if (!stubMap.has(key) && r.class_date) {
          stubMap.set(key, {
            external_id: r.class_id,
            name: r.class_name || 'Unknown Class',
            start_time: `${r.class_date}T00:00:00+00`,
            class_date: r.class_date,
            status: 'stub_from_res_sync',
            synced_at: new Date().toISOString(),
          });
        }
      }
      const stubRows = [...stubMap.values()];
      if (stubRows.length > 0) {
        const { error: stubErr } = await supabase
          .from('arketa_classes')
          .upsert(stubRows as any, { onConflict: 'external_id,class_date' });
        if (stubErr) {
          logger?.warn(`Failed to insert ${stubRows.length} stub classes: ${stubErr.message}`);
        } else {
          logger?.info(`Auto-created ${stubRows.length} stub classes for unknown class_ids`);
          // Add newly created stubs to known set so their reservations get inserted
          for (const s of stubRows) knownClassIds.add(s.external_id);
        }
      }
    }

    // Log rows with empty class_id (truly invalid)
    const skippedRows = stagingRows.filter((r) => !r.class_id?.trim());
    if (skippedRows.length > 0) {
      const skippedRecords = skippedRows.map((r) => ({
        api_name: 'arketa_reservations',
        record_id: r.reservation_id,
        secondary_id: r.class_id || null,
        reason: 'empty_class_id',
        details: {
          class_name: r.class_name,
          class_date: r.class_date,
          client_id: r.client_id,
        } as Record<string, unknown>,
      }));
      await supabase.from('api_sync_skipped_records').insert(skippedRecords);
      logger?.info(`Logged ${skippedRows.length} reservations with empty class_id to api_sync_skipped_records`);
    }

    // Insert all rows with a valid class_id (stubs were auto-created above)
    let rowsToInsert = stagingRows.filter(
      (r) => Boolean(r.class_id?.trim()) && knownClassIds.has(r.class_id)
    );
    // Staging table has UNIQUE(reservation_id, sync_batch_id): one row per reservation per batch. Dedupe to avoid constraint violation.
    const seenByReservation = new Map<string, typeof rowsToInsert[0]>();
    for (const r of rowsToInsert) {
      const key = `${r.reservation_id}:${r.sync_batch_id}`;
      if (!seenByReservation.has(key)) seenByReservation.set(key, r);
    }
    rowsToInsert = [...seenByReservation.values()];
    let failedCount = 0;
    let insertError: string | null = null;
    if (rowsToInsert.length > 0) {
      const { error } = await supabase.from('arketa_reservations_staging').insert(rowsToInsert);
      if (error) {
        insertError = error.message;
        logger.error('Failed to insert to staging', error);
        failedCount = rowsToInsert.length;
      }
    }
    const syncedCount = rowsToInsert.length - failedCount;

    const durationMs = Date.now() - startTime;
    await logSyncMetrics(supabase, {
      syncType: 'arketa_reservations',
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs,
      recordsFetched: reservations.length,
      recordsSynced: syncedCount,
      recordsFailed: failedCount,
      retryCount: totalAttempts - pagesProcessed,
    });
    await supabase
      .from('api_sync_status')
      .upsert({
        api_name: 'arketa_reservations',
        last_sync_at: new Date().toISOString(),
        last_sync_success: failedCount === 0,
        last_records_processed: reservations.length,
        last_records_inserted: syncedCount,
      }, { onConflict: 'api_name' });
    await logApiCall(supabase, {
      apiName: 'arketa_reservations',
      endpoint: '/reservations',
      syncSuccess: failedCount === 0,
      durationMs,
      recordsProcessed: reservations.length,
      recordsInserted: syncedCount,
      responseStatus: 200,
      triggeredBy: body.triggeredBy || 'manual',
    });

    // Refresh daily_schedule for the synced date range (after reservations are in staging; trigger will refresh again when sync-from-staging runs)
    try {
      const refreshUrl = `${supabaseUrl}/functions/v1/refresh-daily-schedule`;
      await fetch(refreshUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ start_date: startDate, end_date: endDate }),
      });
    } catch (refreshErr) {
      logger?.warn('Failed to call refresh-daily-schedule', refreshErr as object);
    }

    return new Response(
      JSON.stringify({
        success: failedCount === 0,
        ...(insertError && { error: insertError }),
        data: {
          reservations_synced: syncedCount,
          records_processed: reservations.length,
          records_inserted: syncedCount,
        },
        totalFetched: reservations.length,
        syncedCount,
        failedCount,
        dateRange: { startDate, endDate },
        pagesProcessed,
        apiAttempts: totalAttempts,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const logger = createSyncLogger('arketa_reservations');
    logger.error('Sync failed', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    // Log failure to api_logs (need supabase client for this)
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      await logApiCall(supabase, {
        apiName: 'arketa_reservations',
        endpoint: '/reservations',
        syncSuccess: false,
        durationMs: 0,
        recordsProcessed: 0,
        recordsInserted: 0,
        responseStatus: 500,
        errorMessage: errorMessage,
        triggeredBy: 'manual',
      });
    } catch (logError) {
      console.error('[sync-arketa-reservations] Failed to log error to api_logs:', logError);
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

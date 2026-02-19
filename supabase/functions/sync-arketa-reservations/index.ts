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

  // Tier 3: If DB has 0 classes, fetch class IDs directly from the API (first page only)
  if (classes.length === 0) {
    logger?.info(`Tier 3: No classes in DB, fetching classes directly from API to discover class IDs...`);
    try {
      const classesUrl = new URL(`${ARKETA_URLS.prod}/${partnerId}/classes`);
      classesUrl.searchParams.set('limit', '500');
      // Don't set start_date/end_date - those cause 500 errors on Arketa
      const { response: classesResponse, attempts: classAttempts } = await fetchWithRetry(
        classesUrl.toString(),
        { method: 'GET', headers }
      );
      totalAttempts += classAttempts;

      if (classesResponse.ok) {
        const classesData = await classesResponse.json();
        const classList = Array.isArray(classesData)
          ? classesData
          : (classesData.items || classesData.data || classesData.classes || []);

        // Filter locally to the target date range
        const filteredClasses = classList
          .map((c: Record<string, unknown>) => {
            const classDate = (c.start_date || c.startDate || c.date || c.class_date || 
              (c.start_time ? new Date(c.start_time as string).toISOString().split('T')[0] : null)) as string | null;
            return {
              external_id: String(c.id || c.external_id || ''),
              name: (c.name || c.title || 'Unknown Class') as string,
              start_time: (c.start_time || c.startTime || '') as string,
              class_date: classDate,
            };
          })
          .filter((c: { external_id: string; class_date: string | null }) => {
            if (!c.class_date || !c.external_id) return false;
            return c.class_date >= startDate && c.class_date <= endDate;
          });

        logger?.info(`Tier 3: API returned ${classList.length} classes total, ${filteredClasses.length} match date range ${startDate}–${endDate}`);
        classes = filteredClasses;

        // Also insert these as stub classes into arketa_classes so future syncs don't need Tier 3
        if (filteredClasses.length > 0) {
          const stubRows = filteredClasses.map((c: { external_id: string; name: string; start_time: string; class_date: string | null }) => ({
            external_id: c.external_id,
            name: c.name,
            start_time: c.start_time || new Date().toISOString(),
            class_date: c.class_date,
            status: 'discovered_via_reservation_sync',
            synced_at: new Date().toISOString(),
          }));
          const { error: stubErr } = await supabase
            .from('arketa_classes')
            .upsert(stubRows, { onConflict: 'external_id,class_date' });
          if (stubErr) {
            logger?.warn('Failed to insert stub classes', stubErr);
          } else {
            logger?.info(`Inserted ${stubRows.length} stub classes into arketa_classes`);
          }
        }
      } else {
        logger?.warn(`Tier 3: Classes API returned ${classesResponse.status}, cannot discover class IDs from API`);
      }
    } catch (tier3Err) {
      logger?.warn('Tier 3: Failed to fetch classes from API', tier3Err as object);
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

    // Identify rows with no matching class_id (empty or not in arketa_classes) and log to api_sync_skipped_records
    const classIdsInBatch = [...new Set(stagingRows.map((r) => r.class_id).filter((id): id is string => Boolean(id && id.trim())))];
    let knownClassIds = new Set<string>();
    if (classIdsInBatch.length > 0) {
      // Chunk the lookup to avoid the default 1000-row PostgREST limit
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
    const skippedRows = stagingRows.filter(
      (r) => !r.class_id?.trim() || !knownClassIds.has(r.class_id)
    );
    if (skippedRows.length > 0) {
      const skippedRecords = skippedRows.map((r) => ({
        api_name: 'arketa_reservations',
        record_id: r.reservation_id,
        secondary_id: r.class_id || null,
        reason: 'no_matching_class_id',
        details: {
          class_name: r.class_name,
          class_date: r.class_date,
          client_id: r.client_id,
        } as Record<string, unknown>,
      }));
      await supabase.from('api_sync_skipped_records').insert(skippedRecords);
      logger?.info(`Logged ${skippedRows.length} reservations with no matching class_id to api_sync_skipped_records`);
    }

    // Only insert rows with a valid matching class_id into staging; skipped rows are logged but not persisted
    const rowsToInsert = stagingRows.filter(
      (r) => Boolean(r.class_id?.trim()) && knownClassIds.has(r.class_id)
    );
    let failedCount = 0;
    if (rowsToInsert.length > 0) {
      const { error } = await supabase.from('arketa_reservations_staging').insert(rowsToInsert);
      if (error) {
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

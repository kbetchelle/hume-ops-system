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

/**
 * Build Bearer headers using the API key directly (matches working app).
 * The working app uses `Authorization: Bearer {ARKETA_API_KEY}`.
 */
function getArketaBearerHeaders(apiKey: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Build x-api-key headers (used for classes endpoint).
 */
function getArketaApiKeyHeaders(apiKey: string): Record<string, string> {
  return {
    'x-api-key': apiKey,
    'Content-Type': 'application/json',
  };
}

// See docs/ARKETA_ARCHITECTURE.md: reservations are nested under classes; 3-tier fetch (direct /reservations → DB-driven → classes-based).
async function fetchAllReservations(
  partnerId: string,
  apiKey: string,
  startDate: string,
  endDate: string,
  supabase: ReturnType<typeof createClient>,
  classId?: string,
  logger?: ReturnType<typeof createSyncLogger>
): Promise<{ reservations: ReservationWithMeta[]; totalAttempts: number; pagesProcessed: number }> {
  let totalAttempts = 0;
  let pagesProcessed = 0;

  // Reservations use Bearer {API_KEY} auth (matches working app)
  const bearerHeaders = getArketaBearerHeaders(apiKey);
  // Classes endpoint uses x-api-key auth
  const apiKeyHeaders = getArketaApiKeyHeaders(apiKey);

  // If a specific classId is provided, fetch reservations for that class only (with pagination)
  if (classId) {
    const allRes: ReservationWithMeta[] = [];
    let cursor: string | undefined;
    do {
      const url = new URL(`${ARKETA_URLS.prod}/${partnerId}/classes/${classId}/reservations`);
      url.searchParams.set('limit', '500');
      if (cursor) url.searchParams.set('start_after', cursor);
      logger?.info(`Fetching reservations for class ${classId}${cursor ? ` (cursor: ${cursor})` : ''}...`);

      const { response, attempts } = await fetchWithRetry(url.toString(), { method: 'GET', headers: bearerHeaders });
      totalAttempts += attempts;
      pagesProcessed++;

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Arketa API error: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      const reservations: ArketaReservation[] = Array.isArray(responseData)
        ? responseData
        : (responseData.items || responseData.data || responseData.reservations || responseData.bookings || []);
      allRes.push(...(reservations as ReservationWithMeta[]));
      cursor = responseData.pagination?.nextCursor ?? responseData.pagination?.next_cursor;
    } while (cursor);

    return { reservations: allRes, totalAttempts, pagesProcessed };
  }

  // Tier 1: Try direct /reservations with pagination (and variant endpoints). Often 0 or 404.
  const tier1Bases = [
    `${ARKETA_URLS.prod}/${partnerId}/reservations`,
    `${ARKETA_URLS.prod}/${partnerId}/bookings`,
    `${ARKETA_URLS.prod}/${partnerId}/schedule/reservations`,
  ];
  for (const baseUrl of tier1Bases) {
    try {
      const allTier1: ReservationWithMeta[] = [];
      let t1Cursor: string | undefined;
      let gotData = false;
      do {
        const url = new URL(baseUrl);
        url.searchParams.set('start_date', startDate);
        url.searchParams.set('end_date', endDate);
        url.searchParams.set('limit', '500');
        if (t1Cursor) url.searchParams.set('start_after', t1Cursor);

        const { response, attempts } = await fetchWithRetry(url.toString(), { method: 'GET', headers: bearerHeaders });
        totalAttempts += attempts;
        pagesProcessed++;
        if (!response.ok) break;
        const data = await response.json();
        const list = Array.isArray(data) ? data : (data.items || data.data || data.reservations || data.bookings || []);
        if (list.length > 0) gotData = true;
        const withMeta: ReservationWithMeta[] = list.map((r: ArketaReservation) => ({
          ...r,
          class_id: r.class_id ?? (r as { classId?: string }).classId,
          class_name: (r as ReservationWithMeta).class_name ?? null,
          class_date: (r as ReservationWithMeta).class_date ?? (r.start_time ? new Date(r.start_time).toISOString().split('T')[0] : null),
        }));
        allTier1.push(...withMeta);
        t1Cursor = data.pagination?.nextCursor ?? data.pagination?.next_cursor;
      } while (t1Cursor);

      if (gotData) {
        logger?.info(`Tier 1 returned ${allTier1.length} reservations`);
        return { reservations: allTier1, totalAttempts, pagesProcessed };
      }
    } catch {
      continue;
    }
  }

  // Tier 3: Classes-based — GET /classes then per-class reservations (guaranteed to discover all classes)
  logger?.info(`Tier 3: Fetching classes for ${startDate} to ${endDate} to get reservations...`);

  const today = new Date().toISOString().split('T')[0];
  const isPastRange = endDate < today;

  const allClasses: { id: string; name?: string; start_time?: string }[] = [];
  let classCursor: string | undefined;

  do {
    const classUrl = new URL(`${ARKETA_URLS.prod}/${partnerId}/classes`);
    classUrl.searchParams.set('limit', '100');
    classUrl.searchParams.set('start_date', startDate);
    classUrl.searchParams.set('end_date', endDate);
    classUrl.searchParams.set('include_canceled', 'true'); // single L (matches working app)
    classUrl.searchParams.set('status', 'all');
    if (isPastRange) {
      classUrl.searchParams.set('include_completed', 'true');
      classUrl.searchParams.set('include_past', 'true');
    }
    if (classCursor) classUrl.searchParams.set('start_after', classCursor);

    const { response, attempts } = await fetchWithRetry(classUrl.toString(), { method: 'GET', headers: apiKeyHeaders });
    totalAttempts += attempts;
    pagesProcessed++;

    if (!response.ok) {
      const errorText = await response.clone().text().catch(() => 'Body unavailable');
      throw new Error(`Arketa classes API error: ${response.status} - ${errorText}`);
    }

    const classData = await response.json();
    const classes = Array.isArray(classData) ? classData : (classData.items || classData.data || classData.classes || []);
    allClasses.push(...classes);
    classCursor = classData.pagination?.nextCursor ?? classData.pagination?.next_cursor;
  } while (classCursor);

  logger?.info(`Found ${allClasses.length} classes, fetching reservations for each...`);

  const allReservations: ReservationWithMeta[] = [];
  for (const cls of allClasses) {
    const cid = String(cls.id);
    const className = (cls as { name?: string }).name || 'Unknown Class';
    const startTime = (cls as { start_time?: string }).start_time;
    const classDate = startTime ? new Date(startTime).toISOString().split('T')[0] : undefined;

    // Per-class reservations with pagination (Tier 2)
    let resCursor: string | undefined;
    try {
      do {
        const resUrl = new URL(`${ARKETA_URLS.prod}/${partnerId}/classes/${cid}/reservations`);
        resUrl.searchParams.set('limit', '500');
        if (resCursor) resUrl.searchParams.set('start_after', resCursor);

        const { response, attempts } = await fetchWithRetry(resUrl.toString(), { method: 'GET', headers: bearerHeaders });
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
        resCursor = resData.pagination?.nextCursor ?? resData.pagination?.next_cursor;
      } while (resCursor);
    } catch (err) {
      logger?.warn(`Failed to fetch reservations for class ${cid}`);
      continue;
    }
  }

  logger?.info(`Total fetched: ${allReservations.length} reservations from ${allClasses.length} classes`);

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

    logger.info(`Syncing reservations from ${startDate} to ${endDate}`);

    // Fetch all reservations — auth is handled inside fetchAllReservations
    const { reservations, totalAttempts, pagesProcessed } = await fetchAllReservations(
      ARKETA_PARTNER_ID,
      ARKETA_API_KEY,
      startDate,
      endDate,
      supabase as any,
      body.class_id,
      logger
    );

    logger.info(`Total fetched: ${reservations.length} reservations in ${pagesProcessed} page(s), ${totalAttempts} API attempt(s)`);

    // Map to staging rows
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

    // Identify rows with no matching class_id and log to api_sync_skipped_records
    const classIdsInBatch = [...new Set(stagingRows.map((r) => r.class_id).filter((id): id is string => Boolean(id && id.trim())))];
    let knownClassIds = new Set<string>();
    if (classIdsInBatch.length > 0) {
      const { data: classRows } = await supabase
        .from('arketa_classes')
        .select('external_id')
        .in('external_id', classIdsInBatch);
      knownClassIds = new Set((classRows ?? []).map((r: { external_id: string }) => r.external_id));
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

    // Only insert rows with a valid matching class_id into staging
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

    // Refresh daily_schedule for the synced date range
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

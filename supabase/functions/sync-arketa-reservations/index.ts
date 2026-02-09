import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { fetchWithRetry } from '../_shared/retry.ts';
import { getArketaToken, getArketaHeaders, getArketaApiKeyHeaders, ARKETA_URLS } from '../_shared/arketaAuth.ts';
import { createSyncLogger, logSyncMetrics } from '../_shared/logger.ts';
import { logApiCall } from '../_shared/apiLogger.ts';

// No MAX_PAGES limit - fetch all pages

interface ArketaReservation {
  id: string;
  class_id?: string;
  client_id?: string;
  client?: { id?: string; firstName?: string; lastName?: string; email?: string };
  purchase_id?: string;
  reservation_type?: string;
  experience_type?: string;
  late_cancel?: boolean;
  gross_amount_paid?: number;
  net_amount_paid?: number;
  created_at?: string;
  checked_in?: boolean;
  status?: string;
  checkedInAt?: string;
  checked_in_at?: string;
  start_time?: string;
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
    const url = new URL(`${ARKETA_URLS.prod}/${partnerId}/classes/${classId}/reservations`);
    logger?.info(`Fetching reservations for class ${classId}...`);

    const { response, attempts } = await fetchWithRetry(url.toString(), { method: 'GET', headers });
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

    return { reservations: reservations as ReservationWithMeta[], totalAttempts, pagesProcessed };
  }

  // Tier 1: Try direct /reservations (and variants). Often 0 or 404.
  const tier1Endpoints = [
    `${ARKETA_URLS.prod}/${partnerId}/reservations?start_date=${startDate}&end_date=${endDate}&limit=${limit}`,
    `${ARKETA_URLS.prod}/${partnerId}/bookings?start_date=${startDate}&end_date=${endDate}&limit=${limit}`,
    `${ARKETA_URLS.prod}/${partnerId}/schedule/reservations?start_date=${startDate}&end_date=${endDate}&limit=${limit}`,
  ];
  for (const tier1Url of tier1Endpoints) {
    try {
      const { response, attempts } = await fetchWithRetry(tier1Url, { method: 'GET', headers });
      totalAttempts += attempts;
      pagesProcessed++;
      if (!response.ok) continue;
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.items || data.data || data.reservations || data.bookings || []);
      if (list.length > 0) {
        logger?.info(`Tier 1 returned ${list.length} reservations`);
        const withMeta: ReservationWithMeta[] = list.map((r: ArketaReservation) => ({
          ...r,
          class_id: r.class_id ?? (r as { classId?: string }).classId,
          class_name: (r as ReservationWithMeta).class_name ?? null,
          class_date: (r as ReservationWithMeta).class_date ?? (r.start_time ? new Date(r.start_time).toISOString().split('T')[0] : null),
        }));
        return { reservations: withMeta, totalAttempts, pagesProcessed };
      }
    } catch {
      continue;
    }
  }

  // Tier 2: DB-driven — distinct class_id (and class_name, class_date) from arketa_reservations_history, then fetch per class
  const { data: historyRows } = await supabase
    .from('arketa_reservations_history')
    .select('class_id, class_name, class_date')
    .gte('class_date', startDate)
    .lte('class_date', endDate);

  const seen = new Set<string>();
  const classRows: { class_id: string; class_name: string | null; class_date: string | null }[] = [];
  for (const row of (historyRows ?? []) as any[]) {
    const key = `${row.class_id ?? ''}:${row.class_date ?? ''}`;
    if (row.class_id && !seen.has(key)) {
      seen.add(key);
      classRows.push({
        class_id: row.class_id,
        class_name: row.class_name ?? null,
        class_date: row.class_date ?? null,
      });
    }
  }

  if (classRows.length > 0) {
    logger?.info(`Tier 2: fetching reservations for ${classRows.length} known classes from history`);
    const tier2Reservations: ReservationWithMeta[] = [];
    for (const { class_id, class_name, class_date } of classRows) {
      try {
        const resUrl = new URL(`${ARKETA_URLS.prod}/${partnerId}/classes/${class_id}/reservations`);
        resUrl.searchParams.set('limit', '500');
        const { response, attempts } = await fetchWithRetry(resUrl.toString(), { method: 'GET', headers });
        totalAttempts += attempts;
        pagesProcessed++;
        if (!response.ok) continue;
        const resData = await response.json();
        const list = Array.isArray(resData) ? resData : (resData.items || resData.data || resData.reservations || resData.bookings || []);
        for (const res of list) {
          if (!res.class_id) res.class_id = class_id;
          tier2Reservations.push({ ...res, class_name: class_name ?? undefined, class_date: class_date ?? undefined });
        }
      } catch {
        continue;
      }
    }
    if (tier2Reservations.length > 0) {
      logger?.info(`Tier 2 returned ${tier2Reservations.length} reservations`);
      return { reservations: tier2Reservations, totalAttempts, pagesProcessed };
    }
  }

  // Tier 3: Classes-based — GET /classes then per-class reservations (guaranteed to discover all classes)
  logger?.info(`Tier 3: Fetching classes for ${startDate} to ${endDate} to get reservations...`);

  const allClasses: { id: string; name?: string; start_time?: string }[] = [];
  let classCursor: string | undefined;

  do {
    const classUrl = new URL(`${ARKETA_URLS.prod}/${partnerId}/classes`);
    classUrl.searchParams.set('limit', String(limit));
    classUrl.searchParams.set('start_date', startDate);
    classUrl.searchParams.set('end_date', endDate);
    classUrl.searchParams.set('include_cancelled', 'true');
    classUrl.searchParams.set('include_past', 'true');
    classUrl.searchParams.set('include_completed', 'true');
    if (classCursor) classUrl.searchParams.set('cursor', classCursor);

    const { response, attempts } = await fetchWithRetry(classUrl.toString(), { method: 'GET', headers });
    totalAttempts += attempts;
    pagesProcessed++;

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Arketa classes API error: ${response.status} - ${errorText}`);
    }

    const classData = await response.json();
    const classes = Array.isArray(classData) ? classData : (classData.items || classData.data || classData.classes || []);
    allClasses.push(...classes);
    classCursor = classData.pagination?.nextCursor;
  } while (classCursor);

  logger?.info(`Found ${allClasses.length} classes, fetching reservations for each...`);

  const allReservations: ReservationWithMeta[] = [];
  for (const cls of allClasses) {
    const cid = String(cls.id);
    const className = (cls as { name?: string }).name || 'Unknown Class';
    const startTime = (cls as { start_time?: string }).start_time;
    const classDate = startTime ? new Date(startTime).toISOString().split('T')[0] : undefined;
    const resUrl = new URL(`${ARKETA_URLS.prod}/${partnerId}/classes/${cid}/reservations`);

    try {
      const { response, attempts } = await fetchWithRetry(resUrl.toString(), { method: 'GET', headers });
      totalAttempts += attempts;
      pagesProcessed++;

      if (!response.ok) {
        if (response.status === 404) continue;
        logger?.warn(`Error fetching reservations for class ${cid}: ${response.status}`);
        continue;
      }

      const resData = await response.json();
      const reservations: ArketaReservation[] = Array.isArray(resData)
        ? resData
        : (resData.items || resData.data || resData.reservations || resData.bookings || []);

      for (const res of reservations) {
        if (!res.class_id) res.class_id = cid;
        allReservations.push({ ...res, class_name: className, class_date: classDate });
      }
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
    const limit = body.limit || 400;

    logger.info(`Syncing reservations from ${startDate} to ${endDate}`);

    // Try to get token via refresh flow, fall back to API key
    let headers: Record<string, string>;
    try {
      const token = await getArketaToken(supabaseUrl, supabaseKey);
      headers = getArketaHeaders(token);
      logger.info('Using OAuth token for authentication');
    } catch (tokenError) {
      logger.warn('Token refresh failed, using API key', { error: tokenError instanceof Error ? tokenError.message : String(tokenError) });
      headers = getArketaApiKeyHeaders(ARKETA_API_KEY);
    }

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
          purchase_id: res.purchase_id ?? (res as { purchaseId?: string }).purchaseId ?? null,
          reservation_type: res.reservation_type ?? (res as { type?: string }).type ?? 'class',
          class_id: String(res.class_id || ''),
          class_name: resWithClass.class_name ?? (res as { class_name?: string }).class_name ?? null,
          status: res.status || 'booked',
          checked_in: checkedIn(res),
          checked_in_at: res.checkedInAt || res.checked_in_at || null,
          experience_type: res.experience_type ?? (res as { experienceType?: string }).experienceType ?? null,
          late_cancel: res.late_cancel ?? (res as { lateCancel?: boolean }).lateCancel ?? false,
          gross_amount_paid: res.gross_amount_paid ?? (res as { grossAmountPaid?: number }).grossAmountPaid ?? (res as { amount?: number }).amount ?? 0,
          net_amount_paid: res.net_amount_paid ?? (res as { netAmountPaid?: number }).netAmountPaid ?? (res as { amount?: number }).amount ?? 0,
          class_date: resWithClass.class_date ?? (res as { class_date?: string }).class_date ?? null,
          sync_batch_id: syncBatchId,
          raw_data: res,
        };
      })
      .filter((r) => r.reservation_id);

    // Identify rows with no matching class_id (empty or not in arketa_classes) and log to api_sync_skipped_records
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

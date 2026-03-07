/**
 * sync-arketa-reservations: Fetch reservations from Arketa Partner API and stage them.
 *
 * PRIMARY: Uses flat GET /{partnerId}/reservations endpoint (ReservationsReportRow)
 *   - Filters by created_min / created_max (ISO 8601)
 *   - Pagination via nextStartAfterId + hasMore
 *   - Returns rich data: payment info, purchase info, class metadata
 *
 * FALLBACK (single-class mode): GET /{partnerId}/classes/{classId}/reservations
 *   - Used when class_id param is specified
 *   - Returns ClassReservationDTO (lighter data)
 *
 * API Reference: https://gist.github.com/joshuarcher/a235b4023dbc10e6b251eca38ad3c916
 * Base URL: https://us-central1-sutra-prod.cloudfunctions.net/partnerApiDev/v0
 * Auth: Authorization: Bearer {partner_api_key} OR X-API-Key: {partner_api_key}
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { fetchWithRetry } from '../_shared/retry.ts';
import { ARKETA_URLS } from '../_shared/arketaAuth.ts';
import { createSyncLogger, logSyncMetrics } from '../_shared/logger.ts';
import { logApiCall } from '../_shared/apiLogger.ts';

const PAGE_LIMIT = 100; // API max
const WALL_CLOCK_TIMEOUT_MS = 50_000; // 50s safety margin

interface SyncRequest {
  start_date?: string;
  end_date?: string;
  startDate?: string;
  endDate?: string;
  class_id?: string;
  limit?: number;
  triggeredBy?: string;
  isHistorical?: boolean;
  parentLogId?: string;
}

/**
 * ReservationsReportRow from flat GET /{partnerId}/reservations
 * This is the rich, report-style DTO per the API docs.
 */
interface ReservationsReportRow {
  reservation_id: string;
  booking_id: string | null;
  client_id: string;
  client_email: string | null;
  first_name: string | null;
  last_name: string | null;
  email_marketing_opt_in: boolean | null;
  date_purchased: string | null;
  purchase_id: string | null;
  reservation_type: string | null;
  class_id: string | null;
  class_name: string | null;
  class_time: string | null;
  instructor_name: string | null;
  location_name: string | null;
  location_address: string | null;
  status: string | null;
  checked_in: boolean;
  checked_in_at: string | null;
  purchase_type: string | null;
  gross_amount_paid: number | null;
  net_amount_paid: number | null;
  estimated_gross_revenue: number | null;
  estimated_net_revenue: number | null;
  coupon_code: string | null;
  package_name: string | null;
  package_period_start: string | null;
  package_period_end: string | null;
  offering_id: string | null;
  payment_method: string | null;
  payment_id: string | null;
  service_id: string | null;
  tags: string[] | null;
  experience_type: string | null;
  late_cancel: boolean;
  canceled_at: string | null;
  canceled_by: string | null;
  milestone: number | null;
}

/**
 * ClassReservationDTO from GET /{partnerId}/classes/{classId}/reservations
 * Lighter data, used for single-class mode.
 */
interface ClassReservationDTO {
  id: string;
  client_id: string;
  class_id: string;
  client: { first_name: string; last_name: string; email: string | null; phone: string | null } | null;
  status: string;
  checked_in: boolean;
  checked_in_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  spot_id: string | null;
  spot_name: string | null;
}

/** Extract class_date from class_time (ISO) in PST timezone */
function extractClassDate(classTime: string | null): string | null {
  if (!classTime) return null;
  try {
    const dtf = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
    return dtf.format(new Date(classTime));
  } catch {
    return null;
  }
}

/** Decode cursor to avoid double-encoding by URL.searchParams.set() */
function decodeCursor(cursor: string): string {
  try { return decodeURIComponent(cursor); } catch { return cursor; }
}

/**
 * Fetch reservations via flat GET /{partnerId}/reservations endpoint.
 * Uses created_min/created_max for date filtering per API reference.
 */
async function fetchReservationsFlat(
  partnerId: string,
  headers: Record<string, string>,
  createdMin: string | null,
  createdMax: string | null,
  startTime: number,
  logger: ReturnType<typeof createSyncLogger>,
): Promise<{ rows: ReservationsReportRow[]; pages: number; attempts: number }> {
  const allRows: ReservationsReportRow[] = [];
  let cursor: string | undefined;
  let pages = 0;
  let attempts = 0;

  logger.info(`Flat endpoint: fetching reservations (created_min=${createdMin}, created_max=${createdMax})`);

  do {
    // Wall-clock timeout
    if ((Date.now() - startTime) >= WALL_CLOCK_TIMEOUT_MS) {
      logger.warn(`Approaching timeout after ${pages} pages, stopping`);
      break;
    }

    const url = new URL(`${ARKETA_URLS.prod}/${partnerId}/reservations`);
    url.searchParams.set('limit', String(PAGE_LIMIT));
    if (createdMin) url.searchParams.set('created_min', createdMin);
    if (createdMax) url.searchParams.set('created_max', createdMax);
    if (cursor) url.searchParams.set('start_after', decodeCursor(cursor));

    const { response, attempts: fetchAttempts } = await fetchWithRetry(url.toString(), { method: 'GET', headers });
    attempts += fetchAttempts;
    pages++;

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Flat endpoint HTTP ${response.status}: ${errorText.slice(0, 200)}`);
    }

    const data = await response.json();
    const items: ReservationsReportRow[] = data.items ?? [];
    allRows.push(...items);

    const pagination = data.pagination as { nextStartAfterId?: string; hasMore?: boolean } | undefined;
    const hasMore = pagination?.hasMore ?? false;
    cursor = pagination?.nextStartAfterId ?? undefined;

    logger.info(`Page ${pages}: ${items.length} items, hasMore=${hasMore}`);

    if (!hasMore || !cursor || items.length < PAGE_LIMIT) break;
  } while (true);

  logger.info(`Flat endpoint: ${allRows.length} total reservations in ${pages} pages`);
  return { rows: allRows, pages, attempts };
}

/**
 * Fetch reservations for a single class via GET /{partnerId}/classes/{classId}/reservations.
 * Used when class_id is explicitly specified.
 */
async function fetchReservationsPerClass(
  partnerId: string,
  classId: string,
  headers: Record<string, string>,
  startTime: number,
  logger: ReturnType<typeof createSyncLogger>,
): Promise<{ rows: ClassReservationDTO[]; pages: number; attempts: number }> {
  const allRows: ClassReservationDTO[] = [];
  let cursor: string | undefined;
  let pages = 0;
  let attempts = 0;

  do {
    if ((Date.now() - startTime) >= WALL_CLOCK_TIMEOUT_MS) {
      logger.warn(`Approaching timeout after ${pages} pages (per-class), stopping`);
      break;
    }

    const url = new URL(`${ARKETA_URLS.prod}/${partnerId}/classes/${classId}/reservations`);
    url.searchParams.set('limit', String(PAGE_LIMIT));
    if (cursor) url.searchParams.set('start_after', decodeCursor(cursor));

    const { response, attempts: fetchAttempts } = await fetchWithRetry(url.toString(), { method: 'GET', headers });
    attempts += fetchAttempts;
    pages++;

    if (!response.ok) {
      if (response.status === 404) break; // Class not found
      const errorText = await response.text().catch(() => '');
      throw new Error(`Per-class endpoint HTTP ${response.status}: ${errorText.slice(0, 200)}`);
    }

    const data = await response.json();
    const items: ClassReservationDTO[] = data.items ?? [];
    allRows.push(...items);

    const pagination = data.pagination as { nextStartAfterId?: string; hasMore?: boolean } | undefined;
    const hasMore = pagination?.hasMore ?? false;
    cursor = pagination?.nextStartAfterId ?? undefined;

    if (!hasMore || !cursor || items.length < PAGE_LIMIT) break;
  } while (true);

  return { rows: allRows, pages, attempts };
}

/**
 * Map flat ReservationsReportRow to staging format.
 * Maps ALL fields from the API reference including the 21 new columns.
 */
function mapFlatRowToStaging(row: ReservationsReportRow, syncBatchId: string) {
  const classDate = extractClassDate(row.class_time);
  const isCheckedIn = row.checked_in === true ||
    ['ATTENDED', 'attended', 'checked_in', 'completed', 'COMPLETED'].includes(row.status || '');

  return {
    reservation_id: row.reservation_id,
    booking_id: row.booking_id ?? null,
    client_id: row.client_id ?? null,
    class_id: row.class_id ?? null,
    class_name: row.class_name ?? null,
    class_date: classDate,
    reservation_type: row.reservation_type ?? 'class',
    status: row.status?.toLowerCase() ?? 'booked',
    checked_in: isCheckedIn,
    checked_in_at: row.checked_in_at ?? null,
    late_cancel: row.late_cancel ?? false,
    gross_amount_paid: row.gross_amount_paid ?? 0,
    net_amount_paid: row.net_amount_paid ?? 0,
    estimated_gross_revenue: row.estimated_gross_revenue ?? null,
    estimated_net_revenue: row.estimated_net_revenue ?? null,
    created_at_api: row.class_time ?? null,
    updated_at_api: null, // Not in flat endpoint
    spot_id: null, // Not in flat endpoint
    spot_name: null, // Not in flat endpoint
    client_email: row.client_email ?? null,
    client_first_name: row.first_name ?? null,
    client_last_name: row.last_name ?? null,
    client_phone: null, // Not in flat endpoint
    experience_type: row.experience_type ?? null,
    purchase_id: row.purchase_id ?? null,
    email_marketing_opt_in: row.email_marketing_opt_in ?? null,
    date_purchased: row.date_purchased ?? null,
    instructor_name: row.instructor_name ?? null,
    location_name: row.location_name ?? null,
    location_address: row.location_address ?? null,
    purchase_type: row.purchase_type ?? null,
    coupon_code: row.coupon_code ?? null,
    package_name: row.package_name ?? null,
    package_period_start: row.package_period_start ?? null,
    package_period_end: row.package_period_end ?? null,
    offering_id: row.offering_id ?? null,
    payment_method: row.payment_method ?? null,
    payment_id: row.payment_id ?? null,
    service_id: row.service_id ?? null,
    tags: row.tags ?? null,
    canceled_at: row.canceled_at ?? null,
    canceled_by: row.canceled_by ?? null,
    milestone: row.milestone ?? null,
    raw_data: row,
    sync_batch_id: syncBatchId,
  };
}

/**
 * Map per-class ClassReservationDTO to staging format.
 */
function mapPerClassRowToStaging(
  row: ClassReservationDTO,
  classId: string,
  className: string | null,
  classDate: string | null,
  syncBatchId: string,
) {
  const isCheckedIn = row.checked_in === true ||
    ['ATTENDED', 'attended', 'checked_in', 'completed', 'COMPLETED'].includes(row.status || '');

  return {
    reservation_id: row.id,
    booking_id: null,
    client_id: row.client_id ?? null,
    class_id: classId,
    class_name: className,
    class_date: classDate,
    reservation_type: 'class',
    status: row.status?.toLowerCase() ?? 'booked',
    checked_in: isCheckedIn,
    checked_in_at: row.checked_in_at ?? null,
    late_cancel: false,
    gross_amount_paid: 0,
    net_amount_paid: 0,
    estimated_gross_revenue: null,
    estimated_net_revenue: null,
    created_at_api: row.created_at ?? null,
    updated_at_api: row.updated_at ?? null,
    spot_id: row.spot_id ?? null,
    spot_name: row.spot_name ?? null,
    client_email: row.client?.email ?? null,
    client_first_name: row.client?.first_name ?? null,
    client_last_name: row.client?.last_name ?? null,
    client_phone: row.client?.phone ?? null,
    experience_type: null,
    purchase_id: null,
    email_marketing_opt_in: null,
    date_purchased: null,
    instructor_name: null,
    location_name: null,
    location_address: null,
    purchase_type: null,
    coupon_code: null,
    package_name: null,
    package_period_start: null,
    package_period_end: null,
    offering_id: null,
    payment_method: null,
    payment_id: null,
    service_id: null,
    tags: null,
    canceled_at: null,
    canceled_by: null,
    milestone: null,
    raw_data: row,
    sync_batch_id: syncBatchId,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Main handler
// ═══════════════════════════════════════════════════════════════════════

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

    // Mark sync as running so if we 504/timeout, clients can detect the stale state
    await supabase
      .from('api_sync_status')
      .upsert({
        api_name: 'arketa_reservations',
        last_sync_status: 'running',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'api_name' });

    // ── ISSUE 1 FIX: Delete stale staging rows to prevent accumulation ──
    // Use batch_id-scoped delete instead of TRUNCATE to avoid race conditions
    // when multiple syncs (backfill + scheduled) run concurrently.
    // Each sync only cleans up rows NOT belonging to an active batch.
    logger.info('Clearing stale arketa_reservations_staging rows before inserting new data');
    const { error: cleanupError } = await supabase
      .from('arketa_reservations_staging')
      .delete()
      .neq('sync_batch_id', syncBatchId); // Delete everything except our own batch (which is empty at this point)
    if (cleanupError) {
      logger.warn(`Failed to clean staging: ${cleanupError.message}`);
    }

    // Auth: API key works as both Bearer and X-API-Key per docs
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${ARKETA_API_KEY}`,
      'Content-Type': 'application/json',
    };

    const syncBatchId = crypto.randomUUID();
    let stagingRows: ReturnType<typeof mapFlatRowToStaging>[] = [];
    let totalFetched = 0;
    let pagesProcessed = 0;
    let totalAttempts = 0;
    let fetchMode: 'flat' | 'per-class' = 'flat';

    // ── Single class mode ─────────────────────────────────────────────
    if (body.class_id) {
      fetchMode = 'per-class';
      logger.info(`Single-class mode: fetching reservations for class ${body.class_id}`);

      // Look up class metadata from DB
      const { data: classRow } = await supabase
        .from('arketa_classes')
        .select('name, class_date')
        .eq('external_id', body.class_id)
        .limit(1)
        .maybeSingle();

      const { rows, pages, attempts } = await fetchReservationsPerClass(
        ARKETA_PARTNER_ID, body.class_id, headers, startTime, logger,
      );
      totalFetched = rows.length;
      pagesProcessed = pages;
      totalAttempts = attempts;

      stagingRows = rows.map(r => mapPerClassRowToStaging(
        r, body.class_id!, classRow?.name ?? null, classRow?.class_date ?? null, syncBatchId,
      ));
    }
    // ── Flat endpoint (primary) ───────────────────────────────────────
    else {
      fetchMode = 'flat';

      // Per API reference: created_min/created_max filter by reservation creation date (ISO 8601)
      const createdMin = `${startDate}T00:00:00.000Z`;
      const createdMax = `${endDate}T23:59:59.999Z`;

      const { rows, pages, attempts } = await fetchReservationsFlat(
        ARKETA_PARTNER_ID, headers, createdMin, createdMax, startTime, logger,
      );
      totalFetched = rows.length;
      pagesProcessed = pages;
      totalAttempts = attempts;

      // Map ReservationsReportRow → staging format
      stagingRows = rows
        .filter(r => r.reservation_id) // Must have reservation_id
        .map(r => mapFlatRowToStaging(r, syncBatchId));

      logger.info(`Flat endpoint mapped ${stagingRows.length} rows to staging`);

      // If flat returned 0 results, fall back to per-class using DB classes
      if (stagingRows.length === 0) {
        logger.info(`Flat endpoint returned 0, falling back to per-class for ${startDate}–${endDate}`);
        fetchMode = 'per-class';

        const { data: classRows } = await supabase
          .from('arketa_classes')
          .select('external_id, name, class_date')
          .gte('class_date', startDate)
          .lte('class_date', endDate);

        const classes = (classRows ?? []) as { external_id: string; name: string; class_date: string }[];
        logger.info(`Found ${classes.length} classes in DB for fallback`);

        for (const cls of classes) {
          if ((Date.now() - startTime) >= WALL_CLOCK_TIMEOUT_MS) {
            logger.warn('Approaching timeout during per-class fallback, stopping');
            break;
          }

          try {
            const { rows: classRes, pages: p, attempts: a } = await fetchReservationsPerClass(
              ARKETA_PARTNER_ID, cls.external_id, headers, startTime, logger,
            );
            pagesProcessed += p;
            totalAttempts += a;
            totalFetched += classRes.length;

            for (const r of classRes) {
              stagingRows.push(mapPerClassRowToStaging(r, cls.external_id, cls.name, cls.class_date, syncBatchId));
            }
          } catch (err) {
            logger.warn(`Failed to fetch reservations for class ${cls.external_id}: ${err}`);
          }
        }

        logger.info(`Per-class fallback: ${stagingRows.length} total reservations from ${classes.length} classes`);
      }
    }

    // ── Deduplicate by reservation_id within batch ────────────────────
    const seenReservations = new Map<string, typeof stagingRows[0]>();
    const duplicateRecords: Array<{ api_name: string; record_id: string; secondary_id?: string | null; reason: string; details?: Record<string, unknown> }> = [];

    for (const row of stagingRows) {
      const key = `${row.reservation_id}:${row.sync_batch_id}`;
      if (seenReservations.has(key)) {
        duplicateRecords.push({
          api_name: 'arketa_reservations',
          record_id: row.reservation_id!,
          secondary_id: row.class_id,
          reason: 'duplicate_reservation_id',
          details: { class_name: row.class_name, class_date: row.class_date },
        });
        continue;
      }
      seenReservations.set(key, row);
    }
    const dedupedRows = [...seenReservations.values()];
    const deduplicatedCount = duplicateRecords.length;

    // ── Auto-create stub classes for unknown class_ids ────────────────
    const classIdsInBatch = [...new Set(dedupedRows.map(r => r.class_id).filter((id): id is string => Boolean(id?.trim())))];
    const knownClassIds = new Set<string>();
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

    const unknownClassRows = dedupedRows.filter(r => Boolean(r.class_id?.trim()) && !knownClassIds.has(r.class_id!));
    if (unknownClassRows.length > 0) {
      const stubMap = new Map<string, { external_id: string; name: string; start_time: string; class_date: string; status: string; synced_at: string; duration_minutes?: number | null; reservation_type?: string | null }>();
      for (const r of unknownClassRows) {
        const key = `${r.class_id}::${r.class_date ?? 'unknown'}`;
        if (!stubMap.has(key) && r.class_date) {
          const classTime = r.created_at_api || `${r.class_date}T00:00:00+00`;
          stubMap.set(key, {
            external_id: r.class_id!,
            name: r.class_name || 'Unknown Class',
            start_time: classTime,
            class_date: r.class_date,
            status: 'stub_from_res_sync',
            synced_at: new Date().toISOString(),
            reservation_type: r.reservation_type || null,
          });
        }
      }
      const stubRows = [...stubMap.values()];
      if (stubRows.length > 0) {
        const { error: stubErr } = await supabase
          .from('arketa_classes')
          .upsert(stubRows as any, { onConflict: 'external_id,class_date' });
        if (stubErr) {
          logger.warn(`Failed to insert ${stubRows.length} stub classes: ${stubErr.message}`);
        } else {
          logger.info(`Auto-created ${stubRows.length} stub classes for unknown class_ids`);
          for (const s of stubRows) knownClassIds.add(s.external_id);
        }
      }
    }

    // ── Log skipped records ──────────────────────────────────────────
    const insertSkippedRecords = async (records: Array<{ api_name: string; record_id: string; secondary_id?: string | null; reason: string; details?: Record<string, unknown> }>) => {
      if (records.length === 0) return;
      const CHUNK = 500;
      for (let i = 0; i < records.length; i += CHUNK) {
        const chunk = records.slice(i, i + CHUNK);
        const { error } = await supabase.from('api_sync_skipped_records').insert(chunk);
        if (error) logger.warn(`Failed to insert skipped-record chunk: ${error.message}`);
      }
    };

    if (unknownClassRows.length > 0) {
      await insertSkippedRecords(unknownClassRows.map(r => ({
        api_name: 'arketa_reservations',
        record_id: r.reservation_id!,
        secondary_id: r.class_id,
        reason: 'no_matching_class_id',
        details: { class_name: r.class_name, class_date: r.class_date, auto_stub_created: true } as Record<string, unknown>,
      })));
    }

    const emptyClassIdRows = dedupedRows.filter(r => !r.class_id?.trim());
    if (emptyClassIdRows.length > 0) {
      await insertSkippedRecords(emptyClassIdRows.map(r => ({
        api_name: 'arketa_reservations',
        record_id: r.reservation_id!,
        secondary_id: null,
        reason: 'empty_class_id',
        details: { class_name: r.class_name, class_date: r.class_date } as Record<string, unknown>,
      })));
    }

    if (deduplicatedCount > 0) {
      await insertSkippedRecords(duplicateRecords);
      logger.info(`Deduplicated ${deduplicatedCount} duplicate reservation_id entries`);
    }

    // ── Insert to staging ────────────────────────────────────────────
    const rowsToInsert = dedupedRows.filter(r => Boolean(r.reservation_id?.trim()));
    let failedCount = 0;
    let insertError: string | null = null;
    const failedSkippedRecords: typeof duplicateRecords = [];

    if (rowsToInsert.length > 0) {
      const CHUNK_SIZE = 50;
      for (let i = 0; i < rowsToInsert.length; i += CHUNK_SIZE) {
        const chunk = rowsToInsert.slice(i, i + CHUNK_SIZE);
        const { error } = await supabase.from('arketa_reservations_staging').insert(chunk);
        if (error) {
          insertError = error.message || JSON.stringify(error);
          logger.error(`Failed to insert chunk ${Math.floor(i / CHUNK_SIZE) + 1} to staging: ${insertError}`);
          failedCount += chunk.length;
          for (const failedRow of chunk) {
            failedSkippedRecords.push({
              api_name: 'arketa_reservations',
              record_id: failedRow.reservation_id!,
              secondary_id: failedRow.class_id,
              reason: 'staging_insert_failed',
              details: { class_name: failedRow.class_name, class_date: failedRow.class_date, error: insertError } as Record<string, unknown>,
            });
          }
        }
      }
    }

    if (failedSkippedRecords.length > 0) {
      await insertSkippedRecords(failedSkippedRecords);
    }

    const syncedCount = rowsToInsert.length - failedCount;

    // ── Logging ──────────────────────────────────────────────────────
    const durationMs = Date.now() - startTime;
    await logSyncMetrics(supabase, {
      syncType: 'arketa_reservations',
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs,
      recordsFetched: totalFetched,
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
        last_sync_status: failedCount === 0 ? 'completed' : 'failed',
        last_records_processed: totalFetched,
        last_records_inserted: syncedCount,
        last_error_message: insertError ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'api_name' });

    const totalSkipped = unknownClassRows.length + emptyClassIdRows.length + deduplicatedCount + failedCount;
    const skipReasons: Record<string, number> = {};
    if (unknownClassRows.length > 0) skipReasons.no_matching_class_id = unknownClassRows.length;
    if (emptyClassIdRows.length > 0) skipReasons.empty_class_id = emptyClassIdRows.length;
    if (deduplicatedCount > 0) skipReasons.duplicate_reservation_id = deduplicatedCount;
    if (failedCount > 0) skipReasons.staging_insert_failed = failedCount;

    await logApiCall(supabase, {
      apiName: 'arketa_reservations',
      endpoint: `/${fetchMode === 'flat' ? 'reservations' : 'classes/{id}/reservations'}`,
      syncSuccess: failedCount === 0,
      durationMs,
      recordsProcessed: totalFetched,
      recordsInserted: syncedCount,
      recordsSkipped: totalSkipped,
      skipReasons: totalSkipped > 0 ? skipReasons : undefined,
      responseStatus: failedCount === 0 ? 200 : 500,
      errorMessage: insertError ?? undefined,
      triggeredBy: body.triggeredBy || 'manual',
      parentLogId: body.parentLogId,
    });

    // ISSUE 2 FIX: Removed refresh-daily-schedule call.
    // The wrapper (sync-arketa-classes-and-reservations) handles schedule refresh as Phase 4.

    return new Response(
      JSON.stringify({
        success: failedCount === 0,
        ...(insertError && { error: insertError }),
        data: {
          reservations_synced: syncedCount,
          records_processed: totalFetched,
          records_inserted: syncedCount,
        },
        totalFetched,
        syncedCount,
        failedCount,
        fetchMode,
        recordsSkipped: totalSkipped,
        skipReasons,
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

      // Update sync status to failed so UI reflects the error
      await supabase
        .from('api_sync_status')
        .upsert({
          api_name: 'arketa_reservations',
          last_sync_at: new Date().toISOString(),
          last_sync_success: false,
          last_sync_status: 'failed',
          last_error_message: errorMessage,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'api_name' });

      await logApiCall(supabase, {
        apiName: 'arketa_reservations',
        endpoint: '/reservations',
        syncSuccess: false,
        durationMs: Date.now() - (Date.now()), // approx
        recordsProcessed: 0,
        recordsInserted: 0,
        responseStatus: 500,
        errorMessage,
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

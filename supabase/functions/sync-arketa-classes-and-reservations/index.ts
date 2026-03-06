/**
 * sync-arketa-classes-and-reservations: Run classes sync then reservations sync with the same date range.
 * After reservations sync, calls sync-from-staging to transfer reservations from staging to history,
 * then refreshes the daily schedule. Creates a parent log and propagates its ID to child functions.
 *
 * Used by the scheduled-sync-runner (every 20 min) and for manual "one-click" Arketa sync.
 * Default date range: -7 to +7 days.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { createParentLog, updateParentLog } from '../_shared/apiLogger.ts';

interface WrapperRequest {
  start_date?: string;
  end_date?: string;
  startDate?: string;
  endDate?: string;
  triggeredBy?: string;
  start_after_id?: string;
  strict_three_phase?: boolean;
}

function parseJson<T>(text: string): T | null {
  try { return text ? (JSON.parse(text) as T) : null; } catch { return null; }
}

function parseErrorBody(text: string): string {
  const parsed = parseJson<{ error?: string }>(text);
  if (parsed && typeof parsed.error === 'string') return parsed.error;
  return text || 'Unknown error';
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = getCorsHeaders(req);

  let supabaseUrl: string;
  let supabaseKey: string;
  let supabase: ReturnType<typeof createClient>;
  const startTime = Date.now();
  let body: WrapperRequest = {};
  let triggeredBy = 'manual';

  try {
    supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    supabase = createClient(supabaseUrl, supabaseKey);
    body = (await req.json().catch(() => ({}))) as WrapperRequest;
    triggeredBy = body.triggeredBy ?? 'manual';
  } catch (initErr) {
    const msg = initErr instanceof Error ? initErr.message : String(initErr);
    return new Response(
      JSON.stringify({ success: false, error: `Initialization failed: ${msg}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const ARKETA_API_KEY = Deno.env.get('ARKETA_API_KEY');
    const ARKETA_PARTNER_ID = Deno.env.get('ARKETA_PARTNER_ID');
    if (!ARKETA_API_KEY || !ARKETA_PARTNER_ID) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Arketa API credentials not configured. Set ARKETA_API_KEY and ARKETA_PARTNER_ID in Supabase Edge Function secrets.',
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const today = new Date();
    const defaultStart = new Date(today);
    defaultStart.setDate(defaultStart.getDate() - 7);
    const defaultEnd = new Date(today);
    defaultEnd.setDate(defaultEnd.getDate() + 7);
    const startDate = body.startDate ?? body.start_date ?? defaultStart.toISOString().split('T')[0];
    const endDate = body.endDate ?? body.end_date ?? defaultEnd.toISOString().split('T')[0];

    // ── Create parent log ─────────────────────────────────────────────
    const parentLogId = await createParentLog(supabase, 'arketa_classes', '/classes+reservations', triggeredBy);

    const payload: Record<string, unknown> = {
      startDate, endDate, triggeredBy, skipLogging: false,
      ...(parentLogId ? { parentLogId } : {}),
    };
    if (body.start_after_id) payload.start_after_id = body.start_after_id;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
    };

    // ── 1) Classes first ──────────────────────────────────────────────
    let classesData: Record<string, unknown> = {};
    let classesOk = false;
    try {
      const classesUrl = `${supabaseUrl}/functions/v1/sync-arketa-classes`;
      const classesRes = await fetch(classesUrl, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const classesText = await classesRes.text();
      classesData = classesRes.ok
        ? (parseJson(classesText) ?? {})
        : { success: false, error: parseErrorBody(classesText) };
      classesOk = classesRes.ok && classesData.success !== false;
    } catch (classesErr) {
      classesData = { success: false, error: classesErr instanceof Error ? classesErr.message : String(classesErr) };
    }

    const classesError = (classesData.error as string | undefined) ?? (!classesOk ? 'classes sync returned success=false' : undefined);
    if (!classesOk) {
      console.warn('[sync-arketa-classes-and-reservations] Classes sync failed, continuing to reservations:', classesError);
    }

    // ── 2) Reservations with same range ───────────────────────────────
    let reservationsData: Record<string, unknown> = {};
    let reservationsOk = false;
    try {
      const reservationsUrl = `${supabaseUrl}/functions/v1/sync-arketa-reservations`;
      console.log(`[sync-arketa-classes-and-reservations] Calling reservation sync for ${startDate}–${endDate}...`);
      const reservationsRes = await fetch(reservationsUrl, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const reservationsText = await reservationsRes.text();
      reservationsData = reservationsRes.ok
        ? (parseJson(reservationsText) ?? {})
        : { success: false, error: parseErrorBody(reservationsText) };
      reservationsOk = reservationsRes.ok && reservationsData.success !== false && !reservationsData.error;
      console.log(`[sync-arketa-classes-and-reservations] Reservation sync result: ok=${reservationsRes.ok}, success=${reservationsData.success}, error=${reservationsData.error ?? 'none'}`);
    } catch (resErr) {
      const resErrMsg = resErr instanceof Error ? resErr.message : String(resErr);
      console.error(`[sync-arketa-classes-and-reservations] Reservation sync fetch error: ${resErrMsg}`);
      reservationsData = { success: false, error: resErrMsg };
    }

    if (!reservationsOk) {
      console.warn('[sync-arketa-classes-and-reservations] Reservations sync failed:', reservationsData.error);
    }

    // ── 3) Sync reservations from staging → arketa_reservations_history ─
    let stagingData: Record<string, unknown> = {};
    let stagingOk = false;
    try {
      const syncFromStagingUrl = `${supabaseUrl}/functions/v1/sync-from-staging`;
      const stagingPayload: Record<string, unknown> = {
        api: 'arketa_reservations',
        clear_staging: true,
        triggeredBy,
      };
      if (parentLogId) stagingPayload.parentLogId = parentLogId;
      const stagingRes = await fetch(syncFromStagingUrl, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(stagingPayload),
      });
      stagingData = stagingRes.ok
        ? (await stagingRes.json().catch(() => ({})))
        : { success: false, error: await stagingRes.text() };
      if (stagingRes.ok && stagingData.success === false && Array.isArray((stagingData as any).results) && (stagingData as any).results.length > 0 && !stagingData.error) {
        const firstError = ((stagingData as any).results as Array<{ error?: string }>).find((r: any) => r.error);
        if (firstError?.error) stagingData.error = firstError.error;
      }
      stagingOk = stagingRes.ok && stagingData.success !== false;
    } catch (stagingErr) {
      stagingData = { success: false, error: stagingErr instanceof Error ? stagingErr.message : String(stagingErr) };
    }

    if (!stagingOk) {
      console.warn('[sync-arketa-classes-and-reservations] Sync-from-staging failed:', stagingData.error);
    }

    // ── 4) Refresh daily schedule for synced range ────────────────────
    try {
      const refreshUrl = `${supabaseUrl}/functions/v1/refresh-daily-schedule`;
      await fetch(refreshUrl, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ start_date: startDate, end_date: endDate }),
      });
    } catch (refreshErr) {
      console.warn('[sync-arketa-classes-and-reservations] Failed to refresh daily schedule:', refreshErr);
    }

    // ── 5) Determine overall success + normalize metrics ──────────────
    const reservationsSyncedCount =
      (reservationsData.syncedCount as number) ??
      ((reservationsData.data as Record<string, unknown>)?.reservations_synced as number) ?? 0;
    const reservationsHadNoData = reservationsOk && reservationsSyncedCount === 0;
    const effectiveStagingOk = stagingOk || reservationsHadNoData;

    const stagingReservationResult = Array.isArray((stagingData as any).results)
      ? ((stagingData as any).results as Array<Record<string, unknown>>).find((r) => r.api === 'arketa_reservations')
      : null;
    const stagingProcessedCount = Number(
      stagingReservationResult?.records_processed ??
      (stagingData.records_processed as number | undefined) ??
      reservationsSyncedCount ??
      0,
    );
    const stagingInsertedCount = Number(
      stagingReservationResult?.records_inserted ??
      (stagingData.records_inserted as number | undefined) ??
      0,
    );
    const stagingUpdatedCount = Number(
      stagingReservationResult?.records_updated ??
      (stagingData.records_updated as number | undefined) ??
      0,
    );

    const coreSyncOk = reservationsOk && effectiveStagingOk;
    const success = classesOk && coreSyncOk;
    const partialSuccess = !classesOk && coreSyncOk;

    const durationMs = Date.now() - startTime;
    const classesSyncedCount = (classesData.syncedCount as number) ?? 0;
    const totalInsertedCount = classesSyncedCount + stagingInsertedCount;
    const totalUpdatedCount = stagingUpdatedCount + ((classesData.recordsUpdated as number) ?? 0);

    const normalizedClassesError = classesError ?? (!classesOk ? 'classes sync returned success=false' : undefined);
    const errors: string[] = [];
    if (!classesOk && normalizedClassesError) errors.push(`classes: ${normalizedClassesError}`);
    if (!reservationsOk && reservationsData.error) errors.push(`reservations: ${reservationsData.error}`);
    if (!effectiveStagingOk && stagingData.error) errors.push(`sync-from-staging: ${stagingData.error}`);

    const classesTotalFetched = (classesData.totalFetched as number) ?? 0;
    const reservationsTotalFetched = (reservationsData.totalFetched as number) ?? (reservationsData.records_processed as number) ?? 0;
    const classesSkippedCount = Number((classesData.recordsSkipped as number | undefined) ?? (classesData.duplicatesSkipped as number | undefined) ?? 0);
    const reservationsSkippedCount = Number((reservationsData.recordsSkipped as number | undefined) ?? 0);
    const stagingSkippedCount = Number(
      stagingReservationResult?.records_skipped ??
      (stagingData.records_skipped as number | undefined) ??
      0,
    );
    const totalSkippedCount = classesSkippedCount + reservationsSkippedCount + stagingSkippedCount;

    // ── 6) Update parent log with final results ───────────────────────
    if (parentLogId) {
      await updateParentLog(supabase, parentLogId, {
        syncSuccess: success,
        durationMs,
        recordsProcessed: classesTotalFetched + (stagingProcessedCount || reservationsTotalFetched),
        recordsInserted: totalInsertedCount,
        recordsUpdated: totalUpdatedCount,
        recordsSkipped: totalSkippedCount,
        errorMessage: errors.length > 0 ? errors.join('; ') : undefined,
      });
    }

    const responseBody = {
      success,
      partialSuccess,
      error: errors.length > 0 ? errors.join('; ') : undefined,
      syncedCount: classesSyncedCount + reservationsSyncedCount,
      recordsInserted: totalInsertedCount,
      recordsUpdated: totalUpdatedCount,
      totalFetched: classesTotalFetched + reservationsTotalFetched,
      dateRange: { startDate, endDate },
      durationMs,
      nextStartAfterId: classesData.nextStartAfterId ?? null,
      hasMore: classesData.hasMore ?? false,
      classes: {
        success: classesOk,
        syncedCount: classesSyncedCount,
        totalFetched: classesTotalFetched,
        error: normalizedClassesError ?? null,
      },
      reservations: {
        success: reservationsOk,
        syncedCount: reservationsSyncedCount,
        totalFetched: reservationsTotalFetched,
        error: reservationsData.error ?? null,
      },
      syncFromStaging: {
        success: effectiveStagingOk,
        recordsProcessed: stagingProcessedCount,
        recordsInserted: stagingInsertedCount,
        recordsUpdated: stagingUpdatedCount,
        error: stagingData.error ?? null,
      },
    };

    return new Response(
      JSON.stringify(responseBody),
      {
        status: success || partialSuccess ? 200 : 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const durationMs = Date.now() - startTime;

    try {
      // No parent log update needed in catch - it stays as-is with success=true/0 records
      // which is clearly incomplete
    } catch (logErr) {
      console.error('[sync-arketa-classes-and-reservations] Failed to log error:', logErr);
    }

    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

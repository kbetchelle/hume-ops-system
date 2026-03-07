/**
 * refresh-daily-schedule: Rebuild daily_schedule from arketa_classes + arketa_reservations_history.
 * Invoked on schedule and after syncs. Uses RPC refresh_daily_schedule(date).
 *
 * ISSUE 2 FIX: Removed internal call to sync-arketa-reservations.
 * This function now ONLY rebuilds from existing data — the caller is responsible
 * for ensuring reservations are current before calling this.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { logApiCall } from '../_shared/apiLogger.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface RequestBody {
  schedule_date?: string;
  start_date?: string;
  end_date?: string;
  triggeredBy?: string;
  parentLogId?: string;
  skipReservationSync?: boolean; // kept for backward compat but now always true
}

/** Today's date in America/Los_Angeles as YYYY-MM-DD */
function todayPacific(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date());
  const y = parts.find((p) => p.type === 'year')!.value;
  const m = parts.find((p) => p.type === 'month')!.value;
  const d = parts.find((p) => p.type === 'day')!.value;
  return `${y}-${m}-${d}`;
}

/** Add days to a YYYY-MM-DD string */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = getCorsHeaders(req);

  const startTime = Date.now();

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = (await req.json().catch(() => ({}))) as RequestBody;

    const scheduleDate = body.schedule_date ?? body.start_date ?? todayPacific();
    const endDate = body.end_date ?? addDays(todayPacific(), 7);

    // Validate date format YYYY-MM-DD
    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRe.test(scheduleDate)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid schedule_date; use YYYY-MM-DD' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rebuild daily_schedule via RPC (no reservation sync — caller's responsibility)
    const dates: string[] = [];
    if (scheduleDate === endDate) {
      dates.push(scheduleDate);
    } else {
      const start = new Date(scheduleDate);
      const end = new Date(endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().slice(0, 10));
      }
    }

    let totalInserted = 0;
    for (const d of dates) {
      const { data: count, error } = await supabase.rpc('refresh_daily_schedule', {
        p_schedule_date: d,
      });
      if (error) {
        const durationMs = Date.now() - startTime;
        await logApiCall(supabase, {
          apiName: 'daily_schedule',
          endpoint: '/refresh-daily-schedule',
          syncSuccess: false,
          durationMs,
          recordsProcessed: dates.length,
          recordsInserted: totalInserted,
          responseStatus: 500,
          errorMessage: error.message,
          triggeredBy: body.triggeredBy || 'manual',
          parentLogId: body.parentLogId,
        });

        return new Response(
          JSON.stringify({ success: false, error: error.message, date: d }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      totalInserted += Number(count ?? 0);
    }

    const durationMs = Date.now() - startTime;
    await logApiCall(supabase, {
      apiName: 'daily_schedule',
      endpoint: '/refresh-daily-schedule',
      syncSuccess: true,
      durationMs,
      recordsProcessed: dates.length,
      recordsInserted: totalInserted,
      responseStatus: 200,
      triggeredBy: body.triggeredBy || 'manual',
      parentLogId: body.parentLogId,
    });

    return new Response(
      JSON.stringify({
        success: true,
        schedule_date: scheduleDate,
        end_date: endDate,
        dates_refreshed: dates.length,
        rows_inserted: totalInserted,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const durationMs = Date.now() - startTime;

    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await logApiCall(supabase, {
        apiName: 'daily_schedule',
        endpoint: '/refresh-daily-schedule',
        syncSuccess: false,
        durationMs,
        recordsProcessed: 0,
        recordsInserted: 0,
        responseStatus: 500,
        errorMessage: message,
        triggeredBy: 'manual',
      });
    } catch (_logErr) {
      console.error('[refresh-daily-schedule] Failed to log error:', _logErr);
    }

    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

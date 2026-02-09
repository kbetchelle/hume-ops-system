/**
 * sync-arketa-classes-and-reservations: Run classes sync then reservations sync with the same date range.
 * Use for manual "one-click" Arketa sync; same startDate/endDate (default -7 to +7) for both.
 */
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface WrapperRequest {
  start_date?: string;
  end_date?: string;
  startDate?: string;
  endDate?: string;
  triggeredBy?: string;
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = getCorsHeaders(req);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  try {
    const body = (await req.json().catch(() => ({}))) as WrapperRequest;
    const today = new Date();
    const defaultStart = new Date(today);
    defaultStart.setDate(defaultStart.getDate() - 7);
    const defaultEnd = new Date(today);
    defaultEnd.setDate(defaultEnd.getDate() + 7);
    const startDate = body.startDate ?? body.start_date ?? defaultStart.toISOString().split('T')[0];
    const endDate = body.endDate ?? body.end_date ?? defaultEnd.toISOString().split('T')[0];

    const payload = { startDate, endDate, triggeredBy: body.triggeredBy ?? 'manual' };

    // 1) Classes first
    const classesUrl = `${supabaseUrl}/functions/v1/sync-arketa-classes`;
    const classesRes = await fetch(classesUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify(payload),
    });
    const classesData = classesRes.ok
      ? (await classesRes.json().catch(() => ({})))
      : { success: false, error: await classesRes.text() };

    if (!classesRes.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Classes sync failed',
          classes: classesData,
          reservations: null,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2) Reservations with same range
    const reservationsUrl = `${supabaseUrl}/functions/v1/sync-arketa-reservations`;
    const reservationsRes = await fetch(reservationsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify(payload),
    });
    const reservationsData = reservationsRes.ok
      ? (await reservationsRes.json().catch(() => ({})))
      : { success: false, error: await reservationsRes.text() };

    const success = classesData.success !== false && reservationsData.success !== false && !reservationsData.error;

    return new Response(
      JSON.stringify({
        success,
        dateRange: { startDate, endDate },
        classes: {
          success: classesData.success !== false,
          syncedCount: classesData.syncedCount ?? 0,
          totalFetched: classesData.totalFetched ?? 0,
          error: classesData.error ?? null,
        },
        reservations: reservationsData.error
          ? { success: false, error: reservationsData.error }
          : {
              success: reservationsData.success !== false,
              syncedCount: reservationsData.syncedCount ?? reservationsData.data?.reservations_synced ?? 0,
              totalFetched: reservationsData.totalFetched ?? reservationsData.records_processed ?? 0,
              error: reservationsData.error ?? null,
            },
      }),
      {
        status: success ? 200 : 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

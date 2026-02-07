/**
 * aggregate-arketa-to-daily-reports: Build daily_reports from arketa_reservations_history.
 * See docs/ARKETA_ARCHITECTURE.md — class_name "gym check in" → total_gym_checkins, else → total_class_checkins.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface RequestBody {
  start_date?: string;
  end_date?: string;
  startDate?: string;
  endDate?: string;
}

function isGymCheckin(className: string | null): boolean {
  return (className ?? '').toLowerCase().trim() === 'gym check in';
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = getCorsHeaders(req);

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = (await req.json().catch(() => ({}))) as RequestBody;
    const today = new Date();
    const defaultEnd = new Date(today);
    const defaultStart = new Date(today);
    defaultStart.setDate(defaultStart.getDate() - 7);
    const startDate = body.startDate ?? body.start_date ?? defaultStart.toISOString().split('T')[0];
    const endDate = body.endDate ?? body.end_date ?? defaultEnd.toISOString().split('T')[0];

    const { data: rows, error: fetchError } = await supabase
      .from('arketa_reservations_history')
      .select('class_date, class_name')
      .eq('checked_in', true)
      .gte('class_date', startDate)
      .lte('class_date', endDate)
      .not('class_date', 'is', null);

    if (fetchError) {
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const byDate: Record<string, { gym: number; class: number }> = {};
    for (const r of rows ?? []) {
      const d = r.class_date as string;
      if (!d) continue;
      if (!byDate[d]) byDate[d] = { gym: 0, class: 0 };
      if (isGymCheckin(r.class_name as string | null)) byDate[d].gym++;
      else byDate[d].class++;
    }

    let upserted = 0;
    for (const [report_date, counts] of Object.entries(byDate)) {
      const { error: upsertError } = await supabase
        .from('daily_reports')
        .upsert(
          {
            report_date,
            total_gym_checkins: counts.gym,
            total_class_checkins: counts.class,
            last_synced_at: new Date().toISOString(),
          },
          { onConflict: 'report_date', ignoreDuplicates: false }
        )
        .select('id');

      if (!upsertError) upserted++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        startDate,
        endDate,
        datesUpdated: upserted,
        datesWithData: Object.keys(byDate).length,
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

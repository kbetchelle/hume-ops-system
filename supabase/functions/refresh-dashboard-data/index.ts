import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Today in America/Los_Angeles as YYYY-MM-DD */
function todayPacific(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${d}`;
}

/** Generate array of YYYY-MM-DD strings from start for numDays */
function dateRange(start: string, numDays: number): string[] {
  const dates: string[] = [];
  const d = new Date(start + "T00:00:00");
  for (let i = 0; i < numDays; i++) {
    dates.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const results: Record<string, unknown> = {};

    // 1. Refresh daily_schedule for the full 8-day window (today through today+7) using Pacific time
    const today = todayPacific();
    const scheduleDates = dateRange(today, 8);

    for (const date of scheduleDates) {
      const { data, error } = await supabase.rpc("refresh_daily_schedule", {
        p_schedule_date: date,
      });
      results[`schedule_${date}`] = error
        ? { error: error.message }
        : { rows_inserted: data };
    }

    // 2. Process any scheduled messages that are due
    const { error: msgError } = await supabase.rpc(
      "process_scheduled_messages"
    );
    results.scheduled_messages = msgError
      ? { error: msgError.message }
      : "processed";

    // 3. Trigger daily report aggregation via the existing edge function
    try {
      const aggResponse = await fetch(
        `${supabaseUrl}/functions/v1/auto-aggregate-daily-report`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ source: "dashboard-refresh-cron" }),
        }
      );
      const aggText = await aggResponse.text();
      results.daily_report_aggregation = aggResponse.ok
        ? "triggered"
        : { status: aggResponse.status, body: aggText };
    } catch (e) {
      results.daily_report_aggregation = {
        error: e instanceof Error ? e.message : String(e),
      };
    }

    // 4. Notify unlinked scheduled sling users (for inbox widget)
    const { error: unlinkError } = await supabase.rpc(
      "notify_unlinked_scheduled_sling_users"
    );
    results.unlinked_sling_check = unlinkError
      ? { error: unlinkError.message }
      : "checked";

    console.log("Dashboard refresh completed:", JSON.stringify(results));

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Dashboard refresh error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

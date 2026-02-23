import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const results: Record<string, unknown> = {};

    // 1. Refresh daily_schedule for today and tomorrow
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    for (const date of [formatDate(today), formatDate(tomorrow)]) {
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

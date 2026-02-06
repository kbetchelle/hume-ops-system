import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface SyncResult {
  date: string;
  existingBefore: number;
  newRecords: number;
  recordCount: number;
  success: boolean;
  error?: string;
}

type JobType = "arketa_reservations" | "arketa_payments";

function eachDayOfInterval(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getSyncConfig(jobType: JobType) {
  switch (jobType) {
    case "arketa_payments":
      return {
        syncFunction: "sync-arketa-payments",
        historyTable: "arketa_payments_history",
        dateColumn: "start_date",
        transferApi: "arketa_payments" as const,
      };
    case "arketa_reservations":
    default:
      return {
        syncFunction: "sync-arketa-reservations",
        historyTable: "arketa_reservations_history",
        dateColumn: "class_date",
        transferApi: "arketa_reservations" as const,
      };
  }
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = getCorsHeaders(req);

  try {
    const { jobId, action } = await req.json();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (action === "cancel" && jobId) {
      const { error } = await supabase
        .from("backfill_jobs")
        .update({ status: "cancelled", completed_at: new Date().toISOString() })
        .eq("id", jobId)
        .eq("status", "running");
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, cancelled: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: job, error: fetchError } = await supabase
      .from("backfill_jobs")
      .select("*")
      .eq("id", jobId)
      .single();
    if (fetchError || !job) throw new Error(`Job not found: ${jobId}`);
    if (job.status !== "pending" && job.status !== "running") {
      return new Response(JSON.stringify({ success: false, error: `Job is ${job.status}, cannot process` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const jobType = (job.job_type || job.api_source + "_" + job.data_type || "arketa_reservations") as JobType;
    const config = getSyncConfig(jobType);

    await supabase.from("backfill_jobs").update({ status: "running", started_at: job.started_at || new Date().toISOString() }).eq("id", jobId);

    const startDate = new Date(job.start_date);
    const endDate = new Date(job.end_date);
    const allDates = eachDayOfInterval(startDate, endDate);
    const existingResults: SyncResult[] = job.results || [];
    const processedDates = new Set(existingResults.map((r: SyncResult) => r.date));
    const remainingDates = allDates.filter(d => !processedDates.has(formatDate(d)));

    if (remainingDates.length === 0) {
      await supabase.from("backfill_jobs").update({ status: "completed", completed_at: new Date().toISOString(), completed_dates: allDates.length }).eq("id", jobId);
      return new Response(JSON.stringify({ success: true, completed: true, totalDates: allDates.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const BATCH_SIZE = 5;
    const datesToProcess = remainingDates.slice(0, BATCH_SIZE);
    const results: SyncResult[] = [...existingResults];
    let totalRecords = job.total_records || 0;
    let totalNewRecords = job.total_new_records || 0;

    for (const date of datesToProcess) {
      const dateStr = formatDate(date);
      const { data: currentJob } = await supabase.from("backfill_jobs").select("status").eq("id", jobId).single();
      if (currentJob?.status === "cancelled") {
        return new Response(JSON.stringify({ success: true, cancelled: true, completedDates: results.length }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase.from("backfill_jobs").update({ processing_date: dateStr }).eq("id", jobId);
      const { count: existingBefore } = await supabase.from(config.historyTable).select("*", { count: "exact", head: true }).eq(config.dateColumn, dateStr);
      const existingCount = existingBefore || 0;

      try {
        const syncResponse = await fetch(`${SUPABASE_URL}/functions/v1/${config.syncFunction}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
          body: JSON.stringify({ startDate: dateStr, endDate: dateStr, triggeredBy: "backfill-job", manual: true, noLimit: true }),
        });
        const syncData = await syncResponse.json();

        if (!syncResponse.ok) {
          results.push({ date: dateStr, existingBefore: existingCount, newRecords: 0, recordCount: 0, success: false, error: syncData.error || "Sync failed" });
        } else {
          const recordCount = syncData?.data?.reservations_synced ?? syncData?.data?.payments_synced ?? syncData?.data?.payments_staged ?? syncData?.recordsInserted ?? syncData?.recordsProcessed ?? 0;
          await new Promise(resolve => setTimeout(resolve, 500));
          const { count: afterCount } = await supabase.from(config.historyTable).select("*", { count: "exact", head: true }).eq(config.dateColumn, dateStr);
          const newRecords = Math.max(0, (afterCount || 0) - existingCount);
          totalRecords += recordCount;
          totalNewRecords += newRecords;
          results.push({ date: dateStr, existingBefore: existingCount, newRecords, recordCount, success: syncData?.success !== false });
        }
      } catch (err) {
        results.push({ date: dateStr, existingBefore: existingCount, newRecords: 0, recordCount: 0, success: false, error: err instanceof Error ? err.message : "Unknown error" });
      }

      await supabase.from("backfill_jobs").update({ completed_dates: results.length, total_records: totalRecords, total_new_records: totalNewRecords, results }).eq("id", jobId);
    }

    // Transfer staging → history after each batch so users see records in history during the job (not only at completion)
    if (results.some(r => r.success && r.recordCount > 0)) {
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/sync-from-staging`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
          body: JSON.stringify({ api: config.transferApi, clear_staging: true, sync_batch_id: undefined }),
        });
      } catch (err) {
        console.error("Failed to trigger sync-from-staging:", err);
      }
    }

    const isComplete = results.length >= allDates.length;
    if (isComplete) {
      await supabase.from("backfill_jobs").update({ status: "completed", completed_at: new Date().toISOString(), processing_date: null }).eq("id", jobId);
      return new Response(JSON.stringify({ success: true, completed: true, totalDates: allDates.length, totalRecords, totalNewRecords }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    fetch(`${SUPABASE_URL}/functions/v1/run-backfill-job`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
      body: JSON.stringify({ jobId }),
    }).catch(err => console.error("Failed to trigger next batch:", err));

    return new Response(JSON.stringify({ success: true, completed: false, processedDates: results.length, totalDates: allDates.length, remainingDates: allDates.length - results.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Backfill job error:", error);
    const corsHeaders = getCorsHeaders(req);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

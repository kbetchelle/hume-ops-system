import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const BATCH_BREAK_MS = 20_000; // 20-second break between batches

interface SyncResult {
  date: string;
  existingBefore: number;
  newRecords: number;
  recordCount: number;
  success: boolean;
  error?: string;
  hitPageLimit?: boolean;
}

type JobType = "arketa_reservations" | "arketa_payments" | "arketa_classes" | "arketa_classes_and_reservations" | "toast_orders";

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

/** Next calendar day in UTC (YYYY-MM-DD). For date-range counts on timestamptz. */
function nextDayUtc(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00.000Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().split("T")[0];
}

function getSyncConfig(jobType: JobType) {
  switch (jobType) {
    case "arketa_classes":
      return {
        syncFunction: "sync-arketa-classes",
        historyTable: "arketa_classes",
        dateColumn: "class_date",
        transferApi: null,
        needsTransfer: false,
      };
    case "toast_orders":
      return {
        syncFunction: "toast-backfill-sync",
        historyTable: "toast_sales",
        dateColumn: "business_date",
        transferApi: null,
        needsTransfer: false,
      };
    case "arketa_payments":
      return {
        syncFunction: "sync-arketa-payments",
        historyTable: "arketa_payments",
        dateColumn: "created_at_api",
        transferApi: "arketa_payments" as const,
        needsTransfer: true,
      };
    case "arketa_classes_and_reservations":
      return {
        syncFunction: "sync-arketa-classes-and-reservations",
        historyTable: "arketa_reservations_history",
        dateColumn: "class_date",
        transferApi: null,
        needsTransfer: false,
      };
    case "arketa_reservations":
    default:
      return {
        syncFunction: "sync-arketa-reservations",
        historyTable: "arketa_reservations_history",
        dateColumn: "class_date",
        transferApi: "arketa_reservations" as const,
        needsTransfer: true,
      };
  }
}

/**
 * Cursor-based backfill for arketa_classes (and classes+reservations).
 * Paginates using the API's nextStartAfterId (stored in batch_cursor); first page
 * has no cursor. 20s break between batches.
 */
async function handleClassesBackfill(supabase: any, job: any, jobId: string, corsHeaders: Record<string, string>, jobType: JobType = "arketa_classes") {
  const startDate = job.start_date;
  const endDate = job.end_date;
  const config = getSyncConfig(jobType);
  const historyTable = jobType === "arketa_classes_and_reservations" ? "arketa_reservations_history" : "arketa_classes";

  // Check for cancellation
  const { data: currentJob } = await supabase.from("backfill_jobs").select("status").eq("id", jobId).single();
  if (currentJob?.status === "cancelled") {
    return new Response(JSON.stringify({ success: true, cancelled: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Cursor for pagination: use only the API's opaque cursor from a previous batch.
  // Do not derive from DB (class external_id); Partner API requires the full nextStartAfterId value.
  const startAfterId: string | undefined = job.batch_cursor ?? undefined;
  if (!startAfterId) {
    console.log(`[backfill] No batch_cursor; first page of date range`);
  }

  // Count existing records before sync
  const { count: existingBefore } = await supabase
    .from(historyTable)
    .select("*", { count: "exact", head: true })
    .gte(config.dateColumn, startDate)
    .lte(config.dateColumn, endDate);
  const existingCount = existingBefore || 0;

  await supabase.from("backfill_jobs").update({ processing_date: startDate }).eq("id", jobId);

  // Call the sync function with start_after_id for cursor-based pagination
  const syncFunctionName = config.syncFunction;
  let syncResult: { success: boolean; syncedCount?: number; totalFetched?: number; nextStartAfterId?: string; hasMore?: boolean; error?: string } = {
    success: false, error: 'Not executed',
  };

  try {
    const syncBody = jobType === "arketa_classes_and_reservations"
      ? { start_date: startDate, end_date: endDate, triggeredBy: "backfill-job", start_after_id: startAfterId }
      : { startDate, endDate, start_after_id: startAfterId };

    console.log(`[backfill] Calling ${syncFunctionName} with start_after_id=${startAfterId ?? 'none'}`);
    const syncResponse = await fetch(`${SUPABASE_URL}/functions/v1/${syncFunctionName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
      body: JSON.stringify(syncBody),
    });
    const syncData = await syncResponse.json();

    if (!syncResponse.ok) {
      syncResult = { success: false, error: syncData.error || `Sync returned ${syncResponse.status}` };
    } else {
      syncResult = {
        success: syncData?.success !== false,
        syncedCount: syncData?.syncedCount ?? 0,
        totalFetched: syncData?.totalFetched ?? 0,
        nextStartAfterId: syncData?.nextStartAfterId ?? null,
        hasMore: syncData?.hasMore ?? false,
        error: syncData?.error,
      };
    }
  } catch (err) {
    syncResult = { success: false, error: err instanceof Error ? err.message : String(err) };
  }

  // Count records after sync
  await new Promise(resolve => setTimeout(resolve, 500));
  const { count: afterCount } = await supabase
    .from(historyTable)
    .select("*", { count: "exact", head: true })
    .gte(config.dateColumn, startDate)
    .lte(config.dateColumn, endDate);
  const newRecords = Math.max(0, (afterCount || 0) - existingCount);

  const totalRecords = (job.total_records || 0) + (syncResult.syncedCount ?? 0);
  const totalNewRecords = (job.total_new_records || 0) + newRecords;
  const batchesCompleted = (job.total_batches_completed || 0) + 1;

  // Build result entry
  const results: SyncResult[] = [...(job.results || [])];
  const batchKey = `batch_${batchesCompleted}`;
  results.push({
    date: batchKey,
    existingBefore: existingCount,
    newRecords,
    recordCount: syncResult.syncedCount ?? 0,
    success: syncResult.success,
    error: syncResult.error,
  });

  // Determine if backfill is complete
  const isComplete = !syncResult.hasMore || !syncResult.nextStartAfterId || syncResult.totalFetched === 0;

  if (isComplete) {
    await supabase.from("backfill_jobs").update({
      status: "completed",
      completed_at: new Date().toISOString(),
      processing_date: null,
      total_records: totalRecords,
      total_new_records: totalNewRecords,
      total_batches_completed: batchesCompleted,
      batch_cursor: null,
      results,
    }).eq("id", jobId);

    return new Response(JSON.stringify({
      success: true,
      completed: true,
      totalRecords,
      totalNewRecords,
      batchesCompleted,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Not complete — save cursor and schedule next batch with 20s break
  await supabase.from("backfill_jobs").update({
    total_records: totalRecords,
    total_new_records: totalNewRecords,
    total_batches_completed: batchesCompleted,
    batch_cursor: syncResult.nextStartAfterId,
    results,
  }).eq("id", jobId);

  console.log(`[backfill] Batch ${batchesCompleted} done: ${syncResult.syncedCount} synced, ${newRecords} new. Next cursor: ${syncResult.nextStartAfterId}. Waiting ${BATCH_BREAK_MS / 1000}s...`);

  // 20-second break between batches to avoid timeouts
  await new Promise(resolve => setTimeout(resolve, BATCH_BREAK_MS));

  // Trigger next batch
  fetch(`${SUPABASE_URL}/functions/v1/run-backfill-job`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
    body: JSON.stringify({ jobId }),
  }).catch(err => console.error("Failed to trigger next batch:", err));

  return new Response(JSON.stringify({
    success: true,
    completed: false,
    batchesCompleted,
    nextCursor: syncResult.nextStartAfterId,
    hasMore: syncResult.hasMore,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}


function buildSyncBody(jobType: JobType, dateStr: string): Record<string, unknown> {
  if (jobType === "toast_orders") {
    return { start_date: dateStr, end_date: dateStr };
  }
  if (jobType === "arketa_classes_and_reservations") {
    return { start_date: dateStr, end_date: dateStr, triggeredBy: "backfill-job" };
  }
  return { startDate: dateStr, endDate: dateStr, triggeredBy: "backfill-job", manual: true, noLimit: true };
}

/** Extract record count from sync response based on job type */
function extractRecordCount(jobType: JobType, syncData: Record<string, unknown>): { recordCount: number; totalFetched: number } {
  if (jobType === "toast_orders") {
    return {
      recordCount: (syncData?.ordersThisRun as number) ?? 0,
      totalFetched: (syncData?.ordersThisRun as number) ?? 0,
    };
  }
  if (jobType === "arketa_classes") {
    return {
      recordCount: (syncData?.syncedCount as number) ?? (syncData?.totalFetched as number) ?? 0,
      totalFetched: (syncData?.totalFetched as number) ?? 0,
    };
  }
  if (jobType === "arketa_classes_and_reservations") {
    const classes = syncData?.classes as Record<string, unknown> | undefined;
    const reservations = syncData?.reservations as Record<string, unknown> | undefined;
    const reservationsSynced = (reservations?.syncedCount as number) ?? 0;
    const classesFetched = (classes?.totalFetched as number) ?? 0;
    const reservationsFetched = (reservations?.totalFetched as number) ?? 0;
    return {
      recordCount: reservationsSynced,
      totalFetched: classesFetched + reservationsFetched,
    };
  }
  const data = syncData?.data as Record<string, unknown> | undefined;
  return {
    recordCount: (data?.reservations_synced as number) ?? (data?.payments_synced as number) ?? (data?.payments_staged as number) ?? (syncData?.recordsInserted as number) ?? (syncData?.recordsProcessed as number) ?? 0,
    totalFetched: (syncData?.totalFetched as number) ?? 0,
  };
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

    // ── Arketa Classes (and Classes+Reservations): cursor-based backfill ──
    if (jobType === "arketa_classes" || jobType === "arketa_classes_and_reservations") {
      return await handleClassesBackfill(supabase, job, jobId, corsHeaders, jobType);
    }

    const startDate = new Date(job.start_date);
    const endDate = new Date(job.end_date);
    const allDates = eachDayOfInterval(startDate, endDate);
    const existingResults: SyncResult[] = job.results || [];
    
    // On restart, re-sync the last successfully synced date to ensure no records were missed
    const successResults = existingResults.filter((r: SyncResult) => r.success);
    const lastSuccessDate = successResults.length > 0 ? successResults[successResults.length - 1]?.date : null;
    const processedDates = new Set(existingResults.filter((r: SyncResult) => r.success).map((r: SyncResult) => r.date));
    if (lastSuccessDate) {
      processedDates.delete(lastSuccessDate);
      const lastIdx = existingResults.findIndex((r: SyncResult) => r.date === lastSuccessDate && r.success);
      if (lastIdx !== -1) existingResults.splice(lastIdx, 1);
    }
    
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
    let batchHitPageLimit = false;
    let cumulativeInserted = job.cumulative_inserted || 0;
    let cumulativeUpdated = job.cumulative_updated || 0;

    for (const date of datesToProcess) {
      const dateStr = formatDate(date);
      const { data: currentJob } = await supabase.from("backfill_jobs").select("status").eq("id", jobId).single();
      if (currentJob?.status === "cancelled") {
        return new Response(JSON.stringify({ success: true, cancelled: true, completedDates: results.length }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update phase: fetching
      await supabase.from("backfill_jobs").update({
        processing_date: dateStr,
        sync_phase: "fetching",
        current_batch_count: datesToProcess.indexOf(date) + 1,
        records_in_current_batch: 0,
      }).eq("id", jobId);

      // arketa_payments uses created_at_api (timestamptz): count by date range; others use date eq
      const countQuery =
        jobType === "arketa_payments"
          ? supabase
              .from(config.historyTable)
              .select("*", { count: "exact", head: true })
              .gte(config.dateColumn, `${dateStr}T00:00:00.000Z`)
              .lt(config.dateColumn, `${nextDayUtc(dateStr)}T00:00:00.000Z`)
          : supabase.from(config.historyTable).select("*", { count: "exact", head: true }).eq(config.dateColumn, dateStr);
      const { count: existingBefore } = await countQuery;
      const existingCount = existingBefore || 0;

      try {
        // Update phase: staging
        await supabase.from("backfill_jobs").update({ sync_phase: "staging" }).eq("id", jobId);

        const syncBody = buildSyncBody(jobType, dateStr);
        const syncResponse = await fetch(`${SUPABASE_URL}/functions/v1/${config.syncFunction}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
          body: JSON.stringify(syncBody),
        });
        const syncData = await syncResponse.json();

        if (!syncResponse.ok) {
          results.push({ date: dateStr, existingBefore: existingCount, newRecords: 0, recordCount: 0, success: false, error: syncData.error || "Sync failed" });
        } else {
          const { recordCount, totalFetched } = extractRecordCount(jobType, (syncData ?? {}) as Record<string, unknown>);

          // Update phase: transferring (for types that need staging→prod transfer)
          if (config.needsTransfer) {
            await supabase.from("backfill_jobs").update({
              sync_phase: "transferring",
              records_in_current_batch: recordCount,
            }).eq("id", jobId);
          }

          await new Promise(resolve => setTimeout(resolve, 500));
          const afterCountQuery =
            jobType === "arketa_payments"
              ? supabase
                  .from(config.historyTable)
                  .select("*", { count: "exact", head: true })
                  .gte(config.dateColumn, `${dateStr}T00:00:00.000Z`)
                  .lt(config.dateColumn, `${nextDayUtc(dateStr)}T00:00:00.000Z`)
              : supabase.from(config.historyTable).select("*", { count: "exact", head: true }).eq(config.dateColumn, dateStr);
          const { count: afterCount } = await afterCountQuery;
          const newRecords = Math.max(0, (afterCount || 0) - existingCount);
          totalRecords += recordCount;
          totalNewRecords += newRecords;
          cumulativeInserted += newRecords;
          cumulativeUpdated += Math.max(0, recordCount - newRecords);
          
          const hitPageLimit = totalFetched > 0 && totalFetched % (jobType === "toast_orders" ? 100 : 400) === 0;
          if (hitPageLimit) {
            console.log(`[run-backfill-job] Page limit likely hit for ${dateStr} (fetched ${totalFetched}). Will schedule break.`);
            batchHitPageLimit = true;
          }
          
          results.push({ date: dateStr, existingBefore: existingCount, newRecords, recordCount, success: syncData?.success !== false, hitPageLimit });
        }
      } catch (err) {
        results.push({ date: dateStr, existingBefore: existingCount, newRecords: 0, recordCount: 0, success: false, error: err instanceof Error ? err.message : "Unknown error" });
      }

      await supabase.from("backfill_jobs").update({
        completed_dates: results.length,
        total_records: totalRecords,
        total_new_records: totalNewRecords,
        cumulative_inserted: cumulativeInserted,
        cumulative_updated: cumulativeUpdated,
        results,
        sync_phase: "idle",
      }).eq("id", jobId);

      // 20-second break between each date in the batch
      if (datesToProcess.indexOf(date) < datesToProcess.length - 1) {
        console.log(`[run-backfill-job] ${BATCH_BREAK_MS / 1000}s break between dates...`);
        await supabase.from("backfill_jobs").update({ sync_phase: "cooldown" }).eq("id", jobId);
        await new Promise(resolve => setTimeout(resolve, BATCH_BREAK_MS));
      }
    }

    // Transfer staging → history after each batch (only for types that use staging)
    if (config.needsTransfer && config.transferApi && results.some(r => r.success && r.recordCount > 0)) {
      await supabase.from("backfill_jobs").update({ sync_phase: "transferring" }).eq("id", jobId);
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/sync-from-staging`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
          body: JSON.stringify({ api: config.transferApi, clear_staging: true, sync_batch_id: undefined }),
        });
      } catch (err) {
        console.error("Failed to trigger sync-from-staging:", err);
      }
      await supabase.from("backfill_jobs").update({ sync_phase: "idle" }).eq("id", jobId);
    }

    const isComplete = results.length >= allDates.length;
    if (isComplete) {
      await supabase.from("backfill_jobs").update({ status: "completed", completed_at: new Date().toISOString(), processing_date: null }).eq("id", jobId);
      return new Response(JSON.stringify({ success: true, completed: true, totalDates: allDates.length, totalRecords, totalNewRecords }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Break before triggering next batch
    console.log(`[run-backfill-job] ${BATCH_BREAK_MS / 1000}s break before next batch...`);
    await new Promise(resolve => setTimeout(resolve, BATCH_BREAK_MS));

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

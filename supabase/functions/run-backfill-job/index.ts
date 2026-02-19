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

/** Handle arketa_classes with wide-range syncs (7-day chunks) instead of day-by-day */
async function handleClassesBackfill(supabase: any, job: any, jobId: string, corsHeaders: Record<string, string>, jobType: JobType = "arketa_classes") {
  const startDate = new Date(job.start_date);
  const endDate = new Date(job.end_date);
  const CHUNK_DAYS = 7;
  
  // Build weekly chunks
  const chunks: { start: string; end: string }[] = [];
  const cur = new Date(startDate);
  while (cur <= endDate) {
    const chunkEnd = new Date(cur);
    chunkEnd.setDate(chunkEnd.getDate() + CHUNK_DAYS - 1);
    if (chunkEnd > endDate) chunkEnd.setTime(endDate.getTime());
    chunks.push({ start: formatDate(cur), end: formatDate(chunkEnd) });
    cur.setDate(cur.getDate() + CHUNK_DAYS);
  }

  // Deduplicate results by chunk key, keeping latest entry per chunk
  const rawResults: SyncResult[] = job.results || [];
  const resultsByKey = new Map<string, SyncResult>();
  for (const r of rawResults) {
    resultsByKey.set(r.date, r);
  }

  // Identify successfully completed chunks
  const completedChunks = new Set<string>();
  for (const [key, r] of resultsByKey) {
    if (r.success) completedChunks.add(key);
  }
  
  // Re-sync last successful chunk on restart to catch missed records
  // But skip if there's only one chunk total — otherwise it loops forever
  const successKeys = [...completedChunks];
  const lastSuccessChunk = successKeys.length > 0 ? successKeys[successKeys.length - 1] : null;
  if (lastSuccessChunk && chunks.length > 1) {
    completedChunks.delete(lastSuccessChunk);
    resultsByKey.delete(lastSuccessChunk);
  }

  // Remove failed entries so they get retried (don't count toward completion)
  for (const [key, r] of resultsByKey) {
    if (!r.success) resultsByKey.delete(key);
  }

  const remainingChunks = chunks.filter(c => !completedChunks.has(`${c.start}_${c.end}`));

  if (remainingChunks.length === 0) {
    await supabase.from("backfill_jobs").update({ status: "completed", completed_at: new Date().toISOString(), processing_date: null, completed_dates: chunks.length }).eq("id", jobId);
    return new Response(JSON.stringify({ success: true, completed: true, totalChunks: chunks.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Process one chunk at a time (each is already a wide-range API call)
  const chunk = remainingChunks[0];
  const results: SyncResult[] = [...resultsByKey.values()];
  let totalRecords = job.total_records || 0;
  let totalNewRecords = job.total_new_records || 0;
  const chunkKey = `${chunk.start}_${chunk.end}`;

  const { data: currentJob } = await supabase.from("backfill_jobs").select("status").eq("id", jobId).single();
  if (currentJob?.status === "cancelled") {
    return new Response(JSON.stringify({ success: true, cancelled: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  await supabase.from("backfill_jobs").update({ processing_date: chunk.start }).eq("id", jobId);

  // Determine sync function and history table based on job type
  const chunkConfig = getSyncConfig(jobType);
  const syncFunctionName = chunkConfig.syncFunction;
  const historyTable = jobType === "arketa_classes_and_reservations" ? "arketa_reservations_history" : "arketa_classes";

  // Count existing records in this chunk's date range before sync
  const { count: existingBefore } = await supabase.from(historyTable).select("*", { count: "exact", head: true }).gte(chunkConfig.dateColumn, chunk.start).lte(chunkConfig.dateColumn, chunk.end);
  const existingCount = existingBefore || 0;

  let chunkResult: SyncResult;
  try {
    const syncBody = jobType === "arketa_classes_and_reservations"
      ? { start_date: chunk.start, end_date: chunk.end, triggeredBy: "backfill-job" }
      : { startDate: chunk.start, endDate: chunk.end };
    const syncResponse = await fetch(`${SUPABASE_URL}/functions/v1/${syncFunctionName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
      body: JSON.stringify(syncBody),
    });
    const syncData = await syncResponse.json();

    if (!syncResponse.ok) {
      chunkResult = { date: chunkKey, existingBefore: existingCount, newRecords: 0, recordCount: 0, success: false, error: syncData.error || "Sync failed" };
    } else {
      const { recordCount, totalFetched } = extractRecordCount(jobType, (syncData ?? {}) as Record<string, unknown>);
      await new Promise(resolve => setTimeout(resolve, 500));
      const { count: afterCount } = await supabase.from(historyTable).select("*", { count: "exact", head: true }).gte(chunkConfig.dateColumn, chunk.start).lte(chunkConfig.dateColumn, chunk.end);
      const newRecords = Math.max(0, (afterCount || 0) - existingCount);
      totalRecords += recordCount;
      totalNewRecords += newRecords;

      const hitPageLimit = totalFetched > 0 && totalFetched % 400 === 0;
      chunkResult = { date: chunkKey, existingBefore: existingCount, newRecords, recordCount, success: syncData?.success !== false, hitPageLimit };
      if (hitPageLimit) {
        console.log(`[run-backfill-job] Classes chunk ${chunk.start}-${chunk.end} hit 400 page limit (fetched ${totalFetched}). Scheduling 2-min cooldown.`);
      }
    }
  } catch (err) {
    chunkResult = { date: chunkKey, existingBefore: existingCount, newRecords: 0, recordCount: 0, success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }

  // Upsert result by chunk key (replace any previous entry for this chunk)
  const existingIdx = results.findIndex(r => r.date === chunkKey);
  if (existingIdx !== -1) {
    results[existingIdx] = chunkResult;
  } else {
    results.push(chunkResult);
  }

  await supabase.from("backfill_jobs").update({ completed_dates: results.filter(r => r.success).length, total_records: totalRecords, total_new_records: totalNewRecords, results }).eq("id", jobId);

  // Completion = every chunk has a successful result
  const successfulChunkKeys = new Set(results.filter(r => r.success).map(r => r.date));
  const allChunkKeys = chunks.map(c => `${c.start}_${c.end}`);
  const isComplete = allChunkKeys.every(k => successfulChunkKeys.has(k));

  if (isComplete) {
    await supabase.from("backfill_jobs").update({ status: "completed", completed_at: new Date().toISOString(), processing_date: null, completed_dates: chunks.length }).eq("id", jobId);
    return new Response(JSON.stringify({ success: true, completed: true, totalChunks: chunks.length, totalRecords, totalNewRecords }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Apply cooldown if page limit was hit
  if (chunkResult.hitPageLimit) {
    await supabase.from("backfill_jobs").update({
      retry_scheduled_at: new Date(Date.now() + 120_000).toISOString(),
    }).eq("id", jobId);
    await new Promise(resolve => setTimeout(resolve, 120_000));
  }

  // Schedule next chunk (includes retrying failed chunks)
  fetch(`${SUPABASE_URL}/functions/v1/run-backfill-job`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
    body: JSON.stringify({ jobId }),
  }).catch(err => console.error("Failed to trigger next chunk:", err));

  return new Response(JSON.stringify({ success: true, completed: false, processedChunks: successfulChunkKeys.size, totalChunks: chunks.length }), {
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

    // ── Arketa Classes (and Classes+Reservations): wide-range sync (not day-by-day) ──
    // The Arketa API returns incomplete/empty results for single-day queries,
    // so we must use 7-day chunks for any job type that syncs classes.
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
          await new Promise(resolve => setTimeout(resolve, 500));
          const { count: afterCount } = await supabase.from(config.historyTable).select("*", { count: "exact", head: true }).eq(config.dateColumn, dateStr);
          const newRecords = Math.max(0, (afterCount || 0) - existingCount);
          totalRecords += recordCount;
          totalNewRecords += newRecords;
          
          // Detect if the sync hit the page limit (totalFetched is a multiple of the page size)
          const hitPageLimit = totalFetched > 0 && totalFetched % (jobType === "toast_orders" ? 100 : 400) === 0;
          if (hitPageLimit) {
            console.log(`[run-backfill-job] Page limit likely hit for ${dateStr} (fetched ${totalFetched}). Will schedule 2-min cooldown.`);
            batchHitPageLimit = true;
          }
          
          results.push({ date: dateStr, existingBefore: existingCount, newRecords, recordCount, success: syncData?.success !== false, hitPageLimit });
        }
      } catch (err) {
        results.push({ date: dateStr, existingBefore: existingCount, newRecords: 0, recordCount: 0, success: false, error: err instanceof Error ? err.message : "Unknown error" });
      }

      await supabase.from("backfill_jobs").update({ completed_dates: results.length, total_records: totalRecords, total_new_records: totalNewRecords, results }).eq("id", jobId);
    }

    // Transfer staging → history after each batch (only for types that use staging)
    if (config.needsTransfer && config.transferApi && results.some(r => r.success && r.recordCount > 0)) {
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

    // If page limit was hit, schedule a 2-minute cooldown before continuing
    if (batchHitPageLimit) {
      console.log(`[run-backfill-job] Page limit hit — scheduling 2-minute cooldown before next batch`);
      await supabase.from("backfill_jobs").update({ 
        retry_scheduled_at: new Date(Date.now() + 120_000).toISOString(),
        processing_date: null,
      }).eq("id", jobId);
      
      await new Promise(resolve => setTimeout(resolve, 120_000));
    }

    fetch(`${SUPABASE_URL}/functions/v1/run-backfill-job`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
      body: JSON.stringify({ jobId }),
    }).catch(err => console.error("Failed to trigger next batch:", err));

    return new Response(JSON.stringify({ success: true, completed: false, processedDates: results.length, totalDates: allDates.length, remainingDates: allDates.length - results.length, cooldown: batchHitPageLimit }), {
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

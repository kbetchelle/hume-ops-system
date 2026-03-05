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
        syncFunction: "sync-arketa-classes-and-reservations",
        historyTable: "arketa_reservations_history",
        dateColumn: "class_date",
        transferApi: null,
        needsTransfer: false,
      };
  }
}

/**
 * Range-based backfill for arketa_payments.
 *
 * Instead of iterating day-by-day, sends the full updated_at date range
 * to sync-arketa-payments and lets it paginate with cursor-based resumption.
 * This matches the API's updated_at_min/max server-side filtering.
 */
async function handlePaymentsBackfill(supabase: any, job: any, jobId: string, corsHeaders: Record<string, string>) {
  const startDate = job.start_date;
  const endDate = job.end_date;

  // Check for cancellation
  const { data: currentJob } = await supabase.from("backfill_jobs").select("status").eq("id", jobId).single();
  if (currentJob?.status === "cancelled") {
    return new Response(JSON.stringify({ success: true, cancelled: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Resume cursor from previous batch if any
  const backfillCursor: string | undefined = job.batch_cursor ?? undefined;
  const batchesCompleted = job.total_batches_completed || 0;
  console.log(`[payments-backfill] Range ${startDate} → ${endDate}, cursor=${backfillCursor ?? 'none'}, batch=${batchesCompleted + 1}`);

  await supabase.from("backfill_jobs").update({
    processing_date: `${startDate} → ${endDate}`,
    sync_phase: "fetching",
  }).eq("id", jobId);

  // Count existing records before sync (using created_at_api for the range)
  const { count: existingBefore } = await supabase
    .from("arketa_payments")
    .select("*", { count: "exact", head: true })
    .gte("created_at_api", `${startDate}T00:00:00.000Z`)
    .lt("created_at_api", `${nextDayUtc(endDate)}T00:00:00.000Z`);
  const existingCount = existingBefore || 0;

  // Call sync-arketa-payments with the full date range
  let syncResult: { success: boolean; syncedCount?: number; totalFetched?: number; totalRawFetched?: number; hasMore?: boolean; backfill_cursor?: string; error?: string } = {
    success: false, error: 'Not executed',
  };

  try {
    const syncBody = {
      start_date: startDate,
      end_date: endDate,
      triggeredBy: "backfill-job",
      backfill_cursor: backfillCursor,
    };

    const syncResponse = await fetch(`${SUPABASE_URL}/functions/v1/sync-arketa-payments`, {
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
        syncedCount: syncData?.syncedCount ?? syncData?.payments_staged ?? 0,
        totalFetched: syncData?.totalFetched ?? 0,
        totalRawFetched: syncData?.totalRawFetched ?? undefined,
        hasMore: syncData?.hasMore ?? false,
        backfill_cursor: syncData?.backfill_cursor ?? null,
        error: syncData?.error,
      };
    }
  } catch (err) {
    syncResult = { success: false, error: err instanceof Error ? err.message : String(err) };
  }

  // Transfer staging → production
  if (syncResult.success && (syncResult.syncedCount ?? 0) > 0) {
    await supabase.from("backfill_jobs").update({ sync_phase: "transferring" }).eq("id", jobId);
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/sync-from-staging`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
        body: JSON.stringify({ api: "arketa_payments", clear_staging: true }),
      });
    } catch (err) {
      console.error("Failed to trigger sync-from-staging:", err);
    }
  }

  // Count records after sync
  await new Promise(resolve => setTimeout(resolve, 500));
  const { count: afterCount } = await supabase
    .from("arketa_payments")
    .select("*", { count: "exact", head: true })
    .gte("created_at_api", `${startDate}T00:00:00.000Z`)
    .lt("created_at_api", `${nextDayUtc(endDate)}T00:00:00.000Z`);
  const newRecords = Math.max(0, (afterCount || 0) - existingCount);

  const totalRecords = (job.total_records || 0) + (syncResult.syncedCount ?? 0);
  const totalNewRecords = (job.total_new_records || 0) + newRecords;
  const newBatchesCompleted = batchesCompleted + 1;
  const cumulativeInserted = (job.cumulative_inserted || 0) + newRecords;
  const cumulativeUpdated = (job.cumulative_updated || 0) + Math.max(0, (syncResult.syncedCount ?? 0) - newRecords);

  // Build result entry
  const results: SyncResult[] = [...(job.results || [])];
  results.push({
    date: `${startDate} → ${endDate}`,
    existingBefore: existingCount,
    newRecords,
    recordCount: syncResult.syncedCount ?? 0,
    success: syncResult.success,
    error: syncResult.error,
    ...(syncResult.totalRawFetched != null ? { totalRawFetched: syncResult.totalRawFetched, filteredCount: syncResult.totalFetched } : {}),
  });

  // Check if more pages remain (cursor-based resumption)
  const hasMorePages = syncResult.hasMore && !!syncResult.backfill_cursor;

  if (hasMorePages) {
    // Save cursor and schedule next batch
    await supabase.from("backfill_jobs").update({
      total_records: totalRecords,
      total_new_records: totalNewRecords,
      total_batches_completed: newBatchesCompleted,
      batch_cursor: syncResult.backfill_cursor,
      cumulative_inserted: cumulativeInserted,
      cumulative_updated: cumulativeUpdated,
      results,
      sync_phase: "cooldown",
    }).eq("id", jobId);

    console.log(`[payments-backfill] Batch ${newBatchesCompleted}: ${syncResult.syncedCount} staged, ${newRecords} new. More pages remain. Waiting ${BATCH_BREAK_MS / 1000}s...`);
    await new Promise(resolve => setTimeout(resolve, BATCH_BREAK_MS));

    fetch(`${SUPABASE_URL}/functions/v1/run-backfill-job`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
      body: JSON.stringify({ jobId }),
    }).catch(err => console.error("Failed to trigger next batch:", err));

    return new Response(JSON.stringify({
      success: true, completed: false, batchesCompleted: newBatchesCompleted,
      hasMore: true, nextCursor: syncResult.backfill_cursor,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // All done
  await supabase.from("backfill_jobs").update({
    status: "completed",
    completed_at: new Date().toISOString(),
    processing_date: null,
    batch_cursor: null,
    total_records: totalRecords,
    total_new_records: totalNewRecords,
    total_batches_completed: newBatchesCompleted,
    cumulative_inserted: cumulativeInserted,
    cumulative_updated: cumulativeUpdated,
    results,
    sync_phase: "idle",
  }).eq("id", jobId);

  return new Response(JSON.stringify({
    success: true, completed: true, totalRecords, totalNewRecords, batchesCompleted: newBatchesCompleted,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

/**
 * Cursor-based backfill for arketa_classes (and classes+reservations).
 * 
 * Large date ranges cause Arketa API 500 errors, so we split into 8-day chunks
 * with 1-day overlap. Each batch processes one chunk, paginating with
 * nextStartAfterId within that chunk. When a chunk is exhausted, we advance
 * to the next chunk on the following batch invocation.
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

  // --- Build 8-day chunks with 1-day overlap ---
  const CHUNK_DAYS = 8;
  const allChunks: { chunkStart: string; chunkEnd: string }[] = [];
  {
    const s = new Date(startDate + "T00:00:00Z");
    const e = new Date(endDate + "T00:00:00Z");
    let cur = new Date(s);
    while (cur <= e) {
      const chunkEnd = new Date(cur);
      chunkEnd.setUTCDate(chunkEnd.getUTCDate() + CHUNK_DAYS - 1);
      if (chunkEnd > e) chunkEnd.setTime(e.getTime());
      allChunks.push({ chunkStart: formatDate(cur), chunkEnd: formatDate(chunkEnd) });
      // Next chunk starts 1 day before chunkEnd (1-day overlap) for boundary safety
      cur = new Date(chunkEnd);
      // But if chunkEnd == e, we're done
      if (formatDate(chunkEnd) >= formatDate(e)) break;
      // Advance by CHUNK_DAYS - 1 (overlap)
      cur.setUTCDate(cur.getUTCDate());
    }
  }

  // Determine current chunk index from job metadata
  const currentChunkIndex = job.completed_dates || 0; // Repurpose completed_dates as chunk index
  const currentChunk = allChunks[currentChunkIndex];

  if (!currentChunk) {
    // All chunks done
    await supabase.from("backfill_jobs").update({
      status: "completed",
      completed_at: new Date().toISOString(),
      processing_date: null,
      batch_cursor: null,
    }).eq("id", jobId);
    return new Response(JSON.stringify({ success: true, completed: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { chunkStart, chunkEnd } = currentChunk;

  // Cursor for pagination within this chunk
  const startAfterId: string | undefined = job.batch_cursor ?? undefined;
  console.log(`[backfill] Chunk ${currentChunkIndex + 1}/${allChunks.length} (${chunkStart} → ${chunkEnd}), cursor=${startAfterId ?? 'none'}`);

  // Count existing records before sync
  const { count: existingBefore } = await supabase
    .from(historyTable)
    .select("*", { count: "exact", head: true })
    .gte(config.dateColumn, chunkStart)
    .lte(config.dateColumn, chunkEnd);
  const existingCount = existingBefore || 0;

  await supabase.from("backfill_jobs").update({
    processing_date: `${chunkStart} → ${chunkEnd}`,
    sync_phase: "fetching",
    total_dates: allChunks.length,
  }).eq("id", jobId);

  // Call the sync function with the chunk's date range
  const syncFunctionName = config.syncFunction;
  let syncResult: { success: boolean; syncedCount?: number; totalFetched?: number; nextStartAfterId?: string; hasMore?: boolean; error?: string } = {
    success: false, error: 'Not executed',
  };

  try {
    const syncBody = jobType === "arketa_classes_and_reservations"
      ? { start_date: chunkStart, end_date: chunkEnd, triggeredBy: "backfill-job", start_after_id: startAfterId, skipLogging: true }
      : { startDate: chunkStart, endDate: chunkEnd, start_after_id: startAfterId, skipLogging: true };

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
    .gte(config.dateColumn, chunkStart)
    .lte(config.dateColumn, chunkEnd);
  const newRecords = Math.max(0, (afterCount || 0) - existingCount);

  const totalRecords = (job.total_records || 0) + (syncResult.syncedCount ?? 0);
  const totalNewRecords = (job.total_new_records || 0) + newRecords;
  const batchesCompleted = (job.total_batches_completed || 0) + 1;

  // Build result entry
  const results: SyncResult[] = [...(job.results || [])];
  results.push({
    date: `${chunkStart}→${chunkEnd}`,
    existingBefore: existingCount,
    newRecords,
    recordCount: syncResult.syncedCount ?? 0,
    success: syncResult.success,
    error: syncResult.error,
  });

  // Determine if this chunk is exhausted (no more pages within it)
  const chunkDone = !syncResult.hasMore || !syncResult.nextStartAfterId || syncResult.totalFetched === 0;

  if (chunkDone) {
    // Move to next chunk
    const nextChunkIndex = currentChunkIndex + 1;
    const allDone = nextChunkIndex >= allChunks.length;

    await supabase.from("backfill_jobs").update({
      status: allDone ? "completed" : "running",
      completed_at: allDone ? new Date().toISOString() : null,
      processing_date: allDone ? null : undefined,
      total_records: totalRecords,
      total_new_records: totalNewRecords,
      total_batches_completed: batchesCompleted,
      batch_cursor: null, // Reset cursor for next chunk
      completed_dates: nextChunkIndex, // Track chunk progress
      results,
      sync_phase: allDone ? "idle" : "cooldown",
    }).eq("id", jobId);

    if (allDone) {
      return new Response(JSON.stringify({
        success: true, completed: true, totalRecords, totalNewRecords, batchesCompleted,
        chunksProcessed: allChunks.length,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Schedule next chunk after break
    console.log(`[backfill] Chunk ${currentChunkIndex + 1} done (${syncResult.syncedCount} synced, ${newRecords} new). Moving to chunk ${nextChunkIndex + 1}/${allChunks.length}. Waiting ${BATCH_BREAK_MS / 1000}s...`);
    await new Promise(resolve => setTimeout(resolve, BATCH_BREAK_MS));

    fetch(`${SUPABASE_URL}/functions/v1/run-backfill-job`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
      body: JSON.stringify({ jobId }),
    }).catch(err => console.error("Failed to trigger next chunk:", err));

    return new Response(JSON.stringify({
      success: true, completed: false, batchesCompleted,
      currentChunk: nextChunkIndex, totalChunks: allChunks.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Chunk not exhausted — save cursor and continue paginating within same chunk
  await supabase.from("backfill_jobs").update({
    total_records: totalRecords,
    total_new_records: totalNewRecords,
    total_batches_completed: batchesCompleted,
    batch_cursor: syncResult.nextStartAfterId,
    completed_dates: currentChunkIndex, // Stay on same chunk
    results,
    sync_phase: "cooldown",
  }).eq("id", jobId);

  console.log(`[backfill] Chunk ${currentChunkIndex + 1} batch ${batchesCompleted}: ${syncResult.syncedCount} synced, ${newRecords} new. More pages remain. Waiting ${BATCH_BREAK_MS / 1000}s...`);
  await new Promise(resolve => setTimeout(resolve, BATCH_BREAK_MS));

  fetch(`${SUPABASE_URL}/functions/v1/run-backfill-job`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
    body: JSON.stringify({ jobId }),
  }).catch(err => console.error("Failed to trigger next batch:", err));

  return new Response(JSON.stringify({
    success: true, completed: false, batchesCompleted,
    currentChunk: currentChunkIndex, totalChunks: allChunks.length,
    nextCursor: syncResult.nextStartAfterId, hasMore: syncResult.hasMore,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}


function buildSyncBody(jobType: JobType, dateStr: string): Record<string, unknown> {
  if (jobType === "toast_orders") {
    return { start_date: dateStr, end_date: dateStr };
  }
  if (jobType === "arketa_classes_and_reservations") {
    return { start_date: dateStr, end_date: dateStr, triggeredBy: "backfill-job" };
  }
  // arketa_reservations now routes through the combined sync function
  return { start_date: dateStr, end_date: dateStr, triggeredBy: "backfill-job" };
}

/** Extract record count from sync response based on job type */
function extractRecordCount(jobType: JobType, syncData: Record<string, unknown>): { recordCount: number; totalFetched: number; totalRawFetched?: number } {
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
    recordCount: (data?.payments_synced as number) ?? (data?.payments_staged as number) ?? (syncData?.syncedCount as number) ?? (syncData?.recordsInserted as number) ?? (syncData?.recordsProcessed as number) ?? 0,
    totalFetched: (syncData?.totalFetched as number) ?? 0,
    totalRawFetched: (syncData?.totalRawFetched as number) ?? undefined,
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

    // ── Arketa Payments: range-based backfill ──
    if (jobType === "arketa_payments") {
      return await handlePaymentsBackfill(supabase, job, jobId, corsHeaders);
    }

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

    // With updated_at_min/max server-side filtering, payments sync is now fast enough for normal batch sizes
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
          const { recordCount, totalFetched, totalRawFetched } = extractRecordCount(jobType, (syncData ?? {}) as Record<string, unknown>);

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
          
          results.push({
            date: dateStr,
            existingBefore: existingCount,
            newRecords,
            recordCount,
            success: syncData?.success !== false,
            hitPageLimit,
            // For payments: include raw vs filtered counts for UI transparency
            ...(totalRawFetched != null ? { totalRawFetched, filteredCount: totalFetched } : {}),
          });
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

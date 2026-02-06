import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

// Configuration - 2-day chunks for historical backfill
const CHUNK_DAYS = 2;
const STALE_LOCK_MINUTES = 5;
const MAX_EXECUTION_MS = 25000; // Bail before 30s Cloudflare timeout

// Backfill floor date - do not sync data earlier than this
const BACKFILL_FLOOR_DATE = '2024-05-01';

// Priority phases (lower = processed first)
const PRIORITY = {
  EMPTY_RETRY: 1,
  INITIAL: 2,
  REVERIFY: 3,
};

interface BackfillProgress {
  id: string;
  api_name: string;
  current_date_cursor: string;
  target_end_date: string;
  chunk_days: number;
  total_records_synced: number;
  last_chunk_records: number;
  last_chunk_started_at: string | null;
  status: string;
  error_message: string | null;
  backfill_phase: string;
  priority: number;
  empty_dates_cursor: string | null;
  reverify_cursor: string | null;
}

interface ApiConfig {
  apiName: string;
  functionName: string;
  stagingTable: string;
  conflictColumn: string;
  dateColumn: string;
  historyTable: string;
}

// Date-based APIs - reservations first, then payments
const API_CONFIGS: ApiConfig[] = [
  {
    apiName: "arketa_reservations",
    functionName: "sync-arketa-reservations",
    stagingTable: "arketa_reservations_staging",
    conflictColumn: "reservation_id",
    dateColumn: "class_date",
    historyTable: "arketa_reservations_history",
  },
  {
    apiName: "arketa_payments",
    functionName: "sync-arketa-payments",
    stagingTable: "arketa_payments_staging",
    conflictColumn: "payment_id",
    dateColumn: "start_date",
    historyTable: "arketa_payments_history",
  },
];

const SEQUENTIAL_ORDER = ["arketa_reservations", "arketa_payments"];

async function getEmptyDates(
  supabase: any,
  apiName: string,
  historyTable: string,
  dateColumn: string,
  startDate: string,
  endDate: string
): Promise<string[]> {
  const allDates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    allDates.push(d.toISOString().split("T")[0]);
  }
  const { data: datesWithData } = await supabase
    .from(historyTable)
    .select(dateColumn)
    .gte(dateColumn, startDate)
    .lte(dateColumn, endDate);
  const datesSet = new Set((datesWithData || []).map((r: any) => r[dateColumn]?.split("T")[0]));
  return allDates.filter(d => !datesSet.has(d));
}

async function getDatesWithData(
  supabase: any,
  historyTable: string,
  dateColumn: string,
  startDate: string,
  endDate: string
): Promise<string[]> {
  const { data } = await supabase
    .from(historyTable)
    .select(dateColumn)
    .gte(dateColumn, startDate)
    .lte(dateColumn, endDate);
  const datesSet = new Set<string>(
    (data || []).map((r: any) => r[dateColumn]?.split("T")[0] as string).filter(Boolean)
  );
  return Array.from(datesSet).sort().reverse();
}

const SYNC_TIMEOUT_MS = 90000;

async function callSyncFunction(
  functionName: string,
  startDate: string,
  endDate: string
): Promise<{ success: boolean; records: number; error?: string; limitHit?: boolean }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const url = `${supabaseUrl}/functions/v1/${functionName}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SYNC_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseKey}`,
        "x-backfill-key": "historical-backfill",
      },
      body: JSON.stringify({ startDate, endDate, isHistorical: true }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Sync function ${functionName} failed:`, response.status, errorText);
      return { success: false, records: 0, error: `HTTP ${response.status}: ${errorText}` };
    }
    const data = await response.json();
    let records = 0;
    let limitHit = false;
    if (data.data) {
      records = data.data.records_processed || data.data.records || data.data.reservations_synced || data.data.payments_staged || 0;
      limitHit = data.data.limit_hit === true;
    } else {
      records = data.records_processed || data.records || 0;
      limitHit = data.limit_hit === true;
    }
    return { success: data.success !== false, records, error: data.error, limitHit };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      return { success: true, records: 0, error: undefined };
    }
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`Error calling ${functionName}:`, errMsg);
    return { success: false, records: 0, error: errMsg };
  }
}

async function processBackfillChunk(supabase: any, config: ApiConfig, progress: BackfillProgress): Promise<{ records: number; newCursor: string; completed: boolean; phase: string; limitRecovery?: boolean }> {
  const phase = progress.backfill_phase || 'initial';
  const chunkDays = progress.chunk_days || CHUNK_DAYS;
  if (phase === 'empty_retry') {
    return await processEmptyRetryPhase(supabase, config, progress, chunkDays);
  } else if (phase === 'reverify') {
    return await processReverifyPhase(supabase, config, progress, chunkDays);
  } else {
    return await processInitialPhase(supabase, config, progress, chunkDays);
  }
}

async function processInitialPhase(supabase: any, config: ApiConfig, progress: BackfillProgress, chunkDays: number): Promise<{ records: number; newCursor: string; completed: boolean; phase: string; limitRecovery?: boolean }> {
  const cursorDate = new Date(progress.current_date_cursor);
  const targetDate = new Date(progress.target_end_date);
  const floorDate = new Date(BACKFILL_FLOOR_DATE);
  const effectiveTargetDate = targetDate > floorDate ? targetDate : floorDate;
  if (cursorDate <= effectiveTargetDate) {
    return { records: 0, newCursor: progress.target_end_date, completed: true, phase: 'initial' };
  }
  const endDate = cursorDate.toISOString().split("T")[0];
  const startDateObj = new Date(cursorDate);
  startDateObj.setDate(startDateObj.getDate() - chunkDays + 1);
  if (startDateObj < effectiveTargetDate) startDateObj.setTime(effectiveTargetDate.getTime());
  const startDate = startDateObj.toISOString().split("T")[0];
  const result = await callSyncFunction(config.functionName, startDate, endDate);
  if (!result.success) throw new Error(result.error || `Sync function ${config.functionName} failed`);
  if (result.limitHit) {
    if (startDateObj <= effectiveTargetDate) {
      return { records: result.records, newCursor: progress.target_end_date, completed: true, phase: 'initial' };
    }
    const retryCursor = new Date(startDateObj);
    retryCursor.setDate(retryCursor.getDate() - 2);
    if (retryCursor < effectiveTargetDate) retryCursor.setTime(effectiveTargetDate.getTime());
    return { records: result.records, newCursor: retryCursor.toISOString().split("T")[0], completed: false, phase: 'initial', limitRecovery: true };
  }
  const newCursorDate = new Date(startDateObj);
  newCursorDate.setDate(newCursorDate.getDate() - 1);
  const newCursor = newCursorDate.toISOString().split("T")[0];
  const initialCompleted = newCursorDate < effectiveTargetDate;
  return { records: result.records, newCursor: initialCompleted ? progress.target_end_date : newCursor, completed: initialCompleted, phase: 'initial' };
}

async function processEmptyRetryPhase(supabase: any, config: ApiConfig, progress: BackfillProgress, chunkDays: number): Promise<{ records: number; newCursor: string; completed: boolean; phase: string; limitRecovery?: boolean }> {
  const cursor = progress.empty_dates_cursor || progress.target_end_date;
  const endDate = new Date().toISOString().split("T")[0];
  const effectiveCursor = new Date(cursor) < new Date(BACKFILL_FLOOR_DATE) ? BACKFILL_FLOOR_DATE : cursor;
  const emptyDates = await getEmptyDates(supabase, config.apiName, config.historyTable, config.dateColumn, effectiveCursor, endDate);
  if (emptyDates.length === 0) return { records: 0, newCursor: endDate, completed: true, phase: 'empty_retry' };
  const datesToProcess = emptyDates.slice(0, chunkDays);
  const startDate = datesToProcess[0];
  const chunkEndDate = datesToProcess[datesToProcess.length - 1];
  const result = await callSyncFunction(config.functionName, startDate, chunkEndDate);
  if (!result.success) throw new Error(result.error || `Sync function ${config.functionName} failed`);
  if (result.limitHit) {
    const retryCursor = new Date(startDate);
    retryCursor.setDate(retryCursor.getDate() - 2);
    if (retryCursor < new Date(BACKFILL_FLOOR_DATE)) retryCursor.setTime(new Date(BACKFILL_FLOOR_DATE).getTime());
    return { records: result.records, newCursor: retryCursor.toISOString().split("T")[0], completed: false, phase: 'empty_retry', limitRecovery: true };
  }
  const lastProcessedDate = new Date(chunkEndDate);
  lastProcessedDate.setDate(lastProcessedDate.getDate() + 1);
  const newCursor = lastProcessedDate.toISOString().split("T")[0];
  const completed = new Date(newCursor) > new Date(endDate);
  return { records: result.records, newCursor, completed, phase: 'empty_retry' };
}

async function processReverifyPhase(supabase: any, config: ApiConfig, progress: BackfillProgress, chunkDays: number): Promise<{ records: number; newCursor: string; completed: boolean; phase: string; limitRecovery?: boolean }> {
  const cursor = progress.reverify_cursor || new Date().toISOString().split("T")[0];
  const targetDate = progress.target_end_date;
  const effectiveTargetDate = new Date(targetDate) < new Date(BACKFILL_FLOOR_DATE) ? BACKFILL_FLOOR_DATE : targetDate;
  const datesWithData = await getDatesWithData(supabase, config.historyTable, config.dateColumn, effectiveTargetDate, cursor);
  if (datesWithData.length === 0) return { records: 0, newCursor: effectiveTargetDate, completed: true, phase: 'reverify' };
  const datesToProcess = datesWithData.slice(0, chunkDays);
  const endDate = datesToProcess[0];
  const startDate = datesToProcess[datesToProcess.length - 1];
  const result = await callSyncFunction(config.functionName, startDate, endDate);
  if (!result.success) throw new Error(result.error || `Sync function ${config.functionName} failed`);
  if (result.limitHit) {
    const retryCursor = new Date(startDate);
    retryCursor.setDate(retryCursor.getDate() + 2);
    return { records: result.records, newCursor: retryCursor.toISOString().split("T")[0], completed: false, phase: 'reverify', limitRecovery: true };
  }
  const newCursorDate = new Date(startDate);
  newCursorDate.setDate(newCursorDate.getDate() - 1);
  const newCursor = newCursorDate.toISOString().split("T")[0];
  const completed = new Date(newCursor) < new Date(effectiveTargetDate);
  return { records: result.records, newCursor, completed, phase: 'reverify' };
}

function getNextPhase(currentPhase: string): { phase: string; priority: number } | null {
  switch (currentPhase) {
    case 'initial': return { phase: 'empty_retry', priority: PRIORITY.EMPTY_RETRY };
    case 'empty_retry': return { phase: 'reverify', priority: PRIORITY.REVERIFY };
    case 'reverify': return null;
    default: return { phase: 'empty_retry', priority: PRIORITY.EMPTY_RETRY };
  }
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = getCorsHeaders(req);
  const startTime = Date.now();
  const isNearTimeout = () => Date.now() - startTime > MAX_EXECUTION_MS;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const results: any[] = [];
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const staleCutoff = new Date(Date.now() - STALE_LOCK_MINUTES * 60 * 1000).toISOString();
    const { data: staleJobs } = await supabase
      .from("historical_backfill_progress")
      .select("api_name, last_chunk_started_at")
      .eq("status", "running")
      .lt("last_chunk_started_at", staleCutoff);
    if (staleJobs?.length) {
      for (const job of staleJobs) {
        await supabase.from("historical_backfill_progress").update({ status: "pending", error_message: `Reset from stale running state` }).eq("api_name", job.api_name);
      }
    }

    const { data: allProgressRecords, error: fetchError } = await supabase
      .from("historical_backfill_progress")
      .select("*")
      .in("api_name", SEQUENTIAL_ORDER);
    if (fetchError) throw fetchError;
    if (!allProgressRecords?.length) {
      return new Response(JSON.stringify({ success: true, message: "No backfill tasks configured" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let currentApiToProcess: BackfillProgress | null = null;
    let allDateBasedComplete = true;
    for (const apiName of SEQUENTIAL_ORDER) {
      const progress = allProgressRecords.find((p: BackfillProgress) => p.api_name === apiName);
      if (!progress) continue;
      if (progress.status !== "completed") {
        allDateBasedComplete = false;
        if (progress.status === "pending") currentApiToProcess = progress;
        break;
      }
    }

    if (allDateBasedComplete) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/sync-arketa-subscriptions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseKey}` },
          body: JSON.stringify({ fullSync: true }),
        });
      } catch (subError) {
        console.error("Subscriptions sync failed:", subError);
      }
      return new Response(JSON.stringify({ success: true, message: "All date-based backfills complete" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!currentApiToProcess) {
      return new Response(JSON.stringify({ success: true, message: "Waiting for next run" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (isNearTimeout()) {
      return new Response(JSON.stringify({ success: true, results: [{ skipped: true, reason: 'near_timeout' }] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const progress = currentApiToProcess;
    const config = API_CONFIGS.find(c => c.apiName === progress.api_name);
    if (!config) {
      return new Response(JSON.stringify({ success: false, error: "No config for " + progress.api_name }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await supabase.from("historical_backfill_progress").update({ status: "running", last_chunk_started_at: new Date().toISOString(), error_message: null }).eq("api_name", progress.api_name);

    try {
      const { records, newCursor, completed, phase, limitRecovery } = await processBackfillChunk(supabase, config, progress);
      const nextPhaseInfo = completed ? getNextPhase(phase) : null;

      if (completed && nextPhaseInfo) {
        const updateData: any = { status: "pending", backfill_phase: nextPhaseInfo.phase, priority: nextPhaseInfo.priority, last_chunk_records: records, last_chunk_completed_at: new Date().toISOString(), total_records_synced: progress.total_records_synced + records };
        if (nextPhaseInfo.phase === 'empty_retry') updateData.empty_dates_cursor = progress.target_end_date;
        else if (nextPhaseInfo.phase === 'reverify') updateData.reverify_cursor = new Date().toISOString().split("T")[0];
        await supabase.from("historical_backfill_progress").update(updateData).eq("api_name", progress.api_name);
      } else if (completed && !nextPhaseInfo) {
        await supabase.from("historical_backfill_progress").update({ status: "completed", backfill_phase: "completed", total_records_synced: progress.total_records_synced + records, last_chunk_records: records, last_chunk_completed_at: new Date().toISOString() }).eq("api_name", progress.api_name);
      } else {
        const updateData: any = { total_records_synced: progress.total_records_synced + records, last_chunk_records: records, last_chunk_completed_at: new Date().toISOString(), status: "pending" };
        if (phase === 'initial') updateData.current_date_cursor = newCursor;
        else if (phase === 'empty_retry') updateData.empty_dates_cursor = newCursor;
        else if (phase === 'reverify') updateData.reverify_cursor = newCursor;
        await supabase.from("historical_backfill_progress").update(updateData).eq("api_name", progress.api_name);
      }
      results.push({ api_name: progress.api_name, phase, records_synced: records, completed, limit_recovery: limitRecovery });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const isTransientError = /520|504|502|timeout|AbortError|context canceled/.test(errorMsg);
      await supabase.from("historical_backfill_progress").update({ status: isTransientError ? "pending" : "error", error_message: errorMsg.substring(0, 500), last_chunk_completed_at: new Date().toISOString() }).eq("api_name", progress.api_name);
      results.push({ api_name: progress.api_name, error: errorMsg });
    }

    return new Response(JSON.stringify({ success: true, duration_ms: Date.now() - startTime, backfill_floor_date: BACKFILL_FLOOR_DATE, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Historical backfill cron error:", error);
    const corsHeaders = getCorsHeaders(req);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

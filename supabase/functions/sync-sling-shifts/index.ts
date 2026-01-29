import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

interface SlingShift {
  id: number;
  user?: {
    id: number;
    name?: string;
    email?: string;
  };
  position?: {
    id: number;
    name?: string;
  };
  location?: {
    id: number;
    name?: string;
  };
  dtstart: string;
  dtend: string;
  status?: string;
  [key: string]: unknown;
}

interface SyncResult {
  success: boolean;
  synced: number;
  total: number;
  failed: number;
  failedRecordIds: string[];
  errors: Array<{ id: string; error: string }>;
}

// Rate limiting configuration
const RATE_LIMIT_MAX_REQUESTS = 100;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RETRY_MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1000;

let requestCount = 0;
let windowStart = Date.now();

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function rateLimitedFetch(url: string, options: RequestInit): Promise<Response> {
  const now = Date.now();
  
  if (now - windowStart >= RATE_LIMIT_WINDOW_MS) {
    requestCount = 0;
    windowStart = now;
  }
  
  if (requestCount >= RATE_LIMIT_MAX_REQUESTS) {
    const waitTime = RATE_LIMIT_WINDOW_MS - (now - windowStart);
    console.log(`Rate limit reached, waiting ${waitTime}ms`);
    await delay(waitTime);
    requestCount = 0;
    windowStart = Date.now();
  }
  
  requestCount++;
  return fetch(url, options);
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxAttempts: number = RETRY_MAX_ATTEMPTS
): Promise<{ response: Response; attempts: number }> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await rateLimitedFetch(url, options);
      
      if (response.status === 429 || response.status >= 500) {
        const errorText = await response.text();
        lastError = new Error(`HTTP ${response.status}: ${errorText}`);
        
        if (attempt < maxAttempts) {
          const backoffDelay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
          console.log(`Attempt ${attempt} failed with ${response.status}, retrying in ${backoffDelay}ms`);
          await delay(backoffDelay);
          continue;
        }
      }
      
      return { response, attempts: attempt };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxAttempts) {
        const backoffDelay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`Attempt ${attempt} failed with error, retrying in ${backoffDelay}ms:`, lastError.message);
        await delay(backoffDelay);
      }
    }
  }
  
  throw lastError || new Error("All retry attempts failed");
}

function getWeekDateRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  
  // Start of week (Sunday)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  
  // End of week (Saturday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return {
    startDate: startOfWeek.toISOString(),
    endDate: endOfWeek.toISOString(),
  };
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);
  
  requestCount = 0;
  windowStart = Date.now();

  // deno-lint-ignore no-explicit-any
  let supabase: any;
  let syncLogId: string | null = null;

  try {
    const SLING_AUTH_TOKEN = Deno.env.get("SLING_AUTH_TOKEN");
    const SLING_ORG_ID = Deno.env.get("SLING_ORG_ID");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SLING_AUTH_TOKEN) {
      throw new Error("SLING_AUTH_TOKEN is not configured");
    }
    if (!SLING_ORG_ID) {
      throw new Error("SLING_ORG_ID is not configured");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Create sync log entry
    const { data: syncLog, error: syncLogError } = await supabase
      .from("sling_sync_log")
      .insert({ 
        status: "running",
        records_synced: 0,
        success_count: 0,
        failure_count: 0,
        failed_record_ids: []
      })
      .select()
      .single();

    if (syncLogError) {
      console.error("Failed to create sync log:", syncLogError);
    } else {
      syncLogId = syncLog.id;
    }

    const { startDate, endDate } = getWeekDateRange();
    console.log(`Fetching Sling shifts from ${startDate} to ${endDate}`);

    // GetSling API endpoint for shifts
    const url = `https://api.getsling.com/v1/${SLING_ORG_ID}/calendar/${startDate}/${endDate}/shifts`;
    
    const { response, attempts } = await fetchWithRetry(url, {
      method: "GET",
      headers: {
        "Authorization": SLING_AUTH_TOKEN,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Sling API error [${response.status}]: ${errorText}`);
    }

    const shifts: SlingShift[] = await response.json();
    console.log(`Fetched ${shifts.length} shifts from Sling API`);

    let syncedCount = 0;
    const failedRecordIds: string[] = [];
    const errors: Array<{ id: string; error: string }> = [];

    for (const shift of shifts) {
      const shiftDate = new Date(shift.dtstart);
      
      const shiftData = {
        external_id: String(shift.id),
        user_name: shift.user?.name || null,
        user_email: shift.user?.email || null,
        position: shift.position?.name || null,
        shift_start: shift.dtstart,
        shift_end: shift.dtend,
        shift_date: shiftDate.toISOString().split('T')[0],
        location: shift.location?.name || null,
        status: shift.status || 'scheduled',
        raw_data: shift,
        synced_at: new Date().toISOString(),
      };

      const { error: upsertError } = await supabase
        .from("staff_shifts")
        .upsert(shiftData, { 
          onConflict: "external_id",
          ignoreDuplicates: false 
        });

      if (upsertError) {
        console.error(`Failed to upsert shift ${shift.id}:`, upsertError);
        failedRecordIds.push(String(shift.id));
        errors.push({ id: String(shift.id), error: upsertError.message });
      } else {
        syncedCount++;
      }
    }

    // Determine final status
    let finalStatus: string;
    if (failedRecordIds.length === 0) {
      finalStatus = "completed";
    } else if (syncedCount === 0 && shifts.length > 0) {
      finalStatus = "failed";
    } else if (syncedCount > 0 && failedRecordIds.length > 0) {
      finalStatus = "partial_success";
    } else {
      finalStatus = "completed";
    }

    // Update sync log
    if (syncLogId) {
      await supabase
        .from("sling_sync_log")
        .update({
          status: finalStatus,
          completed_at: new Date().toISOString(),
          records_synced: syncedCount,
          success_count: syncedCount,
          failure_count: failedRecordIds.length,
          failed_record_ids: failedRecordIds,
          retry_attempts: attempts - 1,
          error_message: errors.length > 0 
            ? errors.map(e => `${e.id}: ${e.error}`).join("; ") 
            : null,
        })
        .eq("id", syncLogId);
    }

    const syncResult: SyncResult = {
      success: failedRecordIds.length === 0,
      synced: syncedCount,
      total: shifts.length,
      failed: failedRecordIds.length,
      failedRecordIds,
      errors,
    };

    return new Response(
      JSON.stringify(syncResult),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Sling sync error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    if (syncLogId && supabase) {
      await supabase
        .from("sling_sync_log")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error_message: errorMessage,
        })
        .eq("id", syncLogId);
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        synced: 0,
        total: 0,
        failed: 0,
        failedRecordIds: [],
        errors: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

interface PartnerClient {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  createdAt?: string;
  trainer?: {
    id: string;
  };
  avatar?: string;
  [key: string]: unknown;
}

interface PaginatedResponse {
  data: PartnerClient[];
  pagination?: {
    nextCursor?: string;
    hasMore?: boolean;
  };
}

interface SyncResult {
  success: boolean;
  synced: number;
  total: number;
  failed: number;
  failedRecordIds: string[];
  errors: Array<{ id: string; error: string }>;
  retryAttempts: number;
}

// Rate limiting configuration
const RATE_LIMIT_MAX_REQUESTS = 100;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RETRY_MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1000;

// Rate limiter state
let requestCount = 0;
let windowStart = Date.now();

async function rateLimitedFetch(url: string, options: RequestInit): Promise<Response> {
  const now = Date.now();
  
  // Reset window if expired
  if (now - windowStart >= RATE_LIMIT_WINDOW_MS) {
    requestCount = 0;
    windowStart = now;
  }
  
  // Wait if we've hit the rate limit
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

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
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
      
      // Retry on 429 (rate limit) or 5xx errors
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

// deno-lint-ignore no-explicit-any
async function getValidToken(supabase: any): Promise<string> {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  
  const { response } = await fetchWithRetry(
    `${SUPABASE_URL}/functions/v1/refresh-arketa-token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get valid token: ${errorText}`);
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || "Failed to get valid token");
  }

  return result.access_token;
}

// deno-lint-ignore no-explicit-any
async function upsertMemberWithRetry(
  supabase: any,
  client: PartnerClient,
  maxAttempts: number = RETRY_MAX_ATTEMPTS
): Promise<{ success: boolean; error?: string; attempts: number }> {
  const memberData = {
    external_id: client.id,
    email: client.email,
    first_name: client.firstName || null,
    last_name: client.lastName || null,
    full_name: [client.firstName, client.lastName]
      .filter(Boolean)
      .join(" ") || null,
    phone: client.phone || null,
    join_date: client.createdAt ? new Date(client.createdAt).toISOString() : null,
    external_trainer_id: client.trainer?.id || null,
    avatar_url: client.avatar || null,
    membership_tier: "basic" as const,
    raw_data: client,
    last_synced_at: new Date().toISOString(),
  };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { error: upsertError } = await supabase
      .from("members")
      .upsert(memberData, { 
        onConflict: "external_id",
        ignoreDuplicates: false 
      });

    if (!upsertError) {
      return { success: true, attempts: attempt };
    }

    // Retry on transient errors (connection issues, timeouts)
    const isTransientError = 
      upsertError.message?.includes("timeout") ||
      upsertError.message?.includes("connection") ||
      upsertError.code === "PGRST504";

    if (isTransientError && attempt < maxAttempts) {
      const backoffDelay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.log(`Upsert attempt ${attempt} failed, retrying in ${backoffDelay}ms:`, upsertError.message);
      await delay(backoffDelay);
      continue;
    }

    return { 
      success: false, 
      error: upsertError.message || "Unknown error",
      attempts: attempt 
    };
  }

  return { success: false, error: "All retry attempts failed", attempts: maxAttempts };
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);
  
  // Reset rate limiter for each request
  requestCount = 0;
  windowStart = Date.now();

  // deno-lint-ignore no-explicit-any
  let supabase: any;
  let syncLogId: string | null = null;
  let totalRetryAttempts = 0;

  try {
    const ARKETA_PARTNER_ID = Deno.env.get("ARKETA_PARTNER_ID");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!ARKETA_PARTNER_ID) {
      throw new Error("ARKETA_PARTNER_ID is not configured");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get a valid token (will refresh if needed)
    const accessToken = await getValidToken(supabase);
    console.log("Obtained valid access token for Arketa API");

    // Create sync log entry
    const { data: syncLog, error: syncLogError } = await supabase
      .from("member_sync_log")
      .insert({ 
        status: "running",
        retry_attempts: 0,
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

    const BASE_URL = `https://us-central1-sutra-prod.cloudfunctions.net/partnerApi/v0/${ARKETA_PARTNER_ID}`;
    
    let allClients: PartnerClient[] = [];
    let nextCursor: string | undefined = undefined;
    let hasMore = true;

    // Fetch all clients with pagination and retry logic
    while (hasMore) {
      const url = new URL(`${BASE_URL}/clients`);
      if (nextCursor) {
        url.searchParams.set("cursor", nextCursor);
      }

      console.log("Fetching clients from:", url.toString());

      const { response, attempts } = await fetchWithRetry(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      
      totalRetryAttempts += attempts - 1; // Only count retries, not first attempt

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Partner API error [${response.status}]: ${errorText}`
        );
      }

      const result: PaginatedResponse = await response.json();
      
      if (result.data && Array.isArray(result.data)) {
        allClients = [...allClients, ...result.data];
      }

      nextCursor = result.pagination?.nextCursor;
      hasMore = result.pagination?.hasMore ?? false;
    }

    console.log(`Fetched ${allClients.length} clients from Partner API`);

    // Upsert members into database with retry logic
    let syncedCount = 0;
    const failedRecordIds: string[] = [];
    const errors: Array<{ id: string; error: string }> = [];

    for (const client of allClients) {
      const result = await upsertMemberWithRetry(supabase, client);
      totalRetryAttempts += result.attempts - 1;
      
      if (result.success) {
        syncedCount++;
      } else {
        console.error(`Failed to upsert member ${client.id}:`, result.error);
        failedRecordIds.push(client.id);
        errors.push({ id: client.id, error: result.error || "Unknown error" });
      }
    }

    // Determine final status
    let finalStatus: string;
    if (failedRecordIds.length === 0) {
      finalStatus = "completed";
    } else if (syncedCount === 0) {
      finalStatus = "failed";
    } else if (syncedCount > 0 && failedRecordIds.length > 0) {
      finalStatus = "partial_success";
    } else {
      finalStatus = "completed_with_errors";
    }

    // Update sync log with detailed results
    if (syncLogId) {
      await supabase
        .from("member_sync_log")
        .update({
          status: finalStatus,
          completed_at: new Date().toISOString(),
          records_synced: syncedCount,
          success_count: syncedCount,
          failure_count: failedRecordIds.length,
          failed_record_ids: failedRecordIds,
          retry_attempts: totalRetryAttempts,
          error_message: errors.length > 0 
            ? errors.map(e => `${e.id}: ${e.error}`).join("; ") 
            : null,
        })
        .eq("id", syncLogId);
    }

    const syncResult: SyncResult = {
      success: failedRecordIds.length === 0,
      synced: syncedCount,
      total: allClients.length,
      failed: failedRecordIds.length,
      failedRecordIds,
      errors,
      retryAttempts: totalRetryAttempts,
    };

    return new Response(
      JSON.stringify(syncResult),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Sync error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Update sync log to failed status
    if (syncLogId && supabase) {
      await supabase
        .from("member_sync_log")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error_message: errorMessage,
          retry_attempts: totalRetryAttempts,
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
        retryAttempts: totalRetryAttempts,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

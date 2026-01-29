import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { fetchWithRetry, withRetry, isRetryableSupabaseError } from "../_shared/retry.ts";

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
async function upsertClientWithRetry(
  supabase: any,
  client: PartnerClient
): Promise<{ success: boolean; error?: string; attempts: number }> {
  const clientData = {
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

  try {
    const { result, attempts } = await withRetry(
      async () => {
        const { error: upsertError } = await supabase
          .from("arketa_clients")
          .upsert(clientData, { 
            onConflict: "external_id",
            ignoreDuplicates: false 
          });

        if (upsertError && !isRetryableSupabaseError(upsertError)) {
          throw upsertError;
        }
        return { error: upsertError };
      },
      { maxAttempts: 3 },
      `upsert client ${client.id}`
    );

    if (result.error) {
      return { success: false, error: result.error.message || "Unknown error", attempts };
    }
    return { success: true, attempts };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage, attempts: 3 };
  }
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);

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
    console.log("[sync-arketa-clients] Obtained valid access token for Arketa API");

    // Create sync log entry
    const { data: syncLog, error: syncLogError } = await supabase
      .from("client_sync_log")
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
      console.error("[sync-arketa-clients] Failed to create sync log:", syncLogError);
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

      console.log("[sync-arketa-clients] Fetching clients from:", url.toString());

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

    console.log(`[sync-arketa-clients] Fetched ${allClients.length} clients from Partner API`);

    // Upsert clients into database with retry logic
    let syncedCount = 0;
    const failedRecordIds: string[] = [];
    const errors: Array<{ id: string; error: string }> = [];

    for (const client of allClients) {
      const result = await upsertClientWithRetry(supabase, client);
      totalRetryAttempts += result.attempts - 1;
      
      if (result.success) {
        syncedCount++;
      } else {
        console.error(`[sync-arketa-clients] Failed to upsert client ${client.id}:`, result.error);
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
        .from("client_sync_log")
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
    console.error("[sync-arketa-clients] Sync error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Update sync log to failed status
    if (syncLogId && supabase) {
      await supabase
        .from("client_sync_log")
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

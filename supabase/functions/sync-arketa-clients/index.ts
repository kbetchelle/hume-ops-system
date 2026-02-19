import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { fetchWithRetry } from "../_shared/retry.ts";
import { logApiCall } from "../_shared/apiLogger.ts";

/**
 * sync-arketa-clients
 *
 * Fetches clients from Arketa Partner API with cursor-based pagination.
 * Batched upserts (100 at a time) and a per-invocation page cap (MAX_PAGES)
 * to stay within edge function timeout. Cursor is saved to
 * `api_sync_status` so the next invocation resumes where this one left off.
 */

const UPSERT_BATCH = 100;
const MAX_PAGES = 30; // ~30 pages should fit within 50s safely

interface PartnerClient {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
  custom_fields?: Record<string, unknown>;
  referrer?: string;
  emailMarketingOptIn?: boolean;
  email_mkt_opt_in?: boolean;
  smsMarketingOptIn?: boolean;
  sms_mkt_opt_in?: boolean;
  dateOfBirth?: string;
  date_of_birth?: string;
  lifecycleStage?: string;
  lifecycle_stage?: string;
  [key: string]: unknown;
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
  if (!result.success) throw new Error(result.error || "Failed to get valid token");
  return result.access_token;
}

function buildClientName(client: PartnerClient): string | null {
  if (client.name) return client.name;
  const first = client.firstName || client.first_name;
  const last = client.lastName || client.last_name;
  const parts = [first, last].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : null;
}

function toDbRow(client: PartnerClient) {
  // Some clients may not have email — use a placeholder to satisfy NOT NULL
  const email = client.email || `no-email-${client.id}@placeholder.local`;
  return {
    external_id: client.id,
    client_email: email,
    client_name: buildClientName(client),
    client_phone: client.phone || null,
    client_tags: client.tags || [],
    custom_fields: client.customFields || client.custom_fields || {},
    referrer: client.referrer || null,
    email_mkt_opt_in: client.emailMarketingOptIn ?? client.email_mkt_opt_in ?? false,
    sms_mkt_opt_in: client.smsMarketingOptIn ?? client.sms_mkt_opt_in ?? false,
    date_of_birth: client.dateOfBirth || client.date_of_birth || null,
    lifecycle_stage: client.lifecycleStage || client.lifecycle_stage || null,
    raw_data: client,
    last_synced_at: new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = getCorsHeaders(req);

  // deno-lint-ignore no-explicit-any
  let supabase: any;
  let syncLogId: string | null = null;
  const startTime = Date.now();

  try {
    const ARKETA_PARTNER_ID = Deno.env.get("ARKETA_PARTNER_ID");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!ARKETA_PARTNER_ID) throw new Error("ARKETA_PARTNER_ID is not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase configuration missing");

    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get a valid token
    const accessToken = await getValidToken(supabase);
    console.log("[sync-arketa-clients] Obtained valid access token");

    // Load saved cursor for resumability
    const { data: syncStatus } = await supabase
      .from("api_sync_status")
      .select("last_processed_date")
      .eq("api_name", "arketa_clients")
      .single();

    let savedCursor: string | null = syncStatus?.last_processed_date || null;

    // Parse body for reset option
    const body = await req.json().catch(() => ({}));
    if (body?.reset_cursor) {
      savedCursor = null;
      console.log("[sync-arketa-clients] Cursor reset requested");
    }

    // Create sync log entry
    const { data: syncLog, error: syncLogError } = await supabase
      .from("client_sync_log")
      .insert({ status: "running", retry_attempts: 0, success_count: 0, failure_count: 0, failed_record_ids: [] })
      .select()
      .single();
    if (!syncLogError) syncLogId = syncLog.id;

    const BASE_URL = `https://us-central1-sutra-prod.cloudfunctions.net/partnerApi/v0/${ARKETA_PARTNER_ID}`;

    let allClients: PartnerClient[] = [];
    let nextCursor: string | undefined = savedCursor || undefined;
    let hasMore = true;
    let pageCount = 0;

    // Fetch clients with pagination, capped at MAX_PAGES per invocation
    while (hasMore && pageCount < MAX_PAGES) {
      const url = new URL(`${BASE_URL}/clients`);
      if (nextCursor) url.searchParams.set("cursor", nextCursor);

      console.log(`[sync-arketa-clients] Page ${pageCount + 1}, cursor: ${nextCursor || 'start'}`);

      const { response } = await fetchWithRetry(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Partner API error [${response.status}]: ${errorText}`);
      }

      const result = await response.json();
      const items = result?.items || result?.data || [];
      if (Array.isArray(items)) allClients = [...allClients, ...items];

      nextCursor = result?.pagination?.nextCursor;
      hasMore = result?.pagination?.hasMore ?? false;
      pageCount++;
    }

    console.log(`[sync-arketa-clients] Fetched ${allClients.length} clients in ${pageCount} pages (hasMore: ${hasMore})`);

    // Deduplicate by external_id (keep last occurrence) to avoid
    // "ON CONFLICT DO UPDATE command cannot affect row a second time"
    const deduped = new Map<string, ReturnType<typeof toDbRow>>();
    for (const client of allClients) {
      deduped.set(client.id, toDbRow(client));
    }
    const dbRows = Array.from(deduped.values());
    console.log(`[sync-arketa-clients] ${allClients.length} fetched → ${dbRows.length} unique clients`);
    let syncedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < dbRows.length; i += UPSERT_BATCH) {
      const batch = dbRows.slice(i, i + UPSERT_BATCH);
      const { error: upsertError } = await supabase
        .from("arketa_clients")
        .upsert(batch, { onConflict: "external_id", ignoreDuplicates: false });

      if (upsertError) {
        console.error(`[sync-arketa-clients] Batch ${Math.floor(i / UPSERT_BATCH) + 1} failed:`, upsertError.message);
        failedCount += batch.length;
        errors.push(upsertError.message);
      } else {
        syncedCount += batch.length;
      }
    }

    // Save cursor for next invocation (null if fully done)
    const cursorToSave = hasMore ? (nextCursor || null) : null;
    await supabase.from("api_sync_status").upsert({
      api_name: "arketa_clients",
      last_sync_at: new Date().toISOString(),
      last_sync_success: failedCount === 0,
      last_sync_status: hasMore ? "partial" : "success",
      last_records_processed: allClients.length,
      last_records_inserted: syncedCount,
      last_processed_date: cursorToSave,
      last_error_message: errors.length > 0 ? errors.join("; ") : null,
    }, { onConflict: "api_name" });

    // Update sync log
    const finalStatus = failedCount === 0 ? (hasMore ? "partial" : "completed") : "partial_success";
    if (syncLogId) {
      await supabase.from("client_sync_log").update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
        records_synced: syncedCount,
        success_count: syncedCount,
        failure_count: failedCount,
        error_message: errors.length > 0 ? errors.join("; ") : null,
      }).eq("id", syncLogId);
    }

    await logApiCall(supabase, {
      apiName: 'arketa_clients',
      endpoint: '/clients',
      syncSuccess: failedCount === 0,
      durationMs: Date.now() - startTime,
      recordsProcessed: allClients.length,
      recordsInserted: syncedCount,
      responseStatus: 200,
      triggeredBy: 'manual',
    });

    return new Response(
      JSON.stringify({
        success: failedCount === 0,
        synced: syncedCount,
        syncedCount,
        total: allClients.length,
        failed: failedCount,
        pages: pageCount,
        hasMore,
        status: hasMore ? "partial_will_resume" : "completed",
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[sync-arketa-clients] Sync error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    if (syncLogId && supabase) {
      await supabase.from("client_sync_log").update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error_message: errorMessage,
      }).eq("id", syncLogId);
    }

    if (supabase) {
      await logApiCall(supabase, {
        apiName: 'arketa_clients',
        endpoint: '/clients',
        syncSuccess: false,
        durationMs: Date.now() - startTime,
        recordsProcessed: 0,
        recordsInserted: 0,
        responseStatus: 500,
        errorMessage,
        triggeredBy: 'manual',
      });
    }

    return new Response(
      JSON.stringify({ success: false, error: errorMessage, synced: 0, total: 0 }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

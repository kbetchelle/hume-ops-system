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

// deno-lint-ignore no-explicit-any
async function getValidToken(supabase: any): Promise<string> {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  
  // Call the refresh-arketa-token function to get a valid token
  const response = await fetch(`${SUPABASE_URL}/functions/v1/refresh-arketa-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
    },
  });

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

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);

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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get a valid token (will refresh if needed)
    const accessToken = await getValidToken(supabase);
    console.log("Obtained valid access token for Arketa API");

    // Create sync log entry
    const { data: syncLog, error: syncLogError } = await supabase
      .from("member_sync_log")
      .insert({ status: "running" })
      .select()
      .single();

    if (syncLogError) {
      console.error("Failed to create sync log:", syncLogError);
    }

    const BASE_URL = `https://us-central1-sutra-prod.cloudfunctions.net/partnerApi/v0/${ARKETA_PARTNER_ID}`;
    
    let allClients: PartnerClient[] = [];
    let nextCursor: string | undefined = undefined;
    let hasMore = true;

    // Fetch all clients with pagination
    while (hasMore) {
      const url = new URL(`${BASE_URL}/clients`);
      if (nextCursor) {
        url.searchParams.set("cursor", nextCursor);
      }

      console.log("Fetching clients from:", url.toString());

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

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

    // Upsert members into database
    let syncedCount = 0;
    const errors: string[] = [];

    for (const client of allClients) {
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
        membership_tier: "basic" as const, // Default tier, can be mapped from API data
        raw_data: client,
        last_synced_at: new Date().toISOString(),
      };

      const { error: upsertError } = await supabase
        .from("members")
        .upsert(memberData, { 
          onConflict: "external_id",
          ignoreDuplicates: false 
        });

      if (upsertError) {
        console.error(`Failed to upsert member ${client.id}:`, upsertError);
        errors.push(`${client.id}: ${upsertError.message}`);
      } else {
        syncedCount++;
      }
    }

    // Update sync log
    if (syncLog) {
      await supabase
        .from("member_sync_log")
        .update({
          status: errors.length > 0 ? "completed_with_errors" : "completed",
          completed_at: new Date().toISOString(),
          records_synced: syncedCount,
          error_message: errors.length > 0 ? errors.join("; ") : null,
        })
        .eq("id", syncLog.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced: syncedCount,
        total: allClients.length,
        errors: errors.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Sync error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

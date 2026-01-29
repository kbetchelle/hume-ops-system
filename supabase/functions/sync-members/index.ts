import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ARKETA_API_KEY = Deno.env.get("ARKETA_API_KEY");
    const ARKETA_PARTNER_ID = Deno.env.get("ARKETA_PARTNER_ID");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!ARKETA_API_KEY) {
      throw new Error("ARKETA_API_KEY is not configured");
    }
    if (!ARKETA_PARTNER_ID) {
      throw new Error("ARKETA_PARTNER_ID is not configured");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
          Authorization: `Bearer ${ARKETA_API_KEY}`,
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

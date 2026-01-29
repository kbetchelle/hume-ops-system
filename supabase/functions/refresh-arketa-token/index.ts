import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface CredentialRow {
  api_name: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: string;
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const ARKETA_API_KEY = Deno.env.get("ARKETA_API_KEY");
    const ARKETA_PARTNER_ID = Deno.env.get("ARKETA_PARTNER_ID");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    if (!ARKETA_API_KEY || !ARKETA_PARTNER_ID) {
      throw new Error("Arketa configuration missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check current token status
    const { data: credentials, error: fetchError } = await supabase
      .from("api_credentials")
      .select("*")
      .eq("api_name", "arketa")
      .single();

    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    // If we have valid credentials that aren't expiring soon, return them
    if (credentials && !fetchError) {
      const expiresAt = new Date(credentials.expires_at);
      
      if (expiresAt > fiveMinutesFromNow) {
        console.log("Token still valid, returning existing credentials");
        return new Response(
          JSON.stringify({
            success: true,
            access_token: credentials.access_token,
            expires_at: credentials.expires_at,
            refreshed: false,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Token is expired or expiring soon, need to refresh
      if (credentials.refresh_token) {
        console.log("Token expiring soon, attempting refresh...");
        
        try {
          const tokenResponse = await refreshToken(credentials.refresh_token, ARKETA_API_KEY);
          const newCredentials = await saveCredentials(supabase, tokenResponse);
          
          return new Response(
            JSON.stringify({
              success: true,
              access_token: newCredentials.access_token,
              expires_at: newCredentials.expires_at,
              refreshed: true,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (refreshError) {
          console.error("Refresh failed, will try new token:", refreshError);
          // Fall through to get new token
        }
      }
    }

    // No valid credentials or refresh failed - get new token using API key
    // For Arketa Partner API, the API key is typically used directly as Bearer token
    console.log("Using API key directly for authentication");
    
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    
    const { error: upsertError } = await supabase
      .from("api_credentials")
      .upsert({
        api_name: "arketa",
        access_token: ARKETA_API_KEY,
        refresh_token: null,
        expires_at: expiresAt.toISOString(),
      }, { onConflict: "api_name" });

    if (upsertError) {
      throw new Error(`Failed to save credentials: ${upsertError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        access_token: ARKETA_API_KEY,
        expires_at: expiresAt.toISOString(),
        refreshed: true,
        note: "Using API key authentication",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Token refresh error:", error);
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

async function refreshToken(refreshToken: string, clientSecret: string): Promise<TokenResponse> {
  // Arketa OAuth token endpoint (adjust if different)
  const tokenUrl = "https://us-central1-sutra-prod.cloudfunctions.net/partnerApi/oauth/token";
  
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token refresh failed [${response.status}]: ${errorText}`);
  }

  return await response.json();
}

// deno-lint-ignore no-explicit-any
async function saveCredentials(
  supabase: any,
  tokenResponse: TokenResponse
): Promise<CredentialRow> {
  const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);

  const credentials = {
    api_name: "arketa",
    access_token: tokenResponse.access_token,
    refresh_token: tokenResponse.refresh_token || null,
    expires_at: expiresAt.toISOString(),
  };

  const { data, error } = await supabase
    .from("api_credentials")
    .upsert(credentials, { onConflict: "api_name" })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save credentials: ${error.message}`);
  }

  return data;
}

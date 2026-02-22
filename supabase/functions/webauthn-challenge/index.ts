import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { createErrorResponse, createSuccessResponse } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return createErrorResponse("Method not allowed", corsHeaders, 405);
  }

  let body: { action?: string; allowCredentials?: string[] };
  try {
    body = await req.json();
  } catch {
    return createErrorResponse("Invalid JSON", corsHeaders, 400);
  }

  const action = body.action;

  if (action === "create") {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const challengeB64 = btoa(String.fromCharCode(...challenge));
    return createSuccessResponse({ challenge: challengeB64 }, corsHeaders);
  }

  if (action === "get") {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const challengeB64 = btoa(String.fromCharCode(...challenge));
    const challengeToken = crypto.randomUUID();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { error } = await supabase.from("webauthn_challenges").insert({
      challenge_token: challengeToken,
      challenge: challengeB64,
    });
    if (error) {
      console.error("[webauthn-challenge] insert error:", error);
      return createErrorResponse("Challenge storage failed", corsHeaders, 500);
    }
    return createSuccessResponse(
      { challenge: challengeB64, challengeToken },
      corsHeaders
    );
  }

  return createErrorResponse("Unknown action", corsHeaders, 400);
});

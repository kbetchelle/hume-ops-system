import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import {
  createUnauthorizedResponse,
  createErrorResponse,
  createSuccessResponse,
} from "../_shared/auth.ts";

async function getAuthUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error,
  } = await supabaseAuth.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
}

/** Decode base64url to Uint8Array (for clientDataJSON challenge). */
function base64UrlDecodeToBytes(base64url: string): Uint8Array {
  let s = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4;
  if (pad) s += "=".repeat(4 - pad);
  const binary = atob(s);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

/** Merge two ArrayBuffers. */
function mergeBuffer(a: ArrayBuffer, b: ArrayBuffer): ArrayBuffer {
  const out = new Uint8Array(a.byteLength + b.byteLength);
  out.set(new Uint8Array(a), 0);
  out.set(new Uint8Array(b), a.byteLength);
  return out.buffer;
}

/** Parse ASN.1 DER ECDSA-Sig-Value (sequence of two integers) and return r|s for Web Crypto. */
function convertEcdsaAsn1SignatureToP1363(input: Uint8Array): ArrayBuffer {
  if (input[0] !== 0x30) throw new Error("Invalid ASN.1 sequence");
  const seqLength = input[1];
  const elements: Uint8Array[] = [];
  let current = input.slice(2, 2 + seqLength);
  while (current.length > 0) {
    if (current[0] !== 0x02) throw new Error("Expected INTEGER");
    const elLength = current[1];
    elements.push(current.slice(2, 2 + elLength));
    current = current.slice(2 + elLength);
  }
  if (elements.length !== 2) throw new Error("Expected 2 integers");
  let [r, s] = elements;
  if (r[0] === 0 && r.byteLength % 16 === 1) r = r.slice(1);
  if (s[0] === 0 && s.byteLength % 16 === 1) s = s.slice(1);
  if ((r.byteLength % 16) === 15) r = new Uint8Array(mergeBuffer(new Uint8Array([0]).buffer, new Uint8Array(r).buffer));
  if ((s.byteLength % 16) === 15) s = new Uint8Array(mergeBuffer(new Uint8Array([0]).buffer, new Uint8Array(s).buffer));
  if (r.byteLength % 16 !== 0 || s.byteLength % 16 !== 0) throw new Error("Invalid r|s length");
  return mergeBuffer(new Uint8Array(r).buffer, new Uint8Array(s).buffer);
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return createErrorResponse("Method not allowed", corsHeaders, 405);
  }

  let body: {
    action?: string;
    credentialId?: string;
    publicKey?: string;
    challengeToken?: string;
    clientDataJSON?: string;
    authenticatorData?: string;
    signature?: string;
  };
  try {
    body = await req.json();
  } catch {
    return createErrorResponse("Invalid JSON", corsHeaders, 400);
  }

  const action = body.action;

  if (action === "register") {
    const userId = await getAuthUserId(req);
    if (!userId) return createUnauthorizedResponse("Authentication required", corsHeaders);
    const { credentialId, publicKey } = body;
    if (!credentialId || !publicKey) {
      return createErrorResponse("Missing credentialId or publicKey", corsHeaders, 400);
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { error: insertError } = await supabase.from("user_webauthn_credentials").upsert(
      {
        user_id: userId,
        credential_id: credentialId,
        public_key: publicKey,
        device_name: "Device",
      },
      { onConflict: "user_id,credential_id" }
    );
    if (insertError) {
      console.error("[webauthn-verify] register error:", insertError);
      return createErrorResponse(insertError.message, corsHeaders, 500);
    }
    return createSuccessResponse({ ok: true }, corsHeaders);
  }

  if (action === "authenticate") {
    const { credentialId, clientDataJSON, authenticatorData, signature, challengeToken } = body;
    if (!credentialId || !clientDataJSON || !authenticatorData || !signature || !challengeToken) {
      return createErrorResponse(
        "Missing credentialId, clientDataJSON, authenticatorData, signature, or challengeToken",
        corsHeaders,
        400
      );
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: credRow, error: credError } = await supabase
      .from("user_webauthn_credentials")
      .select("user_id, public_key")
      .eq("credential_id", credentialId)
      .single();
    if (credError || !credRow) {
      return createErrorResponse("Invalid credential", corsHeaders, 401);
    }

    const { data: challengeRow, error: challengeError } = await supabase
      .from("webauthn_challenges")
      .select("challenge")
      .eq("challenge_token", challengeToken)
      .single();
    if (challengeError || !challengeRow) {
      return createErrorResponse("Invalid or expired challenge", corsHeaders, 401);
    }
    await supabase.from("webauthn_challenges").delete().eq("challenge_token", challengeToken);

    const clientDataBytes = Uint8Array.from(atob(clientDataJSON), (c) => c.charCodeAt(0));
    let clientData: { challenge?: string };
    try {
      clientData = JSON.parse(new TextDecoder().decode(clientDataBytes));
    } catch {
      return createErrorResponse("Invalid clientDataJSON", corsHeaders, 400);
    }
    const clientChallengeB64url = clientData.challenge;
    if (!clientChallengeB64url) return createErrorResponse("Missing challenge in clientData", corsHeaders, 400);
    const expectedChallengeBytes = Uint8Array.from(atob(challengeRow.challenge), (c) => c.charCodeAt(0));
    const actualChallengeBytes = base64UrlDecodeToBytes(clientChallengeB64url);
    if (expectedChallengeBytes.length !== actualChallengeBytes.length ||
        !expectedChallengeBytes.every((b, i) => b === actualChallengeBytes[i])) {
      return createErrorResponse("Challenge mismatch", corsHeaders, 401);
    }

    const authDataBytes = Uint8Array.from(atob(authenticatorData), (c) => c.charCodeAt(0));
    const clientDataHash = await crypto.subtle.digest("SHA-256", clientDataBytes);
    const signedData = mergeBuffer(authDataBytes.buffer, clientDataHash);

    const signatureBytes = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
    let signatureP1363: ArrayBuffer;
    try {
      signatureP1363 = convertEcdsaAsn1SignatureToP1363(signatureBytes);
    } catch {
      return createErrorResponse("Invalid signature format", corsHeaders, 400);
    }

    const publicKeyBytes = Uint8Array.from(atob(credRow.public_key), (c) => c.charCodeAt(0));
    let key: CryptoKey;
    try {
      key = await crypto.subtle.importKey(
        "spki",
        publicKeyBytes.buffer,
        { name: "ECDSA", namedCurve: "P-256" },
        false,
        ["verify"]
      );
    } catch (e) {
      console.error("[webauthn-verify] importKey error:", e);
      return createErrorResponse("Invalid public key", corsHeaders, 500);
    }
    const valid = await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      signatureP1363,
      signedData
    );
    if (!valid) return createErrorResponse("Signature verification failed", corsHeaders, 401);

    const userId = credRow.user_id as string;
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !userData?.user?.email) {
      return createErrorResponse("User not found", corsHeaders, 404);
    }
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: userData.user.email,
    });
    if (linkError || !linkData?.properties?.action_link) {
      console.error("[webauthn-verify] generateLink error:", linkError);
      return createErrorResponse("Could not create login link", corsHeaders, 500);
    }
    return createSuccessResponse(
      { redirectUrl: linkData.properties.action_link },
      corsHeaders
    );
  }

  return createErrorResponse("Unknown action", corsHeaders, 400);
});

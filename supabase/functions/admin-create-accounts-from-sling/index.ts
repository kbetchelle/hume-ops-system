import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DEFAULT_PASSWORD = "1600Main!";
const BULK_LIMIT = 25;

const VALID_APP_ROLES = [
  "admin",
  "manager",
  "concierge",
  "trainer",
  "female_spa_attendant",
  "male_spa_attendant",
  "floater",
  "cafe",
] as const;

type AppRole = (typeof VALID_APP_ROLES)[number];

function isAppRole(s: string): s is AppRole {
  return VALID_APP_ROLES.includes(s as AppRole);
}

/** Normalize username: lowercase, trim, only [a-z0-9_]. Returns null if invalid. */
function normalizeUsername(raw: string): string | null {
  const t = raw?.trim?.()?.toLowerCase?.() ?? "";
  if (!t) return null;
  const sanitized = t.replace(/[^a-z0-9_]/g, "");
  return sanitized.length > 0 ? sanitized : null;
}

interface CreateAccountItem {
  slingUserId: string;
  username: string;
  primaryRole?: string;
  roles?: string[];
}

interface Result {
  success: boolean;
  created?: number;
  skipped?: number;
  skippedReasons?: {
    alreadyHasAccount: number;
    noEmail: number;
    invalidOrDuplicateUsername: number;
  };
  errors?: string[];
  error?: string;
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing or invalid authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const jwt = authHeader.replace("Bearer ", "");
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const {
      data: { user: caller },
      error: authError,
    } = await supabaseAdmin.auth.getUser(jwt);
    if (authError || !caller) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: callerRoles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);
    if (rolesError) {
      return new Response(
        JSON.stringify({ success: false, error: "Failed to verify caller roles" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const roleValues = (callerRoles || []).map((r: { role: string }) => r.role);
    if (!roleValues.includes("admin") && !roleValues.includes("manager")) {
      return new Response(
        JSON.stringify({ success: false, error: "Access denied. Admin or Manager role required." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let body: { accounts: CreateAccountItem[] };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accounts = Array.isArray(body?.accounts) ? body.accounts : [];
    if (accounts.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          created: 0,
          skipped: 0,
          skippedReasons: { alreadyHasAccount: 0, noEmail: 0, invalidOrDuplicateUsername: 0 },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (accounts.length > BULK_LIMIT) {
      return new Response(
        JSON.stringify({ success: false, error: `Maximum ${BULK_LIMIT} accounts per request` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result: Result = {
      success: true,
      created: 0,
      skipped: 0,
      skippedReasons: { alreadyHasAccount: 0, noEmail: 0, invalidOrDuplicateUsername: 0 },
      errors: [],
    };

    const slingIds = [...new Set(accounts.map((a) => a.slingUserId))];
    const { data: slingRows, error: slingError } = await supabaseAdmin
      .from("sling_users")
      .select("id, email, first_name, last_name")
      .in("id", slingIds);
    if (slingError) {
      return new Response(
        JSON.stringify({ success: false, error: slingError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const slingMap = new Map((slingRows || []).map((r) => [r.id, r]));

    const existingEmails = new Set<string>();
    const { data: existingProfiles } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .in("email", (slingRows || []).map((r) => r.email).filter(Boolean));
    (existingProfiles || []).forEach((p) => existingEmails.add(p.email?.toLowerCase?.() ?? ""));

    const usedUsernames = new Set<string>();
    const { data: existingUsernames } = await supabaseAdmin
      .from("profiles")
      .select("username")
      .not("username", "is", null);
    (existingUsernames || []).forEach((p) => {
      const u = p.username?.trim?.()?.toLowerCase?.();
      if (u) usedUsernames.add(u);
    });

    for (const item of accounts) {
      const sling = slingMap.get(item.slingUserId);
      if (!sling) {
        result.skipped!++;
        result.errors!.push(`Sling user not found: ${item.slingUserId}`);
        continue;
      }
      const email = (sling.email ?? "").trim();
      if (!email) {
        result.skipped!++;
        result.skippedReasons!.noEmail++;
        continue;
      }
      if (existingEmails.has(email.toLowerCase())) {
        result.skipped!++;
        result.skippedReasons!.alreadyHasAccount++;
        continue;
      }

      const username = normalizeUsername(item.username);
      if (!username) {
        result.skipped!++;
        result.skippedReasons!.invalidOrDuplicateUsername++;
        result.errors!.push(`Invalid username for ${email}`);
        continue;
      }
      if (usedUsernames.has(username)) {
        result.skipped!++;
        result.skippedReasons!.invalidOrDuplicateUsername++;
        result.errors!.push(`Duplicate username: ${username}`);
        continue;
      }

      const primaryRole: AppRole | null =
        item.primaryRole && isAppRole(item.primaryRole) ? (item.primaryRole as AppRole) : "concierge";
      
      // Build roles array: use provided roles if valid, otherwise fall back to primaryRole only
      let roles: AppRole[];
      if (Array.isArray(item.roles) && item.roles.length > 0) {
        roles = item.roles.filter(isAppRole) as AppRole[];
        // Ensure primary role is included
        if (primaryRole && !roles.includes(primaryRole)) {
          roles.unshift(primaryRole);
        }
        if (roles.length === 0) roles = primaryRole ? [primaryRole] : ["concierge"];
      } else {
        roles = primaryRole ? [primaryRole] : ["concierge"];
      }

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
      });
      if (createError) {
        result.skipped!++;
        result.errors!.push(`${email}: ${createError.message}`);
        continue;
      }
      if (!newUser.user) {
        result.skipped!++;
        result.errors!.push(`${email}: No user returned`);
        continue;
      }

      const fullName = [sling.first_name, sling.last_name].filter(Boolean).join(" ").trim() || null;
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({
          full_name: fullName,
          username: username,
          sling_id: sling.id,
          must_change_password: true,
          approval_status: "auto_approved",
          approved_at: new Date().toISOString(),
        })
        .eq("user_id", newUser.user.id);
      if (profileError) {
        result.skipped!++;
        result.skippedReasons!.invalidOrDuplicateUsername++;
        result.errors!.push(`${email}: profile update failed: ${profileError.message}`);
        continue;
      }

      for (const role of roles) {
        await supabaseAdmin.from("user_roles").insert({ user_id: newUser.user.id, role });
      }
      await supabaseAdmin
        .from("profiles")
        .update({ primary_role: primaryRole })
        .eq("user_id", newUser.user.id);

      existingEmails.add(email.toLowerCase());
      usedUsernames.add(username);
      result.created!++;
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("admin-create-accounts-from-sling:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

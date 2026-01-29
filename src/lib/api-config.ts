/**
 * Centralized API Configuration
 * 
 * SECURITY NOTE: Private API keys (secrets, tokens) should NOT be exposed in frontend code.
 * Use edge functions for secure API calls. Public client IDs are acceptable here.
 */

// Environment variable types
interface ApiConfig {
  arketa: {
    clientId: string;
    apiUrl: string;
  };
  getSling: {
    apiUrl: string;
  };
  toast: {
    apiUrl: string;
  };
  supabase: {
    url: string;
    anonKey: string;
  };
}

// Load environment variables with defaults
export const apiConfig: ApiConfig = {
  arketa: {
    clientId: import.meta.env.VITE_ARKETA_CLIENT_ID || "",
    apiUrl: import.meta.env.VITE_ARKETA_API_URL || "https://api.arketa.co",
  },
  getSling: {
    apiUrl: import.meta.env.VITE_GETSLING_API_URL || "https://api.getsling.com",
  },
  toast: {
    apiUrl: import.meta.env.VITE_TOAST_API_URL || "https://api.toasttab.com",
  },
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || "",
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
  },
};

// Validate required configuration
export function validateConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!apiConfig.supabase.url) missing.push("VITE_SUPABASE_URL");
  if (!apiConfig.supabase.anonKey) missing.push("VITE_SUPABASE_ANON_KEY");

  return {
    valid: missing.length === 0,
    missing,
  };
}

// Check if a specific API is configured
export function isApiConfigured(api: keyof ApiConfig): boolean {
  switch (api) {
    case "arketa":
      return !!apiConfig.arketa.clientId && !!apiConfig.arketa.apiUrl;
    case "getSling":
      return !!apiConfig.getSling.apiUrl;
    case "toast":
      return !!apiConfig.toast.apiUrl;
    case "supabase":
      return !!apiConfig.supabase.url && !!apiConfig.supabase.anonKey;
    default:
      return false;
  }
}

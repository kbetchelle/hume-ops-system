/**
 * Shared Arketa authentication helper
 * Provides standardized token management for all Arketa sync functions
 */

export interface ArketaTokenResult {
  accessToken: string;
  expiresAt: string;
  refreshed: boolean;
}

/**
 * Get a valid Arketa access token
 * Calls the refresh-arketa-token function which handles:
 * - Returning cached token if still valid
 * - Refreshing via OAuth if refresh_token available
 * - Falling back to API key authentication
 */
export async function getArketaToken(
  supabaseUrl: string, 
  serviceRoleKey: string
): Promise<string> {
  const response = await fetch(`${supabaseUrl}/functions/v1/refresh-arketa-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    const hint = response.status === 404
      ? ' (refresh-arketa-token may not be deployed - run: supabase functions deploy refresh-arketa-token)'
      : '';
    throw new Error(`Failed to get Arketa token: ${response.status}${hint} - ${errorText || response.statusText}`);
  }

  const result = await response.json();
  
  if (!result.success || !result.access_token) {
    throw new Error(`Invalid token response: ${JSON.stringify(result)}`);
  }

  return result.access_token;
}

/**
 * Get standardized headers for Arketa API requests
 * Uses Bearer token authentication
 */
export function getArketaHeaders(token: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Get headers using API key directly (fallback/legacy mode)
 * Some Arketa endpoints may only support x-api-key auth
 */
export function getArketaApiKeyHeaders(apiKey: string): Record<string, string> {
  return {
    'x-api-key': apiKey,
    'Content-Type': 'application/json',
  };
}

/**
 * Arketa API base URLs
 */
export const ARKETA_URLS = {
  /** Per API docs (Partner API Reference v0), production base URL */
  prod: 'https://us-central1-sutra-prod.cloudfunctions.net/partnerApiDev/v0',
  /** Legacy URL — kept as fallback reference only */
  legacy: 'https://us-central1-sutra-prod.cloudfunctions.net/partnerApi/v0',
} as const;

/**
 * Build Arketa API URL for a given endpoint
 */
export function buildArketaUrl(
  partnerId: string,
  endpoint: string,
): string {
  return `${ARKETA_URLS.prod}/${partnerId}/${endpoint}`;
}

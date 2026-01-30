export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '*';
  
  // Allow all lovable.app and lovableproject.com origins, localhost, and the production domain
  const isAllowed = origin === '*' ||
    origin.endsWith('.lovable.app') ||
    origin.endsWith('.lovableproject.com') ||
    origin.startsWith('http://localhost:') ||
    origin === 'https://hume-ops-system.lovable.app';
  
  const corsOrigin = isAllowed ? origin : 'https://hume-ops-system.lovable.app';

  return {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-token, x-staff-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export function handleCorsPreflightRequest(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  return null;
}

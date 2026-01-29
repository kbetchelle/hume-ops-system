import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface TokenValidation {
  valid: boolean;
  role?: string;
  userId?: string;
  staffId?: string;
  staffName?: string;
  error?: string;
}

export function getTokenFromRequest(req: Request): string | null {
  return req.headers.get('x-session-token');
}

export function getStaffTokenFromRequest(req: Request): string | null {
  return req.headers.get('x-staff-token');
}

export async function validateSessionToken(token: string | null): Promise<TokenValidation> {
  if (!token) return { valid: false, error: 'No token provided' };

  const parts = token.split(':');
  if (parts.length < 3) return { valid: false, error: 'Invalid token format' };

  const [role, userIdOrExpires, expiresAtOrSig] = parts;
  const expiresAt = parts.length === 4 ? parseInt(parts[2]) : parseInt(userIdOrExpires);
  const userId = parts.length === 4 ? parts[1] : undefined;

  if (Date.now() > expiresAt) return { valid: false, error: 'Token expired' };

  return { valid: true, role, userId };
}

export async function validateStaffToken(token: string | null): Promise<TokenValidation> {
  if (!token) return { valid: false, error: 'No staff token provided' };

  try {
    const [, payload] = token.split('.');
    const decoded = JSON.parse(atob(payload));

    if (decoded.exp && Date.now() / 1000 > decoded.exp) {
      return { valid: false, error: 'Staff token expired' };
    }

    return {
      valid: true,
      staffId: decoded.sub || decoded.staff_id,
      staffName: decoded.name || decoded.staff_name,
      role: 'staff',
    };
  } catch {
    return { valid: false, error: 'Invalid staff token' };
  }
}

export function createUnauthorizedResponse(message: string, corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error: message, success: false }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

export function createErrorResponse(
  message: string,
  corsHeaders: Record<string, string>,
  status: number = 500
): Response {
  return new Response(
    JSON.stringify({ error: message, success: false }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

export function createSuccessResponse(
  data: unknown,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({ success: true, data }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

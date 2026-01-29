/**
 * Authentication utilities for API calls
 */

const SESSION_TOKEN_KEY = 'hume_session_token';
const STAFF_TOKEN_KEY = 'hume_staff_token';

export interface SessionData {
  role: string;
  userId?: string;
  expiresAt: number;
}

export interface StaffData {
  staffId: string;
  staffName: string;
  exp: number;
}

/**
 * Create a session token for authenticated users
 */
export function createSessionToken(role: string, userId?: string, expiresInMs = 8 * 60 * 60 * 1000): string {
  const expiresAt = Date.now() + expiresInMs;
  const signature = btoa(`${role}:${expiresAt}`).slice(0, 12);
  
  if (userId) {
    return `${role}:${userId}:${expiresAt}:${signature}`;
  }
  return `${role}:${expiresAt}:${signature}`;
}

/**
 * Parse a session token
 */
export function parseSessionToken(token: string): SessionData | null {
  try {
    const parts = token.split(':');
    if (parts.length < 3) return null;
    
    const role = parts[0];
    const hasUserId = parts.length === 4;
    const userId = hasUserId ? parts[1] : undefined;
    const expiresAt = parseInt(hasUserId ? parts[2] : parts[1]);
    
    if (isNaN(expiresAt) || Date.now() > expiresAt) return null;
    
    return { role, userId, expiresAt };
  } catch {
    return null;
  }
}

/**
 * Store session token
 */
export function setSessionToken(token: string): void {
  localStorage.setItem(SESSION_TOKEN_KEY, token);
}

/**
 * Get stored session token
 */
export function getSessionToken(): string | null {
  const token = localStorage.getItem(SESSION_TOKEN_KEY);
  if (!token) return null;
  
  // Validate token is not expired
  const session = parseSessionToken(token);
  if (!session) {
    clearSessionToken();
    return null;
  }
  
  return token;
}

/**
 * Clear session token
 */
export function clearSessionToken(): void {
  localStorage.removeItem(SESSION_TOKEN_KEY);
}

/**
 * Store staff token
 */
export function setStaffToken(token: string): void {
  localStorage.setItem(STAFF_TOKEN_KEY, token);
}

/**
 * Get stored staff token
 */
export function getStaffToken(): string | null {
  const token = localStorage.getItem(STAFF_TOKEN_KEY);
  if (!token) return null;
  
  // Validate JWT expiration
  try {
    const [, payload] = token.split('.');
    const decoded = JSON.parse(atob(payload)) as StaffData;
    if (decoded.exp && Date.now() / 1000 > decoded.exp) {
      clearStaffToken();
      return null;
    }
    return token;
  } catch {
    clearStaffToken();
    return null;
  }
}

/**
 * Clear staff token
 */
export function clearStaffToken(): void {
  localStorage.removeItem(STAFF_TOKEN_KEY);
}

/**
 * Get auth headers for API requests
 */
export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  
  const sessionToken = getSessionToken();
  if (sessionToken) {
    headers['x-session-token'] = sessionToken;
  }
  
  const staffToken = getStaffToken();
  if (staffToken) {
    headers['x-staff-token'] = staffToken;
  }
  
  return headers;
}

/**
 * Clear all auth tokens
 */
export function clearAllTokens(): void {
  clearSessionToken();
  clearStaffToken();
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getSessionToken() !== null || getStaffToken() !== null;
}

/**
 * Get current session role
 */
export function getCurrentRole(): string | null {
  const token = getSessionToken();
  if (!token) return null;
  
  const session = parseSessionToken(token);
  return session?.role || null;
}

/**
 * Data API Client
 * 
 * Frontend client for the data-api edge function with role-based access control.
 * Includes retry logic with exponential backoff for transient failures.
 */

import { supabase } from '@/integrations/supabase/client';
import { getAuthHeaders } from './auth';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export type FilterType = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is' | 'in' | 'contains' | 'containedBy';

export interface Filter {
  type: FilterType;
  column: string;
  value: unknown;
}

export interface OrderConfig {
  column: string;
  ascending?: boolean;
}

export interface DataApiRequest {
  action: 'select' | 'insert' | 'update' | 'delete' | 'upsert';
  table: string;
  data?: unknown;
  filters?: Filter[];
  select?: string;
  order?: OrderConfig | OrderConfig[];
  limit?: number;
}

export interface DataApiResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface DataApiOptions {
  maxRetries?: number;
  baseDelay?: number;
  timeout?: number;
}

const DEFAULT_MAX_RETRIES = 3;
const BASE_RETRY_DELAY = 1000;
const DEFAULT_TIMEOUT = 30000;

/**
 * Check if an error is retryable
 */
function isRetryableError(error: Error | Response): boolean {
  if (error instanceof Response) {
    return error.status >= 500 || error.status === 429;
  }
  const msg = error.message?.toLowerCase() || '';
  return msg.includes('network') || msg.includes('fetch') || msg.includes('timeout') || msg.includes('aborted');
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create an AbortController with timeout
 */
function createTimeoutController(timeoutMs: number): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller;
}

/**
 * Get the current user's access token from Supabase session
 */
async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

/**
 * Main data API function with retry logic
 */
export async function dataApi<T = unknown>(
  request: DataApiRequest,
  options?: DataApiOptions
): Promise<DataApiResponse<T>> {
  const maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
  const baseDelay = options?.baseDelay ?? BASE_RETRY_DELAY;
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT;
  
  let lastError: Error | null = null;

  // Get the user's access token for authentication
  const accessToken = await getAccessToken();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = createTimeoutController(timeout);
      
      // Build headers - use user's access token if available, otherwise fall back to anon key
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
        ...getAuthHeaders(),
      };
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/data-api`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        if (isRetryableError(response) && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt);
          console.warn(`Data API retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
          await sleep(delay);
          continue;
        }
        
        const errorData = await response.json().catch(() => ({}));
        return { 
          data: null, 
          error: new Error(errorData.error || `HTTP ${response.status}`) 
        };
      }

      const data = await response.json();
      
      if (!data.success) {
        return { 
          data: null, 
          error: new Error(data.error || 'Unknown error') 
        };
      }
      
      return { data: data.data as T, error: null };
      
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Unknown error');
      
      if (isRetryableError(lastError) && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`Data API retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await sleep(delay);
        continue;
      }
      
      return { data: null, error: lastError };
    }
  }

  return { data: null, error: lastError || new Error('Max retries exceeded') };
}

// ============================================
// Convenience Functions
// ============================================

/**
 * Select records from a table
 */
export function selectFrom<T = unknown>(
  table: string, 
  options?: Omit<DataApiRequest, 'action' | 'table'>
): Promise<DataApiResponse<T[]>> {
  return dataApi<T[]>({ action: 'select', table, ...options });
}

/**
 * Select a single record from a table
 */
export async function selectSingle<T = unknown>(
  table: string, 
  filters: Filter[]
): Promise<DataApiResponse<T | null>> {
  const result = await dataApi<T[]>({ action: 'select', table, filters, limit: 1 });
  
  if (result.error) {
    return { data: null, error: result.error };
  }
  
  return { 
    data: result.data && result.data.length > 0 ? result.data[0] : null, 
    error: null 
  };
}

/**
 * Insert records into a table
 */
export function insertInto<T = unknown>(
  table: string, 
  data: unknown
): Promise<DataApiResponse<T[]>> {
  return dataApi<T[]>({ 
    action: 'insert', 
    table, 
    data: Array.isArray(data) ? data : [data] 
  });
}

/**
 * Update records in a table
 */
export function updateTable<T = unknown>(
  table: string, 
  data: unknown, 
  filters: Filter[]
): Promise<DataApiResponse<T[]>> {
  return dataApi<T[]>({ action: 'update', table, data, filters });
}

/**
 * Delete records from a table
 */
export function deleteFrom(
  table: string, 
  filters: Filter[]
): Promise<DataApiResponse<unknown>> {
  return dataApi({ action: 'delete', table, filters });
}

/**
 * Upsert records into a table
 */
export function upsertInto<T = unknown>(
  table: string, 
  records: unknown[], 
  onConflict?: string,
  ignoreDuplicates?: boolean
): Promise<DataApiResponse<T[]>> {
  return dataApi<T[]>({ 
    action: 'upsert', 
    table, 
    data: { records, onConflict, ignoreDuplicates } 
  });
}

// ============================================
// Filter Builder Helpers
// ============================================

export const eq = (column: string, value: unknown): Filter => ({ type: 'eq', column, value });
export const neq = (column: string, value: unknown): Filter => ({ type: 'neq', column, value });
export const gt = (column: string, value: unknown): Filter => ({ type: 'gt', column, value });
export const gte = (column: string, value: unknown): Filter => ({ type: 'gte', column, value });
export const lt = (column: string, value: unknown): Filter => ({ type: 'lt', column, value });
export const lte = (column: string, value: unknown): Filter => ({ type: 'lte', column, value });
export const like = (column: string, value: string): Filter => ({ type: 'like', column, value });
export const ilike = (column: string, value: string): Filter => ({ type: 'ilike', column, value });
export const isNull = (column: string): Filter => ({ type: 'is', column, value: null });
export const isNotNull = (column: string): Filter => ({ type: 'neq', column, value: null });
export const inArray = (column: string, values: unknown[]): Filter => ({ type: 'in', column, value: values });

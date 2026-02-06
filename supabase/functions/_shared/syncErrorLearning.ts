/**
 * Sync error learning: learn from each sync run to improve retry and backoff.
 * Used by unified-backfill-sync and backfill-historical to set smarter delays
 * and retry behavior based on recent errors.
 */

export interface SyncErrorSummary {
  error?: string;
  id?: string;
}

const DEFAULT_DELAY_MS = 2000;
const ERROR_BACKOFF_MS = 5000;
const RATE_LIMIT_BACKOFF_MS = 10000;

/**
 * Returns suggested delay (ms) before next batch based on errors from the last cycle.
 * - Rate limit (429 / "rate limit"): 10s
 * - Any other sync/upsert errors: 5s
 * - No errors: 2s (default)
 */
export function getSuggestedDelayMs(
  errors: SyncErrorSummary[],
  previousDelayMs?: number
): number {
  if (!errors?.length) return DEFAULT_DELAY_MS;

  const combined = errors.map((e) => (e.error || '').toLowerCase()).join(' ');
  if (
    combined.includes('429') ||
    combined.includes('rate limit') ||
    combined.includes('too many requests')
  ) {
    return RATE_LIMIT_BACKOFF_MS;
  }

  return ERROR_BACKOFF_MS;
}

/**
 * Classify last error for logging and optional persistence.
 */
export function classifyError(message: string): {
  kind: 'rate_limit' | 'timeout' | 'api_error' | 'upsert_error' | 'unknown';
  suggestedDelayMs: number;
} {
  const lower = message.toLowerCase();
  if (
    lower.includes('429') ||
    lower.includes('rate limit') ||
    lower.includes('too many requests')
  ) {
    return { kind: 'rate_limit', suggestedDelayMs: RATE_LIMIT_BACKOFF_MS };
  }
  if (
    lower.includes('timeout') ||
    lower.includes('timed out') ||
    lower.includes('aborted')
  ) {
    return { kind: 'timeout', suggestedDelayMs: ERROR_BACKOFF_MS };
  }
  if (
    lower.includes('api error') ||
    lower.includes('http 5') ||
    lower.includes('failed to fetch')
  ) {
    return { kind: 'api_error', suggestedDelayMs: ERROR_BACKOFF_MS };
  }
  if (
    lower.includes('upsert') ||
    lower.includes('insert') ||
    lower.includes('constraint') ||
    lower.includes('pgrst')
  ) {
    return { kind: 'upsert_error', suggestedDelayMs: ERROR_BACKOFF_MS };
  }
  return { kind: 'unknown', suggestedDelayMs: ERROR_BACKOFF_MS };
}

/**
 * Suggested delay when scheduling a retry after a thrown error (e.g. in backfill-historical).
 */
export function getSuggestedDelayFromMessage(errorMessage: string): number {
  const { suggestedDelayMs } = classifyError(errorMessage);
  return suggestedDelayMs;
}

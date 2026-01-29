/**
 * Structured logging utility for sync functions
 * Provides consistent log formatting with timing and context
 */

export interface SyncLogger {
  info: (msg: string, data?: object) => void;
  warn: (msg: string, data?: object) => void;
  error: (msg: string, error?: Error | unknown, data?: object) => void;
  timing: (operation: string, startTime: number) => number;
  startTiming: (operation: string) => () => number;
}

/**
 * Create a structured logger for sync operations
 * @param syncType - The type of sync (e.g., 'arketa_classes', 'sling_shifts')
 * @param jobId - Optional job ID for backfill operations
 */
export function createSyncLogger(syncType: string, jobId?: string): SyncLogger {
  const prefix = `[${syncType}]${jobId ? `[${jobId.substring(0, 8)}]` : ''}`;

  return {
    info: (msg: string, data?: object) => {
      console.log(`${prefix} ${msg}`, data ? JSON.stringify(data) : '');
    },

    warn: (msg: string, data?: object) => {
      console.warn(`${prefix} ${msg}`, data ? JSON.stringify(data) : '');
    },

    error: (msg: string, error?: Error | unknown, data?: object) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(
        `${prefix} ${msg}`,
        errorMessage,
        data ? JSON.stringify(data) : ''
      );
    },

    timing: (operation: string, startTime: number) => {
      const duration = Date.now() - startTime;
      console.log(`${prefix} ${operation} completed in ${duration}ms`);
      return duration;
    },

    startTiming: (operation: string) => {
      const startTime = Date.now();
      return () => {
        const duration = Date.now() - startTime;
        console.log(`${prefix} ${operation} completed in ${duration}ms`);
        return duration;
      };
    },
  };
}

/**
 * Log sync metrics to the database
 */
export async function logSyncMetrics(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  metrics: {
    syncType: string;
    startedAt: string;
    completedAt: string;
    durationMs: number;
    recordsFetched: number;
    recordsSynced: number;
    recordsFailed: number;
    retryCount: number;
    errorMessage?: string;
  }
): Promise<void> {
  try {
    await supabase
      .from('sync_metrics')
      .insert({
        sync_type: metrics.syncType,
        started_at: metrics.startedAt,
        completed_at: metrics.completedAt,
        duration_ms: metrics.durationMs,
        records_fetched: metrics.recordsFetched,
        records_synced: metrics.recordsSynced,
        records_failed: metrics.recordsFailed,
        retry_count: metrics.retryCount,
        error_message: metrics.errorMessage || null,
      });
  } catch (error) {
    // Don't fail the sync if metrics logging fails
    console.error('[logger] Failed to log sync metrics:', error);
  }
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

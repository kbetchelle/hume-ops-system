import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

// Timeout constants
const SYNC_TIMEOUT_MS = 240000; // 4 minutes per sync
const RUNNER_TIMEOUT_MS = 300000; // 5 minutes total for all syncs

interface SyncSchedule {
  id: string;
  sync_type: string;
  display_name: string;
  function_name: string;
  interval_minutes: number;
  is_enabled: boolean;
  failure_count: number;
}

interface SyncResult {
  success: boolean;
  syncedCount?: number;
  error?: string;
  timedOut?: boolean;
}

/**
 * Wrap a promise with a timeout
 * Rejects with a timeout error if the promise doesn't resolve in time
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)),
      timeoutMs
    );
  });
  return Promise.race([promise, timeout]);
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);
  const runnerStartTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json().catch(() => ({}));
    const { sync_type: specificSyncType, run_all } = body;

    console.log('[Scheduled Sync Runner] Starting sync check...');

    // Build query for due syncs
    let query = supabase
      .from('sync_schedule')
      .select('*')
      .eq('is_enabled', true);

    if (specificSyncType) {
      // Manual trigger for specific sync
      query = query.eq('sync_type', specificSyncType);
    } else if (!run_all) {
      // Automatic mode - only run due syncs
      query = query.lte('next_run_at', new Date().toISOString());
    }

    const { data: dueSyncs, error: queryError } = await query;

    if (queryError) {
      throw new Error(`Failed to query sync schedule: ${queryError.message}`);
    }

    if (!dueSyncs || dueSyncs.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No syncs due to run',
          syncsRun: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Scheduled Sync Runner] Found ${dueSyncs.length} syncs to run`);

    const results: Array<{ syncType: string; result: SyncResult }> = [];
    const skippedSyncs: string[] = [];

    for (const sync of dueSyncs as SyncSchedule[]) {
      // Check if we've exceeded overall runner timeout
      const elapsedTime = Date.now() - runnerStartTime;
      if (elapsedTime >= RUNNER_TIMEOUT_MS) {
        console.warn(
          `[Scheduled Sync Runner] Overall timeout reached (${RUNNER_TIMEOUT_MS}ms), ` +
          `stopping after ${results.length} syncs`
        );
        
        // Record remaining syncs as skipped
        const currentIndex = dueSyncs.indexOf(sync);
        for (let i = currentIndex; i < dueSyncs.length; i++) {
          skippedSyncs.push((dueSyncs[i] as SyncSchedule).sync_type);
        }
        
        console.log(`[Scheduled Sync Runner] Skipped syncs: ${skippedSyncs.join(', ')}`);
        break;
      }

      console.log(`[Scheduled Sync Runner] Running sync: ${sync.sync_type}`);

      // Update status to running
      await supabase
        .from('sync_schedule')
        .update({ 
          last_status: 'running',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sync.id);

      let result: SyncResult;

      try {
        // Wrap sync execution with timeout
        result = await withTimeout(
          runSync(supabase, sync.sync_type, supabaseUrl, supabaseKey),
          SYNC_TIMEOUT_MS,
          `${sync.sync_type} sync`
        );
      } catch (error) {
        const isTimeout = error instanceof Error && error.message.includes('timed out');
        
        if (isTimeout) {
          console.error(`[Scheduled Sync Runner] ${sync.sync_type} timed out after ${SYNC_TIMEOUT_MS}ms`);
        }
        
        result = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timedOut: isTimeout,
        };
      }

      // Calculate next run time
      const nextRunAt = new Date();
      nextRunAt.setMinutes(nextRunAt.getMinutes() + sync.interval_minutes);

      // Update sync schedule with result
      // Count timeouts toward failure count
      const newFailureCount = result.success ? 0 : sync.failure_count + 1;
      
      // Determine status - use 'timeout' for timeout errors
      let lastStatus = 'success';
      if (!result.success) {
        lastStatus = result.timedOut ? 'timeout' : 'failed';
      }
      
      await supabase
        .from('sync_schedule')
        .update({
          last_run_at: new Date().toISOString(),
          next_run_at: nextRunAt.toISOString(),
          last_status: lastStatus,
          last_error: result.error || null,
          records_synced: result.syncedCount || 0,
          failure_count: newFailureCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sync.id);

      // Create admin alert if failure count reaches threshold
      if (newFailureCount >= 3) {
        await createAdminAlert(
          supabase, 
          sync.sync_type, 
          result.error || 'Unknown error',
          result.timedOut
        );
      }

      results.push({ syncType: sync.sync_type, result });
    }

    const successCount = results.filter(r => r.result.success).length;
    const failedCount = results.filter(r => !r.result.success && !r.result.timedOut).length;
    const timeoutCount = results.filter(r => r.result.timedOut).length;
    const totalElapsed = Date.now() - runnerStartTime;

    console.log(
      `[Scheduled Sync Runner] Completed in ${totalElapsed}ms: ` +
      `${successCount} success, ${failedCount} failed, ${timeoutCount} timeout, ` +
      `${skippedSyncs.length} skipped`
    );

    return new Response(
      JSON.stringify({
        success: true,
        syncsRun: results.length,
        successCount,
        failedCount,
        timeoutCount,
        skippedSyncs,
        totalElapsedMs: totalElapsed,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Scheduled Sync Runner] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function runSync(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  syncType: string,
  supabaseUrl: string,
  serviceRoleKey: string
): Promise<SyncResult> {
  // Look up function name from sync_schedule table
  const { data: syncConfig, error: lookupError } = await supabase
    .from('sync_schedule')
    .select('function_name')
    .eq('sync_type', syncType)
    .single();

  if (lookupError || !syncConfig?.function_name) {
    console.error(`[runSync] Failed to find function_name for ${syncType}:`, lookupError);
    return { success: false, error: `Unknown sync type: ${syncType}` };
  }

  const functionName = syncConfig.function_name;

  // Prepare request body based on sync type
  let requestBody = {};
  if (syncType === 'sling_users') {
    requestBody = { action: 'sync-users' };
  } else if (syncType === 'sling_shifts') {
    requestBody = { action: 'sync-shifts' };
  } else if (syncType === 'toast_sales') {
    // Sync last 1 day of sales data
    requestBody = { days_back: 1 };
  }

  // Call the appropriate edge function
  const functionUrl = `${supabaseUrl}/functions/v1/${functionName}`;
  
  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { success: false, error: `Function call failed: ${response.status} - ${errorText}` };
  }

  const data = await response.json();
  
  // Extract synced count from various response formats
  const syncedCount = data.syncedCount 
    || data.matchedCount 
    || data.totalInserted 
    || data.users?.length 
    || data.classes?.length 
    || data.reservations?.length 
    || data.payments?.length 
    || data.instructors?.length 
    || data.subscriptions?.length
    || data.syncedDates?.length  // Toast sales
    || 0;

  return {
    success: data.success !== false && !data.error,
    syncedCount,
    error: data.error,
  };
}

async function createAdminAlert(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  syncType: string,
  errorMessage: string,
  wasTimeout = false
) {
  const alertTitle = wasTimeout 
    ? `Sync Timeout: ${syncType}`
    : `Sync Failed: ${syncType}`;

  // Check if a recent alert for this sync already exists (within 24 hours)
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const { data: existingAlerts } = await supabase
    .from('announcements')
    .select('id')
    .eq('title', alertTitle)
    .gte('created_at', oneDayAgo.toISOString())
    .limit(1);

  if (existingAlerts && existingAlerts.length > 0) {
    console.log(`[Scheduled Sync Runner] Alert for ${syncType} already exists, skipping`);
    return;
  }

  // Get a system admin user to create the announcement
  const { data: adminUser } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin')
    .limit(1)
    .single();

  if (!adminUser) {
    console.error('[Scheduled Sync Runner] No admin user found to create alert');
    return;
  }

  const alertContent = wasTimeout
    ? `The ${syncType} sync has timed out 3 or more times (>${SYNC_TIMEOUT_MS / 1000}s). This may indicate API performance issues or large data sets. Please investigate.`
    : `The ${syncType} sync has failed 3 or more times. Last error: ${errorMessage}. Please check the sync configuration and external API status.`;

  await supabase
    .from('announcements')
    .insert({
      title: alertTitle,
      content: alertContent,
      created_by: adminUser.user_id,
      target_roles: ['admin', 'manager'],
    });

  console.log(`[Scheduled Sync Runner] Created admin alert for ${syncType} ${wasTimeout ? 'timeouts' : 'failures'}`);
}

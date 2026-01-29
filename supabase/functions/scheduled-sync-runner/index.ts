import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface SyncSchedule {
  id: string;
  sync_type: string;
  interval_minutes: number;
  is_enabled: boolean;
  failure_count: number;
}

interface SyncResult {
  success: boolean;
  syncedCount?: number;
  error?: string;
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);

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

    for (const sync of dueSyncs as SyncSchedule[]) {
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
        result = await runSync(supabase, sync.sync_type, supabaseUrl, supabaseKey);
      } catch (error) {
        result = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }

      // Calculate next run time
      const nextRunAt = new Date();
      nextRunAt.setMinutes(nextRunAt.getMinutes() + sync.interval_minutes);

      // Update sync schedule with result
      const newFailureCount = result.success ? 0 : sync.failure_count + 1;
      
      await supabase
        .from('sync_schedule')
        .update({
          last_run_at: new Date().toISOString(),
          next_run_at: nextRunAt.toISOString(),
          last_status: result.success ? 'success' : 'failed',
          last_error: result.error || null,
          records_synced: result.syncedCount || 0,
          failure_count: newFailureCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sync.id);

      // Create admin alert if failure count reaches threshold
      if (newFailureCount >= 3) {
        await createAdminAlert(supabase, sync.sync_type, result.error || 'Unknown error');
      }

      results.push({ syncType: sync.sync_type, result });
    }

    const successCount = results.filter(r => r.result.success).length;
    const failedCount = results.filter(r => !r.result.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        syncsRun: results.length,
        successCount,
        failedCount,
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
  // Map sync types to edge functions
  const syncFunctionMap: Record<string, string> = {
    'arketa_members': 'sync-members',
    'arketa_classes': 'sync-arketa-classes',
    'arketa_reservations': 'sync-arketa-reservations',
    'arketa_payments': 'sync-arketa-payments',
    'arketa_instructors': 'sync-arketa-instructors',
    'sling_users': 'sling-api',
    'sling_shifts': 'sling-api',
  };

  const functionName = syncFunctionMap[syncType];
  if (!functionName) {
    return { success: false, error: `Unknown sync type: ${syncType}` };
  }

  // Prepare request body based on sync type
  let requestBody = {};
  if (syncType === 'sling_users') {
    requestBody = { action: 'sync-users' };
  } else if (syncType === 'sling_shifts') {
    requestBody = { action: 'sync-shifts' };
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
  errorMessage: string
) {
  // Check if a recent alert for this sync already exists (within 24 hours)
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const { data: existingAlerts } = await supabase
    .from('announcements')
    .select('id')
    .eq('title', `Sync Failed: ${syncType}`)
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

  await supabase
    .from('announcements')
    .insert({
      title: `Sync Failed: ${syncType}`,
      content: `The ${syncType} sync has failed 3 or more times. Last error: ${errorMessage}. Please check the sync configuration and external API status.`,
      created_by: adminUser.user_id,
      target_roles: ['admin', 'manager'],
    });

  console.log(`[Scheduled Sync Runner] Created admin alert for ${syncType} failures`);
}

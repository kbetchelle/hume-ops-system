/**
 * UNIFIED BACKFILL SYNC CONFIGURATION REFERENCE
 * 
 * Each API endpoint uses a 400-record batch size with cursor-based pagination.
 * The sync cycle for each batch is: Fetch → Stage → Transform → Upsert → Clear
 * 
 * | Data Type    | API Endpoint     | Staging Table                | Target Table         | Unique Key    |
 * |--------------|------------------|------------------------------|----------------------|---------------|
 * | clients      | /clients         | arketa_clients_staging       | arketa_clients       | external_id   |
 * | classes      | /classes         | arketa_classes_staging       | arketa_classes       | external_id   |
 * | reservations | /reservations    | arketa_reservations_staging  | arketa_reservations  | external_id   |
 * | payments     | /purchases       | arketa_payments_staging      | arketa_payments      | external_id   |
 * | instructors  | /staff           | arketa_instructors_staging   | arketa_instructors   | external_id   |
 * | shifts       | /reports/roster  | sling_shifts_staging         | daily_schedules      | id            |
 * 
 * Unique Keys:
 * - Arketa data uses external_id (text) which maps to the API's id field
 * - Sling shifts use the auto-generated id from daily_schedules
 * 
 * The job remains in "Active Backfills" until:
 * - API returns fewer than 400 records (no more data)
 * - User manually pauses or cancels
 * - An unrecoverable error occurs
 * 
 * Note: clients and instructors endpoints do NOT support date filtering.
 * They fetch all records using cursor-based pagination only.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { getArketaToken, getArketaHeaders, ARKETA_URLS } from "../_shared/arketaAuth.ts";
import { fetchWithRetry } from "../_shared/retry.ts";
import { createSyncLogger } from "../_shared/logger.ts";

const BATCH_SIZE = 400;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Configuration mapping for all sync types
interface BackfillConfig {
  endpointPath: string;
  stagingTable: string;
  targetTable: string;
  uniqueKey: string;
  transformFn: (raw: Record<string, unknown>) => Record<string, unknown>;
  stagingIdField: string;
}

const BACKFILL_CONFIGS: Record<string, BackfillConfig> = {
  'arketa-clients': {
    endpointPath: '/clients',
    stagingTable: 'arketa_clients_staging',
    targetTable: 'arketa_clients',
    uniqueKey: 'external_id',
    transformFn: transformClient,
    stagingIdField: 'arketa_client_id'
  },
  'arketa-classes': {
    endpointPath: '/classes',
    stagingTable: 'arketa_classes_staging',
    targetTable: 'arketa_classes',
    uniqueKey: 'external_id',
    transformFn: transformClass,
    stagingIdField: 'arketa_class_id'
  },
  'arketa-reservations': {
    endpointPath: '/reservations',
    stagingTable: 'arketa_reservations_staging',
    targetTable: 'arketa_reservations',
    uniqueKey: 'external_id',
    transformFn: transformReservation,
    stagingIdField: 'arketa_reservation_id'
  },
  'arketa-payments': {
    endpointPath: '/purchases',
    stagingTable: 'arketa_payments_staging',
    targetTable: 'arketa_payments',
    uniqueKey: 'external_id',
    transformFn: transformPayment,
    stagingIdField: 'arketa_payment_id'
  },
  'arketa-instructors': {
    endpointPath: '/staff',
    stagingTable: 'arketa_instructors_staging',
    targetTable: 'arketa_instructors',
    uniqueKey: 'external_id',
    transformFn: transformInstructor,
    stagingIdField: 'arketa_instructor_id'
  },
  'sling-shifts': {
    endpointPath: '/reports/roster',
    stagingTable: 'sling_shifts_staging',
    targetTable: 'daily_schedules',
    uniqueKey: 'id',
    transformFn: transformShift,
    stagingIdField: 'sling_shift_id'
  }
};

interface SyncCycleResult {
  recordsFetched: number;
  recordsUpserted: number;
  nextCursor: string | null;
  hasMore: boolean;
  phase: string;
}

interface BackfillJob {
  id: string;
  api_source: string;
  data_type: string;
  start_date: string;
  end_date: string;
  status: string;
  batch_cursor: string | null;
  records_processed: number;
  total_batches_completed: number;
  started_at: string | null;
}

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const logger = createSyncLogger("unified-backfill");

  try {
    const { job_id, action = 'continue' } = await req.json();

    if (!job_id) {
      throw new Error("job_id is required");
    }

    // Fetch the job
    const { data: job, error: jobError } = await supabase
      .from('backfill_jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      throw new Error(`Job not found: ${job_id}`);
    }

    // Handle actions
    if (action === 'pause') {
      await updateJobStatus(supabase, job_id, 'paused', { sync_phase: 'paused' });
      return jsonResponse({ success: true, message: 'Job paused' }, corsHeaders);
    }

    if (action === 'cancel') {
      await updateJobStatus(supabase, job_id, 'cancelled', { sync_phase: 'cancelled' });
      return jsonResponse({ success: true, message: 'Job cancelled' }, corsHeaders);
    }

    // Get configuration for this job type
    const configKey = `${job.api_source}-${job.data_type}`;
    const config = BACKFILL_CONFIGS[configKey];
    
    if (!config) {
      throw new Error(`No configuration found for ${configKey}`);
    }

    // Update job to running if not already
    if (job.status !== 'running') {
      await updateJobStatus(supabase, job_id, 'running', { 
        sync_phase: 'starting',
        started_at: job.started_at || new Date().toISOString()
      });
    }

    // Generate batch ID for this cycle
    const batchId = crypto.randomUUID();
    
    // Execute the complete sync cycle
    const result = await executeSyncCycle(
      supabase,
      job as BackfillJob,
      config,
      batchId,
      logger
    );

    // Update job with results
    const updateData: Record<string, unknown> = {
      records_processed: job.records_processed + result.recordsUpserted,
      batch_cursor: result.nextCursor,
      sync_phase: result.phase,
      last_batch_synced_at: new Date().toISOString(),
      total_batches_completed: job.total_batches_completed + 1,
      records_in_current_batch: result.recordsFetched
    };

    if (!result.hasMore) {
      // No more records - job is complete
      updateData.status = 'completed';
      updateData.completed_at = new Date().toISOString();
      updateData.no_more_records = true;
      updateData.sync_phase = 'complete';
    } else {
      // Schedule next batch immediately (or with small delay for rate limiting)
      updateData.retry_scheduled_at = new Date(Date.now() + 1000).toISOString();
    }

    await supabase
      .from('backfill_jobs')
      .update(updateData)
      .eq('id', job_id);

    return jsonResponse({
      success: true,
      result: {
        recordsFetched: result.recordsFetched,
        recordsUpserted: result.recordsUpserted,
        hasMore: result.hasMore,
        totalProcessed: job.records_processed + result.recordsUpserted,
        phase: result.phase
      }
    }, corsHeaders);

  } catch (error) {
    logger.error("Sync cycle failed", error);
    return jsonResponse({ success: false, error: (error as Error).message }, corsHeaders, 500);
  }
});

async function executeSyncCycle(
  supabase: SupabaseClient,
  job: BackfillJob,
  config: BackfillConfig,
  batchId: string,
  logger: ReturnType<typeof createSyncLogger>
): Promise<SyncCycleResult> {
  
  // Phase 1: Fetch from API
  await updateJobPhase(supabase, job.id, 'fetching_api');
  const fetchResult = await fetchFromApi(job, config, logger);
  
  if (fetchResult.records.length === 0) {
    return {
      recordsFetched: 0,
      recordsUpserted: 0,
      nextCursor: null,
      hasMore: false,
      phase: 'complete'
    };
  }

  // Phase 2: Insert to staging
  await updateJobPhase(supabase, job.id, 'staging');
  await insertToStaging(supabase, config.stagingTable, fetchResult.records, batchId, config.stagingIdField);

  // Phase 3: Transform records
  await updateJobPhase(supabase, job.id, 'transforming');
  const transformedRecords = fetchResult.records.map(config.transformFn);

  // Phase 4: Upsert to target
  await updateJobPhase(supabase, job.id, 'upserting');
  await upsertToTarget(supabase, config.targetTable, transformedRecords, config.uniqueKey);

  // Phase 5: Clear staging
  await updateJobPhase(supabase, job.id, 'clearing_staging');
  await clearStaging(supabase, config.stagingTable, batchId);

  return {
    recordsFetched: fetchResult.records.length,
    recordsUpserted: transformedRecords.length,
    nextCursor: fetchResult.nextCursor,
    hasMore: fetchResult.hasMore,
    phase: 'batch_complete'
  };
}

async function fetchFromApi(
  job: BackfillJob, 
  config: BackfillConfig, 
  logger: ReturnType<typeof createSyncLogger>
): Promise<{ records: Record<string, unknown>[]; nextCursor: string | null; hasMore: boolean }> {
  const token = await getArketaToken(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const headers = getArketaHeaders(token);
  
  const partnerId = Deno.env.get("ARKETA_PARTNER_ID");
  let url = `${ARKETA_URLS.prod}/${partnerId}${config.endpointPath}?limit=${BATCH_SIZE}`;
  
  // Add date range if applicable (not for clients or staff/instructors endpoints)
  const skipDateFiltering = ['/clients', '/staff'].includes(config.endpointPath);
  if (job.start_date && job.end_date && !skipDateFiltering) {
    url += `&start_date=${job.start_date}&end_date=${job.end_date}`;
  }
  
  // Add cursor if resuming
  if (job.batch_cursor) {
    url += `&cursor=${job.batch_cursor}`;
  }

  logger.info(`Fetching from: ${url}`);
  
  const fetchResult = await fetchWithRetry(url, { headers });
  const data = await fetchResult.response.json();
  
  // Handle different response formats from various endpoints
  const records = data.data || data.clients || data.classes || data.reservations || data.payments || data.staff || [];
  const nextCursor = data.cursor || data.next_cursor || data.pagination?.cursor || null;
  const hasMore = records.length === BATCH_SIZE || !!nextCursor;

  logger.info(`Fetched ${records.length} records, hasMore: ${hasMore}, nextCursor: ${nextCursor ? 'present' : 'none'}`);

  return { records, nextCursor, hasMore };
}

async function insertToStaging(
  supabase: SupabaseClient, 
  table: string, 
  records: Record<string, unknown>[], 
  batchId: string, 
  idField: string
): Promise<void> {
  const stagingRecords = records.map(record => ({
    sync_batch_id: batchId,
    [idField]: String(record.id),
    raw_data: record,
    staged_at: new Date().toISOString()
  }));

  const { error } = await supabase.from(table).insert(stagingRecords);
  if (error) throw new Error(`Staging insert failed: ${error.message}`);
}

async function upsertToTarget(
  supabase: SupabaseClient, 
  table: string, 
  records: Record<string, unknown>[], 
  uniqueKey: string
): Promise<void> {
  const { error } = await supabase
    .from(table)
    .upsert(records, { onConflict: uniqueKey });
  
  if (error) throw new Error(`Target upsert failed: ${error.message}`);
}

async function clearStaging(
  supabase: SupabaseClient, 
  table: string, 
  batchId: string
): Promise<void> {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('sync_batch_id', batchId);
  
  if (error) throw new Error(`Staging clear failed: ${error.message}`);
}

async function updateJobPhase(
  supabase: SupabaseClient, 
  jobId: string, 
  phase: string
): Promise<void> {
  await supabase
    .from('backfill_jobs')
    .update({ sync_phase: phase })
    .eq('id', jobId);
}

async function updateJobStatus(
  supabase: SupabaseClient, 
  jobId: string, 
  status: string, 
  extra: Record<string, unknown> = {}
): Promise<void> {
  await supabase
    .from('backfill_jobs')
    .update({ status, ...extra })
    .eq('id', jobId);
}

function jsonResponse(data: unknown, corsHeaders: Record<string, string>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

// ============================================================
// Transform functions for each data type
// ============================================================

function transformClient(raw: Record<string, unknown>): Record<string, unknown> {
  const firstName = raw.firstName as string || '';
  const lastName = raw.lastName as string || '';
  const name = raw.name as string || `${firstName} ${lastName}`.trim() || null;
  
  return {
    external_id: String(raw.id),
    client_name: name,
    client_email: raw.email,
    client_phone: raw.phone,
    client_tags: (raw.tags as string[]) || [],
    custom_fields: raw.customFields || {},
    referrer: raw.referrer,
    email_mkt_opt_in: raw.emailOptIn || false,
    sms_mkt_opt_in: raw.smsOptIn || false,
    date_of_birth: raw.dateOfBirth,
    lifecycle_stage: raw.lifecycleStage,
    raw_data: raw,
    last_synced_at: new Date().toISOString()
  };
}

function transformClass(raw: Record<string, unknown>): Record<string, unknown> {
  const instructor = raw.instructor as Record<string, unknown> | undefined;
  
  return {
    external_id: String(raw.id),
    name: raw.name,
    start_time: raw.startTime,
    duration_minutes: raw.duration || null,
    instructor_name: instructor?.name || raw.instructorName,
    room_name: raw.location || raw.room,
    capacity: raw.capacity,
    booked_count: raw.enrolled || raw.bookedCount || 0,
    waitlist_count: raw.waitlistCount || 0,
    is_cancelled: raw.cancelled || raw.isCancelled || false,
    status: raw.status,
    raw_data: raw,
    synced_at: new Date().toISOString()
  };
}

function transformReservation(raw: Record<string, unknown>): Record<string, unknown> {
  return {
    external_id: String(raw.id),
    client_id: raw.clientId,
    class_id: raw.classId,
    client_name: raw.clientName,
    client_email: raw.clientEmail,
    status: raw.status,
    checked_in: raw.checkedIn || false,
    checked_in_at: raw.checkedInAt,
    raw_data: raw,
    synced_at: new Date().toISOString()
  };
}

function transformPayment(raw: Record<string, unknown>): Record<string, unknown> {
  return {
    external_id: String(raw.id),
    client_id: raw.clientId,
    amount: raw.amount,
    payment_type: raw.type || raw.paymentType,
    status: raw.status,
    notes: raw.description || raw.notes,
    payment_date: raw.createdAt || raw.paymentDate,
    raw_data: raw,
    synced_at: new Date().toISOString()
  };
}

function transformInstructor(raw: Record<string, unknown>): Record<string, unknown> {
  const name = raw.name as string | undefined;
  
  return {
    external_id: String(raw.id),
    first_name: raw.firstName || name?.split(' ')[0],
    last_name: raw.lastName || name?.split(' ').slice(1).join(' '),
    email: raw.email,
    phone: raw.phone,
    is_active: raw.active !== false,
    raw_data: raw,
    synced_at: new Date().toISOString()
  };
}

function transformShift(raw: Record<string, unknown>): Record<string, unknown> {
  const user = raw.user as Record<string, unknown> | undefined;
  const position = raw.position as Record<string, unknown> | string | undefined;
  const location = raw.location as Record<string, unknown> | string | undefined;
  
  // Parse shift date from start time
  const startTime = (raw.start || raw.dtstart) as string;
  const endTime = (raw.end || raw.dtend) as string;
  const shiftStart = new Date(startTime);
  const shiftEnd = new Date(endTime);
  
  return {
    sling_user_id: raw.userId || user?.id,
    staff_name: raw.userName || user?.name,
    position: typeof position === 'object' ? position?.name : position,
    location: typeof location === 'object' ? location?.name : location,
    schedule_date: shiftStart.toISOString().split('T')[0],
    shift_start: shiftStart.toISOString(),
    shift_end: shiftEnd.toISOString(),
    last_synced_at: new Date().toISOString()
  };
}

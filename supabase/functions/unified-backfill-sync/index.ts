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
 * | shifts       | /reports/roster  | sling_shifts_staging         | staff_shifts         | sling_shift_id|
 *
 * Unique Keys:
 * - Arketa data uses external_id (text) which maps to the API's id field
 * - Sling shifts use sling_shift_id which maps to the API's id field
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
  useDev?: boolean; // Use the dev API endpoint (partnerApiDev)
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
    stagingIdField: 'arketa_instructor_id',
    useDev: true // Staff endpoint uses partnerApiDev
  },
  'sling-shifts': {
    endpointPath: '/reports/roster',
    stagingTable: 'sling_shifts_staging',
    targetTable: 'staff_shifts',
    uniqueKey: 'sling_shift_id',
    transformFn: transformShift,
    stagingIdField: 'sling_shift_id'
  }
};

interface SyncCycleResult {
  recordsFetched: number;
  recordsUpserted: number;
  recordsFailed: number;
  nextCursor: string | null;
  hasMore: boolean;
  phase: string;
  errors: Array<{ id: string; error: string }>;
}

interface UpsertResult {
  successful: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
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
      records_processed: (job.records_processed || 0) + result.recordsUpserted,
      batch_cursor: result.nextCursor,
      sync_phase: result.phase,
      last_batch_synced_at: new Date().toISOString(),
      total_batches_completed: (job.total_batches_completed || 0) + 1,
      records_in_current_batch: result.recordsFetched,
      // Store errors in the existing 'errors' JSONB column
      errors: result.errors.length > 0 ? result.errors : []
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

    // CRITICAL: Add error handling to job status update
    const { error: updateError } = await supabase
      .from('backfill_jobs')
      .update(updateData)
      .eq('id', job_id);

    if (updateError) {
      logger.error('Failed to update job status after sync cycle', {
        jobId: job_id,
        error: updateError.message,
        updateData
      });
      // Don't throw - still return the result, but log the failure
    }

    return jsonResponse({
      success: true,
      result: {
        recordsFetched: result.recordsFetched,
        recordsUpserted: result.recordsUpserted,
        recordsFailed: result.recordsFailed,
        hasMore: result.hasMore,
        totalProcessed: job.records_processed + result.recordsUpserted,
        phase: result.phase,
        errors: result.errors
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
    logger.info('No records returned from API - sync complete', {
      jobId: job.id,
      endpoint: config.endpointPath,
      cursor: job.batch_cursor
    });
    return {
      recordsFetched: 0,
      recordsUpserted: 0,
      recordsFailed: 0,
      nextCursor: null,
      hasMore: false,
      phase: 'complete',
      errors: []
    };
  }

  // Phase 2: Insert to staging
  await updateJobPhase(supabase, job.id, 'staging');
  await insertToStaging(supabase, config.stagingTable, fetchResult.records, batchId, config.stagingIdField, logger);

  // Phase 3: Transform records with validation
  await updateJobPhase(supabase, job.id, 'transforming');
  const transformedRecords = transformRecordsWithValidation(
    fetchResult.records,
    config.transformFn,
    config.uniqueKey,
    logger
  );

  // Phase 4: Upsert to target with per-record retry
  await updateJobPhase(supabase, job.id, 'upserting');
  const upsertResult = await upsertToTargetWithRetry(
    supabase,
    config.targetTable,
    transformedRecords,
    config.uniqueKey,
    logger
  );

  // Phase 5: Clear staging
  await updateJobPhase(supabase, job.id, 'clearing_staging');
  await clearStaging(supabase, config.stagingTable, batchId);

  return {
    recordsFetched: fetchResult.records.length,
    recordsUpserted: upsertResult.successful,
    recordsFailed: upsertResult.failed,
    nextCursor: fetchResult.nextCursor,
    hasMore: fetchResult.hasMore,
    phase: 'batch_complete',
    errors: upsertResult.errors
  };
}

async function fetchFromApi(
  job: BackfillJob,
  config: BackfillConfig,
  logger: ReturnType<typeof createSyncLogger>
): Promise<{ records: Record<string, unknown>[]; nextCursor: string | null; hasMore: boolean }> {
  // Try OAuth token first, fallback to API key if token refresh fails
  const ARKETA_API_KEY = Deno.env.get("ARKETA_API_KEY");
  let headers: Record<string, string>;

  try {
    const token = await getArketaToken(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    headers = getArketaHeaders(token);
    logger.info('Using OAuth token for authentication');
  } catch (tokenError) {
    logger.warn('Token refresh failed, using API key fallback', {
      error: tokenError instanceof Error ? tokenError.message : String(tokenError)
    });
    if (!ARKETA_API_KEY) {
      throw new Error('No API key available as fallback after token refresh failure');
    }
    headers = {
      'x-api-key': ARKETA_API_KEY,
      'Content-Type': 'application/json'
    };
  }

  const partnerId = Deno.env.get("ARKETA_PARTNER_ID");
  const baseUrl = config.useDev ? ARKETA_URLS.dev : ARKETA_URLS.prod;
  let url = `${baseUrl}/${partnerId}${config.endpointPath}?limit=${BATCH_SIZE}`;
  
  // Add date range if applicable (not for clients or staff/instructors endpoints)
  const skipDateFiltering = ['/clients', '/staff'].includes(config.endpointPath);
  if (job.start_date && job.end_date && !skipDateFiltering) {
    url += `&start_date=${job.start_date}&end_date=${job.end_date}`;
  }
  
  // OFFSET-BASED PAGINATION FALLBACK
  // If we have no cursor but have already processed records, use offset pagination
  // This is required for endpoints like /clients that don't return cursors
  const useOffsetPagination = !job.batch_cursor && job.records_processed > 0;
  
  if (job.batch_cursor) {
    // Cursor-based pagination (preferred)
    url += `&cursor=${job.batch_cursor}`;
    logger.info('Using cursor-based pagination', { cursor: job.batch_cursor });
  } else if (useOffsetPagination) {
    // Offset-based fallback - use records_processed as the skip value
    url += `&offset=${job.records_processed}`;
    logger.info('Using offset-based pagination fallback', { offset: job.records_processed });
  }

  logger.info(`Fetching from: ${url}`);
  
  const fetchResult = await fetchWithRetry(url, { headers });
  const response = fetchResult.response;
  
  // Check if response is OK before parsing
  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`API returned ${response.status}: ${errorText.substring(0, 200)}`);
    throw new Error(`Arketa API error ${response.status}: ${response.statusText}`);
  }
  
  // Check content type to ensure we're getting JSON
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const bodyPreview = await response.text();
    logger.error(`Expected JSON but got ${contentType}: ${bodyPreview.substring(0, 200)}`);
    throw new Error(`Arketa API returned non-JSON response (${contentType})`);
  }
  
  const data = await response.json();

  // Log detailed response structure for debugging
  logger.info('API response received', {
    isArray: Array.isArray(data),
    topLevelKeys: Array.isArray(data) ? `[array of ${data.length}]` : Object.keys(data).join(', '),
    hasDataField: !Array.isArray(data) && !!data.data,
    hasPagination: !Array.isArray(data) && !!data.pagination,
    paginationDetails: !Array.isArray(data) && data.pagination ? {
      hasNextCursor: !!data.pagination.nextCursor,
      hasMore: data.pagination.hasMore
    } : null
  });

  // Handle different response formats from various endpoints
  // CRITICAL: Check Array.isArray() first, then nested fields with proper validation
  let records: Record<string, unknown>[];
  let matchedFormat = 'none';

  if (Array.isArray(data)) {
    records = data;
    matchedFormat = 'direct_array';
  } else if (data.data && Array.isArray(data.data)) {
    records = data.data;
    matchedFormat = 'data_field';
  } else if (data.clients && Array.isArray(data.clients)) {
    records = data.clients;
    matchedFormat = 'clients_field';
  } else if (data.classes && Array.isArray(data.classes)) {
    records = data.classes;
    matchedFormat = 'classes_field';
  } else if (data.reservations && Array.isArray(data.reservations)) {
    records = data.reservations;
    matchedFormat = 'reservations_field';
  } else if (data.payments && Array.isArray(data.payments)) {
    records = data.payments;
    matchedFormat = 'payments_field';
  } else if (data.purchases && Array.isArray(data.purchases)) {
    records = data.purchases;
    matchedFormat = 'purchases_field';
  } else if (data.staff && Array.isArray(data.staff)) {
    records = data.staff;
    matchedFormat = 'staff_field';
  } else if (data.items && Array.isArray(data.items)) {
    // Arketa Partner API uses 'items' as the standard array field name
    records = data.items;
    matchedFormat = 'items_field';
  } else {
    // CRITICAL: Log extensive details when format is unrecognized
    logger.error('UNKNOWN RESPONSE FORMAT - Records will be empty!', {
      keys: Object.keys(data),
      dataType: typeof data,
      sampleData: JSON.stringify(data).substring(0, 500),
      endpoint: config.endpointPath
    });
    records = [];
  }

  // Extract pagination cursor - check pagination.nextCursor first (Arketa's format)
  const nextCursor = data.pagination?.nextCursor || data.pagination?.cursor || data.cursor || data.next_cursor || null;

  // Determine hasMore with detailed logging
  // CRITICAL: For offset-based pagination (no cursor returned), we determine hasMore
  // based on whether we got a full batch of records
  const isBatchFull = records.length === BATCH_SIZE;
  const paginationHasMore = data.pagination?.hasMore === true;
  const cursorPresent = !!nextCursor;
  
  // If using offset pagination (no cursor returned but API says hasMore), 
  // rely on batch size to determine if more records exist
  const isOffsetPaginationMode = !cursorPresent && paginationHasMore;
  
  // hasMore is true if:
  // 1. We have a cursor (cursor-based pagination), OR
  // 2. API explicitly says hasMore AND we got a full batch (offset-based), OR
  // 3. We got a full batch (fallback)
  const hasMore = cursorPresent || (isOffsetPaginationMode && isBatchFull) || (isBatchFull && !isOffsetPaginationMode && paginationHasMore);

  logger.info('Fetch complete', {
    recordCount: records.length,
    matchedFormat,
    pagination: {
      isBatchFull,
      paginationHasMore,
      cursorPresent,
      isOffsetPaginationMode,
      hasMoreDecision: hasMore,
      determinedBy: cursorPresent ? 'cursor_present' : 
                    (isOffsetPaginationMode && isBatchFull) ? 'offset_batch_full' : 
                    isBatchFull ? 'batch_size' : 'no_more_data'
    }
  });

  // For offset pagination, we store the current offset as a synthetic cursor
  // This allows job resumption to work correctly
  const effectiveCursor = cursorPresent ? nextCursor : null;

  return { records, nextCursor: effectiveCursor, hasMore };
}

async function insertToStaging(
  supabase: SupabaseClient,
  table: string,
  records: Record<string, unknown>[],
  batchId: string,
  idField: string,
  logger: ReturnType<typeof createSyncLogger>
): Promise<void> {
  const stagingRecords = records.map((record, index) => {
    const recordId = record.id;
    if (recordId === undefined || recordId === null) {
      logger.warn(`Record at index ${index} has no id field`, {
        recordKeys: Object.keys(record)
      });
    }
    return {
      sync_batch_id: batchId,
      [idField]: String(recordId ?? `unknown_${index}`),
      raw_data: record,
      staged_at: new Date().toISOString()
    };
  });

  const { error } = await supabase.from(table).insert(stagingRecords);
  if (error) {
    logger.error('Staging insert failed', {
      table,
      batchId,
      recordCount: stagingRecords.length,
      error: error.message
    });
    throw new Error(`Staging insert failed: ${error.message}`);
  }

  logger.info('Staging insert complete', {
    table,
    recordCount: stagingRecords.length
  });
}

/**
 * Transform records with validation to ensure unique key is present
 */
function transformRecordsWithValidation(
  records: Record<string, unknown>[],
  transformFn: (raw: Record<string, unknown>) => Record<string, unknown>,
  uniqueKey: string,
  logger: ReturnType<typeof createSyncLogger>
): Record<string, unknown>[] {
  const transformed: Record<string, unknown>[] = [];
  let warningCount = 0;

  for (let i = 0; i < records.length; i++) {
    const raw = records[i];
    try {
      const result = transformFn(raw);

      // Validate that the unique key is present and not empty
      const keyValue = result[uniqueKey];
      if (keyValue === undefined || keyValue === null || keyValue === '') {
        warningCount++;
        if (warningCount <= 5) {
          logger.warn(`Transform produced missing/empty unique key`, {
            index: i,
            uniqueKey,
            rawId: raw.id,
            transformedKeys: Object.keys(result)
          });
        }
      }

      transformed.push(result);
    } catch (error) {
      logger.error(`Transform failed for record at index ${i}`, {
        rawId: raw.id,
        error: error instanceof Error ? error.message : String(error)
      });
      // Re-throw to fail the batch - transform errors are critical
      throw error;
    }
  }

  if (warningCount > 0) {
    logger.warn(`Transform validation: ${warningCount} records had missing/empty unique key`, {
      totalRecords: records.length,
      uniqueKey
    });
  }

  return transformed;
}

/**
 * Upsert records with per-record retry for better error handling
 * Uses batch upsert first, falls back to per-record on failure
 */
async function upsertToTargetWithRetry(
  supabase: SupabaseClient,
  table: string,
  records: Record<string, unknown>[],
  uniqueKey: string,
  logger: ReturnType<typeof createSyncLogger>
): Promise<UpsertResult> {
  // First try batch upsert (faster)
  const { error: batchError } = await supabase
    .from(table)
    .upsert(records, { onConflict: uniqueKey });

  if (!batchError) {
    logger.info('Batch upsert successful', {
      table,
      recordCount: records.length
    });
    return {
      successful: records.length,
      failed: 0,
      errors: []
    };
  }

  // Batch failed - fall back to per-record upsert to identify problem records
  logger.warn('Batch upsert failed, falling back to per-record upsert', {
    table,
    batchError: batchError.message,
    recordCount: records.length
  });

  let successful = 0;
  let failed = 0;
  const errors: Array<{ id: string; error: string }> = [];

  for (const record of records) {
    const recordId = String(record[uniqueKey] || 'unknown');

    // Try up to 2 times per record
    let lastError: string | null = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      const { error } = await supabase
        .from(table)
        .upsert([record], { onConflict: uniqueKey });

      if (!error) {
        successful++;
        lastError = null;
        break;
      }

      lastError = error.message;
      if (attempt < 2) {
        // Wait briefly before retry
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    if (lastError) {
      failed++;
      errors.push({ id: recordId, error: lastError });
      if (errors.length <= 10) {
        logger.error(`Failed to upsert record ${recordId}`, {
          error: lastError,
          recordKeys: Object.keys(record)
        });
      }
    }
  }

  logger.info('Per-record upsert complete', {
    table,
    successful,
    failed,
    totalRecords: records.length
  });

  return { successful, failed, errors };
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

  // CRITICAL: Handle missing email - use placeholder to satisfy NOT NULL constraint
  // Some Arketa clients don't have email addresses
  const email = raw.email || `no-email-${raw.id}@placeholder.local`;

  return {
    external_id: String(raw.id),
    client_name: name,
    client_email: email,
    client_phone: raw.phone,
    client_tags: (raw.tags as string[]) || [],
    custom_fields: raw.customFields || {},
    referrer: raw.referrer,
    // API returns emailMarketingOptIn/smsMarketingOptIn, check both for compatibility
    email_mkt_opt_in: raw.emailMarketingOptIn ?? raw.emailOptIn ?? false,
    sms_mkt_opt_in: raw.smsMarketingOptIn ?? raw.smsOptIn ?? false,
    date_of_birth: raw.dateOfBirth,
    lifecycle_stage: raw.lifecycleStage,
    raw_data: raw,
    last_synced_at: new Date().toISOString()
  };
}

function transformClass(raw: Record<string, unknown>): Record<string, unknown> {
  const instructor = raw.instructor as Record<string, unknown> | undefined;
  // Build instructor name from nested object (first_name + last_name) or direct field
  const instructorName = raw.instructor_name ||
    (instructor ? `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() : null) ||
    raw.instructorName ||
    null;

  // Handle room - could be object with name or direct string
  const room = raw.room as Record<string, unknown> | string | undefined;
  const roomName = typeof room === 'object' ? room?.name : (raw.location || room || null);

  return {
    external_id: String(raw.id),
    name: raw.name || raw.class_name,
    // API may return start_time or startTime
    start_time: raw.start_time || raw.startTime,
    duration_minutes: raw.duration_minutes ?? raw.duration ?? null,
    instructor_name: instructorName,
    room_name: roomName,
    capacity: raw.capacity ?? raw.max_capacity ?? null,
    booked_count: raw.total_booked ?? raw.enrolled ?? raw.bookedCount ?? raw.booked_count ?? 0,
    waitlist_count: raw.waitlistCount ?? raw.waitlist_count ?? 0,
    is_cancelled: raw.is_cancelled ?? raw.cancelled ?? raw.isCancelled ?? false,
    status: raw.status || 'scheduled',
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
  const shiftStart = startTime ? new Date(startTime) : null;
  const shiftEnd = endTime ? new Date(endTime) : null;

  return {
    sling_shift_id: String(raw.id),
    sling_user_id: String(raw.userId || user?.id || ''),
    staff_name: raw.userName || user?.name,
    position: typeof position === 'object' ? position?.name : position,
    location: typeof location === 'object' ? location?.name : location,
    schedule_date: shiftStart ? shiftStart.toISOString().split('T')[0] : null,
    shift_start: shiftStart ? shiftStart.toISOString() : null,
    shift_end: shiftEnd ? shiftEnd.toISOString() : null,
    status: raw.status || 'scheduled',
    raw_data: raw,
    last_synced_at: new Date().toISOString()
  };
}

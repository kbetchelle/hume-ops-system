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

const BATCH_SIZE = 100; // Matching working arketa-gym-flow implementation
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
  // Endpoint-specific pagination configuration
  paginationStyle: 'start_after' | 'cursor' | 'page' | 'skip'; // How to pass cursor to API
  paginationCursorField: string; // Field name in response.pagination to extract next cursor
  primaryIdField: string; // Field name in raw record to use as ID (e.g., 'client_id' vs 'id')
  responseDataPaths: string[]; // Ordered list of field names to try for extracting records array
  supportsLimit?: boolean; // Whether API supports limit param (default true)
}

const BACKFILL_CONFIGS: Record<string, BackfillConfig> = {
  'arketa-clients': {
    endpointPath: '/clients',
    stagingTable: 'arketa_clients_staging',
    targetTable: 'arketa_clients',
    uniqueKey: 'external_id',
    transformFn: transformClient,
    stagingIdField: 'arketa_client_id',
    useDev: true, // CRITICAL: Must use partnerApiDev endpoint (verified from working arketa-gym-flow)
    paginationStyle: 'start_after', // Uses start_after param, NOT cursor
    paginationCursorField: 'nextStartAfterId', // Response uses nextStartAfterId, NOT nextCursor
    primaryIdField: 'client_id', // API returns client_id as primary ID
    responseDataPaths: ['items', 'data', 'clients'], // items is primary in working implementation
    supportsLimit: true, // API supports limit parameter (uses 100 in working impl)
  },
  'arketa-classes': {
    endpointPath: '/classes',
    stagingTable: 'arketa_classes_staging',
    targetTable: 'arketa_classes',
    uniqueKey: 'external_id',
    transformFn: transformClass,
    stagingIdField: 'arketa_class_id',
    useDev: false, // Uses partnerApi (prod)
    paginationStyle: 'cursor', // Verified from sync-arketa-classes
    paginationCursorField: 'nextCursor',
    primaryIdField: 'id',
    responseDataPaths: ['items', 'data', 'classes'], // items first for consistency
    supportsLimit: true,
  },
  'arketa-reservations': {
    endpointPath: '/reservations',
    stagingTable: 'arketa_reservations_staging',
    targetTable: 'arketa_reservations',
    uniqueKey: 'external_id',
    transformFn: transformReservation,
    stagingIdField: 'arketa_reservation_id',
    useDev: false, // Uses partnerApi (prod)
    paginationStyle: 'cursor', // Verified from sync-arketa-reservations
    paginationCursorField: 'nextCursor',
    primaryIdField: 'id',
    responseDataPaths: ['items', 'data', 'reservations', 'bookings'], // items first
    supportsLimit: true,
  },
  'arketa-payments': {
    endpointPath: '/purchases',
    stagingTable: 'arketa_payments_staging',
    targetTable: 'arketa_payments',
    uniqueKey: 'external_id',
    transformFn: transformPayment,
    stagingIdField: 'arketa_payment_id',
    useDev: false, // Uses partnerApi (prod)
    paginationStyle: 'cursor',
    paginationCursorField: 'nextCursor',
    primaryIdField: 'id',
    responseDataPaths: ['items', 'data', 'purchases', 'payments'], // items first
    supportsLimit: true,
  },
  'arketa-instructors': {
    endpointPath: '/staff',
    stagingTable: 'arketa_instructors_staging',
    targetTable: 'arketa_instructors',
    uniqueKey: 'external_id',
    transformFn: transformInstructor,
    stagingIdField: 'arketa_instructor_id',
    useDev: true, // Uses partnerApiDev - verified from sync-arketa-instructors
    paginationStyle: 'cursor', // Note: API returns direct array, no pagination
    paginationCursorField: 'nextCursor',
    primaryIdField: 'id',
    responseDataPaths: ['items', 'data', 'staff'], // items first; API may return direct array
    supportsLimit: false, // Staff API returns all records, no limit support
  },
  'sling-shifts': {
    endpointPath: '/reports/roster',
    stagingTable: 'sling_shifts_staging',
    targetTable: 'staff_shifts',
    uniqueKey: 'sling_shift_id',
    transformFn: transformShift,
    stagingIdField: 'sling_shift_id',
    useDev: false,
    paginationStyle: 'skip',
    paginationCursorField: 'cursor',
    primaryIdField: 'id',
    responseDataPaths: ['data', 'shifts', 'items']
  }
};

interface SyncCycleResult {
  recordsFetched: number;
  recordsUpserted: number;
  recordsInserted: number;
  recordsUpdated: number;
  recordsFailed: number;
  nextCursor: string | null;
  hasMore: boolean;
  phase: string;
  errors: Array<{ id: string; error: string }>;
  firstRecordId?: string | null; // Track first record ID for duplicate detection
}

interface UpsertResult {
  successful: number;
  inserted: number;
  updated: number;
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
  cumulative_inserted?: number;
  cumulative_updated?: number;
  last_batch_first_id?: string; // Track first record ID to detect duplicate batches
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

    // Fetch the job with a status check to prevent race conditions
    const { data: job, error: jobError } = await supabase
      .from('backfill_jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (jobError) {
      // Handle specific error cases gracefully
      if (jobError.code === 'PGRST116') {
        // Row not found - job was deleted or doesn't exist
        logger.warn(`Job not found (may have been deleted): ${job_id}`);
        return jsonResponse({ success: false, error: 'Job not found or deleted', code: 'JOB_NOT_FOUND' }, corsHeaders, 404);
      }
      throw new Error(`Database error: ${jobError.message}`);
    }

    if (!job) {
      logger.warn(`Job not found: ${job_id}`);
      return jsonResponse({ success: false, error: 'Job not found', code: 'JOB_NOT_FOUND' }, corsHeaders, 404);
    }

    // Check if job is already completed/cancelled/failed - don't process
    if (['completed', 'cancelled', 'failed'].includes(job.status)) {
      logger.info(`Job ${job_id} already in terminal state: ${job.status}`);
      return jsonResponse({ 
        success: true, 
        message: `Job already ${job.status}`,
        status: job.status 
      }, corsHeaders);
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

    // CONCURRENCY GUARD: Use an atomic update to claim this batch
    // This prevents multiple edge function invocations from processing the same batch
    const processingToken = crypto.randomUUID();
    const staleThreshold = new Date(Date.now() - 30000).toISOString();
    
    const { data: claimedJob, error: claimError } = await supabase
      .from('backfill_jobs')
      .update({ 
        sync_phase: 'processing',
        // Use a timestamp check to prevent stale claims
        retry_scheduled_at: null 
      })
      .eq('id', job_id)
      .in('status', ['pending', 'running', 'paused'])
      // Only claim if not already being processed (sync_phase not 'processing' or stale or never synced)
      // CRITICAL: Handle NULL last_batch_synced_at for new jobs that have never been synced
      .or(`sync_phase.neq.processing,last_batch_synced_at.is.null,last_batch_synced_at.lt.${staleThreshold}`)
      .select()
      .single();

    if (claimError || !claimedJob) {
      logger.info(`Job ${job_id} is already being processed by another invocation`);
      return jsonResponse({ 
        success: true, 
        message: 'Job is being processed by another invocation',
        code: 'ALREADY_PROCESSING'
      }, corsHeaders);
    }

    // Get configuration for this job type
    const configKey = `${job.api_source}-${job.data_type}`;
    const config = BACKFILL_CONFIGS[configKey];
    
    if (!config) {
      throw new Error(`No configuration found for ${configKey}`);
    }

    // Update job to running if not already
    if (claimedJob.status !== 'running') {
      await updateJobStatus(supabase, job_id, 'running', { 
        sync_phase: 'starting',
        started_at: claimedJob.started_at || new Date().toISOString()
      });
    }

    // Generate batch ID for this cycle
    const batchId = crypto.randomUUID();
    
    // CRITICAL DEBUG: Log cursor state before fetch
    logger.info('Starting sync cycle', {
      batchNumber: (claimedJob.total_batches_completed || 0) + 1,
      currentCursor: claimedJob.batch_cursor ? claimedJob.batch_cursor.substring(0, 100) : 'NULL (first batch)',
      recordsProcessedSoFar: claimedJob.records_processed,
      endpoint: config.endpointPath
    });
    
    // Execute the complete sync cycle
    const result = await executeSyncCycle(
      supabase,
      claimedJob as BackfillJob,
      config,
      batchId,
      logger
    );

    // Update job with results
    const updateData: Record<string, unknown> = {
      records_processed: (claimedJob.records_processed || 0) + result.recordsUpserted,
      batch_cursor: result.nextCursor,
      sync_phase: result.phase,
      last_batch_synced_at: new Date().toISOString(),
      total_batches_completed: (claimedJob.total_batches_completed || 0) + 1,
      records_in_current_batch: result.recordsFetched,
      // Store errors in the existing 'errors' JSONB column
      errors: result.errors.length > 0 ? result.errors : [],
      // Track new vs updated records for this batch
      records_inserted: result.recordsInserted,
      records_updated: result.recordsUpdated,
      // Accumulate totals across all batches
      cumulative_inserted: (claimedJob.cumulative_inserted || 0) + result.recordsInserted,
      cumulative_updated: (claimedJob.cumulative_updated || 0) + result.recordsUpdated,
      // Track first record ID for duplicate batch detection
      last_batch_first_id: result.firstRecordId || null
    };

    // CRITICAL DEBUG: Log cursor being stored
    logger.info('Batch complete - storing cursor', {
      batchNumber: (claimedJob.total_batches_completed || 0) + 1,
      recordsFetched: result.recordsFetched,
      recordsUpserted: result.recordsUpserted,
      inserted: result.recordsInserted,
      updated: result.recordsUpdated,
      failed: result.recordsFailed,
      nextCursor: result.nextCursor ? result.nextCursor.substring(0, 100) : 'NULL (no more data)',
      hasMore: result.hasMore
    });

    if (!result.hasMore) {
      // No more records - job is complete
      updateData.status = 'completed';
      updateData.completed_at = new Date().toISOString();
      updateData.no_more_records = true;
      updateData.sync_phase = 'complete';
      logger.info('Job complete - no more records');
    } else {
      // Schedule next batch with a small delay for rate limiting
      updateData.retry_scheduled_at = new Date(Date.now() + 2000).toISOString();
      logger.info('Scheduling next batch', { scheduledAt: updateData.retry_scheduled_at });
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
        recordsInserted: result.recordsInserted,
        recordsUpdated: result.recordsUpdated,
        recordsFailed: result.recordsFailed,
        hasMore: result.hasMore,
        totalProcessed: claimedJob.records_processed + result.recordsUpserted,
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
      recordsInserted: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      nextCursor: null,
      hasMore: false,
      phase: 'complete',
      errors: [],
      firstRecordId: null
    };
  }

  // CRITICAL: Detect duplicate batches (API returning same data)
  const firstRecordId = String(fetchResult.records[0][config.primaryIdField] || fetchResult.records[0].id || 'unknown');
  if (job.last_batch_first_id && job.last_batch_first_id === firstRecordId) {
    logger.error('DUPLICATE BATCH DETECTED - API is returning same records!', {
      firstRecordId,
      lastBatchFirstId: job.last_batch_first_id,
      batchNumber: job.total_batches_completed + 1,
      cursor: job.batch_cursor
    });
    // Stop the sync - something is wrong with pagination
    return {
      recordsFetched: fetchResult.records.length,
      recordsUpserted: 0,
      recordsInserted: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      nextCursor: null, // Stop pagination
      hasMore: false,
      phase: 'error_duplicate_batch',
      errors: [{ id: 'pagination', error: 'API returning duplicate batches - pagination not working' }],
      firstRecordId
    };
  }

  // Phase 2: Insert to staging
  await updateJobPhase(supabase, job.id, 'staging');
  await insertToStaging(supabase, config.stagingTable, fetchResult.records, batchId, config.stagingIdField, config.primaryIdField, logger);

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

  // Phase 5: Clear staging (non-fatal - data already upserted)
  await updateJobPhase(supabase, job.id, 'clearing_staging');
  await clearStaging(supabase, config.stagingTable, batchId, logger);

  // Get first record ID for duplicate detection
  const firstRecordId = String(fetchResult.records[0]?.[config.primaryIdField] || fetchResult.records[0]?.id || 'unknown');

  return {
    recordsFetched: fetchResult.records.length,
    recordsUpserted: upsertResult.successful,
    recordsInserted: upsertResult.inserted,
    recordsUpdated: upsertResult.updated,
    recordsFailed: upsertResult.failed,
    nextCursor: fetchResult.nextCursor,
    hasMore: fetchResult.hasMore,
    phase: 'batch_complete',
    errors: upsertResult.errors,
    firstRecordId
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
    // Use Bearer format for API key (matches working arketa-gym-flow pattern)
    headers = {
      'Authorization': `Bearer ${ARKETA_API_KEY}`,
      'Content-Type': 'application/json'
    };
  }

  const partnerId = Deno.env.get("ARKETA_PARTNER_ID");
  const baseUrl = config.useDev ? ARKETA_URLS.dev : ARKETA_URLS.prod;
  
  // Build URL - only add limit if the API supports it
  let url = `${baseUrl}/${partnerId}${config.endpointPath}`;
  const supportsLimit = config.supportsLimit !== false; // Default true
  if (supportsLimit) {
    url += `?limit=${BATCH_SIZE}`;
  }

  // Helper to add query params with correct separator
  const addParam = (param: string) => {
    url += url.includes('?') ? `&${param}` : `?${param}`;
  };

  // Add date range if applicable (not for clients or staff/instructors endpoints)
  const skipDateFiltering = ['/clients', '/staff'].includes(config.endpointPath);
  if (job.start_date && job.end_date && !skipDateFiltering) {
    addParam(`start_date=${job.start_date}`);
    addParam(`end_date=${job.end_date}`);
  }

  // Config-driven pagination based on endpoint requirements
  if (job.batch_cursor) {
    switch (config.paginationStyle) {
      case 'start_after':
        // Arketa's preferred pagination style
        addParam(`start_after=${encodeURIComponent(job.batch_cursor)}`);
        logger.info('Using start_after pagination', { cursor: job.batch_cursor });
        break;
      case 'page':
        // Page-based pagination
        addParam(`page=${job.batch_cursor}`);
        logger.info('Using page-based pagination', { page: job.batch_cursor });
        break;
      case 'skip':
        // Offset-based pagination
        addParam(`skip=${job.batch_cursor}`);
        logger.info('Using skip-based pagination', { skip: job.batch_cursor });
        break;
      case 'cursor':
      default:
        addParam(`cursor=${encodeURIComponent(job.batch_cursor)}`);
        logger.info('Using cursor-based pagination', { cursor: job.batch_cursor });
        break;
    }
  } else if (config.paginationStyle === 'skip' && job.records_processed > 0) {
    // For skip-based pagination, use records_processed as offset when no cursor
    addParam(`skip=${job.records_processed}`);
    logger.info('Using skip-based pagination from records_processed', { skip: job.records_processed });
  }

  // CRITICAL: Log full pagination state for debugging
  logger.info(`Fetching batch - URL: ${url}`, {
    paginationStyle: config.paginationStyle,
    useDev: config.useDev,
    batchNumber: job.total_batches_completed + 1,
    currentCursor: job.batch_cursor ? job.batch_cursor.substring(0, 50) : 'NONE (first batch)',
    recordsProcessedSoFar: job.records_processed
  });
  
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
    hasItemsField: !Array.isArray(data) && !!data.items,
    hasDataField: !Array.isArray(data) && !!data.data,
    hasPagination: !Array.isArray(data) && !!data.pagination,
    paginationDetails: !Array.isArray(data) && data.pagination ? {
      hasNextStartAfterId: !!data.pagination.nextStartAfterId,
      hasNextCursor: !!data.pagination.nextCursor,
      hasMore: data.pagination.hasMore,
      limit: data.pagination.limit,
      allPaginationKeys: Object.keys(data.pagination)
    } : null
  });

  // Handle different response formats - use config-driven paths first
  let records: Record<string, unknown>[];
  let matchedFormat = 'none';

  if (Array.isArray(data)) {
    records = data;
    matchedFormat = 'direct_array';
  } else {
    // Try each path from config in order
    records = [];
    for (const path of config.responseDataPaths) {
      if (data[path] && Array.isArray(data[path])) {
        records = data[path];
        matchedFormat = `${path}_field`;
        break;
      }
    }

    // Fallback to legacy field checks if config paths didn't match
    if (records.length === 0) {
      const legacyPaths = ['data', 'clients', 'classes', 'reservations', 'payments', 'purchases', 'staff', 'items', 'results'];
      for (const path of legacyPaths) {
        if (data[path] && Array.isArray(data[path])) {
          records = data[path];
          matchedFormat = `legacy_${path}_field`;
          logger.warn(`Used legacy path '${path}' - consider adding to config.responseDataPaths`);
          break;
        }
      }
    }

    // CRITICAL: Log extensive details when format is unrecognized
    if (records.length === 0 && Object.keys(data).length > 0) {
      logger.error('UNKNOWN RESPONSE FORMAT - Records will be empty!', {
        keys: Object.keys(data),
        configuredPaths: config.responseDataPaths,
        dataType: typeof data,
        sampleData: JSON.stringify(data).substring(0, 500),
        endpoint: config.endpointPath
      });
    }
  }

  // Extract pagination cursor using config-driven field name
  let nextCursor: string | null = null;
  
  // ENHANCED LOGGING: Log all pagination fields to understand structure
  logger.info('Pagination extraction starting', {
    hasPagination: !!data.pagination,
    paginationObject: data.pagination ? JSON.stringify(data.pagination).substring(0, 200) : 'none',
    configCursorField: config.paginationCursorField,
    topLevelCursor: data.cursor || data.next_cursor || data.start_after || 'none'
  });
  
  if (data.pagination) {
    // Primary: Use the configured pagination cursor field
    nextCursor = data.pagination[config.paginationCursorField] ||
      // Fallback to common alternatives
      data.pagination.nextCursor ||
      data.pagination.next_cursor ||
      data.pagination.cursor ||
      data.pagination.start_after ||
      data.pagination.nextStartAfterId ||
      null;
      
    logger.info('Cursor extracted from pagination object', {
      extractedCursor: nextCursor ? `${nextCursor.substring(0, 50)}...` : 'null',
      hasMore: data.pagination.hasMore,
      has_more: data.pagination.has_more
    });
  }
  // Also check top-level cursor fields
  if (!nextCursor) {
    nextCursor = data.cursor || data.next_cursor || data.start_after || null;
    if (nextCursor) {
      logger.info('Cursor extracted from top-level field', {
        extractedCursor: nextCursor.substring(0, 50)
      });
    }
  }

  // For page-based pagination, calculate next page
  if (config.paginationStyle === 'page' && records.length === BATCH_SIZE) {
    const currentPage = parseInt(job.batch_cursor || '1', 10);
    nextCursor = String(currentPage + 1);
  }

  // For skip-based pagination, calculate next offset
  if (config.paginationStyle === 'skip' && records.length === BATCH_SIZE) {
    const currentOffset = parseInt(job.batch_cursor || '0', 10);
    nextCursor = String(currentOffset + records.length);
  }

  // Determine hasMore using multiple signals
  const isBatchFull = records.length === BATCH_SIZE;
  const paginationHasMore = data.pagination?.hasMore === true || data.pagination?.has_more === true;
  const cursorPresent = !!nextCursor;

  // STRATEGY: Trust the API's hasMore flag when present, or cursor presence
  let hasMore = false;
  let effectiveCursor = nextCursor;

  if (cursorPresent) {
    hasMore = true;
    logger.info('Pagination cursor active', { cursor: nextCursor, style: config.paginationStyle });
  } else if (paginationHasMore && isBatchFull) {
    hasMore = true;
    logger.info('API indicates more records (will use offset if needed)', {
      recordsFetched: records.length,
      apiHasMore: paginationHasMore
    });
  } else if (isBatchFull && records.length > 0) {
    // Got a full batch - assume there might be more
    hasMore = true;
    logger.info('Full batch received - will attempt one more fetch', {
      recordsFetched: records.length
    });
  } else if (records.length < BATCH_SIZE) {
    hasMore = false;
    logger.info('Received partial batch - sync complete', { recordsFetched: records.length });
  }

  // Extract primary IDs from records to detect duplicates across batches
  const recordIds = records.map(r => String(r[config.primaryIdField] || r.id || r.client_id || 'unknown')).slice(0, 10);
  
  // Log sample record structure to verify field names
  if (records.length > 0) {
    const sampleRecord = records[0];
    logger.info('Sample record structure', {
      fieldNames: Object.keys(sampleRecord).slice(0, 15),
      hasClientId: 'client_id' in sampleRecord,
      hasId: 'id' in sampleRecord,
      clientIdValue: sampleRecord.client_id ? String(sampleRecord.client_id).substring(0, 20) : 'missing',
      idValue: sampleRecord.id ? String(sampleRecord.id).substring(0, 20) : 'missing',
      hasClientName: 'client_name' in sampleRecord,
      hasEmail: 'email' in sampleRecord
    });
  }
  
  logger.info('Fetch complete', {
    recordCount: records.length,
    matchedFormat,
    sampleRecordIds: recordIds,
    firstRecordId: records[0] ? String(records[0][config.primaryIdField] || records[0].id) : 'none',
    lastRecordId: records[records.length - 1] ? String(records[records.length - 1][config.primaryIdField] || records[records.length - 1].id) : 'none',
    pagination: {
      isBatchFull,
      paginationHasMore,
      cursorPresent,
      extractedCursor: effectiveCursor ? effectiveCursor.substring(0, 50) : 'null',
      usingOffset: !cursorPresent && hasMore,
      hasMoreDecision: hasMore
    }
  });

  return { records, nextCursor: effectiveCursor, hasMore };
}

async function insertToStaging(
  supabase: SupabaseClient,
  table: string,
  records: Record<string, unknown>[],
  batchId: string,
  idField: string,
  primaryIdField: string,
  logger: ReturnType<typeof createSyncLogger>
): Promise<void> {
  const stagingRecords = records.map((record, index) => {
    // Use config-driven primaryIdField (e.g., 'client_id' for clients, 'id' for others)
    const recordId = record[primaryIdField] ?? record.id;
    if (recordId === undefined || recordId === null) {
      logger.warn(`Record at index ${index} has no ${primaryIdField} or id field`, {
        recordKeys: Object.keys(record),
        expectedField: primaryIdField
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
 * Also tracks which records were new (inserted) vs existing (updated)
 */
async function upsertToTargetWithRetry(
  supabase: SupabaseClient,
  table: string,
  records: Record<string, unknown>[],
  uniqueKey: string,
  logger: ReturnType<typeof createSyncLogger>
): Promise<UpsertResult> {
  // First, check which records already exist to track new vs updated
  const uniqueKeys = records.map(r => String(r[uniqueKey])).filter(Boolean);
  
  // Log sample of unique keys to verify they're correct
  logger.info('Checking for existing records', {
    table,
    uniqueKey,
    totalRecords: records.length,
    uniqueKeysCount: uniqueKeys.length,
    sampleKeys: uniqueKeys.slice(0, 5),
    lastKeys: uniqueKeys.slice(-3)
  });
  
  let existingCount = 0;
  if (uniqueKeys.length > 0) {
    // Split into chunks of 100 to avoid PostgreSQL IN clause limits
    const chunkSize = 100;
    for (let i = 0; i < uniqueKeys.length; i += chunkSize) {
      const chunk = uniqueKeys.slice(i, i + chunkSize);
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .in(uniqueKey, chunk);
      
      if (countError) {
        logger.warn('Error counting existing records', {
          error: countError.message,
          chunk: i / chunkSize,
          chunkSize: chunk.length
        });
      } else if (count !== null) {
        existingCount += count;
      }
    }
    
    logger.info('Existing records count complete', {
      existingCount,
      newRecords: records.length - existingCount
    });
  }

  // Get actual table count BEFORE upsert
  const { count: countBefore, error: countBeforeError } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });
  
  if (countBeforeError) {
    logger.warn('Could not get pre-upsert table count', { error: countBeforeError.message });
  }

  // First try batch upsert (faster)
  const { error: batchError } = await supabase
    .from(table)
    .upsert(records, { onConflict: uniqueKey });

  if (!batchError) {
    // CRITICAL: Verify actual table count AFTER upsert
    const { count: countAfter, error: countAfterError } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    const actualNewRecords = countAfter && countBefore ? countAfter - countBefore : 0;
    const expectedNew = records.length - existingCount;
    
    logger.info('Batch upsert verification', {
      table,
      countBefore: countBefore || 'unknown',
      countAfter: countAfter || 'unknown',
      actualNewRecords,
      expectedNew,
      mismatch: actualNewRecords !== expectedNew,
      uniqueKeysSample: uniqueKeys.slice(0, 3)
    });
    
    // Use ACTUAL counts, not expected
    const inserted = actualNewRecords;
    const updated = records.length - actualNewRecords;
    
    logger.info('Batch upsert successful', {
      table,
      recordCount: records.length,
      inserted,
      updated,
      tableNowHas: countAfter
    });
    return {
      successful: records.length,
      inserted,
      updated,
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
  let inserted = 0;
  let updated = 0;
  let failed = 0;
  const errors: Array<{ id: string; error: string }> = [];

  for (const record of records) {
    const recordId = String(record[uniqueKey] || 'unknown');

    // Check if record exists before upsert
    const { count: existsBefore } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq(uniqueKey, recordId);

    const recordExisted = (existsBefore || 0) > 0;

    // Try up to 2 times per record
    let lastError: string | null = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      const { error } = await supabase
        .from(table)
        .upsert([record], { onConflict: uniqueKey });

      if (!error) {
        successful++;
        if (recordExisted) {
          updated++;
        } else {
          inserted++;
        }
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
    inserted,
    updated,
    failed,
    totalRecords: records.length
  });

  return { successful, inserted, updated, failed, errors };
}

async function clearStaging(
  supabase: SupabaseClient, 
  table: string, 
  batchId: string,
  logger?: ReturnType<typeof createSyncLogger>
): Promise<void> {
  // Retry staging clear up to 3 times with exponential backoff
  // This handles transient Cloudflare/network errors
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('sync_batch_id', batchId);
      
      if (!error) {
        return; // Success
      }
      
      // Check if it's a retryable error (network/transient)
      const isRetryable = error.message.includes('500') || 
                          error.message.includes('503') ||
                          error.message.includes('timeout') ||
                          error.message.includes('Cloudflare');
      
      if (!isRetryable || attempt === 3) {
        // Non-retryable or final attempt - log but don't throw
        // Staging data will be cleaned up on next batch or can be cleaned manually
        logger?.warn(`Staging clear failed (non-fatal): ${error.message}`, {
          table,
          batchId,
          attempt
        });
        return;
      }
      
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt - 1)));
      
    } catch (err) {
      // Catch network/fetch errors (like Cloudflare 500s returning HTML)
      if (attempt === 3) {
        logger?.warn(`Staging clear failed after retries (non-fatal)`, {
          table,
          batchId,
          error: err instanceof Error ? err.message : String(err)
        });
        return; // Don't throw - staging clear is non-critical
      }
      await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt - 1)));
    }
  }
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
  // VERIFIED from working arketa-gym-flow implementation
  // API returns: client_id, client_name, email, phone_number, tags, custom_fields,
  // lifecycle_stage_id, lifecycle_stage, date_of_birth, gender, referrer,
  // email_marketing_opt_in, sms_marketing_opt_in, transactional_sms_opt_in, removed

  // Get client ID - API returns client_id as primary identifier
  const clientId = raw.client_id || raw.id;
  
  if (!clientId) {
    console.warn('[transformClient] No client_id found in record:', Object.keys(raw).slice(0, 10));
  }

  // client_name comes directly from API
  const name = raw.client_name as string || raw.name as string || null;

  // Handle missing email - use placeholder to satisfy NOT NULL constraint
  const email = raw.email || `no-email-${clientId}@placeholder.local`;
  
  // phone_number is the correct field name (not phone)
  const phone = raw.phone_number || raw.phone || null;

  // lifecycle_stage can be an object with id and name
  const lifecycleStage = raw.lifecycle_stage as { id?: string; name?: string } | null;
  const lifecycleStageName = lifecycleStage?.name || raw.lifecycle_stage_name || null;

  return {
    external_id: String(clientId),
    client_name: name,
    client_email: email,
    client_phone: phone,
    client_tags: (raw.tags as string[]) || [],
    custom_fields: raw.custom_fields || raw.customFields || {},
    referrer: raw.referrer || null,
    email_mkt_opt_in: raw.email_marketing_opt_in ?? raw.email_mkt_opt_in ?? false,
    sms_mkt_opt_in: raw.sms_marketing_opt_in ?? raw.sms_mkt_opt_in ?? false,
    date_of_birth: raw.date_of_birth || raw.dateOfBirth || null,
    lifecycle_stage: lifecycleStageName,
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

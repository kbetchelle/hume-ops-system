import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { getApiEndpointConfig } from '../_shared/apiEndpoints.ts';
import { withRetry, RetryableError } from '../_shared/retry.ts';
import { createSyncLogger } from '../_shared/logger.ts';

interface BackfillRequest {
  api_source: 'arketa' | 'sling';
  data_type: 'classes' | 'reservations' | 'payments' | 'shifts' | 'users' | 'clients';
  start_date: string;
  end_date: string;
  job_id?: string;
  action?: 'pause' | 'cancel' | 'resume' | 'retry-failed' | 'continue';
}

interface BackfillJob {
  id: string;
  api_source: string;
  data_type: string;
  start_date: string;
  end_date: string;
  processing_date: string | null;
  status: string;
  total_days: number;
  days_processed: number;
  records_processed: number;
  errors: any[];
  started_at: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  last_cursor: string | null;
  total_records_expected: number;
  retry_scheduled_at: string | null;
  staging_synced: boolean;
}

// Calculate days between two dates
function daysBetween(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

// Add days to a date
function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

// Delay utility for rate limiting
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Endpoint type mapping for backfill data types to api_endpoints lookup
const endpointTypeMap: Record<string, string> = {
  'payments': 'payments',
  'shifts': 'shifts',
  'classes': 'classes',
  'reservations': 'reservations',
  'clients': 'clients',
};

// Sync Arketa classes for a single date with pagination
async function syncArketaClasses(supabase: any, date: string): Promise<number> {
  const ARKETA_API_KEY = Deno.env.get('ARKETA_API_KEY');
  const ARKETA_PARTNER_ID = Deno.env.get('ARKETA_PARTNER_ID');
  const ARKETA_PROD_URL = 'https://us-central1-sutra-prod.cloudfunctions.net/partnerApi/v0';

  let allClasses: any[] = [];
  let nextCursor: string | undefined;
  let pageCount = 0;
  const maxPages = 50;

  do {
    let url = `${ARKETA_PROD_URL}/${ARKETA_PARTNER_ID}/classes?limit=500&start_date=${date}&end_date=${date}`;
    if (nextCursor) url += `&cursor=${nextCursor}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': ARKETA_API_KEY!,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429 || status >= 500) {
        throw new RetryableError(`Arketa API error: ${status}`, status);
      }
      throw new Error(`Arketa API error: ${status} (non-retryable)`);
    }

    const responseData = await response.json();
    const classes = Array.isArray(responseData) 
      ? responseData 
      : (responseData.classes || responseData.data || []);
    allClasses.push(...classes);

    nextCursor = responseData.pagination?.nextCursor;
    pageCount++;
  } while (nextCursor && pageCount < maxPages);

  let recordCount = 0;
  for (const cls of allClasses) {
    const name = cls.name || cls.class_name || 'Unknown Class';
    const instructorName = cls.instructor_name || 
      (cls.instructor ? `${cls.instructor.first_name || ''} ${cls.instructor.last_name || ''}`.trim() : null);

    const { error } = await supabase
      .from('arketa_classes')
      .upsert({
        external_id: String(cls.id),
        name,
        start_time: cls.start_time,
        duration_minutes: cls.duration_minutes ?? cls.duration ?? null,
        capacity: cls.capacity ?? cls.max_capacity ?? null,
        booked_count: cls.total_booked ?? cls.booked_count ?? 0,
        waitlist_count: cls.waitlist_count || 0,
        status: cls.status || 'scheduled',
        is_cancelled: cls.is_cancelled ?? cls.cancelled ?? false,
        room_name: cls.room?.name || null,
        instructor_name: instructorName,
        raw_data: cls,
        synced_at: new Date().toISOString(),
      }, { onConflict: 'external_id' });

    if (!error) recordCount++;
  }

  return recordCount;
}

// Sync Arketa reservations for a single date with pagination
async function syncArketaReservations(supabase: any, date: string): Promise<number> {
  const ARKETA_API_KEY = Deno.env.get('ARKETA_API_KEY');
  const ARKETA_PARTNER_ID = Deno.env.get('ARKETA_PARTNER_ID');
  const ARKETA_PROD_URL = 'https://us-central1-sutra-prod.cloudfunctions.net/partnerApi/v0';

  let allReservations: any[] = [];
  let nextCursor: string | undefined;
  let pageCount = 0;
  const maxPages = 50;

  do {
    let url = `${ARKETA_PROD_URL}/${ARKETA_PARTNER_ID}/reservations?limit=500&start_date=${date}&end_date=${date}`;
    if (nextCursor) url += `&cursor=${nextCursor}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': ARKETA_API_KEY!,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429 || status >= 500) {
        throw new RetryableError(`Arketa API error: ${status}`, status);
      }
      throw new Error(`Arketa API error: ${status} (non-retryable)`);
    }

    const responseData = await response.json();
    const reservations = Array.isArray(responseData) 
      ? responseData 
      : (responseData.reservations || responseData.data || []);
    allReservations.push(...reservations);

    nextCursor = responseData.pagination?.nextCursor;
    pageCount++;
  } while (nextCursor && pageCount < maxPages);

  let recordCount = 0;
  for (const res of allReservations) {
    const clientName = res.client?.firstName && res.client?.lastName 
      ? `${res.client.firstName} ${res.client.lastName}`.trim()
      : res.client_name || null;

    const { error } = await supabase
      .from('arketa_reservations')
      .upsert({
        external_id: String(res.id),
        class_id: String(res.class_id || res.classId),
        client_id: res.client_id || res.client?.id ? String(res.client_id || res.client?.id) : null,
        client_name: clientName,
        client_email: res.client?.email || res.client_email || null,
        status: res.status || 'booked',
        checked_in: res.checked_in ?? res.checkedIn ?? false,
        checked_in_at: res.checked_in_at || res.checkedInAt || null,
        raw_data: res,
        synced_at: new Date().toISOString(),
      }, { onConflict: 'external_id' });

    if (!error) recordCount++;
  }

  return recordCount;
}

// Sync Arketa payments for a single date with pagination
async function syncArketaPayments(supabase: any, date: string): Promise<number> {
  const ARKETA_API_KEY = Deno.env.get('ARKETA_API_KEY');
  const ARKETA_PARTNER_ID = Deno.env.get('ARKETA_PARTNER_ID');
  const ARKETA_PROD_URL = 'https://us-central1-sutra-prod.cloudfunctions.net/partnerApi/v0';

  let allPayments: any[] = [];
  let nextCursor: string | undefined;
  let pageCount = 0;
  const maxPages = 50;

  do {
    let url = `${ARKETA_PROD_URL}/${ARKETA_PARTNER_ID}/purchases?limit=500&start_date=${date}&end_date=${date}`;
    if (nextCursor) url += `&cursor=${nextCursor}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': ARKETA_API_KEY!,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429 || status >= 500) {
        throw new RetryableError(`Arketa API error: ${status}`, status);
      }
      throw new Error(`Arketa API error: ${status} (non-retryable)`);
    }

    const responseData = await response.json();
    const payments = Array.isArray(responseData) 
      ? responseData 
      : (responseData.purchases || responseData.payments || responseData.data || []);
    allPayments.push(...payments);

    nextCursor = responseData.pagination?.nextCursor;
    pageCount++;
  } while (nextCursor && pageCount < maxPages);

  let recordCount = 0;
  for (const payment of allPayments) {
    const { error } = await supabase
      .from('arketa_payments')
      .upsert({
        external_id: String(payment.id),
        client_id: payment.client_id ? String(payment.client_id) : null,
        amount: payment.amount ?? payment.total ?? 0,
        payment_type: payment.type || payment.payment_type || 'unknown',
        status: payment.status || 'completed',
        payment_date: payment.created_at || payment.date || date,
        notes: payment.notes || null,
        raw_data: payment,
        synced_at: new Date().toISOString(),
      }, { onConflict: 'external_id' });

    if (!error) recordCount++;
  }

  return recordCount;
}

// Sync ONE PAGE of Arketa clients and return pagination info for resumable sync
interface ClientSyncResult {
  recordsProcessed: number;
  nextCursor: string | null;
  hasMore: boolean;
  totalInPage: number;
}

async function syncArketaClientsPage(
  supabase: any, 
  cursor: string | null
): Promise<ClientSyncResult> {
  const ARKETA_API_KEY = Deno.env.get('ARKETA_API_KEY');
  const ARKETA_PARTNER_ID = Deno.env.get('ARKETA_PARTNER_ID');
  const ARKETA_PROD_URL = 'https://us-central1-sutra-prod.cloudfunctions.net/partnerApi/v0';

  // Get OAuth token
  let headers: Record<string, string>;
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const tokenResponse = await fetch(`${supabaseUrl}/functions/v1/refresh-arketa-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });
    
    if (tokenResponse.ok) {
      const tokenResult = await tokenResponse.json();
      if (tokenResult.success && tokenResult.access_token) {
        headers = {
          'Authorization': `Bearer ${tokenResult.access_token}`,
          'Content-Type': 'application/json',
        };
        console.log('[backfill] Using OAuth token for Arketa clients');
      } else {
        throw new Error('No access token in response');
      }
    } else {
      throw new Error(`Token refresh failed: ${tokenResponse.status}`);
    }
  } catch (tokenError) {
    console.log('[backfill] OAuth token failed, falling back to API key:', tokenError);
    headers = {
      'x-api-key': ARKETA_API_KEY!,
      'Content-Type': 'application/json',
    };
  }

  // Fetch ONE page of clients
  let url = `${ARKETA_PROD_URL}/${ARKETA_PARTNER_ID}/clients?limit=500`;
  if (cursor) url += `&cursor=${cursor}`;

  console.log(`[backfill] Fetching clients page: ${url}`);

  const response = await fetch(url, { method: 'GET', headers });

  if (!response.ok) {
    const status = response.status;
    const errorText = await response.text();
    console.error(`[backfill] Arketa clients API error: ${status} - ${errorText}`);
    if (status === 429 || status >= 500) {
      throw new RetryableError(`Arketa API error: ${status}`, status);
    }
    throw new Error(`Arketa API error: ${status} (non-retryable)`);
  }

  const responseData = await response.json();
  
  // Handle multiple possible response formats
  let clients: any[];
  if (Array.isArray(responseData)) {
    clients = responseData;
  } else if (responseData.items && Array.isArray(responseData.items)) {
    clients = responseData.items;
  } else if (responseData.data && Array.isArray(responseData.data)) {
    clients = responseData.data;
  } else if (responseData.clients && Array.isArray(responseData.clients)) {
    clients = responseData.clients;
  } else {
    console.log(`[backfill] Unexpected response structure:`, JSON.stringify(responseData).slice(0, 500));
    clients = [];
  }
  
  console.log(`[backfill] Page fetched: ${clients.length} clients`);

  // Upsert clients directly to target table using external_id (client_id from API)
  let recordCount = 0;
  for (const client of clients) {
    // Build client name from available fields
    let clientName = client.name || null;
    if (!clientName) {
      const parts = [client.firstName, client.lastName].filter(Boolean);
      clientName = parts.length > 0 ? parts.join(' ') : null;
    }

    const { error } = await supabase
      .from('arketa_clients')
      .upsert({
        external_id: String(client.id),
        client_email: client.email || '',
        client_name: clientName,
        client_phone: client.phone || null,
        client_tags: client.tags || [],
        custom_fields: client.customFields || {},
        referrer: client.referrer || null,
        email_mkt_opt_in: client.emailMarketingOptIn ?? false,
        sms_mkt_opt_in: client.smsMarketingOptIn ?? false,
        date_of_birth: client.dateOfBirth || null,
        lifecycle_stage: client.lifecycleStage || null,
        raw_data: client,
        last_synced_at: new Date().toISOString(),
      }, { onConflict: 'external_id' });

    if (!error) recordCount++;
  }

  // Check pagination
  const nextCursor = responseData.pagination?.nextCursor || null;
  const hasMore = responseData.pagination?.hasMore ?? (clients.length === 500);

  console.log(`[backfill] Upserted ${recordCount} clients, hasMore: ${hasMore}, nextCursor: ${nextCursor ? 'yes' : 'no'}`);

  return {
    recordsProcessed: recordCount,
    nextCursor,
    hasMore: hasMore && clients.length > 0,
    totalInPage: clients.length,
  };
}

// Sync Sling shifts for a single date
async function syncSlingShifts(supabase: any, date: string): Promise<number> {
  const SLING_AUTH_TOKEN = Deno.env.get('SLING_AUTH_TOKEN');
  const SLING_ORG_ID = Deno.env.get('SLING_ORG_ID');
  const SLING_BASE_URL = 'https://api.getsling.com/v1';

  const url = `${SLING_BASE_URL}/${SLING_ORG_ID}/reports/roster?dates=${date}/${date}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': SLING_AUTH_TOKEN!,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const status = response.status;
    if (status === 429 || status >= 500) {
      throw new RetryableError(`Sling API error: ${status}`, status);
    }
    throw new Error(`Sling API error: ${status} (non-retryable)`);
  }

  const roster = await response.json();
  const shifts = Array.isArray(roster) ? roster : [];

  // Pre-fetch sling_users for name lookup
  const userIds = [...new Set(shifts.map((s: any) => s.user?.id).filter(Boolean))];
  const { data: slingUsers } = await supabase
    .from('sling_users')
    .select('sling_user_id, first_name, last_name')
    .in('sling_user_id', userIds);
  
  const userNameMap = new Map<number, string>();
  (slingUsers || []).forEach((u: any) => {
    const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ') || 'Unknown';
    userNameMap.set(u.sling_user_id, fullName);
  });

  let recordCount = 0;
  for (const shift of shifts) {
    if (!shift.dtstart || !shift.dtend) continue;

    // Extract numeric shift ID (Sling may return "12345:2025-01-30" format)
    const rawShiftId = String(shift.id);
    const numericShiftId = parseInt(rawShiftId.split(':')[0], 10);
    if (isNaN(numericShiftId)) {
      console.error(`[backfill] Invalid shift ID format: ${rawShiftId}`);
      continue;
    }

    const slingUserId = shift.user?.id || 0;
    // Get user_name from sling_users table
    const userName = userNameMap.get(slingUserId) || 'Unknown';

    // Build shift data - shift_date is a generated column
    const shiftData: Record<string, unknown> = {
      sling_shift_id: numericShiftId,
      external_id: rawShiftId,
      user_name: userName,
      position: shift.position?.name || null,
      shift_start: shift.dtstart,
      shift_end: shift.dtend,
      status: shift.status || 'scheduled',
      raw_data: shift,
      synced_at: new Date().toISOString(),
    };

    // Only set sling_user_id if it exists in sling_users (FK constraint)
    if (slingUserId && userNameMap.has(slingUserId)) {
      shiftData.sling_user_id = slingUserId;
    }

    const { error } = await supabase
      .from('staff_shifts')
      .upsert(shiftData, { onConflict: 'sling_shift_id' });

    if (error) {
      console.error(`[backfill] Failed to upsert shift ${numericShiftId}:`, JSON.stringify(error));
    } else {
      recordCount++;
    }
  }

  return recordCount;
}

// Main handler
Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json() as BackfillRequest;
    const { api_source, data_type, start_date, end_date, job_id, action } = body;

    const logger = createSyncLogger('backfill', job_id);

    // Handle pause/cancel/resume/retry-failed/continue actions
    if (action && job_id) {
      if (action === 'continue') {
        // Continue syncing from where we left off
        const { data: existingJob, error: fetchError } = await supabase
          .from('backfill_jobs')
          .select('*')
          .eq('id', job_id)
          .single();

        if (fetchError || !existingJob) {
          return new Response(
            JSON.stringify({ error: 'Job not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // This will fall through to the main processing below
      } else if (action === 'retry-failed') {
        // Fetch job to get failed dates
        const { data: existingJob, error: fetchError } = await supabase
          .from('backfill_jobs')
          .select('*')
          .eq('id', job_id)
          .single();

        if (fetchError || !existingJob) {
          return new Response(
            JSON.stringify({ error: 'Job not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const failedDates = (existingJob.errors || []).map((e: { date: string }) => e.date);
        if (failedDates.length === 0) {
          return new Response(
            JSON.stringify({ success: true, job_id, message: 'No failed dates to retry' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        logger.info(`Retrying ${failedDates.length} failed dates`, { failedDates });

        // Clear errors and mark as running
        await supabase
          .from('backfill_jobs')
          .update({ status: 'running', errors: [] })
          .eq('id', job_id);

        return new Response(
          JSON.stringify({ 
            success: true, 
            job_id, 
            action: 'retry-failed', 
            status: 'running',
            failed_dates_count: failedDates.length 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        let newStatus: string;
        switch (action) {
          case 'pause':
            newStatus = 'paused';
            break;
          case 'cancel':
            newStatus = 'cancelled';
            break;
          case 'resume':
            newStatus = 'running';
            break;
          default:
            throw new Error(`Unknown action: ${action}`);
        }

        const { error } = await supabase
          .from('backfill_jobs')
          .update({ status: newStatus })
          .eq('id', job_id);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, job_id, action, status: newStatus }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate required fields for new/resume job
    if (!api_source || !data_type || !start_date || !end_date) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: api_source, data_type, start_date, end_date' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let job: BackfillJob;

    // Resume existing job or create new one
    if (job_id) {
      const { data: existingJob, error } = await supabase
        .from('backfill_jobs')
        .select('*')
        .eq('id', job_id)
        .single();

      if (error || !existingJob) {
        return new Response(
          JSON.stringify({ error: 'Job not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      job = existingJob as BackfillJob;
    } else {
      // Create new job
      const totalDays = daysBetween(start_date, end_date);
      
      const { data: newJob, error } = await supabase
        .from('backfill_jobs')
        .insert({
          api_source,
          data_type,
          start_date,
          end_date,
          processing_date: start_date,
          status: 'running',
          total_days: totalDays,
          days_processed: 0,
          records_processed: 0,
          errors: [],
          started_at: new Date().toISOString(),
          last_cursor: null,
          total_records_expected: 0,
          staging_synced: false,
        })
        .select()
        .single();

      if (error || !newJob) {
        throw new Error(`Failed to create job: ${error?.message}`);
      }

      job = newJob as BackfillJob;
    }

    // Update status to running
    await supabase
      .from('backfill_jobs')
      .update({ 
        status: 'running', 
        started_at: job.started_at || new Date().toISOString(),
        retry_scheduled_at: null, // Clear any scheduled retry
      })
      .eq('id', job.id);

    // Get rate limit from api_endpoints using endpoint type mapping
    const lookupType = endpointTypeMap[data_type] || data_type;
    const endpointConfig = await getApiEndpointConfig(supabase, api_source, lookupType);
    const rateLimitPerMin = endpointConfig?.rateLimitPerMin || 60;
    const delayMs = Math.ceil(60000 / rateLimitPerMin);

    console.log(`[Backfill] Starting job ${job.id}: ${api_source}/${data_type} from ${start_date} to ${end_date}`);
    console.log(`[Backfill] Rate limit: ${rateLimitPerMin}/min, delay: ${delayMs}ms`);

    // Determine which sync function to use
    let syncFunction: (supabase: any, date: string) => Promise<number>;
    
    switch (`${api_source}_${data_type}`) {
      case 'arketa_classes':
        syncFunction = syncArketaClasses;
        break;
      case 'arketa_reservations':
        syncFunction = syncArketaReservations;
        break;
      case 'arketa_payments':
        syncFunction = syncArketaPayments;
        break;
      case 'sling_shifts':
        syncFunction = syncSlingShifts;
        break;
      case 'arketa_clients':
        // Special handling for clients - page-based resumable sync
        logger.info('Starting resumable clients sync');

        let cursor = job.last_cursor;
        let totalRecords = job.records_processed || 0;
        let pageCount = 0;
        const maxPagesPerRun = 100; // Process up to 100 pages per invocation (50k records)
        let hasMorePages = true;

        try {
          while (hasMorePages && pageCount < maxPagesPerRun) {
            const { result, attempts } = await withRetry(
              () => syncArketaClientsPage(supabase, cursor),
              { maxAttempts: 3, baseDelayMs: 2000, maxDelayMs: 15000, timeoutMs: 60000 },
              `sync clients page ${pageCount + 1}`
            );

            totalRecords += result.recordsProcessed;
            cursor = result.nextCursor;
            hasMorePages = result.hasMore;
            pageCount++;

            // Update job progress after each page
            await supabase
              .from('backfill_jobs')
              .update({
                records_processed: totalRecords,
                last_cursor: cursor,
                days_processed: hasMorePages ? 0 : 1, // Mark as 1 day when complete
              })
              .eq('id', job.id);

            logger.info(`Page ${pageCount}: ${result.recordsProcessed} records (total: ${totalRecords})`);

            // Small delay between pages
            if (hasMorePages) {
              await delay(500);
            }
          }

          if (hasMorePages) {
            // More pages to process - schedule continuation in 3 minutes
            const retryTime = new Date(Date.now() + 3 * 60 * 1000).toISOString();
            await supabase
              .from('backfill_jobs')
              .update({
                status: 'running',
                retry_scheduled_at: retryTime,
              })
              .eq('id', job.id);

            logger.info(`Clients sync paused for rate limit, will continue at ${retryTime}. Total so far: ${totalRecords}`);

            return new Response(
              JSON.stringify({
                success: true,
                job_id: job.id,
                status: 'running',
                records_processed: totalRecords,
                has_more: true,
                retry_scheduled_at: retryTime,
                message: 'Sync will continue automatically in 3 minutes',
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // All pages processed - mark as completed
          await supabase
            .from('backfill_jobs')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              days_processed: 1,
              records_processed: totalRecords,
              last_cursor: null,
              retry_scheduled_at: null,
            })
            .eq('id', job.id);

          logger.info(`Clients sync completed: ${totalRecords} total records`);

          return new Response(
            JSON.stringify({
              success: true,
              job_id: job.id,
              status: 'completed',
              days_processed: 1,
              records_processed: totalRecords,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        } catch (err) {
          // Handle error - schedule retry in 3 minutes
          const errorMessage = err instanceof Error ? err.message : String(err);
          const retryTime = new Date(Date.now() + 3 * 60 * 1000).toISOString();
          
          await supabase
            .from('backfill_jobs')
            .update({
              status: 'running',
              retry_scheduled_at: retryTime,
              errors: [...(job.errors || []), { 
                error: errorMessage, 
                timestamp: new Date().toISOString(),
                cursor: cursor,
              }],
            })
            .eq('id', job.id);

          logger.error(`Clients sync error, will retry at ${retryTime}`, err instanceof Error ? err : new Error(String(err)));

          return new Response(
            JSON.stringify({
              success: false,
              job_id: job.id,
              status: 'running',
              records_processed: totalRecords,
              error: errorMessage,
              retry_scheduled_at: retryTime,
              message: 'Sync will retry automatically in 3 minutes',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

      default:
        throw new Error(`Unsupported sync type: ${api_source}_${data_type}`);
    }

    // Process day by day for other data types
    let currentDate = job.processing_date || start_date;
    let daysProcessed = job.days_processed;
    let recordsProcessed = job.records_processed;
    let totalRetries = 0;
    const errors: any[] = Array.isArray(job.errors) ? [...job.errors] : [];

    logger.info(`Starting processing from ${currentDate} to ${end_date}`);

    while (currentDate <= end_date) {
      // Check if job was paused or cancelled
      const { data: currentJob } = await supabase
        .from('backfill_jobs')
        .select('status')
        .eq('id', job.id)
        .single();

      if (currentJob?.status === 'paused' || currentJob?.status === 'cancelled') {
        console.log(`[Backfill] Job ${job.id} was ${currentJob.status}`);
        return new Response(
          JSON.stringify({
            success: true,
            job_id: job.id,
            status: currentJob.status,
            days_processed: daysProcessed,
            records_processed: recordsProcessed,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        logger.info(`Processing ${currentDate}...`);
        
        // Wrap syncFunction with retry logic (2 attempts, 2s base delay)
        const { result: records, attempts } = await withRetry(
          () => syncFunction(supabase, currentDate),
          { maxAttempts: 2, baseDelayMs: 2000, maxDelayMs: 10000, timeoutMs: 120000 },
          `sync ${currentDate}`
        );
        
        recordsProcessed += records;
        daysProcessed++;
        totalRetries += (attempts - 1); // Track retries (attempts - 1 = retries)

        // Update progress
        await supabase
          .from('backfill_jobs')
          .update({
            processing_date: addDays(currentDate, 1),
            days_processed: daysProcessed,
            records_processed: recordsProcessed,
          })
          .eq('id', job.id);

        logger.info(`${currentDate}: ${records} records synced${attempts > 1 ? ` (${attempts} attempts)` : ''}`);
      } catch (err) {
        // Only add to errors after retries exhausted
        const errorMessage = err instanceof Error ? err.message : String(err);
        errors.push({
          date: currentDate,
          error: errorMessage,
          timestamp: new Date().toISOString(),
          retriesAttempted: 2, // Max attempts used
        });

        await supabase
          .from('backfill_jobs')
          .update({ errors })
          .eq('id', job.id);

        logger.error(`Error on ${currentDate} (after retries)`, err);
      }

      // Move to next day
      currentDate = addDays(currentDate, 1);

      // Rate limit delay
      if (currentDate <= end_date) {
        await delay(delayMs);
      }
    }

    // Mark as completed
    await supabase
      .from('backfill_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        processing_date: null,
      })
      .eq('id', job.id);

    logger.info(`Job completed: ${daysProcessed} days, ${recordsProcessed} records, ${totalRetries} retries`);

    return new Response(
      JSON.stringify({
        success: true,
        job_id: job.id,
        status: 'completed',
        days_processed: daysProcessed,
        records_processed: recordsProcessed,
        retry_attempts: totalRetries,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Backfill] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

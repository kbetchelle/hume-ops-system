/**
 * DEPRECATED: Use run-backfill-job + sync-arketa-reservations/payments instead.
 * All date-based backfill now goes through run-backfill-job.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { getApiEndpointConfig } from '../_shared/apiEndpoints.ts';
import { withRetry, RetryableError } from '../_shared/retry.ts';
import { createSyncLogger } from '../_shared/logger.ts';
import { getSuggestedDelayFromMessage } from '../_shared/syncErrorLearning.ts';

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

// Generate UUID for sync batch
function generateUUID(): string {
  return crypto.randomUUID();
}

// Endpoint type mapping for backfill data types to api_endpoints lookup
const endpointTypeMap: Record<string, string> = {
  'payments': 'payments',
  'shifts': 'shifts',
  'classes': 'classes',
  'reservations': 'reservations',
  'clients': 'clients',
};

// Sync Arketa classes for a single date with pagination. See docs/ARKETA_ARCHITECTURE.md: arketa_classes is the master catalog for class_ids.
async function syncArketaClasses(supabase: any, date: string, _syncBatchId?: string): Promise<number> {
  const ARKETA_API_KEY = Deno.env.get('ARKETA_API_KEY');
  const ARKETA_PARTNER_ID = Deno.env.get('ARKETA_PARTNER_ID');
  const ARKETA_PROD_URL = 'https://us-central1-sutra-prod.cloudfunctions.net/partnerApi/v0';

  const allClasses: any[] = [];
  let nextCursor: string | undefined;

  do {
    let url = `${ARKETA_PROD_URL}/${ARKETA_PARTNER_ID}/classes?limit=400&start_date=${date}&end_date=${date}&include_cancelled=true&include_past=true&include_completed=true`;
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
  } while (nextCursor);

  let recordCount = 0;
  for (const cls of allClasses) {
    const startTime = cls.start_time;
    if (!startTime) continue;

    const name = cls.name || cls.class_name || 'Unknown Class';
    const instructorName = cls.instructor_name ||
      (cls.instructor ? `${cls.instructor.first_name || ''} ${cls.instructor.last_name || ''}`.trim() : null);
    const classDate = new Date(startTime).toISOString().split('T')[0];

    const { error } = await supabase
      .from('arketa_classes')
      .upsert({
        external_id: String(cls.id),
        name,
        start_time: startTime,
        class_date: classDate,
        duration_minutes: cls.duration_minutes ?? cls.duration ?? null,
        capacity: cls.capacity ?? cls.max_capacity ?? null,
        booked_count: cls.total_booked ?? cls.booked_count ?? 0,
        waitlist_count: cls.waitlist_count || 0,
        status: cls.status || 'scheduled',
        is_cancelled: cls.is_cancelled ?? cls.cancelled ?? cls.canceled ?? false,
        is_deleted: cls.deleted ?? false,
        room_name: cls.room?.name || null,
        location_id: cls.location_id ?? null,
        updated_at_api: cls.updated_at ?? cls.updatedAt ?? null,
        instructor_name: instructorName,
        description: cls.description ?? null,
        raw_data: cls,
        synced_at: new Date().toISOString(),
      }, { onConflict: 'external_id,class_date' });

    if (!error) recordCount++;
  }

  return recordCount;
}

// Sync Arketa reservations for a single date with pagination; writes to staging (then sync-from-staging -> history)
async function syncArketaReservations(supabase: any, date: string, syncBatchId?: string): Promise<number> {
  const ARKETA_API_KEY = Deno.env.get('ARKETA_API_KEY');
  const ARKETA_PARTNER_ID = Deno.env.get('ARKETA_PARTNER_ID');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const ARKETA_PROD_URL = 'https://us-central1-sutra-prod.cloudfunctions.net/partnerApi/v0';

  // Use OAuth token with API key fallback (matches working sync-arketa-reservations pattern)
  let headers: Record<string, string>;
  try {
    const { getArketaToken, getArketaHeaders } = await import('../_shared/arketaAuth.ts');
    const token = await getArketaToken(SUPABASE_URL!, SERVICE_ROLE_KEY!);
    headers = getArketaHeaders(token);
    console.log('[backfill-reservations] Using OAuth token');
  } catch (tokenError) {
    console.log('[backfill-reservations] OAuth failed, using API key fallback:', tokenError);
    headers = {
      'x-api-key': ARKETA_API_KEY!,
      'Content-Type': 'application/json',
    };
  }

  const allReservations: any[] = [];

  // Step 1: Fetch classes for this date (reservations are nested under classes)
  let classCursor: string | undefined;
  const allClasses: any[] = [];

  do {
    const classUrl = new URL(`${ARKETA_PROD_URL}/${ARKETA_PARTNER_ID}/classes`);
    classUrl.searchParams.set('limit', '400');
    classUrl.searchParams.set('start_date', date);
    classUrl.searchParams.set('end_date', date);
    classUrl.searchParams.set('include_cancelled', 'true');
    classUrl.searchParams.set('include_past', 'true');
    classUrl.searchParams.set('include_completed', 'true');
    if (classCursor) classUrl.searchParams.set('cursor', classCursor);

    console.log(`[backfill-reservations] Fetching classes: ${classUrl.toString()}`);
    const classResponse = await fetch(classUrl.toString(), { method: 'GET', headers });

    if (!classResponse.ok) {
      const status = classResponse.status;
      if (status === 429 || status >= 500) throw new RetryableError(`Arketa classes API error: ${status}`, status);
      throw new Error(`Arketa classes API error: ${status}`);
    }

    const classData = await classResponse.json();
    const classes = Array.isArray(classData) ? classData : (classData.items || classData.data || classData.classes || []);
    allClasses.push(...classes);
    classCursor = classData.pagination?.nextCursor;
  } while (classCursor);

  console.log(`[backfill-reservations] Found ${allClasses.length} classes for ${date}`);

  // Step 2: Fetch reservations for each class
  for (const cls of allClasses) {
    const classId = String(cls.id);
    const resUrl = new URL(`${ARKETA_PROD_URL}/${ARKETA_PARTNER_ID}/classes/${classId}/reservations`);

    try {
      const response = await fetch(resUrl.toString(), { method: 'GET', headers });
      if (!response.ok) {
        if (response.status === 404) continue; // Class may have been deleted
        console.warn(`[backfill-reservations] Error fetching reservations for class ${classId}: ${response.status}`);
        continue;
      }

      const responseData = await response.json();
      const reservations = Array.isArray(responseData)
        ? responseData
        : (responseData.items || responseData.data || responseData.reservations || responseData.bookings || []);

      // Enrich with class_id
      for (const res of reservations) {
        if (!res.class_id && !res.classId) res.class_id = classId;
        allReservations.push(res);
      }
      console.log(`[backfill-reservations] Class ${classId}: ${reservations.length} reservations`);
    } catch (fetchErr) {
      console.warn(`[backfill-reservations] Failed to fetch reservations for class ${classId}:`, fetchErr);
      continue;
    }
  }

  if (!allReservations.length) return 0;

  const checkedIn = (res: any) => res.checked_in === true || ['checked_in', 'ATTENDED', 'attended', 'completed', 'COMPLETED'].includes(res.status);
  const reservationId = (res: any) => res.id ?? res.booking_id ?? res.purchase_id ?? `${res.class_id ?? res.classId}-${res.client_id ?? res.client?.id}`;

  if (syncBatchId) {
    const classId = (res: any) => String(res.class_id ?? res.classId ?? '');
    const stagingRows = allReservations.map((res) => ({
      reservation_id: String(reservationId(res)),
      class_id: classId(res),
      client_id: res.client_id ?? res.client?.id ? String(res.client_id ?? res.client?.id) : null,
      reservation_type: res.reservation_type ?? res.type ?? null,
      class_name: res.class_name ?? res.className ?? null,
      class_date: date,
      status: res.status ?? 'booked',
      checked_in: checkedIn(res),
      checked_in_at: res.checked_in_at ?? res.checkedInAt ?? null,
      late_cancel: res.late_cancel ?? res.lateCancel ?? false,
      gross_amount_paid: res.gross_amount_paid ?? res.grossAmountPaid ?? null,
      net_amount_paid: res.net_amount_paid ?? res.netAmountPaid ?? null,
      created_at_api: res.created_at ?? null,
      updated_at_api: res.updated_at ?? res.updatedAt ?? null,
      spot_id: res.spot_id ?? null,
      spot_name: res.spot_name ?? null,
      client_email: res.client?.email ?? null,
      client_first_name: res.client?.first_name ?? res.client?.firstName ?? null,
      client_last_name: res.client?.last_name ?? res.client?.lastName ?? null,
      client_phone: res.client?.phone ?? null,
      raw_data: res,
      sync_batch_id: syncBatchId,
    }));
    const { error } = await supabase.from('arketa_reservations_staging').insert(stagingRows);
    if (error) throw new Error(`Staging insert failed: ${error.message}`);
    return stagingRows.length;
  }

  let recordCount = 0;
  const classId = (res: any) => String(res.class_id ?? res.classId ?? '');
  for (const res of allReservations) {
    const { error } = await supabase
      .from('arketa_reservations')
      .upsert({
        reservation_id: String(reservationId(res)),
        class_id: classId(res),
        client_id: res.client_id || res.client?.id ? String(res.client_id || res.client?.id) : null,
        reservation_type: res.reservation_type ?? res.type ?? 'class',
        class_name: res.class_name ?? res.className ?? null,
        class_date: date,
        status: res.status || 'booked',
        checked_in: checkedIn(res),
        checked_in_at: res.checked_in_at || res.checkedInAt || null,
        late_cancel: res.late_cancel ?? res.lateCancel ?? false,
        gross_amount_paid: res.gross_amount_paid ?? res.grossAmountPaid ?? null,
        net_amount_paid: res.net_amount_paid ?? res.netAmountPaid ?? null,
        created_at_api: res.created_at ?? null,
        updated_at_api: res.updated_at ?? res.updatedAt ?? null,
        spot_id: res.spot_id ?? null,
        spot_name: res.spot_name ?? null,
        client_email: res.client?.email ?? null,
        client_first_name: res.client?.first_name ?? res.client?.firstName ?? null,
        client_last_name: res.client?.last_name ?? res.client?.lastName ?? null,
        client_phone: res.client?.phone ?? null,
        raw_data: res,
        sync_batch_id: null,
      }, { onConflict: 'reservation_id,class_id' });
    if (!error) recordCount++;
  }
  return recordCount;
}

// Sync Arketa payments for a single date with pagination; writes to staging (then sync-from-staging -> history)
async function syncArketaPayments(supabase: any, date: string, syncBatchId?: string): Promise<number> {
  const ARKETA_API_KEY = Deno.env.get('ARKETA_API_KEY');
  const ARKETA_PARTNER_ID = Deno.env.get('ARKETA_PARTNER_ID');
  const ARKETA_PROD_URL = 'https://us-central1-sutra-prod.cloudfunctions.net/partnerApi/v0';

  const allPayments: any[] = [];
  let nextCursor: string | undefined;

  do {
    let url = `${ARKETA_PROD_URL}/${ARKETA_PARTNER_ID}/purchases?limit=400&start_date=${date}&end_date=${date}`;
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
  } while (nextCursor);

  if (!allPayments.length) return 0;

  if (syncBatchId) {
    const stagingRows = allPayments.map((p) => ({
      source_endpoint: 'purchases',
      payment_id: String(p.id ?? p.payment_id),
      arketa_payment_id: String(p.id ?? p.payment_id),
      client_id: p.client_id ?? p.clientId ?? p.client?.id ? String(p.client_id ?? p.clientId ?? p.client?.id) : null,
      amount: p.amount ?? p.price ?? p.total ?? 0,
      status: p.status ?? 'ACTIVE',
      description: p.description ?? p.name ?? null,
      payment_type: p.payment_type ?? p.type ?? null,
      category: p.category ?? null,
      offering_id: p.offering_id ?? p.offeringId ?? null,
      start_date: p.start_date ?? p.startDate ?? null,
      end_date: p.end_date ?? p.endDate ?? null,
      remaining_uses: p.remaining_uses ?? p.remainingUses ?? null,
      currency: p.currency ?? null,
      total_refunded: p.total_refunded ?? p.refunded ?? null,
      net_sales: p.net_sales ?? p.net_amount ?? null,
      transaction_fees: p.transaction_fees ?? p.fees ?? null,
      stripe_fees: p.stripe_fees ?? null,
      tax: p.tax ?? p.tax_amount ?? null,
      updated_at: p.updated_at ?? p.updatedAt ?? null,
      synced_at: new Date().toISOString(),
      sync_batch_id: syncBatchId,
    }));
    const { error } = await supabase.from('arketa_payments_staging').insert(stagingRows);
    if (error) throw new Error(`Payments staging insert failed: ${error.message}`);
    return stagingRows.length;
  }

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

// Sync ONE PAGE of Arketa clients to STAGING table with granular progress updates
interface ClientSyncResult {
  recordsProcessed: number;
  nextCursor: string | null;
  hasMore: boolean;
  totalInPage: number;
}

// Progress update batch size - update UI every N records
const PROGRESS_UPDATE_BATCH_SIZE = 5;

async function syncArketaClientsPageToStaging(
  supabase: any, 
  cursor: string | null,
  syncBatchId: string,
  jobId: string,
  currentRecordsProcessed: number
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
  let url = `${ARKETA_PROD_URL}/${ARKETA_PARTNER_ID}/clients?limit=400`;
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

  // Prepare staging records
  const stagingRecords = clients.map((client: any) => {
    // Build client name from available fields
    let clientName = client.name || null;
    if (!clientName) {
      const parts = [client.firstName, client.lastName].filter(Boolean);
      clientName = parts.length > 0 ? parts.join(' ') : null;
    }

    return {
      sync_batch_id: syncBatchId,
      arketa_client_id: String(client.id),
      client_email: client.email || null,
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
      staged_at: new Date().toISOString(),
    };
  });

  // Insert to staging in small batches (5 records) with progress updates
  let recordCount = 0;
  let runningTotal = currentRecordsProcessed;
  
  for (let i = 0; i < stagingRecords.length; i += PROGRESS_UPDATE_BATCH_SIZE) {
    const batch = stagingRecords.slice(i, i + PROGRESS_UPDATE_BATCH_SIZE);
    
    const { error } = await supabase
      .from('arketa_clients_staging')
      .insert(batch);

    if (!error) {
      recordCount += batch.length;
      runningTotal += batch.length;
      
      // Update job progress for real-time UI feedback
      await supabase
        .from('backfill_jobs')
        .update({ records_processed: runningTotal })
        .eq('id', jobId);
    } else {
      console.error(`[backfill] Staging insert error at ${i}: ${error.message}`);
    }
  }

  console.log(`[backfill] Staged ${recordCount} clients to staging table`);

  // Check pagination
  const nextCursor = responseData.pagination?.nextCursor || null;
  const apiHasMore = responseData.pagination?.hasMore;
  const hasMore = nextCursor ? (apiHasMore ?? clients.length === 400) : false;

  console.log(`[backfill] Staged ${recordCount} clients, hasMore: ${hasMore}, nextCursor: ${nextCursor ? 'yes' : 'no'}`);

  return {
    recordsProcessed: recordCount,
    nextCursor,
    hasMore: hasMore && clients.length > 0,
    totalInPage: clients.length,
  };
}

// Promote records from staging to production
async function promoteClientsStagingToProduction(
  supabase: any,
  syncBatchId: string,
  jobId: string
): Promise<number> {
  console.log(`[backfill] Promoting staging records for batch ${syncBatchId}`);
  
  // Fetch all staging records for this batch
  const { data: stagingRecords, error: fetchError } = await supabase
    .from('arketa_clients_staging')
    .select('*')
    .eq('sync_batch_id', syncBatchId);

  if (fetchError) {
    throw new Error(`Failed to fetch staging records: ${fetchError.message}`);
  }

  if (!stagingRecords || stagingRecords.length === 0) {
    console.log('[backfill] No staging records to promote');
    return 0;
  }

  console.log(`[backfill] Found ${stagingRecords.length} staging records to promote`);

  // Transform staging records to production format
  const productionRecords = stagingRecords.map((record: any) => ({
    external_id: record.arketa_client_id,
    client_email: record.client_email || '',
    client_name: record.client_name,
    client_phone: record.client_phone,
    client_tags: record.client_tags || [],
    custom_fields: record.custom_fields || {},
    referrer: record.referrer,
    email_mkt_opt_in: record.email_mkt_opt_in ?? false,
    sms_mkt_opt_in: record.sms_mkt_opt_in ?? false,
    date_of_birth: record.date_of_birth,
    lifecycle_stage: record.lifecycle_stage,
    raw_data: record.raw_data,
    last_synced_at: new Date().toISOString(),
  }));

  // Batch upsert to production in chunks of 400
  const BATCH_SIZE = 400;
  let promotedCount = 0;
  
  for (let i = 0; i < productionRecords.length; i += BATCH_SIZE) {
    const batch = productionRecords.slice(i, i + BATCH_SIZE);
    
    const { error } = await supabase
      .from('arketa_clients')
      .upsert(batch, { onConflict: 'external_id' });

    if (!error) {
      promotedCount += batch.length;
    } else {
      console.error(`[backfill] Production upsert error at ${i}: ${error.message}`);
    }
  }

  console.log(`[backfill] Promoted ${promotedCount} records to production`);

  // Clear staging table for this batch
  const { error: deleteError } = await supabase
    .from('arketa_clients_staging')
    .delete()
    .eq('sync_batch_id', syncBatchId);

  if (deleteError) {
    console.error(`[backfill] Failed to clear staging: ${deleteError.message}`);
  } else {
    console.log(`[backfill] Cleared staging table for batch ${syncBatchId}`);
  }

  // Mark staging_synced as true
  await supabase
    .from('backfill_jobs')
    .update({ staging_synced: true })
    .eq('id', jobId);

  return promotedCount;
}

// Sync Sling shifts for a single date
async function syncSlingShifts(supabase: any, date: string, _syncBatchId?: string): Promise<number> {
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

  let body: BackfillRequest;
  try {
    body = (await req.json()) as BackfillRequest;
    if (!body || typeof body !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON in request body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { api_source, data_type, start_date, end_date, job_id, action } = body;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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
            JSON.stringify({
              error: 'Job not found',
              job_id,
              error_message: fetchError?.message ?? (existingJob ? null : 'No row returned'),
              code: fetchError?.code ?? null,
            }),
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
            JSON.stringify({
              error: 'Job not found',
              job_id,
              error_message: fetchError?.message ?? (existingJob ? null : 'No row returned'),
              code: fetchError?.code ?? null,
            }),
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

    // Validate required fields: when creating new job (no job_id) need all; when continuing (job_id) only job_id is required
    if (!job_id && (!api_source || !data_type || !start_date || !end_date)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: api_source, data_type, start_date, end_date' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let job: BackfillJob;
    let syncBatchId: string;

    // Resume existing job or create new one
    if (job_id) {
      const { data: existingJob, error } = await supabase
        .from('backfill_jobs')
        .select('*')
        .eq('id', job_id)
        .single();

      if (error || !existingJob) {
        return new Response(
          JSON.stringify({
            error: 'Job not found',
            job_id,
            error_message: error?.message ?? (existingJob ? null : 'No row returned'),
            code: error?.code ?? null,
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      job = existingJob as BackfillJob;
      // For clients, extract sync_batch_id from last_cursor if available, or generate new one
      syncBatchId = job.last_cursor?.startsWith('batch:') 
        ? job.last_cursor.split('batch:')[1].split('|')[0] 
        : generateUUID();
    } else {
      // Create new job
      syncBatchId = generateUUID();
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

    // Use job's date range so continue/self-invoke only needs job_id and action
    const effectiveStart = job.start_date;
    const effectiveEnd = job.end_date;

    // #region agent log
    console.log(JSON.stringify({ _debug: true, hypothesisId: 'C', location: 'backfill-historical', message: 'Effective date range', job_start_date: job.start_date, job_end_date: job.end_date, effectiveStart, effectiveEnd, job_id: job.id }));
    // #endregion

    // Update status to running
    await supabase
      .from('backfill_jobs')
      .update({ 
        status: 'running', 
        started_at: job.started_at || new Date().toISOString(),
        retry_scheduled_at: null, // Clear any scheduled retry
      })
      .eq('id', job.id);

    // Get rate limit from api_endpoints using endpoint type mapping (use job so continue works with only job_id)
    const lookupType = endpointTypeMap[job.data_type] || job.data_type;
    const endpointConfig = await getApiEndpointConfig(supabase, job.api_source, lookupType);
    const rateLimitPerMin = endpointConfig?.rateLimitPerMin || 60;
    const delayMs = Math.ceil(60000 / rateLimitPerMin);

    console.log(`[Backfill] Starting job ${job.id}: ${job.api_source}/${job.data_type} from ${effectiveStart} to ${effectiveEnd}`);
    console.log(`[Backfill] Rate limit: ${rateLimitPerMin}/min, delay: ${delayMs}ms`);

    // Determine which sync function to use
    let syncFunction: (supabase: any, date: string, syncBatchId?: string) => Promise<number>;
    
    switch (`${job.api_source}_${job.data_type}`) {
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
      case 'arketa_clients': {
        // Special handling for clients - staging table workflow with granular progress
        logger.info('Starting resumable clients sync with staging table', { syncBatchId });

        // Extract cursor from last_cursor (format: "batch:<uuid>|cursor:<api_cursor>")
        let apiCursor: string | null = null;
        if (job.last_cursor && job.last_cursor.includes('|cursor:')) {
          apiCursor = job.last_cursor.split('|cursor:')[1] || null;
        }
        
        let totalRecords = job.records_processed || 0;
        let pageCount = 0;
        let hasMorePages = true;
        // Per-invocation limit so we can pause and schedule continuation (avoids timeout; total data is unbounded)
        const MAX_PAGES_PER_INVOCATION = 200;

        try {
          while (hasMorePages && pageCount < MAX_PAGES_PER_INVOCATION) {
            // Sync a single page to staging - with internal retries
            let pageResult: ClientSyncResult | null = null;
            let retryCount = 0;
            const maxRetries = 3;
            
            while (!pageResult && retryCount < maxRetries) {
              try {
                pageResult = await syncArketaClientsPageToStaging(
                  supabase, 
                  apiCursor,
                  syncBatchId,
                  job.id,
                  totalRecords
                );
              } catch (pageError) {
                retryCount++;
                const errorMessage = pageError instanceof Error ? pageError.message : String(pageError);
                logger.info(`Page ${pageCount + 1} attempt ${retryCount} failed: ${errorMessage}`);
                
                if (retryCount >= maxRetries) {
                  throw pageError;
                }
                
                // Wait before retry with exponential backoff
                await delay(Math.min(2000 * Math.pow(2, retryCount - 1), 15000));
              }
            }

            if (!pageResult) {
              throw new Error('Failed to fetch page after retries');
            }

            totalRecords += pageResult.recordsProcessed;
            apiCursor = pageResult.nextCursor;
            hasMorePages = pageResult.hasMore;
            pageCount++;

            // Store cursor in combined format for resumability
            const combinedCursor = `batch:${syncBatchId}|cursor:${apiCursor || ''}`;
            
            await supabase
              .from('backfill_jobs')
              .update({
                records_processed: totalRecords,
                last_cursor: combinedCursor,
                days_processed: hasMorePages ? 0 : 1,
              })
              .eq('id', job.id);

            logger.info(`Page ${pageCount}: ${pageResult.recordsProcessed} records staged (total: ${totalRecords})`);

            // Small delay between pages for rate limiting
            if (hasMorePages) {
              await delay(500);
            }
          }

          if (hasMorePages) {
            // More pages to process - schedule continuation in 3 minutes
            const retryTime = new Date(Date.now() + 3 * 60 * 1000).toISOString();
            const combinedCursor = `batch:${syncBatchId}|cursor:${apiCursor || ''}`;
            
            await supabase
              .from('backfill_jobs')
              .update({
                status: 'running',
                retry_scheduled_at: retryTime,
                last_cursor: combinedCursor,
              })
              .eq('id', job.id);

            logger.info(`Clients sync paused for rate limit, will continue at ${retryTime}. Total staged: ${totalRecords}`);

            return new Response(
              JSON.stringify({
                success: true,
                job_id: job.id,
                status: 'running',
                phase: 'fetching',
                records_processed: totalRecords,
                has_more: true,
                retry_scheduled_at: retryTime,
                message: 'Sync will continue automatically in 3 minutes',
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // All pages fetched - now promote from staging to production
          logger.info('All pages fetched, promoting to production...');
          
          const promotedCount = await promoteClientsStagingToProduction(supabase, syncBatchId, job.id);

          // Mark as completed
          await supabase
            .from('backfill_jobs')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              days_processed: 1,
              records_processed: totalRecords,
              last_cursor: null,
              retry_scheduled_at: null,
              staging_synced: true,
            })
            .eq('id', job.id);

          logger.info(`Clients sync completed: ${totalRecords} staged, ${promotedCount} promoted`);

          return new Response(
            JSON.stringify({
              success: true,
              job_id: job.id,
              status: 'completed',
              phase: 'complete',
              days_processed: 1,
              records_processed: totalRecords,
              records_promoted: promotedCount,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        } catch (err) {
          // Handle error - schedule retry in 3 minutes
          const errorMessage = err instanceof Error ? err.message : String(err);
          const delayMs = getSuggestedDelayFromMessage(errorMessage);
          const retryTime = new Date(Date.now() + delayMs).toISOString();
          const combinedCursor = `batch:${syncBatchId}|cursor:${apiCursor || ''}`;
          
          await supabase
            .from('backfill_jobs')
            .update({
              status: 'running',
              retry_scheduled_at: retryTime,
              last_cursor: combinedCursor,
              errors: [...(job.errors || []), { 
                error: errorMessage, 
                timestamp: new Date().toISOString(),
                cursor: apiCursor,
              }],
            })
            .eq('id', job.id);

          logger.error(`Clients sync error, will retry at ${retryTime} (delay ${delayMs}ms)`, err instanceof Error ? err : new Error(String(err)));

          return new Response(
            JSON.stringify({
              success: false,
              job_id: job.id,
              status: 'running',
              phase: 'fetching',
              records_processed: totalRecords,
              error: errorMessage,
              retry_scheduled_at: retryTime,
              message: `Sync will retry automatically in ${Math.round(delayMs / 1000)}s`,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      default:
        throw new Error(`Unsupported sync type: ${api_source}_${data_type}`);
    }

    // Process day by day for other data types (max 5 dates per invocation to avoid timeout)
    const DATES_PER_INVOCATION = 5;
    const stagingSyncBatchId = (job.data_type === 'reservations' || job.data_type === 'payments') ? generateUUID() : undefined;
    let currentDate = job.processing_date || effectiveStart;
    let daysProcessed = job.days_processed;
    let recordsProcessed = job.records_processed;
    let datesProcessedThisInvocation = 0;
    let totalRetries = 0;
    const errors: any[] = Array.isArray(job.errors) ? [...job.errors] : [];

    logger.info(`Starting processing from ${currentDate} to ${effectiveEnd}`);

    while (currentDate <= effectiveEnd && datesProcessedThisInvocation < DATES_PER_INVOCATION) {
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
          () => syncFunction(supabase, currentDate, stagingSyncBatchId),
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

      datesProcessedThisInvocation++;
      // Move to next day
      currentDate = addDays(currentDate, 1);

      // Rate limit delay
      if (currentDate <= effectiveEnd && datesProcessedThisInvocation < DATES_PER_INVOCATION) {
        await delay(delayMs);
      }
    }

    // Transfer staging -> history when using staging (reservations/payments)
    if (stagingSyncBatchId && (job.data_type === 'reservations' || job.data_type === 'payments')) {
      const syncFromStagingApi = job.data_type === 'reservations' ? 'arketa_reservations' : 'arketa_payments';
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const syncFromStagingUrl = `${supabaseUrl}/functions/v1/sync-from-staging`;
      try {
        const syncRes = await fetch(syncFromStagingUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({
            api: syncFromStagingApi,
            sync_batch_id: stagingSyncBatchId,
            clear_staging: true,
          }),
        });
        if (!syncRes.ok) {
          const msg = `sync-from-staging returned ${syncRes.status}${syncRes.status === 404 ? ' (deploy: supabase functions deploy sync-from-staging)' : ''}`;
          errors.push({ date: 'staging', error: msg, timestamp: new Date().toISOString() });
          await supabase.from('backfill_jobs').update({ errors }).eq('id', job.id);
          logger.warn('sync-from-staging failed', { status: syncRes.status });
        }
      } catch (fetchErr) {
        const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
        errors.push({ date: 'staging', error: `sync-from-staging failed: ${msg}`, timestamp: new Date().toISOString() });
        await supabase.from('backfill_jobs').update({ errors }).eq('id', job.id);
        logger.warn('sync-from-staging failed', fetchErr instanceof Error ? { message: fetchErr.message } : undefined);
      }
    }

    // More dates remain: update job and self-invoke for next batch
    if (currentDate <= effectiveEnd) {
      await supabase
        .from('backfill_jobs')
        .update({
          processing_date: currentDate,
          days_processed: daysProcessed,
          records_processed: recordsProcessed,
          errors,
          retry_scheduled_at: new Date(Date.now() + 3000).toISOString(),
        })
        .eq('id', job.id);

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const functionUrl = `${supabaseUrl}/functions/v1/backfill-historical`;
      try {
        const continueRes = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({ job_id: job.id, action: 'continue' }),
        });
        if (!continueRes.ok) {
          const msg = `Continue batch returned ${continueRes.status}${continueRes.status === 404 ? ' (backfill-historical not found - deploy to this project)' : ''}`;
          const nextErrors = [...errors, { date: 'continue', error: msg, timestamp: new Date().toISOString() }];
          await supabase.from('backfill_jobs').update({ errors: nextErrors, status: 'failed' }).eq('id', job.id);
          logger.error('Self-invoke failed', { status: continueRes.status });
          return new Response(
            JSON.stringify({ error: msg, job_id: job.id, status: 'failed' }),
            { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (fetchErr) {
        const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
        const nextErrors = [...errors, { date: 'continue', error: `Continue batch failed: ${msg}`, timestamp: new Date().toISOString() }];
        await supabase.from('backfill_jobs').update({ errors: nextErrors, status: 'failed' }).eq('id', job.id);
        logger.error('Self-invoke failed', fetchErr);
        return new Response(
          JSON.stringify({ error: `Continue batch failed: ${msg}`, job_id: job.id, status: 'failed' }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          job_id: job.id,
          status: 'running',
          days_processed: daysProcessed,
          records_processed: recordsProcessed,
          message: 'Batch complete, more dates scheduled',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    // Log to api_logs for Sync Log History (aligned with other sync functions)
    const logApiName = job.data_type === 'reservations' ? 'arketa_reservations' : job.data_type === 'payments' ? 'arketa_payments' : `arketa_${job.data_type}`;
    await supabase.from('api_logs').insert({
      api_name: logApiName,
      endpoint: 'backfill-historical',
      sync_success: true,
      records_processed: recordsProcessed,
      records_inserted: recordsProcessed,
      triggered_by: 'backfill-job',
    }).then(({ error: logErr }) => { if (logErr) logger.warn('api_logs insert failed', logErr); });

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
    // Log failure to api_logs for Sync Log History
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabaseForLog = createClient(supabaseUrl, supabaseKey);
      await supabaseForLog.from('api_logs').insert({
        api_name: 'backfill-historical',
        endpoint: 'backfill-historical',
        sync_success: false,
        records_processed: 0,
        records_inserted: 0,
        error_message: errorMessage,
        triggered_by: 'backfill-job',
      });
    } catch (_) { /* ignore */ }
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

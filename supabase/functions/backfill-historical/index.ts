import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { getApiEndpointConfig } from '../_shared/apiEndpoints.ts';

interface BackfillRequest {
  api_source: 'arketa' | 'sling';
  data_type: 'classes' | 'reservations' | 'payments' | 'shifts' | 'users' | 'clients';
  start_date: string;
  end_date: string;
  job_id?: string;
  action?: 'pause' | 'cancel' | 'resume';
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

// Sync Arketa classes for a single date
async function syncArketaClasses(supabase: any, date: string): Promise<number> {
  const ARKETA_API_KEY = Deno.env.get('ARKETA_API_KEY');
  const ARKETA_PARTNER_ID = Deno.env.get('ARKETA_PARTNER_ID');
  const ARKETA_PROD_URL = 'https://us-central1-sutra-prod.cloudfunctions.net/partnerApi/v0';

  const url = `${ARKETA_PROD_URL}/${ARKETA_PARTNER_ID}/classes?limit=500&start_date=${date}&end_date=${date}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-api-key': ARKETA_API_KEY!,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Arketa API error: ${response.status}`);
  }

  const responseData = await response.json();
  const classes = Array.isArray(responseData) 
    ? responseData 
    : (responseData.classes || responseData.data || []);

  let recordCount = 0;
  for (const cls of classes) {
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

// Sync Arketa reservations for a single date
async function syncArketaReservations(supabase: any, date: string): Promise<number> {
  const ARKETA_API_KEY = Deno.env.get('ARKETA_API_KEY');
  const ARKETA_PARTNER_ID = Deno.env.get('ARKETA_PARTNER_ID');
  const ARKETA_PROD_URL = 'https://us-central1-sutra-prod.cloudfunctions.net/partnerApi/v0';

  const url = `${ARKETA_PROD_URL}/${ARKETA_PARTNER_ID}/reservations?limit=500&start_date=${date}&end_date=${date}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-api-key': ARKETA_API_KEY!,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Arketa API error: ${response.status}`);
  }

  const responseData = await response.json();
  const reservations = Array.isArray(responseData) 
    ? responseData 
    : (responseData.reservations || responseData.data || []);

  let recordCount = 0;
  for (const res of reservations) {
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

// Sync Arketa payments for a single date
async function syncArketaPayments(supabase: any, date: string): Promise<number> {
  const ARKETA_API_KEY = Deno.env.get('ARKETA_API_KEY');
  const ARKETA_PARTNER_ID = Deno.env.get('ARKETA_PARTNER_ID');
  const ARKETA_PROD_URL = 'https://us-central1-sutra-prod.cloudfunctions.net/partnerApi/v0';

  const url = `${ARKETA_PROD_URL}/${ARKETA_PARTNER_ID}/purchases?limit=500&start_date=${date}&end_date=${date}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-api-key': ARKETA_API_KEY!,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Arketa API error: ${response.status}`);
  }

  const responseData = await response.json();
  const payments = Array.isArray(responseData) 
    ? responseData 
    : (responseData.purchases || responseData.payments || responseData.data || []);

  let recordCount = 0;
  for (const payment of payments) {
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

// Sync Arketa clients for a single date (fetches all clients, not date-filtered)
async function syncArketaClients(supabase: any, _date: string): Promise<number> {
  const ARKETA_API_KEY = Deno.env.get('ARKETA_API_KEY');
  const ARKETA_PARTNER_ID = Deno.env.get('ARKETA_PARTNER_ID');
  const ARKETA_DEV_URL = 'https://us-central1-sutra-prod.cloudfunctions.net/partnerApiDev/v0';

  const url = `${ARKETA_DEV_URL}/${ARKETA_PARTNER_ID}/clients?limit=500`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-api-key': ARKETA_API_KEY!,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Arketa API error: ${response.status}`);
  }

  const responseData = await response.json();
  const clients = Array.isArray(responseData) 
    ? responseData 
    : (responseData.clients || responseData.data || []);

  let recordCount = 0;
  for (const client of clients) {
    const fullName = [client.firstName, client.lastName]
      .filter(Boolean)
      .join(' ') || null;

    const { error } = await supabase
      .from('arketa_clients')
      .upsert({
        external_id: String(client.id),
        email: client.email || '',
        first_name: client.firstName || null,
        last_name: client.lastName || null,
        full_name: fullName,
        phone: client.phone || null,
        join_date: client.createdAt ? new Date(client.createdAt).toISOString() : null,
        external_trainer_id: client.trainer?.id || null,
        avatar_url: client.avatar || null,
        membership_tier: 'basic',
        raw_data: client,
        last_synced_at: new Date().toISOString(),
      }, { onConflict: 'external_id' });

    if (!error) recordCount++;
  }

  return recordCount;
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
    throw new Error(`Sling API error: ${response.status}`);
  }

  const roster = await response.json();
  const shifts = Array.isArray(roster) ? roster : [];

  let recordCount = 0;
  for (const shift of shifts) {
    if (!shift.dtstart || !shift.dtend) continue;

    const shiftDate = new Date(shift.dtstart).toISOString().split('T')[0];

    const { error } = await supabase
      .from('staff_shifts')
      .upsert({
        sling_shift_id: shift.id,
        sling_user_id: shift.user?.id || 0,
        external_id: String(shift.id),
        user_name: shift.user?.name || 'Unknown',
        user_email: shift.user?.email || null,
        position: shift.position?.name || null,
        location: shift.location?.name || null,
        shift_start: shift.dtstart,
        shift_end: shift.dtend,
        shift_date: shiftDate,
        status: shift.status || 'scheduled',
        raw_data: shift,
        synced_at: new Date().toISOString(),
      }, { onConflict: 'sling_shift_id' });

    if (!error) recordCount++;
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

    // Handle pause/cancel/resume actions
    if (action && job_id) {
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
      .update({ status: 'running', started_at: job.started_at || new Date().toISOString() })
      .eq('id', job.id);

    // Get rate limit from api_endpoints
    const endpointConfig = await getApiEndpointConfig(supabase, api_source, data_type);
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
      case 'arketa_clients':
        syncFunction = syncArketaClients;
        break;
      case 'sling_shifts':
        syncFunction = syncSlingShifts;
        break;
      default:
        throw new Error(`Unsupported sync type: ${api_source}_${data_type}`);
    }

    // Process day by day
    let currentDate = job.processing_date || start_date;
    let daysProcessed = job.days_processed;
    let recordsProcessed = job.records_processed;
    const errors: any[] = Array.isArray(job.errors) ? [...job.errors] : [];

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
        console.log(`[Backfill] Processing ${currentDate}...`);
        const records = await syncFunction(supabase, currentDate);
        recordsProcessed += records;
        daysProcessed++;

        // Update progress
        await supabase
          .from('backfill_jobs')
          .update({
            processing_date: addDays(currentDate, 1),
            days_processed: daysProcessed,
            records_processed: recordsProcessed,
          })
          .eq('id', job.id);

        console.log(`[Backfill] ${currentDate}: ${records} records synced`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        errors.push({
          date: currentDate,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        });

        await supabase
          .from('backfill_jobs')
          .update({ errors })
          .eq('id', job.id);

        console.error(`[Backfill] Error on ${currentDate}: ${errorMessage}`);
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

    console.log(`[Backfill] Job ${job.id} completed: ${daysProcessed} days, ${recordsProcessed} records`);

    return new Response(
      JSON.stringify({
        success: true,
        job_id: job.id,
        status: 'completed',
        days_processed: daysProcessed,
        records_processed: recordsProcessed,
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

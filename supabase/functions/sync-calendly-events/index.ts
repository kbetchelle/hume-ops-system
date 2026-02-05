import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { fetchWithRetry, withRetry, isRetryableSupabaseError } from '../_shared/retry.ts';
import { createSyncLogger, logSyncMetrics } from '../_shared/logger.ts';
import { logApiCall } from '../_shared/apiLogger.ts';

interface CalendlyEvent {
  uri: string;
  name?: string;
  status: string;
  start_time: string;
  end_time: string;
  event_type?: string;
  location?: {
    type?: string;
    location?: string;
  };
  invitees_counter?: {
    total?: number;
    active?: number;
    limit?: number;
  };
  created_at?: string;
  updated_at?: string;
}

interface CalendlyInvitee {
  uri: string;
  email: string;
  name: string;
  status: string;
  questions_and_answers?: Array<{
    question: string;
    answer: string;
    position?: number;
  }>;
  timezone?: string;
  created_at?: string;
  updated_at?: string;
  cancel_url?: string;
  reschedule_url?: string;
}

interface ApiPagination {
  count?: number;
  next_page?: string;
  next_page_token?: string;
  previous_page?: string;
  previous_page_token?: string;
}

interface EventsApiResponse {
  collection?: CalendlyEvent[];
  pagination?: ApiPagination;
}

interface InviteesApiResponse {
  collection?: CalendlyInvitee[];
  pagination?: ApiPagination;
}

interface SyncRequest {
  limit?: number;
  cursor?: string;
  min_start_time?: string;
  max_start_time?: string;
}

// Extract UUID from Calendly URI
function extractUuidFromUri(uri: string): string {
  const parts = uri.split('/');
  return parts[parts.length - 1];
}

// Extract phone from questions and answers
function extractPhone(questionsAnswers?: Array<{ question: string; answer: string }>): string | null {
  if (!questionsAnswers) return null;
  
  const phoneQuestion = questionsAnswers.find(qa => 
    qa.question.toLowerCase().includes('phone') || 
    qa.question.toLowerCase().includes('number')
  );
  
  return phoneQuestion?.answer || null;
}

// Extract notes from questions and answers
function extractNotes(questionsAnswers?: Array<{ question: string; answer: string }>): string | null {
  if (!questionsAnswers || questionsAnswers.length === 0) return null;
  
  return questionsAnswers
    .map(qa => `${qa.question}: ${qa.answer}`)
    .join('\n');
}

// Transform event+invitee to staging format
function transformToStaging(event: CalendlyEvent, invitee: CalendlyInvitee): Record<string, unknown> {
  return {
    calendly_event_id: extractUuidFromUri(event.uri),
    event_uri: event.uri,
    event_type: event.event_type || event.name || 'Tour',
    start_time: event.start_time,
    end_time: event.end_time,
    status: invitee.status === 'canceled' ? 'canceled' : event.status,
    invitee_name: invitee.name,
    invitee_email: invitee.email,
    invitee_phone: extractPhone(invitee.questions_and_answers),
    invitee_questions_answers: invitee.questions_and_answers || null,
    raw_event_data: event,
    raw_invitee_data: invitee,
  };
}

// Transform staging to target format
function transformStagingToTarget(staging: Record<string, unknown>): Record<string, unknown> {
  const startTime = staging.start_time as string;
  const tourDate = startTime.split('T')[0];
  
  return {
    calendly_event_id: staging.calendly_event_id,
    tour_date: tourDate,
    event_type: staging.event_type,
    start_time: staging.start_time,
    end_time: staging.end_time,
    guest_name: staging.invitee_name,
    guest_email: staging.invitee_email,
    guest_phone: staging.invitee_phone,
    status: staging.status,
    notes: extractNotes(staging.invitee_questions_answers as Array<{ question: string; answer: string }> | undefined),
    assigned_to: null,
    last_synced_at: new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const CALENDLY_ACCESS_TOKEN = Deno.env.get('CALENDLY_API_KEY');
    let CALENDLY_ORGANIZATION_URI = Deno.env.get('CALENDLY_ORGANIZATION_URI');

    if (!CALENDLY_ACCESS_TOKEN || !CALENDLY_ORGANIZATION_URI) {
      return new Response(
        JSON.stringify({ error: 'Calendly API credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure organization URI is in full format
    if (!CALENDLY_ORGANIZATION_URI.startsWith('https://')) {
      CALENDLY_ORGANIZATION_URI = `https://api.calendly.com/organizations/${CALENDLY_ORGANIZATION_URI}`;
    }

    const logger = createSyncLogger('calendly_events');
    const startTime = Date.now();

    const body = await req.json().catch(() => ({})) as SyncRequest;
    const limit = body.limit || 100;

    // Default to events from 7 days ago to 90 days in the future
    const minStartTime = body.min_start_time || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const maxStartTime = body.max_start_time || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    logger.info(`Syncing Calendly events (limit: ${limit})`);

    const headers = {
      'Authorization': `Bearer ${CALENDLY_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    };

    // Fetch scheduled events with pagination
    let allEvents: CalendlyEvent[] = [];
    let cursor: string | null = body.cursor || null;
    let totalAttempts = 0;

    while (true) {
      let url = `https://api.calendly.com/scheduled_events?organization=${encodeURIComponent(CALENDLY_ORGANIZATION_URI)}&count=${limit}&min_start_time=${minStartTime}&max_start_time=${maxStartTime}`;
      if (cursor) {
        url += `&page_token=${cursor}`;
      }

      try {
        const { response, attempts } = await fetchWithRetry(url, {
          method: 'GET',
          headers,
        }, {
          maxAttempts: 3,
          baseDelayMs: 1000,
          maxDelayMs: 10000,
          timeoutMs: 30000,
        });
        totalAttempts += attempts;

        if (!response.ok) {
          const errorText = await response.text();
          logger.error(`API request failed: ${response.status}`, { error: errorText });
          break;
        }

        const data: EventsApiResponse = await response.json();
        const events = data.collection || [];
        
        if (events.length > 0) {
          allEvents = [...allEvents, ...events];
          logger.info(`Fetched ${events.length} events (total: ${allEvents.length})`);
        }

        // Check for more pages
        cursor = data.pagination?.next_page_token || null;
        if (!cursor || events.length === 0) {
          break;
        }

        // Safety limit: 1,000 events
        if (allEvents.length >= 1000) {
          logger.warn('Reached safety limit of 1,000 events');
          break;
        }
      } catch (error) {
        logger.error('Failed to fetch events', error);
        break;
      }
    }

    logger.info(`Total fetched: ${allEvents.length} events after ${totalAttempts} API attempts`);

    // For each event, fetch invitee details and insert to staging
    let stagingInserted = 0;
    let stagingFailed = 0;

    for (const event of allEvents) {
      try {
        // Fetch invitees for this event
        const eventUuid = extractUuidFromUri(event.uri);
        const inviteesUrl = `https://api.calendly.com/scheduled_events/${eventUuid}/invitees?count=100`;

        const { response: inviteesResponse } = await fetchWithRetry(inviteesUrl, {
          method: 'GET',
          headers,
        }, {
          maxAttempts: 2,
          baseDelayMs: 500,
          maxDelayMs: 5000,
          timeoutMs: 15000,
        });

        if (!inviteesResponse.ok) {
          logger.warn(`Failed to fetch invitees for event ${eventUuid}`);
          stagingFailed++;
          continue;
        }

        const inviteesData: InviteesApiResponse = await inviteesResponse.json();
        const invitees = inviteesData.collection || [];

        if (invitees.length === 0) {
          logger.warn(`No invitees found for event ${eventUuid}`);
          continue;
        }

        // Insert each invitee as a separate staging record
        for (const invitee of invitees) {
          const stagingRecord = transformToStaging(event, invitee);

          const { result } = await withRetry(
            async () => {
              const { error } = await supabase
                .from('scheduled_tours_staging')
                .upsert(stagingRecord, {
                  onConflict: 'calendly_event_id',
                });

              if (error && !isRetryableSupabaseError(error)) {
                throw error;
              }
              return { error };
            },
            { maxAttempts: 2 },
            `upsert staging event ${eventUuid}`
          );

          if (result.error) {
            logger.error(`Failed to insert staging event ${eventUuid}`, result.error);
            stagingFailed++;
          } else {
            stagingInserted++;
          }
        }
      } catch (error) {
        logger.error(`Error processing event ${event.uri}`, error);
        stagingFailed++;
      }
    }

    logger.info(`Staging complete: ${stagingInserted} inserted, ${stagingFailed} failed`);

    // Transform staging to target table
    const { data: stagingRecords, error: stagingError } = await supabase
      .from('scheduled_tours_staging')
      .select('*');

    if (stagingError) {
      logger.error('Failed to fetch staging records', stagingError);
      throw stagingError;
    }

    let targetInserted = 0;
    let targetFailed = 0;

    for (const staging of stagingRecords || []) {
      try {
        const targetRecord = transformStagingToTarget(staging as Record<string, unknown>);

        const { result } = await withRetry(
          async () => {
            const { error } = await supabase
              .from('scheduled_tours')
              .upsert(targetRecord, {
                onConflict: 'calendly_event_id',
              });

            if (error && !isRetryableSupabaseError(error)) {
              throw error;
            }
            return { error };
          },
          { maxAttempts: 2 },
          `upsert target tour ${staging.calendly_event_id}`
        );

        if (result.error) {
          logger.error(`Failed to upsert target tour ${staging.calendly_event_id}`, result.error);
          targetFailed++;
        } else {
          targetInserted++;
        }
      } catch (error) {
        logger.error(`Error transforming tour ${staging.calendly_event_id}`, error);
        targetFailed++;
      }
    }

    logger.info(`Target complete: ${targetInserted} upserted, ${targetFailed} failed`);

    // Clear staging table after successful transformation
    if (targetFailed === 0) {
      await supabase.from('scheduled_tours_staging').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      logger.info('Staging table cleared');
    }

    // Log sync metrics
    const durationMs = Date.now() - startTime;
    await logSyncMetrics(supabase, {
      syncType: 'calendly_events',
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs,
      recordsFetched: allEvents.length,
      recordsSynced: targetInserted,
      recordsFailed: targetFailed,
      retryCount: Math.max(0, totalAttempts - 1),
    });

    // Log to api_logs table for UI visibility
    await logApiCall(supabase, {
      apiName: 'calendly_events',
      endpoint: '/scheduled_events',
      syncSuccess: targetFailed === 0,
      durationMs,
      recordsProcessed: allEvents.length,
      recordsInserted: targetInserted,
      responseStatus: 200,
      triggeredBy: 'scheduled',
    });

    // Update sync status
    await supabase
      .from('api_sync_status')
      .upsert({
        api_name: 'calendly_events',
        last_sync_at: new Date().toISOString(),
        last_sync_success: targetFailed === 0,
        last_records_processed: allEvents.length,
        last_records_inserted: targetInserted,
      }, { onConflict: 'api_name' });

    return new Response(
      JSON.stringify({
        success: true,
        eventsFetched: allEvents.length,
        stagingInserted,
        targetInserted,
        failedCount: targetFailed,
        apiAttempts: totalAttempts,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const logger = createSyncLogger('calendly_events');
    logger.error('Sync failed', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    // Log failure to api_logs
    await logApiCall(supabase, {
      apiName: 'calendly_events',
      endpoint: '/scheduled_events',
      syncSuccess: false,
      durationMs: 0,
      recordsProcessed: 0,
      recordsInserted: 0,
      errorMessage,
      triggeredBy: 'scheduled',
    });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

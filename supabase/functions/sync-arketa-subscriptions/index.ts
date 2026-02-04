import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { fetchWithRetry, withRetry, isRetryableSupabaseError } from '../_shared/retry.ts';
import { getArketaToken, getArketaHeaders, getArketaApiKeyHeaders, ARKETA_URLS } from '../_shared/arketaAuth.ts';
import { createSyncLogger, logSyncMetrics } from '../_shared/logger.ts';

interface ArketaSubscription {
  id?: string;
  subscription_id?: string;
  client_id?: string;
  client_email?: string;
  type?: string;
  offering_id?: string;
  status?: string;
  name?: string;
  start_date?: string;
  end_date?: string;
  remaining_uses?: number;
  price?: number;
  api_updated_at?: string;
  cancellation_date?: string;
  pause_start_date?: string;
  cancel_at_date?: string;
  pause_end_date?: string;
  next_renewal_date?: string;
  has_payment_method?: boolean | string;
  substatus?: string;
}

interface ApiPagination {
  nextCursor?: string;
  next_cursor?: string;
  hasMore?: boolean;
  has_more?: boolean;
}

interface ApiResponse {
  items?: ArketaSubscription[];
  data?: ArketaSubscription[];
  subscriptions?: ArketaSubscription[];
  pagination?: ApiPagination;
}

interface SyncRequest {
  status?: string;
  limit?: number;
  cursor?: string;
}

// Transform subscription from API format to database format
function transformSubscription(raw: ArketaSubscription): Record<string, unknown> {
  return {
    external_id: String(raw.subscription_id || raw.id),
    client_id: raw.client_id,
    client_email: raw.client_email,
    type: raw.type,
    offering_id: raw.offering_id,
    status: raw.status,
    name: raw.name,
    start_date: raw.start_date,
    end_date: raw.end_date,
    remaining_uses: raw.remaining_uses != null ? Number(raw.remaining_uses) : null,
    price: raw.price != null ? Number(raw.price) : null,
    api_updated_at: raw.api_updated_at,
    cancellation_date: raw.cancellation_date || null,
    pause_start_date: raw.pause_start_date || null,
    cancel_at_date: raw.cancel_at_date || null,
    pause_end_date: raw.pause_end_date || null,
    next_renewal_date: raw.next_renewal_date || null,
    has_payment_method: raw.has_payment_method === true || raw.has_payment_method === 'true',
    substatus: raw.substatus || null,
    raw_data: raw,
    synced_at: new Date().toISOString(),
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

    const ARKETA_API_KEY = Deno.env.get('ARKETA_API_KEY');
    const ARKETA_PARTNER_ID = Deno.env.get('ARKETA_PARTNER_ID');

    if (!ARKETA_API_KEY || !ARKETA_PARTNER_ID) {
      return new Response(
        JSON.stringify({ error: 'Arketa API credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const logger = createSyncLogger('arketa_subscriptions');
    const startTime = Date.now();

    const body = await req.json().catch(() => ({})) as SyncRequest;
    const limit = body.limit || 100;
    const statusFilter = body.status || 'active'; // Default to active subscriptions

    logger.info(`Syncing subscriptions (status: ${statusFilter}, limit: ${limit})`);

    // Try to get token via refresh flow, fall back to API key
    let headers: Record<string, string>;
    try {
      const token = await getArketaToken(supabaseUrl, supabaseKey);
      headers = getArketaHeaders(token);
      logger.info('Using OAuth token for authentication');
    } catch (tokenError) {
      logger.warn('Token refresh failed, using API key', { 
        error: tokenError instanceof Error ? tokenError.message : String(tokenError) 
      });
      headers = getArketaApiKeyHeaders(ARKETA_API_KEY);
    }

    // Fetch subscriptions with pagination
    let allSubscriptions: ArketaSubscription[] = [];
    let cursor: string | null = body.cursor || null;
    let totalAttempts = 0;
    let hasMore = true;

    while (hasMore) {
      let url = `${ARKETA_URLS.prod}/${ARKETA_PARTNER_ID}/subscriptions?limit=${limit}`;
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }
      if (cursor) {
        url += `&cursor=${cursor}`;
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

        const data: ApiResponse = await response.json();
        
        // Extract subscriptions from various response formats
        const subscriptions = data.items || data.data || data.subscriptions || [];
        
        if (Array.isArray(subscriptions)) {
          allSubscriptions = [...allSubscriptions, ...subscriptions];
          logger.info(`Fetched ${subscriptions.length} subscriptions (total: ${allSubscriptions.length})`);
        }

        // Check for more pages
        const pagination = data.pagination;
        cursor = pagination?.nextCursor || pagination?.next_cursor || null;
        hasMore = (pagination?.hasMore || pagination?.has_more || false) && cursor !== null;

        // Safety limit to prevent infinite loops
        if (allSubscriptions.length >= 10000) {
          logger.warn('Reached safety limit of 10000 subscriptions');
          break;
        }
      } catch (error) {
        logger.error('Failed to fetch subscriptions', error);
        break;
      }
    }

    logger.info(`Total fetched: ${allSubscriptions.length} subscriptions after ${totalAttempts} API attempts`);

    // Upsert subscriptions to database
    const syncedSubscriptions: Array<{ id: string; status: string; name: string }> = [];
    let failedCount = 0;

    for (const subscription of allSubscriptions) {
      const subscriptionId = subscription.subscription_id || subscription.id;
      if (!subscriptionId) {
        logger.warn('Skipping subscription without ID');
        failedCount++;
        continue;
      }

      try {
        const transformed = transformSubscription(subscription);

        const { result } = await withRetry(
          async () => {
            const { error } = await supabase
              .from('arketa_subscriptions')
              .upsert(transformed, {
                onConflict: 'external_id',
              });

            if (error && !isRetryableSupabaseError(error)) {
              throw error;
            }
            return { error };
          },
          { maxAttempts: 2 },
          `upsert subscription ${subscriptionId}`
        );

        if (result.error) {
          logger.error(`Failed to upsert subscription ${subscriptionId}`, result.error);
          failedCount++;
          continue;
        }

        syncedSubscriptions.push({
          id: String(subscriptionId),
          status: subscription.status || 'unknown',
          name: subscription.name || 'Unnamed',
        });
      } catch (error) {
        logger.error(`Error upserting subscription ${subscriptionId}`, error);
        failedCount++;
      }
    }

    // Log sync metrics
    const durationMs = Date.now() - startTime;
    await logSyncMetrics(supabase, {
      syncType: 'arketa_subscriptions',
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs,
      recordsFetched: allSubscriptions.length,
      recordsSynced: syncedSubscriptions.length,
      recordsFailed: failedCount,
      retryCount: Math.max(0, totalAttempts - 1),
    });

    // Update sync status
    await supabase
      .from('api_sync_status')
      .upsert({
        api_name: 'arketa_subscriptions',
        last_sync_at: new Date().toISOString(),
        last_sync_success: failedCount === 0,
        last_records_processed: allSubscriptions.length,
        last_records_inserted: syncedSubscriptions.length,
      }, { onConflict: 'api_name' });

    // Count by status
    const statusCounts = syncedSubscriptions.reduce((acc, sub) => {
      acc[sub.status] = (acc[sub.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return new Response(
      JSON.stringify({
        success: true,
        subscriptions: syncedSubscriptions.slice(0, 100), // Return first 100 for response size
        totalFetched: allSubscriptions.length,
        syncedCount: syncedSubscriptions.length,
        failedCount,
        statusCounts,
        apiAttempts: totalAttempts,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const logger = createSyncLogger('arketa_subscriptions');
    logger.error('Sync failed', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

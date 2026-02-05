import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { fetchWithRetry, withRetry, isRetryableSupabaseError } from '../_shared/retry.ts';
import { createSyncLogger, logSyncMetrics } from '../_shared/logger.ts';

// Toast API configuration
const TOAST_BASE_URL = 'https://ws-api.toasttab.com';

interface ToastSalesData {
  businessDate: string;
  netSales?: number;
  grossSales?: number;
  cafeSales?: number;
  totalOrders?: number;
  [key: string]: unknown;
}

interface SyncRequest {
  action?: string;
  start_date?: string;
  end_date?: string;
  days_back?: number;
}

interface ToastAuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

// Authenticate with Toast API using OAuth
async function getToastToken(
  clientId: string,
  clientSecret: string,
  userAccessType: string = 'TOAST_MACHINE_CLIENT'
): Promise<string> {
  const authUrl = `${TOAST_BASE_URL}/authentication/v1/authentication/login`;
  
  const { response, attempts } = await fetchWithRetry(authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      clientId,
      clientSecret,
      userAccessType,
    }),
  }, {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 5000,
    timeoutMs: 30000,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Toast auth failed: ${response.status} - ${errorText}`);
  }

  const authData: ToastAuthResponse = await response.json();
  console.log(`[Toast API] Authenticated after ${attempts} attempt(s)`);
  return authData.accessToken;
}

// Fetch sales data from Toast API
async function fetchToastSales(
  token: string,
  restaurantGuid: string,
  startDate: string,
  endDate: string,
  logger: ReturnType<typeof createSyncLogger>
): Promise<ToastSalesData[]> {
  // Toast uses different endpoints for different data
  // Try the orders bulk endpoint for sales data
  const ordersUrl = `${TOAST_BASE_URL}/orders/v2/ordersBulk?startDate=${startDate}&endDate=${endDate}`;
  
  logger.info(`Fetching orders from ${startDate} to ${endDate}`);
  
  const { response, attempts } = await fetchWithRetry(ordersUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Toast-Restaurant-External-ID': restaurantGuid,
      'Content-Type': 'application/json',
    },
  }, {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    timeoutMs: 60000,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Toast orders fetch failed: ${response.status} - ${errorText}`);
  }

  const ordersData = await response.json();
  logger.info(`Fetched orders data after ${attempts} attempt(s)`);

  // Aggregate orders by business date
  const salesByDate = new Map<string, ToastSalesData>();

  const orders = Array.isArray(ordersData) ? ordersData : ordersData.orders || [];
  
  for (const order of orders) {
    const businessDate = order.businessDate || order.openedDate?.split('T')[0];
    if (!businessDate) continue;

    const existing = salesByDate.get(businessDate) || {
      businessDate,
      netSales: 0,
      grossSales: 0,
      cafeSales: 0,
      totalOrders: 0,
    };

    // Aggregate sales
    const orderTotal = order.totalAmount || order.amount || 0;
    const orderNet = order.netAmount || orderTotal;
    
    existing.netSales = (existing.netSales || 0) + orderNet;
    existing.grossSales = (existing.grossSales || 0) + orderTotal;
    existing.cafeSales = (existing.cafeSales || 0) + orderNet; // Default to net
    existing.totalOrders = (existing.totalOrders || 0) + 1;

    salesByDate.set(businessDate, existing);
  }

  return Array.from(salesByDate.values());
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Toast credentials
    const TOAST_CLIENT_ID = Deno.env.get('TOAST_CLIENT_ID');
    const TOAST_CLIENT_SECRET = Deno.env.get('TOAST_CLIENT_SECRET');
    const TOAST_RESTAURANT_GUID = Deno.env.get('TOAST_RESTAURANT_GUID');

    if (!TOAST_CLIENT_ID || !TOAST_CLIENT_SECRET || !TOAST_RESTAURANT_GUID) {
      return new Response(
        JSON.stringify({ error: 'Toast API credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const logger = createSyncLogger('toast_sales');
    const startTime = Date.now();

    const body = await req.json().catch(() => ({})) as SyncRequest;
    
    // Default to today, or use provided dates
    const today = new Date().toISOString().split('T')[0];
    const daysBack = body.days_back || 14; // Default to 14 days back
    
    const endDate = body.end_date || today;
    const startDateDefault = new Date();
    startDateDefault.setDate(startDateDefault.getDate() - daysBack);
    const startDate = body.start_date || startDateDefault.toISOString().split('T')[0];

    logger.info(`Starting Toast sync from ${startDate} to ${endDate}`);

    // Generate batch ID for this sync
    const batchId = crypto.randomUUID();

    // Authenticate with Toast
    let token: string;
    try {
      token = await getToastToken(TOAST_CLIENT_ID, TOAST_CLIENT_SECRET);
    } catch (authError) {
      logger.error('Toast authentication failed', authError);
      return new Response(
        JSON.stringify({ 
          error: 'Toast authentication failed',
          details: authError instanceof Error ? authError.message : String(authError)
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch sales data
    let salesData: ToastSalesData[];
    try {
      salesData = await fetchToastSales(token, TOAST_RESTAURANT_GUID, startDate, endDate, logger);
    } catch (fetchError) {
      logger.error('Toast fetch failed', fetchError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch Toast sales data',
          details: fetchError instanceof Error ? fetchError.message : String(fetchError)
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logger.info(`Fetched ${salesData.length} days of sales data`);

    // 1) Insert into toast_staging (CSV-aligned: business_date, net_sales, gross_sales, cafe_sales, raw_data, sync_batch_id)
    // 2) Upsert from staging into toast_sales target table
    const syncedDates: string[] = [];
    let failedCount = 0;
    let totalNetSales = 0;

    for (const dayData of salesData) {
      try {
        const stagingRow = {
          business_date: dayData.businessDate,
          net_sales: dayData.netSales || 0,
          gross_sales: dayData.grossSales || 0,
          cafe_sales: dayData.cafeSales ?? dayData.netSales ?? 0,
          raw_data: dayData,
          sync_batch_id: batchId,
        };

        const { result: stagingResult } = await withRetry(
          async () => {
            const { error } = await supabase
              .from('toast_staging')
              .upsert(stagingRow, {
                onConflict: 'business_date,sync_batch_id',
              });

            if (error && !isRetryableSupabaseError(error)) {
              throw error;
            }
            return { error };
          },
          { maxAttempts: 2 },
          `insert toast_staging ${dayData.businessDate}`
        );

        if (stagingResult.error) {
          logger.error(`Failed to stage ${dayData.businessDate}`, stagingResult.error);
          failedCount++;
          continue;
        }

        const { result } = await withRetry(
          async () => {
            const { error } = await supabase
              .from('toast_sales')
              .upsert({
                business_date: dayData.businessDate,
                net_sales: stagingRow.net_sales,
                gross_sales: stagingRow.gross_sales,
                cafe_sales: stagingRow.cafe_sales,
                raw_data: stagingRow.raw_data,
                sync_batch_id: batchId,
              }, {
                onConflict: 'business_date',
              });

            if (error && !isRetryableSupabaseError(error)) {
              throw error;
            }
            return { error };
          },
          { maxAttempts: 2 },
          `upsert toast_sales ${dayData.businessDate}`
        );

        if (result.error) {
          logger.error(`Failed to upsert target ${dayData.businessDate}`, result.error);
          failedCount++;
          continue;
        }

        totalNetSales += dayData.netSales || 0;
        syncedDates.push(dayData.businessDate);
      } catch (error) {
        logger.error(`Error syncing ${dayData.businessDate}`, error);
        failedCount++;
      }
    }

    // Log sync metrics
    const durationMs = Date.now() - startTime;
    await logSyncMetrics(supabase, {
      syncType: 'toast_sales',
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs,
      recordsFetched: salesData.length,
      recordsSynced: syncedDates.length,
      recordsFailed: failedCount,
      retryCount: 0,
    });

    // Update sync status
    await supabase
      .from('api_sync_status')
      .upsert({
        api_name: 'toast_sales',
        last_sync_at: new Date().toISOString(),
        last_sync_success: failedCount === 0,
        last_records_processed: salesData.length,
        last_records_inserted: syncedDates.length,
      }, { onConflict: 'api_name' });

    logger.info(`Sync completed: ${syncedDates.length} days synced, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        syncedDates,
        totalFetched: salesData.length,
        syncedCount: syncedDates.length,
        failedCount,
        totalNetSales,
        dateRange: { startDate, endDate },
        batchId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const logger = createSyncLogger('toast_sales');
    logger.error('Sync failed', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

interface ToastOrder {
  guid: string;
  totalAmount?: number;
  tipAmount?: number;
  netAmount?: number;
  checks?: Array<{
    payments?: Array<{
      type?: string;
      amount?: number;
    }>;
    selections?: Array<{
      item?: {
        name?: string;
        guid?: string;
      };
      quantity?: number;
      netPrice?: number;
    }>;
  }>;
  [key: string]: unknown;
}

interface SyncResult {
  success: boolean;
  businessDate: string;
  totalSales: number;
  totalTransactions: number;
  error?: string;
}

// Rate limiting configuration
const RETRY_MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1000;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxAttempts: number = RETRY_MAX_ATTEMPTS
): Promise<{ response: Response; attempts: number }> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429 || response.status >= 500) {
        const errorText = await response.text();
        lastError = new Error(`HTTP ${response.status}: ${errorText}`);
        
        if (attempt < maxAttempts) {
          const backoffDelay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
          console.log(`Attempt ${attempt} failed with ${response.status}, retrying in ${backoffDelay}ms`);
          await delay(backoffDelay);
          continue;
        }
      }
      
      return { response, attempts: attempt };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxAttempts) {
        const backoffDelay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`Attempt ${attempt} failed with error, retrying in ${backoffDelay}ms:`, lastError.message);
        await delay(backoffDelay);
      }
    }
  }
  
  throw lastError || new Error("All retry attempts failed");
}

async function getToastAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const tokenUrl = "https://ws-api.toasttab.com/authentication/v1/authentication/login";
  
  const { response } = await fetchWithRetry(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clientId,
      clientSecret,
      userAccessType: "TOAST_MACHINE_CLIENT",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Toast authentication failed [${response.status}]: ${errorText}`);
  }

  const result = await response.json();
  return result.token?.accessToken || result.accessToken;
}

function getBusinessDate(date?: string): string {
  const d = date ? new Date(date) : new Date();
  return d.toISOString().split('T')[0];
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);

  // deno-lint-ignore no-explicit-any
  let supabase: any;
  let syncLogId: string | null = null;

  try {
    const TOAST_CLIENT_ID = Deno.env.get("TOAST_CLIENT_ID");
    const TOAST_CLIENT_SECRET = Deno.env.get("TOAST_CLIENT_SECRET");
    const TOAST_RESTAURANT_GUID = Deno.env.get("TOAST_RESTAURANT_GUID");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!TOAST_CLIENT_ID) {
      throw new Error("TOAST_CLIENT_ID is not configured");
    }
    if (!TOAST_CLIENT_SECRET) {
      throw new Error("TOAST_CLIENT_SECRET is not configured");
    }
    if (!TOAST_RESTAURANT_GUID) {
      throw new Error("TOAST_RESTAURANT_GUID is not configured");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body for optional date parameter
    let businessDate = getBusinessDate();
    try {
      const body = await req.json();
      if (body.date) {
        businessDate = getBusinessDate(body.date);
      }
    } catch {
      // No body or invalid JSON, use today's date
    }

    // Create sync log entry
    const { data: syncLog, error: syncLogError } = await supabase
      .from("toast_sync_log")
      .insert({ 
        status: "running",
        records_synced: 0,
        success_count: 0,
        failure_count: 0,
      })
      .select()
      .single();

    if (syncLogError) {
      console.error("Failed to create sync log:", syncLogError);
    } else {
      syncLogId = syncLog.id;
    }

    console.log(`Fetching Toast sales for ${businessDate}`);

    // Get access token
    const accessToken = await getToastAccessToken(TOAST_CLIENT_ID, TOAST_CLIENT_SECRET);
    console.log("Obtained Toast access token");

    // Fetch orders for the business date
    const ordersUrl = `https://ws-api.toasttab.com/orders/v2/orders?businessDate=${businessDate}`;
    
    const { response } = await fetchWithRetry(ordersUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Toast-Restaurant-External-ID": TOAST_RESTAURANT_GUID,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Toast Orders API error [${response.status}]: ${errorText}`);
    }

    const orders: ToastOrder[] = await response.json();
    console.log(`Fetched ${orders.length} orders from Toast API`);

    // Calculate totals
    let totalSales = 0;
    const paymentBreakdown: Record<string, number> = {};
    const itemCounts: Record<string, { name: string; quantity: number; revenue: number }> = {};

    for (const order of orders) {
      totalSales += order.totalAmount || 0;

      // Process payments
      for (const check of order.checks || []) {
        for (const payment of check.payments || []) {
          const paymentType = payment.type || "OTHER";
          paymentBreakdown[paymentType] = (paymentBreakdown[paymentType] || 0) + (payment.amount || 0);
        }

        // Process items
        for (const selection of check.selections || []) {
          const itemName = selection.item?.name || "Unknown";
          const itemGuid = selection.item?.guid || itemName;
          
          if (!itemCounts[itemGuid]) {
            itemCounts[itemGuid] = { name: itemName, quantity: 0, revenue: 0 };
          }
          itemCounts[itemGuid].quantity += selection.quantity || 1;
          itemCounts[itemGuid].revenue += selection.netPrice || 0;
        }
      }
    }

    // Get top 10 items by revenue
    const topItems = Object.values(itemCounts)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Upsert daily sales record
    const salesData = {
      business_date: businessDate,
      total_sales: totalSales,
      total_transactions: orders.length,
      payment_breakdown: paymentBreakdown,
      top_items: topItems,
      raw_data: { 
        orderCount: orders.length,
        syncedAt: new Date().toISOString(),
      },
      synced_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from("daily_sales")
      .upsert(salesData, { 
        onConflict: "business_date",
        ignoreDuplicates: false 
      });

    if (upsertError) {
      throw new Error(`Failed to save sales data: ${upsertError.message}`);
    }

    // Update sync log
    if (syncLogId) {
      await supabase
        .from("toast_sync_log")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          records_synced: 1,
          success_count: 1,
          failure_count: 0,
        })
        .eq("id", syncLogId);
    }

    const syncResult: SyncResult = {
      success: true,
      businessDate,
      totalSales,
      totalTransactions: orders.length,
    };

    return new Response(
      JSON.stringify(syncResult),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Toast sync error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    if (syncLogId && supabase) {
      await supabase
        .from("toast_sync_log")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error_message: errorMessage,
        })
        .eq("id", syncLogId);
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        businessDate: getBusinessDate(),
        totalSales: 0,
        totalTransactions: 0,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

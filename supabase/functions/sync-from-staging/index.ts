/**
 * sync-from-staging: Transfer staging tables to history (target) tables.
 * - arketa_reservations_staging -> arketa_reservations_history (unique: reservation_id, class_id)
 * - arketa_payments_staging -> arketa_payments_history (unique: payment_id, source_endpoint)
 * Logs to api_logs and optionally clears staging after transfer.
 */

import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

const BATCH_SIZE = 500;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type TransferApi = "arketa_reservations" | "arketa_payments" | "both";

interface SyncFromStagingRequest {
  api?: TransferApi;
  clear_staging?: boolean;
  sync_batch_id?: string;
}

interface TransferResult {
  api: string;
  records_processed: number;
  records_inserted: number;
  records_updated: number;
  error?: string;
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = getCorsHeaders(req);

  try {
    const body = (await req.json().catch(() => ({}))) as SyncFromStagingRequest;
    const api: TransferApi = body.api ?? "both";
    const clearStaging = body.clear_staging !== false;
    const syncBatchId = body.sync_batch_id;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const results: TransferResult[] = [];
    const startTime = Date.now();

    if (api === "arketa_reservations" || api === "both") {
      const r = await transferReservations(supabase, clearStaging, syncBatchId);
      results.push(r);
    }
    if (api === "arketa_payments" || api === "both") {
      const r = await transferPayments(supabase, clearStaging, syncBatchId);
      results.push(r);
    }

    const durationMs = Date.now() - startTime;
    const totalProcessed = results.reduce((s, r) => s + r.records_processed, 0);
    const totalInserted = results.reduce((s, r) => s + r.records_inserted, 0);
    const totalUpdated = results.reduce((s, r) => s + r.records_updated, 0);
    const hasError = results.some((r) => r.error);

    await supabase.from("api_logs").insert({
      api_name: "sync-from-staging",
      endpoint: "sync-from-staging",
      sync_success: !hasError,
      duration_ms: durationMs,
      records_processed: totalProcessed,
      records_inserted: totalInserted,
      records_updated: totalUpdated,
      triggered_by: body.sync_batch_id ? "backfill-job" : "manual",
    });

    return new Response(
      JSON.stringify({
        success: !hasError,
        results,
        duration_ms: durationMs,
        records_processed: totalProcessed,
        records_inserted: totalInserted,
        records_updated: totalUpdated,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function transferReservations(
  supabase: ReturnType<typeof createClient>,
  clearStaging: boolean,
  syncBatchId?: string
): Promise<TransferResult> {
  let recordsProcessed = 0;
  let recordsInserted = 0;
  let recordsUpdated = 0;

  try {
    let query = supabase.from("arketa_reservations_staging").select("*");
    if (syncBatchId) query = query.eq("sync_batch_id", syncBatchId);
    const { data: rows, error: fetchError } = await query;

    if (fetchError) {
      return { api: "arketa_reservations", records_processed: 0, records_inserted: 0, records_updated: 0, error: fetchError.message };
    }
    if (!rows?.length) {
      return { api: "arketa_reservations", records_processed: 0, records_inserted: 0, records_updated: 0 };
    }

    const countBefore = await getHistoryCount(supabase, "arketa_reservations_history");
    const toUpsert = rows.map((r: Record<string, unknown>) => ({
      reservation_id: r.reservation_id ?? r.arketa_reservation_id,
      client_id: r.client_id ?? null,
      purchase_id: r.purchase_id ?? null,
      reservation_type: r.reservation_type ?? null,
      class_id: r.class_id ?? r.arketa_class_id ?? null,
      class_name: r.class_name ?? null,
      class_date: r.class_date ?? null,
      status: r.status ?? null,
      checked_in: r.checked_in ?? false,
      checked_in_at: r.checked_in_at ?? null,
      experience_type: r.experience_type ?? null,
      late_cancel: r.late_cancel ?? false,
      created_at: r.created_at ?? null,
      gross_amount_paid: r.gross_amount_paid ?? null,
      net_amount_paid: r.net_amount_paid ?? null,
      raw_data: r.raw_data ?? null,
      sync_batch_id: r.sync_batch_id ?? null,
      synced_at: new Date().toISOString(),
    })).filter((r) => r.reservation_id && r.class_id);

    for (let i = 0; i < toUpsert.length; i += BATCH_SIZE) {
      const batch = toUpsert.slice(i, i + BATCH_SIZE);
      const { error: upsertError } = await (supabase as any)
        .from("arketa_reservations_history")
        .upsert(batch, { onConflict: "reservation_id,class_id" });
      if (upsertError) {
        return {
          api: "arketa_reservations",
          records_processed: toUpsert.length,
          records_inserted: recordsInserted,
          records_updated: recordsUpdated,
          error: upsertError.message,
        };
      }
      recordsProcessed += batch.length;
    }

    const countAfter = await getHistoryCount(supabase, "arketa_reservations_history");
    recordsInserted = Math.max(0, countAfter - countBefore);
    recordsUpdated = recordsProcessed - recordsInserted;
    if (recordsUpdated < 0) recordsUpdated = 0;

    if (clearStaging && rows.length) {
      const ids = rows.map((r: { id?: string }) => r.id).filter(Boolean);
      if (ids.length) {
        await supabase.from("arketa_reservations_staging").delete().in("id", ids);
      }
    }

    return {
      api: "arketa_reservations",
      records_processed: recordsProcessed,
      records_inserted: recordsInserted,
      records_updated: recordsUpdated,
    };
  } catch (e) {
    return {
      api: "arketa_reservations",
      records_processed: recordsProcessed,
      records_inserted: recordsInserted,
      records_updated: recordsUpdated,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

async function transferPayments(
  supabase: ReturnType<typeof createClient>,
  clearStaging: boolean,
  syncBatchId?: string
): Promise<TransferResult> {
  let recordsProcessed = 0;
  let recordsInserted = 0;
  let recordsUpdated = 0;

  try {
    let query = supabase.from("arketa_payments_staging").select("*");
    if (syncBatchId) query = query.eq("sync_batch_id", syncBatchId);
    const { data: rows, error: fetchError } = await query;

    if (fetchError) {
      return { api: "arketa_payments", records_processed: 0, records_inserted: 0, records_updated: 0, error: fetchError.message };
    }
    if (!rows?.length) {
      return { api: "arketa_payments", records_processed: 0, records_inserted: 0, records_updated: 0 };
    }

    const countBefore = await getHistoryCount(supabase, "arketa_payments_history");
    const toUpsert = rows.map((r: Record<string, unknown>) => ({
      source_endpoint: r.source_endpoint ?? "purchases",
      payment_id: r.payment_id ?? r.arketa_payment_id ?? r.id,
      client_id: r.client_id ?? null,
      amount: r.amount ?? null,
      status: r.status ?? null,
      description: r.description ?? null,
      payment_type: r.payment_type ?? null,
      category: r.category ?? null,
      offering_id: r.offering_id ?? null,
      start_date: r.start_date ?? null,
      end_date: r.end_date ?? null,
      remaining_uses: r.remaining_uses ?? null,
      currency: r.currency ?? null,
      total_refunded: r.total_refunded ?? null,
      net_sales: r.net_sales ?? null,
      transaction_fees: r.transaction_fees ?? null,
      stripe_fees: r.stripe_fees ?? null,
      tax: r.tax ?? null,
      updated_at: r.updated_at ?? null,
      synced_at: new Date().toISOString(),
      sync_batch_id: r.sync_batch_id ?? null,
    })).filter((r) => r.payment_id && r.source_endpoint);

    for (let i = 0; i < toUpsert.length; i += BATCH_SIZE) {
      const batch = toUpsert.slice(i, i + BATCH_SIZE);
      const { error: upsertError } = await (supabase as any)
        .from("arketa_payments_history")
        .upsert(batch, { onConflict: "payment_id,source_endpoint" });
      if (upsertError) {
        return {
          api: "arketa_payments",
          records_processed: toUpsert.length,
          records_inserted: recordsInserted,
          records_updated: recordsUpdated,
          error: upsertError.message,
        };
      }
      recordsProcessed += batch.length;
    }

    const countAfter = await getHistoryCount(supabase, "arketa_payments_history");
    recordsInserted = Math.max(0, countAfter - countBefore);
    recordsUpdated = recordsProcessed - recordsInserted;
    if (recordsUpdated < 0) recordsUpdated = 0;

    if (clearStaging && rows.length) {
      const ids = rows.map((r: { id?: string }) => r.id).filter(Boolean);
      if (ids.length) {
        await supabase.from("arketa_payments_staging").delete().in("id", ids);
      }
    }

    return {
      api: "arketa_payments",
      records_processed: recordsProcessed,
      records_inserted: recordsInserted,
      records_updated: recordsUpdated,
    };
  } catch (e) {
    return {
      api: "arketa_payments",
      records_processed: recordsProcessed,
      records_inserted: recordsInserted,
      records_updated: recordsUpdated,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

async function getHistoryCount(supabase: ReturnType<typeof createClient>, table: string): Promise<number> {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  if (error) return 0;
  return count ?? 0;
}

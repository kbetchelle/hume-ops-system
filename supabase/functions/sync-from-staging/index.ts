/**
 * sync-from-staging: Transfer staging tables to target tables.
 * - arketa_reservations_staging -> arketa_reservations_history (unique: reservation_id, class_id)
 * - arketa_payments_staging -> arketa_payments (unique: payment_id)
 * - order_checks_staging -> order_checks (unique: check_guid)
 * Logs to api_logs and optionally clears staging after transfer.
 */

import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

const BATCH_SIZE = 500;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type TransferApi = "arketa_reservations" | "arketa_payments" | "order_checks" | "both";

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
    if (api === "order_checks" || api === "both") {
      const r = await transferOrderChecks(supabase, clearStaging, syncBatchId);
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
  supabase: any,
  clearStaging: boolean,
  syncBatchId?: string
): Promise<TransferResult> {
  let recordsProcessed = 0;
  let recordsInserted = 0;
  let recordsUpdated = 0;

  try {
    // Paginate staging reads to avoid Supabase's 1000-row default limit
    const stagingSelect = "id, reservation_id, class_id, client_id, reservation_type, class_name, class_date, status, checked_in, checked_in_at, late_cancel, gross_amount_paid, net_amount_paid, created_at_api, updated_at_api, spot_id, spot_name, client_email, client_first_name, client_last_name, client_phone, raw_data, sync_batch_id";
    let allRows: Record<string, unknown>[] = [];
    const PAGE_SIZE = 1000;
    let offset = 0;
    while (true) {
      let query = supabase.from("arketa_reservations_staging").select(stagingSelect).range(offset, offset + PAGE_SIZE - 1);
      if (syncBatchId) query = query.eq("sync_batch_id", syncBatchId);
      const { data: rows, error: fetchError } = await query;
      if (fetchError) {
        return { api: "arketa_reservations", records_processed: 0, records_inserted: 0, records_updated: 0, error: fetchError.message };
      }
      if (!rows?.length) break;
      allRows = allRows.concat(rows);
      if (rows.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }
    const rows = allRows;
    if (!rows.length) {
      return { api: "arketa_reservations", records_processed: 0, records_inserted: 0, records_updated: 0 };
    }

    const countBefore = await getHistoryCount(supabase, "arketa_reservations_history");
    const toUpsert = rows.map((r: Record<string, unknown>) => ({
      reservation_id: r.reservation_id ?? r.arketa_reservation_id,
      client_id: r.client_id ?? null,
      reservation_type: r.reservation_type ?? null,
      class_id: r.class_id ?? r.arketa_class_id ?? null,
      class_name: r.class_name ?? null,
      class_date: r.class_date ?? null,
      status: r.status ?? null,
      checked_in: r.checked_in ?? false,
      checked_in_at: r.checked_in_at ?? null,
      late_cancel: r.late_cancel ?? false,
      gross_amount_paid: r.gross_amount_paid ?? null,
      net_amount_paid: r.net_amount_paid ?? null,
      created_at_api: r.created_at_api ?? null,
      updated_at_api: r.updated_at_api ?? null,
      spot_id: r.spot_id ?? null,
      spot_name: r.spot_name ?? null,
      client_email: r.client_email ?? null,
      client_first_name: r.client_first_name ?? null,
      client_last_name: r.client_last_name ?? null,
      client_phone: r.client_phone ?? null,
      raw_data: r.raw_data ?? null,
      sync_batch_id: r.sync_batch_id ?? null,
    })).filter((r: any) => r.reservation_id && r.class_id);

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
      const DEL_BATCH = 500;
      for (let i = 0; i < ids.length; i += DEL_BATCH) {
        const batch = ids.slice(i, i + DEL_BATCH);
        await supabase.from("arketa_reservations_staging").delete().in("id", batch);
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
  supabase: any,
  clearStaging: boolean,
  syncBatchId?: string
): Promise<TransferResult> {
  let recordsProcessed = 0;
  let recordsInserted = 0;
  let recordsUpdated = 0;

  try {
    let allRows: Record<string, unknown>[] = [];
    const PAGE_SIZE = 1000;
    let offset = 0;
    while (true) {
      let query = supabase.from("arketa_payments_staging").select("*").range(offset, offset + PAGE_SIZE - 1);
      if (syncBatchId) query = query.eq("sync_batch_id", syncBatchId);
      const { data: rows, error: fetchError } = await query;
      if (fetchError) {
        return { api: "arketa_payments", records_processed: 0, records_inserted: 0, records_updated: 0, error: fetchError.message };
      }
      if (!rows?.length) break;
      allRows = allRows.concat(rows);
      if (rows.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }
    const rows = allRows;
    if (!rows.length) {
      return { api: "arketa_payments", records_processed: 0, records_inserted: 0, records_updated: 0 };
    }

    const countBefore = await getHistoryCount(supabase, "arketa_payments");
    const toUpsert = rows.map((r: Record<string, unknown>) => ({
      payment_id: r.payment_id ?? r.id,
      amount: r.amount ?? null,
      status: r.status ?? null,
      created_at_api: r.created_at_api ?? null,
      currency: r.currency ?? null,
      amount_refunded: r.amount_refunded ?? null,
      description: r.description ?? null,
      invoice_id: r.invoice_id ?? null,
      normalized_category: r.normalized_category ?? null,
      net_sales: r.net_sales ?? null,
      transaction_fees: r.transaction_fees ?? null,
      tax: r.tax ?? null,
      location_name: r.location_name ?? null,
      source: r.source ?? null,
      payment_type: r.payment_type ?? null,
      promo_code: r.promo_code ?? null,
      offering_name: r.offering_name ?? null,
      seller_name: r.seller_name ?? null,
      client_id: r.client_id ?? null,
      client_first_name: r.client_first_name ?? null,
      client_last_name: r.client_last_name ?? null,
      client_email: r.client_email ?? null,
      client_phone: r.client_phone ?? null,
      raw_data: r.raw_data ?? null,
      synced_at: new Date().toISOString(),
      sync_batch_id: r.sync_batch_id ?? null,
    })).filter((r: any) => r.payment_id);

    for (let i = 0; i < toUpsert.length; i += BATCH_SIZE) {
      const batch = toUpsert.slice(i, i + BATCH_SIZE);
      const { error: upsertError } = await (supabase as any)
        .from("arketa_payments")
        .upsert(batch, { onConflict: "payment_id" });
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

    const countAfter = await getHistoryCount(supabase, "arketa_payments");
    recordsInserted = Math.max(0, countAfter - countBefore);
    recordsUpdated = recordsProcessed - recordsInserted;
    if (recordsUpdated < 0) recordsUpdated = 0;

    if (clearStaging && rows.length) {
      const ids = rows.map((r: { id?: string }) => r.id).filter(Boolean);
      const DEL_BATCH = 500;
      for (let i = 0; i < ids.length; i += DEL_BATCH) {
        const batch = ids.slice(i, i + DEL_BATCH);
        await supabase.from("arketa_payments_staging").delete().in("id", batch);
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

async function transferOrderChecks(
  supabase: any,
  clearStaging: boolean,
  syncBatchId?: string
): Promise<TransferResult> {
  let recordsProcessed = 0;
  let recordsInserted = 0;
  let recordsUpdated = 0;

  try {
    let query = supabase.from("order_checks_staging").select("*");
    if (syncBatchId) query = query.eq("sync_batch_id", syncBatchId);
    const { data: rows, error: fetchError } = await query;

    if (fetchError) {
      return { api: "order_checks", records_processed: 0, records_inserted: 0, records_updated: 0, error: fetchError.message };
    }
    if (!rows?.length) {
      return { api: "order_checks", records_processed: 0, records_inserted: 0, records_updated: 0 };
    }

    const countBefore = await getHistoryCount(supabase, "order_checks");
    const toUpsert = rows.map((r: Record<string, unknown>) => ({
      check_guid: r.check_guid ?? null,
      order_guid: r.order_guid ?? null,
      business_date: r.business_date ?? null,
      amount: r.amount ?? null,
      tax_amount: r.tax_amount ?? null,
      total_amount: r.total_amount ?? null,
      payment_status: r.payment_status ?? null,
      paid_date: r.paid_date ?? null,
      closed_date: r.closed_date ?? null,
      voided: r.voided ?? false,
      void_date: r.void_date ?? null,
      raw_data: r.raw_data ?? null,
      sync_batch_id: r.sync_batch_id ?? null,
    })).filter((r: { check_guid: string | null }) => r.check_guid);

    for (let i = 0; i < toUpsert.length; i += BATCH_SIZE) {
      const batch = toUpsert.slice(i, i + BATCH_SIZE);
      const { error: upsertError } = await (supabase as any)
        .from("order_checks")
        .upsert(batch, { onConflict: "check_guid" });
      if (upsertError) {
        return {
          api: "order_checks",
          records_processed: toUpsert.length,
          records_inserted: recordsInserted,
          records_updated: recordsUpdated,
          error: upsertError.message,
        };
      }
      recordsProcessed += batch.length;
    }

    const countAfter = await getHistoryCount(supabase, "order_checks");
    recordsInserted = Math.max(0, countAfter - countBefore);
    recordsUpdated = recordsProcessed - recordsInserted;
    if (recordsUpdated < 0) recordsUpdated = 0;

    if (clearStaging && rows.length) {
      const ids = rows.map((r: { id?: string }) => r.id).filter(Boolean);
      if (ids.length) {
        await supabase.from("order_checks_staging").delete().in("id", ids);
      }
    }

    return {
      api: "order_checks",
      records_processed: recordsProcessed,
      records_inserted: recordsInserted,
      records_updated: recordsUpdated,
    };
  } catch (e) {
    return {
      api: "order_checks",
      records_processed: recordsProcessed,
      records_inserted: recordsInserted,
      records_updated: recordsUpdated,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

async function getHistoryCount(supabase: any, table: string): Promise<number> {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  if (error) return 0;
  return count ?? 0;
}

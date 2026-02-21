/**
 * One-time import: Concierge reports CSV → daily_report_history.
 * Semicolon-delimited CSV; composite unique key (report_date, shift_type).
 * Does NOT import screenshot (arketa_screenshot_url is ignored).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CSV_HEADERS = [
  "id",
  "report_date",
  "shift_time",
  "staff_name",
  "notes_for_next_shift",
  "member_feedback",
  "membership_cancel_requests",
  "meaningful_conversations",
  "tour_name",
  "tour_followup_completed",
  "facility_issues",
  "busiest_areas",
  "system_issues",
  "management_notes",
  "created_at",
  "updated_at",
  "created_by",
  "arketa_screenshot_url",
  "extracted_checkins",
  "extracted_appointments",
  "extracted_class_signups",
  "notes_target_date",
  "notes_target_shift",
  "resolved",
  "extracted_class_details",
  "extracted_appointment_details",
  "staff_id",
];

/** Parse semicolon-delimited CSV with quoted fields (handles newlines inside quotes). */
function parseSemicolonCSV(csvData: string): { headers: string[]; rows: string[][] } {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < csvData.length; i++) {
    const char = csvData[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
    } else if (char === ";" && !inQuotes) {
      currentRow.push(current.trim());
      current = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && csvData[i + 1] === "\n") i++;
      currentRow.push(current.trim());
      current = "";
      if (currentRow.some((c) => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      current += char;
    }
  }
  if (current.length > 0 || currentRow.length > 0) {
    currentRow.push(current.trim());
    if (currentRow.some((c) => c.length > 0)) rows.push(currentRow);
  }

  const headerRow = rows.shift();
  const headers = headerRow ?? CSV_HEADERS;
  return { headers, rows };
}

/** Strip surrounding quotes from a field value. */
function unquote(value: string): string {
  const v = value.trim();
  if (v.startsWith('"') && v.endsWith('"')) {
    return v.slice(1, -1).replace(/""/g, '"');
  }
  return v;
}

/** Convert CSV text to JSONB: parse if valid JSON, else wrap as single-element array. */
function toJsonb(raw: string): unknown {
  const s = unquote(raw).trim();
  if (!s) return [];
  const trimmed = s.trim();
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // fall through to wrap as text
    }
  }
  return [{ text: trimmed }];
}

/** Parse date for report_date (YYYY-MM-DD). */
function parseDate(raw: string): string | null {
  const s = unquote(raw).trim();
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

/** Parse timestamp for created_at/updated_at. */
function parseTimestamp(raw: string): string | null {
  const s = unquote(raw).trim();
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** Parse boolean from CSV (e.g. "true", "false", "1", "0"). */
function parseBoolean(raw: string): boolean | null {
  const s = unquote(raw).trim().toLowerCase();
  if (!s) return null;
  if (["true", "1", "yes", "y"].includes(s)) return true;
  if (["false", "0", "no", "n"].includes(s)) return false;
  return null;
}

/** Build a daily_report_history row from CSV row (no screenshot). */
function mapRow(headers: string[], values: string[]): Record<string, unknown> | null {
  const get = (name: string): string => {
    const idx = headers.indexOf(name);
    if (idx < 0 || idx >= values.length) return "";
    return values[idx] ?? "";
  };

  const reportDate = parseDate(get("report_date"));
  const shiftType = (unquote(get("shift_time")) || "").toUpperCase();
  const staffUserId = unquote(get("staff_id")).trim();

  if (!reportDate || !shiftType || (shiftType !== "AM" && shiftType !== "PM")) {
    return null;
  }
  if (!staffUserId) {
    return null;
  }

  const id = unquote(get("id")).trim() || undefined;

  const created = parseTimestamp(get("created_at"));
  const updated = parseTimestamp(get("updated_at"));
  const tourFollowupCompleted = parseBoolean(get("tour_followup_completed"));

  const row: Record<string, unknown> = {
    ...(id && { id }),
    report_date: reportDate,
    shift_type: shiftType,
    staff_user_id: staffUserId,
    staff_name: unquote(get("staff_name")).trim() || null,
    future_shift_notes: toJsonb(get("notes_for_next_shift")),
    member_feedback: toJsonb(get("member_feedback")),
    membership_requests: toJsonb(get("membership_cancel_requests")),
    facility_issues: toJsonb(get("facility_issues")),
    busiest_areas: unquote(get("busiest_areas")).trim() || null,
    system_issues: toJsonb(get("system_issues")),
    management_notes: unquote(get("management_notes")).trim() || null,
    status: "submitted",
  };
  if (created) row.created_at = created;
  if (updated) row.updated_at = updated;
  if (tourFollowupCompleted !== null) row.tour_followup_completed = tourFollowupCompleted;
  return row;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const { csvContent, overwriteExisting = true } = body as {
      csvContent?: string;
      overwriteExisting?: boolean;
    };

    if (!csvContent || typeof csvContent !== "string") {
      return new Response(
        JSON.stringify({ error: "csvContent (string) is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { headers, rows } = parseSemicolonCSV(csvContent);
    const detailedErrors: { rowNumber: number; reason: string }[] = [];
    const records: Record<string, unknown>[] = [];

    for (let i = 0; i < rows.length; i++) {
      const values = rows[i];
      if (values.length !== headers.length) {
        detailedErrors.push({
          rowNumber: i + 2,
          reason: `Column count mismatch (${values.length} vs ${headers.length})`,
        });
        continue;
      }
      const row = mapRow(headers, values);
      if (!row) {
        detailedErrors.push({
          rowNumber: i + 2,
          reason: "Missing or invalid report_date, shift_type, or staff_id",
        });
        continue;
      }
      records.push(row);
    }

    if (records.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          totalRows: rows.length,
          inserted: 0,
          updated: 0,
          errors: detailedErrors.length,
          detailedErrors: detailedErrors.slice(0, 50),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const BATCH_SIZE = 50;
    let inserted = 0;
    let updated = 0;
    const errors: string[] = [];

    const conflictKey = "report_date,shift_type";

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;

      if (!overwriteExisting) {
        const { data: upsertData, error } = await supabase
          .from("daily_report_history")
          .upsert(batch, { onConflict: conflictKey, ignoreDuplicates: true })
          .select("id");

        if (error) {
          errors.push(`Batch ${batchNum}: ${error.message}`);
          continue;
        }
        inserted += upsertData?.length ?? 0;
        continue;
      }

      const keys = batch.map((r) => ({ report_date: r.report_date, shift_type: r.shift_type }));
      const orClause = keys
        .map((k) => `and(report_date.eq.${k.report_date},shift_type.eq.${k.shift_type})`)
        .join(",");
      const { data: existingRows } = await supabase
        .from("daily_report_history")
        .select("report_date,shift_type")
        .or(orClause);

      const existingCount = existingRows?.length ?? 0;
      updated += existingCount;
      inserted += batch.length - existingCount;

      const { error } = await supabase
        .from("daily_report_history")
        .upsert(batch, { onConflict: conflictKey })
        .select("id");

      if (error) {
        errors.push(`Batch ${batchNum}: ${error.message}`);
        inserted -= batch.length - existingCount;
        updated -= existingCount;
        continue;
      }
    }

    return new Response(
      JSON.stringify({
        success: errors.length === 0,
        totalRows: rows.length,
        parsed: records.length,
        inserted,
        updated,
        errors: errors.length > 0 ? errors : undefined,
        parseErrors: detailedErrors.length > 0 ? detailedErrors.length : undefined,
        detailedErrors: detailedErrors.length > 0 ? detailedErrors.slice(0, 30) : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

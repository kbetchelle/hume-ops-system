/**
 * Concierge CSV → SQL for Lovable (no Supabase).
 * Reads a semicolon-delimited concierge_reports export CSV and prints
 * INSERT ... ON CONFLICT (report_date, shift_type) DO UPDATE SQL you can
 * run in Lovable Cloud's SQL editor.
 *
 * Usage:
 *   npx tsx scripts/concierge-csv-to-sql.ts path/to/concierge_reports-export-*.csv > concierge-import.sql
 *   # Then paste concierge-import.sql into Lovable SQL editor and run it.
 *
 * Run the migration first in Lovable (adds tour_followup_completed):
 *   ALTER TABLE public.daily_report_history ADD COLUMN IF NOT EXISTS tour_followup_completed boolean DEFAULT false;
 */

import * as fs from "fs";
import * as path from "path";

const CSV_HEADERS = [
  "id", "report_date", "shift_time", "staff_name", "notes_for_next_shift",
  "member_feedback", "membership_cancel_requests", "meaningful_conversations",
  "tour_name", "tour_followup_completed", "facility_issues", "busiest_areas",
  "system_issues", "management_notes", "created_at", "updated_at", "created_by",
  "arketa_screenshot_url", "extracted_checkins", "extracted_appointments",
  "extracted_class_signups", "notes_target_date", "notes_target_shift",
  "resolved", "extracted_class_details", "extracted_appointment_details", "staff_id",
];

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
      if (currentRow.some((c) => c.length > 0)) rows.push(currentRow);
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
  return { headers: headerRow ?? CSV_HEADERS, rows };
}

function unquote(value: string): string {
  const v = value.trim();
  if (v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1).replace(/""/g, '"');
  return v;
}

function toJsonb(raw: string): unknown {
  const s = unquote(raw).trim();
  if (!s) return [];
  const t = s.trim();
  if (t.startsWith("[") || t.startsWith("{")) {
    try {
      return JSON.parse(t);
    } catch {
      // fall through
    }
  }
  return [{ text: t }];
}

function parseDate(raw: string): string | null {
  const s = unquote(raw).trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function parseTimestamp(raw: string): string | null {
  const s = unquote(raw).trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function parseBoolean(raw: string): boolean | null {
  const s = unquote(raw).trim().toLowerCase();
  if (!s) return null;
  if (["true", "1", "yes", "y"].includes(s)) return true;
  if (["false", "0", "no", "n"].includes(s)) return false;
  return null;
}

/** Escape for SQL string literals: ASCII and Unicode apostrophes -> doubled single quote. */
function sqlEscape(s: string): string {
  return s
    .replace(/'/g, "''")       // ASCII single quote
    .replace(/\u2019/g, "''")  // Unicode right single quotation mark (')
    .replace(/\u2018/g, "''"); // Unicode left single quotation mark (')
}

function sqlValue(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") return String(v);
  if (typeof v === "object") return `'${sqlEscape(JSON.stringify(v))}'::jsonb`;
  return `'${sqlEscape(String(v))}'`;
}

function mapRow(headers: string[], values: string[]): Record<string, unknown> | null {
  const get = (name: string): string => {
    const idx = headers.indexOf(name);
    if (idx < 0 || idx >= values.length) return "";
    return values[idx] ?? "";
  };
  const reportDate = parseDate(get("report_date"));
  const shiftType = (unquote(get("shift_time")) || "").toUpperCase();
  const staffUserId = unquote(get("staff_id")).trim();
  if (!reportDate || !shiftType || (shiftType !== "AM" && shiftType !== "PM") || !staffUserId)
    return null;

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

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: npx tsx scripts/concierge-csv-to-sql.ts <path-to-csv> [> output.sql]");
  process.exit(1);
}

const csvData = fs.readFileSync(path.resolve(csvPath), "utf-8");
const { headers, rows } = parseSemicolonCSV(csvData);

const records: Record<string, unknown>[] = [];
for (let i = 0; i < rows.length; i++) {
  const values = rows[i];
  if (values.length !== headers.length) continue;
  const row = mapRow(headers, values);
  if (row) records.push(row);
}

if (records.length === 0) {
  console.error("No valid rows to import.");
  process.exit(1);
}

// Omit id so DB can default; keeps INSERT uniform. Use report_date+shift_type for conflict.
const cols = [
  "report_date", "shift_type", "staff_user_id", "staff_name",
  "future_shift_notes", "member_feedback", "membership_requests", "facility_issues",
  "busiest_areas", "system_issues", "management_notes", "status",
  "created_at", "updated_at", "tour_followup_completed",
];

const BATCH = 25;
console.log("-- Concierge CSV import for daily_report_history (run in Lovable SQL editor)");
console.log("-- Rows:", records.length);
console.log("");

for (let i = 0; i < records.length; i += BATCH) {
  const batch = records.slice(i, i + BATCH);
  const valuesList = batch
    .map((row) => {
      const vals = cols.map((c) => sqlValue(row[c]));
      return `(${vals.join(", ")})`;
    })
    .join(",\n  ");
  const colList = cols.map((c) => `"${c}"`).join(", ");
  const updateSet = cols
    .filter((c) => c !== "report_date" && c !== "shift_type")
    .map((c) => `"${c}" = EXCLUDED."${c}"`)
    .join(", ");
  console.log(
    `INSERT INTO public.daily_report_history (${colList})\n  VALUES\n  ${valuesList}\n  ON CONFLICT (report_date, shift_type) DO UPDATE SET ${updateSet};\n`
  );
}

console.error(`Wrote SQL for ${records.length} rows. Paste the output above into Lovable SQL editor and run.`);

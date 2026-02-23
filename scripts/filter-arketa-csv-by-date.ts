/**
 * Filter Arketa reservations (or classes) CSV to date range 2026-01-20 .. 2026-04-01,
 * write a new CSV with only those rows, and print a property match report for
 * arketa_reservations_history and arketa_classes.
 *
 * Usage:
 *   npx tsx scripts/filter-arketa-csv-by-date.ts /path/to/arketa-export.csv
 *
 * Output:
 *   - /path/to/arketa-export_filtered_2026-01-20_to_2026-03-04.csv
 *   - Console: row counts and which CSV columns map to the DB tables.
 */

import * as fs from "fs";
import * as path from "path";

const START_DATE = "2026-01-20";
const END_DATE = "2026-04-01";

const HISTORY_COLUMNS = [
  "reservation_id",
  "class_id",
  "client_id",
  "reservation_type",
  "class_name",
  "class_date",
  "status",
  "checked_in",
  "checked_in_at",
  "late_cancel",
  "gross_amount_paid",
  "net_amount_paid",
  "created_at_api",
  "updated_at_api",
  "spot_id",
  "spot_name",
  "client_email",
  "client_first_name",
  "client_last_name",
  "client_phone",
  "raw_data",
  "sync_batch_id",
] as const;

const CLASSES_COLUMNS = [
  "external_id",
  "class_date",
  "name",
  "start_time",
  "duration_minutes",
  "capacity",
  "booked_count",
  "waitlist_count",
  "status",
  "is_cancelled",
  "room_name",
  "instructor_name",
  "description",
  "location_id",
  "location_name",
  "raw_data",
  "synced_at",
  "updated_at",
  "updated_at_api",
  "is_deleted",
] as const;

// CSV header variants that map to our canonical names (case-insensitive, trim)
const CSV_TO_HISTORY_ALIASES: Record<string, string> = {
  id: "reservation_id",
  arketa_reservation_id: "reservation_id",
  arketa_class_id: "class_id",
  date: "class_date",
  "class date": "class_date",
};

const CSV_TO_CLASSES_ALIASES: Record<string, string> = {
  class_id: "external_id",
  class_name: "name",
  "class name": "name",
};

function parseCSV(content: string): { headers: string[]; rows: string[][]; delimiter: string } {
  const firstLine = content.split(/\r?\n/)[0] ?? "";
  const delimiter = firstLine.includes(";") ? ";" : ",";

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
    } else if (char === delimiter && !inQuotes) {
      currentRow.push(current);
      current = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && content[i + 1] === "\n") i++;
      currentRow.push(current);
      current = "";
      if (currentRow.some((c) => c.length > 0)) rows.push(currentRow);
      currentRow = [];
    } else {
      current += char;
    }
  }
  if (current.length > 0 || currentRow.length > 0) {
    currentRow.push(current);
    if (currentRow.some((c) => c.length > 0)) rows.push(currentRow);
  }
  const headerRow = rows.shift() ?? [];
  const headers = headerRow.map((h) => h.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));
  return { headers, rows, delimiter };
}

function unquote(value: string): string {
  const v = value.trim();
  if (v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1).replace(/""/g, '"');
  return v;
}

/** Normalize date string to YYYY-MM-DD or null. */
function normalizeDate(raw: string): string | null {
  const s = unquote(raw).trim();
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const m2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m2) return `${m2[3]}-${m2[1].padStart(2, "0")}-${m2[2].padStart(2, "0")}`;
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

/** Quote and escape a single cell per RFC 4180 (delimiter, quote, CR, LF). */
function stringifyCell(cell: string, delimiter: string): string {
  const needsQuotes = /[",\n\r]/.test(cell) || cell.includes(delimiter);
  return needsQuotes ? `"${cell.replace(/"/g, '""')}"` : cell;
}

function stringifyRow(row: string[], delimiter: string): string {
  return row.map((cell) => stringifyCell(cell, delimiter)).join(delimiter);
}

function findDateColumnIndex(headers: string[]): number {
  const lower = headers.map((h) => h.toLowerCase().trim());
  const idx = lower.findIndex(
    (h) =>
      h === "class_date" ||
      h === "class date" ||
      h === "date" ||
      h === "class date (pacific)" ||
      h === "class date (pst)"
  );
  return idx >= 0 ? idx : lower.findIndex((h) => h.includes("date"));
}

function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Usage: npx tsx scripts/filter-arketa-csv-by-date.ts /path/to/arketa-export.csv");
    process.exit(1);
  }
  const resolved = path.resolve(csvPath);
  if (!fs.existsSync(resolved)) {
    console.error("File not found:", resolved);
    process.exit(1);
  }

  const content = fs.readFileSync(resolved, "utf-8");
  const { headers, rows, delimiter } = parseCSV(content);
  const dateColIdx = findDateColumnIndex(headers);
  const dateHeader = dateColIdx >= 0 ? headers[dateColIdx] : null;

  const start = START_DATE;
  const end = END_DATE;
  const inRange: string[][] = [];
  const outOfRange: string[][] = [];
  let noDate = 0;
  let invalidDate = 0;

  for (const row of rows) {
    const dateVal =
      dateColIdx >= 0 && row[dateColIdx] !== undefined
        ? normalizeDate(row[dateColIdx])
        : null;
    if (!dateVal) {
      noDate++;
      outOfRange.push(row);
      continue;
    }
    if (dateVal < start || dateVal > end) {
      outOfRange.push(row);
      continue;
    }
    if (dateVal.length !== 10) invalidDate++;
    inRange.push(row);
  }

  const baseName = path.basename(resolved, path.extname(resolved));
  const outDir = path.dirname(resolved);
  const outPath = path.join(outDir, `${baseName}_filtered_${START_DATE}_to_${END_DATE}.csv`);
  const outContent = [headers.map((h) => stringifyCell(h, delimiter)).join(delimiter), ...inRange.map((r) => stringifyRow(r, delimiter))].join("\n");
  fs.writeFileSync(outPath, outContent, "utf-8");

  console.log("--- Filter result ---");
  console.log("Input file:", resolved);
  console.log("Date column used:", dateHeader ?? "(none found; no rows in range)");
  console.log("Date range:", start, "to", end);
  console.log("Total rows (excl. header):", rows.length);
  console.log("In range (written):", inRange.length);
  console.log("Out of range (dropped):", outOfRange.length);
  if (noDate > 0) console.log("Rows with missing/invalid date (dropped):", noDate);
  console.log("Output file:", outPath);
  console.log("");

  console.log("--- Property match report ---");
  console.log("CSV headers:", headers.join(", "));
  console.log("");

  const headerSet = new Set(headers.map((h) => h.toLowerCase().trim()));
  const norm = (h: string) => h.toLowerCase().trim();

  console.log("1) arketa_reservations_history");
  console.log("   Unique key: (reservation_id, class_id)");
  const historyAliasesByCol = new Map<string, string[]>();
  for (const [csvName, canonical] of Object.entries(CSV_TO_HISTORY_ALIASES)) {
    const key = canonical;
    if (!historyAliasesByCol.has(key)) historyAliasesByCol.set(key, []);
    historyAliasesByCol.get(key)!.push(csvName);
  }
  for (const col of HISTORY_COLUMNS) {
    const hasExact = headers.some((h) => norm(h) === col);
    const aliasNames = historyAliasesByCol.get(col) ?? [];
    const fromAlias = aliasNames.some((a) => headerSet.has(norm(a)));
    const inCsv = hasExact || fromAlias;
    const calculated = ["raw_data", "sync_batch_id"].includes(col);
    if (inCsv) console.log(`   ✅ ${col}: present in CSV`);
    else if (calculated) console.log(`   ⚙️  ${col}: not in CSV (calculated / optional)`);
    else console.log(`   ❌ ${col}: not in CSV (optional or use default)`);
  }
  console.log("   Do not map to history (dropped columns): purchase_id, experience_type");
  console.log("");

  console.log("2) arketa_classes (when derived from reservations CSV)");
  console.log("   Unique key: (external_id, class_date)");
  for (const col of CLASSES_COLUMNS) {
    const fromReservation = ["external_id", "class_date", "name"].includes(col);
    const inCsv =
      headers.some((h) => norm(h) === col) ||
      (col === "external_id" && (headerSet.has("class_id") || headerSet.has("arketa_class_id"))) ||
      (col === "name" && (headerSet.has("class_name") || headerSet.has("class name"))) ||
      (col === "class_date" && (headerSet.has("class_date") || headerSet.has("date")));
    const calculated = !["external_id", "class_date", "name"].includes(col);
    if (inCsv && fromReservation)
      console.log(`   ✅ ${col}: from CSV (class_id → external_id, class_name → name, class_date)`);
    else if (inCsv) console.log(`   ✅ ${col}: present in CSV`);
    else if (calculated) console.log(`   ⚙️  ${col}: not in CSV (calculated or default)`);
    else console.log(`   ❌ ${col}: not in CSV`);
  }
  console.log("");
  console.log("See docs/ARKETA_CSV_MAPPING.md for full mapping and import steps.");
}

main();

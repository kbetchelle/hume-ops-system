import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Strip triple-quote wrapping: """value""" -> value
function stripQuotes(val: string): string {
  let v = val.trim();
  while (v.startsWith('"""') && v.endsWith('"""')) {
    v = v.slice(3, -3);
  }
  while (v.startsWith('"') && v.endsWith('"') && v.length >= 2) {
    v = v.slice(1, -1);
  }
  return v.trim();
}

// Parse CSV line handling quoted fields
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result.map(stripQuotes);
}

const STATUS_MAP: Record<string, string> = {
  "checked in": "ATTENDED",
  confirmed: "CONFIRMED",
  canceled: "CANCELLED",
  cancelled: "CANCELLED",
  waitlist: "WAITLIST",
};

function generateRandom(len: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let r = "";
  for (let i = 0; i < len; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return r;
}

// Parse "Feb 22, 2026, 9:37 AM PST" -> Date (treat as America/Los_Angeles)
function parseTimeBooked(raw: string): Date | null {
  if (!raw) return null;
  // Detect if PDT or PST
  const isPDT = /PDT/i.test(raw);
  const cleaned = raw.replace(/\s*(PST|PDT|PT)\s*$/i, "").trim();
  const d = new Date(cleaned);
  if (isNaN(d.getTime())) return null;
  // new Date() parsed as UTC; shift to reflect LA local time
  // PST = UTC-8, PDT = UTC-7
  const offsetHours = isPDT ? 7 : 8;
  return new Date(d.getTime() + offsetHours * 60 * 60 * 1000);
}

// Parse MM/DD/YYYY -> YYYY-MM-DD (fallback only)
function parseClassDate(raw: string): string | null {
  if (!raw) return null;
  const parts = raw.split("/");
  if (parts.length !== 3) return null;
  const [m, d, y] = parts;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

// Extract YYYY-MM-DD in America/Los_Angeles from a UTC Date
function dateToLAString(d: Date): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(d); // returns YYYY-MM-DD
}

// Parse "Feb 22, 2026, 10:00 AM PST" -> ISO timestamp
function parseClassTime(raw: string): string | null {
  const d = parseTimeBooked(raw);
  if (!d) return null;
  return d.toISOString();
}

// Derive class_date from Class Time (preferred) or fall back to Class Date column
function deriveClassDate(classTime: string, classDateRaw: string): string | null {
  const d = parseTimeBooked(classTime);
  if (d) return dateToLAString(d);
  return parseClassDate(classDateRaw);
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  const headers = getCorsHeaders(req);

  try {
    const { csvContent, chunkInfo } = await req.json();
    if (!csvContent) {
      return new Response(JSON.stringify({ error: "No csvContent provided" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const syncBatchId = crypto.randomUUID();
    const lines = csvContent.split("\n").filter((l: string) => l.trim());
    if (lines.length < 2) {
      return new Response(
        JSON.stringify({ success: true, reservationsInserted: 0, classesUpserted: 0 }),
        { headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    // Parse header
    const headerFields = parseCsvLine(lines[0]).map((h: string) => h.toLowerCase().trim());
    const colIdx = (name: string) => headerFields.indexOf(name);

    const iFirstName = colIdx("first name");
    const iLastName = colIdx("last name");
    const iTimeBooked = colIdx("time booked");
    const iClassName = colIdx("class name");
    const iClassTime = colIdx("class time");
    const iInstructor = colIdx("instructor");
    const iLocation = colIdx("location");
    const iStatus = colIdx("status");
    const iClientId = colIdx("client id");
    const iClassId = colIdx("class id");
    const iClassDate = colIdx("class date");
    const iType = colIdx("type");

    // Parse all data rows
    interface ParsedRow {
      firstName: string;
      lastName: string;
      timeBooked: string;
      className: string;
      classTime: string;
      instructor: string;
      location: string;
      status: string;
      clientId: string;
      classId: string;
      classDate: string;
      type: string;
      rawCsv: string;
    }

    const rows: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const fields = parseCsvLine(lines[i]);
      if (fields.length < 5) continue; // skip malformed
      rows.push({
        firstName: fields[iFirstName] || "",
        lastName: fields[iLastName] || "",
        timeBooked: fields[iTimeBooked] || "",
        className: fields[iClassName] || "",
        classTime: fields[iClassTime] || "",
        instructor: fields[iInstructor] || "",
        location: fields[iLocation] || "",
        status: fields[iStatus] || "",
        clientId: fields[iClientId] || "",
        classId: fields[iClassId] || "",
        classDate: fields[iClassDate] || "",
        type: fields[iType] || "",
        rawCsv: lines[i],
      });
    }

    // Deduplicate: keep last entry per (clientId, classId, classDate)
    const deduped = new Map<string, ParsedRow>();
    for (const row of rows) {
      const key = `${row.clientId}|${row.classId}|${row.classDate}`;
      deduped.set(key, row); // last wins
    }
    const uniqueRows = Array.from(deduped.values());

    // --- 1. Extract & upsert classes ---
    const classMap = new Map<string, {
      externalId: string;
      name: string;
      classDate: string;
      startTime: string;
      instructor: string;
      location: string;
      bookedCount: number;
      waitlistCount: number;
    }>();

    for (const row of uniqueRows) {
      const cd = deriveClassDate(row.classTime, row.classDate);
      if (!row.classId || !cd) continue;
      const key = `${row.classId}|${cd}`;
      const existing = classMap.get(key);
      const statusLower = row.status.toLowerCase();
      const isCancelled = statusLower === "canceled" || statusLower === "cancelled";
      const isWaitlist = statusLower === "waitlist";

      if (!existing) {
        classMap.set(key, {
          externalId: row.classId,
          name: row.className || "Unknown",
          classDate: cd,
          startTime: parseClassTime(row.classTime) || new Date().toISOString(),
          instructor: row.instructor,
          location: row.location || "HUME",
          bookedCount: isCancelled || isWaitlist ? 0 : 1,
          waitlistCount: isWaitlist ? 1 : 0,
        });
      } else {
        if (!existing.name || existing.name === "Unknown") existing.name = row.className || existing.name;
        if (!existing.instructor) existing.instructor = row.instructor;
        if (!isCancelled && !isWaitlist) existing.bookedCount++;
        if (isWaitlist) existing.waitlistCount++;
      }
    }

    // Upsert classes in batches
    const classRecords = Array.from(classMap.values()).map((c) => ({
      external_id: c.externalId,
      name: c.name,
      class_date: c.classDate,
      start_time: c.startTime,
      instructor_name: c.instructor || null,
      location_name: "HUME",
      booked_count: c.bookedCount,
      waitlist_count: c.waitlistCount,
      is_cancelled: false,
      is_deleted: false,
      synced_at: new Date().toISOString(),
    }));

    let classesUpserted = 0;
    const CLASS_BATCH = 500;
    for (let i = 0; i < classRecords.length; i += CLASS_BATCH) {
      const batch = classRecords.slice(i, i + CLASS_BATCH);
      const { error, count } = await supabase.from("arketa_classes").upsert(batch, {
        onConflict: "external_id,class_date",
        count: "exact",
      });
      if (error) console.error("Class upsert error:", error.message);
      classesUpserted += count || batch.length;
    }

    // --- 2. Insert reservations ---
    const reservationRecords = [];
    for (const row of uniqueRows) {
      const cd = deriveClassDate(row.classTime, row.classDate);
      if (!row.clientId || !row.classId || !cd) continue;

      const tb = parseTimeBooked(row.timeBooked);
      const unixTs = tb ? Math.floor(tb.getTime() / 1000) : Math.floor(Date.now() / 1000);
      const reservationId = `${row.clientId}_${unixTs}_${generateRandom(8)}`;

      const statusLower = row.status.toLowerCase();
      const mappedStatus = STATUS_MAP[statusLower] || row.status.toUpperCase();
      const checkedIn = statusLower === "checked in";

      reservationRecords.push({
        reservation_id: reservationId,
        client_id: row.clientId,
        class_id: row.classId,
        class_name: row.className || null,
        class_date: cd,
        status: mappedStatus,
        checked_in: checkedIn,
        checked_in_at: checkedIn && tb ? tb.toISOString() : null,
        reservation_type: row.type || null,
        client_first_name: row.firstName || null,
        client_last_name: row.lastName || null,
        created_at_api: tb ? tb.toISOString() : null,
        late_cancel: false,
        raw_data: {
          first_name: row.firstName,
          last_name: row.lastName,
          time_booked: row.timeBooked,
          class_name: row.className,
          class_time: row.classTime,
          instructor: row.instructor,
          location: row.location,
          status: row.status,
          client_id: row.clientId,
          class_id: row.classId,
          class_date: row.classDate,
          type: row.type,
          source: "csv_import",
        },
        sync_batch_id: syncBatchId,
      });
    }

    let reservationsInserted = 0;
    const RES_BATCH = 500;
    const errors: string[] = [];
    for (let i = 0; i < reservationRecords.length; i += RES_BATCH) {
      const batch = reservationRecords.slice(i, i + RES_BATCH);
      const { error, count } = await supabase.from("arketa_reservations_history").upsert(batch, {
        onConflict: "reservation_id,class_id",
        count: "exact",
      });
      if (error) {
        console.error("Reservation upsert error:", error.message);
        errors.push(error.message);
      }
      reservationsInserted += count || batch.length;
    }

    return new Response(
      JSON.stringify({
        success: errors.length === 0,
        syncBatchId,
        totalRows: rows.length,
        uniqueRows: uniqueRows.length,
        classesUpserted,
        reservationsInserted,
        errors,
        chunkInfo,
      }),
      { headers: { ...headers, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("import-arketa-csv error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...headers, "Content-Type": "application/json" } }
    );
  }
});

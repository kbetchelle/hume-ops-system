import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Parse a semicolon-delimited CSV that may have multiline quoted fields.
 * Returns an array of string arrays (rows of cells).
 */
function parseSemicolonCsv(raw: string): string[][] {
  const rows: string[][] = [];
  let i = 0;
  const len = raw.length;

  while (i < len) {
    const row: string[] = [];
    // Parse one row (may span multiple lines due to quoted fields)
    while (i < len) {
      if (raw[i] === '"') {
        // Quoted field
        i++; // skip opening quote
        let field = "";
        while (i < len) {
          if (raw[i] === '"') {
            if (i + 1 < len && raw[i + 1] === '"') {
              field += '"';
              i += 2;
            } else {
              i++; // skip closing quote
              break;
            }
          } else {
            field += raw[i];
            i++;
          }
        }
        row.push(field);
        // skip delimiter or newline
        if (i < len && raw[i] === ";") {
          i++;
        } else if (i < len && (raw[i] === "\n" || raw[i] === "\r")) {
          if (raw[i] === "\r" && i + 1 < len && raw[i + 1] === "\n") i++;
          i++;
          break;
        }
      } else {
        // Unquoted field
        let field = "";
        while (i < len && raw[i] !== ";" && raw[i] !== "\n" && raw[i] !== "\r") {
          field += raw[i];
          i++;
        }
        row.push(field);
        if (i < len && raw[i] === ";") {
          i++;
        } else {
          if (i < len && raw[i] === "\r" && i + 1 < len && raw[i + 1] === "\n") i++;
          if (i < len) i++;
          break;
        }
      }
    }
    if (row.length > 0 && !(row.length === 1 && row[0] === "")) {
      rows.push(row);
    }
  }
  return rows;
}

function parseTargetDepts(raw: string): string[] | null {
  if (!raw || raw === "[]" || raw.trim() === "") return null;
  // Format: ["Concierge"] or ["front_of_house","cafe"]
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((s: string) => s.toLowerCase().replace(/ /g, "_"));
    }
  } catch {
    // Try manual parsing
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const { storagePath = "documents/imports/staff_announcements.csv", dryRun = false } = body;

    // Read CSV from storage
    const bucket = storagePath.split("/")[0];
    const path = storagePath.split("/").slice(1).join("/");
    const { data: fileData, error: dlErr } = await supabase.storage.from(bucket).download(path);
    if (dlErr || !fileData) {
      return new Response(JSON.stringify({ error: `Storage read failed: ${dlErr?.message}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const csvText = await fileData.text();
    const rows = parseSemicolonCsv(csvText);

    if (rows.length < 2) {
      return new Response(JSON.stringify({ error: "CSV has no data rows" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const headers = rows[0].map((h) => h.trim().toLowerCase());
    const colIdx = (name: string) => headers.indexOf(name);

    // Get existing IDs
    const { data: existing } = await supabase.from("staff_announcements").select("id");
    const existingIds = new Set((existing || []).map((r: { id: string }) => r.id));

    const records: Record<string, unknown>[] = [];
    const skipped: string[] = [];

    for (let r = 1; r < rows.length; r++) {
      const cells = rows[r];
      const id = cells[colIdx("id")]?.trim();
      if (!id) continue;

      if (existingIds.has(id)) {
        skipped.push(id);
        continue;
      }

      const title = cells[colIdx("title")]?.trim() || "";
      const content = cells[colIdx("content")]?.trim() || "";
      const priority = cells[colIdx("priority")]?.trim() || "normal";
      const targetDepts = parseTargetDepts(cells[colIdx("target_departments")] || "");
      const createdBy = cells[colIdx("created_by")]?.trim() || "Unknown";
      const createdAt = cells[colIdx("created_at")]?.trim() || null;
      const expiresAt = cells[colIdx("expires_at")]?.trim() || null;
      const isActive = cells[colIdx("is_active")]?.trim().toLowerCase() === "true";
      const scheduledAt = cells[colIdx("scheduled_at")]?.trim() || null;
      const photoUrl = cells[colIdx("photo_url")]?.trim() || null;
      const rawType = cells[colIdx("announcement_type")]?.trim() || "announcement";
      const announcementType = rawType === "alert" ? "announcement" : rawType;
      const weekStartDate = cells[colIdx("week_start_date")]?.trim() || null;

      records.push({
        id,
        title,
        content,
        priority,
        target_departments: targetDepts,
        created_by: createdBy,
        created_at: createdAt || undefined,
        expires_at: expiresAt || null,
        is_active: isActive,
        scheduled_at: scheduledAt || null,
        photo_url: photoUrl,
        announcement_type: announcementType,
        week_start_date: weekStartDate || null,
      });
    }

    if (dryRun) {
      return new Response(
        JSON.stringify({
          dryRun: true,
          totalCsvRows: rows.length - 1,
          toInsert: records.length,
          alreadyExist: skipped.length,
          sampleRecords: records.slice(0, 3),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let inserted = 0;
    let errors: string[] = [];
    const BATCH = 10;

    for (let i = 0; i < records.length; i += BATCH) {
      const batch = records.slice(i, i + BATCH);
      const { error: insertErr, data: insertData } = await supabase
        .from("staff_announcements")
        .insert(batch)
        .select("id");
      if (insertErr) {
        errors.push(`Batch ${Math.floor(i / BATCH) + 1}: ${insertErr.message}`);
      } else {
        inserted += insertData?.length ?? batch.length;
      }
    }

    return new Response(
      JSON.stringify({
        success: errors.length === 0,
        totalCsvRows: rows.length - 1,
        inserted,
        alreadyExisted: skipped.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

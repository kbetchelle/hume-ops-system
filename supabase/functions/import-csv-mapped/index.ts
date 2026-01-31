/**
 * Generic CSV Import Edge Function with Field Mapping
 * 
 * Accepts CSV content, target table name, and field mappings.
 * Supports both existing tables and creating new tables.
 * Uses upsert with a configurable unique key column.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FieldMapping {
  csvColumn: string;
  dbColumn: string;
  type: "text" | "number" | "boolean" | "date" | "json";
}

interface ImportRequest {
  csvContent: string;
  targetTable: string;
  fieldMappings: FieldMapping[];
  uniqueKeyColumn: string;
  createTable?: boolean;
}

interface ImportResult {
  success: boolean;
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
}

// Parse a CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Convert a value to the specified type
function convertValue(value: string, type: FieldMapping["type"]): unknown {
  if (!value || value.trim() === "") {
    return null;
  }

  const trimmed = value.trim();

  switch (type) {
    case "number":
      const num = Number(trimmed);
      return isNaN(num) ? null : num;

    case "boolean":
      const lower = trimmed.toLowerCase();
      if (["true", "1", "yes", "y"].includes(lower)) return true;
      if (["false", "0", "no", "n"].includes(lower)) return false;
      return null;

    case "date":
      // Try to parse as date
      const date = new Date(trimmed);
      if (isNaN(date.getTime())) return null;
      return date.toISOString();

    case "json":
      try {
        // If it looks like JSON, parse it
        if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
          return JSON.parse(trimmed);
        }
        // If it's a comma-separated list, convert to array
        if (trimmed.includes(",")) {
          return trimmed.split(",").map((s) => s.trim());
        }
        return trimmed;
      } catch {
        return trimmed;
      }

    case "text":
    default:
      return trimmed;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const body: ImportRequest = await req.json();
    const { csvContent, targetTable, fieldMappings, uniqueKeyColumn, createTable } = body;

    // Validate inputs
    if (!csvContent) {
      throw new Error("CSV content is required");
    }
    if (!targetTable) {
      throw new Error("Target table is required");
    }
    if (!fieldMappings || fieldMappings.length === 0) {
      throw new Error("Field mappings are required");
    }
    if (!uniqueKeyColumn) {
      throw new Error("Unique key column is required");
    }

    // Validate table name (prevent SQL injection)
    if (!/^[a-z_][a-z0-9_]*$/.test(targetTable)) {
      throw new Error("Invalid table name. Use lowercase letters, numbers, and underscores only.");
    }

    console.log(`Starting import to table: ${targetTable}`);
    console.log(`Unique key column: ${uniqueKeyColumn}`);
    console.log(`Field mappings (${fieldMappings.length} fields):`);
    fieldMappings.forEach((m) => {
      console.log(`  CSV "${m.csvColumn}" -> DB "${m.dbColumn}" (${m.type})`);
    });

    // Parse CSV
    const lines = csvContent.split("\n").filter((line) => line.trim());
    if (lines.length < 2) {
      throw new Error("CSV must have a header row and at least one data row");
    }

    const headers = parseCSVLine(lines[0]);
    console.log(`CSV headers: ${headers.join(", ")}`);

    // Create a mapping from CSV column name to index
    const headerIndexMap = new Map<string, number>();
    headers.forEach((header, index) => {
      headerIndexMap.set(header, index);
    });

    // Validate all mapped CSV columns exist
    for (const mapping of fieldMappings) {
      if (!headerIndexMap.has(mapping.csvColumn)) {
        throw new Error(`CSV column "${mapping.csvColumn}" not found in file`);
      }
    }

    // If creating a new table, create it first
    if (createTable) {
      console.log(`Creating new table: ${targetTable}`);
      
      // Build column definitions
      const columnDefs = fieldMappings.map((m) => {
        let sqlType = "TEXT";
        switch (m.type) {
          case "number":
            sqlType = "NUMERIC";
            break;
          case "boolean":
            sqlType = "BOOLEAN";
            break;
          case "date":
            sqlType = "TIMESTAMPTZ";
            break;
          case "json":
            sqlType = "JSONB";
            break;
        }
        const isUnique = m.dbColumn === uniqueKeyColumn;
        return `"${m.dbColumn}" ${sqlType}${isUnique ? " UNIQUE" : ""}`;
      }).join(",\n  ");

      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS "${targetTable}" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          ${columnDefs},
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;

      const { error: createError } = await supabase.rpc("exec_sql", {
        sql: createTableSQL,
      });

      if (createError) {
        console.error("Failed to create table:", createError);
        throw new Error(`Failed to create table: ${createError.message}`);
      }

      console.log(`Table ${targetTable} created successfully`);
    }

    // Parse all data rows
    const records: Record<string, unknown>[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i]);
        const record: Record<string, unknown> = {};

        for (const mapping of fieldMappings) {
          const columnIndex = headerIndexMap.get(mapping.csvColumn)!;
          const rawValue = values[columnIndex] || "";
          record[mapping.dbColumn] = convertValue(rawValue, mapping.type);
        }

        // Skip records where unique key is null/empty
        if (!record[uniqueKeyColumn]) {
          errors.push(`Row ${i + 1}: Missing unique key value`);
          continue;
        }

        records.push(record);
      } catch (err) {
        errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : "Parse error"}`);
      }
    }

    console.log(`Parsed ${records.length} valid records (${errors.length} errors)`);

    if (records.length === 0) {
      throw new Error("No valid records to import");
    }

    // Upsert in batches
    const BATCH_SIZE = 100;
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      
      // Get count before upsert
      const { count: countBefore } = await supabase
        .from(targetTable)
        .select("*", { count: "exact", head: true });

      // Upsert batch
      const { error: upsertError } = await supabase
        .from(targetTable)
        .upsert(batch, { onConflict: uniqueKeyColumn });

      if (upsertError) {
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        console.error(`Batch ${batchNum} upsert error:`, upsertError);
        console.error(`Batch ${batchNum} sample record:`, JSON.stringify(batch[0]));

        // Provide more helpful error message
        let errorDetail = upsertError.message;
        if (upsertError.message.includes("violates unique constraint")) {
          errorDetail = `Duplicate key: ${upsertError.message}`;
        } else if (upsertError.message.includes("column") && upsertError.message.includes("does not exist")) {
          errorDetail = `Column mismatch: ${upsertError.message}. Check your field mappings.`;
        } else if (upsertError.message.includes("ON CONFLICT")) {
          errorDetail = `Unique key error: The column "${uniqueKeyColumn}" may not have a UNIQUE constraint. ${upsertError.message}`;
        }

        errors.push(`Batch ${batchNum}: ${errorDetail}`);
        skipped += batch.length;
        continue;
      }

      // Get count after upsert
      const { count: countAfter } = await supabase
        .from(targetTable)
        .select("*", { count: "exact", head: true });

      const batchInserted = countAfter && countBefore !== null ? countAfter - countBefore : 0;
      const batchUpdated = batch.length - batchInserted;

      inserted += batchInserted;
      updated += batchUpdated;

      console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batchInserted} inserted, ${batchUpdated} updated`);
    }

    const result: ImportResult = {
      success: true,
      total: records.length,
      inserted,
      updated,
      skipped,
      errors: errors.slice(0, 10), // Return first 10 errors
    };

    console.log(`Import complete:`, result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Import error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

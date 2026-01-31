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
  overwriteExisting?: boolean; // If false, only insert new records, don't update existing
}

interface RecordError {
  rowNumber: number;
  reason: string;
  record?: Record<string, unknown>;
}

interface ImportResult {
  success: boolean;
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
  detailedErrors: RecordError[];
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
  // Handle completely empty values
  if (!value || value.trim() === "") {
    return null;
  }

  const trimmed = value.trim();

  switch (type) {
    case "number":
      // Be more lenient with number parsing
      const cleaned = trimmed.replace(/[,$]/g, ""); // Remove common separators
      const num = Number(cleaned);
      return isNaN(num) ? null : num;

    case "boolean":
      const lower = trimmed.toLowerCase();
      if (["true", "1", "yes", "y", "t"].includes(lower)) return true;
      if (["false", "0", "no", "n", "f"].includes(lower)) return false;
      // If it's a number, treat non-zero as true
      const numVal = Number(trimmed);
      if (!isNaN(numVal)) return numVal !== 0;
      return null;

    case "date":
      // Try to parse as date - be more permissive
      try {
        const date = new Date(trimmed);
        if (isNaN(date.getTime())) return null;
        return date.toISOString();
      } catch {
        return null;
      }

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
    const { csvContent, targetTable, fieldMappings, uniqueKeyColumn, createTable, overwriteExisting = true } = body;

    // #region agent log
    const logFile = "/Volumes/SSDdeKat/HUME_Project/hume-ops-system/.cursor/debug.log";
    const logEntry = JSON.stringify({location:'import-csv-mapped/index.ts:138',message:'HYPOTHESIS A: Edge function received request',data:{targetTable,uniqueKeyColumnReceived:uniqueKeyColumn,mappingsCount:fieldMappings?.length,firstMapping:fieldMappings?.[0],overwriteExisting},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})+'\n';
    try{await Deno.writeTextFile(logFile,logEntry,{append:true});}catch{}
    // #endregion

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
    const detailedErrors: RecordError[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i]);
        const record: Record<string, unknown> = {};

        // #region agent log
        if(i<=3){const logEntry=JSON.stringify({location:'import-csv-mapped/index.ts:244',message:`HYPOTHESIS D,E: Parsing row ${i} - first 3 rows only`,data:{rowNum:i,rawLine:lines[i].substring(0,200),parsedValuesCount:values.length,sampleValues:values.slice(0,5)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D,E'})+'\n';try{await Deno.writeTextFile("/Volumes/SSDdeKat/HUME_Project/hume-ops-system/.cursor/debug.log",logEntry,{append:true});}catch{}}
        // #endregion

        for (const mapping of fieldMappings) {
          const columnIndex = headerIndexMap.get(mapping.csvColumn)!;
          const rawValue = values[columnIndex] || "";
          const convertedValue = convertValue(rawValue, mapping.type);
          
          // Only set the value if it's not null or if it's the unique key column
          // This prevents filling the database with null values for optional fields
          if (convertedValue !== null || mapping.dbColumn === uniqueKeyColumn) {
            record[mapping.dbColumn] = convertedValue;
          }
        }

        // #region agent log
        if(i<=3){const logEntry=JSON.stringify({location:'import-csv-mapped/index.ts:258',message:`HYPOTHESIS A,C,E: Record ${i} after conversion - first 3 rows`,data:{rowNum:i,uniqueKeyColumn,uniqueKeyValue:record[uniqueKeyColumn],recordKeys:Object.keys(record),fullRecord:record},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,C,E'})+'\n';try{await Deno.writeTextFile("/Volumes/SSDdeKat/HUME_Project/hume-ops-system/.cursor/debug.log",logEntry,{append:true});}catch{}}
        // #endregion

        // Skip records where unique key is null/empty - but provide detailed reason
        const uniqueKeyValue = record[uniqueKeyColumn];
        if (!uniqueKeyValue || String(uniqueKeyValue).trim() === "") {
          const rawUniqueKeyColumn = fieldMappings.find(m => m.dbColumn === uniqueKeyColumn)?.csvColumn;
          const errorMsg = `Row ${i + 1}: Missing unique key value. Column "${uniqueKeyColumn}" (CSV: "${rawUniqueKeyColumn}") is empty or null`;
          errors.push(errorMsg);
          detailedErrors.push({
            rowNumber: i + 1,
            reason: `Missing or empty unique key field: ${uniqueKeyColumn} (CSV column: ${rawUniqueKeyColumn})`,
            record: record
          });

          // #region agent log
          if(i<=3){const logEntry=JSON.stringify({location:'import-csv-mapped/index.ts:268',message:`HYPOTHESIS A,C,E: SKIPPING row ${i} - unique key missing - first 3 skips`,data:{rowNum:i,uniqueKeyColumn,uniqueKeyValue,rawUniqueKeyColumn,recordKeys:Object.keys(record)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,C,E'})+'\n';try{await Deno.writeTextFile("/Volumes/SSDdeKat/HUME_Project/hume-ops-system/.cursor/debug.log",logEntry,{append:true});}catch{}}
          // #endregion

          console.log(`Skipping row ${i + 1}: unique key "${uniqueKeyColumn}" is empty. Raw values:`, values);
          continue;
        }

        records.push(record);
      } catch (err) {
        const errorMsg = `Row ${i + 1}: ${err instanceof Error ? err.message : "Parse error"}`;
        errors.push(errorMsg);
        detailedErrors.push({
          rowNumber: i + 1,
          reason: err instanceof Error ? err.message : "Parse error"
        });
      }
    }

    console.log(`Parsed ${records.length} valid records (${errors.length} errors)`);

    // #region agent log
    const logEntry2=JSON.stringify({location:'import-csv-mapped/index.ts:298',message:'HYPOTHESIS A,E: Parse complete - CRITICAL RESULT',data:{totalLinesInCSV:lines.length-1,recordsParsed:records.length,errorsCount:errors.length,detailedErrorsCount:detailedErrors.length,firstDetailedError:detailedErrors[0],uniqueKeyColumn},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,E'})+'\n';try{await Deno.writeTextFile("/Volumes/SSDdeKat/HUME_Project/hume-ops-system/.cursor/debug.log",logEntry2,{append:true});}catch{}
    // #endregion

    if (records.length === 0) {
      throw new Error("No valid records to import");
    }

    // Upsert or Insert in batches
    const BATCH_SIZE = 100;
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    console.log(`Overwrite existing: ${overwriteExisting}`);

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      
      // Get count before upsert
      const { count: countBefore } = await supabase
        .from(targetTable)
        .select("*", { count: "exact", head: true });

      // Upsert or insert based on overwriteExisting flag
      let upsertError, upsertData;
      
      if (overwriteExisting) {
        // Upsert: Insert new records or update existing ones
        const result = await supabase
          .from(targetTable)
          .upsert(batch, { onConflict: uniqueKeyColumn })
          .select();
        upsertError = result.error;
        upsertData = result.data;
      } else {
        // Insert only: Skip records that already exist
        const result = await supabase
          .from(targetTable)
          .insert(batch)
          .select();
        upsertError = result.error;
        upsertData = result.data;
      }

      if (upsertError) {
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
        
        // Add detailed error for each record in failed batch
        batch.forEach((record, idx) => {
          const globalRowNum = i + idx + 2; // +2 for header and 0-index
          detailedErrors.push({
            rowNumber: globalRowNum,
            reason: `Batch failure: ${errorDetail}`,
            record: record
          });
        });
        
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
      detailedErrors: detailedErrors.slice(0, 100), // Return first 100 detailed errors
    };

    console.log(`Import complete:`, result);
    console.log(`Detailed errors count: ${detailedErrors.length}`);

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

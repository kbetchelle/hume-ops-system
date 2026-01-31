import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

interface SkippedRecord {
  row: number;
  reason: string;
  data?: string;
}

interface ImportResult {
  success: boolean;
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  skippedRecords: SkippedRecord[];
  errors: string[];
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      if (line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = false;
      }
    } else if (char === ';' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseBoolean(value: string): boolean {
  return value?.toLowerCase() === 'true';
}

function parseJSON(value: string): unknown {
  if (!value || value === '{}' || value === '[]') return value === '[]' ? [] : {};
  try {
    return JSON.parse(value);
  } catch {
    return value === '[]' ? [] : {};
  }
}

function cleanPhone(phone: string): string | null {
  if (!phone) return null;
  // Remove tab characters and trim
  return phone.replace(/\t/g, '').trim() || null;
}

Deno.serve(async (req) => {
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = getCorsHeaders(req);

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const body = await req.json();
    const csvContent: string = body.csvContent;
    const chunkInfo = body.chunkInfo as { chunkIndex: number; totalChunks: number; startRow: number } | undefined;
    
    if (!csvContent) {
      throw new Error("No CSV content provided");
    }

    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = parseCSVLine(lines[0]);
    
    const chunkLabel = chunkInfo ? `[Chunk ${chunkInfo.chunkIndex + 1}/${chunkInfo.totalChunks}]` : '';
    console.log(`[import-clients-csv] ${chunkLabel} Headers:`, headers.slice(0, 5).join(', '), '...');
    console.log(`[import-clients-csv] ${chunkLabel} Total rows:`, lines.length - 1);

    // Map header indices
    const headerMap: Record<string, number> = {};
    headers.forEach((h, i) => { headerMap[h.toLowerCase().replace(/\s+/g, '_')] = i; });

    const result: ImportResult = {
      success: true,
      total: lines.length - 1,
      inserted: 0,
      updated: 0,
      skipped: 0,
      skippedRecords: [],
      errors: []
    };

    // Get existing external_ids for tracking inserts vs updates
    const { data: existingClients } = await supabase
      .from('arketa_clients')
      .select('external_id');
    
    const existingIds = new Set(existingClients?.map(c => c.external_id) || []);
    console.log("[import-clients-csv] Existing clients:", existingIds.size);

    // Process in batches
    const BATCH_SIZE = 500;
    const dataRows = lines.slice(1);
    
    for (let i = 0; i < dataRows.length; i += BATCH_SIZE) {
      const batch = dataRows.slice(i, i + BATCH_SIZE);
      const records: Record<string, unknown>[] = [];
      
      for (let j = 0; j < batch.length; j++) {
        const line = batch[j];
        const rowNum = i + j + 2; // +2 for 1-indexed and header row
        
        if (!line.trim()) {
          result.skipped++;
          result.skippedRecords.push({ row: rowNum, reason: "Empty row" });
          continue;
        }
        
        try {
          const values = parseCSVLine(line);
          const clientId = values[headerMap['client_id']];
          
          if (!clientId) {
            result.skipped++;
            result.skippedRecords.push({ 
              row: rowNum, 
              reason: "Missing client_id",
              data: values[headerMap['client_name']] || values[headerMap['email']] || 'Unknown'
            });
            continue;
          }

          const email = values[headerMap['email']]?.trim();
          if (!email) {
            result.skipped++;
            result.skippedRecords.push({ 
              row: rowNum, 
              reason: "Missing email",
              data: `client_id: ${clientId}, name: ${values[headerMap['client_name']] || 'Unknown'}`
            });
            continue;
          }

          const record = {
            external_id: clientId,
            client_email: email,
            client_name: values[headerMap['client_name']]?.trim() || null,
            client_phone: cleanPhone(values[headerMap['phone_number']]),
            client_tags: parseJSON(values[headerMap['tags']]) as string[],
            custom_fields: parseJSON(values[headerMap['custom_fields']]),
            lifecycle_stage: values[headerMap['lifecycle_stage_name']]?.trim() || null,
            date_of_birth: values[headerMap['date_of_birth']]?.trim() || null,
            referrer: values[headerMap['referrer']]?.trim() || null,
            email_mkt_opt_in: parseBoolean(values[headerMap['email_marketing_opt_in']]),
            sms_mkt_opt_in: parseBoolean(values[headerMap['sms_marketing_opt_in']]),
            raw_data: {
              csv_id: values[headerMap['id']],
              gender: values[headerMap['gender']],
              notes: values[headerMap['notes']],
              removed: parseBoolean(values[headerMap['removed']]),
              api_created_at: values[headerMap['api_created_at']],
              api_updated_at: values[headerMap['api_updated_at']],
            },
            last_synced_at: new Date().toISOString(),
          };

          // Track insert vs update
          if (existingIds.has(clientId)) {
            result.updated++;
          } else {
            result.inserted++;
            existingIds.add(clientId); // Add to set for subsequent batches
          }

          records.push(record);
        } catch (err) {
          const rowNum = i + batch.indexOf(line) + 2;
          result.skippedRecords.push({ 
            row: rowNum, 
            reason: `Parse error: ${err instanceof Error ? err.message : 'Unknown'}`,
          });
          result.errors.push(`Row ${rowNum} parse error: ${err}`);
          result.skipped++;
        }
      }

      if (records.length > 0) {
        const { error } = await supabase
          .from('arketa_clients')
          .upsert(records, { 
            onConflict: 'external_id',
            ignoreDuplicates: false 
          });

        if (error) {
          console.error("[import-clients-csv] Batch error:", error);
          result.errors.push(`Batch ${Math.floor(i/BATCH_SIZE) + 1}: ${error.message}`);
        }
      }

      console.log(`[import-clients-csv] Processed batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(dataRows.length/BATCH_SIZE)}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[import-clients-csv] Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

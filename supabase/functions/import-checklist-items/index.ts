import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { csvContent, clearExisting } = await req.json();

    if (!csvContent) {
      return new Response(
        JSON.stringify({ error: "CSV content is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Parse CSV (semicolon-delimited)
    const lines = csvContent.split("\n").filter((line: string) => line.trim());
    const headers = lines[0].split(";").map((h: string) => h.trim());
    
    console.log("Headers:", headers);
    console.log("Total lines:", lines.length);

    const records: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Handle quoted values with semicolons inside
      const values: string[] = [];
      let current = "";
      let inQuotes = false;
      
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ";" && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      if (values.length !== headers.length) {
        console.log(`Skipping line ${i}: column count mismatch (${values.length} vs ${headers.length})`);
        continue;
      }

      const record: any = {};
      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        let value = values[j];
        
        // Clean up quotes
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        
        // Convert empty strings to null
        if (value === "") {
          record[header] = null;
        } else if (header === "is_class_triggered" || header === "required" || header === "is_high_priority") {
          record[header] = value.toLowerCase() === "true";
        } else if (header === "sort_order" || header === "class_trigger_minutes_after") {
          record[header] = value ? parseInt(value, 10) : null;
        } else {
          record[header] = value;
        }
      }
      
      records.push(record);
    }

    console.log(`Parsed ${records.length} records`);

    // Clear existing if requested
    if (clearExisting) {
      const { error: deleteError } = await supabase
        .from("checklist_items")
        .delete()
        .gte("id", "00000000-0000-0000-0000-000000000000");
      
      if (deleteError) {
        console.error("Delete error:", deleteError);
        return new Response(
          JSON.stringify({ error: `Failed to clear existing data: ${deleteError.message}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }
      console.log("Cleared existing records");
    }

    // Insert in batches of 50
    const batchSize = 50;
    let inserted = 0;
    let errors: string[] = [];

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from("checklist_items")
        .insert(batch);
      
      if (insertError) {
        console.error(`Batch ${i / batchSize} error:`, insertError);
        errors.push(`Batch ${i / batchSize}: ${insertError.message}`);
      } else {
        inserted += batch.length;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalParsed: records.length,
        inserted,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SkippedRecord {
  row: number;
  reason: string;
  data?: string;
}

export interface ImportResult {
  success: boolean;
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  skippedRecords: SkippedRecord[];
  errors: string[];
}

// Client-side chunk size (rows per request)
const CHUNK_SIZE = 1000;

export function useCSVImport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<{
    isImporting: boolean;
    current: number;
    total: number;
    status: string;
  }>({
    isImporting: false,
    current: 0,
    total: 0,
    status: "",
  });

  const importMutation = useMutation({
    mutationFn: async (file: File): Promise<ImportResult> => {
      setProgress({ isImporting: true, current: 0, total: 0, status: "Reading file..." });
      
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headerLine = lines[0];
      const dataLines = lines.slice(1);
      const totalRows = dataLines.length;
      
      setProgress({ isImporting: true, current: 0, total: totalRows, status: "Processing..." });

      // Aggregate results across all chunks
      const aggregatedResult: ImportResult = {
        success: true,
        total: totalRows,
        inserted: 0,
        updated: 0,
        skipped: 0,
        skippedRecords: [],
        errors: [],
      };

      // Process in chunks
      const totalChunks = Math.ceil(dataLines.length / CHUNK_SIZE);
      
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const startIdx = chunkIndex * CHUNK_SIZE;
        const endIdx = Math.min(startIdx + CHUNK_SIZE, dataLines.length);
        const chunkLines = dataLines.slice(startIdx, endIdx);
        
        // Reconstruct CSV with header for this chunk
        const chunkCsv = [headerLine, ...chunkLines].join('\n');
        
        setProgress({ 
          isImporting: true, 
          current: startIdx, 
          total: totalRows, 
          status: `Processing chunk ${chunkIndex + 1}/${totalChunks}...` 
        });

        try {
          const { data, error } = await supabase.functions.invoke("import-clients-csv", {
            body: { 
              csvContent: chunkCsv,
              chunkInfo: {
                chunkIndex,
                totalChunks,
                startRow: startIdx + 2, // Account for header and 1-indexing
              }
            },
          });

          if (error) {
            aggregatedResult.errors.push(`Chunk ${chunkIndex + 1}: ${error.message}`);
            continue;
          }

          const chunkResult = data as ImportResult;
          
          // Aggregate results
          aggregatedResult.inserted += chunkResult.inserted || 0;
          aggregatedResult.updated += chunkResult.updated || 0;
          aggregatedResult.skipped += chunkResult.skipped || 0;
          
          // Adjust row numbers for skipped records
          if (chunkResult.skippedRecords) {
            const adjustedSkipped = chunkResult.skippedRecords.map(sr => ({
              ...sr,
              row: sr.row + startIdx, // Adjust for chunk offset
            }));
            aggregatedResult.skippedRecords.push(...adjustedSkipped);
          }
          
          if (chunkResult.errors) {
            aggregatedResult.errors.push(...chunkResult.errors);
          }

        } catch (err) {
          aggregatedResult.errors.push(`Chunk ${chunkIndex + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      setProgress({ isImporting: false, current: totalRows, total: totalRows, status: "Complete" });
      
      aggregatedResult.success = aggregatedResult.errors.length === 0;
      return aggregatedResult;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      const skippedMsg = data.skipped > 0 ? ` (${data.skipped} skipped)` : "";
      const errorMsg = data.errors.length > 0 ? ` with ${data.errors.length} errors` : "";
      toast({
        title: "Import Complete",
        description: `${data.inserted} inserted, ${data.updated} updated${skippedMsg}${errorMsg}`,
      });
    },
    onError: (error) => {
      setProgress(prev => ({ ...prev, isImporting: false, status: "Failed" }));
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  return {
    importCSV: importMutation.mutate,
    isImporting: importMutation.isPending || progress.isImporting,
    progress,
    result: importMutation.data,
    error: importMutation.error,
  };
}

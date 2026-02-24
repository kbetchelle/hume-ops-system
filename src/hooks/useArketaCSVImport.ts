import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ArketaCSVImportResult {
  success: boolean;
  totalRows: number;
  uniqueRows: number;
  classesUpserted: number;
  reservationsInserted: number;
  errors: string[];
}

const CHUNK_SIZE = 1000;

export function useArketaCSVImport() {
  const { toast } = useToast();
  const [progress, setProgress] = useState({
    isImporting: false,
    current: 0,
    total: 0,
    status: "",
  });
  const [result, setResult] = useState<ArketaCSVImportResult | null>(null);

  const importCSV = useCallback(async (file: File) => {
    setProgress({ isImporting: true, current: 0, total: 0, status: "Reading file..." });
    setResult(null);

    try {
      const text = await file.text();
      const lines = text.split("\n").filter((l) => l.trim());
      const headerLine = lines[0];
      const dataLines = lines.slice(1);
      const totalRows = dataLines.length;

      setProgress({ isImporting: true, current: 0, total: totalRows, status: "Processing..." });

      const aggregated: ArketaCSVImportResult = {
        success: true,
        totalRows,
        uniqueRows: 0,
        classesUpserted: 0,
        reservationsInserted: 0,
        errors: [],
      };

      const totalChunks = Math.ceil(dataLines.length / CHUNK_SIZE);

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, dataLines.length);
        const chunkCsv = [headerLine, ...dataLines.slice(start, end)].join("\n");

        setProgress({
          isImporting: true,
          current: start,
          total: totalRows,
          status: `Chunk ${i + 1}/${totalChunks}...`,
        });

        const { data, error } = await supabase.functions.invoke("import-arketa-csv", {
          body: { csvContent: chunkCsv, chunkInfo: { chunkIndex: i, totalChunks, startRow: start + 2 } },
        });

        if (error) {
          aggregated.errors.push(`Chunk ${i + 1}: ${error.message}`);
          continue;
        }

        aggregated.uniqueRows += data.uniqueRows || 0;
        aggregated.classesUpserted += data.classesUpserted || 0;
        aggregated.reservationsInserted += data.reservationsInserted || 0;
        if (data.errors?.length) aggregated.errors.push(...data.errors);
      }

      aggregated.success = aggregated.errors.length === 0;
      setResult(aggregated);
      setProgress({ isImporting: false, current: totalRows, total: totalRows, status: "Complete" });

      toast({
        title: "Arketa CSV Import Complete",
        description: `${aggregated.reservationsInserted} reservations, ${aggregated.classesUpserted} classes${aggregated.errors.length ? ` (${aggregated.errors.length} errors)` : ""}`,
      });
    } catch (err) {
      setProgress((p) => ({ ...p, isImporting: false, status: "Failed" }));
      toast({
        title: "Import Failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  }, [toast]);

  return { importCSV, isImporting: progress.isImporting, progress, result };
}

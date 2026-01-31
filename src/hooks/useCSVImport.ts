import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ImportResult {
  success: boolean;
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
}

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
      const totalRows = lines.length - 1; // Exclude header
      
      setProgress({ isImporting: true, current: 0, total: totalRows, status: "Uploading to server..." });

      // Send to edge function
      const { data, error } = await supabase.functions.invoke("import-clients-csv", {
        body: { csvContent: text },
      });

      if (error) {
        throw new Error(error.message || "Import failed");
      }

      setProgress({ isImporting: false, current: totalRows, total: totalRows, status: "Complete" });
      
      return data as ImportResult;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast({
        title: "Import Complete",
        description: `${data.inserted} inserted, ${data.updated} updated, ${data.skipped} skipped`,
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

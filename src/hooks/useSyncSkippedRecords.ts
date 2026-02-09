import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ApiSyncSkippedRecord {
  id: string;
  api_name: string;
  record_id: string;
  secondary_id: string | null;
  reason: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export function useSyncSkippedRecords(apiName: string | null, options?: { refetchInterval?: number }) {
  const refetchInterval = options?.refetchInterval ?? 30_000;

  return useQuery({
    queryKey: ["apiSyncSkippedRecords", apiName],
    queryFn: async () => {
      let query = supabase
        .from("api_sync_skipped_records")
        .select("*")
        .order("created_at", { ascending: false });

      if (apiName && apiName !== "all") {
        query = query.eq("api_name", apiName);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ApiSyncSkippedRecord[];
    },
    refetchInterval,
  });
}

export function useSyncSkippedRecordsApiNames() {
  return useQuery({
    queryKey: ["apiSyncSkippedRecordsApiNames"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_sync_skipped_records")
        .select("api_name")
        .order("api_name");

      if (error) throw error;
      const names = [...new Set((data ?? []).map((r: { api_name: string }) => r.api_name))];
      return names as string[];
    },
    refetchInterval: 60_000,
  });
}

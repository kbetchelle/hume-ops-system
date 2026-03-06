import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ApiLog {
  id: string;
  api_name: string;
  endpoint: string;
  sync_success: boolean;
  duration_ms: number | null;
  records_processed: number | null;
  records_inserted: number | null;
  records_updated: number | null;
  records_skipped: number | null;
  skip_reasons: Record<string, number> | null;
  response_status: number | null;
  error_message: string | null;
  triggered_by: string | null;
  created_at: string | null;
  parent_log_id: string | null;
}

interface UseApiLogsOptions {
  page?: number;
  pageSize?: number;
  apiFilter?: string;
  showErrorsOnly?: boolean;
}

export function useApiLogs(options: UseApiLogsOptions = {}) {
  const { page = 1, pageSize = 15, apiFilter, showErrorsOnly = false } = options;

  return useQuery({
    queryKey: ["apiLogs", page, pageSize, apiFilter, showErrorsOnly],
    queryFn: async () => {
      let query = supabase
        .from("api_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (apiFilter && apiFilter !== "all") {
        query = query.eq("api_name", apiFilter);
      }

      if (showErrorsOnly) {
        query = query.eq("sync_success", false);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;
      
      return {
        logs: data as ApiLog[],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
        currentPage: page,
      };
    },
    refetchInterval: 30000,
  });
}

// Get unique API names for filtering
export function useApiNames() {
  return useQuery({
    queryKey: ["apiNames"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_logs")
        .select("api_name")
        .order("api_name");

      if (error) throw error;
      
      const uniqueNames = [...new Set(data?.map(d => d.api_name) || [])];
      return uniqueNames;
    },
  });
}

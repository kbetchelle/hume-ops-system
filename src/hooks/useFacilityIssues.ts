import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/features/auth/AuthProvider";

export interface FacilityIssue {
  id: string;
  description: string;
  photo_url: string | null;
  reported_by_name: string;
  reported_by_id: string | null;
  source: "concierge" | "cafe" | "boh";
  status: "pending" | "resolved" | "dismissed";
  resolved_at: string | null;
  resolved_by_name: string | null;
  created_at: string;
  updated_at: string;
}

const FACILITY_ISSUES_KEY = "facility-issues";

export function useFacilityIssues(limit = 5) {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: [FACILITY_ISSUES_KEY, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("facility_issues")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []) as FacilityIssue[];
    },
    enabled: !!user?.id,
  });
}

export function useUpdateFacilityIssueStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async ({
      issueId,
      status,
      resolvedByName,
    }: {
      issueId: string;
      status: "resolved" | "dismissed";
      resolvedByName: string;
    }) => {
      const { error } = await supabase
        .from("facility_issues")
        .update({
          status,
          resolved_by_name: resolvedByName,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", issueId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FACILITY_ISSUES_KEY] });
    },
  });
}

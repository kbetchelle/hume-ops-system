import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/features/auth/AuthProvider";

const STAFF_QA_READS_KEY = "staff-qa-reads";
const UNREAD_QA_COUNT_KEY = "unread-qa-count";

/**
 * Count of unresolved Q&A questions that the current user (manager) has not read.
 * Used for dashboard banner badge.
 */
export function useUnreadQACount() {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: [UNREAD_QA_COUNT_KEY, user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      // Fetch qa_ids the user has read
      const { data: readRows, error: readError } = await supabase
        .from("staff_qa_reads")
        .select("qa_id")
        .eq("user_id", user.id);

      if (readError) throw readError;
      const readSet = new Set((readRows ?? []).map((r) => r.qa_id));

      // Fetch unresolved staff_qa ids
      const { data: unresolved, error } = await supabase
        .from("staff_qa")
        .select("id")
        .eq("is_resolved", false);

      if (error) throw error;
      const unreadCount = (unresolved ?? []).filter((q) => !readSet.has(q.id)).length;
      return unreadCount;
    },
    enabled: !!user?.id,
  });
}

/**
 * Mark a Q&A question as read for the current user.
 */
export function useMarkQAAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (qaId: string) => {
      if (!user?.id) return;
      const { error } = await supabase.from("staff_qa_reads").upsert(
        {
          qa_id: qaId,
          user_id: user.id,
          read_at: new Date().toISOString(),
        },
        { onConflict: "qa_id,user_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STAFF_QA_READS_KEY] });
      queryClient.invalidateQueries({ queryKey: [UNREAD_QA_COUNT_KEY] });
    },
  });
}

/**
 * Get read status for a set of Q&A ids for the current user.
 * Returns a Set of qa_id that have been read.
 */
export function useQAReadStatus(qaIds: string[]) {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: [STAFF_QA_READS_KEY, user?.id, qaIds.sort().join(",")],
    queryFn: async () => {
      if (!user?.id || qaIds.length === 0) return new Set<string>();

      const { data, error } = await supabase
        .from("staff_qa_reads")
        .select("qa_id")
        .eq("user_id", user.id)
        .in("qa_id", qaIds);

      if (error) throw error;
      return new Set((data ?? []).map((r) => r.qa_id));
    },
    enabled: !!user?.id && qaIds.length > 0,
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { toast } from "sonner";

export interface AnnouncementComment {
  id: string;
  announcement_id: string;
  user_id: string | null;
  user_name: string;
  comment: string;
  created_at: string;
}

/**
 * Fetch comments for a specific announcement
 */
export function useAnnouncementComments(announcementId: string | null) {
  return useQuery({
    queryKey: ["announcement-comments", announcementId],
    queryFn: async () => {
      if (!announcementId) return [];

      const { data, error } = await supabase
        .from("staff_announcement_comments")
        .select("*")
        .eq("announcement_id", announcementId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []) as AnnouncementComment[];
    },
    enabled: !!announcementId,
  });
}

/**
 * Get comment counts for multiple announcements
 */
export function useAnnouncementCommentCounts(announcementIds: string[]) {
  return useQuery({
    queryKey: ["announcement-comment-counts", announcementIds],
    queryFn: async () => {
      if (announcementIds.length === 0) return {};

      const { data, error } = await supabase
        .from("staff_announcement_comments")
        .select("announcement_id")
        .in("announcement_id", announcementIds);

      if (error) throw error;

      // Count comments per announcement
      const counts: Record<string, number> = {};
      (data || []).forEach((item) => {
        counts[item.announcement_id] = (counts[item.announcement_id] || 0) + 1;
      });

      return counts;
    },
    enabled: announcementIds.length > 0,
  });
}

/**
 * Add a comment to an announcement
 */
export function useAddAnnouncementComment() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async ({
      announcementId,
      comment,
    }: {
      announcementId: string;
      comment: string;
    }) => {
      // Get user's full name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user!.id)
        .single();

      const userName = profile?.full_name || user?.email || "Unknown";

      const { data, error } = await supabase
        .from("staff_announcement_comments")
        .insert({
          announcement_id: announcementId,
          user_id: user!.id,
          user_name: userName,
          comment: comment.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { announcementId }) => {
      queryClient.invalidateQueries({ queryKey: ["announcement-comments", announcementId] });
      queryClient.invalidateQueries({ queryKey: ["announcement-comment-counts"] });
    },
    onError: (error) => {
      toast.error("Failed to add comment: " + error.message);
    },
  });
}

/**
 * Delete a comment
 */
export function useDeleteAnnouncementComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      announcementId,
    }: {
      commentId: string;
      announcementId: string;
    }) => {
      const { error } = await supabase
        .from("staff_announcement_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
      return { announcementId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["announcement-comments", data.announcementId] });
      queryClient.invalidateQueries({ queryKey: ["announcement-comment-counts"] });
      toast.success("Comment deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete comment: " + error.message);
    },
  });
}

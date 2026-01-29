import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { toast } from "sonner";
import type { AppRole } from "@/types/roles";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  target_roles: AppRole[];
  created_by: string;
  created_at: string;
  updated_at: string;
  is_read?: boolean;
}

export function useAnnouncements() {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      // Get announcements
      const { data: announcements, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get read status for current user
      const { data: reads } = await supabase
        .from("announcement_reads")
        .select("announcement_id");

      const readIds = new Set(reads?.map((r) => r.announcement_id) || []);

      return (announcements || []).map((a) => ({
        ...a,
        target_roles: a.target_roles as AppRole[],
        is_read: readIds.has(a.id),
      })) as Announcement[];
    },
    enabled: !!user,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      content: string;
      target_roles: AppRole[];
    }) => {
      const { error } = await supabase.from("announcements").insert({
        title: data.title,
        content: data.content,
        target_roles: data.target_roles,
        created_by: user!.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement created");
    },
    onError: (error) => {
      toast.error("Failed to create announcement: " + error.message);
    },
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      title: string;
      content: string;
      target_roles: AppRole[];
    }) => {
      const { error } = await supabase
        .from("announcements")
        .update({
          title: data.title,
          content: data.content,
          target_roles: data.target_roles,
        })
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement updated");
    },
    onError: (error) => {
      toast.error("Failed to update announcement: " + error.message);
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete announcement: " + error.message);
    },
  });
}

export function useMarkAnnouncementRead() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (announcementId: string) => {
      const { error } = await supabase.from("announcement_reads").insert({
        announcement_id: announcementId,
        user_id: user!.id,
      });

      // Ignore duplicate key errors
      if (error && !error.message.includes("duplicate")) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
  });
}

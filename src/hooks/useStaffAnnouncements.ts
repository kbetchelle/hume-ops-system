import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { toast } from "sonner";

export interface StaffAnnouncement {
  id: string;
  title: string;
  content: string;
  announcement_type: "alert" | "weekly_update";
  priority: "low" | "normal" | "high" | "urgent";
  target_departments: string[] | null;
  week_start_date: string | null;
  photo_url: string | null;
  expires_at: string | null;
  scheduled_at: string | null;
  is_active: boolean;
  created_by: string;
  created_by_id: string | null;
  created_at: string;
}

export interface CreateStaffAnnouncementInput {
  title: string;
  content: string;
  announcement_type: "alert" | "weekly_update";
  priority?: "low" | "normal" | "high" | "urgent";
  target_departments?: string[] | null;
  week_start_date?: string | null;
  photo_url?: string | null;
  expires_at?: string | null;
  scheduled_at?: string | null;
}

export interface UpdateStaffAnnouncementInput extends CreateStaffAnnouncementInput {
  id: string;
  is_active?: boolean;
}

export interface ReadReceipt {
  staff_id: string;
  read_at: string;
  profile?: {
    full_name: string | null;
    email: string | null;
  };
  roles?: string[];
}

/**
 * Fetch all staff announcements (for managers)
 */
export function useStaffAnnouncements() {
  return useQuery({
    queryKey: ["staff-announcements-manager"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as StaffAnnouncement[];
    },
  });
}

/**
 * Fetch active staff announcements for concierge view
 */
export function useActiveStaffAnnouncements(userRole?: string) {
  return useQuery({
    queryKey: ["staff-announcements-active", userRole],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      let query = supabase
        .from("staff_announcements")
        .select("*")
        .eq("is_active", true)
        .or(`scheduled_at.is.null,scheduled_at.lte.${now}`)
        .or(`expires_at.is.null,expires_at.gte.${now}`)
        .order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      // Filter by target_departments on client side if userRole provided
      let filtered = data || [];
      if (userRole) {
        filtered = filtered.filter((a) => {
          // Show if no targeting (everyone) or if user's role is in target_departments
          if (!a.target_departments || a.target_departments.length === 0) {
            return true;
          }
          return a.target_departments.includes(userRole);
        });
      }

      return filtered as StaffAnnouncement[];
    },
  });
}

/**
 * Create a new staff announcement
 */
export function useCreateStaffAnnouncement() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (input: CreateStaffAnnouncementInput) => {
      // Get user's full name for created_by field
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user!.id)
        .single();

      const createdBy = profile?.full_name || user?.email || "Unknown";

      const { data, error } = await supabase
        .from("staff_announcements")
        .insert({
          title: input.title,
          content: input.content,
          announcement_type: input.announcement_type,
          priority: input.priority || "normal",
          target_departments: input.target_departments,
          week_start_date: input.week_start_date,
          photo_url: input.photo_url,
          expires_at: input.expires_at,
          scheduled_at: input.scheduled_at,
          is_active: true,
          created_by: createdBy,
          created_by_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-announcements-manager"] });
      queryClient.invalidateQueries({ queryKey: ["staff-announcements-active"] });
      queryClient.invalidateQueries({ queryKey: ["staff-announcements"] });
      toast.success("Announcement created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create announcement: " + error.message);
    },
  });
}

/**
 * Update an existing staff announcement
 */
export function useUpdateStaffAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateStaffAnnouncementInput) => {
      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from("staff_announcements")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-announcements-manager"] });
      queryClient.invalidateQueries({ queryKey: ["staff-announcements-active"] });
      queryClient.invalidateQueries({ queryKey: ["staff-announcements"] });
      toast.success("Announcement updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update announcement: " + error.message);
    },
  });
}

/**
 * Delete a staff announcement
 */
export function useDeleteStaffAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("staff_announcements")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-announcements-manager"] });
      queryClient.invalidateQueries({ queryKey: ["staff-announcements-active"] });
      queryClient.invalidateQueries({ queryKey: ["staff-announcements"] });
      toast.success("Announcement deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete announcement: " + error.message);
    },
  });
}

/**
 * Toggle announcement active status
 */
export function useToggleStaffAnnouncementActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("staff_announcements")
        .update({ is_active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, { is_active }) => {
      queryClient.invalidateQueries({ queryKey: ["staff-announcements-manager"] });
      queryClient.invalidateQueries({ queryKey: ["staff-announcements-active"] });
      queryClient.invalidateQueries({ queryKey: ["staff-announcements"] });
      toast.success(is_active ? "Announcement activated" : "Announcement deactivated");
    },
    onError: (error) => {
      toast.error("Failed to update announcement: " + error.message);
    },
  });
}

/**
 * Get read receipts for an announcement
 */
export function useAnnouncementReadReceipts(announcementId: string) {
  return useQuery({
    queryKey: ["announcement-read-receipts", announcementId],
    queryFn: async () => {
      // Get all reads for this announcement
      const { data: reads, error: readsError } = await supabase
        .from("staff_announcement_reads")
        .select("staff_id, read_at")
        .eq("announcement_id", announcementId);

      if (readsError) throw readsError;
      if (!reads || reads.length === 0) return [];

      // Get profile info for each reader
      const staffIds = reads.map((r) => r.staff_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", staffIds);

      // Get roles for each reader
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", staffIds);

      // Combine data
      const receipts: ReadReceipt[] = reads.map((read) => {
        const profile = profiles?.find((p) => p.user_id === read.staff_id);
        const userRoles = roles?.filter((r) => r.user_id === read.staff_id).map((r) => r.role) || [];
        
        return {
          staff_id: read.staff_id,
          read_at: read.read_at,
          profile: profile ? { full_name: profile.full_name, email: profile.email } : undefined,
          roles: userRoles,
        };
      });

      return receipts;
    },
    enabled: !!announcementId,
  });
}

/**
 * Upload a photo for an announcement
 */
export async function uploadAnnouncementPhoto(file: File): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `photos/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("staff-announcements")
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from("staff-announcements")
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Delete a photo from storage
 */
export async function deleteAnnouncementPhoto(photoUrl: string): Promise<void> {
  // Extract file path from URL
  const urlParts = photoUrl.split("/staff-announcements/");
  if (urlParts.length < 2) return;
  
  const filePath = urlParts[1];
  
  await supabase.storage
    .from("staff-announcements")
    .remove([filePath]);
}

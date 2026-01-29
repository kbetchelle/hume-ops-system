import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Member {
  id: string;
  external_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  phone: string | null;
  membership_tier: "basic" | "standard" | "premium" | "vip" | null;
  join_date: string | null;
  avatar_url: string | null;
  external_trainer_id: string | null;
  created_at: string;
  updated_at: string;
  last_synced_at: string | null;
}

export interface MemberNote {
  id: string;
  member_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export function useMembers(filters?: {
  search?: string;
  membershipTier?: string;
}) {
  return useQuery({
    queryKey: ["members", filters],
    queryFn: async () => {
      let query = supabase
        .from("members")
        .select("*")
        .order("full_name", { ascending: true });

      if (filters?.search) {
        query = query.or(
          `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
        );
      }

      if (filters?.membershipTier && filters.membershipTier !== "all") {
        query = query.eq(
          "membership_tier",
          filters.membershipTier as "basic" | "standard" | "premium" | "vip"
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Member[];
    },
  });
}

export function useMemberNotes(memberId: string) {
  return useQuery({
    queryKey: ["memberNotes", memberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("member_notes")
        .select("*")
        .eq("member_id", memberId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as MemberNote[];
    },
    enabled: !!memberId,
  });
}

export function useAddMemberNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      memberId,
      content,
      userId,
    }: {
      memberId: string;
      content: string;
      userId: string;
    }) => {
      const { data, error } = await supabase
        .from("member_notes")
        .insert({
          member_id: memberId,
          content,
          user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { memberId }) => {
      queryClient.invalidateQueries({ queryKey: ["memberNotes", memberId] });
      toast({
        title: "Note added",
        description: "Your note has been saved successfully.",
      });
    },
    onError: (error) => {
      console.error("Failed to add note:", error);
      toast({
        title: "Error",
        description: "Failed to add note. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useSyncMembers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("sync-members");

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast({
        title: "Sync complete",
        description: `Synced ${data.synced} of ${data.total} members.`,
      });
    },
    onError: (error) => {
      console.error("Sync failed:", error);
      toast({
        title: "Sync failed",
        description: "Failed to sync members. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useSyncLogs() {
  return useQuery({
    queryKey: ["syncLogs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("member_sync_log")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });
}

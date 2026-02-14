import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { useUserProfile } from "@/hooks/useUserRoles";
import { useToast } from "@/hooks/use-toast";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const SICK_DAY_REQUESTS_KEY = "sick-day-requests";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SickDayRequest {
  id: string;
  user_id: string;
  user_name: string;
  requested_dates: string[];
  notes: string;
  status: "pending" | "approved" | "rejected";
  reviewed_by_id: string | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Hook 1: useSickDayRequests
// Fetches a user's sick day requests
// ---------------------------------------------------------------------------

export function useSickDayRequests(userId?: string) {
  return useQuery({
    queryKey: [SICK_DAY_REQUESTS_KEY, userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("sick_day_requests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as SickDayRequest[];
    },
    enabled: !!userId,
  });
}

// ---------------------------------------------------------------------------
// Hook 2: useCreateSickDayRequest
// Mutation to create a new sick day request
// ---------------------------------------------------------------------------

export function useCreateSickDayRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const { data: profile } = useUserProfile(user?.id);
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      requestedDates,
      notes,
    }: {
      requestedDates: string[];
      notes: string;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");
      if (!profile?.full_name) throw new Error("User profile not loaded");

      const { data, error } = await supabase
        .from("sick_day_requests")
        .insert({
          user_id: user.id,
          user_name: profile.full_name,
          requested_dates: requestedDates,
          notes,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SICK_DAY_REQUESTS_KEY] });
      toast({
        title: "Request Submitted",
        description: "Your sick day pay request has been submitted to management.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to submit request: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Hook 3: useReviewSickDayRequest
// Mutation to approve/reject a sick day request (manager only)
// ---------------------------------------------------------------------------

export function useReviewSickDayRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const { data: profile } = useUserProfile(user?.id);
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      requestId,
      status,
      reviewNotes,
    }: {
      requestId: string;
      status: "approved" | "rejected";
      reviewNotes?: string;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");
      if (!profile?.full_name) throw new Error("User profile not loaded");

      const { data, error } = await supabase
        .from("sick_day_requests")
        .update({
          status,
          reviewed_by_id: user.id,
          reviewed_by_name: profile.full_name,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [SICK_DAY_REQUESTS_KEY] });
      queryClient.invalidateQueries({ queryKey: ["inbox-sick-day"] });
      queryClient.invalidateQueries({ queryKey: ["inbox-reads"] });
      queryClient.invalidateQueries({ queryKey: ["inbox-unread-count"] });
      
      toast({
        title: "Request Reviewed",
        description: `Sick day pay request has been ${variables.status}.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to review request: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

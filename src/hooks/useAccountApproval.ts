import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppRole, PendingApproval } from "@/types/roles";
import { toast } from "sonner";

// Hook to get pending approval requests
export function usePendingApprovals() {
  return useQuery({
    queryKey: ["pendingApprovals"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_pending_approvals");
      
      if (error) throw error;
      return (data as PendingApproval[]) || [];
    },
  });
}

// Hook to approve an account
export function useApproveAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      approvedRoles,
      notes,
    }: {
      userId: string;
      approvedRoles: AppRole[];
      notes?: string;
    }) => {
      const { error } = await supabase.rpc("manager_approve_account", {
        _user_id: userId,
        _approved_roles: approvedRoles,
        _notes: notes || null,
      });

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingApprovals"] });
      toast.success("Account approved successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve account: ${error.message}`);
    },
  });
}

// Hook to reject an account
export function useRejectAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      reason,
    }: {
      userId: string;
      reason: string;
    }) => {
      const { error } = await supabase.rpc("manager_reject_account", {
        _user_id: userId,
        _reason: reason,
      });

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingApprovals"] });
      toast.success("Account rejected");
    },
    onError: (error: Error) => {
      toast.error(`Failed to reject account: ${error.message}`);
    },
  });
}

// Hook to get count of pending approvals (for badges)
export function usePendingApprovalsCount() {
  const { data: approvals = [] } = usePendingApprovals();
  return approvals.length;
}

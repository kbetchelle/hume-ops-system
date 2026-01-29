import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppRole } from "@/types/roles";

export interface AdminUser {
  user_id: string;
  email: string;
  full_name: string | null;
  onboarding_completed: boolean | null;
  deactivated: boolean;
  created_at: string;
  roles: AppRole[];
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_all_users");
      
      if (error) throw error;
      return data as AdminUser[];
    },
  });
}

export function useUpdateUserRoles() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, roles }: { userId: string; roles: AppRole[] }) => {
      const { error } = await supabase.rpc("admin_update_user_roles", {
        _target_user_id: userId,
        _roles: roles,
      });
      
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useToggleUserDeactivation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, deactivated }: { userId: string; deactivated: boolean }) => {
      const { error } = await supabase.rpc("admin_toggle_user_deactivation", {
        _target_user_id: userId,
        _deactivated: deactivated,
      });
      
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

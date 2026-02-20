import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppRole } from "@/types/roles";

export interface AdminUser {
  user_id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  onboarding_completed: boolean | null;
  deactivated: boolean;
  created_at: string;
  roles: AppRole[];
  primary_role?: AppRole | null;
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
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["userRoles", userId] });
    },
  });
}

export function useUpdatePrimaryRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      primaryRole,
    }: {
      userId: string;
      primaryRole: AppRole | null;
    }) => {
      const { error } = await (supabase.rpc as any)("admin_set_primary_role", {
        _target_user_id: userId,
        _primary_role: primaryRole,
      });
      if (error) throw error;
      return { success: true };
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["userRoles", userId] });
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

export function useResetUserPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { userId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useUpdateUserUsername() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      username,
    }: {
      userId: string;
      username: string | null;
    }) => {
      const { error } = await (supabase.rpc as any)(
        "admin_update_user_username",
        { _target_user_id: userId, _username: username }
      );
      if (error) throw error;
      return { success: true };
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    },
  });
}

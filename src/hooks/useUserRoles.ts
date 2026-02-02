import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppRole, UserProfile, UserRole } from "@/types/roles";

export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();
      
      if (error) throw error;
      return data as UserProfile;
    },
    enabled: !!userId,
  });
}

export function useUserRoles(userId: string | undefined) {
  return useQuery({
    queryKey: ["userRoles", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", userId);
      
      if (error) throw error;
      return data as UserRole[];
    },
    enabled: !!userId,
  });
}

export function useAssignRoles() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, roles }: { userId: string; roles: AppRole[] }) => {
      // Insert all selected roles
      const rolesToInsert = roles.map(role => ({
        user_id: userId,
        role,
      }));
      
      const { error: rolesError } = await supabase
        .from("user_roles")
        .insert(rolesToInsert);
      
      if (rolesError) throw rolesError;
      
      // Mark onboarding as complete
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("user_id", userId);
      
      if (profileError) throw profileError;
      
      return { success: true };
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["userRoles", userId] });
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, fullName }: { userId: string; fullName: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("user_id", userId);
      
      if (error) throw error;
      return { success: true };
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    },
  });
}

export function getPrimaryRole(roles: UserRole[]): AppRole | null {
  if (roles.length === 0) return null;
  
  // Priority order for dashboard routing
  const priority: AppRole[] = [
    'admin',
    'manager',
    'concierge',
    'trainer',
    'female_spa_attendant',
    'male_spa_attendant',
    'floater',
  ];
  
  for (const role of priority) {
    if (roles.some(r => r.role === role)) {
      return role;
    }
  }
  
  return roles[0].role;
}

export function getRoleDashboardPath(role: AppRole): string {
  const paths: Record<AppRole, string> = {
    admin: '/dashboard/admin',
    manager: '/dashboard/manager',
    concierge: '/dashboard/concierge',
    trainer: '/dashboard/trainer',
    female_spa_attendant: '/dashboard/my-checklists',
    male_spa_attendant: '/dashboard/my-checklists',
    floater: '/dashboard/my-checklists',
  };
  
  return paths[role];
}

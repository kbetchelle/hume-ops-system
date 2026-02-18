import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppRole, UserProfile, UserRole, SlingUser } from "@/types/roles";

export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/f7f9292b-067f-48f6-a474-d24d84c0689d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useUserRoles.ts:9',message:'Fetching user profile',data:{userId},timestamp:Date.now(),hypothesisId:'H8,H9'})}).catch(()=>{});
      // #endregion
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();
      
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/f7f9292b-067f-48f6-a474-d24d84c0689d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useUserRoles.ts:17',message:'Profile fetch result',data:{userId,hasData:!!data,hasError:!!error,errorMsg:error?.message,onboardingCompleted:data?.onboarding_completed},timestamp:Date.now(),hypothesisId:'H8,H9'})}).catch(()=>{});
      // #endregion
      
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
      
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/f7f9292b-067f-48f6-a474-d24d84c0689d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useUserRoles.ts:28',message:'Fetching user roles',data:{userId},timestamp:Date.now(),hypothesisId:'H8,H9'})}).catch(()=>{});
      // #endregion
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", userId);
      
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/f7f9292b-067f-48f6-a474-d24d84c0689d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useUserRoles.ts:35',message:'Roles fetch result',data:{userId,hasData:!!data,dataCount:data?.length||0,hasError:!!error,errorMsg:error?.message,roles:data?.map(r=>r.role)||[]},timestamp:Date.now(),hypothesisId:'H8,H9'})}).catch(()=>{});
      // #endregion
      
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
    mutationFn: async ({
      userId,
      fullName,
      preferred_language,
    }: {
      userId: string;
      fullName?: string;
      preferred_language?: string | null;
    }) => {
      const updates: { full_name?: string; preferred_language?: string | null } = {};
      if (fullName !== undefined) updates.full_name = fullName;
      if (preferred_language !== undefined) updates.preferred_language = preferred_language;
      if (Object.keys(updates).length === 0) return { success: true };

      const { error } = await supabase
        .from("profiles")
        .update(updates)
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
    'cafe',
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
    female_spa_attendant: '/dashboard/spa/female',
    male_spa_attendant: '/dashboard/spa/male',
    floater: '/dashboard/floater',
    cafe: '/dashboard/cafe',
  };
  
  return paths[role];
}

// Hook to get Sling user info for profile
export function useSlingUser(slingId: string | null | undefined) {
  return useQuery({
    queryKey: ["slingUser", slingId],
    queryFn: async () => {
      if (!slingId) return null;
      
      const { data, error } = await supabase
        .from("sling_users")
        .select("*")
        .eq("id", slingId)
        .single();
      
      if (error) throw error;
      return data as SlingUser;
    },
    enabled: !!slingId,
  });
}

// Hook to get suggested roles from Sling positions
export function useSlingRoles(slingId: string | null | undefined) {
  return useQuery({
    queryKey: ["slingRoles", slingId],
    queryFn: async () => {
      if (!slingId) return [];
      
      const { data, error } = await supabase.rpc("get_sling_roles_for_user", {
        _sling_id: slingId,
      });
      
      if (error) throw error;
      return (data as AppRole[]) || [];
    },
    enabled: !!slingId,
  });
}

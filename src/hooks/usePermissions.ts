import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { useUserRoles } from "./useUserRoles";
import { AppRole } from "@/types/roles";

export interface Permission {
  id: string;
  role: AppRole;
  permission: string;
}

// Define all available permissions
export const PERMISSIONS = {
  // Member management
  VIEW_MEMBERS: "view_members",
  MANAGE_MEMBERS: "manage_members",
  ASSIGN_TRAINERS: "assign_trainers",
  
  // Training
  VIEW_TRAINING_PLANS: "view_training_plans",
  CREATE_TRAINING_PLANS: "create_training_plans",
  MANAGE_TRAINING_PLANS: "manage_training_plans",
  
  // Communications
  VIEW_ANNOUNCEMENTS: "view_announcements",
  CREATE_ANNOUNCEMENTS: "create_announcements",
  MANAGE_COMMUNICATIONS: "manage_communications",
  
  // Checklists
  VIEW_CHECKLISTS: "view_checklists",
  COMPLETE_CHECKLISTS: "complete_checklists",
  MANAGE_CHECKLISTS: "manage_checklists",
  
  // Reports
  VIEW_REPORTS: "view_reports",
  CREATE_REPORTS: "create_reports",
  MANAGE_REPORTS: "manage_reports",
  
  // Analytics
  VIEW_ANALYTICS: "view_analytics",
  
  // Admin
  MANAGE_USERS: "manage_users",
  MANAGE_ROLES: "manage_roles",
} as const;

// Default role permissions (fallback if not in database)
const DEFAULT_ROLE_PERMISSIONS: Record<AppRole, string[]> = {
  admin: Object.values(PERMISSIONS),
  manager: [
    PERMISSIONS.VIEW_MEMBERS,
    PERMISSIONS.MANAGE_MEMBERS,
    PERMISSIONS.ASSIGN_TRAINERS,
    PERMISSIONS.VIEW_TRAINING_PLANS,
    PERMISSIONS.MANAGE_TRAINING_PLANS,
    PERMISSIONS.VIEW_ANNOUNCEMENTS,
    PERMISSIONS.CREATE_ANNOUNCEMENTS,
    PERMISSIONS.MANAGE_COMMUNICATIONS,
    PERMISSIONS.VIEW_CHECKLISTS,
    PERMISSIONS.MANAGE_CHECKLISTS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_REPORTS,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  concierge: [
    PERMISSIONS.VIEW_MEMBERS,
    PERMISSIONS.VIEW_ANNOUNCEMENTS,
    PERMISSIONS.VIEW_CHECKLISTS,
    PERMISSIONS.COMPLETE_CHECKLISTS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.CREATE_REPORTS,
    PERMISSIONS.MANAGE_COMMUNICATIONS,
  ],
  trainer: [
    PERMISSIONS.VIEW_MEMBERS,
    PERMISSIONS.VIEW_TRAINING_PLANS,
    PERMISSIONS.CREATE_TRAINING_PLANS,
    PERMISSIONS.VIEW_ANNOUNCEMENTS,
    PERMISSIONS.MANAGE_COMMUNICATIONS,
  ],
  female_spa_attendant: [
    PERMISSIONS.VIEW_ANNOUNCEMENTS,
    PERMISSIONS.VIEW_CHECKLISTS,
    PERMISSIONS.COMPLETE_CHECKLISTS,
  ],
  male_spa_attendant: [
    PERMISSIONS.VIEW_ANNOUNCEMENTS,
    PERMISSIONS.VIEW_CHECKLISTS,
    PERMISSIONS.COMPLETE_CHECKLISTS,
  ],
  floater: [
    PERMISSIONS.VIEW_ANNOUNCEMENTS,
    PERMISSIONS.VIEW_CHECKLISTS,
    PERMISSIONS.COMPLETE_CHECKLISTS,
  ],
  cafe: [
    PERMISSIONS.VIEW_ANNOUNCEMENTS,
    PERMISSIONS.VIEW_CHECKLISTS,
    PERMISSIONS.COMPLETE_CHECKLISTS,
  ],
};

export function usePermissions() {
  const { user } = useAuthContext();
  const { data: userRoles, isLoading: rolesLoading } = useUserRoles(user?.id);

  // Fetch permissions from database
  const { data: dbPermissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ["rolePermissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("*");
      
      if (error) throw error;
      return data as Permission[];
    },
    enabled: !!user,
  });

  const isLoading = rolesLoading || permissionsLoading;

  // Get all permissions for the user's roles
  const getUserPermissions = (): string[] => {
    if (!userRoles || userRoles.length === 0) return [];

    const permissions = new Set<string>();

    userRoles.forEach(userRole => {
      // Check database permissions first
      const roleDbPermissions = dbPermissions?.filter(p => p.role === userRole.role) || [];
      
      if (roleDbPermissions.length > 0) {
        roleDbPermissions.forEach(p => permissions.add(p.permission));
      } else {
        // Fallback to default permissions
        const defaultPerms = DEFAULT_ROLE_PERMISSIONS[userRole.role] || [];
        defaultPerms.forEach(p => permissions.add(p));
      }
    });

    return Array.from(permissions);
  };

  // Check if user has a specific permission
  const hasPermission = (permission: string): boolean => {
    const permissions = getUserPermissions();
    return permissions.includes(permission);
  };

  // Check if user has any of the specified permissions
  const hasAnyPermission = (requiredPermissions: string[]): boolean => {
    const permissions = getUserPermissions();
    return requiredPermissions.some(p => permissions.includes(p));
  };

  // Check if user has all of the specified permissions
  const hasAllPermissions = (requiredPermissions: string[]): boolean => {
    const permissions = getUserPermissions();
    return requiredPermissions.every(p => permissions.includes(p));
  };

  // Check if user has a specific role
  const hasRole = (role: AppRole): boolean => {
    return userRoles?.some(r => r.role === role) || false;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles: AppRole[]): boolean => {
    return userRoles?.some(r => roles.includes(r.role)) || false;
  };

  // Check if user is admin or manager
  const isManagerOrAdmin = (): boolean => {
    return hasAnyRole(["admin", "manager"]);
  };

  // Check if user is admin
  const isAdmin = (): boolean => {
    return hasRole("admin");
  };

  return {
    isLoading,
    permissions: getUserPermissions(),
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isManagerOrAdmin,
    isAdmin,
    userRoles: userRoles || [],
  };
}

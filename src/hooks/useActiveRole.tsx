import { useState, createContext, useContext, ReactNode, useEffect } from "react";
import { AppRole, UserRole, ROLES } from "@/types/roles";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles, getPrimaryRole, getRoleDashboardPath } from "@/hooks/useUserRoles";
import { getStorageItem, setStorageItem } from "@/lib/storage";

interface ActiveRoleContextType {
  activeRole: AppRole | null;
  setActiveRole: (role: AppRole) => void;
  availableRoles: UserRole[];
  isLoading: boolean;
  getDashboardPath: () => string;
  getRoleLabel: (role: AppRole) => string;
}

const ActiveRoleContext = createContext<ActiveRoleContextType | undefined>(undefined);

export function ActiveRoleProvider({ children }: { children: ReactNode }) {
  // Use useAuth directly instead of useAuthContext to avoid context dependency issues during HMR
  const { user } = useAuth();
  const { data: userRoles, isLoading } = useUserRoles(user?.id);
  const [activeRole, setActiveRoleState] = useState<AppRole | null>(null);

  // Initialize active role from localStorage or primary role
  useEffect(() => {
    if (userRoles && userRoles.length > 0) {
      const storedRole = getStorageItem(`activeRole_${user?.id}`);

      if (storedRole && userRoles.some(r => r.role === storedRole)) {
        setActiveRoleState(storedRole as AppRole);
      } else {
        const primary = getPrimaryRole(userRoles);
        if (primary) {
          setActiveRoleState(primary);
        }
      }
    }
  }, [userRoles, user?.id]);

  const setActiveRole = (role: AppRole) => {
    if (user?.id) {
      setStorageItem(`activeRole_${user.id}`, role);
    }
    setActiveRoleState(role);
  };

  const getDashboardPath = () => {
    if (!activeRole) return "/dashboard";
    return getRoleDashboardPath(activeRole);
  };

  const getRoleLabel = (role: AppRole) => {
    const roleInfo = ROLES.find(r => r.value === role);
    return roleInfo?.label || role;
  };

  return (
    <ActiveRoleContext.Provider
      value={{
        activeRole,
        setActiveRole,
        availableRoles: userRoles || [],
        isLoading,
        getDashboardPath,
        getRoleLabel,
      }}
    >
      {children}
    </ActiveRoleContext.Provider>
  );
}

export function useActiveRole() {
  const context = useContext(ActiveRoleContext);
  if (context === undefined) {
    throw new Error("useActiveRole must be used within an ActiveRoleProvider");
  }
  return context;
}

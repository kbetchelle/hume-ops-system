import { useState, createContext, useContext, ReactNode, useEffect } from "react";
import { AppRole, UserRole, ROLES } from "@/types/roles";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles, getPrimaryRole, getRoleDashboardPath } from "@/hooks/useUserRoles";

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
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/f7f9292b-067f-48f6-a474-d24d84c0689d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useActiveRole.tsx:24',message:'Active role initialization',data:{hasUserRoles:!!userRoles,rolesCount:userRoles?.length||0,userId:user?.id,isLoading},timestamp:Date.now(),hypothesisId:'H4,H5'})}).catch(()=>{});
    // #endregion
    
    if (userRoles && userRoles.length > 0) {
      const storedRole = localStorage.getItem(`activeRole_${user?.id}`);
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/f7f9292b-067f-48f6-a474-d24d84c0689d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useActiveRole.tsx:27',message:'Role selection logic',data:{storedRole,availableRoles:userRoles.map(r=>r.role),hasMatchingRole:storedRole&&userRoles.some(r=>r.role===storedRole)},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
      // #endregion
      
      if (storedRole && userRoles.some(r => r.role === storedRole)) {
        setActiveRoleState(storedRole as AppRole);
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/f7f9292b-067f-48f6-a474-d24d84c0689d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useActiveRole.tsx:28',message:'Using stored role',data:{role:storedRole},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
        // #endregion
      } else {
        const primary = getPrimaryRole(userRoles);
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/f7f9292b-067f-48f6-a474-d24d84c0689d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useActiveRole.tsx:31',message:'Using primary role',data:{primaryRole:primary,allRoles:userRoles.map(r=>r.role)},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
        // #endregion
        if (primary) {
          setActiveRoleState(primary);
        }
      }
    }
  }, [userRoles, user?.id]);

  const setActiveRole = (role: AppRole) => {
    if (user?.id) {
      localStorage.setItem(`activeRole_${user.id}`, role);
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

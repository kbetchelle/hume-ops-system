import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { useUserProfile, useUserRoles } from "@/hooks/useUserRoles";
import { AppRole } from "@/types/roles";
import { Loader2 } from "lucide-react";
import { SyncProfileLanguage } from "@/components/shared/SyncProfileLanguage";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: AppRole[];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const { user, loading: authLoading } = useAuthContext();
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id);
  const { data: roles, isLoading: rolesLoading } = useUserRoles(user?.id);

  const isLoading = authLoading || profileLoading || rolesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Authenticated but hasn't completed onboarding
  if (profile && !profile.onboarding_completed && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // Check role requirements if specified
  if (requiredRoles && requiredRoles.length > 0 && roles) {
    const userRoleValues = roles.map(r => r.role);
    const hasRequiredRole = requiredRoles.some(role => userRoleValues.includes(role));
    
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return (
    <>
      <SyncProfileLanguage />
      {children}
    </>
  );
}

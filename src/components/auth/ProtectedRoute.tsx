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
  const { user, loading: authLoading, isLocked, sessionExpired } = useAuthContext();
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

  // Not authenticated (and not locked, and not session expired — overlay is shown by AuthProvider)
  if (!user && !isLocked && !sessionExpired) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Session expired: render children; UserSwitchScreen overlay is shown by AuthProvider
  if (sessionExpired) {
    return <>{children}</>;
  }

  // Locked: render children; LockScreen overlay is shown by AuthProvider
  if (isLocked) {
    return <>{children}</>;
  }

  // Deactivated users - takes precedence over everything
  if (profile?.deactivated) {
    if (location.pathname !== "/account-disabled") {
      return <Navigate to="/account-disabled" replace />;
    }
  }

  // Authenticated but hasn't completed onboarding
  if (profile && !profile.onboarding_completed && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // Completed onboarding but pending approval
  if (
    profile?.onboarding_completed &&
    profile?.approval_status === "pending" &&
    location.pathname !== "/pending-approval"
  ) {
    return <Navigate to="/pending-approval" replace />;
  }

  // Rejected accounts
  if (
    profile?.approval_status === "rejected" &&
    location.pathname !== "/account-disabled"
  ) {
    return <Navigate to="/account-disabled" replace />;
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

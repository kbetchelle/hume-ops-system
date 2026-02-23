import { useAuthContext } from "@/features/auth/AuthProvider";
import { useUserRoles, useUserProfile, getPrimaryRole, getRoleDashboardPath } from "@/hooks/useUserRoles";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuthContext();
  const { data: roles, isLoading: rolesLoading } = useUserRoles(user?.id);
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id);

  if (rolesLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user hasn't completed onboarding, redirect there
  if (profile && !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  // Redirect to role-appropriate dashboard
  if (roles && roles.length > 0) {
    const effectivePrimary =
      profile?.primary_role && roles.some((r) => r.role === profile.primary_role)
        ? profile.primary_role
        : getPrimaryRole(roles);
    if (effectivePrimary) {
      return <Navigate to={getRoleDashboardPath(effectivePrimary)} replace />;
    }
  }

  // Fallback
  return <Navigate to="/onboarding" replace />;
}

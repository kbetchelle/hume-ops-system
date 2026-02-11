import { useAuthContext } from "@/features/auth/AuthProvider";
import { useUserRoles, useUserProfile, getPrimaryRole, getRoleDashboardPath } from "@/hooks/useUserRoles";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuthContext();
  const { data: roles, isLoading: rolesLoading } = useUserRoles(user?.id);
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id);

  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/f7f9292b-067f-48f6-a474-d24d84c0689d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.tsx:7',message:'Dashboard render',data:{hasUser:!!user,userId:user?.id,rolesLoading,profileLoading,hasRoles:!!roles,rolesCount:roles?.length||0,hasProfile:!!profile,onboardingCompleted:profile?.onboarding_completed},timestamp:Date.now(),hypothesisId:'H5,H11'})}).catch(()=>{});
  // #endregion

  if (rolesLoading || profileLoading) {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/f7f9292b-067f-48f6-a474-d24d84c0689d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.tsx:11',message:'Dashboard loading state',data:{rolesLoading,profileLoading},timestamp:Date.now(),hypothesisId:'H3,H5'})}).catch(()=>{});
    // #endregion
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user hasn't completed onboarding, redirect there
  if (profile && !profile.onboarding_completed) {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/f7f9292b-067f-48f6-a474-d24d84c0689d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.tsx:20',message:'Redirecting to onboarding',data:{userId:user?.id},timestamp:Date.now(),hypothesisId:'H11'})}).catch(()=>{});
    // #endregion
    return <Navigate to="/onboarding" replace />;
  }

  // Redirect to role-appropriate dashboard
  if (roles && roles.length > 0) {
    const primaryRole = getPrimaryRole(roles);
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/f7f9292b-067f-48f6-a474-d24d84c0689d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.tsx:26',message:'Redirecting to role dashboard',data:{primaryRole,dashboardPath:primaryRole?getRoleDashboardPath(primaryRole):'none',allRoles:roles.map(r=>r.role)},timestamp:Date.now(),hypothesisId:'H5,H11'})}).catch(()=>{});
    // #endregion
    if (primaryRole) {
      return <Navigate to={getRoleDashboardPath(primaryRole)} replace />;
    }
  }

  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/f7f9292b-067f-48f6-a474-d24d84c0689d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.tsx:33',message:'Fallback redirect to onboarding',data:{hasRoles:!!roles,rolesCount:roles?.length||0},timestamp:Date.now(),hypothesisId:'H11'})}).catch(()=>{});
  // #endregion

  // Fallback - shouldn't normally reach here
  return <Navigate to="/onboarding" replace />;
}

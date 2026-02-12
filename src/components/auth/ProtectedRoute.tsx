import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { useUserProfile, useUserRoles } from "@/hooks/useUserRoles";
import { AppRole } from "@/types/roles";
import { Loader2 } from "lucide-react";
import { SyncProfileLanguage } from "@/components/shared/SyncProfileLanguage";
import { ForcePasswordChangeDialog } from "@/components/auth/ForcePasswordChangeDialog";

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

  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/f7f9292b-067f-48f6-a474-d24d84c0689d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProtectedRoute.tsx:14',message:'ProtectedRoute render',data:{pathname:location.pathname,hasUser:!!user,authLoading,profileLoading,rolesLoading,isLoading,hasProfile:!!profile,onboardingCompleted:profile?.onboarding_completed,hasRoles:!!roles,rolesCount:roles?.length||0,requiredRoles,userRoles:roles?.map(r=>r.role)||[]},timestamp:Date.now(),hypothesisId:'H10'})}).catch(()=>{});
  // #endregion

  if (isLoading) {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/f7f9292b-067f-48f6-a474-d24d84c0689d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProtectedRoute.tsx:21',message:'ProtectedRoute loading state',data:{pathname:location.pathname,authLoading,profileLoading,rolesLoading},timestamp:Date.now(),hypothesisId:'H10'})}).catch(()=>{});
    // #endregion
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/f7f9292b-067f-48f6-a474-d24d84c0689d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProtectedRoute.tsx:30',message:'Redirecting unauthenticated user',data:{pathname:location.pathname},timestamp:Date.now(),hypothesisId:'H10'})}).catch(()=>{});
    // #endregion
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Deactivated users - takes precedence over everything
  if (profile?.deactivated) {
    if (location.pathname !== "/account-disabled") {
      return <Navigate to="/account-disabled" replace />;
    }
  }

  // Authenticated but hasn't completed onboarding
  if (profile && !profile.onboarding_completed && location.pathname !== "/onboarding") {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/f7f9292b-067f-48f6-a474-d24d84c0689d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProtectedRoute.tsx:35',message:'Redirecting to onboarding',data:{pathname:location.pathname,userId:user.id},timestamp:Date.now(),hypothesisId:'H10'})}).catch(()=>{});
    // #endregion
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
    
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/f7f9292b-067f-48f6-a474-d24d84c0689d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProtectedRoute.tsx:44',message:'Role check',data:{pathname:location.pathname,requiredRoles,userRoles:userRoleValues,hasRequiredRole},timestamp:Date.now(),hypothesisId:'H10'})}).catch(()=>{});
    // #endregion
    
    if (!hasRequiredRole) {
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/f7f9292b-067f-48f6-a474-d24d84c0689d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProtectedRoute.tsx:45',message:'Unauthorized access attempt',data:{pathname:location.pathname,requiredRoles,userRoles:userRoleValues},timestamp:Date.now(),hypothesisId:'H10'})}).catch(()=>{});
      // #endregion
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/f7f9292b-067f-48f6-a474-d24d84c0689d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProtectedRoute.tsx:50',message:'Access granted',data:{pathname:location.pathname,userId:user.id,hasRequiredRoles:!!requiredRoles},timestamp:Date.now(),hypothesisId:'H10'})}).catch(()=>{});
  // #endregion

  return (
    <>
      <SyncProfileLanguage />
      {profile?.must_change_password && (
        <ForcePasswordChangeDialog userId={user.id} />
      )}
      {children}
    </>
  );
}

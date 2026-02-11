import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { useUserProfile, useUserRoles, getRoleDashboardPath, getPrimaryRole } from "@/hooks/useUserRoles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROLES } from "@/types/roles";

export default function PendingApprovalPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuthContext();
  const { data: profile, isLoading: profileLoading, refetch } = useUserProfile(user?.id);
  const { data: roles = [] } = useUserRoles(user?.id);

  // Poll for approval status changes every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [refetch]);

  // Redirect to dashboard if approved
  useEffect(() => {
    if (profile?.approval_status === "auto_approved" || profile?.approval_status === "manager_approved") {
      const primaryRole = getPrimaryRole(roles);
      if (primaryRole) {
        navigate(getRoleDashboardPath(primaryRole));
      }
    }
  }, [profile?.approval_status, roles, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Get role labels
  const requestedRoleLabels = roles.map(r => {
    const roleInfo = ROLES.find(role => role.value === r.role);
    return roleInfo?.label || r.role;
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-8 py-16">
      <Card className="w-full max-w-2xl border">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="flex justify-center">
            <div className="rounded-full bg-yellow-500/10 p-4">
              <Clock className="h-12 w-12 text-yellow-600" />
            </div>
          </div>
          <CardTitle className="text-sm">Account Pending Approval</CardTitle>
          <CardDescription className="text-xs tracking-wide">
            Your account is awaiting manager approval
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Account Info */}
          <div className="space-y-4 p-6 border rounded-none bg-muted/30">
            <div className="space-y-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Account Information
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{profile?.full_name || "Not provided"}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{profile?.email}</span>
                </div>
                <div className="flex justify-between items-start text-sm">
                  <span className="text-muted-foreground">Requested Roles:</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {requestedRoleLabels.length > 0 ? (
                      requestedRoleLabels.map((label, idx) => (
                        <Badge key={idx} variant="secondary" className="rounded-none text-[10px]">
                          {label}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">None selected</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Message */}
          <div className="p-4 border border-yellow-500/20 bg-yellow-500/5 rounded-none">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="space-y-1">
                <div className="text-sm font-medium">Your request has been submitted</div>
                <p className="text-xs text-muted-foreground">
                  A manager will review your account and approve access. You will receive an email notification once approved.
                </p>
              </div>
            </div>
          </div>

          {/* What's Next */}
          <div className="space-y-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              What Happens Next
            </div>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-foreground">•</span>
                <span>A manager will review your account information and requested roles</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-foreground">•</span>
                <span>You will receive an email notification when your account is approved</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-foreground">•</span>
                <span>Once approved, you can sign in and access your dashboard</span>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="p-4 border rounded-none">
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <div className="text-xs font-medium">Need Help?</div>
                <p className="text-xs text-muted-foreground">
                  If you have questions about your account approval, contact your manager or system administrator.
                </p>
              </div>
            </div>
          </div>

          {/* Sign Out Button */}
          <div className="pt-4">
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="w-full rounded-none"
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

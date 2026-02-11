import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, Mail } from "lucide-react";

export default function AccountDisabledPage() {
  const navigate = useNavigate();
  const { signOut } = useAuthContext();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-8 py-16">
      <Card className="w-full max-w-2xl border">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="flex justify-center">
            <div className="rounded-full bg-red-500/10 p-4">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-sm">Account Disabled</CardTitle>
          <CardDescription className="text-xs tracking-wide">
            Your account has been deactivated
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status Message */}
          <div className="p-4 border border-red-500/20 bg-red-500/5 rounded-none">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="space-y-1">
                <div className="text-sm font-medium">Access Restricted</div>
                <p className="text-xs text-muted-foreground">
                  Your account has been deactivated by an administrator. You no longer have access to the system.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="p-4 border rounded-none">
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <div className="text-xs font-medium">Need Help?</div>
                <p className="text-xs text-muted-foreground">
                  If you believe this is an error or need to regain access, please contact your system administrator or manager.
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

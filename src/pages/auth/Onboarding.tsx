import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { useAssignRoles, useUpdateProfile, getRoleDashboardPath } from "@/hooks/useUserRoles";
import { AppRole, ROLES } from "@/types/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, UserCheck, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "profile" | "roles";

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const assignRoles = useAssignRoles();
  const updateProfile = useUpdateProfile();
  
  const [step, setStep] = useState<Step>("profile");
  const [fullName, setFullName] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleRole = (role: AppRole) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleProfileNext = async () => {
    if (!fullName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    
    if (!user?.id) {
      toast.error("User session not found");
      return;
    }

    try {
      await updateProfile.mutateAsync({ userId: user.id, fullName: fullName.trim() });
      setStep("roles");
    } catch (error) {
      toast.error("Failed to save profile");
    }
  };

  const handleComplete = async () => {
    if (selectedRoles.length === 0) {
      toast.error("Please select at least one role");
      return;
    }

    if (!user?.id) {
      toast.error("User session not found");
      return;
    }

    setIsSubmitting(true);
    try {
      await assignRoles.mutateAsync({ userId: user.id, roles: selectedRoles });
      toast.success("Welcome! Your account is set up.");
      
      // Navigate to the appropriate dashboard based on primary role
      const primaryRole = selectedRoles[0];
      navigate(getRoleDashboardPath(primaryRole));
    } catch (error) {
      toast.error("Failed to assign roles");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 px-4 py-8">
      <Card className="w-full max-w-2xl shadow-xl border-border/50">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <UserCheck className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
          <CardDescription>
            {step === "profile" 
              ? "Tell us a bit about yourself" 
              : "Select your role(s) in the organization"}
          </CardDescription>
          
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 pt-4">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
              step === "profile" 
                ? "bg-primary text-primary-foreground" 
                : "bg-primary/20 text-primary"
            )}>
              1
            </div>
            <div className="w-12 h-0.5 bg-muted" />
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
              step === "roles" 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted text-muted-foreground"
            )}>
              2
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {step === "profile" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="text-lg"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                This name will be displayed across the platform
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ROLES.map((role) => (
                <div
                  key={role.value}
                  onClick={() => toggleRole(role.value)}
                  className={cn(
                    "relative flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-primary/50",
                    selectedRoles.includes(role.value)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  <Checkbox
                    checked={selectedRoles.includes(role.value)}
                    onCheckedChange={() => toggleRole(role.value)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{role.icon}</span>
                      <span className="font-medium">{role.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {role.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          {step === "roles" && (
            <Button
              variant="outline"
              onClick={() => setStep("profile")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          
          {step === "profile" ? (
            <Button
              className="ml-auto"
              onClick={handleProfileNext}
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          ) : (
            <Button
              className="ml-auto"
              onClick={handleComplete}
              disabled={isSubmitting || selectedRoles.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  Complete Setup
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

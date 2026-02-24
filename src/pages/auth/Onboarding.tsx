import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { useAssignRoles, useUpdateProfile, getRoleDashboardPath, useUserProfile, useSlingRoles } from "@/hooks/useUserRoles";
import { AppRole, ROLES } from "@/types/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Eye, EyeOff, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

type Step = "password" | "profile" | "language" | "roles";

type LanguageChoice = "en" | "es";

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, updatePassword } = useAuthContext();
  const queryClient = useQueryClient();
  const assignRoles = useAssignRoles();
  const updateProfile = useUpdateProfile();
  const { data: profile } = useUserProfile(user?.id);
  const { data: slingRoles = [], isLoading: slingRolesLoading } = useSlingRoles(profile?.sling_id);

  const needsPasswordChange = !!profile?.must_change_password;
  const [step, setStep] = useState<Step>(needsPasswordChange ? "password" : "profile");
  const [fullName, setFullName] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageChoice>("en");
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasLoadedSlingRoles, setHasLoadedSlingRoles] = useState(false);

  // Password step state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Sync step if profile loads after initial render
  useEffect(() => {
    if (needsPasswordChange && step === "profile") {
      setStep("password");
    }
  }, [needsPasswordChange]);

  const handlePasswordNext = async () => {
    setPasswordError(null);
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match");
      return;
    }

    setPasswordLoading(true);
    try {
      const { error: pwError } = await updatePassword(newPassword);
      if (pwError) {
        setPasswordError(pwError.message);
        return;
      }
      // Clear must_change_password flag
      if (user?.id) {
        await supabase.from("profiles").update({ must_change_password: false }).eq("user_id", user.id);
        queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      }
      toast.success("Password updated successfully");
      setStep("profile");
    } catch {
      setPasswordError("An unexpected error occurred");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Pre-select Sling roles when moving to roles step
  useEffect(() => {
    if (
      step === "roles" &&
      !hasLoadedSlingRoles &&
      !slingRolesLoading &&
      slingRoles.length > 0 &&
      profile?.approval_status === "auto_approved"
    ) {
      setSelectedRoles(slingRoles);
      setHasLoadedSlingRoles(true);
    }
  }, [step, slingRoles, slingRolesLoading, hasLoadedSlingRoles, profile?.approval_status]);

  const isAutoApproved = profile?.approval_status === "auto_approved";
  const isPending = profile?.approval_status === "pending";
  // Pre-approved users with Sling roles skip the roles step entirely
  const isPreApprovedWithRoles = isAutoApproved && !slingRolesLoading && slingRoles.length > 0;

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
      setStep("language");
    } catch (error) {
      toast.error("Failed to save profile");
    }
  };

  const handleLanguageNext = async () => {
    if (!user?.id) {
      toast.error("User session not found");
      return;
    }

    try {
      await updateProfile.mutateAsync({
        userId: user.id,
        preferred_language: selectedLanguage,
      });

      // Pre-approved users: assign Sling roles and complete onboarding immediately
      if (isPreApprovedWithRoles) {
        setIsSubmitting(true);
        try {
          await assignRoles.mutateAsync({ userId: user.id, roles: slingRoles });
          toast.success("Setup complete");
          const primaryRole = slingRoles[0];
          navigate(getRoleDashboardPath(primaryRole));
        } catch {
          toast.error("Failed to assign roles");
        } finally {
          setIsSubmitting(false);
        }
        return;
      }

      setStep("roles");
    } catch (error) {
      toast.error("Failed to save language preference");
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
      
      // Check approval status after assigning roles
      if (isPending) {
        toast.success("Setup complete - pending manager approval");
        navigate("/pending-approval");
      } else {
        toast.success("Setup complete");
        const primaryRole = selectedRoles[0];
        navigate(getRoleDashboardPath(primaryRole));
      }
    } catch (error) {
      toast.error("Failed to assign roles");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-8 py-16">
      <Card className="w-full max-w-2xl border-0">
        <CardHeader className="space-y-4 text-center pb-8">
          <CardTitle className="text-sm">Complete Your Profile</CardTitle>
          <CardDescription className="text-xs tracking-wide">
            {step === "password"
              ? "Create a new password to continue"
              : step === "profile"
                ? "Tell us about yourself"
                : step === "language"
                  ? "Choose your language"
                  : isPreApprovedWithRoles
                    ? "Almost done"
                    : "Select your role(s)"}
          </CardDescription>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 pt-6">
            {/* Step 1: Password (only shown if needed) */}
            {needsPasswordChange && (
              <>
                <div
                  className={cn(
                    "w-8 h-8 border flex items-center justify-center text-[10px] uppercase tracking-widest transition-colors",
                    step === "password"
                      ? "border-foreground bg-foreground text-background"
                      : "border-foreground bg-transparent text-foreground"
                  )}
                >
                  <KeyRound className="h-3.5 w-3.5" />
                </div>
                <div className="w-8 h-px bg-border" />
              </>
            )}
            <div
              className={cn(
                "w-8 h-8 border flex items-center justify-center text-[10px] uppercase tracking-widest transition-colors",
                step === "profile"
                  ? "border-foreground bg-foreground text-background"
                  : step === "password"
                    ? "border-border bg-transparent text-muted-foreground"
                    : "border-foreground bg-transparent text-foreground"
              )}
            >
              1
            </div>
            <div className="w-8 h-px bg-border" />
            <div
              className={cn(
                "w-8 h-8 border flex items-center justify-center text-[10px] uppercase tracking-widest transition-colors",
                step === "language"
                  ? "border-foreground bg-foreground text-background"
                  : step === "profile" || step === "password"
                    ? "border-border bg-transparent text-muted-foreground"
                    : "border-foreground bg-transparent text-foreground"
              )}
            >
              2
            </div>
            {!isPreApprovedWithRoles && (
              <>
                <div className="w-8 h-px bg-border" />
                <div
                  className={cn(
                    "w-8 h-8 border flex items-center justify-center text-[10px] uppercase tracking-widest transition-colors",
                    step === "roles"
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-transparent text-muted-foreground"
                  )}
                >
                  3
                </div>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {step === "password" ? (
            <div className="space-y-4 max-w-sm mx-auto">
              <div className="space-y-2">
                <Label htmlFor="onboard-new-password" className="text-[10px] uppercase tracking-widest">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="onboard-new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="rounded-none text-xs pr-10"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="onboard-confirm-password" className="text-[10px] uppercase tracking-widest">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="onboard-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="rounded-none text-xs pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              {passwordError && (
                <p className="text-[10px] text-destructive tracking-wide">{passwordError}</p>
              )}
              <p className="text-[10px] text-muted-foreground tracking-wide uppercase">
                Your password was set by an administrator. Please create your own password to continue.
              </p>
            </div>
          ) : step === "profile" ? (
            <div className="space-y-4 max-w-sm mx-auto">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <p className="text-[10px] text-muted-foreground tracking-wide uppercase">
                This name will be displayed across the platform
              </p>
            </div>
          ) : step === "language" ? (
            <div className="space-y-4 max-w-sm mx-auto">
              <p className="text-[10px] text-muted-foreground tracking-wide uppercase text-center">
                You can change this later in the app
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => setSelectedLanguage("en")}
                  className={cn(
                    "relative flex flex-col items-center gap-2 p-6 border cursor-pointer transition-all duration-300 hover:opacity-70",
                    selectedLanguage === "en"
                      ? "border-foreground bg-secondary"
                      : "border-border hover:border-foreground"
                  )}
                >
                  <span className="text-[10px] uppercase tracking-widest font-normal">
                    English
                  </span>
                </div>
                <div
                  onClick={() => setSelectedLanguage("es")}
                  className={cn(
                    "relative flex flex-col items-center gap-2 p-6 border cursor-pointer transition-all duration-300 hover:opacity-70",
                    selectedLanguage === "es"
                      ? "border-foreground bg-secondary"
                      : "border-border hover:border-foreground"
                  )}
                >
                  <span className="text-[10px] uppercase tracking-widest font-normal">
                    Español
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {isAutoApproved && slingRoles.length > 0 && (
                <div className="flex items-center justify-center gap-2 text-xs">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-muted-foreground">
                    Your roles from employee records
                  </span>
                  <Badge variant="secondary" className="rounded-none text-[10px]">
                    Auto-Approved
                  </Badge>
                </div>
              )}
              {isPending && (
                <div className="p-4 border border-yellow-500/20 bg-yellow-500/5 text-center">
                  <p className="text-xs text-muted-foreground">
                    Access pending manager approval. You can select roles, but they won't be active until approved.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ROLES.map((role) => (
                  <div
                    key={role.value}
                    onClick={() => toggleRole(role.value)}
                    className={cn(
                      "relative flex items-start gap-4 p-6 border cursor-pointer transition-all duration-300 hover:opacity-70",
                      selectedRoles.includes(role.value)
                        ? "border-foreground bg-secondary"
                        : "border-border hover:border-foreground"
                    )}
                  >
                    <Checkbox
                      checked={selectedRoles.includes(role.value)}
                      onCheckedChange={() => toggleRole(role.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-widest font-normal">{role.label}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground tracking-wide mt-2">
                        {role.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between pt-8">
          {step === "profile" && needsPasswordChange && (
            <Button variant="outline" onClick={() => setStep("password")} disabled>
              Back
            </Button>
          )}
          {step === "language" && (
            <Button variant="outline" onClick={() => setStep("profile")}>
              Back
            </Button>
          )}
          {step === "roles" && (
            <Button variant="outline" onClick={() => setStep("language")}>
              Back
            </Button>
          )}

          {step === "password" ? (
            <Button
              className="ml-auto"
              onClick={handlePasswordNext}
              disabled={passwordLoading || !newPassword || !confirmPassword}
            >
              {passwordLoading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Updating Password
                </>
              ) : (
                "Continue"
              )}
            </Button>
          ) : step === "profile" ? (
            <Button
              className={!needsPasswordChange ? "ml-auto" : ""}
              onClick={handleProfileNext}
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Saving
                </>
              ) : (
                "Continue"
              )}
            </Button>
          ) : step === "language" ? (
            <Button
              className="ml-auto"
              onClick={handleLanguageNext}
              disabled={updateProfile.isPending || isSubmitting}
            >
              {updateProfile.isPending || isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  {isSubmitting ? "Setting up" : "Saving"}
                </>
              ) : (
                isPreApprovedWithRoles ? "Complete Setup" : "Continue"
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
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Setting up
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

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
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "profile" | "language" | "roles";

type LanguageChoice = "en" | "es";

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const assignRoles = useAssignRoles();
  const updateProfile = useUpdateProfile();

  const [step, setStep] = useState<Step>("profile");
  const [fullName, setFullName] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageChoice>("en");
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
      toast.success("Setup complete");
      
      const primaryRole = selectedRoles[0];
      navigate(getRoleDashboardPath(primaryRole));
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
            {step === "profile"
              ? "Tell us about yourself"
              : step === "language"
                ? "Choose your language"
                : "Select your role(s)"}
          </CardDescription>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 pt-6">
            <div
              className={cn(
                "w-8 h-8 border flex items-center justify-center text-[10px] uppercase tracking-widest transition-colors",
                step === "profile"
                  ? "border-foreground bg-foreground text-background"
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
                  : step === "profile"
                    ? "border-border bg-transparent text-muted-foreground"
                    : "border-foreground bg-transparent text-foreground"
              )}
            >
              2
            </div>
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
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {step === "profile" ? (
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
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between pt-8">
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

          {step === "profile" ? (
            <Button
              className={step === "profile" ? "ml-auto" : ""}
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

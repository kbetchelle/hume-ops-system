import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { useUserProfile, useUpdateProfile, useUserRoles } from "@/hooks/useUserRoles";
import { useUserPreferences, useUpdateUserPreferences } from "@/hooks/useUserPreferences";
import { useLanguage } from "@/contexts/LanguageContext";
import { PREFERRED_LANGUAGE_PENDING_KEY } from "@/components/shared/SyncProfileLanguage";
import { User, Globe, Bell, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AccountSettingsPage() {
  const { user } = useAuthContext();
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id);
  const { data: roles } = useUserRoles(user?.id);
  const { data: preferences, isLoading: prefsLoading } = useUserPreferences();
  const updateProfile = useUpdateProfile();
  const updatePreferences = useUpdateUserPreferences();
  const { language, setLanguage } = useLanguage();

  // Local state for profile form
  const [fullName, setFullName] = useState("");
  const [nameChanged, setNameChanged] = useState(false);

  // Initialize from profile
  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile?.full_name]);

  const handleNameChange = (value: string) => {
    setFullName(value);
    setNameChanged(value !== (profile?.full_name || ""));
  };

  const handleSaveName = async () => {
    if (!user?.id || !fullName.trim()) return;

    try {
      await updateProfile.mutateAsync({
        userId: user.id,
        fullName: fullName.trim(),
      });
      setNameChanged(false);
      toast.success("Name updated successfully");
    } catch {
      toast.error("Failed to update name");
    }
  };

  const handleLanguageChange = (lang: "en" | "es") => {
    if (!user?.id) return;
    if (user?.id) {
      sessionStorage.setItem(PREFERRED_LANGUAGE_PENDING_KEY, lang);
    }
    setLanguage(lang);
    updateProfile.mutate({ userId: user.id, preferred_language: lang });
  };

  const handleBugBadgeToggle = (enabled: boolean) => {
    updatePreferences.mutate({ bug_report_badge_enabled: enabled });
  };

  const isAdminOrManager = (roles || []).some(
    (r) => r.role === "admin" || r.role === "manager"
  );

  const isLoading = profileLoading || prefsLoading;

  return (
    <DashboardLayout title="Account Settings">
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-none" />
            <Skeleton className="h-32 w-full rounded-none" />
            <Skeleton className="h-32 w-full rounded-none" />
          </div>
        ) : (
          <>
            {/* Profile Information */}
            <Card className="rounded-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs uppercase tracking-widest font-normal flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile Information
                </CardTitle>
                <CardDescription className="text-[10px] tracking-wide">
                  Update your display name and personal information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-[10px] uppercase tracking-widest"
                  >
                    Email
                  </Label>
                  <Input
                    id="email"
                    value={user?.email || ""}
                    disabled
                    className="rounded-none text-xs bg-muted"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Email cannot be changed.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="fullName"
                    className="text-[10px] uppercase tracking-widest"
                  >
                    Full Name
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Your full name"
                      className="rounded-none text-xs flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-none text-[10px] uppercase tracking-widest h-9"
                      onClick={handleSaveName}
                      disabled={
                        !nameChanged ||
                        !fullName.trim() ||
                        updateProfile.isPending
                      }
                    >
                      {updateProfile.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Language Preference */}
            <Card className="rounded-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs uppercase tracking-widest font-normal flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Language Preference
                </CardTitle>
                <CardDescription className="text-[10px] tracking-wide">
                  Choose your preferred language for the application.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant={language === "en" ? "default" : "outline"}
                    size="sm"
                    className="rounded-none text-[10px] uppercase tracking-widest"
                    onClick={() => handleLanguageChange("en")}
                  >
                    English
                  </Button>
                  <Button
                    variant={language === "es" ? "default" : "outline"}
                    size="sm"
                    className="rounded-none text-[10px] uppercase tracking-widest"
                    onClick={() => handleLanguageChange("es")}
                  >
                    Español
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card className="rounded-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs uppercase tracking-widest font-normal flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notification Preferences
                </CardTitle>
                <CardDescription className="text-[10px] tracking-wide">
                  Control which notifications and badges you see.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Bug Report Badge Toggle - only for admin/manager */}
                {isAdminOrManager && (
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs">Bug Report Badges</p>
                      <p className="text-[10px] text-muted-foreground">
                        Show unread bug report count in the Dev Tools
                        navigation.
                      </p>
                    </div>
                    <Switch
                      checked={preferences?.bug_report_badge_enabled ?? true}
                      onCheckedChange={handleBugBadgeToggle}
                      disabled={updatePreferences.isPending}
                    />
                  </div>
                )}

                {!isAdminOrManager && (
                  <p className="text-xs text-muted-foreground">
                    No notification preferences available for your role.
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

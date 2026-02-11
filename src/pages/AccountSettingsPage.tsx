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
import { NotificationPreferencesPanel } from "@/components/notifications/NotificationPreferencesPanel";

export default function AccountSettingsPage() {
  const { user } = useAuthContext();
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id);
  const { data: roles } = useUserRoles(user?.id);
  const { data: preferences, isLoading: prefsLoading } = useUserPreferences();
  const updateProfile = useUpdateProfile();
  const updatePreferences = useUpdateUserPreferences();
  const { language, setLanguage, t } = useLanguage();

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
      toast.success(t("Name updated successfully", "Nombre actualizado correctamente"));
    } catch {
      toast.error(t("Failed to update name", "Error al actualizar el nombre"));
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
    <DashboardLayout title={t("Account Settings", "Configuración de Cuenta")}>
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
                  {t("Profile Information", "Información del Perfil")}
                </CardTitle>
                <CardDescription className="text-[10px] tracking-wide">
                  {t("Update your display name and personal information.", "Actualiza tu nombre y datos personales.")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-[10px] uppercase tracking-widest"
                  >
                    {t("Email", "Correo Electrónico")}
                  </Label>
                  <Input
                    id="email"
                    value={user?.email || ""}
                    disabled
                    className="rounded-none text-xs bg-muted"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    {t("Email cannot be changed.", "El correo no se puede cambiar.")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="fullName"
                    className="text-[10px] uppercase tracking-widest"
                  >
                    {t("Full Name", "Nombre Completo")}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder={t("Your full name", "Tu nombre completo")}
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
                          {t("Save", "Guardar")}
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
                  {t("Language Preference", "Preferencia de Idioma")}
                </CardTitle>
                <CardDescription className="text-[10px] tracking-wide">
                  {t("Choose your preferred language for the application.", "Elige tu idioma preferido para la aplicación.")}
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
                  {t("Notification Preferences", "Preferencias de Notificaciones")}
                </CardTitle>
                <CardDescription className="text-[10px] tracking-wide">
                  {t("Control which notifications you receive and how.", "Controla qué notificaciones recibes y cómo.")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <NotificationPreferencesPanel isAdminOrManager={isAdminOrManager} />

                {/* Bug Report Badge Toggle - only for admin/manager */}
                {isAdminOrManager && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs">{t("Bug Report Badges", "Insignias de Reportes de Bugs")}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {t(
                            "Show unread bug report count in the Dev Tools navigation.",
                            "Mostrar el conteo de reportes de bugs no leídos en la navegación de Dev Tools."
                          )}
                        </p>
                      </div>
                      <Switch
                        checked={preferences?.bug_report_badge_enabled ?? true}
                        onCheckedChange={handleBugBadgeToggle}
                        disabled={updatePreferences.isPending}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

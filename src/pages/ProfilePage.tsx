import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { useUserProfile, useUserRoles } from "@/hooks/useUserRoles";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ROLES } from "@/types/roles";
import { User, Settings, Calendar, Mail, Shield, Globe, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { SickDayRequestDialog } from "@/components/profile/SickDayRequestDialog";
import { SickDayRequestHistory } from "@/components/profile/SickDayRequestHistory";

/**
 * Fetches the user's start date at HUME by finding their earliest shift via Sling.
 * profile.sling_id -> sling_users.id -> sling_users.sling_user_id -> staff_shifts.sling_user_id
 */
function useHumeStartDate(slingId: string | null | undefined) {
  return useQuery({
    queryKey: ["hume-start-date", slingId],
    queryFn: async () => {
      if (!slingId) return null;

      // First get the sling_user_id (numeric) from sling_users
      const { data: slingUser, error: slingError } = await supabase
        .from("sling_users")
        .select("sling_user_id")
        .eq("id", slingId)
        .single();

      if (slingError || !slingUser) return null;

      // Find the earliest shift for this sling user
      const { data: earliestShift, error: shiftError } = await supabase
        .from("staff_shifts")
        .select("shift_date")
        .eq("sling_user_id", slingUser.sling_user_id)
        .order("shift_date", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (shiftError || !earliestShift?.shift_date) {
        // Fallback: check sling_shifts_staging
        const { data: stagingShift } = await supabase
          .from("sling_shifts_staging")
          .select("shift_date")
          .eq("sling_user_id", slingUser.sling_user_id)
          .order("shift_date", { ascending: true })
          .limit(1)
          .maybeSingle();

        return stagingShift?.shift_date || null;
      }

      return earliestShift.shift_date;
    },
    enabled: !!slingId,
  });
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id);
  const { data: roles, isLoading: rolesLoading } = useUserRoles(user?.id);
  const { data: startDate, isLoading: startDateLoading } = useHumeStartDate(
    profile?.sling_id
  );
  const [sickDayDialogOpen, setSickDayDialogOpen] = useState(false);

  const isLoading = profileLoading || rolesLoading;

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getLanguageLabel = (code: string | null | undefined) => {
    switch (code) {
      case "es":
        return "Spanish";
      case "en":
      default:
        return "English";
    }
  };

  return (
    <DashboardLayout title="Profile">
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-none" />
            <Skeleton className="h-48 w-full rounded-none" />
          </div>
        ) : (
          <>
            {/* User card */}
            <Card className="rounded-none">
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  {/* Avatar */}
                  <div className="h-16 w-16 bg-muted flex items-center justify-center shrink-0">
                    <span className="text-lg font-light tracking-widest">
                      {getInitials(profile?.full_name)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg uppercase tracking-widest font-normal">
                      {profile?.full_name || "User"}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      {user?.email}
                    </p>

                    {/* Roles */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {(roles || []).map((r) => {
                        const roleInfo = ROLES.find(
                          (ri) => ri.value === r.role
                        );
                        return (
                          <Badge
                            key={r.id}
                            variant="outline"
                            className="rounded-none text-[10px] uppercase tracking-widest"
                          >
                            {roleInfo?.label || r.role}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Details */}
            <Card className="rounded-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs uppercase tracking-widest font-normal flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Email */}
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Email
                    </p>
                    <p className="text-xs">{user?.email}</p>
                  </div>
                </div>

                {/* Roles */}
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Roles
                    </p>
                    <p className="text-xs">
                      {(roles || [])
                        .map((r) => {
                          const roleInfo = ROLES.find(
                            (ri) => ri.value === r.role
                          );
                          return roleInfo?.label || r.role;
                        })
                        .join(", ") || "No roles assigned"}
                    </p>
                  </div>
                </div>

                {/* Language */}
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Preferred Language
                    </p>
                    <p className="text-xs">
                      {getLanguageLabel(profile?.preferred_language)}
                    </p>
                  </div>
                </div>

                {/* Start Date at HUME */}
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Start Date at HUME
                    </p>
                    {startDateLoading ? (
                      <Skeleton className="h-4 w-32 rounded-none" />
                    ) : startDate ? (
                      <p className="text-xs">
                        Member since{" "}
                        {format(parseISO(startDate), "MMMM d, yyyy")}
                      </p>
                    ) : profile?.sling_id ? (
                      <p className="text-xs text-muted-foreground">
                        No shift history found
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Not linked to Sling
                      </p>
                    )}
                  </div>
                </div>

                {/* Account created */}
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Account Created
                    </p>
                    <p className="text-xs">
                      {profile?.created_at
                        ? format(
                            parseISO(profile.created_at),
                            "MMMM d, yyyy"
                          )
                        : "Unknown"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Settings link */}
            <Button
              variant="outline"
              className="w-full rounded-none text-xs uppercase tracking-widest h-10"
              onClick={() => navigate("/dashboard/settings")}
            >
              <Settings className="h-4 w-4 mr-2" />
              Account Settings
            </Button>

            {/* Request Sick Day Pay Button */}
            <Button
              variant="outline"
              className="w-full rounded-none text-xs uppercase tracking-widest h-10"
              onClick={() => setSickDayDialogOpen(true)}
            >
              <Heart className="h-4 w-4 mr-2" />
              Request Sick Day Pay
            </Button>

            {/* Sick Day Request History */}
            {user?.id && <SickDayRequestHistory userId={user.id} />}
          </>
        )}
      </div>

      {/* Sick Day Request Dialog */}
      <SickDayRequestDialog
        open={sickDayDialogOpen}
        onOpenChange={setSickDayDialogOpen}
      />
    </DashboardLayout>
  );
}

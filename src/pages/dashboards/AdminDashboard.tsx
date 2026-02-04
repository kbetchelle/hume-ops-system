import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { useUserProfile } from "@/hooks/useUserRoles";

export default function AdminDashboard() {
  const { user } = useAuthContext();
  const { data: profile } = useUserProfile(user?.id);

  const getFirstName = (fullName: string | null | undefined) => {
    if (!fullName) return "there";
    return fullName.split(" ")[0];
  };

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <h2 className="text-sm uppercase tracking-[0.15em] font-normal text-muted-foreground">
            Welcome back, {getFirstName(profile?.full_name)}
          </h2>
          <p className="text-xs text-muted-foreground/70 tracking-wide">
            Select a section from the sidebar to get started
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

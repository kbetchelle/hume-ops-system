import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { useUserProfile } from "@/hooks/useUserRoles";
import { DevDashboardPanel } from "@/components/admin/DevDashboardPanel";

export default function ManagerDashboard() {
  const { user } = useAuthContext();
  const { data: profile } = useUserProfile(user?.id);

  const getFirstName = (fullName: string | null | undefined) => {
    if (!fullName) return "there";
    return fullName.split(" ")[0];
  };

  return (
    <DashboardLayout title="Manager Dashboard">
      <div className="flex flex-col h-full p-6 md:p-8">
        <div className="text-center mb-6">
          <h2 className="text-sm uppercase tracking-[0.15em] font-normal text-muted-foreground">
            Welcome back, {getFirstName(profile?.full_name)}
          </h2>
        </div>

        <div className="flex-1 min-h-0">
          <DevDashboardPanel />
        </div>
      </div>
    </DashboardLayout>
  );
}

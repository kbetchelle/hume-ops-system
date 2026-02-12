import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StaffResourcesManager } from "@/components/manager/StaffResourcesManager";

export default function StaffResourcesPage() {
  return (
    <DashboardLayout title="Staff Resources">
      <div className="p-6 md:p-8">
        <StaffResourcesManager />
      </div>
    </DashboardLayout>
  );
}

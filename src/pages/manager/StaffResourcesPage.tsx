import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StaffResourcesManager } from "@/components/manager/StaffResourcesManager";

export default function StaffResourcesPage() {
  return (
    <DashboardLayout title="Staff Resources">
      <div className="border-t border-r border-b border-border flex-1 flex flex-col min-h-0">
        <StaffResourcesManager />
      </div>
    </DashboardLayout>
  );
}

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StaffResourcesView } from "@/components/staff-resources/StaffResourcesView";

export default function StaffResourcesViewPage() {
  return (
    <DashboardLayout title="Resources">
      <div className="p-4 md:p-8 max-w-3xl">
        <StaffResourcesView />
      </div>
    </DashboardLayout>
  );
}

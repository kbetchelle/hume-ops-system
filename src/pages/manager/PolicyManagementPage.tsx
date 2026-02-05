import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PolicyManagement } from "@/components/manager/PolicyManagement";

export default function PolicyManagementPage() {
  return (
    <DashboardLayout title="Policy Management">
      <div className="p-6 md:p-8">
        <PolicyManagement />
      </div>
    </DashboardLayout>
  );
}

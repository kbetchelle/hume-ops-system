import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardGrid } from "@/components/manager/dashboard/DashboardGrid";

export default function AdminDashboard() {
  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="p-4 md:p-6">
        <DashboardGrid />
      </div>
    </DashboardLayout>
  );
}

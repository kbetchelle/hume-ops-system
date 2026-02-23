import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardGrid } from "@/components/manager/dashboard/DashboardGrid";

export default function ManagerDashboard() {
  return (
    <DashboardLayout title="Manager Dashboard">
      <div>
        <DashboardGrid />
      </div>
    </DashboardLayout>
  );
}

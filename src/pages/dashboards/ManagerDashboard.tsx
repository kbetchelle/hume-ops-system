import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ManagementInbox } from "@/components/manager/ManagementInbox";

export default function ManagerDashboard() {
  return (
    <DashboardLayout title="Manager Dashboard">
      <div className="flex flex-col h-full p-6 md:p-8">
        <ManagementInbox />
      </div>
    </DashboardLayout>
  );
}

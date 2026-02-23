import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ManagementInbox } from "@/components/manager/ManagementInbox";

export default function ManagerDashboard() {
  return (
    <DashboardLayout title="Manager Dashboard">
      <div className="flex flex-col h-full m-0" style={{ padding: '36px' }}>
        <ManagementInbox />
      </div>
    </DashboardLayout>
  );
}

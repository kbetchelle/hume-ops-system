import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ManagementInbox } from "@/components/manager/ManagementInbox";

export default function AdminDashboard() {
  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="flex flex-col h-full p-6 md:p-8">
        <ManagementInbox />
      </div>
    </DashboardLayout>
  );
}

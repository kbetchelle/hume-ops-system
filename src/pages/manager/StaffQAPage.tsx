import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ManagementInbox } from "@/components/manager/ManagementInbox";

export default function StaffQAPage() {
  return (
    <DashboardLayout title="Management Inbox">
      <div className="p-6 md:p-8">
        <ManagementInbox />
      </div>
    </DashboardLayout>
  );
}

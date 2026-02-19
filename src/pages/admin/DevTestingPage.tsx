import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminNotificationPanel } from "@/components/notifications/AdminNotificationPanel";

export default function DevTestingPage() {
  return (
    <DashboardLayout title="Testing">
      <div className="p-6 md:p-8 max-w-2xl">
        <AdminNotificationPanel />
      </div>
    </DashboardLayout>
  );
}

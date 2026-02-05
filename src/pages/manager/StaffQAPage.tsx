import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ManagerQAPanel } from "@/components/manager/ManagerQAPanel";

export default function StaffQAPage() {
  return (
    <DashboardLayout title="Staff Q&A">
      <div className="p-6 md:p-8">
        <ManagerQAPanel />
      </div>
    </DashboardLayout>
  );
}

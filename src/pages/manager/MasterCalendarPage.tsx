import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MasterCalendar } from "@/components/manager/MasterCalendar";

export default function MasterCalendarPage() {
  return (
    <DashboardLayout title="Master Calendar">
      <div className="p-6 md:p-8">
        <MasterCalendar />
      </div>
    </DashboardLayout>
  );
}

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MasterCalendar } from "@/components/manager/MasterCalendar";

export default function MasterCalendarPage() {
  return (
    <DashboardLayout title="Master Calendar">
      <div>
        <MasterCalendar />
      </div>
    </DashboardLayout>
  );
}

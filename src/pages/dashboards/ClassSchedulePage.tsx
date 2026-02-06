import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClassScheduleView } from "@/components/concierge/ClassScheduleView";

export default function ClassSchedulePage() {
  return (
    <DashboardLayout title="Class Schedule">
      <div className="p-4 md:p-8 max-w-3xl">
        <ClassScheduleView />
      </div>
    </DashboardLayout>
  );
}

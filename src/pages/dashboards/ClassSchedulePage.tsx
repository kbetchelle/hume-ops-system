import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClassScheduleView } from "@/components/concierge/ClassScheduleView";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ClassSchedulePage() {
  const isMobile = useIsMobile();

  return (
    <DashboardLayout title="Class Schedule">
      <div className={isMobile ? "p-0 flex-1 flex flex-col min-h-0" : "p-4 md:p-8 max-w-3xl"}>
        <ClassScheduleView filterClassesOnly />
      </div>
    </DashboardLayout>
  );
}

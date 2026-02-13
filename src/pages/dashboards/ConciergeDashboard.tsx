import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { UpcomingTodayCard } from "@/components/concierge/UpcomingTodayCard";
import { EmbeddedChecklist } from "@/components/concierge/EmbeddedChecklist";

export default function ConciergeDashboard() {
  return (
    <DashboardLayout title="Concierge Dashboard">
      <div className="space-y-4 p-4">
        <UpcomingTodayCard />
        <EmbeddedChecklist />
      </div>
    </DashboardLayout>
  );
}

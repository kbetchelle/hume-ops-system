import { DashboardInboxWidget } from "./DashboardInboxWidget";
import { DashboardFacilityWidget } from "./DashboardFacilityWidget";
import { DashboardShiftNotesWidget } from "./DashboardShiftNotesWidget";
import { DashboardEventsWidget } from "./DashboardEventsWidget";

export function DashboardGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <DashboardInboxWidget />
      <DashboardFacilityWidget />
      <DashboardShiftNotesWidget />
      <DashboardEventsWidget />
    </div>
  );
}

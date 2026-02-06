import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BoHChecklistView } from "@/components/checklists/boh/BoHChecklistView";

export default function FloaterDashboard() {
  return (
    <DashboardLayout title="Checklist">
      <BoHChecklistView />
    </DashboardLayout>
  );
}

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BoHChecklistView } from "@/components/checklists/boh/BoHChecklistView";
import { ChecklistAlertBanners } from "@/components/concierge/ChecklistAlertBanners";
import { useActiveRole } from "@/hooks/useActiveRole";
import { useIsMobile } from "@/hooks/use-mobile";

export default function FloaterDashboard() {
  const { getRoleLabel } = useActiveRole();
  const isMobile = useIsMobile();

  return (
    <DashboardLayout title={isMobile ? getRoleLabel("floater") : "Checklist"}>
      <div className="space-y-2">
        <ChecklistAlertBanners types={['class_turnover', 'mat_cleaning']} />
        <BoHChecklistView />
      </div>
    </DashboardLayout>
  );
}

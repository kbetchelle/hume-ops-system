import { useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BoHChecklistView } from "@/components/checklists/boh/BoHChecklistView";
import { useActiveRole } from "@/hooks/useActiveRole";
import { useIsMobile } from "@/hooks/use-mobile";

export default function MaleSpaDashboard() {
  const { setActiveRole, getRoleLabel } = useActiveRole();
  const isMobile = useIsMobile();

  useEffect(() => {
    setActiveRole("male_spa_attendant");
  }, [setActiveRole]);

  return (
    <DashboardLayout title={isMobile ? getRoleLabel("male_spa_attendant") : "Checklist"}>
      <BoHChecklistView />
    </DashboardLayout>
  );
}

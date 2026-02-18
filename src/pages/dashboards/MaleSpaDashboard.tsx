import { useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BoHChecklistView } from "@/components/checklists/boh/BoHChecklistView";
import { useActiveRole } from "@/hooks/useActiveRole";

export default function MaleSpaDashboard() {
  const { setActiveRole } = useActiveRole();

  useEffect(() => {
    setActiveRole("male_spa_attendant");
  }, [setActiveRole]);

  return (
    <DashboardLayout title="Checklist">
      <BoHChecklistView />
    </DashboardLayout>
  );
}

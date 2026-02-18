import { useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BoHChecklistView } from "@/components/checklists/boh/BoHChecklistView";
import { useActiveRole } from "@/hooks/useActiveRole";

export default function FemaleSpaDashboard() {
  const { setActiveRole } = useActiveRole();

  useEffect(() => {
    setActiveRole("female_spa_attendant");
  }, [setActiveRole]);

  return (
    <DashboardLayout title="Checklist">
      <BoHChecklistView />
    </DashboardLayout>
  );
}

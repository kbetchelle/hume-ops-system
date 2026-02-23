import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PoliciesAndQA } from "@/components/concierge/PoliciesAndQA";
import { CafeShiftNotes } from "@/components/checklists/cafe/CafeShiftNotes";
import { useIsMobile } from "@/hooks/use-mobile";
import { useActiveRole } from "@/hooks/useActiveRole";

export default function BoHNotesPage() {
  const isMobile = useIsMobile();
  const { activeRole } = useActiveRole();
  const isCafe = activeRole === 'cafe';

  return (
    <DashboardLayout title={isCafe ? "Shift Notes" : "Notes for Management"}>
      <div className={`flex-1 min-h-0 overflow-auto w-full ${isMobile ? "p-0" : ""}`}>
        {isCafe ? <CafeShiftNotes /> : <PoliciesAndQA />}
      </div>
    </DashboardLayout>
  );
}

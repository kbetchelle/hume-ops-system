import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PoliciesAndQA } from "@/components/concierge/PoliciesAndQA";
import { useIsMobile } from "@/hooks/use-mobile";

export default function BoHNotesPage() {
  const isMobile = useIsMobile();
  return (
    <DashboardLayout title="Notes for Management">
      <div className={`flex-1 min-h-0 overflow-auto w-full ${isMobile ? "p-0" : "p-4 md:p-8"}`}>
        <PoliciesAndQA />
      </div>
    </DashboardLayout>
  );
}

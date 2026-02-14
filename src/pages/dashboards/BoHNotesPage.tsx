import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PoliciesAndQA } from "@/components/concierge/PoliciesAndQA";

export default function BoHNotesPage() {
  return (
    <DashboardLayout title="Notes for Management">
      <div className="flex-1 p-4 md:p-8">
        <PoliciesAndQA />
      </div>
    </DashboardLayout>
  );
}

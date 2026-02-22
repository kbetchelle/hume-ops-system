import { DashboardLayout } from "@/components/layout/DashboardLayout";
import DataBackfillPage from "@/components/settings/DataBackfillPage";

export default function BackfillManagerPage() {
  return (
    <DashboardLayout title="Backfill Manager">
      <div className="space-y-6 min-w-0 overflow-hidden border border-border rounded-lg p-[15px]">
        <DataBackfillPage />
      </div>
    </DashboardLayout>
  );
}

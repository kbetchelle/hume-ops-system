import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LostAndFoundTab } from "@/components/concierge/LostAndFoundTab";

export default function LostAndFoundPage() {
  return (
    <DashboardLayout title="Lost & Found">
      <div className="flex-1 flex flex-col p-6 md:p-8 min-h-0">
        <h2 className="text-sm uppercase tracking-[0.15em] font-normal mb-4">
          Lost & Found
        </h2>
        <div className="flex-1 min-h-0">
          <LostAndFoundTab />
        </div>
      </div>
    </DashboardLayout>
  );
}

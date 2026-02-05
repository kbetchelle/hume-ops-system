import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LostAndFoundTab } from "@/components/concierge/LostAndFoundTab";

export default function LostAndFoundPage() {
  return (
    <DashboardLayout title="Lost & Found">
      <div className="p-6 md:p-8">
        <h2 className="text-sm uppercase tracking-[0.15em] font-normal mb-4">
          Lost & Found
        </h2>
        <div className="max-w-4xl">
          <LostAndFoundTab />
        </div>
      </div>
    </DashboardLayout>
  );
}

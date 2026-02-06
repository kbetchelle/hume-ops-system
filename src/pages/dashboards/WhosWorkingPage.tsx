import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { WhosWorkingView } from "@/components/concierge/WhosWorkingView";

export default function WhosWorkingPage() {
  return (
    <DashboardLayout title="Who's Working">
      <div className="p-4 md:p-8">
        <h2 className="text-sm uppercase tracking-[0.15em] font-normal mb-6">
          Who's Working Today
        </h2>
        <div className="max-w-2xl">
          <WhosWorkingView />
        </div>
      </div>
    </DashboardLayout>
  );
}

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LostAndFoundTab } from "@/components/concierge/LostAndFoundTab";
import { useIsMobile } from "@/hooks/use-mobile";

export default function LostAndFoundPage() {
  const isMobile = useIsMobile();
  return (
    <DashboardLayout title="Lost & Found">
      <div className={`flex-1 flex flex-col min-h-0 ${isMobile ? "p-0 w-full" : ""}`}>
        <div className="flex-1 min-h-0 w-full">
          <LostAndFoundTab />
        </div>
      </div>
    </DashboardLayout>
  );
}

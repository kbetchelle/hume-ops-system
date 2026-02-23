import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { WhosWorkingView } from "@/components/concierge/WhosWorkingView";
import { useIsMobile } from "@/hooks/use-mobile";

export default function WhosWorkingPage() {
  const isMobile = useIsMobile();

  return (
    <DashboardLayout title="Who's Working">
      <div className={isMobile ? "flex-1 flex flex-col min-h-0" : ""}>
        {!isMobile && (
          <div className="max-w-2xl">
            <WhosWorkingView />
          </div>
        )}
        {isMobile && <WhosWorkingView />}
      </div>
    </DashboardLayout>
  );
}

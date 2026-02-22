import { useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AnnouncementsBoard } from "@/components/concierge/AnnouncementsBoard";
import { MobilePageWrapper } from "@/components/mobile/MobilePageWrapper";
import { useActiveRole } from "@/hooks/useActiveRole";
import { useIsMobile } from "@/hooks/use-mobile";

export default function AnnouncementsPage() {
  const { activeRole } = useActiveRole();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const content = (
    <>
      {!isMobile && (
        <h2 className="text-sm uppercase tracking-[0.15em] font-normal mb-4">
          Announcements
        </h2>
      )}
      <AnnouncementsBoard contextRole={activeRole ?? undefined} />
    </>
  );

  return (
    <DashboardLayout title="Announcements">
      <div className={isMobile ? "flex-1 flex flex-col min-h-0" : "p-4 md:p-8 max-w-3xl"}>
        {isMobile ? (
          <MobilePageWrapper
            onRefresh={() => {
              queryClient.invalidateQueries({ queryKey: ["staff-announcements"] });
              queryClient.invalidateQueries({ queryKey: ["staff-announcement-reads"] });
            }}
          >
            {content}
          </MobilePageWrapper>
        ) : (
          content
        )}
      </div>
    </DashboardLayout>
  );
}

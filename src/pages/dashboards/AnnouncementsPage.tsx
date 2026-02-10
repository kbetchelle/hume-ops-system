import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AnnouncementsBoard } from "@/components/concierge/AnnouncementsBoard";
import { useActiveRole } from "@/hooks/useActiveRole";

export default function AnnouncementsPage() {
  const { activeRole } = useActiveRole();

  return (
    <DashboardLayout title="Announcements">
      <div className="p-4 md:p-8 max-w-3xl">
        <h2 className="text-sm uppercase tracking-[0.15em] font-normal mb-4">
          Announcements
        </h2>
        <AnnouncementsBoard contextRole={activeRole ?? undefined} />
      </div>
    </DashboardLayout>
  );
}

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardWrapper } from "@/components/layout/DashboardWrapper";
import { StaffAnnouncementsManager } from "@/components/management/StaffAnnouncementsManager";

export default function StaffAnnouncementsPage() {
  return (
    <DashboardLayout title="Staff Announcements">
      <DashboardWrapper subtitle="Staff Announcements">
        <StaffAnnouncementsManager />
      </DashboardWrapper>
    </DashboardLayout>
  );
}

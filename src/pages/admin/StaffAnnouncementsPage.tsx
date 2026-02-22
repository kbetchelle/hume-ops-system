import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StaffAnnouncementsManager } from "@/components/management/StaffAnnouncementsManager";

export default function StaffAnnouncementsPage() {
  return (
    <DashboardLayout title="Staff Announcements">
      <StaffAnnouncementsManager />
    </DashboardLayout>
  );
}

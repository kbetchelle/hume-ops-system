import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StaffChecklistView } from "@/components/checklists/StaffChecklistView";

export default function MyChecklistsPage() {
  return (
    <DashboardLayout title="My Checklists">
      <StaffChecklistView />
    </DashboardLayout>
  );
}

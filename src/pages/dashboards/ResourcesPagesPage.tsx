import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ResourcePagesTab } from "@/components/staff-resources/ResourcePagesTab";
import { useActiveRole } from "@/hooks/useActiveRole";
import { useResourcePagesByRole } from "@/hooks/useStaffResources";

export default function ResourcesPagesPage() {
  const { activeRole } = useActiveRole();
  const { data: pages = [], isLoading } = useResourcePagesByRole(activeRole ?? "concierge");

  return (
    <DashboardLayout title="Resource Pages">
      <div className="p-4 md:p-8">
        <ResourcePagesTab pages={pages} isLoading={isLoading} searchTerm="" />
      </div>
    </DashboardLayout>
  );
}

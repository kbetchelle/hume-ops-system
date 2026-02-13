import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { QuickLinksTab } from "@/components/staff-resources/QuickLinksTab";
import { useActiveRole } from "@/hooks/useActiveRole";
import { useQuickLinkGroupsByRole } from "@/hooks/useStaffResources";
import { useScrollToResource } from "@/hooks/useScrollToResource";

export default function ResourcesQuickLinksPage() {
  const { activeRole } = useActiveRole();
  const { data: groups = [], isLoading } = useQuickLinkGroupsByRole(activeRole ?? "concierge");
  useScrollToResource();

  return (
    <DashboardLayout title="Quick Links">
      <div className="p-4 md:p-8">
        <QuickLinksTab groups={groups} isLoading={isLoading} searchTerm="" />
      </div>
    </DashboardLayout>
  );
}

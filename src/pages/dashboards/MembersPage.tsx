import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { MembersTable } from "@/components/members/MembersTable";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";

export default function MembersPage() {
  const { user } = useAuth();
  const { data: roles = [] } = useUserRoles(user?.id);

  const isManagerOrAdmin = roles.some(
    (r) => r.role === "admin" || r.role === "manager"
  );

  return (
    <DashboardLayout title="Members">
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-sm uppercase tracking-[0.15em] font-normal">
            {isManagerOrAdmin ? "All Members" : "My Clients"}
          </h2>
          <p className="text-xs text-muted-foreground tracking-wide">
            {isManagerOrAdmin
              ? "View and manage all gym members. Add notes and track member activity."
              : "View your assigned clients and leads. Add notes to track progress."}
          </p>
        </div>

        <MembersTable showSyncButton={isManagerOrAdmin} />
      </div>
    </DashboardLayout>
  );
}

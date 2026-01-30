import { MembersLayout } from "@/components/members/MembersLayout";
import { ClientsTable } from "@/components/members/ClientsTable";

export default function TemporaryMembershipsPage() {
  return (
    <MembersLayout title="Temporary Memberships">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Temporary Memberships</h2>
          <p className="text-sm text-muted-foreground">
            Clients with temporary or trial memberships.
          </p>
        </div>
        <ClientsTable filterType="temporary" emptyMessage="No temporary memberships" />
      </div>
    </MembersLayout>
  );
}

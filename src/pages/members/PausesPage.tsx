import { MembersLayout } from "@/components/members/MembersLayout";
import { ClientsTable } from "@/components/members/ClientsTable";

export default function PausesPage() {
  return (
    <MembersLayout title="Pauses">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Pauses</h2>
          <p className="text-sm text-muted-foreground">
            Clients with paused memberships.
          </p>
        </div>
        <ClientsTable filterType="paused" emptyMessage="No paused memberships" />
      </div>
    </MembersLayout>
  );
}

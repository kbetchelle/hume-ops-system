import { MembersLayout } from "@/components/members/MembersLayout";
import { ClientsTable } from "@/components/members/ClientsTable";

export default function AllClientsPage() {
  return (
    <MembersLayout title="All Clients">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">All Clients</h2>
          <p className="text-sm text-muted-foreground">
            View and manage all clients synced from Arketa.
          </p>
        </div>
        <ClientsTable />
      </div>
    </MembersLayout>
  );
}

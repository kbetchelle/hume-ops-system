import { MembersLayout } from "@/components/members/MembersLayout";
import { ClientsTable } from "@/components/members/ClientsTable";

export default function CancellationsPage() {
  return (
    <MembersLayout title="Cancellations">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Cancellations</h2>
          <p className="text-sm text-muted-foreground">
            Clients who have cancelled their memberships.
          </p>
        </div>
        <ClientsTable filterType="cancelled" emptyMessage="No cancellations" />
      </div>
    </MembersLayout>
  );
}

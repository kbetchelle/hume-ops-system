import { MembersLayout } from "@/components/members/MembersLayout";
import { ClientsTable } from "@/components/members/ClientsTable";

export default function GuestsPage() {
  return (
    <MembersLayout title="Guests">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Guests</h2>
          <p className="text-sm text-muted-foreground">
            View clients with guest status.
          </p>
        </div>
        <ClientsTable filterType="guests" emptyMessage="No guests found" />
      </div>
    </MembersLayout>
  );
}

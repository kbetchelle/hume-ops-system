import { MembersLayout } from "@/components/members/MembersLayout";
import { ClientsTable } from "@/components/members/ClientsTable";

export default function WaitlistPage() {
  return (
    <MembersLayout title="Waitlist">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Waitlist</h2>
          <p className="text-sm text-muted-foreground">
            Clients currently on the membership waitlist.
          </p>
        </div>
        <ClientsTable filterType="waitlist" emptyMessage="No clients on waitlist" />
      </div>
    </MembersLayout>
  );
}

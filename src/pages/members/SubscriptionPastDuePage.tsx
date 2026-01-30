import { MembersLayout } from "@/components/members/MembersLayout";
import { ClientsTable } from "@/components/members/ClientsTable";

export default function SubscriptionPastDuePage() {
  return (
    <MembersLayout title="Subscription Past Due">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Subscription Past Due</h2>
          <p className="text-sm text-muted-foreground">
            Clients with past due subscriptions.
          </p>
        </div>
        <ClientsTable filterType="subscription-past-due" emptyMessage="No past due subscriptions" />
      </div>
    </MembersLayout>
  );
}

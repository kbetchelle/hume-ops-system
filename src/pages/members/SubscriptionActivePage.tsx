import { MembersLayout } from "@/components/members/MembersLayout";
import { ClientsTable } from "@/components/members/ClientsTable";

export default function SubscriptionActivePage() {
  return (
    <MembersLayout title="Subscription Active">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Subscription Active</h2>
          <p className="text-sm text-muted-foreground">
            Clients with active subscriptions.
          </p>
        </div>
        <ClientsTable filterType="subscription-active" emptyMessage="No active subscriptions" />
      </div>
    </MembersLayout>
  );
}

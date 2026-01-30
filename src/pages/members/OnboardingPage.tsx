import { MembersLayout } from "@/components/members/MembersLayout";
import { ClientsTable } from "@/components/members/ClientsTable";

export default function OnboardingPage() {
  return (
    <MembersLayout title="Onboarding">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Onboarding</h2>
          <p className="text-sm text-muted-foreground">
            Clients currently in the onboarding process.
          </p>
        </div>
        <ClientsTable filterType="onboarding" emptyMessage="No clients onboarding" />
      </div>
    </MembersLayout>
  );
}

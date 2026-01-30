import { MembersLayout } from "@/components/members/MembersLayout";
import { ClientsTable } from "@/components/members/ClientsTable";

export default function ApplicationSubmittedPage() {
  return (
    <MembersLayout title="Application Submitted">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Application Submitted</h2>
          <p className="text-sm text-muted-foreground">
            Clients who have submitted membership applications.
          </p>
        </div>
        <ClientsTable filterType="application-submitted" emptyMessage="No applications found" />
      </div>
    </MembersLayout>
  );
}

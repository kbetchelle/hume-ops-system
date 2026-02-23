import { useState } from "react";
import { MembersLayout } from "@/components/members/MembersLayout";
import { MastercardVisitsTable } from "@/components/members/MastercardVisitsTable";
import { AddMastercardVisitDialog } from "@/components/members/AddMastercardVisitDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function MastercardPage() {
  const [showAdd, setShowAdd] = useState(false);
  return (
    <MembersLayout title="Mastercard">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Mastercard Visits</h2>
            <p className="text-sm text-muted-foreground">
              Manage scheduled Mastercard client visits and concierge assignments.
            </p>
          </div>
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Visit
          </Button>
        </div>
        <MastercardVisitsTable />
        <AddMastercardVisitDialog open={showAdd} onOpenChange={setShowAdd} />
      </div>
    </MembersLayout>
  );
}

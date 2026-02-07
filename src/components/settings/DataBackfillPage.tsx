import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, CreditCard, BookOpen } from "lucide-react";
import ReservationsBackfillTab from "./backfill/ReservationsBackfillTab";
import PaymentsBackfillTab from "./backfill/PaymentsBackfillTab";
import ArketaClassesBackfillTab from "./backfill/ArketaClassesBackfillTab";

export default function DataBackfillPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Data Backfill</h1>
        <p className="text-muted-foreground">
          Sync historical Arketa data by date range. Reservations and payments use run-backfill-job; classes use sync-arketa-classes.
        </p>
      </div>
      <Tabs defaultValue="reservations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reservations" className="gap-2">
            <History className="h-4 w-4" />
            Reservations
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="classes" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Arketa Classes
          </TabsTrigger>
        </TabsList>
        <TabsContent value="reservations" className="space-y-4">
          <ReservationsBackfillTab />
        </TabsContent>
        <TabsContent value="payments" className="space-y-4">
          <PaymentsBackfillTab />
        </TabsContent>
        <TabsContent value="classes" className="space-y-4">
          <ArketaClassesBackfillTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

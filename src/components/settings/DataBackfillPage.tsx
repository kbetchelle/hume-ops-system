import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { History, CreditCard } from "lucide-react";
import ReservationsBackfillTab from "./backfill/ReservationsBackfillTab";
import PaymentsBackfillTab from "./backfill/PaymentsBackfillTab";

export default function DataBackfillPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Data Backfill</h1>
        <p className="text-muted-foreground">
          Sync historical Arketa data by date range. Uses Arketa Partner API via run-backfill-job.
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
        </TabsList>
        <TabsContent value="reservations" className="space-y-4">
          <ReservationsBackfillTab />
        </TabsContent>
        <TabsContent value="payments" className="space-y-4">
          <PaymentsBackfillTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

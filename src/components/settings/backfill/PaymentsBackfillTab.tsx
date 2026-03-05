import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useBackfillJob } from "./useBackfillJob";
import PaymentsSyncLog from "./PaymentsSyncLog";
import BackfillCalendarHeatmap from "./BackfillCalendarHeatmap";
import SyncProgressCard from "./SyncProgressCard";
import PaymentsDateSelector from "./PaymentsDateSelector";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function PaymentsBackfillTab() {
  const {
    startDate, setStartDate, endDate, setEndDate, isRange, setIsRange,
    dayCount, syncProgress, handleSync, handleCancelJob, elapsedText, totalNewRecords,
  } = useBackfillJob("arketa_payments");

  // Force range mode for payments
  const effectiveIsRange = true;

  const { data: totalCount } = useQuery({
    queryKey: ["total-payments-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("arketa_payments").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: syncProgress.isRunning ? 5000 : 60000,
  });

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Updated_at Range Sync</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            Payments sync uses the Arketa <code className="text-xs bg-muted px-1 py-0.5 rounded">updated_at_min</code> / <code className="text-xs bg-muted px-1 py-0.5 rounded">updated_at_max</code> API parameters for server-side filtering.
          </p>
          <p className="text-xs text-muted-foreground">
            <strong>Timezone handling:</strong> The API receives UTC boundaries (<code>startT00:00:00.000Z</code> → <code>endT23:59:59.999Z</code>).
            Arketa stores timestamps as <strong>PST values with a UTC (+00) offset</strong> ("fake UTC").
            The <code>created_at_api</code> column stores the raw API timestamp as <code>timestamptz</code>.
            Display uses <code>formatInTimeZone(ts, "UTC", ...)</code> to show the original PST time without browser re-conversion.
          </p>
        </AlertDescription>
      </Alert>
      <PaymentsDateSelector
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        isRunning={syncProgress.isRunning}
        elapsedText={elapsedText}
        onSync={handleSync}
        onCancel={handleCancelJob}
      />
      <SyncProgressCard
        syncProgress={syncProgress}
        startDate={startDate}
        endDate={endDate}
        isRange={effectiveIsRange}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payments Table</CardTitle>
          <CardDescription>arketa_payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Total records</Badge>
            <span className="text-2xl font-semibold">{totalCount?.toLocaleString() ?? "-"}</span>
          </div>
        </CardContent>
      </Card>
      <PaymentsSyncLog
        results={syncProgress.results}
        isRunning={syncProgress.isRunning}
        totalRecords={syncProgress.totalRecords}
        totalNewRecords={totalNewRecords}
      />
      <BackfillCalendarHeatmap type="payments" refetchTrigger={syncProgress.isRunning} />
    </div>
  );
}

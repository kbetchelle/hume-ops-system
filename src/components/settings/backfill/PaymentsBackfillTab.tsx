import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useBackfillJob } from "./useBackfillJob";
import PaymentsSyncLog from "./PaymentsSyncLog";
import BackfillCalendarHeatmap from "./BackfillCalendarHeatmap";
import SyncProgressCard from "./SyncProgressCard";
import { Loader2, Play, XCircle, RefreshCw } from "lucide-react";

export default function PaymentsBackfillTab() {
  const {
    startDate, endDate, isRange,
    syncProgress, handleSync, handleCancelJob, elapsedText, totalNewRecords,
  } = useBackfillJob("arketa_payments");

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Sync
          </CardTitle>
          <CardDescription>
            Payments sync pulls all records from Arketa (no date range needed).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={handleSync} disabled={syncProgress.isRunning} className="flex-1 gap-2" size="lg">
              {syncProgress.isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Syncing... {elapsedText}
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Sync All Payments
                </>
              )}
            </Button>
            {syncProgress.isRunning && (
              <Button onClick={handleCancelJob} variant="outline" size="lg" className="gap-2">
                <XCircle className="h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      <SyncProgressCard
        syncProgress={syncProgress}
        startDate={startDate}
        endDate={endDate}
        isRange={isRange}
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
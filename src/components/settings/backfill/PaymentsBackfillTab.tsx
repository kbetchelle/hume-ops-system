import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useBackfillJob } from "./useBackfillJob";
import DateSelector from "./DateSelector";
import PaymentsSyncLog from "./PaymentsSyncLog";
import BackfillCalendarHeatmap from "./BackfillCalendarHeatmap";
import SyncProgressCard from "./SyncProgressCard";

export default function PaymentsBackfillTab() {
  const {
    startDate, setStartDate, endDate, setEndDate, isRange, setIsRange,
    dayCount, syncProgress, handleSync, handleCancelJob, elapsedText, totalNewRecords,
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
      <DateSelector
        startDate={startDate} endDate={endDate} isRange={isRange}
        onStartDateChange={setStartDate} onEndDateChange={setEndDate} onIsRangeChange={setIsRange}
        isRunning={syncProgress.isRunning} elapsedText={elapsedText}
        onSync={handleSync} onCancel={handleCancelJob} dayCount={dayCount}
      />
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
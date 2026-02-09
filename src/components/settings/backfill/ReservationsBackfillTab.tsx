import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import DateSelector from "./DateSelector";
import { useBackfillJob } from "./useBackfillJob";
import BackfillSyncLog from "./BackfillSyncLog";
import BackfillCalendarHeatmap from "./BackfillCalendarHeatmap";
import SyncProgressCard from "./SyncProgressCard";

export default function ReservationsBackfillTab() {
  const {
    startDate, setStartDate, endDate, setEndDate, isRange, setIsRange,
    dayCount, syncProgress, handleSync, handleCancelJob, elapsedText, totalNewRecords,
  } = useBackfillJob("arketa_reservations");

  const { data: totalCount } = useQuery({
    queryKey: ["total-reservations-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("arketa_reservations_history").select("*", { count: "exact", head: true });
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
          <CardTitle className="text-base">History Table</CardTitle>
          <CardDescription>arketa_reservations_history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Total records</Badge>
            <span className="text-2xl font-semibold">{totalCount?.toLocaleString() ?? "-"}</span>
          </div>
        </CardContent>
      </Card>
      <BackfillSyncLog
        results={syncProgress.results}
        isRunning={syncProgress.isRunning}
        totalRecords={syncProgress.totalRecords}
        totalNewRecords={totalNewRecords}
      />
      <BackfillCalendarHeatmap type="reservations" refetchTrigger={syncProgress.isRunning} />
    </div>
  );
}

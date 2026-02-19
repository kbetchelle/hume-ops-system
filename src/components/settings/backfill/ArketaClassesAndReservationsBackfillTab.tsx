import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import DateSelector from "./DateSelector";
import { useBackfillJob } from "./useBackfillJob";
import BackfillSyncLog from "./BackfillSyncLog";
import BackfillCalendarHeatmap from "./BackfillCalendarHeatmap";
import SyncProgressCard from "./SyncProgressCard";

export default function ArketaClassesAndReservationsBackfillTab() {
  const {
    startDate, setStartDate, endDate, setEndDate, isRange, setIsRange,
    dayCount, syncProgress, handleSync, handleCancelJob, elapsedText, totalNewRecords,
  } = useBackfillJob("arketa_classes_and_reservations");

  const { data: reservationsCount } = useQuery({
    queryKey: ["total-reservations-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("arketa_reservations_history").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 5000,
  });

  const { data: classesCount } = useQuery({
    queryKey: ["arketa-classes-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("arketa_classes").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 5000,
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
          <CardTitle className="text-base">Classes + Reservations</CardTitle>
          <CardDescription>arketa_classes and arketa_reservations_history (classes run first per day, then reservations)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Classes</Badge>
              <span className="text-2xl font-semibold">{classesCount?.toLocaleString() ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Reservations (history)</Badge>
              <span className="text-2xl font-semibold">{reservationsCount?.toLocaleString() ?? "—"}</span>
            </div>
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

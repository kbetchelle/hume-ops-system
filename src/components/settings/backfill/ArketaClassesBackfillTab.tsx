import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import DateSelector from "./DateSelector";
import { useBackfillJob } from "./useBackfillJob";
import BackfillSyncLog from "./BackfillSyncLog";
import BackfillCalendarHeatmap from "./BackfillCalendarHeatmap";
import SyncProgressCard from "./SyncProgressCard";

export default function ArketaClassesBackfillTab() {
  const {
    startDate, setStartDate, endDate, setEndDate, isRange, setIsRange,
    dayCount, syncProgress, handleSync, handleCancelJob, elapsedText, totalNewRecords,
  } = useBackfillJob("arketa_classes");

  const { data: totalCount } = useQuery({
    queryKey: ["arketa-classes-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("arketa_classes").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: syncProgress.isRunning ? 5000 : 60000,
  });

  const hasCooldown = syncProgress.results.some(r => r.hitPageLimit);

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
        hasCooldown={hasCooldown}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">arketa_classes</CardTitle>
          <CardDescription>Master catalog of class IDs for reservation sync</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Total records</Badge>
            <span className="text-2xl font-semibold">{totalCount?.toLocaleString() ?? "—"}</span>
          </div>
        </CardContent>
      </Card>
      <BackfillSyncLog
        results={syncProgress.results}
        isRunning={syncProgress.isRunning}
        totalRecords={syncProgress.totalRecords}
        totalNewRecords={totalNewRecords}
      />
      <BackfillCalendarHeatmap type="classes" refetchTrigger={syncProgress.isRunning} />
    </div>
  );
}

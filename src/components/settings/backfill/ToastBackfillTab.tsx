import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DateSelector from "./DateSelector";
import BackfillCalendarHeatmap from "./BackfillCalendarHeatmap";
import { format, subDays } from "date-fns";

function daysBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.max(0, Math.ceil((e.getTime() - s.getTime()) / (24 * 60 * 60 * 1000))) + 1;
}

export default function ToastBackfillTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState(() => format(subDays(new Date(), 6), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [isRange, setIsRange] = useState(true);

  const dayCount = useMemo(
    () => (isRange ? daysBetween(startDate, endDate) : 1),
    [isRange, startDate, endDate]
  );

  const syncMutation = useMutation({
    mutationFn: async () => {
      const start = isRange ? startDate : startDate;
      const end = isRange ? endDate : startDate;
      const { data, error } = await supabase.functions.invoke("toast-backfill-sync", {
        body: { start_date: start, end_date: end },
      });
      if (error) throw error;
      return data as {
        success?: boolean;
        error?: string;
        ordersThisRun?: number;
        daysSyncedThisRun?: number;
        datesProcessed?: string[];
      };
    },
    onSuccess: (data) => {
      if (data?.success) {
        queryClient.invalidateQueries({ queryKey: ["toast-sales-count"] });
        queryClient.invalidateQueries({ queryKey: ["backfill-calendar", "toast"] });
        toast({
          title: "Toast backfill completed",
          description: `${data.daysSyncedThisRun ?? 0} days synced, ${data.ordersThisRun ?? 0} orders.`,
        });
      } else {
        toast({
          title: "Toast backfill failed",
          description: data?.error ?? "Unknown error",
          variant: "destructive",
        });
      }
    },
    onError: (err: Error) => {
      toast({
        title: "Toast backfill failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const { data: totalCount, refetch: refetchCount } = useQuery({
    queryKey: ["toast-sales-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("toast_sales")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const handleSync = () => syncMutation.mutate(undefined);
  const handleCancel = () => {}; // Single request; no job to cancel

  return (
    <div className="space-y-6">
      <DateSelector
        startDate={startDate}
        endDate={endDate}
        isRange={isRange}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onIsRangeChange={setIsRange}
        isRunning={syncMutation.isPending}
        elapsedText=""
        onSync={handleSync}
        onCancel={handleCancel}
        dayCount={dayCount}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">toast_sales</CardTitle>
          <CardDescription>
            Individual order records from Toast API. Max 31 days per run.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Total records</Badge>
            <span className="text-2xl font-semibold">{totalCount?.toLocaleString() ?? "—"}</span>
          </div>
          {syncMutation.data?.success && (
            <p className="text-sm text-muted-foreground mt-2">
              Last run: {syncMutation.data.daysSyncedThisRun} days, {syncMutation.data.ordersThisRun} orders
            </p>
          )}
        </CardContent>
      </Card>
      <BackfillCalendarHeatmap type="toast" refetchTrigger={syncMutation.isPending} />
    </div>
  );
}

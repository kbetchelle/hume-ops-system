import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, eachDayOfInterval } from "date-fns";
import { toast } from "sonner";
import { SyncProgress, SyncResult, BackfillJobType } from "./types";

function getCountQueryKey(jobType: BackfillJobType): string[] {
  switch (jobType) {
    case "arketa_reservations": return ["total-reservations-count"];
    case "arketa_classes": return ["arketa-classes-count"];
    case "toast_orders": return ["toast-sales-count"];
    default: return ["total-payments-count"];
  }
}

function getApiSource(jobType: BackfillJobType): string {
  return jobType.startsWith("toast") ? "toast" : "arketa";
}

function getDataType(jobType: BackfillJobType): string {
  return jobType.replace("arketa_", "").replace("toast_", "");
}

export function useBackfillJob(jobType: BackfillJobType) {
  const queryClient = useQueryClient();
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const today = format(new Date(), "yyyy-MM-dd");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [isRange, setIsRange] = useState(false);

  const dateRange = isRange
    ? eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) })
    : [parseISO(startDate)];
  const dayCount = dateRange.length;

  const { data: activeJob, refetch: refetchActiveJob } = useQuery({
    queryKey: ["active-backfill-job", jobType, activeJobId],
    queryFn: async () => {
      if (!activeJobId) {
        const { data } = await supabase
          .from("backfill_jobs")
          .select("*")
          .eq("job_type", jobType)
          .in("status", ["pending", "running"])
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        if (data) {
          setActiveJobId(data.id);
          return data;
        }
        return null;
      }
      const { data, error } = await supabase
        .from("backfill_jobs")
        .select("*")
        .eq("id", activeJobId)
        .single();
      if (error) return null;
      return data;
    },
    refetchInterval: activeJobId ? 2000 : 10000,
  });

  useEffect(() => {
    if (!activeJobId) return;
    const channel = supabase
      .channel(`backfill-job-${activeJobId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "backfill_jobs", filter: `id=eq.${activeJobId}` }, () => refetchActiveJob())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeJobId, refetchActiveJob]);

  useEffect(() => {
    if (activeJob && (activeJob.status === "completed" || activeJob.status === "cancelled" || activeJob.status === "failed")) {
      queryClient.invalidateQueries({ queryKey: getCountQueryKey(jobType) });
      const timer = setTimeout(() => { setActiveJobId(null); queryClient.invalidateQueries({ queryKey: ["sync-logs-with-details"] }); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [activeJob?.status, queryClient, jobType]);

  const syncProgress: SyncProgress = activeJob
    ? {
        isRunning: activeJob.status === "running" || activeJob.status === "pending",
        currentDate: activeJob.processing_date,
        totalDates: activeJob.total_days || activeJob.total_dates || 0,
        completedDates: activeJob.days_processed || activeJob.completed_dates || 0,
        totalRecords: activeJob.total_records || activeJob.records_processed || 0,
        results: (activeJob.results as unknown as SyncResult[] | null) || [],
        startTime: activeJob.started_at ? new Date(activeJob.started_at).getTime() : null,
      }
    : { isRunning: false, currentDate: null, totalDates: 0, completedDates: 0, totalRecords: 0, results: [], startTime: null };

  const totalNewRecords: number = activeJob?.total_new_records || 0;

  const handleSync = useCallback(async () => {
    const dates = isRange ? eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) }) : [parseISO(startDate)];
    try {
      const { data: user } = await supabase.auth.getUser();
      const { data: job, error: createError } = await supabase
        .from("backfill_jobs")
        .insert({
          api_source: getApiSource(jobType),
          data_type: getDataType(jobType),
          job_type: jobType,
          status: "pending",
          start_date: startDate,
          end_date: isRange ? endDate : startDate,
          total_days: dates.length,
          days_processed: 0,
          records_processed: 0,
          created_by: user?.user?.id || null,
        })
        .select()
        .single();
      if (createError) throw createError;
      setActiveJobId(job.id);
      const { error: invokeError } = await supabase.functions.invoke("run-backfill-job", { body: { jobId: job.id } });
      if (invokeError) {
        toast.error("Failed to start sync job");
      } else {
        toast.success("Sync job started - you can leave this page and it will continue running");
      }
    } catch (err) {
      console.error("Failed to create sync job:", err);
      toast.error("Failed to create sync job");
    }
  }, [startDate, endDate, isRange, jobType]);

  const handleCancelJob = useCallback(async () => {
    if (!activeJobId) return;
    try {
      await supabase.functions.invoke("run-backfill-job", { body: { jobId: activeJobId, action: "cancel" } });
      toast.info("Cancelling sync job...");
    } catch (err) {
      toast.error("Failed to cancel job");
    }
  }, [activeJobId]);

  const elapsedMs = syncProgress.startTime ? Date.now() - syncProgress.startTime : 0;
  const elapsedText = elapsedMs > 0 ? `${Math.floor(elapsedMs / 1000)}s` : "";

  return { startDate, setStartDate, endDate, setEndDate, isRange, setIsRange, dayCount, syncProgress, activeJobId, handleSync, handleCancelJob, elapsedText, totalNewRecords };
}

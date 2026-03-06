import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, eachDayOfInterval } from "date-fns";
import { getPSTToday } from "@/lib/dateUtils";
import { toast } from "sonner";
import { SyncProgress, SyncResult, BackfillJobType } from "./types";

function getCountQueryKey(jobType: BackfillJobType): string[] {
  switch (jobType) {
    case "arketa_reservations": return ["total-reservations-count"];
    case "arketa_classes": return ["arketa-classes-count"];
    case "arketa_classes_and_reservations": return ["total-reservations-count", "arketa-classes-count"];
    case "toast_orders": return ["toast-sales-count"];
    default: return ["total-payments-count"];
  }
}

function getApiSource(jobType: BackfillJobType): string {
  return jobType.startsWith("toast") ? "toast" : "arketa";
}

function getDataType(jobType: BackfillJobType): string {
  if (jobType === "arketa_classes_and_reservations" || jobType === "arketa_reservations") return "classes_and_reservations";
  return jobType.replace("arketa_", "").replace("toast_", "");
}

export function useBackfillJob(jobType: BackfillJobType) {
  const queryClient = useQueryClient();
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const today = getPSTToday();
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
        const { data, error } = await supabase
          .from("backfill_jobs")
          .select("*")
          .eq("job_type", jobType)
          .in("status", ["pending", "running"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw error;
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
      if (error) throw error;
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
      getCountQueryKey(jobType).forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
      const timer = setTimeout(() => { setActiveJobId(null); queryClient.invalidateQueries({ queryKey: ["sync-logs-with-details"] }); }, 3000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to status transition; activeJob object identity changes on refetch would reset the timeout
  }, [activeJob?.status, queryClient, jobType]);

  // For classes, completed_dates tracks chunks not days; total_days is the original day count but completed_dates is chunk count
  const completedCount = activeJob?.completed_dates || activeJob?.days_processed || 0;
  const totalCount = activeJob?.total_days || activeJob?.total_dates || 0;

  const syncProgress: SyncProgress = activeJob
    ? {
        isRunning: activeJob.status === "running" || activeJob.status === "pending",
        currentDate: activeJob.processing_date,
        totalDates: totalCount,
        completedDates: completedCount,
        totalRecords: activeJob.total_records || activeJob.records_processed || 0,
        results: (activeJob.results as unknown as SyncResult[] | null) || [],
        startTime: activeJob.started_at ? new Date(activeJob.started_at).getTime() : null,
        syncPhase: activeJob.sync_phase || null,
        currentBatchCount: activeJob.current_batch_count || 0,
        recordsInCurrentBatch: activeJob.records_in_current_batch || 0,
        cumulativeInserted: activeJob.cumulative_inserted || 0,
        cumulativeUpdated: activeJob.cumulative_updated || 0,
      }
    : { isRunning: false, currentDate: null, totalDates: 0, completedDates: 0, totalRecords: 0, results: [], startTime: null, syncPhase: null, currentBatchCount: 0, recordsInCurrentBatch: 0, cumulativeInserted: 0, cumulativeUpdated: 0 };

  const totalNewRecords: number = activeJob?.total_new_records || 0;

  const handleSync = useCallback(async () => {
    // Payments always use range mode (full updated_at range fetch)
    const effectiveIsRange = jobType === "arketa_payments" ? true : isRange;
    const effectiveEndDate = effectiveIsRange ? endDate : startDate;
    const dates = effectiveIsRange ? eachDayOfInterval({ start: parseISO(startDate), end: parseISO(effectiveEndDate) }) : [parseISO(startDate)];
    try {
      const { data: existingJob, error: existingJobError } = await supabase
        .from("backfill_jobs")
        .select("id")
        .eq("job_type", jobType)
        .in("status", ["pending", "running"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existingJobError) throw existingJobError;
      if (existingJob?.id) {
        setActiveJobId(existingJob.id);
        toast.info("A sync job is already running for this data type");
        return;
      }

      const { data: user } = await supabase.auth.getUser();
      const { data: job, error: createError } = await supabase
        .from("backfill_jobs")
        .insert({
          api_source: getApiSource(jobType),
          data_type: getDataType(jobType),
          job_type: jobType,
          status: "pending",
          start_date: startDate,
          end_date: effectiveEndDate,
          total_days: dates.length,
          days_processed: 0,
          records_processed: 0,
          created_by: user?.user?.id || null,
        })
        .select()
        .single();
      if (createError) throw createError;
      setActiveJobId(job.id);
      const { error: invokeError } = await supabase.functions.invoke("run-backfill-job", { body: { jobId: job.id, action: "start" } });
      if (invokeError) {
        const invokeMessage = invokeError.message || "";
        if (/failed to fetch|network|connection/i.test(invokeMessage)) {
          toast.info("Sync job queued - refreshing progress in the background");
        } else {
          toast.error("Failed to start sync job");
        }
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

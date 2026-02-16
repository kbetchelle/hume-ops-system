import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type DailyReportRow = Database["public"]["Tables"]["daily_reports"]["Row"];

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/** Fetch a single daily report by date (YYYY-MM-DD). */
export function useReport(date: string | null) {
  return useQuery({
    queryKey: ["daily-report", date],
    queryFn: async () => {
      if (!date) return null;
      const { data, error } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("report_date", date)
        .maybeSingle();
      if (error) throw error;
      return data as DailyReportRow | null;
    },
    enabled: !!date && /^\d{4}-\d{2}-\d{2}$/.test(date),
  });
}

/** Tuesday = 2 in date-fns weekStartsOn. */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day >= 2 ? day - 2 : day + 5;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekEnd(weekStart: Date): Date {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/** Fetch daily reports for a date range (e.g. Tuesday–Monday week). */
export function useWeeklyReports(startDate: string | null, endDate: string | null) {
  return useQuery({
    queryKey: ["weekly-reports", startDate, endDate],
    queryFn: async () => {
      if (!startDate || !endDate) return [];
      const { data, error } = await supabase
        .from("daily_reports")
        .select("*")
        .gte("report_date", startDate)
        .lte("report_date", endDate)
        .order("report_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as DailyReportRow[];
    },
    enabled: !!startDate && !!endDate,
  });
}

/** Trigger auto-aggregate-daily-report for one date or range. */
export function useAggregateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      date?: string;
      start_date?: string;
      end_date?: string;
      sync_source?: "auto" | "manual";
    }) => {
      const { data, error } = await supabase.functions.invoke("auto-aggregate-daily-report", {
        body: { ...params, sync_source: params.sync_source ?? "manual" },
      });
      if (error) throw error;
      if (data && !(data as { success?: boolean }).success) {
        throw new Error((data as { error?: string }).error ?? "Aggregation failed");
      }
      return data;
    },
    onSuccess: (_, variables) => {
      if (variables.date) {
        queryClient.invalidateQueries({ queryKey: ["daily-report", variables.date] });
      }
      if (variables.start_date || variables.end_date) {
        queryClient.invalidateQueries({ queryKey: ["weekly-reports"] });
      }
    },
  });
}

/** Download PDF from generate-report-pdf edge function (binary response). */
export async function exportReportPDF(params: {
  report_date?: string;
  start_date?: string;
  end_date?: string;
  format: "single" | "weekly" | "batch";
}): Promise<Blob> {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token ?? "";
  const url = `${SUPABASE_URL}/functions/v1/generate-report-pdf`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `PDF export failed: ${res.status}`);
  }
  return res.blob();
}

/** Hook to trigger PDF export and trigger download in browser. */
export function useExportPDF() {
  return useMutation({
    mutationFn: async (params: {
      report_date?: string;
      start_date?: string;
      end_date?: string;
      format: "single" | "weekly" | "batch";
    }) => {
      const blob = await exportReportPDF(params);
      const filename =
        params.format === "single"
          ? `Daily-Report-${params.report_date ?? "report"}.pdf`
          : `Report-${params.start_date ?? ""}-to-${params.end_date ?? ""}.pdf`;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
      return { ok: true };
    },
  });
}

/** Update a daily report (inline edit save). Merges with existing row and recalculates totals. */
export function useUpdateReport(date: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<Database["public"]["Tables"]["daily_reports"]["Update"]>) => {
      if (!date) throw new Error("No date");
      const { data: existing } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("report_date", date)
        .maybeSingle();
      const merged = { ...existing, ...updates } as Record<string, unknown>;
      const gross_sales_arketa =
        Number(merged.gross_sales_membership ?? 0) + Number(merged.gross_sales_other ?? 0);
      const total_sales = Number(gross_sales_arketa) + Number(merged.cafe_sales ?? 0);
      const { data, error } = await supabase
        .from("daily_reports")
        .update({
          ...updates,
          gross_sales_arketa,
          total_sales,
        })
        .eq("report_date", date)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (date) queryClient.invalidateQueries({ queryKey: ["daily-report", date] });
      queryClient.invalidateQueries({ queryKey: ["weekly-reports"] });
    },
  });
}

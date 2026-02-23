import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { format, subDays } from "date-fns";

export interface DashboardShiftNote {
  id: string;
  source: "concierge" | "cafe" | "boh";
  sourceLabel: string;
  content: string;
  staffName: string;
  shiftType?: string;
  createdAt: string;
}

export function useDashboardShiftNotes() {
  const { user } = useAuthContext();
  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

  // Concierge shift reports with management notes (today + yesterday)
  const { data: conciergeData, isLoading: conciergeLoading } = useQuery({
    queryKey: ["dashboard-shift-concierge", today, yesterday],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_report_history")
        .select("id, report_date, shift_type, staff_name, management_notes, created_at")
        .in("report_date", [today, yesterday])
        .eq("status", "submitted")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  // Staff Q&A entries (BoH/Cafe notes - recent)
  const { data: qaData, isLoading: qaLoading } = useQuery({
    queryKey: ["dashboard-shift-qa", today, yesterday],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_qa")
        .select("id, question, context, asked_by_name, created_at")
        .gte("created_at", `${yesterday}T00:00:00`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const notes = useMemo(() => {
    const merged: DashboardShiftNote[] = [];

    // Map concierge management notes
    for (const report of conciergeData ?? []) {
      if (report.management_notes && report.management_notes.trim()) {
        merged.push({
          id: `concierge-mgmt-${report.id}`,
          source: "concierge",
          sourceLabel: "Concierge",
          content: report.management_notes,
          staffName: report.staff_name ?? "Unknown",
          shiftType: report.shift_type,
          createdAt: report.created_at,
        });
      }

    }

    // Map Q&A entries as BoH/Cafe notes
    for (const qa of qaData ?? []) {
      merged.push({
        id: `qa-${qa.id}`,
        source: "boh",
        sourceLabel: "BoH",
        content: qa.question + (qa.context ? ` — ${qa.context}` : ""),
        staffName: qa.asked_by_name,
        createdAt: qa.created_at,
      });
    }

    // Sort by createdAt DESC
    merged.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return merged;
  }, [conciergeData, qaData]);

  return {
    notes,
    isLoading: conciergeLoading || qaLoading,
  };
}

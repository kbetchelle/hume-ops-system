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

  // BoH end-of-shift free_response completions (today + yesterday)
  const { data: bohEndOfShiftData, isLoading: bohLoading } = useQuery({
    queryKey: ["dashboard-shift-boh-eos", today, yesterday],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("boh_completions")
        .select("id, note_text, completed_by, completion_date, shift_time, completed_at, item_id, checklist_id")
        .in("completion_date", [today, yesterday])
        .not("note_text", "is", null)
        .order("completed_at", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Get the matching checklist items to filter only end-of-shift free_response
      const itemIds = [...new Set(data.map((c) => c.item_id).filter(Boolean))];
      if (itemIds.length === 0) return [];

      const { data: items, error: itemsError } = await supabase
        .from("boh_checklist_items")
        .select("id, task_description, time_hint, task_type")
        .in("id", itemIds)
        .eq("time_hint", "End of Shift")
        .eq("task_type", "free_response");

      if (itemsError) throw itemsError;
      const eosItemIds = new Set((items ?? []).map((i) => i.id));
      const itemMap = new Map((items ?? []).map((i) => [i.id, i]));

      return data
        .filter((c) => c.item_id && eosItemIds.has(c.item_id) && c.note_text?.trim())
        .map((c) => ({
          ...c,
          taskDescription: itemMap.get(c.item_id!)?.task_description ?? "",
        }));
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

    // Map BoH end-of-shift free_response completions
    for (const comp of bohEndOfShiftData ?? []) {
      merged.push({
        id: `boh-eos-${comp.id}`,
        source: "boh",
        sourceLabel: "BoH End of Shift",
        content: `${comp.taskDescription}: ${comp.note_text}`,
        staffName: comp.completed_by ?? "Unknown",
        shiftType: comp.shift_time,
        createdAt: comp.completed_at ?? comp.completion_date,
      });
    }

    // Sort by createdAt DESC
    merged.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return merged;
  }, [conciergeData, qaData, bohEndOfShiftData]);

  return {
    notes,
    isLoading: conciergeLoading || qaLoading || bohLoading,
  };
}

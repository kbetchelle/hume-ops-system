import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

export interface FeedbackEntry {
  type: "positive" | "negative" | "neutral";
  content: string;
}

export interface MembershipRequest {
  requestType: "cancel" | "pause";
  name: string;
  email?: string;
  membershipType?: string;
  endDate?: string;
}

export interface CelebratoryEvent {
  memberName: string;
  eventType: string;
  date?: string;
}

export interface TourNote {
  name: string;
  notesCompleted: boolean;
  followUpSent: boolean;
}

export interface FacilityIssue {
  description: string;
  photoUrl?: string;
}

export interface SystemIssue {
  category: string;
  description: string;
  photoUrl?: string;
}

export interface FutureShiftNote {
  targetDate: string;
  targetShift: "AM" | "PM";
  note: string;
}

export interface ShiftReportData {
  id?: string;
  report_date: string;
  shift_type: "AM" | "PM";
  staff_user_id: string;
  staff_name: string;
  member_feedback: FeedbackEntry[];
  membership_requests: MembershipRequest[];
  celebratory_events: CelebratoryEvent[];
  scheduled_tours: unknown[];
  tour_notes: TourNote[];
  facility_issues: FacilityIssue[];
  busiest_areas: string;
  system_issues: SystemIssue[];
  management_notes: string;
  future_shift_notes: FutureShiftNote[];
  status: "draft" | "submitted" | "reviewed";
}

export function useShiftReport(date: string, shiftType: "AM" | "PM") {
  return useQuery({
    queryKey: ["shiftReport", date, shiftType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_report_history")
        .select("*")
        .eq("report_date", date)
        .eq("shift_type", shiftType)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}

export function useShiftReportHistory(limit = 30) {
  return useQuery({
    queryKey: ["shiftReportHistory", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_report_history")
        .select("*")
        .order("report_date", { ascending: false })
        .order("shift_type", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
  });
}

export function useSaveShiftReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (report: ShiftReportData) => {
      const payload = {
        report_date: report.report_date,
        shift_type: report.shift_type,
        staff_user_id: report.staff_user_id,
        staff_name: report.staff_name,
        member_feedback: report.member_feedback as unknown as Json,
        membership_requests: report.membership_requests as unknown as Json,
        celebratory_events: report.celebratory_events as unknown as Json,
        scheduled_tours: report.scheduled_tours as unknown as Json,
        tour_notes: report.tour_notes as unknown as Json,
        facility_issues: report.facility_issues as unknown as Json,
        busiest_areas: report.busiest_areas,
        system_issues: report.system_issues as unknown as Json,
        management_notes: report.management_notes,
        future_shift_notes: report.future_shift_notes as unknown as Json,
        status: report.status,
        submitted_at: report.status === "submitted" ? new Date().toISOString() : null,
      };

      if (report.id) {
        const { data, error } = await supabase
          .from("daily_report_history")
          .update(payload)
          .eq("id", report.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("daily_report_history")
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["shiftReport", variables.report_date, variables.shift_type],
      });
      queryClient.invalidateQueries({ queryKey: ["shiftReportHistory"] });
      toast({
        title: variables.status === "submitted" ? "Report submitted" : "Report saved",
        description:
          variables.status === "submitted"
            ? "Your shift report has been submitted."
            : "Your draft has been saved.",
      });
    },
    onError: (error) => {
      console.error("Failed to save report:", error);
      toast({
        title: "Error",
        description: "Failed to save report. Please try again.",
        variant: "destructive",
      });
    },
  });
}

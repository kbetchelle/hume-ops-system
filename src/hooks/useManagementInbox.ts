import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { useUserRoles } from "@/hooks/useUserRoles";
import type {
  InboxItem,
  InboxItemType,
  QAInboxData,
  FlagInboxData,
  ShiftNoteInboxData,
  SickDayInboxData,
} from "@/types/inbox";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const INBOX_QA_KEY = "inbox-qa";
const INBOX_FLAGS_KEY = "inbox-flags";
const INBOX_SHIFT_NOTES_KEY = "inbox-shift-notes";
const INBOX_SICK_DAY_KEY = "inbox-sick-day";
const INBOX_READS_KEY = "inbox-reads";
const INBOX_UNREAD_COUNT_KEY = "inbox-unread-count";

// ---------------------------------------------------------------------------
// Hook 1: useManagementInbox
// Merges Q&A, flags, and shift notes into a single chronological list.
// ---------------------------------------------------------------------------

export function useManagementInbox(searchTerm?: string) {
  const { user } = useAuthContext();

  // Fetch Q&A entries
  const { data: qaData, isLoading: qaLoading } = useQuery({
    queryKey: [INBOX_QA_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_qa")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  // Fetch resource flags
  const { data: flagData, isLoading: flagsLoading } = useQuery({
    queryKey: [INBOX_FLAGS_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resource_outdated_flags")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  // Fetch shift reports with management notes
  const { data: shiftData, isLoading: shiftLoading } = useQuery({
    queryKey: [INBOX_SHIFT_NOTES_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_report_history")
        .select(
          "id, report_date, shift_type, staff_name, management_notes, status, created_at"
        )
        .not("management_notes", "is", null)
        .neq("management_notes", "")
        .eq("status", "submitted")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  // Fetch sick day requests
  const { data: sickDayData, isLoading: sickDayLoading } = useQuery({
    queryKey: [INBOX_SICK_DAY_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sick_day_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  // Fetch read status for current user
  const { data: readsData, isLoading: readsLoading } = useQuery({
    queryKey: [INBOX_READS_KEY, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("inbox_reads")
        .select("item_type, item_id")
        .eq("user_id", user.id);

      if (error) throw error;
      return (data ?? []) as { item_type: string; item_id: string }[];
    },
    enabled: !!user?.id,
  });

  const items = useMemo(() => {
    const readSet = new Set(
      (readsData ?? []).map((r) => `${r.item_type}:${r.item_id}`)
    );

    const merged: InboxItem[] = [];

    // Map Q&A entries
    for (const qa of qaData ?? []) {
      merged.push({
        id: qa.id,
        type: "qa",
        createdAt: qa.created_at,
        isRead: readSet.has(`qa:${qa.id}`),
        data: {
          type: "qa",
          question: qa.question,
          context: qa.context,
          askedByName: qa.asked_by_name,
          askedById: qa.asked_by_id,
          isResolved: qa.is_resolved,
          answer: qa.answer,
          answerType: qa.answer_type,
          linkedPolicyId: qa.linked_policy_id,
          answeredByName: qa.answered_by_name,
          isPublic: qa.is_public,
        } as QAInboxData,
      });
    }

    // Map flags
    for (const flag of flagData ?? []) {
      merged.push({
        id: flag.id,
        type: "flag",
        createdAt: flag.created_at,
        isRead: readSet.has(`flag:${flag.id}`),
        data: {
          type: "flag",
          resourceType: flag.resource_type,
          resourceId: flag.resource_id,
          resourceLabel: flag.resource_label,
          note: flag.note,
          flaggedByName: flag.flagged_by_name,
          flaggedById: flag.flagged_by_id,
          status: flag.status,
          resolvedByName: flag.resolved_by_name,
          resolvedAt: flag.resolved_at,
          resolutionNote: flag.resolution_note,
        } as FlagInboxData,
      });
    }

    // Map shift reports
    for (const report of shiftData ?? []) {
      merged.push({
        id: report.id,
        type: "shift_note",
        createdAt: report.created_at,
        isRead: readSet.has(`shift_note:${report.id}`),
        data: {
          type: "shift_note",
          reportId: report.id,
          reportDate: report.report_date,
          shiftType: report.shift_type,
          staffName: report.staff_name,
          managementNotes: report.management_notes,
          status: report.status,
        } as ShiftNoteInboxData,
      });
    }

    // Map sick day requests
    for (const sickDay of sickDayData ?? []) {
      merged.push({
        id: sickDay.id,
        type: "sick_day",
        createdAt: sickDay.created_at,
        isRead: readSet.has(`sick_day:${sickDay.id}`),
        data: {
          type: "sick_day",
          userId: sickDay.user_id,
          userName: sickDay.user_name,
          requestedDates: sickDay.requested_dates,
          notes: sickDay.notes,
          status: sickDay.status,
          reviewedByName: sickDay.reviewed_by_name,
          reviewedAt: sickDay.reviewed_at,
          reviewNotes: sickDay.review_notes,
        } as SickDayInboxData,
      });
    }

    // Sort by createdAt DESC
    merged.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Filter by search term
    if (searchTerm && searchTerm.trim().length >= 2) {
      const q = searchTerm.toLowerCase();
      return merged.filter((item) => {
        switch (item.data.type) {
          case "qa":
            return (
              item.data.question.toLowerCase().includes(q) ||
              (item.data.context ?? "").toLowerCase().includes(q) ||
              item.data.askedByName.toLowerCase().includes(q)
            );
          case "flag":
            return (
              item.data.note.toLowerCase().includes(q) ||
              item.data.resourceLabel.toLowerCase().includes(q) ||
              item.data.flaggedByName.toLowerCase().includes(q)
            );
          case "shift_note":
            return (
              item.data.managementNotes.toLowerCase().includes(q) ||
              item.data.staffName.toLowerCase().includes(q)
            );
          case "sick_day":
            return (
              item.data.userName.toLowerCase().includes(q) ||
              item.data.notes.toLowerCase().includes(q) ||
              item.data.status.toLowerCase().includes(q)
            );
        }
      });
    }

    return merged;
  }, [qaData, flagData, shiftData, sickDayData, readsData, searchTerm]);

  return {
    items,
    isLoading: qaLoading || flagsLoading || shiftLoading || sickDayLoading || readsLoading,
  };
}

// ---------------------------------------------------------------------------
// Hook 2: useUnreadInboxCount
// Returns the count of unread inbox items for the sidebar badge.
// ---------------------------------------------------------------------------

export function useUnreadInboxCount() {
  const { user } = useAuthContext();
  const { data: roles } = useUserRoles(user?.id);

  const isManagerOrAdmin = (roles ?? []).some(
    (r) => r.role === "admin" || r.role === "manager"
  );

  return useQuery({
    queryKey: [INBOX_UNREAD_COUNT_KEY, user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      // Fetch all item IDs from 3 sources
      const [qaResult, flagResult, shiftResult, sickDayResult, readsResult] =
        await Promise.all([
          supabase.from("staff_qa").select("id"),
          supabase
            .from("resource_outdated_flags")
            .select("id"),
          supabase
            .from("daily_report_history")
            .select("id")
            .not("management_notes", "is", null)
            .neq("management_notes", "")
            .eq("status", "submitted"),
          supabase
            .from("sick_day_requests")
            .select("id"),
          supabase
            .from("inbox_reads")
            .select("item_type, item_id")
            .eq("user_id", user.id),
        ]);

      if (qaResult.error) throw qaResult.error;
      if (flagResult.error) throw flagResult.error;
      if (shiftResult.error) throw shiftResult.error;
      if (sickDayResult.error) throw sickDayResult.error;
      if (readsResult.error) throw readsResult.error;

      const readSet = new Set(
        ((readsResult.data ?? []) as unknown as { item_type: string; item_id: string }[]).map(
          (r) => `${r.item_type}:${r.item_id}`
        )
      );

      let unread = 0;
      for (const qa of qaResult.data ?? []) {
        if (!readSet.has(`qa:${qa.id}`)) unread++;
      }
      for (const flag of (flagResult.data ?? []) as unknown as { id: string }[]) {
        if (!readSet.has(`flag:${flag.id}`)) unread++;
      }
      for (const report of shiftResult.data ?? []) {
        if (!readSet.has(`shift_note:${report.id}`)) unread++;
      }
      for (const sickDay of sickDayResult.data ?? []) {
        if (!readSet.has(`sick_day:${sickDay.id}`)) unread++;
      }

      return unread;
    },
    enabled: !!user?.id && isManagerOrAdmin,
    // This query runs 5 parallel DB calls on each fetch; staleTime prevents
    // unnecessary re-fetches on navigation. Cache is invalidated by mutations.
    staleTime: 60_000,
  });
}

// ---------------------------------------------------------------------------
// Hook 3: useMarkInboxRead
// Mutation to mark an inbox item as read.
// ---------------------------------------------------------------------------

export function useMarkInboxRead() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async ({
      itemType,
      itemId,
    }: {
      itemType: InboxItemType;
      itemId: string;
    }) => {
      if (!user?.id) return;

      const { error } = await supabase.from("inbox_reads").upsert(
        {
          user_id: user.id,
          item_type: itemType,
          item_id: itemId,
          read_at: new Date().toISOString(),
        },
        { onConflict: "user_id,item_type,item_id" }
      );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INBOX_READS_KEY] });
      queryClient.invalidateQueries({ queryKey: [INBOX_UNREAD_COUNT_KEY] });
    },
  });
}

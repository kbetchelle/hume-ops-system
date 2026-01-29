import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ActivityLog {
  id: string;
  member_id: string;
  activity_type: "visit" | "class_attendance" | "booking" | "purchase";
  activity_date: string;
  details: Record<string, unknown>;
  source: string;
  created_at: string;
}

export interface MemberActivitySummary {
  member_id: string;
  member_name: string;
  member_email: string;
  membership_tier: string | null;
  total_visits: number;
  total_classes: number;
  last_visit: string | null;
  join_date: string | null;
}

export function useActivityLogs(filters?: {
  startDate?: string;
  endDate?: string;
  activityType?: string;
  memberId?: string;
}) {
  return useQuery({
    queryKey: ["activityLogs", filters],
    queryFn: async () => {
      let query = supabase
        .from("activity_logs")
        .select("*, arketa_clients(full_name, email)")
        .order("activity_date", { ascending: false });

      if (filters?.startDate) {
        query = query.gte("activity_date", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("activity_date", filters.endDate);
      }
      if (filters?.activityType && filters.activityType !== "all") {
        query = query.eq("activity_type", filters.activityType);
      }
      if (filters?.memberId) {
        query = query.eq("member_id", filters.memberId);
      }

      const { data, error } = await query.limit(500);
      if (error) throw error;
      return data;
    },
  });
}

export function useMemberActivitySummary(filters?: {
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ["memberActivitySummary", filters],
    queryFn: async () => {
      // Get all clients
      const { data: clients, error: clientsError } = await supabase
        .from("arketa_clients")
        .select("id, full_name, email, membership_tier, join_date")
        .order("full_name");

      if (clientsError) throw clientsError;

      // Get activity counts
      let activityQuery = supabase
        .from("activity_logs")
        .select("member_id, activity_type, activity_date");

      if (filters?.startDate) {
        activityQuery = activityQuery.gte("activity_date", filters.startDate);
      }
      if (filters?.endDate) {
        activityQuery = activityQuery.lte("activity_date", filters.endDate);
      }

      const { data: activities, error: activitiesError } = await activityQuery;
      if (activitiesError) throw activitiesError;

      // Aggregate activity data
      const activityMap = new Map<
        string,
        { visits: number; classes: number; lastVisit: string | null }
      >();

      (activities || []).forEach((activity) => {
        const existing = activityMap.get(activity.member_id) || {
          visits: 0,
          classes: 0,
          lastVisit: null,
        };

        if (activity.activity_type === "visit") {
          existing.visits++;
        } else if (activity.activity_type === "class_attendance") {
          existing.classes++;
        }

        if (
          !existing.lastVisit ||
          new Date(activity.activity_date) > new Date(existing.lastVisit)
        ) {
          existing.lastVisit = activity.activity_date;
        }

        activityMap.set(activity.member_id, existing);
      });

      // Combine data
      const summaries: MemberActivitySummary[] = (clients || []).map((client) => {
        const activity = activityMap.get(client.id) || {
          visits: 0,
          classes: 0,
          lastVisit: null,
        };

        return {
          member_id: client.id,
          member_name: client.full_name || "Unknown",
          member_email: client.email,
          membership_tier: client.membership_tier,
          total_visits: activity.visits,
          total_classes: activity.classes,
          last_visit: activity.lastVisit,
          join_date: client.join_date,
        };
      });

      return summaries;
    },
  });
}

export function useNewSignups(filters?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ["newSignups", filters],
    queryFn: async () => {
      let query = supabase
        .from("arketa_clients")
        .select("*")
        .order("join_date", { ascending: false });

      if (filters?.startDate) {
        query = query.gte("join_date", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("join_date", filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useMemberRetention(filters?: {
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ["memberRetention", filters],
    queryFn: async () => {
      // Get all clients
      const { data: clients, error: clientsError } = await supabase
        .from("arketa_clients")
        .select("id, full_name, email, membership_tier, join_date");

      if (clientsError) throw clientsError;

      // Get activity in date range
      let query = supabase.from("activity_logs").select("member_id");

      if (filters?.startDate) {
        query = query.gte("activity_date", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("activity_date", filters.endDate);
      }

      const { data: activities, error: activitiesError } = await query;
      if (activitiesError) throw activitiesError;

      const activeMemberIds = new Set(
        (activities || []).map((a) => a.member_id)
      );

      const totalMembers = (clients || []).length;
      const activeMembers = (clients || []).filter((m) =>
        activeMemberIds.has(m.id)
      ).length;
      const inactiveMembers = totalMembers - activeMembers;
      const retentionRate =
        totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 0;

      return {
        totalMembers,
        activeMembers,
        inactiveMembers,
        retentionRate: retentionRate.toFixed(1),
        activeMembersList: (clients || []).filter((m) =>
          activeMemberIds.has(m.id)
        ),
        inactiveMembersList: (clients || []).filter(
          (m) => !activeMemberIds.has(m.id)
        ),
      };
    },
  });
}

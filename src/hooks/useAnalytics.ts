import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, parseISO } from "date-fns";

export interface DateRange {
  start: Date;
  end: Date;
}

export interface MemberGrowthData {
  month: string;
  totalMembers: number;
  newMembers: number;
}

export interface TrainerMetrics {
  trainerId: string;
  trainerName: string;
  totalClients: number;
  activePlans: number;
  templatesCreated: number;
  avgClientRetention: number;
}

export interface LocationMetrics {
  location: string;
  totalVisits: number;
  uniqueMembers: number;
  avgVisitsPerMember: number;
}

export function useAnalytics(dateRange: DateRange, viewType: "all" | "trainer" | "location", selectedId?: string) {
  const { user } = useAuthContext();

  const startDate = format(dateRange.start, "yyyy-MM-dd");
  const endDate = format(dateRange.end, "yyyy-MM-dd");

  // Fetch members data
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["analytics-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("id, join_date, membership_tier, created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Fetch activity logs
  const { data: activityLogs, isLoading: activityLoading } = useQuery({
    queryKey: ["analytics-activity", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("id, member_id, activity_type, activity_date, details")
        .gte("activity_date", startDate)
        .lte("activity_date", endDate);
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Fetch trainer assignments
  const { data: trainerAssignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ["analytics-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trainer_assignments")
        .select("id, trainer_user_id, member_id, assignment_type, created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Fetch training plans
  const { data: trainingPlans, isLoading: plansLoading } = useQuery({
    queryKey: ["analytics-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_plans")
        .select("id, trainer_user_id, member_id, is_template, created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Fetch trainer profiles
  const { data: trainerProfiles, isLoading: profilesLoading } = useQuery({
    queryKey: ["analytics-trainers"],
    queryFn: async () => {
      // Get all users with trainer role
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "trainer");
      if (rolesError) throw rolesError;

      const trainerIds = roles.map(r => r.user_id);
      if (trainerIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", trainerIds);
      if (profilesError) throw profilesError;

      return profiles;
    },
    enabled: !!user
  });

  const isLoading = membersLoading || activityLoading || assignmentsLoading || plansLoading || profilesLoading;

  // Calculate member growth over time
  const getMemberGrowth = (): MemberGrowthData[] => {
    if (!members) return [];

    const months = eachMonthOfInterval({
      start: dateRange.start,
      end: dateRange.end
    });

    let cumulativeTotal = members.filter(m => {
      const joinDate = m.join_date ? parseISO(m.join_date) : parseISO(m.created_at);
      return joinDate < dateRange.start;
    }).length;

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const newThisMonth = members.filter(m => {
        const joinDate = m.join_date ? parseISO(m.join_date) : parseISO(m.created_at);
        return joinDate >= monthStart && joinDate <= monthEnd;
      }).length;

      cumulativeTotal += newThisMonth;

      return {
        month: format(month, "MMM yyyy"),
        totalMembers: cumulativeTotal,
        newMembers: newThisMonth
      };
    });
  };

  // Calculate trainer performance metrics
  const getTrainerMetrics = (): TrainerMetrics[] => {
    if (!trainerProfiles || !trainerAssignments || !trainingPlans) return [];

    return trainerProfiles.map(trainer => {
      const assignments = trainerAssignments.filter(a => a.trainer_user_id === trainer.user_id);
      const plans = trainingPlans.filter(p => p.trainer_user_id === trainer.user_id);
      
      const totalClients = assignments.length;
      const activePlans = plans.filter(p => !p.is_template && p.member_id).length;
      const templatesCreated = plans.filter(p => p.is_template).length;
      
      // Simple retention calculation: clients with plans / total clients
      const clientsWithPlans = new Set(plans.filter(p => p.member_id).map(p => p.member_id)).size;
      const avgClientRetention = totalClients > 0 ? (clientsWithPlans / totalClients) * 100 : 0;

      return {
        trainerId: trainer.user_id,
        trainerName: trainer.full_name || trainer.email,
        totalClients,
        activePlans,
        templatesCreated,
        avgClientRetention: Math.round(avgClientRetention)
      };
    });
  };

  // Calculate location metrics from activity logs
  const getLocationMetrics = (): LocationMetrics[] => {
    if (!activityLogs) return [];

    const locationMap = new Map<string, { visits: number; members: Set<string> }>();

    activityLogs.forEach(log => {
      // Extract location from details if available
      const details = log.details as { location?: string } | null;
      const location = details?.location || "Main Facility";
      
      if (!locationMap.has(location)) {
        locationMap.set(location, { visits: 0, members: new Set() });
      }
      
      const data = locationMap.get(location)!;
      data.visits++;
      if (log.member_id) {
        data.members.add(log.member_id);
      }
    });

    return Array.from(locationMap.entries()).map(([location, data]) => ({
      location,
      totalVisits: data.visits,
      uniqueMembers: data.members.size,
      avgVisitsPerMember: data.members.size > 0 ? Math.round(data.visits / data.members.size * 10) / 10 : 0
    })).sort((a, b) => b.totalVisits - a.totalVisits);
  };

  // Get summary stats
  const getSummaryStats = () => {
    const totalMembers = members?.length || 0;
    const totalTrainers = trainerProfiles?.length || 0;
    const totalAssignments = trainerAssignments?.length || 0;
    const totalActivities = activityLogs?.length || 0;

    // Calculate growth rate
    const growthData = getMemberGrowth();
    let growthRate = 0;
    if (growthData.length >= 2) {
      const firstMonth = growthData[0].totalMembers;
      const lastMonth = growthData[growthData.length - 1].totalMembers;
      growthRate = firstMonth > 0 ? ((lastMonth - firstMonth) / firstMonth) * 100 : 0;
    }

    // Get new members in period
    const newMembersInPeriod = growthData.reduce((sum, d) => sum + d.newMembers, 0);

    return {
      totalMembers,
      totalTrainers,
      totalAssignments,
      totalActivities,
      growthRate: Math.round(growthRate),
      newMembersInPeriod
    };
  };

  // Get unique locations for filter
  const getLocations = (): string[] => {
    if (!activityLogs) return [];
    
    const locations = new Set<string>();
    activityLogs.forEach(log => {
      const details = log.details as { location?: string } | null;
      locations.add(details?.location || "Main Facility");
    });
    
    return Array.from(locations).sort();
  };

  // Get trainers for filter
  const getTrainers = () => {
    return trainerProfiles?.map(t => ({
      id: t.user_id,
      name: t.full_name || t.email
    })) || [];
  };

  return {
    isLoading,
    getMemberGrowth,
    getTrainerMetrics,
    getLocationMetrics,
    getSummaryStats,
    getLocations,
    getTrainers
  };
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface TrainerAssignment {
  id: string;
  trainer_user_id: string;
  member_id: string;
  assignment_type: string;
  assigned_by: string;
  notes: string | null;
  created_at: string;
  arketa_clients?: {
    id: string;
    full_name: string | null;
    email: string;
    membership_tier: string | null;
  };
  // Alias for backward compatibility
  members?: {
    id: string;
    full_name: string | null;
    email: string;
    membership_tier: string | null;
  };
}

export interface TrainerWithWorkload {
  user_id: string;
  email: string;
  full_name: string | null;
  assignment_count: number;
}

export function useTrainerAssignments(trainerId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch assignments - optionally filtered by trainer
  const assignmentsQuery = useQuery({
    queryKey: ["trainer-assignments", trainerId],
    queryFn: async () => {
      let query = supabase
        .from("trainer_assignments")
        .select(`
          *,
          arketa_clients (id, full_name, email, membership_tier)
        `)
        .order("created_at", { ascending: false });

      if (trainerId) {
        query = query.eq("trainer_user_id", trainerId);
      }

      const { data, error } = await query;
      if (error) throw error;
      // Map arketa_clients to members for backward compatibility
      return (data || []).map(item => ({
        ...item,
        members: item.arketa_clients
      })) as TrainerAssignment[];
    },
  });

  // Fetch all trainers with their workload counts
  const trainersQuery = useQuery({
    queryKey: ["trainers-with-workload"],
    queryFn: async () => {
      // First get all users with trainer role
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, email, full_name")
        .eq("deactivated", false);

      if (profilesError) throw profilesError;

      // Get trainer roles
      const { data: trainerRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "trainer");

      if (rolesError) throw rolesError;

      const trainerUserIds = trainerRoles.map((r) => r.user_id);

      // Get assignment counts
      const { data: assignments, error: assignmentsError } = await supabase
        .from("trainer_assignments")
        .select("trainer_user_id");

      if (assignmentsError) throw assignmentsError;

      // Count assignments per trainer
      const assignmentCounts: Record<string, number> = {};
      assignments.forEach((a) => {
        assignmentCounts[a.trainer_user_id] = (assignmentCounts[a.trainer_user_id] || 0) + 1;
      });

      // Combine data
      const trainersWithWorkload: TrainerWithWorkload[] = profiles
        .filter((p) => trainerUserIds.includes(p.user_id))
        .map((p) => ({
          user_id: p.user_id,
          email: p.email,
          full_name: p.full_name,
          assignment_count: assignmentCounts[p.user_id] || 0,
        }))
        .sort((a, b) => (a.full_name || a.email).localeCompare(b.full_name || b.email));

      return trainersWithWorkload;
    },
  });

  // Assign member to trainer
  const assignMutation = useMutation({
    mutationFn: async ({
      trainerId,
      memberId,
      notes,
    }: {
      trainerId: string;
      memberId: string;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("trainer_assignments")
        .insert({
          trainer_user_id: trainerId,
          member_id: memberId,
          assigned_by: user.id,
          assignment_type: "manual",
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainer-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["trainers-with-workload"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast({ title: "Member assigned successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to assign member",
        description: error.message.includes("duplicate")
          ? "This member is already assigned to this trainer"
          : error.message,
        variant: "destructive",
      });
    },
  });

  // Unassign member from trainer
  const unassignMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from("trainer_assignments")
        .delete()
        .eq("id", assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainer-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["trainers-with-workload"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast({ title: "Member unassigned successfully" });
    },
    onError: (error) => {
      toast({
        title: "Failed to unassign member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get member's current trainer assignment
  const getMemberTrainer = (memberId: string) => {
    return assignmentsQuery.data?.find((a) => a.member_id === memberId);
  };

  return {
    assignments: assignmentsQuery.data ?? [],
    trainers: trainersQuery.data ?? [],
    isLoading: assignmentsQuery.isLoading || trainersQuery.isLoading,
    assignMember: assignMutation.mutateAsync,
    unassignMember: unassignMutation.mutateAsync,
    isAssigning: assignMutation.isPending,
    isUnassigning: unassignMutation.isPending,
    getMemberTrainer,
    refetch: () => {
      assignmentsQuery.refetch();
      trainersQuery.refetch();
    },
  };
}

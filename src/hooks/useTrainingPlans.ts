import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface TrainingPlanContent {
  id: string;
  training_plan_id: string;
  section_title: string;
  content_type: "workout" | "nutrition" | "notes";
  content: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TrainingPlan {
  id: string;
  title: string;
  description: string | null;
  member_id: string | null;
  trainer_user_id: string;
  share_slug: string;
  is_public: boolean;
  is_template: boolean;
  plan_type: "workout" | "nutrition" | "combined";
  created_at: string;
  updated_at: string;
  members?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
  training_plan_content?: TrainingPlanContent[];
}

export interface CreatePlanInput {
  title: string;
  description?: string;
  member_id?: string | null;
  is_template?: boolean;
  plan_type?: "workout" | "nutrition" | "combined";
}

export interface CreateContentInput {
  training_plan_id: string;
  section_title: string;
  content_type: "workout" | "nutrition" | "notes";
  content: string;
  sort_order?: number;
}

export function useTrainingPlans(memberId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const plansQuery = useQuery({
    queryKey: ["training-plans", memberId],
    queryFn: async () => {
      let query = supabase
        .from("training_plans")
        .select(`
          *,
          arketa_clients (id, full_name, email),
          training_plan_content (*)
        `)
        .order("created_at", { ascending: false });

      if (memberId) {
        query = query.eq("member_id", memberId);
      }

      const { data, error } = await query;
      if (error) throw error;
      // Map arketa_clients to members for backward compatibility
      return (data || []).map(item => ({
        ...item,
        members: item.arketa_clients
      })) as unknown as TrainingPlan[];
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: async (input: CreatePlanInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("training_plans")
        .insert({
          title: input.title,
          description: input.description || null,
          member_id: input.member_id || null,
          trainer_user_id: user.id,
          is_template: input.is_template || false,
          plan_type: input.plan_type || "workout",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-plans"] });
      toast({ title: "Plan created successfully" });
    },
    onError: (error) => {
      toast({
        title: "Failed to create plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TrainingPlan> & { id: string }) => {
      const { data, error } = await supabase
        .from("training_plans")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-plans"] });
      toast({ title: "Plan updated successfully" });
    },
    onError: (error) => {
      toast({
        title: "Failed to update plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("training_plans")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-plans"] });
      toast({ title: "Plan deleted successfully" });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const togglePublicMutation = useMutation({
    mutationFn: async ({ id, is_public }: { id: string; is_public: boolean }) => {
      const { data, error } = await supabase
        .from("training_plans")
        .update({ is_public })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["training-plans"] });
      toast({
        title: data.is_public ? "Link is now public" : "Link is now private",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update sharing",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const duplicatePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch original plan with content
      const { data: original, error: fetchError } = await supabase
        .from("training_plans")
        .select("*, training_plan_content (*)")
        .eq("id", planId)
        .single();

      if (fetchError) throw fetchError;

      // Create new plan
      const { data: newPlan, error: planError } = await supabase
        .from("training_plans")
        .insert({
          title: `${original.title} (Copy)`,
          description: original.description,
          member_id: null, // Don't copy member assignment
          trainer_user_id: user.id,
          is_template: false,
          plan_type: original.plan_type,
        })
        .select()
        .single();

      if (planError) throw planError;

      // Copy content sections
      if (original.training_plan_content && original.training_plan_content.length > 0) {
        const contentToCopy = original.training_plan_content.map((c: TrainingPlanContent) => ({
          training_plan_id: newPlan.id,
          section_title: c.section_title,
          content_type: c.content_type,
          content: c.content,
          sort_order: c.sort_order,
        }));

        const { error: contentError } = await supabase
          .from("training_plan_content")
          .insert(contentToCopy);

        if (contentError) throw contentError;
      }

      return newPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-plans"] });
      toast({ title: "Plan duplicated successfully" });
    },
    onError: (error) => {
      toast({
        title: "Failed to duplicate plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Content mutations
  const addContentMutation = useMutation({
    mutationFn: async (input: CreateContentInput) => {
      const { data, error } = await supabase
        .from("training_plan_content")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-plans"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to add content",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateContentMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TrainingPlanContent> & { id: string }) => {
      const { data, error } = await supabase
        .from("training_plan_content")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-plans"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update content",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteContentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("training_plan_content")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-plans"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete content",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    plans: plansQuery.data ?? [],
    isLoading: plansQuery.isLoading,
    error: plansQuery.error,
    createPlan: createPlanMutation.mutateAsync,
    updatePlan: updatePlanMutation.mutateAsync,
    deletePlan: deletePlanMutation.mutateAsync,
    togglePublic: togglePublicMutation.mutateAsync,
    duplicatePlan: duplicatePlanMutation.mutateAsync,
    addContent: addContentMutation.mutateAsync,
    updateContent: updateContentMutation.mutateAsync,
    deleteContent: deleteContentMutation.mutateAsync,
    isCreating: createPlanMutation.isPending,
    isUpdating: updatePlanMutation.isPending,
  };
}

// Hook for fetching a single plan by share slug (public access)
export function usePublicPlan(shareSlug: string | undefined) {
  return useQuery({
    queryKey: ["public-plan", shareSlug],
    queryFn: async () => {
      if (!shareSlug) return null;

      const { data, error } = await supabase
        .from("training_plans")
        .select(`
          *,
          training_plan_content (*)
        `)
        .eq("share_slug", shareSlug)
        .eq("is_public", true)
        .single();

      if (error) throw error;
      return data as TrainingPlan;
    },
    enabled: !!shareSlug,
  });
}

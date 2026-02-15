import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { toast } from "sonner";

export interface ClubPolicy {
  id: string;
  content: string;
  category: string | null;
  tags: string[];
  is_active: boolean;
  last_updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PolicyCategory {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePolicyInput {
  content: string;
  category: string | null;
  tags?: string[];
}

export interface UpdatePolicyInput extends CreatePolicyInput {
  id: string;
}

export interface CreateCategoryInput {
  name: string;
  description?: string | null;
}

export interface UpdateCategoryInput {
  id: string;
  name: string;
  description?: string | null;
}

const POLICIES_KEY = "club-policies";
const POLICY_CATEGORIES_KEY = "policy-categories";

/**
 * Fetch all active policies (for managers; includes soft-deleted for list if needed).
 * For PolicyManagement we want to show all and filter by is_active in UI, or only active.
 */
export function usePolicies(activeOnly = true) {
  return useQuery({
    queryKey: [POLICIES_KEY, activeOnly],
    queryFn: async () => {
      let query = supabase
        .from("club_policies")
        .select("*")
        .order("updated_at", { ascending: false });

      if (activeOnly) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as ClubPolicy[];
    },
  });
}

/**
 * Fetch active policy categories.
 */
export function usePolicyCategories(activeOnly = true) {
  return useQuery({
    queryKey: [POLICY_CATEGORIES_KEY, activeOnly],
    queryFn: async () => {
      let query = supabase
        .from("policy_categories")
        .select("*")
        .order("name", { ascending: true });

      if (activeOnly) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as PolicyCategory[];
    },
  });
}

/**
 * Create a new policy.
 */
export function useCreatePolicy() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (input: CreatePolicyInput) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user!.id)
        .single();

      const lastUpdatedBy = profile?.full_name ?? user?.email ?? "Manager";

      const { data, error } = await (supabase.from("club_policies") as any)
        .insert({
          title: input.category ?? "Untitled",
          content: input.content,
          category: input.category,
          is_active: true,
          last_updated_by: lastUpdatedBy,
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as ClubPolicy;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POLICIES_KEY] });
      toast.success("Policy section created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create policy section: " + error.message);
    },
  });
}

/**
 * Update an existing policy.
 */
export function useUpdatePolicy() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (input: UpdatePolicyInput) => {
      const { id, ...rest } = input;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user!.id)
        .single();

      const lastUpdatedBy = profile?.full_name ?? user?.email ?? "Manager";

      const { data, error } = await (supabase.from("club_policies") as any)
        .update({
          title: rest.category ?? "Untitled",
          content: rest.content,
          category: rest.category,
          last_updated_by: lastUpdatedBy,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as ClubPolicy;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POLICIES_KEY] });
      toast.success("Policy section updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update policy section: " + error.message);
    },
  });
}

/**
 * Soft delete a policy (set is_active = false).
 */
export function useDeletePolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("club_policies")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POLICIES_KEY] });
      toast.success("Policy section deleted");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete policy section: " + error.message);
    },
  });
}

/**
 * Create a new policy category.
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCategoryInput) => {
      const { data, error } = await supabase
        .from("policy_categories")
        .insert({
          name: input.name,
          description: input.description ?? null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as PolicyCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POLICY_CATEGORIES_KEY] });
      toast.success("Category created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create category: " + error.message);
    },
  });
}

/**
 * Update an existing policy category.
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateCategoryInput) => {
      const { id, ...rest } = input;
      const { data, error } = await supabase
        .from("policy_categories")
        .update(rest)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as PolicyCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POLICY_CATEGORIES_KEY] });
      toast.success("Category updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update category: " + error.message);
    },
  });
}

/**
 * Soft delete a category (set is_active = false).
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("policy_categories")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [POLICY_CATEGORIES_KEY] });
      queryClient.invalidateQueries({ queryKey: [POLICIES_KEY] });
      toast.success("Category deleted");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete category: " + error.message);
    },
  });
}

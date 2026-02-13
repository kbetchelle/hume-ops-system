import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ResourceType =
  | "quick_link_group"
  | "quick_link_item"
  | "resource_page"
  | "club_policy";

export interface ResourceFlag {
  id: string;
  resource_id: string;
  flagged_by_name: string;
  note: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Query key prefixes
// ---------------------------------------------------------------------------

const RESOURCE_FLAGS_KEY = "resource-flags";
const RESOURCE_FLAGS_BATCH_KEY = "resource-flags-batch";
const RESOURCE_FLAGS_PENDING_COUNT_KEY = "resource-flags-pending-count";

// ---------------------------------------------------------------------------
// Hook 1: useActiveResourceFlags
// Batch query to check which resources have pending flags.
// Used by resource tab components to show "Under Review" badges.
// ---------------------------------------------------------------------------

export function useActiveResourceFlags(
  resourceType: ResourceType,
  resourceIds: string[]
) {
  return useQuery({
    queryKey: [RESOURCE_FLAGS_BATCH_KEY, resourceType, ...resourceIds.sort()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resource_outdated_flags" as any)
        .select("id, resource_id, flagged_by_name, note, created_at")
        .eq("resource_type", resourceType)
        .in("resource_id", resourceIds)
        .eq("status", "pending");

      if (error) throw error;

      const map = new Map<string, ResourceFlag[]>();
      for (const row of (data ?? []) as unknown as ResourceFlag[]) {
        const existing = map.get(row.resource_id) ?? [];
        existing.push(row);
        map.set(row.resource_id, existing);
      }
      return map;
    },
    enabled: resourceIds.length > 0,
  });
}

// ---------------------------------------------------------------------------
// Hook 2: useCreateResourceFlag
// Mutation to create a new outdated flag.
// ---------------------------------------------------------------------------

interface CreateFlagInput {
  resourceType: ResourceType;
  resourceId: string;
  resourceLabel: string;
  note: string;
}

export function useCreateResourceFlag() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (input: CreateFlagInput) => {
      if (!user?.id) throw new Error("Not authenticated");

      const displayName =
        user.user_metadata?.full_name || user.email || "Unknown";

      const { data, error } = await supabase
        .from("resource_outdated_flags" as any)
        .insert({
          resource_type: input.resourceType,
          resource_id: input.resourceId,
          resource_label: input.resourceLabel,
          flagged_by_id: user.id,
          flagged_by_name: displayName,
          note: input.note,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RESOURCE_FLAGS_KEY] });
      queryClient.invalidateQueries({ queryKey: [RESOURCE_FLAGS_BATCH_KEY] });
      queryClient.invalidateQueries({
        queryKey: [RESOURCE_FLAGS_PENDING_COUNT_KEY],
      });
      queryClient.invalidateQueries({ queryKey: ["inbox-items"] });
      queryClient.invalidateQueries({ queryKey: ["inbox-unread-count"] });
      toast.success("Flagged as potentially outdated");
    },
    onError: (error: Error) => {
      toast.error("Failed to flag resource: " + error.message);
    },
  });
}

// ---------------------------------------------------------------------------
// Hook 3: useResolveResourceFlag
// Mutation to resolve or dismiss a flag (manager only).
// ---------------------------------------------------------------------------

interface ResolveFlagInput {
  flagId: string;
  status: "dismissed" | "resolved";
  resolutionNote?: string;
}

export function useResolveResourceFlag() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (input: ResolveFlagInput) => {
      if (!user?.id) throw new Error("Not authenticated");

      const displayName =
        user.user_metadata?.full_name || user.email || "Unknown";

      const { data, error } = await supabase
        .from("resource_outdated_flags" as any)
        .update({
          status: input.status,
          resolved_by_id: user.id,
          resolved_by_name: displayName,
          resolved_at: new Date().toISOString(),
          resolution_note: input.resolutionNote ?? null,
        })
        .eq("id", input.flagId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [RESOURCE_FLAGS_KEY] });
      queryClient.invalidateQueries({ queryKey: [RESOURCE_FLAGS_BATCH_KEY] });
      queryClient.invalidateQueries({
        queryKey: [RESOURCE_FLAGS_PENDING_COUNT_KEY],
      });
      queryClient.invalidateQueries({ queryKey: ["inbox-items"] });
      queryClient.invalidateQueries({ queryKey: ["inbox-unread-count"] });
      toast.success(
        variables.status === "dismissed" ? "Flag dismissed" : "Flag resolved"
      );
    },
    onError: (error: Error) => {
      toast.error("Failed to update flag: " + error.message);
    },
  });
}

// ---------------------------------------------------------------------------
// Hook 4: usePendingFlagCount
// Simple count of pending flags for badge display.
// ---------------------------------------------------------------------------

export function usePendingFlagCount() {
  return useQuery({
    queryKey: [RESOURCE_FLAGS_PENDING_COUNT_KEY],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("resource_outdated_flags" as any)
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");

      if (error) throw error;
      return count ?? 0;
    },
  });
}

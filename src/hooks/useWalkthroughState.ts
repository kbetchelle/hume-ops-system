import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WalkthroughState {
  id: string;
  user_id: string;
  completed_at: string | null;
  skipped_at: string | null;
  viewed_page_hints: string[];
  created_at: string;
  updated_at: string;
}

const WALKTHROUGH_STATE_QUERY_KEY = "walkthrough-state";

// ---------------------------------------------------------------------------
// State query
// ---------------------------------------------------------------------------

/**
 * Fetches the current user's walkthrough state. Returns null if no row exists
 * (user has not started/skipped/completed or viewed any hint yet).
 */
export function useWalkthroughState() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [WALKTHROUGH_STATE_QUERY_KEY, user?.id],
    queryFn: async (): Promise<WalkthroughState | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("user_walkthrough_state" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as WalkthroughState | null;
    },
    enabled: !!user?.id,
  });
}

// ---------------------------------------------------------------------------
// Derived: needs walkthrough
// ---------------------------------------------------------------------------

/**
 * True when the user has not yet completed or skipped the walkthrough
 * (suitable for showing the walkthrough on first dashboard landing).
 */
export function useNeedsWalkthrough(): boolean {
  const { data: state, isLoading } = useWalkthroughState();

  if (isLoading || state === undefined) return false;
  // No row or both completed_at and skipped_at null => needs walkthrough
  if (!state) return true;
  return state.completed_at == null && state.skipped_at == null;
}

// ---------------------------------------------------------------------------
// Mutations: complete / skip
// ---------------------------------------------------------------------------

export function useMarkWalkthroughCompleted() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_walkthrough_state" as any)
        .upsert(
          {
            user_id: user.id,
            completed_at: new Date().toISOString(),
            skipped_at: null,
          },
          { onConflict: "user_id" }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WALKTHROUGH_STATE_QUERY_KEY] });
    },
  });
}

export function useMarkWalkthroughSkipped() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_walkthrough_state" as any)
        .upsert(
          {
            user_id: user.id,
            completed_at: null,
            skipped_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WALKTHROUGH_STATE_QUERY_KEY] });
    },
  });
}

// ---------------------------------------------------------------------------
// Page hints: check and mark viewed
// ---------------------------------------------------------------------------

/**
 * Returns true if the given page hint has been viewed by the current user.
 */
export function useHasViewedPageHint(hintId: string | undefined): boolean {
  const { data: state } = useWalkthroughState();

  if (!hintId || !state?.viewed_page_hints) return false;
  return state.viewed_page_hints.includes(hintId);
}

export function useMarkPageHintViewed() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (hintId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await (supabase.rpc as any)("walkthrough_mark_hint_viewed", {
        _hint_id: hintId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WALKTHROUGH_STATE_QUERY_KEY] });
    },
  });
}

// ---------------------------------------------------------------------------
// Reset (for "Show App Guide" replay)
// ---------------------------------------------------------------------------

/**
 * Resets only completion state so the full walkthrough overlay can show again.
 * Does NOT clear viewed_page_hints, so idle page hints stay "already seen."
 */
export function useResetWalkthroughForReplay() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_walkthrough_state" as any)
        .update({
          completed_at: null,
          skipped_at: null,
        })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WALKTHROUGH_STATE_QUERY_KEY] });
    },
  });
}

export function useResetWalkthroughState() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_walkthrough_state" as any)
        .update({
          completed_at: null,
          skipped_at: null,
          viewed_page_hints: [],
        })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WALKTHROUGH_STATE_QUERY_KEY] });
    },
  });
}

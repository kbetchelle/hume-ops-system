import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  useMarkPageHintViewed,
  useResetWalkthroughForReplay,
  useWalkthroughState,
} from "@/hooks/useWalkthroughState";

const DEFAULT_IDLE_MS = 90_000;
const ACTIVITY_THROTTLE_MS = 1_000;

export interface UseIdlePageHintOptions {
  /** Stable id for this page (e.g. route slug). Used for viewed_page_hints tracking. */
  hintId: string;
  /** Page-specific tip text shown in the hint prompt. */
  content: string;
  /** Idle time before showing the hint. Default 90_000 (90 seconds). */
  idleMs?: number;
}

export interface UseIdlePageHintResult {
  /** True when the idle timer has fired and the hint should be shown. */
  showHint: boolean;
  /** Call when the user dismisses the prompt. Marks hint viewed and hides it. */
  dismiss: () => void;
  /** Call when the user clicks "See full walkthrough". Marks hint viewed and triggers overlay. */
  triggerFullWalkthrough: () => void;
}

/**
 * Opt-in idle page hint: after idleMs of no mouse/click/keyboard activity,
 * showHint becomes true. Uses walkthrough state so each page's hint is shown at most once.
 */
export function useIdlePageHint({
  hintId,
  content: _content,
  idleMs = DEFAULT_IDLE_MS,
}: UseIdlePageHintOptions): UseIdlePageHintResult {
  const { user } = useAuth();
  const { data: walkthroughState, isLoading: walkthroughStateLoading } = useWalkthroughState();
  const hasViewed =
    !!walkthroughState?.viewed_page_hints?.includes(hintId);
  const markViewed = useMarkPageHintViewed();
  const resetForReplay = useResetWalkthroughForReplay();

  const [showHint, setShowHint] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const handledRef = useRef(false);

  // Only consider viewed status once the query has loaded; avoid showing hint before we know.
  const viewedStatusKnown = !walkthroughStateLoading;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setShowHint(true);
    }, idleMs);
  }, [idleMs, clearTimer]);

  const onActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastActivityRef.current < ACTIVITY_THROTTLE_MS) return;
    lastActivityRef.current = now;
    if (!showHint) scheduleTimer();
  }, [showHint, scheduleTimer]);

  // Document-level activity listeners: start timer only when viewed status is known and not viewed
  useEffect(() => {
    if (
      !user?.id ||
      !viewedStatusKnown ||
      hasViewed ||
      showHint ||
      handledRef.current
    )
      return;

    scheduleTimer();

    document.addEventListener("mousemove", onActivity);
    document.addEventListener("click", onActivity);
    document.addEventListener("keydown", onActivity);

    return () => {
      clearTimer();
      document.removeEventListener("mousemove", onActivity);
      document.removeEventListener("click", onActivity);
      document.removeEventListener("keydown", onActivity);
    };
  }, [
    user?.id,
    viewedStatusKnown,
    hasViewed,
    showHint,
    scheduleTimer,
    clearTimer,
    onActivity,
  ]);

  const dismiss = useCallback(() => {
    handledRef.current = true;
    setShowHint(false);
    clearTimer();
    markViewed.mutate(hintId);
  }, [hintId, markViewed, clearTimer]);

  const triggerFullWalkthrough = useCallback(() => {
    handledRef.current = true;
    setShowHint(false);
    clearTimer();
    markViewed.mutate(hintId);
    resetForReplay.mutate();
  }, [hintId, markViewed, resetForReplay, clearTimer]);

  return {
    showHint:
      !!user?.id &&
      viewedStatusKnown &&
      !hasViewed &&
      showHint,
    dismiss,
    triggerFullWalkthrough,
  };
}

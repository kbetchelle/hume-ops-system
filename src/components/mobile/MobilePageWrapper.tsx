import { useRef, useEffect, useCallback, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface MobilePageWrapperProps {
  children: ReactNode;
  className?: string;
  /** Optional: scroll key (e.g. pathname or view id). When this changes, scroll to top. */
  scrollKey?: string;
  /** Optional: custom refetch instead of refetching all active queries. */
  onRefresh?: () => void | Promise<void>;
}

const PULL_THRESHOLD = 80;
const PULL_MAX = 120;

export function MobilePageWrapper({
  children,
  className,
  scrollKey,
  onRefresh,
}: MobilePageWrapperProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const queryClient = useQueryClient();
  const key = scrollKey ?? location.pathname;
  const pullStartY = useRef<number | null>(null);
  const pullOffset = useRef(0);

  // Scroll to top when scrollKey/pathname changes
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo(0, 0);
    } else {
      window.scrollTo(0, 0);
    }
  }, [key]);

  const handleRefetch = useCallback(async () => {
    if (onRefresh) {
      await onRefresh();
    } else {
      await queryClient.refetchQueries({ type: "active" });
    }
  }, [onRefresh, queryClient]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const el = scrollRef.current;
      if (!el || el.scrollTop > 10) return;
      pullStartY.current = e.touches[0].clientY;
      pullOffset.current = 0;
    },
    []
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (pullStartY.current === null) return;
      const el = scrollRef.current;
      if (!el || el.scrollTop > 10) {
        pullStartY.current = null;
        return;
      }
      const y = e.touches[0].clientY;
      const delta = y - pullStartY.current;
      if (delta > 0) {
        pullOffset.current = Math.min(delta, PULL_MAX);
      }
    },
    []
  );

  const handleTouchEnd = useCallback(() => {
    if (pullStartY.current === null) return;
    if (pullOffset.current >= PULL_THRESHOLD) {
      handleRefetch();
    }
    pullStartY.current = null;
    pullOffset.current = 0;
  }, [handleRefetch]);

  return (
    <div
      ref={scrollRef}
      className={cn(
        "min-h-0 overflow-auto overscroll-contain",
        "animate-in fade-in duration-200",
        "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}

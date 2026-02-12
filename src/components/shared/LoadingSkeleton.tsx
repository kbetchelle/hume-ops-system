import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  /** Number of skeleton rows to show (default 3) */
  rows?: number;
  /** Height class for each row (default "h-24") */
  rowHeight?: string;
  /** Show a centered spinner instead of skeleton rows */
  spinner?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Reusable loading indicator — either skeleton rows or a centered spinner.
 */
export function LoadingSkeleton({
  rows = 3,
  rowHeight = "h-24",
  spinner = false,
  className,
}: LoadingSkeletonProps) {
  if (spinner) {
    return (
      <div className={cn("flex justify-center py-12", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={cn("w-full", rowHeight)} />
      ))}
    </div>
  );
}

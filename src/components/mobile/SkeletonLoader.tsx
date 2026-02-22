import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type SkeletonVariant =
  | "checklist"
  | "form"
  | "card-list"
  | "timeline"
  | "conversation"
  | "detail";

interface SkeletonLoaderProps {
  variant: SkeletonVariant;
  count?: number;
  className?: string;
}

export function SkeletonLoader({
  variant,
  count = 6,
  className,
}: SkeletonLoaderProps) {
  if (variant === "checklist") {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: Math.min(count, 8) }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 border rounded-xl min-h-[48px]"
          >
            <Skeleton className="h-5 w-5 shrink-0 rounded border-2" />
            <div className="flex-1 space-y-1">
              <Skeleton
                className="h-4 rounded"
                style={{ width: `${60 + (i % 3) * 15}%` }}
              />
              {i % 3 === 0 && (
                <Skeleton className="h-3 w-24 rounded" />
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "form") {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="space-y-3">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-10 w-full rounded" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-40 rounded" />
          <Skeleton className="h-10 w-full rounded" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-24 w-full rounded" />
        </div>
        <div className="flex gap-2 pt-4">
          <Skeleton className="h-10 w-24 rounded" />
          <Skeleton className="h-10 w-28 rounded" />
        </div>
      </div>
    );
  }

  if (variant === "card-list") {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: Math.min(count, 6) }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl border space-y-2 min-h-[72px]">
            <Skeleton
              className="h-4 rounded"
              style={{ width: `${70 + (i % 2) * 20}%` }}
            />
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "timeline") {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: Math.min(count, 6) }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded" />
            <div className="flex-1 space-y-2 pt-0.5">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-3 w-32 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "conversation") {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: Math.min(count, 8) }).map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-xl min-h-[56px]"
          >
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
              <Skeleton
                className="h-3 rounded"
                style={{ width: `${50 + (i % 4) * 15}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div className={cn("space-y-4", className)}>
        <Skeleton className="aspect-video w-full rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-5/6 rounded" />
        </div>
        <div className="pt-4 space-y-2">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-20 w-full rounded" />
        </div>
      </div>
    );
  }

  return null;
}

import { Check, Download, Database, RefreshCw, Upload, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SyncPhaseIndicatorProps {
  phase: string | null;
  className?: string;
}

const PHASES = [
  { key: "fetching_api", label: "Fetch", icon: Download },
  { key: "staging", label: "Stage", icon: Database },
  { key: "transforming", label: "Transform", icon: RefreshCw },
  { key: "upserting", label: "Upsert", icon: Upload },
  { key: "clearing_staging", label: "Clear", icon: Trash2 },
];

function getPhaseIndex(phase: string | null): number {
  if (!phase) return -1;
  const idx = PHASES.findIndex((p) => p.key === phase);
  if (phase === "batch_complete" || phase === "complete") return PHASES.length;
  return idx;
}

export function SyncPhaseIndicator({ phase, className }: SyncPhaseIndicatorProps) {
  const currentIndex = getPhaseIndex(phase);
  const isComplete = phase === "complete" || phase === "batch_complete";
  const isPaused = phase === "paused";
  const isCancelled = phase === "cancelled";

  if (isPaused || isCancelled) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {PHASES.map((p, idx) => {
          const Icon = p.icon;
          return (
            <div key={p.key} className="flex items-center">
              <div
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded text-xs",
                  "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="h-3 w-3" />
                <span className="hidden sm:inline">{p.label}</span>
              </div>
              {idx < PHASES.length - 1 && (
                <div className="w-2 h-px bg-border mx-0.5" />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {PHASES.map((p, idx) => {
        const Icon = p.icon;
        const isCompleted = idx < currentIndex || isComplete;
        const isCurrent = idx === currentIndex && !isComplete;

        return (
          <div key={p.key} className="flex items-center">
            <div
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded text-xs transition-all",
                isCompleted && "bg-primary/20 text-primary",
                isCurrent && "bg-primary text-primary-foreground animate-pulse",
                !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
              )}
            >
              {isCompleted ? (
                <Check className="h-3 w-3" />
              ) : (
                <Icon className={cn("h-3 w-3", isCurrent && "animate-spin")} />
              )}
              <span className="hidden sm:inline">{p.label}</span>
            </div>
            {idx < PHASES.length - 1 && (
              <div
                className={cn(
                  "w-2 h-px mx-0.5 transition-colors",
                  isCompleted ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

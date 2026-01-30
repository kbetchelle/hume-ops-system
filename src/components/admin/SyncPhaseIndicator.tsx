import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SyncPhaseIndicatorProps {
  phase: string | null;
}

const PHASES = [
  { key: 'fetching_api', label: 'Fetch', description: 'Getting records from API' },
  { key: 'staging', label: 'Stage', description: 'Writing to staging table' },
  { key: 'transforming', label: 'Transform', description: 'Preparing data format' },
  { key: 'upserting', label: 'Sync', description: 'Updating target table' },
  { key: 'clearing_staging', label: 'Clear', description: 'Cleaning staging data' },
];

export function SyncPhaseIndicator({ phase }: SyncPhaseIndicatorProps) {
  const currentIndex = PHASES.findIndex(p => p.key === phase);
  
  // If batch_complete, all phases are done for this batch
  const isBatchComplete = phase === 'batch_complete';
  const isComplete = phase === 'complete';
  const isPaused = phase === 'paused';
  const isCancelled = phase === 'cancelled';

  return (
    <div className="flex items-center justify-between w-full">
      {PHASES.map((p, index) => {
        const isActive = p.key === phase;
        const isCompleted = isBatchComplete || isComplete || (currentIndex > index);
        
        return (
          <div key={p.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                  isActive && "bg-primary text-primary-foreground animate-pulse ring-4 ring-primary/20",
                  isCompleted && "bg-primary text-primary-foreground",
                  !isActive && !isCompleted && "bg-muted text-muted-foreground",
                  isPaused && "bg-muted text-muted-foreground",
                  isCancelled && "bg-muted text-muted-foreground"
                )}
              >
                {isActive ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] mt-1.5 uppercase tracking-wider",
                  isActive && "text-primary font-medium",
                  isCompleted && "text-primary",
                  !isActive && !isCompleted && "text-muted-foreground"
                )}
              >
                {p.label}
              </span>
            </div>
            
            {index < PHASES.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2 transition-colors",
                  currentIndex > index || isBatchComplete || isComplete
                    ? "bg-primary"
                    : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

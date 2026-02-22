import { WifiOff, Wifi, Loader2 } from "lucide-react";
import { useConnectivityStatus } from "@/hooks/useConnectivityStatus";
import { cn } from "@/lib/utils";

export function GlobalOfflineBanner() {
  const { isOnline, wasOffline, pendingChangesCount } = useConnectivityStatus();

  if (isOnline && !wasOffline) {
    return null;
  }

  if (isOnline && wasOffline) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 text-sm font-medium",
          "bg-green-100 dark:bg-green-950/40 text-green-900 dark:text-green-100",
          "border-b border-green-200 dark:border-green-800",
          "animate-in slide-in-from-top duration-200 will-change-transform"
        )}
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        <span>Back online — syncing...</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-4 py-2.5 text-sm",
        "bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100",
        "border-b border-amber-200 dark:border-amber-800",
        "animate-in slide-in-from-top duration-200 will-change-transform"
      )}
      role="alert"
    >
      <div className="flex items-center gap-3 min-w-0">
        <WifiOff className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0">
          <p className="font-medium">You're offline</p>
          <p className="text-xs opacity-90">
            {pendingChangesCount > 0 ? (
              <span>{pendingChangesCount} change{pendingChangesCount !== 1 ? "s" : ""} pending</span>
            ) : (
              <span>Changes will sync when reconnected</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

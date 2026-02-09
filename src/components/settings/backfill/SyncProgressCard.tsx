import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SyncProgress } from "./types";

interface SyncProgressCardProps {
  syncProgress: SyncProgress;
  startDate: string;
  endDate: string;
  isRange: boolean;
  hasCooldown?: boolean;
}

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min < 60) return `${min}m ${sec}s`;
  const hr = Math.floor(min / 60);
  return `${hr}h ${min % 60}m`;
}

function estimateRemaining(completed: number, total: number, elapsedMs: number): string | null {
  if (completed <= 0 || total <= 0 || elapsedMs <= 0) return null;
  const msPerUnit = elapsedMs / completed;
  const remaining = (total - completed) * msPerUnit;
  return formatElapsed(remaining);
}

export default function SyncProgressCard({
  syncProgress,
  startDate,
  endDate,
  isRange,
  hasCooldown,
}: SyncProgressCardProps) {
  if (!syncProgress.isRunning) return null;

  const elapsedMs = syncProgress.startTime ? Date.now() - syncProgress.startTime : 0;
  const pct = syncProgress.totalDates ? (syncProgress.completedDates / syncProgress.totalDates) * 100 : 0;
  const eta = estimateRemaining(syncProgress.completedDates, syncProgress.totalDates, elapsedMs);
  const rangeLabel = isRange ? `${startDate} → ${endDate}` : startDate;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Range & active date */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div className="text-muted-foreground">Syncing range</div>
          <div className="font-medium">{rangeLabel}</div>
          {syncProgress.currentDate && (
            <>
              <div className="text-muted-foreground">Active date</div>
              <div className="font-medium">{syncProgress.currentDate}</div>
            </>
          )}
        </div>

        {/* Dates / Records / Elapsed / ETA */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          <div>
            <div className="text-muted-foreground text-xs">Dates</div>
            <div className="font-semibold">{syncProgress.completedDates} / {syncProgress.totalDates}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Records</div>
            <div className="font-semibold">{syncProgress.totalRecords.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Elapsed</div>
            <div className="font-semibold">{formatElapsed(elapsedMs)}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Est. remaining</div>
            <div className="font-semibold">{eta ?? "—"}</div>
          </div>
        </div>

        <Progress value={pct} className="h-2" />

        {hasCooldown && (
          <p className="text-xs text-muted-foreground">
            ⏳ Page limit reached — auto-restarting after 2 min cooldown.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

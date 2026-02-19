import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import type { SyncResult } from "./types";

interface BackfillSyncLogProps {
  results: SyncResult[];
  isRunning: boolean;
  totalRecords: number;
  totalNewRecords: number;
}

export default function BackfillSyncLog({ results, isRunning, totalRecords, totalNewRecords }: BackfillSyncLogProps) {
  if (results.length === 0 && !isRunning) return null;

  const successCount = results.filter(r => r.success).length;
  const failedCount = results.filter(r => !r.success).length;
  const updatedCount = Math.max(0, totalRecords - totalNewRecords);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          Sync Log
          {isRunning && <Clock className="h-4 w-4 animate-spin text-muted-foreground" />}
        </CardTitle>
        {results.length > 0 && (
          <div className="flex flex-wrap gap-3 text-sm pt-1">
            <div className="flex items-center gap-1.5">
              <Badge variant="outline">Pulled</Badge>
              <span className="font-semibold">{totalRecords.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="default" className="bg-green-600">New</Badge>
              <span className="font-semibold">{totalNewRecords.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary">Updated</Badge>
              <span className="font-semibold">{updatedCount.toLocaleString()}</span>
            </div>
            {failedCount > 0 && (
              <div className="flex items-center gap-1.5">
                <Badge variant="destructive">Failed</Badge>
                <span className="font-semibold">{failedCount}</span>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="max-h-64 overflow-y-auto space-y-1.5">
          {results.length === 0 && isRunning && (
            <p className="text-sm text-muted-foreground">Waiting for results...</p>
          )}
          {results.map((r, i) => (
            <div
              key={r.date + i}
              className={`text-sm px-2 py-1.5 rounded ${
                r.success ? 'bg-muted/50' : 'bg-destructive/10 border border-destructive/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {r.success ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                  )}
                  <span className="font-mono">{r.date}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>{r.recordCount} pulled</span>
                  <span className="text-green-600">+{r.newRecords} new</span>
                  {r.existingBefore > 0 && (
                    <span className="text-muted-foreground">{r.existingBefore} pre-existing</span>
                  )}
                </div>
              </div>
              {r.error && (
                <p className="text-destructive text-xs mt-1 break-words">
                  {r.error}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

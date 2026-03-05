import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, Filter, ArrowRight } from "lucide-react";
import type { SyncResult } from "./types";

interface PaymentsSyncLogProps {
  results: SyncResult[];
  isRunning: boolean;
  totalRecords: number;
  totalNewRecords: number;
}

export default function PaymentsSyncLog({ results, isRunning, totalRecords, totalNewRecords }: PaymentsSyncLogProps) {
  if (results.length === 0 && !isRunning) return null;

  const successCount = results.filter(r => r.success).length;
  const failedCount = results.filter(r => !r.success).length;
  const updatedCount = Math.max(0, totalRecords - totalNewRecords);
  const totalRawFetched = results.reduce((sum, r) => sum + (r.totalRawFetched ?? r.recordCount), 0);
  const totalFiltered = results.reduce((sum, r) => sum + (r.filteredCount ?? r.recordCount), 0);
  const hasFilteringData = results.some(r => r.totalRawFetched != null);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          Sync Log
          {isRunning && <Clock className="h-4 w-4 animate-spin text-muted-foreground" />}
        </CardTitle>
        {results.length > 0 && (
          <div className="space-y-2 pt-1">
            {/* Filtering pipeline summary */}
            {hasFilteringData && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-md px-2.5 py-1.5">
                <Filter className="h-3 w-3 shrink-0" />
                <span>API returned <span className="font-semibold text-foreground">{totalRawFetched.toLocaleString()}</span></span>
                <ArrowRight className="h-3 w-3 shrink-0" />
                <span>Date-matched <span className="font-semibold text-foreground">{totalFiltered.toLocaleString()}</span></span>
                <ArrowRight className="h-3 w-3 shrink-0" />
                <span>Staged <span className="font-semibold text-foreground">{totalRecords.toLocaleString()}</span></span>
              </div>
            )}
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-1.5">
                <Badge className="text-[10px] px-1.5 py-0.5 rounded-none border-primary bg-primary/10 text-primary">Staged</Badge>
                <span className="font-semibold">{totalRecords.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge className="text-[10px] px-1.5 py-0.5 rounded-none border-green-600 bg-green-600/10 text-green-600">New</Badge>
                <span className="font-semibold">{totalNewRecords.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge className="text-[10px] px-1.5 py-0.5 rounded-none border-muted-foreground bg-muted text-muted-foreground">Updated</Badge>
                <span className="font-semibold">{updatedCount.toLocaleString()}</span>
              </div>
              {failedCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <Badge className="text-[10px] px-1.5 py-0.5 rounded-none border-destructive bg-destructive/10 text-destructive animate-pulse">Failed</Badge>
                  <span className="font-semibold">{failedCount}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="max-h-40 overflow-y-auto space-y-0.5 text-xs">
          {results.length === 0 && isRunning && (
            <p className="text-muted-foreground">Waiting for results...</p>
          )}
          {results.map((r, i) => {
            const hasRaw = r.totalRawFetched != null;
            return (
              <div
                key={r.date + i}
                className={`px-2 py-1 rounded flex items-center justify-between gap-2 ${
                  r.success ? 'bg-muted/50' : 'bg-destructive/10 border border-destructive/20'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {r.success ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                  ) : (
                    <XCircle className="h-3 w-3 text-destructive shrink-0" />
                  )}
                  <span className="font-mono truncate">{r.date}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                  {hasRaw && (
                    <span className="opacity-60">{r.totalRawFetched?.toLocaleString()} raw</span>
                  )}
                  <span>{(r.filteredCount ?? r.recordCount).toLocaleString()} matched</span>
                  <span className="text-green-600 font-medium">+{r.newRecords}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

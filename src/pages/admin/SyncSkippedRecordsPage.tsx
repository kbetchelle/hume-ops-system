import React, { useState } from "react";
import { format } from "date-fns";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  useSyncSkippedRecords,
  useSyncSkippedRecordsApiNames,
  useIsAnySyncRunning,
  type ApiSyncSkippedRecord,
} from "@/hooks/useSyncSkippedRecords";

function formatApiName(name: string): string {
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function SkippedRecordsTable({ apiName, refetchInterval }: { apiName: string | null; refetchInterval: number }) {
  const { data: records, isLoading, error, refetch } = useSyncSkippedRecords(apiName, { refetchInterval });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading && !records) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive text-sm">Failed to load skipped records</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  if (!records?.length) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm">
        No skipped records for this endpoint. Tables update when backfill, cron, or manual API sync runs.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="font-medium">Record ID</TableHead>
            <TableHead className="font-medium">Secondary ID</TableHead>
            <TableHead className="font-medium">Reason</TableHead>
            <TableHead className="font-medium">Created</TableHead>
            <TableHead className="font-medium w-[80px]">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((row: ApiSyncSkippedRecord) => (
            <React.Fragment key={row.id}>
              <TableRow>
                <TableCell className="font-mono text-xs">{row.record_id}</TableCell>
                <TableCell className="font-mono text-xs">{row.secondary_id ?? "—"}</TableCell>
                <TableCell className="text-sm">{row.reason}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {row.created_at ? format(new Date(row.created_at), "MMM d, yyyy HH:mm:ss") : "—"}
                </TableCell>
                <TableCell>
                  {row.details && Object.keys(row.details).length > 0 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                    >
                      {expandedId === row.id ? "Hide" : "Show"}
                    </Button>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
              {expandedId === row.id && row.details && (
                <TableRow>
                  <TableCell colSpan={5} className="bg-muted/20 p-4">
                    <pre className="text-xs font-mono overflow-auto max-h-40 whitespace-pre-wrap break-all">
                      {JSON.stringify(row.details, null, 2)}
                    </pre>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function SyncSkippedRecordsPage() {
  const { data: isSyncRunning } = useIsAnySyncRunning();
  const pollInterval = isSyncRunning ? 60_000 : 300_000;

  const { data: apiNames, isLoading: namesLoading } = useSyncSkippedRecordsApiNames({ refetchInterval: pollInterval });
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isCreatingClasses, setIsCreatingClasses] = useState(false);
  const queryClient = useQueryClient();

  const handleCreateMissingClasses = async () => {
    setIsCreatingClasses(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-classes-from-skipped", {
        body: { api_name: activeTab === "all" ? undefined : activeTab },
      });

      if (error) throw error;

      const result = data as { success: boolean; created: number; apiCreated: number; stubCreated: number; skippedCleaned: number; error?: string };

      if (result.success) {
        toast.success(
          `Created ${result.created} classes (${result.apiCreated} from API, ${result.stubCreated} stubs). Cleaned ${result.skippedCleaned} skipped records. Reservations re-synced & schedule refreshed.`
        );
        // Invalidate all related queries
        queryClient.invalidateQueries({ queryKey: ["apiSyncSkippedRecords"] });
        queryClient.invalidateQueries({ queryKey: ["apiSyncSkippedRecordsApiNames"] });
      } else {
        toast.error(result.error || "Failed to create classes");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create missing classes");
    } finally {
      setIsCreatingClasses(false);
    }
  };

  return (
    <DashboardLayout title="Sync Skipped Records">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-sm uppercase tracking-[0.15em] font-normal">
              Skipped / anomaly records by endpoint
            </h2>
            <p className="text-xs text-muted-foreground tracking-wide">
              Records logged when a sync runs and finds items without a matching reference (e.g. reservation without class_id). Updates when backfill, cron, or manual sync runs.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={handleCreateMissingClasses}
              disabled={isCreatingClasses}
            >
              {isCreatingClasses ? "Creating…" : "Create Missing Classes & Re-sync"}
            </Button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  isSyncRunning ? "bg-green-500 animate-pulse" : "bg-muted-foreground/40"
                }`}
              />
              {isSyncRunning ? "Live — syncs active (1 min)" : "Idle (5 min)"}
            </div>
          </div>
        </div>

        <Card className="border border-border rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-normal">Skipped records by endpoint</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {namesLoading && !apiNames ? (
              <div className="p-6">
                <Skeleton className="h-9 w-48 mb-4" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start flex-wrap h-auto gap-1 rounded-none border-b border-border bg-transparent p-0 mx-4">
                  <TabsTrigger value="all" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                    All
                  </TabsTrigger>
                  {(apiNames ?? []).map((name) => (
                    <TabsTrigger
                      key={name}
                      value={name}
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                    >
                      {formatApiName(name)}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsContent value="all" className="mt-0">
                  <SkippedRecordsTable apiName={null} refetchInterval={pollInterval} />
                </TabsContent>
                {(apiNames ?? []).map((name) => (
                  <TabsContent key={name} value={name} className="mt-0">
                    <SkippedRecordsTable apiName={name} refetchInterval={pollInterval} />
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

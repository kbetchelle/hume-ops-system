import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Database, GitBranch, AlertTriangle, Play, RefreshCw, Plus } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────

interface ClassFromReservations {
  class_id: string;
  class_name: string | null;
  class_date: string | null;
  reservation_count: number;
  checked_in_count: number;
  exists_in_classes: boolean;
}

interface OrphanedClass {
  external_id: string;
  name: string;
  class_date: string | null;
  booked_count: number | null;
  reservation_count: number;
}

interface DateCoverage {
  class_date: string;
  classes_count: number;
  reservations_count: number;
  has_classes: boolean;
  has_reservations: boolean;
}

// ── Sync helpers ──────────────────────────────────────────────────

async function triggerReservationSync(startDate: string, endDate: string) {
  const { data, error } = await supabase.functions.invoke("sync-arketa-reservations", {
    body: { startDate, endDate, triggeredBy: "data-patterns" },
  });
  if (error) throw error;
  return data;
}

async function triggerClassesSync(startDate: string, endDate: string) {
  const { data, error } = await supabase.functions.invoke("sync-arketa-classes", {
    body: { startDate, endDate, triggeredBy: "data-patterns" },
  });
  if (error) throw error;
  return data;
}

async function createStubClasses(classes: { class_id: string; class_name: string | null; class_date: string | null }[]) {
  const rows = classes.map((c) => ({
    external_id: c.class_id,
    name: c.class_name ?? "Unknown (from reservation)",
    class_date: c.class_date ?? new Date().toISOString().split("T")[0],
    start_time: c.class_date ? `${c.class_date}T00:00:00Z` : new Date().toISOString(),
    synced_at: new Date().toISOString(),
    status: "stub_from_reservation",
  }));

  // Batch upsert in chunks of 50
  for (let i = 0; i < rows.length; i += 50) {
    const chunk = rows.slice(i, i + 50);
    const { error } = await (supabase as any)
      .from("arketa_classes")
      .upsert(chunk, { onConflict: "external_id,class_date" });
    if (error) throw error;
  }
  return rows.length;
}

// ── Hooks ─────────────────────────────────────────────────────────

function useClassesFromReservations() {
  return useQuery({
    queryKey: ["data-patterns", "classes-from-reservations"],
    queryFn: async () => {
      const { data: resClasses, error } = await (supabase as any)
        .from("arketa_reservations_history")
        .select("class_id, class_name, class_date")
        .not("class_id", "is", null)
        .order("class_date", { ascending: false })
        .limit(5000);
      if (error) throw error;

      const grouped = new Map<string, { class_name: string | null; class_date: string | null; count: number; checked_in: number }>();
      for (const r of resClasses ?? []) {
        const existing = grouped.get(r.class_id);
        if (!existing) {
          grouped.set(r.class_id, { class_name: r.class_name, class_date: r.class_date, count: 1, checked_in: 0 });
        } else {
          existing.count++;
        }
      }

      const classIds = [...grouped.keys()];
      const existingIds = new Set<string>();
      for (let i = 0; i < classIds.length; i += 200) {
        const chunk = classIds.slice(i, i + 200);
        const { data: found } = await (supabase as any)
          .from("arketa_classes")
          .select("external_id")
          .in("external_id", chunk);
        for (const f of found ?? []) existingIds.add(f.external_id);
      }

      const results: ClassFromReservations[] = [];
      for (const [classId, info] of grouped) {
        results.push({
          class_id: classId,
          class_name: info.class_name,
          class_date: info.class_date,
          reservation_count: info.count,
          checked_in_count: info.checked_in,
          exists_in_classes: existingIds.has(classId),
        });
      }
      return results.sort((a, b) => (b.class_date ?? "").localeCompare(a.class_date ?? ""));
    },
    staleTime: 60_000,
  });
}

function useOrphanedClasses() {
  return useQuery({
    queryKey: ["data-patterns", "orphaned-classes"],
    queryFn: async () => {
      const { data: classes, error } = await (supabase as any)
        .from("arketa_classes")
        .select("external_id, name, class_date, booked_count")
        .gt("booked_count", 0)
        .order("class_date", { ascending: false })
        .limit(2000);
      if (error) throw error;

      const classIds = (classes ?? []).map((c: any) => c.external_id);
      const hasReservations = new Map<string, number>();

      for (let i = 0; i < classIds.length; i += 200) {
        const chunk = classIds.slice(i, i + 200);
        const { data: res } = await (supabase as any)
          .from("arketa_reservations_history")
          .select("class_id")
          .in("class_id", chunk);
        for (const r of res ?? []) {
          hasReservations.set(r.class_id, (hasReservations.get(r.class_id) ?? 0) + 1);
        }
      }

      const orphaned: OrphanedClass[] = [];
      for (const c of classes ?? []) {
        const resCount = hasReservations.get(c.external_id) ?? 0;
        if (resCount === 0) {
          orphaned.push({
            external_id: c.external_id,
            name: c.name,
            class_date: c.class_date,
            booked_count: c.booked_count,
            reservation_count: 0,
          });
        }
      }
      return orphaned;
    },
    staleTime: 60_000,
  });
}

function useDateCoverage() {
  return useQuery({
    queryKey: ["data-patterns", "date-coverage"],
    queryFn: async () => {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      const startStr = sixtyDaysAgo.toISOString().split("T")[0];

      const { data: classDates } = await (supabase as any)
        .from("arketa_classes")
        .select("class_date")
        .gte("class_date", startStr)
        .not("class_date", "is", null)
        .limit(10000);

      const { data: resDates } = await (supabase as any)
        .from("arketa_reservations_history")
        .select("class_date")
        .gte("class_date", startStr)
        .not("class_date", "is", null)
        .limit(10000);

      const classCountByDate = new Map<string, number>();
      for (const c of classDates ?? []) {
        classCountByDate.set(c.class_date, (classCountByDate.get(c.class_date) ?? 0) + 1);
      }
      const resCountByDate = new Map<string, number>();
      for (const r of resDates ?? []) {
        resCountByDate.set(r.class_date, (resCountByDate.get(r.class_date) ?? 0) + 1);
      }

      const allDates = new Set([...classCountByDate.keys(), ...resCountByDate.keys()]);
      const coverage: DateCoverage[] = [];
      for (const d of allDates) {
        const cc = classCountByDate.get(d) ?? 0;
        const rc = resCountByDate.get(d) ?? 0;
        coverage.push({ class_date: d, classes_count: cc, reservations_count: rc, has_classes: cc > 0, has_reservations: rc > 0 });
      }
      return coverage.sort((a, b) => b.class_date.localeCompare(a.class_date));
    },
    staleTime: 60_000,
  });
}

// ── Components ────────────────────────────────────────────────────

function SectionLoader() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}

function DateCoverageSection() {
  const { data, isLoading } = useDateCoverage();
  const queryClient = useQueryClient();
  const gaps = data?.filter((d) => d.has_classes !== d.has_reservations) ?? [];
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState(false);

  const toggleDate = (date: string) => {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      next.has(date) ? next.delete(date) : next.add(date);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedDates.size === gaps.length) {
      setSelectedDates(new Set());
    } else {
      setSelectedDates(new Set(gaps.map((g) => g.class_date)));
    }
  };

  const handleSync = async () => {
    if (selectedDates.size === 0) return;
    setSyncing(true);
    let successCount = 0;
    let errorCount = 0;

    for (const date of selectedDates) {
      const gap = gaps.find((g) => g.class_date === date);
      if (!gap) continue;
      try {
        if (gap.has_classes && !gap.has_reservations) {
          await triggerReservationSync(date, date);
        } else {
          await triggerClassesSync(date, date);
        }
        successCount++;
      } catch {
        errorCount++;
      }
    }

    setSyncing(false);
    setSelectedDates(new Set());
    queryClient.invalidateQueries({ queryKey: ["data-patterns"] });
    if (errorCount === 0) {
      toast.success(`Synced ${successCount} date(s) successfully`);
    } else {
      toast.warning(`${successCount} succeeded, ${errorCount} failed`);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Date Coverage Gaps (Last 60 Days)
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Dates where classes exist but no reservations, or vice versa. Select rows to sync missing data.
            </p>
          </div>
          {gaps.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              disabled={selectedDates.size === 0 || syncing}
              onClick={handleSync}
              className="shrink-0"
            >
              {syncing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Play className="h-3 w-3 mr-1" />}
              Sync {selectedDates.size > 0 ? `(${selectedDates.size})` : "Selected"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <SectionLoader />
        ) : gaps.length === 0 ? (
          <p className="text-sm text-muted-foreground">No coverage gaps found — classes and reservations align.</p>
        ) : (
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">
                    <Checkbox
                      checked={selectedDates.size === gaps.length && gaps.length > 0}
                      onCheckedChange={selectAll}
                    />
                  </TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Classes</TableHead>
                  <TableHead>Reservations</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gaps.map((g) => (
                  <TableRow key={g.class_date}>
                    <TableCell>
                      <Checkbox
                        checked={selectedDates.has(g.class_date)}
                        onCheckedChange={() => toggleDate(g.class_date)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{g.class_date}</TableCell>
                    <TableCell>{g.classes_count}</TableCell>
                    <TableCell>{g.reservations_count}</TableCell>
                    <TableCell>
                      {g.has_classes && !g.has_reservations && (
                        <Badge variant="outline" className="text-destructive border-destructive/30 text-xs">
                          Missing Reservations
                        </Badge>
                      )}
                      {!g.has_classes && g.has_reservations && (
                        <Badge variant="outline" className="text-primary border-primary/30 text-xs">
                          Missing Classes
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {g.has_classes && !g.has_reservations ? "Will sync reservations" : "Will sync classes"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OrphanedClassesSection() {
  const { data, isLoading } = useOrphanedClasses();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState(false);

  const toggleId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const visible = (data ?? []).slice(0, 100);
    if (selectedIds.size === visible.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visible.map((c) => `${c.external_id}|${c.class_date}`)));
    }
  };

  const handleFetchReservations = async () => {
    if (selectedIds.size === 0) return;
    setSyncing(true);

    // Group selected orphans by date, then sync reservations for each unique date
    const dateSet = new Set<string>();
    for (const key of selectedIds) {
      const date = key.split("|")[1];
      if (date) dateSet.add(date);
    }

    let successCount = 0;
    let errorCount = 0;
    for (const date of dateSet) {
      try {
        await triggerReservationSync(date, date);
        successCount++;
      } catch {
        errorCount++;
      }
    }

    setSyncing(false);
    setSelectedIds(new Set());
    queryClient.invalidateQueries({ queryKey: ["data-patterns"] });
    if (errorCount === 0) {
      toast.success(`Triggered reservation sync for ${successCount} date(s)`);
    } else {
      toast.warning(`${successCount} succeeded, ${errorCount} failed`);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Orphaned Classes
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Booked but no reservation records. Select to fetch reservations.
            </p>
          </div>
          {(data?.length ?? 0) > 0 && (
            <Button
              size="sm"
              variant="outline"
              disabled={selectedIds.size === 0 || syncing}
              onClick={handleFetchReservations}
              className="shrink-0"
            >
              {syncing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
              Fetch ({selectedIds.size})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <SectionLoader />
        ) : !data?.length ? (
          <p className="text-sm text-muted-foreground">No orphaned classes found.</p>
        ) : (
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">
                    <Checkbox
                      checked={selectedIds.size === Math.min(data.length, 100) && data.length > 0}
                      onCheckedChange={selectAll}
                    />
                  </TableHead>
                  <TableHead>Class ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Booked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.slice(0, 100).map((c) => {
                  const key = `${c.external_id}|${c.class_date}`;
                  return (
                    <TableRow key={key}>
                      <TableCell>
                        <Checkbox checked={selectedIds.has(key)} onCheckedChange={() => toggleId(key)} />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{c.external_id.slice(0, 12)}…</TableCell>
                      <TableCell className="text-xs">{c.name}</TableCell>
                      <TableCell className="font-mono text-xs">{c.class_date}</TableCell>
                      <TableCell>{c.booked_count}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {data.length > 100 && (
              <p className="text-xs text-muted-foreground mt-2 px-2">Showing 100 of {data.length}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReservationClassMappingSection() {
  const { data, isLoading } = useClassesFromReservations();
  const queryClient = useQueryClient();
  const missingInClasses = data?.filter((d) => !d.exists_in_classes) ?? [];
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);

  const toggleId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const visible = missingInClasses.slice(0, 100);
    if (selectedIds.size === visible.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visible.map((c) => c.class_id)));
    }
  };

  const handleCreateStubs = async () => {
    if (selectedIds.size === 0) return;
    setCreating(true);
    try {
      const toCreate = missingInClasses.filter((c) => selectedIds.has(c.class_id));
      const count = await createStubClasses(toCreate);
      toast.success(`Created ${count} stub class record(s) from reservation data`);
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["data-patterns"] });
    } catch (err) {
      toast.error(`Failed to create stubs: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Classes from Reservations
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Class IDs in reservations but missing from classes table. Select to create stub records.
            </p>
          </div>
          {missingInClasses.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              disabled={selectedIds.size === 0 || creating}
              onClick={handleCreateStubs}
              className="shrink-0"
            >
              {creating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
              Create Stubs ({selectedIds.size})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <SectionLoader />
        ) : (
          <>
            <div className="flex gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{data?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground">Unique Classes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-destructive">{missingInClasses.length}</p>
                <p className="text-xs text-muted-foreground">Missing from Classes Table</p>
              </div>
            </div>
            {missingInClasses.length > 0 && (
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">
                        <Checkbox
                          checked={selectedIds.size === Math.min(missingInClasses.length, 100) && missingInClasses.length > 0}
                          onCheckedChange={selectAll}
                        />
                      </TableHead>
                      <TableHead>Class ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Last Date</TableHead>
                      <TableHead>Reservations</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {missingInClasses.slice(0, 100).map((c) => (
                      <TableRow key={c.class_id}>
                        <TableCell>
                          <Checkbox checked={selectedIds.has(c.class_id)} onCheckedChange={() => toggleId(c.class_id)} />
                        </TableCell>
                        <TableCell className="font-mono text-xs">{c.class_id.slice(0, 12)}…</TableCell>
                        <TableCell className="text-xs">{c.class_name ?? "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{c.class_date ?? "—"}</TableCell>
                        <TableCell>{c.reservation_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function DataPatternsPage() {
  return (
    <DashboardLayout title="Data Patterns">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Data Patterns</h1>
          <p className="text-muted-foreground text-sm">
            Cross-reference Arketa API endpoints to find data gaps, orphaned records, and mapping inconsistencies.
            Select rows and use actions to resolve issues.
          </p>
        </div>
        <DateCoverageSection />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <OrphanedClassesSection />
          <ReservationClassMappingSection />
        </div>
      </div>
    </DashboardLayout>
  );
}

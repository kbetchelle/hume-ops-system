import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Database, GitBranch, AlertTriangle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

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

function useClassesFromReservations() {
  return useQuery({
    queryKey: ["data-patterns", "classes-from-reservations"],
    queryFn: async () => {
      // Get distinct class_id/class_name combos from reservations history
      const { data: resClasses, error } = await (supabase as any)
        .from("arketa_reservations_history")
        .select("class_id, class_name, class_date")
        .not("class_id", "is", null)
        .order("class_date", { ascending: false })
        .limit(5000);
      if (error) throw error;

      // Group by class_id
      const grouped = new Map<string, { class_name: string | null; class_date: string | null; count: number; checked_in: number }>();
      for (const r of resClasses ?? []) {
        const existing = grouped.get(r.class_id);
        if (!existing) {
          grouped.set(r.class_id, { class_name: r.class_name, class_date: r.class_date, count: 1, checked_in: 0 });
        } else {
          existing.count++;
        }
      }

      // Check which exist in arketa_classes
      const classIds = [...grouped.keys()];
      const existingIds = new Set<string>();
      // Chunk lookups to avoid URL length limits
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
      // Get classes that have booked_count > 0 but no reservations in history
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
      // Get last 60 days of class dates
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
        coverage.push({
          class_date: d,
          classes_count: cc,
          reservations_count: rc,
          has_classes: cc > 0,
          has_reservations: rc > 0,
        });
      }
      return coverage.sort((a, b) => b.class_date.localeCompare(a.class_date));
    },
    staleTime: 60_000,
  });
}

function SectionLoader() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}

function DateCoverageSection() {
  const { data, isLoading } = useDateCoverage();
  const gaps = data?.filter((d) => d.has_classes !== d.has_reservations) ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <GitBranch className="h-4 w-4" />
          Date Coverage Gaps (Last 60 Days)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Dates where classes exist but no reservations, or vice versa
        </p>
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
                  <TableHead>Date</TableHead>
                  <TableHead>Classes</TableHead>
                  <TableHead>Reservations</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gaps.map((g) => (
                  <TableRow key={g.class_date}>
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Orphaned Classes (Booked but No Reservations)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Classes with booked_count &gt; 0 but zero reservation records in history
        </p>
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
                  <TableHead>Class ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Booked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.slice(0, 100).map((c) => (
                  <TableRow key={`${c.external_id}-${c.class_date}`}>
                    <TableCell className="font-mono text-xs">{c.external_id.slice(0, 12)}…</TableCell>
                    <TableCell className="text-xs">{c.name}</TableCell>
                    <TableCell className="font-mono text-xs">{c.class_date}</TableCell>
                    <TableCell>{c.booked_count}</TableCell>
                  </TableRow>
                ))}
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
  const missingInClasses = data?.filter((d) => !d.exists_in_classes) ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Database className="h-4 w-4" />
          Classes Discovered from Reservations
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Unique class_ids found in reservations history — highlights those missing from arketa_classes
        </p>
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
                      <TableHead>Class ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Last Date</TableHead>
                      <TableHead>Reservations</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {missingInClasses.slice(0, 100).map((c) => (
                      <TableRow key={c.class_id}>
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

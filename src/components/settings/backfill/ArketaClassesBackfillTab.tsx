import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useSyncArketaClasses } from "@/hooks/useArketaApi";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

export default function ArketaClassesBackfillTab() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return formatDate(d);
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return formatDate(d);
  });

  const syncClasses = useSyncArketaClasses();

  const { data: totalCount, refetch: refetchCount } = useQuery({
    queryKey: ["arketa-classes-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("arketa_classes")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const handleSync = () => {
    syncClasses.mutate(
      { start_date: startDate, end_date: endDate },
      { onSuccess: () => refetchCount() }
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sync Arketa Classes</CardTitle>
          <CardDescription>
            Populate arketa_classes for a date range. Required for reservation sync (Tier 2/3). Uses sync-arketa-classes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="classes-start">Start date</Label>
              <Input
                id="classes-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={syncClasses.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="classes-end">End date</Label>
              <Input
                id="classes-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={syncClasses.isPending}
              />
            </div>
          </div>
          <Button
            onClick={handleSync}
            disabled={syncClasses.isPending}
            className="gap-2"
          >
            {syncClasses.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Syncing…
              </>
            ) : (
              "Sync classes"
            )}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">arketa_classes</CardTitle>
          <CardDescription>Master catalog of class IDs for reservation sync</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-semibold">{totalCount?.toLocaleString() ?? "—"}</span>
            <span className="text-muted-foreground text-sm">classes</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

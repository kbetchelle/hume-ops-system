import { useState } from "react";
import { useMastercardVisits, MastercardVisitStatus } from "@/hooks/useMastercardVisits";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { MastercardVisit } from "@/hooks/useMastercardVisits";

const STATUS_ORDER: MastercardVisitStatus[] = ["scheduled", "completed", "cancelled", "no_show"];

const statusLabels: Record<MastercardVisitStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

const statusStyles: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  no_show: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
};

function getInitials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function VisitRow({ visit }: { visit: MastercardVisit }) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getInitials(visit.client_name)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{visit.client_name || "—"}</span>
        </div>
      </TableCell>
      <TableCell>
        {visit.mastercard_tier ? (
          <Badge variant="secondary">{visit.mastercard_tier}</Badge>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {format(parseISO(visit.visit_date), "MMM d, yyyy")}
        {" · "}
        {format(parseISO(visit.start_time), "h:mm a")}
      </TableCell>
      <TableCell>{visit.number_of_guests ?? 0}</TableCell>
      <TableCell className="text-muted-foreground">
        {visit.assigned_concierge ? "Assigned" : "—"}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {visit.visit_purpose || "—"}
      </TableCell>
    </TableRow>
  );
}

function StatusSection({ status, visits }: { status: MastercardVisitStatus; visits: MastercardVisit[] }) {
  if (visits.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge className={statusStyles[status]}>{statusLabels[status]}</Badge>
        <span className="text-xs text-muted-foreground">
          {visits.length} visit{visits.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[220px]">Client</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Date / Time</TableHead>
              <TableHead>Guests</TableHead>
              <TableHead>Assigned Concierge</TableHead>
              <TableHead>Purpose</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visits.map((visit) => (
              <VisitRow key={visit.id} visit={visit} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function MastercardVisitsTable() {
  const [search, setSearch] = useState("");
  const { data: visits = [], isLoading, error } = useMastercardVisits({ search });

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Failed to load visits. Please try again.
      </div>
    );
  }

  // Group visits by status
  const grouped = STATUS_ORDER.reduce<Record<MastercardVisitStatus, MastercardVisit[]>>(
    (acc, status) => {
      acc[status] = visits.filter((v) => v.status === status);
      return acc;
    },
    { scheduled: [], completed: [], cancelled: [], no_show: [] }
  );

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[220px]">Client</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Date / Time</TableHead>
                <TableHead>Guests</TableHead>
                <TableHead>Assigned Concierge</TableHead>
                <TableHead>Purpose</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : visits.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No visits found</div>
      ) : (
        <div className="space-y-6">
          {STATUS_ORDER.map((status) => (
            <StatusSection key={status} status={status} visits={grouped[status]} />
          ))}
        </div>
      )}

      {!isLoading && visits.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Showing {visits.length} visit{visits.length !== 1 ? "s" : ""} total
        </p>
      )}
    </div>
  );
}

"use client";

import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { Search, FileText, ChevronLeft, ChevronRight, Monitor } from "lucide-react";
import { useDebounce } from "use-debounce";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useSubmittedShiftReports } from "@/hooks/useShiftReports";
import { useIsMobile } from "@/hooks/use-mobile";

const ITEMS_PER_PAGE = 12;
const PREVIEW_LENGTH = 100;

type ReportRow = {
  id: string;
  report_date: string;
  shift_type: string;
  staff_name: string | null;
  management_notes: string | null;
  busiest_areas: string | null;
  tour_notes: unknown;
  member_feedback: unknown;
  facility_issues: unknown;
  system_issues: unknown;
  future_shift_notes: unknown;
  cafe_notes?: string | null;
  submitted_at: string | null;
};

function stringifyForSearch(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function getSearchableText(r: ReportRow): string {
  const parts = [
    r.staff_name ?? "",
    r.management_notes ?? "",
    r.busiest_areas ?? "",
    r.cafe_notes ?? "",
    stringifyForSearch(r.tour_notes),
    stringifyForSearch(r.member_feedback),
    stringifyForSearch(r.facility_issues),
    stringifyForSearch(r.system_issues),
    stringifyForSearch(r.future_shift_notes),
  ];
  return parts.join(" ").toLowerCase();
}

function preview(text: string | null, maxLen: number): string {
  if (!text || !text.trim()) return "No summary";
  const t = text.trim();
  return t.length <= maxLen ? t : t.slice(0, maxLen) + "…";
}

function summarizeJsonArray(arr: unknown): string {
  if (!Array.isArray(arr) || arr.length === 0) return "—";
  const first = arr[0];
  if (typeof first === "string") return first;
  if (first && typeof first === "object" && "content" in first) return String((first as { content?: string }).content ?? "");
  if (first && typeof first === "object" && "description" in first) return String((first as { description?: string }).description ?? "");
  if (first && typeof first === "object" && "note" in first) return String((first as { note?: string }).note ?? "");
  return JSON.stringify(first).slice(0, 80) + (JSON.stringify(first).length > 80 ? "…" : "");
}

export function PastReportsView() {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 300);
  const [page, setPage] = useState(0);
  const [detailReport, setDetailReport] = useState<ReportRow | null>(null);

  const { data: reports = [], isLoading } = useSubmittedShiftReports(200);

  const filteredReports = useMemo(() => {
    const list = reports as ReportRow[];
    if (!debouncedSearch.trim()) return list;
    const q = debouncedSearch.trim().toLowerCase();
    return list.filter((r) => getSearchableText(r).includes(q));
  }, [reports, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages - 1);
  const paginatedReports = useMemo(
    () =>
      filteredReports.slice(
        currentPage * ITEMS_PER_PAGE,
        (currentPage + 1) * ITEMS_PER_PAGE
      ),
    [filteredReports, currentPage]
  );

  useEffect(() => {
    if (page >= totalPages && totalPages > 0) setPage(0);
  }, [totalPages, page]);

  if (isMobile) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-6 text-center">
        <Monitor className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Past reports are available on desktop.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            className="pl-8 rounded-none"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {filteredReports.length} report{filteredReports.length !== 1 ? "s" : ""}
          {totalPages > 1 && ` · Page ${currentPage + 1} of ${totalPages}`}
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="rounded-none border">
              <CardContent className="p-4">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="mt-2 h-3 w-32 bg-muted animate-pulse rounded" />
                <div className="mt-3 h-12 w-full bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <Card className="rounded-none border">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">
              {reports.length === 0
                ? "No past reports yet."
                : "No reports match your search."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedReports.map((r) => (
              <Card
                key={r.id}
                className="cursor-pointer rounded-none border transition-colors hover:bg-muted/50"
                onClick={() => setDetailReport(r as ReportRow)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {format(new Date(r.report_date + "T12:00:00"), "EEE, MMM d")}
                    </span>
                    <Badge variant="outline" className="text-[10px] rounded-none">
                      {r.shift_type === "AM" ? "AM" : "PM"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.staff_name ?? "—"}
                  </p>
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                    {preview(r.management_notes, PREVIEW_LENGTH)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.max(0, p - 1));
                    }}
                    className={
                      currentPage === 0 ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="px-2 text-sm text-muted-foreground">
                    {currentPage + 1} / {totalPages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.min(totalPages - 1, p + 1));
                    }}
                    className={
                      currentPage >= totalPages - 1
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      <Dialog open={!!detailReport} onOpenChange={(open) => !open && setDetailReport(null)}>
        <DialogContent className="max-w-lg rounded-none">
          <DialogHeader>
            <DialogTitle>Shift Report</DialogTitle>
            <DialogDescription>
              {detailReport && (
                <>
                  {format(new Date(detailReport.report_date + "T12:00:00"), "EEEE, MMM d, yyyy")}{" "}
                  · {detailReport.shift_type === "AM" ? "AM" : "PM"}
                  {detailReport.submitted_at && (
                    <> · Submitted {format(new Date(detailReport.submitted_at), "MMM d, h:mm a")}</>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {detailReport && (
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Staff</span>
                <p className="mt-0.5">{detailReport.staff_name ?? "—"}</p>
              </div>
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Summary</span>
                <p className="mt-0.5 whitespace-pre-wrap">{detailReport.management_notes || "—"}</p>
              </div>
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Busiest areas</span>
                <p className="mt-0.5">{detailReport.busiest_areas || "—"}</p>
              </div>
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Tour notes</span>
                <p className="mt-0.5">{summarizeJsonArray(detailReport.tour_notes as unknown[])}</p>
              </div>
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Member feedback</span>
                <p className="mt-0.5">{summarizeJsonArray(detailReport.member_feedback as unknown[])}</p>
              </div>
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Facility issues</span>
                <p className="mt-0.5">{summarizeJsonArray(detailReport.facility_issues as unknown[])}</p>
              </div>
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Handoff notes</span>
                <p className="mt-0.5">{summarizeJsonArray(detailReport.future_shift_notes as unknown[])}</p>
              </div>
              {detailReport.cafe_notes && (
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Cafe notes</span>
                  <p className="mt-0.5">{detailReport.cafe_notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

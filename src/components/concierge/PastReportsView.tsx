"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { format, subDays } from "date-fns";
import { Search, FileText } from "lucide-react";
import { useDebounce } from "use-debounce";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useSubmittedShiftReports } from "@/hooks/useShiftReports";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobilePageWrapper } from "@/components/mobile/MobilePageWrapper";

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

function extractItemText(item: unknown): string {
  if (typeof item === "string") return item;
  if (item && typeof item === "object") {
    const obj = item as Record<string, unknown>;
    for (const key of ["text", "content", "description", "note"]) {
      if (key in obj && obj[key]) return String(obj[key]);
    }
  }
  return "";
}

function summarizeJsonArray(arr: unknown): string {
  if (!Array.isArray(arr) || arr.length === 0) return "—";
  const texts = arr.map(extractItemText).filter(Boolean);
  return texts.length > 0 ? texts.join("\n") : "—";
}

const DEFAULT_DATE_FROM = format(subDays(new Date(), 30), "yyyy-MM-dd");
const DEFAULT_DATE_TO = format(new Date(), "yyyy-MM-dd");

export function PastReportsView() {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 300);
  const [page, setPage] = useState(0);
  const [detailReport, setDetailReport] = useState<ReportRow | null>(null);
  const [dateFrom, setDateFrom] = useState(DEFAULT_DATE_FROM);
  const [dateTo, setDateTo] = useState(DEFAULT_DATE_TO);

  const { data: reports = [], isLoading, refetch } = useSubmittedShiftReports(200);

  const filteredReports = useMemo(() => {
    const list = reports as ReportRow[];
    let out = list;
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim().toLowerCase();
      out = out.filter((r) => getSearchableText(r).includes(q));
    }
    if (isMobile && (dateFrom || dateTo)) {
      out = out.filter((r) => {
        const d = r.report_date;
        if (dateFrom && d < dateFrom) return false;
        if (dateTo && d > dateTo) return false;
        return true;
      });
    }
    return out;
  }, [reports, debouncedSearch, isMobile, dateFrom, dateTo]);

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

  const handleMobileRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const detailContent = detailReport && (
    <div className="space-y-4 text-sm pb-8">
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
        <p className="mt-0.5 whitespace-pre-wrap">{summarizeJsonArray(detailReport.tour_notes as unknown[])}</p>
      </div>
      <div>
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Member feedback</span>
        <p className="mt-0.5 whitespace-pre-wrap">{summarizeJsonArray(detailReport.member_feedback as unknown[])}</p>
      </div>
      <div>
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Facility issues</span>
        <p className="mt-0.5 whitespace-pre-wrap">{summarizeJsonArray(detailReport.facility_issues as unknown[])}</p>
      </div>
      <div>
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Handoff notes</span>
        <p className="mt-0.5 whitespace-pre-wrap">{summarizeJsonArray(detailReport.future_shift_notes as unknown[])}</p>
      </div>
      {detailReport.cafe_notes && (
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Cafe notes</span>
          <p className="mt-0.5">{detailReport.cafe_notes}</p>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <>
        <MobilePageWrapper onRefresh={handleMobileRefresh} className="flex flex-col min-h-0">
          <div className="sticky top-0 z-10 bg-background border-b p-3 space-y-2 shrink-0">
            <div className="flex gap-2">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="flex-1 text-base min-h-[44px]"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="flex-1 text-base min-h-[44px]"
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-base min-h-[44px] rounded-xl"
              />
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-auto p-3 space-y-2">
            {isLoading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="rounded-xl border">
                  <CardContent className="p-4">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="mt-2 h-3 w-32 bg-muted animate-pulse rounded" />
                    <div className="mt-3 h-16 bg-muted animate-pulse rounded" />
                  </CardContent>
                </Card>
              ))
            ) : filteredReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-10 w-10 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">
                  {reports.length === 0 ? "No past reports yet." : "No reports match your search or date range."}
                </p>
              </div>
            ) : (
              filteredReports.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setDetailReport(r)}
                  className="w-full text-left rounded-xl border bg-card shadow-sm p-4 min-h-[44px] transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base font-medium">
                      {format(new Date(r.report_date + "T12:00:00"), "EEE, MMM d")}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {r.shift_type === "AM" ? "AM" : "PM"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{r.staff_name ?? "—"}</p>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {preview(r.management_notes, PREVIEW_LENGTH)}
                  </p>
                </button>
              ))
            )}
          </div>
        </MobilePageWrapper>
        <Sheet open={!!detailReport} onOpenChange={(open) => !open && setDetailReport(null)}>
          <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <SheetHeader>
              <SheetTitle>
                {detailReport && (
                  <>
                    {format(new Date(detailReport.report_date + "T12:00:00"), "EEEE, MMM d")} · {detailReport.shift_type === "AM" ? "AM" : "PM"}
                    {detailReport.submitted_at && (
                      <span className="block text-xs font-normal text-muted-foreground mt-1">
                        Submitted {format(new Date(detailReport.submitted_at), "MMM d, h:mm a")}
                      </span>
                    )}
                  </>
                )}
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-auto px-4 pb-8">{detailContent}</div>
          </SheetContent>
        </Sheet>
      </>
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
                <p className="mt-0.5 whitespace-pre-wrap">{summarizeJsonArray(detailReport.tour_notes as unknown[])}</p>
              </div>
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Member feedback</span>
                <p className="mt-0.5 whitespace-pre-wrap">{summarizeJsonArray(detailReport.member_feedback as unknown[])}</p>
              </div>
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Facility issues</span>
                <p className="mt-0.5 whitespace-pre-wrap">{summarizeJsonArray(detailReport.facility_issues as unknown[])}</p>
              </div>
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Handoff notes</span>
                <p className="mt-0.5 whitespace-pre-wrap">{summarizeJsonArray(detailReport.future_shift_notes as unknown[])}</p>
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

export default PastReportsView;

"use client";

import { useState, useMemo, useCallback } from "react";
import { format, subDays } from "date-fns";
import { getPSTToday } from "@/lib/dateUtils";
import { Search, FileText, ChevronDown } from "lucide-react";
import { useDebounce } from "use-debounce";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSubmittedShiftReports } from "@/hooks/useShiftReports";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobilePageWrapper } from "@/components/mobile/MobilePageWrapper";
import { ReportDetailInline } from "./ReportDetailInline";

const BATCH_SIZE = 30;

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

const DEFAULT_DATE_FROM = (() => {
  const t = getPSTToday();
  const d = new Date(`${t}T12:00:00`);
  d.setDate(d.getDate() - 30);
  return format(d, "yyyy-MM-dd");
})();
const DEFAULT_DATE_TO = getPSTToday();

export function PastReportsView() {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 300);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [dateFrom, setDateFrom] = useState(DEFAULT_DATE_FROM);
  const [dateTo, setDateTo] = useState(DEFAULT_DATE_TO);

  const { data: reports = [], isLoading, refetch } = useSubmittedShiftReports(200);

  const filteredReports = useMemo(() => {
    let out = reports as ReportRow[];
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

  // Group by date, sorted descending, AM before PM within each date
  const groupedReports = useMemo(() => {
    const limited = filteredReports.slice(0, visibleCount);
    const map = new Map<string, ReportRow[]>();
    for (const r of limited) {
      const existing = map.get(r.report_date) ?? [];
      existing.push(r);
      map.set(r.report_date, existing);
    }
    // Sort each group: AM first
    for (const [, arr] of map) {
      arr.sort((a, b) => (a.shift_type === "AM" && b.shift_type !== "AM" ? -1 : a.shift_type !== "AM" && b.shift_type === "AM" ? 1 : 0));
    }
    // Sort dates descending
    const sorted = [...map.entries()].sort(([a], [b]) => b.localeCompare(a));
    return sorted;
  }, [filteredReports, visibleCount]);

  const hasMore = visibleCount < filteredReports.length;

  const handleMobileRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const reportList = (
    <>
      {isLoading ? (
        <div className="space-y-6 py-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-20 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">
            {(reports as ReportRow[]).length === 0
              ? "No past reports yet."
              : "No reports match your search."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedReports.map(([date, items]) => (
            <div key={date}>
              <div className="sticky top-0 z-[5] bg-background/95 backdrop-blur-sm border-b py-2 mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {format(new Date(date + "T12:00:00"), "EEEE, MMM d, yyyy")}
                </h3>
              </div>
              <div className="space-y-4">
                {items.map((r) => (
                  <ReportDetailInline
                    key={r.id}
                    report={r}
                    searchQuery={debouncedSearch.trim()}
                  />
                ))}
              </div>
            </div>
          ))}
          {hasMore && (
            <div className="flex justify-center py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleCount((c) => c + BATCH_SIZE)}
                className="gap-2"
              >
                <ChevronDown className="h-4 w-4" />
                Show more ({filteredReports.length - visibleCount} remaining)
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );

  if (isMobile) {
    return (
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
              onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(BATCH_SIZE); }}
              className="pl-9 text-base min-h-[44px] rounded-xl"
            />
          </div>
          <p className="text-xs text-muted-foreground">{filteredReports.length} report{filteredReports.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex-1 min-h-0 overflow-auto p-3">
          {reportList}
        </div>
      </MobilePageWrapper>
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
            onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(BATCH_SIZE); }}
            className="pl-8 rounded-none"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {filteredReports.length} report{filteredReports.length !== 1 ? "s" : ""}
        </p>
      </div>
      {reportList}
    </div>
  );
}

export default PastReportsView;

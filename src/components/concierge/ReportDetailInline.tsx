import { Badge } from "@/components/ui/badge";

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
  if (!Array.isArray(arr) || arr.length === 0) return "";
  const texts = arr.map(extractItemText).filter(Boolean);
  return texts.length > 0 ? texts.join("\n") : "";
}

type FieldDef = { label: string; value: string };

function getFields(r: ReportRow): FieldDef[] {
  return [
    { label: "Summary", value: r.management_notes ?? "" },
    { label: "Busiest areas", value: r.busiest_areas ?? "" },
    { label: "Tour notes", value: summarizeJsonArray(r.tour_notes) },
    { label: "Member feedback", value: summarizeJsonArray(r.member_feedback) },
    { label: "Facility issues", value: summarizeJsonArray(r.facility_issues) },
    { label: "Systems", value: summarizeJsonArray(r.system_issues) },
    { label: "Handoff notes", value: summarizeJsonArray(r.future_shift_notes) },
    { label: "Café notes", value: r.cafe_notes ?? "" },
  ].filter((f) => f.value.trim().length > 0);
}

interface ReportDetailInlineProps {
  report: ReportRow;
  searchQuery?: string;
}

export function ReportDetailInline({ report, searchQuery }: ReportDetailInlineProps) {
  const fields = getFields(report);
  const q = searchQuery?.toLowerCase() ?? "";

  function highlightText(text: string) {
    if (!q || !text) return text;
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-accent text-accent-foreground rounded-sm px-0.5">{text.slice(idx, idx + q.length)}</mark>
        {text.slice(idx + q.length)}
      </>
    );
  }

  return (
    <div className="py-3 pl-4 border-l-2 border-muted">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline" className="text-[10px] rounded-none">
          {report.shift_type === "AM" ? "AM" : "PM"}
        </Badge>
        <span className="text-sm font-medium">{report.staff_name ?? "—"}</span>
      </div>
      <div className="space-y-2 text-sm">
        {fields.map((f) => (
          <div key={f.label}>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {f.label}
            </span>
            <p className="mt-0.5 whitespace-pre-wrap text-foreground/90">
              {highlightText(f.value)}
            </p>
          </div>
        ))}
        {fields.length === 0 && (
          <p className="text-xs text-muted-foreground italic">No notes recorded.</p>
        )}
      </div>
    </div>
  );
}

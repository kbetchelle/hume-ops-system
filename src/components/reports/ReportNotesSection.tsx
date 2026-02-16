import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DailyReportRow } from "@/hooks/useReports";

function jsonbToText(arr: { text?: string; description?: string }[] | null): string {
  if (!Array.isArray(arr)) return "";
  return arr.map((x) => x.text ?? x.description ?? "").filter(Boolean).join("\n");
}

interface ReportNotesSectionProps {
  report: DailyReportRow | null;
  editable?: boolean;
  onFieldChange?: (field: keyof DailyReportRow, value: unknown) => void;
}

export function ReportNotesSection({ report, editable, onFieldChange }: ReportNotesSectionProps) {
  if (!report) return null;

  const posAm = jsonbToText(report.positive_feedback_am as { text?: string }[] | null);
  const posPm = jsonbToText(report.positive_feedback_pm as { text?: string }[] | null);
  const negAm = jsonbToText(report.negative_feedback_am as { text?: string }[] | null);
  const negPm = jsonbToText(report.negative_feedback_pm as { text?: string }[] | null);
  const facAm = jsonbToText(report.facility_notes_am as { description?: string }[] | null);
  const facPm = jsonbToText(report.facility_notes_pm as { description?: string }[] | null);

  const handleText = (field: keyof DailyReportRow) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onFieldChange?.(field, e.target.value || null);
  };
  const linesToJsonb = (s: string) =>
    s
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean)
      .map((text) => ({ text }));

  return (
    <Card>
      <CardHeader className="py-3">
        <span className="text-sm font-medium">NOTES</span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs">Positive Feedback (AM/PM)</Label>
            {editable ? (
              <>
                <Textarea
                  rows={2}
                  value={posAm}
                  onChange={(e) => onFieldChange?.("positive_feedback_am", linesToJsonb(e.target.value))}
                  placeholder="AM (one per line)"
                />
                <Textarea
                  rows={2}
                  value={posPm}
                  onChange={(e) => onFieldChange?.("positive_feedback_pm", linesToJsonb(e.target.value))}
                  placeholder="PM (one per line)"
                />
              </>
            ) : (
              <pre className="text-xs whitespace-pre-wrap bg-muted/50 p-2 rounded">
                {posAm || "—"}
                {posPm ? `\n${posPm}` : ""}
              </pre>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Negative Feedback (AM/PM)</Label>
            {editable ? (
              <>
                <Textarea
                  rows={2}
                  value={negAm}
                  onChange={(e) => onFieldChange?.("negative_feedback_am", linesToJsonb(e.target.value))}
                  placeholder="AM (one per line)"
                />
                <Textarea
                  rows={2}
                  value={negPm}
                  onChange={(e) => onFieldChange?.("negative_feedback_pm", linesToJsonb(e.target.value))}
                  placeholder="PM (one per line)"
                />
              </>
            ) : (
              <pre className="text-xs whitespace-pre-wrap bg-muted/50 p-2 rounded">
                {negAm || "—"}
                {negPm ? `\n${negPm}` : ""}
              </pre>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs">Facility Notes (AM/PM)</Label>
            {editable ? (
              <>
                <Textarea
                  rows={2}
                  value={facAm}
                  onChange={(e) =>
                    onFieldChange?.(
                      "facility_notes_am",
                      e.target.value.split("\n").map((t) => ({ description: t.trim() })).filter((x) => x.description)
                    )
                  }
                  placeholder="AM (one per line)"
                />
                <Textarea
                  rows={2}
                  value={facPm}
                  onChange={(e) =>
                    onFieldChange?.(
                      "facility_notes_pm",
                      e.target.value.split("\n").map((t) => ({ description: t.trim() })).filter((x) => x.description)
                    )
                  }
                  placeholder="PM (one per line)"
                />
              </>
            ) : (
              <pre className="text-xs whitespace-pre-wrap bg-muted/50 p-2 rounded">
                {facAm || "—"}
                {facPm ? `\n${facPm}` : ""}
              </pre>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Crowd/Space Usage (AM/PM)</Label>
            {editable ? (
              <>
                <Textarea
                  rows={1}
                  value={report.crowd_comments_am ?? ""}
                  onChange={handleText("crowd_comments_am")}
                  placeholder="AM"
                />
                <Textarea
                  rows={1}
                  value={report.crowd_comments_pm ?? ""}
                  onChange={handleText("crowd_comments_pm")}
                  placeholder="PM"
                />
              </>
            ) : (
              <pre className="text-xs whitespace-pre-wrap bg-muted/50 p-2 rounded">
                AM: {report.crowd_comments_am ?? "—"}
                {"\n"}PM: {report.crowd_comments_pm ?? "—"}
              </pre>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs">Tour Notes</Label>
            {editable ? (
              <Textarea
                rows={2}
                value={report.tour_notes ?? ""}
                onChange={handleText("tour_notes")}
              />
            ) : (
              <pre className="text-xs whitespace-pre-wrap bg-muted/50 p-2 rounded">
                {report.tour_notes ?? "—"}
              </pre>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Cancellation Notes</Label>
            {editable ? (
              <Textarea
                rows={2}
                value={report.cancellation_notes ?? ""}
                onChange={handleText("cancellation_notes")}
              />
            ) : (
              <pre className="text-xs whitespace-pre-wrap bg-muted/50 p-2 rounded">
                {report.cancellation_notes ?? "—"}
              </pre>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Notes for Management / Other</Label>
          {editable ? (
            <Textarea
              rows={3}
              value={report.other_notes ?? ""}
              onChange={handleText("other_notes")}
            />
          ) : (
            <pre className="text-xs whitespace-pre-wrap bg-muted/50 p-2 rounded">
              {report.other_notes ?? "—"}
            </pre>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Café Notes</Label>
          {editable ? (
            <Textarea
              rows={2}
              value={report.cafe_notes ?? ""}
              onChange={handleText("cafe_notes")}
            />
          ) : (
            <pre className="text-xs whitespace-pre-wrap bg-muted/50 p-2 rounded">
              {report.cafe_notes ?? "—"}
            </pre>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

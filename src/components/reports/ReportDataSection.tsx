import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DailyReportRow } from "@/hooks/useReports";

function formatMoney(n: number | null | undefined): string {
  if (n == null) return "$0.00";
  return "$" + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

interface ReportDataSectionProps {
  report: DailyReportRow | null;
  editable?: boolean;
  onFieldChange?: (field: keyof DailyReportRow, value: unknown) => void;
}

export function ReportDataSection({ report, editable, onFieldChange }: ReportDataSectionProps) {
  if (!report) return null;

  const num = (v: number | null | undefined) => (v ?? 0);
  const handleNum = (field: keyof DailyReportRow) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === "" ? null : Number(e.target.value);
    onFieldChange?.(field, val);
  };
  const handleText = (field: keyof DailyReportRow) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onFieldChange?.(field, e.target.value || null);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="py-3">
          <span className="text-sm font-medium">DATA</span>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">Weather</Label>
            {editable ? (
              <Input
                value={report.weather ?? ""}
                onChange={handleText("weather")}
                placeholder="e.g. 72°F Clear"
              />
            ) : (
              <p className="text-sm">{report.weather ?? "—"}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Total Gym Check-Ins</Label>
            {editable ? (
              <Input
                type="number"
                value={num(report.total_gym_checkins)}
                onChange={handleNum("total_gym_checkins")}
              />
            ) : (
              <p className="text-sm">{report.total_gym_checkins ?? 0}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Total Class Check-Ins</Label>
            {editable ? (
              <Input
                type="number"
                value={num(report.total_class_checkins)}
                onChange={handleNum("total_class_checkins")}
              />
            ) : (
              <p className="text-sm">{report.total_class_checkins ?? 0}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Private Appointments</Label>
            {editable ? (
              <Input
                type="number"
                value={num(report.private_appointments)}
                onChange={handleNum("private_appointments")}
              />
            ) : (
              <p className="text-sm">{report.private_appointments ?? 0}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3">
          <span className="text-sm font-medium">FINANCIALS</span>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">Gross Sales - Membership</Label>
            {editable ? (
              <Input
                type="number"
                step="0.01"
                value={report.gross_sales_membership ?? ""}
                onChange={(e) =>
                  onFieldChange?.("gross_sales_membership", e.target.value === "" ? null : Number(e.target.value))
                }
              />
            ) : (
              <p className="text-sm">{formatMoney(report.gross_sales_membership)}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Gross Sales - Other</Label>
            {editable ? (
              <Input
                type="number"
                step="0.01"
                value={report.gross_sales_other ?? ""}
                onChange={(e) =>
                  onFieldChange?.("gross_sales_other", e.target.value === "" ? null : Number(e.target.value))
                }
              />
            ) : (
              <p className="text-sm">{formatMoney(report.gross_sales_other)}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Café Sales</Label>
            {editable ? (
              <Input
                type="number"
                step="0.01"
                value={report.cafe_sales ?? ""}
                onChange={(e) =>
                  onFieldChange?.("cafe_sales", e.target.value === "" ? null : Number(e.target.value))
                }
              />
            ) : (
              <p className="text-sm">{formatMoney(report.cafe_sales)}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Total Sales</Label>
            <p className="text-sm font-semibold">{formatMoney(report.total_sales)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

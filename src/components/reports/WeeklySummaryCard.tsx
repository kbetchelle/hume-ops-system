import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { DailyReportRow } from "@/hooks/useReports";

function formatMoney(n: number | null | undefined): string {
  if (n == null) return "$0.00";
  return "$" + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

interface WeeklySummaryCardProps {
  reports: DailyReportRow[];
}

export function WeeklySummaryCard({ reports }: WeeklySummaryCardProps) {
  let totalGym = 0,
    totalClass = 0,
    totalAppts = 0,
    totalSales = 0,
    totalCafe = 0;
  for (const r of reports) {
    totalGym += r.total_gym_checkins ?? 0;
    totalClass += r.total_class_checkins ?? 0;
    totalAppts += r.private_appointments ?? 0;
    totalSales += Number(r.total_sales ?? 0);
    totalCafe += Number(r.cafe_sales ?? 0);
  }

  return (
    <Card>
      <CardHeader className="py-3">
        <span className="text-sm font-medium">Weekly Summary</span>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Gym Check-Ins</p>
            <p className="font-medium">{totalGym}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Class Check-Ins</p>
            <p className="font-medium">{totalClass}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Appointments</p>
            <p className="font-medium">{totalAppts}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Café Sales</p>
            <p className="font-medium">{formatMoney(totalCafe)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Total Sales</p>
            <p className="font-semibold">{formatMoney(totalSales)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

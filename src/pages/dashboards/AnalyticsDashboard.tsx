import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Construction } from "lucide-react";

export default function AnalyticsDashboard() {
  return (
    <DashboardLayout title="Analytics Dashboard">
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
        <Construction className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-sm uppercase tracking-[0.15em] font-normal text-muted-foreground">
          Coming Soon...
        </h2>
      </div>
    </DashboardLayout>
  );
}

import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function AdminDashboard() {
  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-sm uppercase tracking-[0.15em] font-normal">Welcome, Admin</h2>
          <p className="text-xs text-muted-foreground tracking-wide">
            Use the sidebar to navigate to different sections.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

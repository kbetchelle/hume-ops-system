import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function FloaterDashboard() {
  const navigate = useNavigate();
  
  const stats = [
    { title: "Assignments Today", value: "4", change: "2 completed" },
    { title: "Departments", value: "3", change: "Covered this week" },
    { title: "Hours Logged", value: "38", change: "This week" },
    { title: "Tasks Pending", value: "2", change: "Action needed" },
  ];

  return (
    <DashboardLayout title="Floater Dashboard">
      <div className="space-y-16">
        <div className="space-y-2">
          <h2 className="text-sm uppercase tracking-[0.15em] font-normal">Welcome, Floater</h2>
          <p className="text-xs text-muted-foreground tracking-wide">
            View your cross-department assignments and schedules.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.title} className="space-y-2 border-l border-border pl-6">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {stat.title}
              </p>
              <p className="text-2xl font-normal">{stat.value}</p>
              <p className="text-[10px] tracking-wide text-muted-foreground">{stat.change}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <Card 
            className="cursor-pointer hover:opacity-70 transition-opacity duration-300 border border-border"
            onClick={() => navigate("/dashboard/my-checklists")}
          >
            <CardHeader>
              <CardTitle>My Checklists</CardTitle>
              <CardDescription>View and complete today's tasks</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:opacity-70 transition-opacity duration-300 border border-border">
            <CardHeader>
              <CardTitle>All Schedules</CardTitle>
              <CardDescription>View schedules across all departments</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:opacity-70 transition-opacity duration-300 border border-border">
            <CardHeader>
              <CardTitle>My Assignments</CardTitle>
              <CardDescription>Track your current and upcoming assignments</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

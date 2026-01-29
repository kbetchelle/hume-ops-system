import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ManagerDashboard() {
  const navigate = useNavigate();
  
  const stats = [
    { title: "Team Members", value: "24", change: "+2" },
    { title: "Tasks Completed", value: "89%", change: "+12%" },
    { title: "Meetings Today", value: "5", change: "" },
    { title: "Reports Due", value: "3", change: "This week" },
  ];

  return (
    <DashboardLayout title="Manager Dashboard">
      <div className="space-y-16">
        <div className="space-y-2">
          <h2 className="text-sm uppercase tracking-[0.15em] font-normal">Welcome, Manager</h2>
          <p className="text-xs text-muted-foreground tracking-wide">
            Here's your team overview and key metrics.
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

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <Card 
            className="cursor-pointer hover:opacity-70 transition-opacity duration-300 border border-border"
            onClick={() => navigate("/dashboard/members")}
          >
            <CardHeader>
              <CardTitle>Members</CardTitle>
              <CardDescription>View and manage all gym members</CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:opacity-70 transition-opacity duration-300 border border-border"
            onClick={() => navigate("/dashboard/checklists")}
          >
            <CardHeader>
              <CardTitle>Checklists</CardTitle>
              <CardDescription>Create and manage daily checklists for staff</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:opacity-70 transition-opacity duration-300 border border-border">
            <CardHeader>
              <CardTitle>Schedule Overview</CardTitle>
              <CardDescription>Manage staff schedules and shifts</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:opacity-70 transition-opacity duration-300 border border-border">
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>View performance and analytics reports</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

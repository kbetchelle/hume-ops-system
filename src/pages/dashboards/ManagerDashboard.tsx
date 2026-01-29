import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, Calendar, FileText, TrendingUp, Clock } from "lucide-react";

export default function ManagerDashboard() {
  const stats = [
    { title: "Team Members", value: "24", icon: Users, change: "+2" },
    { title: "Tasks Completed", value: "89%", icon: TrendingUp, change: "+12%" },
    { title: "Meetings Today", value: "5", icon: Calendar, change: "" },
    { title: "Reports Due", value: "3", icon: FileText, change: "This week" },
  ];

  return (
    <DashboardLayout 
      title="Manager Dashboard" 
      icon={<BarChart3 className="h-5 w-5 text-primary" />}
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome, Manager</h2>
          <p className="text-muted-foreground">
            Here's your team overview and key metrics.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Schedule Overview</CardTitle>
              </div>
              <CardDescription>Manage staff schedules and shifts</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">View and manage team schedules</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Reports</CardTitle>
              </div>
              <CardDescription>View performance and analytics reports</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Access detailed team reports</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

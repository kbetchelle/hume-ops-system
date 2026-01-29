import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Calendar, MapPin, Clock, CheckCircle2, AlertCircle } from "lucide-react";

export default function FloaterDashboard() {
  const stats = [
    { title: "Assignments Today", value: "4", icon: Calendar, change: "2 completed" },
    { title: "Departments", value: "3", icon: MapPin, change: "Covered this week" },
    { title: "Hours Logged", value: "38", icon: Clock, change: "This week" },
    { title: "Tasks Pending", value: "2", icon: AlertCircle, change: "Action needed" },
  ];

  return (
    <DashboardLayout 
      title="Floater Dashboard" 
      icon={<RefreshCw className="h-5 w-5 text-primary" />}
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome, Floater</h2>
          <p className="text-muted-foreground">
            View your cross-department assignments and schedules.
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
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">All Schedules</CardTitle>
              </div>
              <CardDescription>View schedules across all departments</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">My Assignments</CardTitle>
              </div>
              <CardDescription>Track your current and upcoming assignments</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

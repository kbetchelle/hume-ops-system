import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Users, Shield, Settings, BarChart3, Bell } from "lucide-react";

export default function AdminDashboard() {
  const stats = [
    { title: "Total Users", value: "156", icon: Users, change: "+12%" },
    { title: "Active Sessions", value: "42", icon: BarChart3, change: "+5%" },
    { title: "Pending Requests", value: "8", icon: Bell, change: "-2%" },
    { title: "System Health", value: "99.9%", icon: Shield, change: "Stable" },
  ];

  return (
    <DashboardLayout 
      title="Admin Dashboard" 
      icon={<Crown className="h-5 w-5 text-primary" />}
    >
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome, Admin</h2>
          <p className="text-muted-foreground">
            Here's an overview of your system.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Manage Users</CardTitle>
              </div>
              <CardDescription>
                Add, edit, or remove user accounts and their roles
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Role Permissions</CardTitle>
              </div>
              <CardDescription>
                Configure permissions for each role in the system
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">System Settings</CardTitle>
              </div>
              <CardDescription>
                Configure global settings and preferences
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

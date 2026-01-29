import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboard() {
  const stats = [
    { title: "Total Users", value: "156", change: "+12%" },
    { title: "Active Sessions", value: "42", change: "+5%" },
    { title: "Pending Requests", value: "8", change: "-2%" },
    { title: "System Health", value: "99.9%", change: "Stable" },
  ];

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-16">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h2 className="text-sm uppercase tracking-[0.15em] font-normal">Welcome, Admin</h2>
          <p className="text-xs text-muted-foreground tracking-wide">
            Here's an overview of your system.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.title} className="space-y-2 border-l border-border pl-6">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {stat.title}
              </p>
              <p className="text-2xl font-normal">{stat.value}</p>
              <p className="text-[10px] tracking-wide text-muted-foreground">
                {stat.change} from last month
              </p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="cursor-pointer hover:opacity-70 transition-opacity duration-300 border border-border">
            <CardHeader>
              <CardTitle>Manage Users</CardTitle>
              <CardDescription>
                Add, edit, or remove user accounts and their roles
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:opacity-70 transition-opacity duration-300 border border-border">
            <CardHeader>
              <CardTitle>Role Permissions</CardTitle>
              <CardDescription>
                Configure permissions for each role in the system
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:opacity-70 transition-opacity duration-300 border border-border">
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
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

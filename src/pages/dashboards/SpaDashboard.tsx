import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SpaDashboard() {
  const stats = [
    { title: "Appointments Today", value: "8", change: "4 remaining" },
    { title: "Clients Served", value: "124", change: "This month" },
    { title: "Average Session", value: "75 min", change: "" },
    { title: "Satisfaction", value: "4.9", change: "⭐ rating" },
  ];

  return (
    <DashboardLayout title="Spa Attendant Dashboard">
      <div className="space-y-16">
        <div className="space-y-2">
          <h2 className="text-sm uppercase tracking-[0.15em] font-normal">Welcome, Spa Attendant</h2>
          <p className="text-xs text-muted-foreground tracking-wide">
            Manage treatments and spa appointments.
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

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="cursor-pointer hover:opacity-70 transition-opacity duration-300 border border-border">
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
              <CardDescription>View your appointments for today</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:opacity-70 transition-opacity duration-300 border border-border">
            <CardHeader>
              <CardTitle>Treatments</CardTitle>
              <CardDescription>Manage available spa treatments</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:opacity-70 transition-opacity duration-300 border border-border">
            <CardHeader>
              <CardTitle>Client Preferences</CardTitle>
              <CardDescription>View client notes and preferences</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

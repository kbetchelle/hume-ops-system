import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ConciergeDashboard() {
  const stats = [
    { title: "Active Guests", value: "45", change: "Currently on site" },
    { title: "Pending Requests", value: "12", change: "Awaiting action" },
    { title: "Bookings Today", value: "28", change: "+5 from yesterday" },
    { title: "Messages", value: "8", change: "Unread" },
  ];

  return (
    <DashboardLayout title="Concierge Dashboard">
      <div className="space-y-16">
        <div className="space-y-2">
          <h2 className="text-sm uppercase tracking-[0.15em] font-normal">Welcome, Concierge</h2>
          <p className="text-xs text-muted-foreground tracking-wide">
            Manage guest services and bookings.
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
              <CardTitle>Manage Bookings</CardTitle>
              <CardDescription>Create, view, and manage guest bookings</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:opacity-70 transition-opacity duration-300 border border-border">
            <CardHeader>
              <CardTitle>Guest Requests</CardTitle>
              <CardDescription>Handle incoming guest requests</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:opacity-70 transition-opacity duration-300 border border-border">
            <CardHeader>
              <CardTitle>Local Services</CardTitle>
              <CardDescription>Access local services and recommendations</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

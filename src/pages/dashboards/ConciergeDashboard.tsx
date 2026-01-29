import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Users, Calendar, MessageSquare, Phone, MapPin } from "lucide-react";

export default function ConciergeDashboard() {
  const stats = [
    { title: "Active Guests", value: "45", icon: Users, change: "Currently on site" },
    { title: "Pending Requests", value: "12", icon: Bell, change: "Awaiting action" },
    { title: "Bookings Today", value: "28", icon: Calendar, change: "+5 from yesterday" },
    { title: "Messages", value: "8", icon: MessageSquare, change: "Unread" },
  ];

  return (
    <DashboardLayout 
      title="Concierge Dashboard" 
      icon={<Bell className="h-5 w-5 text-primary" />}
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome, Concierge</h2>
          <p className="text-muted-foreground">
            Manage guest services and bookings.
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Manage Bookings</CardTitle>
              </div>
              <CardDescription>Create, view, and manage guest bookings</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Guest Requests</CardTitle>
              </div>
              <CardDescription>Handle incoming guest requests</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Local Services</CardTitle>
              </div>
              <CardDescription>Access local services and recommendations</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

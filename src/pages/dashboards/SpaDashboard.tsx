import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Calendar, Users, Clock, Heart, Droplets } from "lucide-react";

export default function SpaDashboard() {
  const stats = [
    { title: "Appointments Today", value: "8", icon: Calendar, change: "4 remaining" },
    { title: "Clients Served", value: "124", icon: Users, change: "This month" },
    { title: "Average Session", value: "75 min", icon: Clock, change: "" },
    { title: "Satisfaction", value: "4.9", icon: Heart, change: "⭐ rating" },
  ];

  return (
    <DashboardLayout 
      title="Spa Attendant Dashboard" 
      icon={<Sparkles className="h-5 w-5 text-primary" />}
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome, Spa Attendant</h2>
          <p className="text-muted-foreground">
            Manage treatments and spa appointments.
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
                <CardTitle className="text-lg">Today's Schedule</CardTitle>
              </div>
              <CardDescription>View your appointments for today</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Treatments</CardTitle>
              </div>
              <CardDescription>Manage available spa treatments</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Client Preferences</CardTitle>
              </div>
              <CardDescription>View client notes and preferences</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

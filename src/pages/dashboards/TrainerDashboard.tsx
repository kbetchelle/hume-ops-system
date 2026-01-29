import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, Users, Calendar, Clock, Target, Award } from "lucide-react";

export default function TrainerDashboard() {
  const stats = [
    { title: "Sessions Today", value: "6", icon: Calendar, change: "3 completed" },
    { title: "Active Clients", value: "18", icon: Users, change: "+2 this week" },
    { title: "Hours Logged", value: "32", icon: Clock, change: "This week" },
    { title: "Goals Achieved", value: "12", icon: Target, change: "By clients" },
  ];

  return (
    <DashboardLayout 
      title="Trainer Dashboard" 
      icon={<Dumbbell className="h-5 w-5 text-primary" />}
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome, Trainer</h2>
          <p className="text-muted-foreground">
            Manage your training sessions and clients.
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
                <CardTitle className="text-lg">Training Schedule</CardTitle>
              </div>
              <CardDescription>View and manage your training sessions</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Client Progress</CardTitle>
              </div>
              <CardDescription>Track client fitness goals and achievements</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

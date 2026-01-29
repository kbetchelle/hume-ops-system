import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TrainerDashboard() {
  const stats = [
    { title: "Sessions Today", value: "6", change: "3 completed" },
    { title: "Active Clients", value: "18", change: "+2 this week" },
    { title: "Hours Logged", value: "32", change: "This week" },
    { title: "Goals Achieved", value: "12", change: "By clients" },
  ];

  return (
    <DashboardLayout title="Trainer Dashboard">
      <div className="space-y-16">
        <div className="space-y-2">
          <h2 className="text-sm uppercase tracking-[0.15em] font-normal">Welcome, Trainer</h2>
          <p className="text-xs text-muted-foreground tracking-wide">
            Manage your training sessions and clients.
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

        <div className="grid gap-8 md:grid-cols-2">
          <Card className="cursor-pointer hover:opacity-70 transition-opacity duration-300 border border-border">
            <CardHeader>
              <CardTitle>Training Schedule</CardTitle>
              <CardDescription>View and manage your training sessions</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:opacity-70 transition-opacity duration-300 border border-border">
            <CardHeader>
              <CardTitle>Client Progress</CardTitle>
              <CardDescription>Track client fitness goals and achievements</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

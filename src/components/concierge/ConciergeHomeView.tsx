import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentShift } from "@/hooks/useCurrentShift";
import { WhosWorkingView } from "./WhosWorkingView";
import { ShiftEventsMiniCalendar } from "./ShiftEventsMiniCalendar";
import { ConciergeChecklistView } from "@/components/checklists/concierge/ConciergeChecklistView";
import type { ConciergeView } from "./ConciergeSidebar";

interface ConciergeHomeViewProps {
  onNavigate: (view: ConciergeView) => void;
}

export function ConciergeHomeView({ onNavigate }: ConciergeHomeViewProps) {
  const { currentShift, shiftStartTime, shiftEndTime } = useCurrentShift();

  const stats = [
    { title: "Active Guests", value: "45", change: "Currently on site" },
    { title: "Pending Requests", value: "12", change: "Awaiting action" },
    { title: "Bookings Today", value: "28", change: "+5 from yesterday" },
    { title: "Messages", value: "8", change: "Unread" },
  ];

  const quickActions = [
    {
      id: "report" as const,
      title: "Shift Report",
      description: `Complete your ${currentShift} shift report (${shiftStartTime} - ${shiftEndTime})`,
    },
    {
      id: "messages" as const,
      title: "Member Communications",
      description: "View member history and send emails",
    },
    {
      id: "announcements" as const,
      title: "Announcements",
      description: "View announcements and documents",
    },
  ];

  return (
    <div className="space-y-12 p-6 md:p-8">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h2 className="text-sm uppercase tracking-[0.15em] font-normal">
          Welcome, Concierge
        </h2>
        <p className="text-xs text-muted-foreground tracking-wide">
          {currentShift} Shift • {shiftStartTime} - {shiftEndTime}
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
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      {/* Main Content Grid: Quick Actions + Sidebar Widgets */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Quick Actions - 2 columns on large screens */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Quick Actions
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            {quickActions.map((action) => (
              <Card
                key={action.id}
                className="cursor-pointer hover:opacity-70 transition-opacity duration-300 border border-border rounded-none"
                onClick={() => onNavigate(action.id)}
              >
                <CardHeader className="p-4">
                  <CardTitle className="text-sm font-normal tracking-wide">
                    {action.title}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {action.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar Widgets - 1 column on large screens */}
        <div className="space-y-6">
          <ConciergeChecklistView />
          <ShiftEventsMiniCalendar />
          <WhosWorkingView />
        </div>
      </div>
    </div>
  );
}

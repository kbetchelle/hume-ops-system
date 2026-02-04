import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { useUserProfile } from "@/hooks/useUserRoles";
import { DevDashboardPanel } from "@/components/admin/DevDashboardPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, BarChart3, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ManagerDashboard() {
  const { user } = useAuthContext();
  const { data: profile } = useUserProfile(user?.id);
  const navigate = useNavigate();

  const getFirstName = (fullName: string | null | undefined) => {
    if (!fullName) return "there";
    return fullName.split(" ")[0];
  };

  const quickLinks = [
    {
      title: "Master Calendar",
      description: "View all tours, classes, and staff shifts",
      icon: Calendar,
      href: "/dashboard/master-calendar",
    },
    {
      title: "Members",
      description: "Manage clients and memberships",
      icon: Users,
      href: "/dashboard/members/all-clients",
    },
    {
      title: "Analytics",
      description: "View reports and metrics",
      icon: BarChart3,
      href: "/dashboard/analytics",
    },
    {
      title: "Facility",
      description: "Manage facility operations",
      icon: Settings,
      href: "/dashboard/facility",
    },
  ];

  return (
    <DashboardLayout title="Manager Dashboard">
      <div className="flex flex-col h-full p-6 md:p-8">
        <div className="text-center mb-6">
          <h2 className="text-sm uppercase tracking-[0.15em] font-normal text-muted-foreground">
            Welcome back, {getFirstName(profile?.full_name)}
          </h2>
        </div>
        
        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Card
                key={link.href}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => navigate(link.href)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-sm">{link.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{link.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex-1 min-h-0">
          <DevDashboardPanel />
        </div>
      </div>
    </DashboardLayout>
  );
}

import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Wine, Package } from "lucide-react";
import { CafeChecklistView } from "@/components/checklists/cafe/CafeChecklistView";

export default function CafeDashboard() {
  const navigate = useNavigate();
  
  return (
    <DashboardLayout title="Cafe Dashboard">
      <div className="space-y-6">
        {/* Today's Checklist */}
        <CafeChecklistView />

        {/* Quick Links */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card 
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => navigate("/dashboard/package-tracking")}
          >
            <CardHeader>
              <Package className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Package Tracking</CardTitle>
              <CardDescription>
                Scan and manage incoming packages
              </CardDescription>
            </CardHeader>
          </Card>
          <Card 
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => navigate("/dashboard/cafe/event-drinks")}
          >
            <CardHeader>
              <Wine className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Event Drinks</CardTitle>
              <CardDescription>
                Plan and track drinks for upcoming events
              </CardDescription>
            </CardHeader>
          </Card>
          <Card 
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => navigate("/dashboard/communications")}
          >
            <CardHeader>
              <MessageSquare className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Communications</CardTitle>
              <CardDescription>
                View announcements and updates
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

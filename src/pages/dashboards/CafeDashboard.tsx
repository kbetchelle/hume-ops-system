import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Wine } from "lucide-react";
import { CafeChecklistView } from "@/components/checklists/cafe/CafeChecklistView";
import { useCurrentShift } from "@/hooks/useCurrentShift";
import { cn } from "@/lib/utils";

export default function CafeDashboard() {
  const navigate = useNavigate();
  const { currentShift, toggleShift, isManualOverride } = useCurrentShift();

  return (
    <DashboardLayout title="Cafe Dashboard">
      <div className="space-y-6">
        {/* Shift toggle for cafe: AM / PM */}
        <div className="flex items-center gap-2" data-walkthrough="cafe-shift-toggle">
          <span className="text-sm uppercase tracking-widest text-muted-foreground">Shift</span>
          <div className="flex rounded-none border border-border bg-muted/30 p-0.5">
            <Button
              variant={currentShift === "AM" ? "default" : "ghost"}
              size="sm"
              className={cn("rounded-none text-xs uppercase tracking-widest", currentShift === "AM" && "bg-primary")}
              onClick={() => currentShift !== "AM" && toggleShift()}
            >
              AM
            </Button>
            <Button
              variant={currentShift === "PM" ? "default" : "ghost"}
              size="sm"
              className={cn("rounded-none text-xs uppercase tracking-widest", currentShift === "PM" && "bg-primary")}
              onClick={() => currentShift !== "PM" && toggleShift()}
            >
              PM
            </Button>
          </div>
          {isManualOverride && (
            <span className="text-xs text-muted-foreground">Manual</span>
          )}
        </div>

        {/* Today's Checklist */}
        <CafeChecklistView />

        {/* Quick Links */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

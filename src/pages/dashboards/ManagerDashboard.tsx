import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ManagerDashboard() {
  const navigate = useNavigate();

  return (
    <DashboardLayout title="Manager Dashboard">
      <div className="space-y-12">
        {/* Quick Access Cards - Same layout as Admin */}
        <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          <Card 
            className="cursor-pointer hover:opacity-70 transition-opacity duration-300 border border-border"
            onClick={() => navigate("/dashboard/members")}
          >
            <CardHeader>
              <CardTitle>Members</CardTitle>
              <CardDescription>View and manage all gym members</CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:opacity-70 transition-opacity duration-300 border border-border"
            onClick={() => navigate("/dashboard/checklists")}
          >
            <CardHeader>
              <CardTitle>Checklists</CardTitle>
              <CardDescription>Create and manage daily checklists for staff</CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:opacity-70 transition-opacity duration-300 border border-border"
            onClick={() => navigate("/dashboard/communications")}
          >
            <CardHeader>
              <CardTitle>Communications</CardTitle>
              <CardDescription>Announcements and document library</CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:opacity-70 transition-opacity duration-300 border border-border"
            onClick={() => navigate("/dashboard/analytics")}
          >
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>Member growth and trainer metrics</CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:opacity-70 transition-opacity duration-300 border border-border"
            onClick={() => navigate("/dashboard/reports")}
          >
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>Member activity reports and analytics</CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:opacity-70 transition-opacity duration-300 border border-border"
            onClick={() => navigate("/dashboard/facility")}
          >
            <CardHeader>
              <CardTitle>Facility</CardTitle>
              <CardDescription>Manage assets, expenses, and maintenance</CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="cursor-pointer hover:opacity-70 transition-opacity duration-300 border border-border"
            onClick={() => navigate("/dashboard/staff-announcements")}
          >
            <CardHeader>
              <CardTitle>Staff Announcements</CardTitle>
              <CardDescription>Create and manage announcements for staff</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

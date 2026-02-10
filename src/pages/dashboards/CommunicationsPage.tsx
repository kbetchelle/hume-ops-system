import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AnnouncementsBoard } from "@/components/concierge/AnnouncementsBoard";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Megaphone } from "lucide-react";

export default function CommunicationsPage() {
  const { user } = useAuthContext();
  const { data: userRoles = [] } = useUserRoles(user?.id);
  const isManager = userRoles.some((r) => r.role === "admin" || r.role === "manager");

  return (
    <DashboardLayout title="Communications">
      <div className="p-4 md:p-8 max-w-3xl space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm uppercase tracking-[0.15em] font-normal">
            Announcements
          </h2>
          {isManager && (
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard/staff-announcements" className="gap-2">
                <Megaphone className="h-4 w-4" />
                Manage announcements
              </Link>
            </Button>
          )}
        </div>
        <AnnouncementsBoard />
      </div>
    </DashboardLayout>
  );
}

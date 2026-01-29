import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { data: users, isLoading, error } = useAdminUsers();

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-12">
        {/* Quick Access Cards */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
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
            onClick={() => navigate("/dashboard/manager")}
          >
            <CardHeader>
              <CardTitle>Manager View</CardTitle>
              <CardDescription>Access manager dashboard and tools</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-sm uppercase tracking-[0.15em] font-normal">User Management</h2>
          <p className="text-xs text-muted-foreground tracking-wide">
            Manage users, roles, and access permissions.
          </p>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-[10px] uppercase tracking-widest text-destructive">
              Failed to load users
            </p>
            <p className="text-xs text-muted-foreground tracking-wide mt-2">
              {error instanceof Error ? error.message : "An error occurred"}
            </p>
          </div>
        ) : users && users.length > 0 ? (
          <UserManagementTable users={users} currentUserId={user?.id} />
        ) : (
          <div className="text-center py-16 border border-border">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              No users found
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

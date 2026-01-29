import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { Loader2 } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuthContext();
  const { data: users, isLoading, error } = useAdminUsers();

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="space-y-12">
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

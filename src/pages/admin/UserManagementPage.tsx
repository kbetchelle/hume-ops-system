import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { SlingUserLinkingTable } from "@/components/admin/SlingUserLinkingTable";
import { AccountApprovalsSection } from "@/components/admin/AccountApprovalsSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { usePendingApprovalsCount } from "@/hooks/useAccountApproval";
import { Badge } from "@/components/ui/badge";

export default function UserManagementPage() {
  const { user } = useAuthContext();
  const { data: users, isLoading, error } = useAdminUsers();
  const pendingApprovalsCount = usePendingApprovalsCount();

  return (
    <DashboardLayout title="User Management">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-sm uppercase tracking-[0.15em] font-normal">User Management</h2>
          <p className="text-xs text-muted-foreground tracking-wide">
            Manage users, roles, and Sling account linking.
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="approvals" className="space-y-6">
          <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-6 h-auto p-0">
            <TabsTrigger
              value="approvals"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent text-[10px] uppercase tracking-widest px-0 pb-3"
            >
              <div className="flex items-center gap-2">
                Pending Approvals
                {pendingApprovalsCount > 0 && (
                  <Badge variant="destructive" className="rounded-full h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                    {pendingApprovalsCount}
                  </Badge>
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent text-[10px] uppercase tracking-widest px-0 pb-3"
            >
              Users & Roles
            </TabsTrigger>
            <TabsTrigger
              value="sling"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent text-[10px] uppercase tracking-widest px-0 pb-3"
            >
              Sling Linking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="approvals" className="mt-6">
            <AccountApprovalsSection />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
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
          </TabsContent>

          <TabsContent value="sling" className="mt-6">
            <SlingUserLinkingTable />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

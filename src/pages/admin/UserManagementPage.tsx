import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { SlingUserLinkingTable } from "@/components/admin/SlingUserLinkingTable";
import { AccountApprovalsSection } from "@/components/admin/AccountApprovalsSection";
import { CreateFromSlingTable } from "@/components/admin/CreateFromSlingTable";
import { TargetGroupsTable } from "@/components/admin/TargetGroupsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { usePendingApprovalsCount } from "@/hooks/useAccountApproval";
import { Badge } from "@/components/ui/badge";

const VALID_TABS = ["users", "create-from-sling", "approvals", "sling", "target-groups"] as const;

export default function UserManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const initialTab = VALID_TABS.includes(tabFromUrl as (typeof VALID_TABS)[number])
    ? (tabFromUrl as (typeof VALID_TABS)[number])
    : "users";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && VALID_TABS.includes(t as (typeof VALID_TABS)[number])) {
      setActiveTab(t as (typeof VALID_TABS)[number]);
    }
  }, [searchParams]);

  const { user } = useAuthContext();
  const { data: users, isLoading, error } = useAdminUsers();
  const pendingApprovalsCount = usePendingApprovalsCount();

  const onTabChange = (value: string) => {
    setActiveTab(value as (typeof VALID_TABS)[number]);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === "users") next.delete("tab");
      else next.set("tab", value);
      return next;
    });
  };

  return (
    <DashboardLayout title="User Management">
      <div className="space-y-8">

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-6">
          <TabsList className="w-full">
            <TabsTrigger value="users">
              Users & Roles
            </TabsTrigger>
            <TabsTrigger value="create-from-sling">
              Create from Sling
            </TabsTrigger>
            <TabsTrigger value="approvals">
              <div className="flex items-center gap-2">
                Pending Approvals
                {pendingApprovalsCount > 0 && (
                  <span className="h-5 w-5 flex items-center justify-center p-0 text-[10px] text-white" style={{ backgroundColor: '#e03a3c' }}>
                    {pendingApprovalsCount}
                  </span>
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger value="sling">
              Sling Linking
            </TabsTrigger>
            <TabsTrigger value="target-groups">
              Target Groups
            </TabsTrigger>
          </TabsList>

          <TabsContent value="approvals" className="mt-6 space-y-4">
            <p className="text-xs text-muted-foreground tracking-wide border border-border p-3">These people have tried to 'Create an Account' on the login page, use caution in approving these. Create from Sling is preferred.</p>
            <AccountApprovalsSection />
          </TabsContent>

          <TabsContent value="users" className="mt-6 space-y-4">
            <p className="text-xs text-muted-foreground tracking-wide border border-border p-3">These accounts are active or pending. Pending accounts have not yet been logged into by the user using their username/email and the default password.</p>
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

          <TabsContent value="sling" className="mt-6 space-y-4">
            <p className="text-xs text-muted-foreground tracking-wide border border-border p-3">If Account created from Pending Approvals and later added to sling users, link the employee to their sling account on this page.</p>
            <SlingUserLinkingTable />
          </TabsContent>

          <TabsContent value="create-from-sling" className="mt-6 space-y-4">
            <p className="text-xs text-muted-foreground tracking-wide border border-border p-3">Create users here. Employee should exist in sling and will be synced to appear here, create their account and username and their account will become PENDING with the default password. If user not appearing, go in Manager Role View navigation menu to Dev Tools → API Syncing → Sling Users → SYNC</p>
            <CreateFromSlingTable />
          </TabsContent>

          <TabsContent value="target-groups" className="mt-6 space-y-4">
            <p className="text-xs text-muted-foreground tracking-wide border border-border p-3">Add new employees to Messaging and Announcement groups here.</p>
            <TargetGroupsTable />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

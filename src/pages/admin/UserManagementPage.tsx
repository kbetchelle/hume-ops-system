import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { SlingUserLinkingTable } from "@/components/admin/SlingUserLinkingTable";
import { AccountApprovalsSection } from "@/components/admin/AccountApprovalsSection";
import { CreateFromSlingTable } from "@/components/admin/CreateFromSlingTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { usePendingApprovalsCount } from "@/hooks/useAccountApproval";
import { Badge } from "@/components/ui/badge";

const VALID_TABS = ["users", "approvals", "sling", "create-from-sling"] as const;

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
          <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-6 h-auto p-0 flex-nowrap overflow-x-auto min-h-0">
            <TabsTrigger
              value="users"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent text-[10px] uppercase tracking-widest px-0 pb-3 shrink-0"
            >
              Users & Roles
            </TabsTrigger>
            <TabsTrigger
              value="approvals"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent text-[10px] uppercase tracking-widest px-0 pb-3 shrink-0"
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
              value="sling"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent text-[10px] uppercase tracking-widest px-0 pb-3 shrink-0"
            >
              Sling Linking
            </TabsTrigger>
            <TabsTrigger
              value="create-from-sling"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent text-[10px] uppercase tracking-widest px-0 pb-3 shrink-0"
            >
              Create from Sling
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

          <TabsContent value="create-from-sling" className="mt-6">
            <CreateFromSlingTable />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

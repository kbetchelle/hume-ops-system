import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { useUserProfile } from "@/hooks/useUserRoles";
import { useActiveRole } from "@/hooks/useActiveRole";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings, ChevronDown, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { ROLES, AppRole } from "@/types/roles";
import humeLogo from "@/assets/hume-logo.png";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { MembersSidebar } from "./MembersSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

interface MembersLayoutProps {
  children: ReactNode;
  title: string;
}

function RoleSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeRole, setActiveRole, availableRoles, getRoleLabel } = useActiveRole();

  // Detect which role view is currently being displayed based on the URL path
  const getCurrentViewRole = (): AppRole | null => {
    const path = location.pathname;
    if (path.includes("/dashboard/admin")) return "admin";
    if (path.includes("/dashboard/manager")) return "manager";
    if (path.includes("/dashboard/concierge")) return "concierge";
    if (path.includes("/dashboard/trainer")) return "trainer";
    if (path.includes("/dashboard/spa")) return "female_spa_attendant";
    if (path.includes("/dashboard/floater")) return "floater";
    if (path.includes("/dashboard/cafe")) return "cafe";
    return activeRole;
  };

  const currentViewRole = getCurrentViewRole();

  if (availableRoles.length <= 1) {
    return (
      <Badge variant="outline" className="text-[10px] uppercase tracking-widest">
        {currentViewRole ? getRoleLabel(currentViewRole) : "No Role"}
      </Badge>
    );
  }

  const handleRoleSwitch = (role: AppRole) => {
    setActiveRole(role);
    const paths: Record<AppRole, string> = {
      admin: "/dashboard/admin",
      manager: "/dashboard/manager",
      concierge: "/dashboard/concierge",
      trainer: "/dashboard/trainer",
      female_spa_attendant: "/dashboard/spa",
      male_spa_attendant: "/dashboard/spa",
      cafe: "/dashboard/cafe",
      floater: "/dashboard/floater",
    };
    navigate(paths[role]);
    toast.success(`Switched to ${getRoleLabel(role)} view`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2">
          <ArrowLeftRight className="h-4 w-4" />
          <span className="text-[10px] uppercase tracking-widest">
            {currentViewRole ? getRoleLabel(currentViewRole) : "Select Role"}
          </span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 rounded-none">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Switch Role
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableRoles.map((userRole) => {
          const isCurrentView = currentViewRole === userRole.role || 
            (currentViewRole === "female_spa_attendant" && userRole.role === "male_spa_attendant") ||
            (currentViewRole === "male_spa_attendant" && userRole.role === "female_spa_attendant");
          return (
            <DropdownMenuItem
              key={userRole.id}
              onClick={() => handleRoleSwitch(userRole.role)}
              className={cn(
                "text-[10px] uppercase tracking-widest cursor-pointer",
                isCurrentView && "bg-muted"
              )}
            >
              {getRoleLabel(userRole.role)}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MembersHeader({ title }: { title: string }) {
  const navigate = useNavigate();
  const { user, signOut } = useAuthContext();
  const { data: profile } = useUserProfile(user?.id);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out");
      navigate("/");
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <img 
            src={humeLogo} 
            alt="Hume" 
            className="h-4 w-auto cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => navigate("/dashboard")}
          />
          <div className="h-4 w-px bg-border" />
          <h1 className="text-[10px] uppercase tracking-widest font-normal">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <RoleSwitcher />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="text-[10px] uppercase tracking-widest">
                  {getInitials(profile?.full_name)}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-none border-border bg-background" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-[10px] uppercase tracking-widest font-normal">
                    {profile?.full_name || "User"}
                  </p>
                  <p className="text-[10px] tracking-wide text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem 
                onClick={() => navigate("/profile")}
                className="text-[10px] uppercase tracking-widest cursor-pointer hover:bg-secondary rounded-none"
              >
                <User className="mr-2 h-3 w-3" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate("/settings")}
                className="text-[10px] uppercase tracking-widest cursor-pointer hover:bg-secondary rounded-none"
              >
                <Settings className="mr-2 h-3 w-3" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem 
                onClick={handleSignOut} 
                className="text-[10px] uppercase tracking-widest cursor-pointer hover:bg-secondary rounded-none"
              >
                <LogOut className="mr-2 h-3 w-3" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export function MembersLayout({ children, title }: MembersLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <MembersSidebar />
        <div className="flex flex-col flex-1">
          <MembersHeader title={title} />
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

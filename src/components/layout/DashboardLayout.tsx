import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { useUserProfile } from "@/hooks/useUserRoles";
import { useActiveRole } from "@/hooks/useActiveRole";
import { usePermissions, PERMISSIONS } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { 
  LogOut, 
  User, 
  Settings, 
  ChevronDown,
  Users,
  ClipboardList,
  MessageSquare,
  BarChart3,
  Dumbbell,
  Calendar,
  FileText,
  Building,
  Home,
  Bell,
  Briefcase,
  Menu
} from "lucide-react";
import { toast } from "sonner";
import { ROLES, AppRole } from "@/types/roles";
import humeLogo from "@/assets/hume-logo.png";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  permission?: string;
  roles?: AppRole[];
}

// Navigation items per role
const getNavItems = (role: AppRole | null, permissions: string[]): NavItem[] => {
  const baseItems: NavItem[] = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
  ];

  const allItems: NavItem[] = [
    { 
      title: "Members", 
      url: "/dashboard/members", 
      icon: Users,
      permission: PERMISSIONS.VIEW_MEMBERS 
    },
    { 
      title: "Training Plans", 
      url: "/dashboard/training-plans", 
      icon: Dumbbell,
      permission: PERMISSIONS.VIEW_TRAINING_PLANS 
    },
    { 
      title: "Checklists", 
      url: "/dashboard/checklists", 
      icon: ClipboardList,
      permission: PERMISSIONS.MANAGE_CHECKLISTS 
    },
    { 
      title: "My Checklists", 
      url: "/dashboard/my-checklists", 
      icon: ClipboardList,
      roles: ["concierge", "female_spa_attendant", "male_spa_attendant", "floater"]
    },
    { 
      title: "Communications", 
      url: "/dashboard/communications", 
      icon: Bell,
    },
    { 
      title: "Member Communications", 
      url: "/dashboard/member-communications", 
      icon: MessageSquare,
      roles: ["admin", "manager", "concierge", "trainer"]
    },
    { 
      title: "Shift Report", 
      url: "/dashboard/shift-report", 
      icon: FileText,
      roles: ["admin", "manager", "concierge"]
    },
    { 
      title: "Reports", 
      url: "/dashboard/reports", 
      icon: BarChart3,
      permission: PERMISSIONS.VIEW_REPORTS 
    },
    { 
      title: "Analytics", 
      url: "/dashboard/analytics", 
      icon: BarChart3,
      permission: PERMISSIONS.VIEW_ANALYTICS 
    },
    { 
      title: "Facility", 
      url: "/dashboard/facility", 
      icon: Building,
      permission: PERMISSIONS.VIEW_FACILITY 
    },
    { 
      title: "Admin", 
      url: "/dashboard/admin", 
      icon: Briefcase,
      roles: ["admin"]
    },
  ];

  // Filter items based on permissions and roles
  const filteredItems = allItems.filter(item => {
    if (item.permission && !permissions.includes(item.permission)) {
      return false;
    }
    if (item.roles && role && !item.roles.includes(role)) {
      return false;
    }
    return true;
  });

  return [...baseItems, ...filteredItems];
};

function SidebarNav() {
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { activeRole } = useActiveRole();
  const { permissions } = usePermissions();

  const navItems = getNavItems(activeRole, permissions);

  return (
    <Sidebar 
      className={cn(
        "border-r border-border bg-background transition-all duration-300",
        collapsed ? "w-14" : "w-60"
      )}
      collapsible="icon"
    >
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupLabel className={cn(
            "text-[10px] uppercase tracking-widest text-muted-foreground px-3",
            collapsed && "sr-only"
          )}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/dashboard"}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-xs uppercase tracking-widest transition-colors",
                        "hover:bg-muted/50"
                      )}
                      activeClassName="bg-muted text-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function RoleSwitcher() {
  const navigate = useNavigate();
  const { activeRole, setActiveRole, availableRoles, getRoleLabel } = useActiveRole();

  if (availableRoles.length <= 1) {
    return (
      <Badge variant="outline" className="text-[10px] uppercase tracking-widest">
        {activeRole ? getRoleLabel(activeRole) : "No Role"}
      </Badge>
    );
  }

  const handleRoleSwitch = (role: AppRole) => {
    setActiveRole(role);
    // Navigate to the appropriate dashboard for the new role
    const paths: Record<AppRole, string> = {
      admin: "/dashboard/admin",
      manager: "/dashboard/manager",
      concierge: "/dashboard/concierge",
      trainer: "/dashboard/trainer",
      female_spa_attendant: "/dashboard/spa",
      male_spa_attendant: "/dashboard/spa",
      floater: "/dashboard/floater",
    };
    navigate(paths[role]);
    toast.success(`Switched to ${getRoleLabel(role)} view`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2">
          <span className="text-[10px] uppercase tracking-widest">
            {activeRole ? getRoleLabel(activeRole) : "Select Role"}
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
          const roleInfo = ROLES.find(r => r.value === userRole.role);
          return (
            <DropdownMenuItem
              key={userRole.id}
              onClick={() => handleRoleSwitch(userRole.role)}
              className={cn(
                "text-[10px] uppercase tracking-widest cursor-pointer",
                activeRole === userRole.role && "bg-muted"
              )}
            >
              <span className="mr-2">{roleInfo?.icon}</span>
              {getRoleLabel(userRole.role)}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DashboardHeader({ title }: { title: string }) {
  const navigate = useNavigate();
  const { user, signOut } = useAuthContext();
  const { data: profile } = useUserProfile(user?.id);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out");
      navigate("/login");
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
          <SidebarTrigger className="h-8 w-8">
            <Menu className="h-4 w-4" />
          </SidebarTrigger>
          
          <div className="hidden md:flex items-center gap-4">
            <img 
              src={humeLogo} 
              alt="Hume" 
              className="h-4 w-auto cursor-pointer hover:opacity-70 transition-opacity"
              onClick={() => navigate("/dashboard")}
            />
            <div className="h-4 w-px bg-border" />
            <h1 className="text-[10px] uppercase tracking-widest font-normal">{title}</h1>
          </div>

          {/* Mobile title */}
          <h1 className="md:hidden text-[10px] uppercase tracking-widest font-normal truncate max-w-[150px]">
            {title}
          </h1>
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

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <SidebarNav />
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader title={title} />
          <main className="flex-1 p-4 md:p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

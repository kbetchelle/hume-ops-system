import { ReactNode, useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { useUserProfile } from "@/hooks/useUserRoles";
import { BugReportDialog } from "@/components/feedback/BugReportDialog";
import { NotificationBell } from "@/components/concierge/NotificationBell";
import { useActiveRole } from "@/hooks/useActiveRole";
import { usePermissions, PERMISSIONS } from "@/hooks/usePermissions";
import { useUnreadBugReportCount } from "@/hooks/useUnreadBugReportCount";
import { useUnreadMessageCount } from "@/hooks/useUnreadMessageCount";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuBadge, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { NavLink } from "@/components/NavLink";
import { LogOut, User, Settings, ChevronDown, ChevronRight, Users, ClipboardList, MessageSquare, BarChart3, Dumbbell, Calendar, FileText, Building, Home, Bell, Briefcase, ArrowLeftRight, RefreshCw, Database, Wrench, Bug, FileCode2, HelpCircle, BookOpen, Package, AlertCircle, Wine, Link2, FolderOpen, Inbox } from "lucide-react";
import { useUnreadInboxCount } from "@/hooks/useManagementInbox";

const RESOURCE_SUB_ITEMS = [
  { title: "Quick Links", url: "/dashboard/resources/quick-links", icon: Link2 },
  { title: "Resource Pages", url: "/dashboard/resources/pages", icon: FileText },
  { title: "Policies", url: "/dashboard/resources/policies", icon: BookOpen },
];
import { LanguageSelector } from "@/components/shared/LanguageSelector";
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
interface SettingsSubItem {
  title: string;
  url: string;
  icon: React.ElementType;
}
interface SettingsGroup {
  title: string;
  icon: React.ElementType;
  items: SettingsSubItem[];
}

// Back-of-house roles: spa attendants and floater get checklist-first nav
const BOH_ROLES: AppRole[] = ["female_spa_attendant", "male_spa_attendant", "floater"];

// Navigation items per role
const getNavItems = (role: AppRole | null, permissions: string[]): NavItem[] => {
  // Admin and Manager: grouped nav is handled separately in SidebarNav, return empty here
  if (role === "admin" || role === "manager") {
    return [];
  }
  // BOH: grouped nav is handled separately in SidebarNav, return empty here
  if (role && BOH_ROLES.includes(role)) {
    return [];
  }
  // Cafe role: grouped nav is handled separately in SidebarNav, return empty here
  if (role === "cafe") {
    return [];
  }
  const baseItems: NavItem[] = [{
    title: "Dashboard",
    url: "/dashboard",
    icon: Home
  }, {
    title: "Messages",
    url: "/dashboard/messages",
    icon: MessageSquare
  }];
  const allItems: NavItem[] = [{
    title: "Members",
    url: "/dashboard/members",
    icon: Users,
    permission: PERMISSIONS.VIEW_MEMBERS
  }, {
    title: "Training Plans",
    url: "/dashboard/training-plans",
    icon: Dumbbell,
    permission: PERMISSIONS.VIEW_TRAINING_PLANS
  }, {
    title: "Checklists",
    url: "/dashboard/checklists",
    icon: ClipboardList,
    permission: PERMISSIONS.MANAGE_CHECKLISTS
  }, {
    title: "My Checklists",
    url: "/dashboard/my-checklists",
    icon: ClipboardList,
    roles: ["concierge", "female_spa_attendant", "male_spa_attendant", "floater"]
  }, {
    title: "Announcements",
    url: "/dashboard/communications",
    icon: Bell
  }, {
    title: "Member Communications",
    url: "/dashboard/member-communications",
    icon: MessageSquare,
    roles: ["manager", "concierge", "trainer"]
  }, {
    title: "Shift Report",
    url: "/dashboard/concierge",
    icon: FileText,
    roles: ["manager", "concierge"]
  }, {
    title: "Lost & Found",
    url: "/dashboard/lost-and-found",
    icon: Package,
    roles: ["concierge", "female_spa_attendant", "male_spa_attendant", "floater"]
  }, {
    title: "Reports",
    url: "/dashboard/reports",
    icon: BarChart3,
    permission: PERMISSIONS.VIEW_REPORTS
  }, {
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: BarChart3,
    permission: PERMISSIONS.VIEW_ANALYTICS
  }, {
    title: "Resources",
    url: "/dashboard/resources",
    icon: FolderOpen,
    roles: ["concierge"]
  }, {
    title: "Admin",
    url: "/dashboard/admin",
    icon: Briefcase,
    roles: [] // Empty - admin uses its own structure
  }];

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

// Manager Tools items for admin
const managerToolsItems: SettingsSubItem[] = [{
  title: "Checklists",
  url: "/dashboard/checklists",
  icon: ClipboardList
}, {
  title: "Inbox",
  url: "/dashboard/inbox",
  icon: Inbox
}, {
  title: "Staff Resources",
  url: "/dashboard/staff-resources",
  icon: Link2
}];

// Settings menu structure for admin
const settingsGroups: SettingsGroup[] = [{
  title: "Dev Tools",
  icon: Wrench,
  items: [{
    title: "API Syncing",
    url: "/dashboard/api-syncing",
    icon: RefreshCw
  }, {
    title: "API Data Mapping",
    url: "/dashboard/api-data-mapping",
    icon: FileCode2
  }, {
    title: "Backfill Manager",
    url: "/dashboard/backfill",
    icon: Database
  }, {
    title: "Skipped Records",
    url: "/dashboard/sync-skipped-records",
    icon: AlertCircle
  }, {
    title: "Bug Reports",
    url: "/dashboard/bug-reports",
    icon: Bug
  }]
}];
const settingsDirectItems: SettingsSubItem[] = [{
  title: "User Management",
  url: "/dashboard/user-management",
  icon: Users
}];
// Resources nav item with 2-second hover expand and click toggle
function ResourcesNavItem({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isResourcesActive = location.pathname.startsWith("/dashboard/resources");

  // Auto-open when on a resources sub-page, auto-close when navigating away
  useEffect(() => {
    if (isResourcesActive) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [isResourcesActive]);

  const handleMouseEnter = useCallback(() => {
    hoverTimerRef.current = setTimeout(() => setIsOpen(true), 2000);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    // Collapse if not currently on a resources route
    if (!location.pathname.startsWith("/dashboard/resources")) {
      setIsOpen(false);
    }
  }, [location.pathname]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    // Navigate to resources landing AND toggle sub-menu
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <NavLink
            to={item.url}
            end
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-xs uppercase tracking-widest transition-colors text-muted-foreground",
              "hover:bg-muted/50"
            )}
            activeClassName="bg-muted text-foreground font-medium"
            onClick={handleClick}
          >
            <item.icon className="h-4 w-4 shrink-0 stroke-[1.5]" />
            {!collapsed && (
              <>
                <span className="flex-1">{item.title}</span>
                <ChevronRight className={cn("h-3 w-3 transition-transform", isOpen && "rotate-90")} />
              </>
            )}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
      {isOpen && !collapsed && (
        <div className="animate-fade-in">
          {RESOURCE_SUB_ITEMS.map((sub) => (
            <SidebarMenuItem key={sub.url}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={sub.url}
                  className={cn(
                    "flex items-center gap-3 pl-10 pr-3 py-1.5 text-[11px] uppercase tracking-widest transition-colors",
                    "hover:bg-muted/50"
                  )}
                  activeClassName="bg-muted text-foreground font-medium"
                >
                  <sub.icon className="h-3 w-3 shrink-0 stroke-[1.5]" />
                  <span>{sub.title}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarNav() {
  const location = useLocation();
  const {
    state
  } = useSidebar();
  const collapsed = state === "collapsed";
  const {
    activeRole
  } = useActiveRole();
  const {
    permissions
  } = usePermissions();
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const { count: unreadBugCount } = useUnreadBugReportCount();
  const { count: unreadMessageCount } = useUnreadMessageCount();
  const { data: unreadInboxCount } = useUnreadInboxCount();

  // Determine the effective role based on URL path for proper navigation rendering
  // This ensures admin/manager/BOH dashboards always show the correct nav even if activeRole hasn't updated
  const getEffectiveRole = (): AppRole | null => {
    const path = location.pathname;
    if (path.startsWith("/dashboard/admin")) return "admin";
    if (path.startsWith("/dashboard/manager")) return "manager";
    if (path.startsWith("/dashboard/floater")) return "floater";
    if (path.startsWith("/dashboard/spa")) return "female_spa_attendant";
    return activeRole;
  };
  const effectiveRole = getEffectiveRole();
  const navItems = getNavItems(effectiveRole, permissions);
  const isBohRole = effectiveRole !== null && BOH_ROLES.includes(effectiveRole);
  const isCafeRole = effectiveRole === "cafe";
  const isAdminManagerRole = effectiveRole === "admin" || effectiveRole === "manager";

  // Admin/Manager grouped nav items
  const adminMainItems: NavItem[] = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Membership", url: "/dashboard/members", icon: Users },
    { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
    { title: "Reports", url: "/dashboard/reports", icon: FileText },
    { title: "Master Calendar", url: "/dashboard/master-calendar", icon: Calendar },
    { title: "Lost & Found", url: "/dashboard/lost-and-found", icon: Package },
  ];
  const adminCommsItems: NavItem[] = [
    { title: "Messages", url: "/dashboard/messages", icon: MessageSquare },
    { title: "Staff Announcements", url: "/dashboard/staff-announcements", icon: Bell },
  ];

  // Cafe grouped nav items
  const cafeMainItems: NavItem[] = [
    { title: "Checklists", url: "/dashboard/cafe", icon: ClipboardList },
    { title: "Shift Notes", url: "/dashboard/boh-notes", icon: HelpCircle },
  ];
  const cafeCommsItems: NavItem[] = [
    { title: "Messages", url: "/dashboard/messages", icon: MessageSquare },
    { title: "Announcements", url: "/dashboard/announcements", icon: Bell },
  ];
  const cafeRefItems: NavItem[] = [
    { title: "Event Drinks", url: "/dashboard/cafe/event-drinks", icon: Wine },
    { title: "Who's Working", url: "/dashboard/whos-working", icon: Users },
  ];

  // BoH grouped nav items
  const bohChecklistUrl = effectiveRole === "floater" ? "/dashboard/floater" : "/dashboard/spa";
  const bohMainItems: NavItem[] = [{ title: "Checklists", url: bohChecklistUrl, icon: ClipboardList }];
  const bohCommsItems: NavItem[] = [
    { title: "Messages", url: "/dashboard/messages", icon: MessageSquare },
    { title: "Announcements", url: "/dashboard/announcements", icon: Bell },
  ];
  const bohRefItems: NavItem[] = [
    { title: "Class Schedule", url: "/dashboard/class-schedule", icon: Calendar },
    { title: "Lost & Found", url: "/dashboard/lost-and-found", icon: Package },
    { title: "Resources", url: "/dashboard/resources", icon: FolderOpen },
    { title: "Who's Working", url: "/dashboard/whos-working", icon: Users },
    { title: "Notes for Management", url: "/dashboard/boh-notes", icon: HelpCircle },
  ];

  // Show Settings (incl. Dev Tools) for admin/manager, or when on a Dev Tools/Settings path (those routes require admin/manager)
  const isOnSettingsOrDevToolsPath = ["/dashboard/sync-skipped-records", "/dashboard/api-syncing", "/dashboard/api-data-mapping", "/dashboard/backfill", "/dashboard/user-management", "/dashboard/bug-reports"].some((p) => location.pathname.startsWith(p));
  const isAdminOrManager = effectiveRole === "admin" || effectiveRole === "manager" || isOnSettingsOrDevToolsPath;

  // Check if dev tools items are active
  const isDevToolsActive = location.pathname.startsWith("/dashboard/backfill") || location.pathname.startsWith("/dashboard/api-syncing") || location.pathname.startsWith("/dashboard/api-data-mapping") || location.pathname.startsWith("/dashboard/sync-skipped-records") || location.pathname.startsWith("/dashboard/bug-reports");

  // Helper to render a nav item (handles Resources sub-menu)
  const renderNavItem = (item: NavItem) => {
    if (item.url === "/dashboard/resources") {
      return <ResourcesNavItem key={item.url} item={item} collapsed={collapsed} />;
    }
    return (
      <SidebarMenuItem key={item.url}>
        <SidebarMenuButton asChild>
          <NavLink to={item.url} end={item.url === "/dashboard" || item.url === bohChecklistUrl} className={cn("flex items-center gap-3 px-3 py-2 text-xs uppercase tracking-widest transition-colors text-muted-foreground", "hover:bg-muted/50")} activeClassName="bg-muted text-foreground font-medium">
            <item.icon className="h-4 w-4 shrink-0 stroke-[1.5]" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        </SidebarMenuButton>
        {item.url === "/dashboard/messages" && unreadMessageCount > 0 && (
          <SidebarMenuBadge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-none animate-pulse">
            {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
          </SidebarMenuBadge>
        )}
      </SidebarMenuItem>
    );
  };

  // Render a labeled SidebarGroup
  const renderGroup = (label: string, items: NavItem[]) => (
    <SidebarGroup key={label}>
      <SidebarGroupLabel className={cn("text-[10px] uppercase tracking-widest text-muted-foreground px-3", collapsed && "sr-only")}>
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map(renderNavItem)}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return <Sidebar className={cn("border-r border-border bg-background transition-all duration-300 flex flex-col", collapsed ? "w-14" : "w-60")} collapsible="icon">
      <SidebarContent className="pt-4 flex-1">
        {/* User greeting and role switcher at top */}
        <div className={cn("px-3 pb-3 space-y-0", collapsed && "px-2")}>
          <UserInfoDropdown collapsed={collapsed} />
          <RoleSwitcher collapsed={collapsed} />
        </div>

        {/* BoH / Cafe grouped navigation */}
        {isBohRole ? (
          <>
            {renderGroup("Main", bohMainItems)}
            {renderGroup("Communications", bohCommsItems)}
            {renderGroup("References", bohRefItems)}
          </>
        ) : isCafeRole ? (
          <>
            {renderGroup("Main", cafeMainItems)}
            {renderGroup("Communications", cafeCommsItems)}
            {renderGroup("References", cafeRefItems)}
          </>
        ) : isAdminManagerRole ? (
          <>
            {renderGroup("Main", adminMainItems)}
            {renderGroup("Communications", adminCommsItems)}
          </>
        ) : (
        <SidebarGroup>
          <SidebarGroupLabel className={cn("text-[10px] uppercase tracking-widest text-muted-foreground px-3", collapsed && "sr-only")}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
             {navItems.map(item => {
                if (item.url === "/dashboard/resources") {
                  return <ResourcesNavItem key={item.url} item={item} collapsed={collapsed} />;
                }
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} end={item.url === "/dashboard"} className={cn("flex items-center gap-3 px-3 py-2 text-xs uppercase tracking-widest transition-colors text-muted-foreground", "hover:bg-muted/50")} activeClassName="bg-muted text-foreground font-medium">
                        <item.icon className="h-4 w-4 shrink-0 stroke-[1.5]" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                    {item.url === "/dashboard/messages" && unreadMessageCount > 0 && (
                      <SidebarMenuBadge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-none animate-pulse">
                        {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        )}

        {/* Manager Tools Section - Admin and Manager */}
        {isAdminOrManager && !collapsed && <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground px-3">
              Manager Tools
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {managerToolsItems.map(item => <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={cn("flex items-center gap-3 px-3 py-2 text-xs uppercase tracking-widest transition-colors text-muted-foreground", "hover:bg-muted/50")} activeClassName="bg-muted text-foreground font-medium">
                        <item.icon className="h-4 w-4 shrink-0 stroke-[1.5]" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                    {item.url === "/dashboard/inbox" && (unreadInboxCount ?? 0) > 0 && (
                      <SidebarMenuBadge className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-none animate-pulse">
                        {(unreadInboxCount ?? 0) > 99 ? "99+" : unreadInboxCount}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>}

        {/* Settings Section - Admin and Manager */}
        {isAdminOrManager && !collapsed && <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground px-3">
              Settings
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* Direct Settings Items */}
                {settingsDirectItems.map(item => <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={cn("flex items-center gap-3 px-3 py-2 text-xs uppercase tracking-widest transition-colors text-muted-foreground", "hover:bg-muted/50")} activeClassName="bg-muted text-foreground font-medium">
                        <item.icon className="h-4 w-4 shrink-0 stroke-[1.5]" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>)}

                {/* Dev Tools Submenu */}
                <Collapsible open={devToolsOpen || isDevToolsActive} onOpenChange={setDevToolsOpen}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className={cn("flex items-center gap-3 px-3 py-2 text-xs uppercase tracking-widest transition-colors w-full text-muted-foreground", "hover:bg-muted/50", isDevToolsActive && "bg-muted/70 text-foreground")}>
                        <Wrench className="h-4 w-4 shrink-0 stroke-[1.5]" />
                        <span className="flex-1 text-left">Dev Tools</span>
                        <ChevronRight className={cn("h-3 w-3 transition-transform", (devToolsOpen || isDevToolsActive) && "rotate-90")} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                  </SidebarMenuItem>
                  <CollapsibleContent>
                    {settingsGroups[0].items.map(item => <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} className={cn("flex items-center gap-3 pl-8 pr-3 py-2 text-xs uppercase tracking-widest transition-colors text-muted-foreground", "hover:bg-muted/50")} activeClassName="bg-muted text-foreground font-medium">
                            <item.icon className="h-4 w-4 shrink-0 stroke-[1.5]" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                        {item.url === "/dashboard/bug-reports" && unreadBugCount > 0 && (
                          <SidebarMenuBadge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-none">
                            {unreadBugCount > 99 ? "99+" : unreadBugCount}
                          </SidebarMenuBadge>
                        )}
                      </SidebarMenuItem>)}
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>}

        {/* Collapsed Settings Icon for Admin and Manager */}
        {isAdminOrManager && collapsed && <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/dashboard/user-management" className={cn("flex items-center justify-center px-3 py-2 transition-colors", "hover:bg-muted/50")} activeClassName="bg-muted text-foreground">
                      <Settings className="h-2.5 w-2.5 stroke-[1.5]" />
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>}
      </SidebarContent>
      
      {/* Bottom spacer removed - greeting and role switcher moved to top */}
    </Sidebar>;
}
function RoleSwitcher({
  collapsed = false
}: {
  collapsed?: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    activeRole,
    setActiveRole,
    availableRoles,
    getRoleLabel
  } = useActiveRole();

  // Detect which role view is currently being displayed based on the URL path
  const getCurrentViewRole = (): AppRole | null => {
    const path = location.pathname;
    if (path.includes("/dashboard/admin")) return "admin";
    if (path.includes("/dashboard/manager")) return "manager";
    if (path.includes("/dashboard/concierge")) return "concierge";
    if (path.includes("/dashboard/trainer")) return "trainer";
    if (path.includes("/dashboard/spa")) return "female_spa_attendant"; // or male_spa_attendant - same view
    if (path.includes("/dashboard/floater")) return "floater";
    if (path.includes("/dashboard/cafe")) return "cafe";
    // For generic pages like /dashboard/reports, fall back to activeRole
    return activeRole;
  };
  const currentViewRole = getCurrentViewRole();
  if (availableRoles.length <= 1) {
    if (collapsed) {
      return null;
    }
    return <Badge variant="outline" className="text-[10px] uppercase tracking-widest">
        {currentViewRole ? getRoleLabel(currentViewRole) : "No Role"}
      </Badge>;
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
      cafe: "/dashboard/cafe"
    };
    navigate(paths[role]);
    toast.success(`Switched to ${getRoleLabel(role)} view`);
  };
  return <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("gap-2 rounded-none border-0 justify-start", collapsed ? "h-8 w-8 p-0" : "h-auto py-0 w-full px-0")}>
          {!collapsed && <>
              <span className="text-xs uppercase tracking-widest flex-1 text-left pl-2 whitespace-normal leading-tight">
                {currentViewRole ? `${getRoleLabel(currentViewRole)} Role View` : "Select Role"}
              </span>
              <ChevronDown className="h-3 w-3 shrink-0" />
            </>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-48 rounded-none bg-background border border-border z-50">
        
        {availableRoles.map(userRole => {
        const roleInfo = ROLES.find(r => r.value === userRole.role);
        const isCurrentView = currentViewRole === userRole.role || currentViewRole === "female_spa_attendant" && userRole.role === "male_spa_attendant" || currentViewRole === "male_spa_attendant" && userRole.role === "female_spa_attendant";
        return <DropdownMenuItem key={userRole.id} onClick={() => handleRoleSwitch(userRole.role)} className={cn("text-xs uppercase tracking-widest cursor-pointer rounded-none", isCurrentView && "bg-muted")}>
              {getRoleLabel(userRole.role)}
            </DropdownMenuItem>;
      })}
      </DropdownMenuContent>
    </DropdownMenu>;
}
function UserInfoDropdown({
  collapsed = false
}: {
  collapsed?: boolean;
}) {
  const navigate = useNavigate();
  const {
    user,
    signOut
  } = useAuthContext();
  const {
    data: profile
  } = useUserProfile(user?.id);
  const [showBugReport, setShowBugReport] = useState(false);
  const handleSignOut = async () => {
    const {
      error
    } = await signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out");
      navigate("/");
    }
  };
  const getFirstName = (fullName: string | null | undefined) => {
    if (!fullName) return "User";
    return fullName.split(" ")[0];
  };
  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };
  return <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className={cn("w-full justify-start gap-2 rounded-none", collapsed ? "h-8 w-8 p-0 justify-center" : "h-8 px-2")}>
            {!collapsed && <span className="text-[15px] uppercase tracking-widest truncate font-bold">
                Hi, {getFirstName(profile?.full_name)}
              </span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 rounded-none border-border bg-background z-50" align="start" side="top">
          <DropdownMenuLabel className="font-normal">
            <p className="text-xs uppercase tracking-widest font-normal">
              {profile?.full_name || "User"}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-border" />
          <DropdownMenuItem onClick={() => navigate("/dashboard/profile")} className="text-xs uppercase tracking-widest cursor-pointer hover:bg-secondary rounded-none">
            <User className="mr-2 h-3 w-3" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/dashboard/settings")} className="text-xs uppercase tracking-widest cursor-pointer hover:bg-secondary rounded-none">
            <Settings className="mr-2 h-3 w-3" />
            Account Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-border" />
          <DropdownMenuItem onClick={() => setShowBugReport(true)} className="text-xs uppercase tracking-widest cursor-pointer hover:bg-secondary rounded-none">
            <Bug className="mr-2 h-3 w-3" />
            Report a Bug
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSignOut} className="text-xs uppercase tracking-widest cursor-pointer hover:bg-secondary rounded-none">
            <LogOut className="mr-2 h-3 w-3" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <BugReportDialog open={showBugReport} onOpenChange={setShowBugReport} />
    </>;
}
function DashboardHeader({ title }: { title: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeRole } = useActiveRole();
  const isBOH =
    location.pathname.startsWith("/dashboard/spa") ||
    location.pathname.startsWith("/dashboard/floater") ||
    (activeRole !== null && BOH_ROLES.includes(activeRole));

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="flex h-20 items-center justify-between px-4 md:px-6">
        <h1 className="text-[18px] uppercase tracking-widest font-normal truncate">
          {title}
        </h1>

        <div className="flex items-center gap-2">
          {isBOH && <LanguageSelector />}
          <img
            src={humeLogo}
            alt="Hume"
            className="h-[50px] w-auto cursor-pointer hover:opacity-70 transition-opacity my-[12px]"
            onClick={() => navigate("/dashboard")}
          />
        </div>
      </div>
    </header>
  );
}
export function DashboardLayout({
  children,
  title
}: DashboardLayoutProps) {
  return <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <SidebarNav />
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader title={title} />
          <main className="flex-1 p-4 md:p-8 overflow-auto my-0 py-0 px-0">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>;
}
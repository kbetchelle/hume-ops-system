import { ReactNode, useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { useUserProfile, useUserRoles } from "@/hooks/useUserRoles";
import { BugReportDialog } from "@/components/feedback/BugReportDialog";
import { NotificationBell } from "@/components/concierge/NotificationBell";
import { useActiveRole } from "@/hooks/useActiveRole";
import { usePermissions, PERMISSIONS } from "@/hooks/usePermissions";
import { useUnreadBugReportCount } from "@/hooks/useUnreadBugReportCount";
import { useUnreadMessageCount } from "@/hooks/useUnreadMessageCount";
import { useUnreadNotificationCount } from "@/hooks/useUnreadNotificationCount";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuBadge, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { NavLink } from "@/components/NavLink";
import { LogOut, User, Settings, ChevronDown, ChevronRight, Users, ClipboardList, MessageSquare, BarChart3, Dumbbell, Calendar, FileText, Building, Home, Bell, Briefcase, ArrowLeftRight, RefreshCw, Database, Wrench, Bug, FileCode2, HelpCircle, BookOpen, Package, AlertCircle, Wine, Link2, FolderOpen, Inbox, Download, Megaphone } from "lucide-react";
import { useUnreadInboxCount } from "@/hooks/useManagementInbox";
import { useInAppNotifications } from "@/hooks/useInAppNotifications";
import { useNeedsWalkthrough, useMarkWalkthroughCompleted } from "@/hooks/useWalkthroughState";
import { getWalkthroughStepsForRole, isBohWalkthroughRole } from "@/config/walkthroughSteps";
import { WalkthroughOverlay } from "@/components/walkthrough";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { GlobalOfflineBanner } from "@/components/mobile/GlobalOfflineBanner";
import { PWAInstallBanner } from "@/components/mobile/PWAInstallBanner";
import { PushPromptBanner } from "@/components/mobile/PushPromptBanner";
import { useOfflineBootstrap } from "@/hooks/useOfflineBootstrap";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { BiometricSetupPrompt } from "@/components/auth/BiometricSetupPrompt";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { MoreMenuSheet } from "@/components/mobile/MoreMenuSheet";
import { getBohMobileTabs, getBohMoreItems, getGenericMobileTabs, getGenericMoreItems } from "@/components/mobile/mobile-nav-config";

const RESOURCE_SUB_ITEMS = [
  { title: "Quick Links", url: "/dashboard/resources/quick-links", icon: Link2 },
  { title: "Resource Pages", url: "/dashboard/resources/pages", icon: FileText },
];
import { LanguageSelector } from "@/components/shared/LanguageSelector";
import { RoleSwitcher } from "@/components/shared/RoleSwitcher";
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
  // Concierge role: grouped nav is handled separately in SidebarNav, return empty here
  if (role === "concierge") {
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
    title: "Package Tracking",
    url: "/dashboard/package-tracking",
    icon: Package,
    roles: ["concierge", "cafe"]
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
  title: "Staff Resources",
  url: "/dashboard/staff-resources",
  icon: Link2
}, {
  title: "Lost & Found",
  url: "/dashboard/lost-and-found",
  icon: Package
}, {
  title: "Checklists",
  url: "/dashboard/checklists",
  icon: ClipboardList
}, {
  title: "Master Calendar",
  url: "/dashboard/master-calendar",
  icon: Calendar
}, {
  title: "Package Tracking",
  url: "/dashboard/package-tracking",
  icon: Package
}, {
  title: "Notification Center",
  url: "/dashboard/notification-center",
  icon: Bell
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
    title: "Data Patterns",
    url: "/dashboard/data-patterns",
    icon: Database
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
  }, {
    title: "Testing",
    url: "/dashboard/testing",
    icon: Wrench
  }, {
    title: "Dev Updates",
    url: "/dashboard/dev-updates",
    icon: Megaphone
  }, {
    title: "Notification Examples",
    url: "/dashboard/notification-examples",
    icon: Bell
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
            data-walkthrough="resources"
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
  const devToolsRef = useRef<HTMLDivElement>(null);
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
    if (path.startsWith("/dashboard/spa/male")) return "male_spa_attendant";
    if (path.startsWith("/dashboard/spa/female")) return "female_spa_attendant";
    if (path.startsWith("/dashboard/spa")) return activeRole === "male_spa_attendant" ? "male_spa_attendant" : "female_spa_attendant";
    return activeRole;
  };
  const effectiveRole = getEffectiveRole();
  const navItems = getNavItems(effectiveRole, permissions);
  const isBohRole = effectiveRole !== null && BOH_ROLES.includes(effectiveRole);
  const isCafeRole = effectiveRole === "cafe";
  const isConciergeRole = effectiveRole === "concierge";
  const isAdminManagerRole = effectiveRole === "admin" || effectiveRole === "manager";

  // Admin/Manager grouped nav items
  const adminMainItems: NavItem[] = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Membership", url: "/dashboard/members", icon: Users },
    { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
    { title: "Reports", url: "/dashboard/reports", icon: FileText },
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
    { title: "Package Tracking", url: "/dashboard/package-tracking", icon: Package },
    { title: "Event Drinks", url: "/dashboard/cafe/event-drinks", icon: Wine },
    { title: "Lost & Found", url: "/dashboard/lost-and-found", icon: Package },
    { title: "Who's Working", url: "/dashboard/whos-working", icon: Users },
  ];

  // Concierge grouped nav items
  const conciergeMainItems: NavItem[] = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Shift Report", url: "/dashboard/concierge", icon: FileText },
  ];
  const conciergeCommsItems: NavItem[] = [
    { title: "Messages", url: "/dashboard/messages", icon: MessageSquare },
    { title: "Announcements", url: "/dashboard/communications", icon: Bell },
  ];
  const conciergeRefItems: NavItem[] = [
    { title: "Response Templates", url: "/dashboard/concierge?view=templates", icon: FileCode2 },
    { title: "Resources", url: "/dashboard/resources", icon: FolderOpen },
    { title: "Package Tracking", url: "/dashboard/package-tracking", icon: Package },
    { title: "Lost & Found", url: "/dashboard/lost-and-found", icon: Package },
    { title: "Who's Working", url: "/dashboard/whos-working", icon: Users },
  ];

  // BoH grouped nav items
  const bohChecklistUrl =
    effectiveRole === "floater"
      ? "/dashboard/floater"
      : effectiveRole === "male_spa_attendant"
        ? "/dashboard/spa/male"
        : "/dashboard/spa/female";
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
  const isOnSettingsOrDevToolsPath = ["/dashboard/sync-skipped-records", "/dashboard/api-syncing", "/dashboard/api-data-mapping", "/dashboard/data-patterns", "/dashboard/backfill", "/dashboard/user-management", "/dashboard/bug-reports", "/dashboard/testing", "/dashboard/dev-updates", "/dashboard/notification-examples"].some((p) => location.pathname.startsWith(p));
  const isAdminOrManager = effectiveRole === "admin" || effectiveRole === "manager" || isOnSettingsOrDevToolsPath;

  // Check if dev tools items are active
  const isDevToolsActive = location.pathname.startsWith("/dashboard/backfill") || location.pathname.startsWith("/dashboard/api-syncing") || location.pathname.startsWith("/dashboard/api-data-mapping") || location.pathname.startsWith("/dashboard/data-patterns") || location.pathname.startsWith("/dashboard/sync-skipped-records") || location.pathname.startsWith("/dashboard/bug-reports") || location.pathname.startsWith("/dashboard/testing") || location.pathname.startsWith("/dashboard/dev-updates") || location.pathname.startsWith("/dashboard/notification-examples");

  const walkthroughIdByUrl: Record<string, string> = {
    "/dashboard/package-tracking": "package-tracking",
    "/dashboard/notification-center": "notification-center",
    "/dashboard/lost-and-found": "lost-and-found",
  };

  // Helper to render a nav item (handles Resources sub-menu)
  const renderNavItem = (item: NavItem) => {
    if (item.url === "/dashboard/resources") {
      return <ResourcesNavItem key={item.url} item={item} collapsed={collapsed} />;
    }
    return (
      <SidebarMenuItem key={item.url}>
        <SidebarMenuButton asChild>
          <NavLink to={item.url} end={item.url === "/dashboard" || item.url === bohChecklistUrl} className={cn("flex items-center gap-3 px-3 py-2 text-[12px] uppercase tracking-widest transition-colors text-muted-foreground", "hover:bg-muted/50")} activeClassName="bg-muted text-foreground font-medium" data-walkthrough={walkthroughIdByUrl[item.url]}>
            <item.icon className="h-4 w-4 shrink-0 stroke-[1.5]" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        </SidebarMenuButton>
        {item.url === "/dashboard/messages" && unreadMessageCount > 0 && (
          <SidebarMenuBadge className="bg-add-yellow text-white text-[10px] h-5 w-5 flex items-center justify-center p-0 rounded-none">
            {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
          </SidebarMenuBadge>
        )}
        {item.url === "/dashboard" && isAdminManagerRole && (unreadInboxCount ?? 0) > 0 && (
          <SidebarMenuBadge className="bg-add-orange text-white text-[10px] h-5 w-5 flex items-center justify-center p-0 rounded-none">
            {(unreadInboxCount ?? 0) > 99 ? "99+" : unreadInboxCount}
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

  return <Sidebar className={cn("bg-background transition-all duration-300 flex flex-col", collapsed ? "w-14" : "")} collapsible="icon">
      <SidebarContent className="pt-4 flex-1">
        {/* User greeting and role switcher at top */}
        <div className={cn("px-3 pb-3 space-y-0", collapsed && "px-2")}>
          <UserInfoDropdown collapsed={collapsed} />
          <RoleSwitcher collapsed={collapsed} variant="sidebar" />
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
        ) : isConciergeRole ? (
          <>
            {renderGroup("Main", conciergeMainItems)}
            {renderGroup("Communications", conciergeCommsItems)}
            {renderGroup("References", conciergeRefItems)}
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
                const walkthroughId = { "/dashboard/package-tracking": "package-tracking", "/dashboard/lost-and-found": "lost-and-found" }[item.url];
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} end={item.url === "/dashboard"} className={cn("flex items-center gap-3 px-3 py-2 text-xs uppercase tracking-widest transition-colors text-muted-foreground", "hover:bg-muted/50")} activeClassName="bg-muted text-foreground font-medium" data-walkthrough={walkthroughId}>
                        <item.icon className="h-4 w-4 shrink-0 stroke-[1.5]" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                    {item.url === "/dashboard/messages" && unreadMessageCount > 0 && (
                      <SidebarMenuBadge className="bg-add-yellow text-white text-[10px] h-5 w-5 flex items-center justify-center p-0 rounded-none">
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
                      <NavLink to={item.url} className={cn("flex items-center gap-3 px-3 py-2 text-xs uppercase tracking-widest transition-colors text-muted-foreground", "hover:bg-muted/50")} activeClassName="bg-muted text-foreground font-medium" data-walkthrough={item.url === "/dashboard/notification-center" ? "notification-center" : item.url === "/dashboard/package-tracking" ? "package-tracking" : undefined}>
                        <item.icon className="h-4 w-4 shrink-0 stroke-[1.5]" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
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
                <Collapsible open={devToolsOpen || isDevToolsActive} onOpenChange={(open) => {
                    setDevToolsOpen(open);
                    if (open) {
                      setTimeout(() => {
                        devToolsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                      }, 150);
                    }
                  }}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className={cn("flex items-center gap-3 px-3 py-2 text-xs uppercase tracking-widest transition-colors w-full text-muted-foreground", "hover:bg-muted/50", isDevToolsActive && "bg-muted/70 text-foreground")}>
                        <Wrench className="h-4 w-4 shrink-0 stroke-[1.5]" />
                        <span className="flex-1 text-left">Dev Tools</span>
                        <ChevronRight className={cn("h-3 w-3 transition-transform", (devToolsOpen || isDevToolsActive) && "rotate-90")} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                  </SidebarMenuItem>
                  <CollapsibleContent ref={devToolsRef}>
                    {settingsGroups[0].items.map(item => <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} className={cn("flex items-center gap-3 pl-8 pr-3 py-2 text-xs uppercase tracking-widest transition-colors text-muted-foreground", "hover:bg-muted/50")} activeClassName="bg-muted text-foreground font-medium">
                            <item.icon className="h-4 w-4 shrink-0 stroke-[1.5]" />
                            <span>{item.title}</span>
                          </NavLink>
                      </SidebarMenuButton>
                      {item.url === "/dashboard/bug-reports" && unreadBugCount > 0 && (
                        <SidebarMenuBadge className="bg-add-red text-white text-[10px] h-5 w-5 flex items-center justify-center p-0 rounded-none">
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
  const { count: unreadCount } = useUnreadNotificationCount();
  const { t } = useLanguage();
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
          <Button variant="ghost" size="sm" className={cn("w-full justify-start gap-2 rounded-none relative", collapsed ? "h-8 w-8 p-0 justify-center" : "h-8 px-2")} data-walkthrough="user-menu">
            {!collapsed && <span className="text-[15px] uppercase tracking-widest truncate font-bold">
                Hi, {getFirstName(profile?.full_name)}
              </span>}
            {unreadCount > 0 && <span className="absolute top-0 right-0 h-2 w-2 bg-destructive rounded-full" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 rounded-none border-border bg-background z-50" align="start" side="top">
          <DropdownMenuItem onClick={() => navigate("/dashboard/notifications")} className="text-xs uppercase tracking-widest cursor-pointer hover:bg-secondary rounded-none">
            <Bell className="mr-2 h-3 w-3" />
            {t("Notifications", "Notificaciones")}
          </DropdownMenuItem>
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
        <h1 className="text-[18px] uppercase tracking-widest font-[400] truncate">
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
function getEffectiveRoleFromPath(path: string, activeRole: AppRole | null): AppRole | null {
  if (path.startsWith("/dashboard/admin")) return "admin";
  if (path.startsWith("/dashboard/manager")) return "manager";
  if (path.startsWith("/dashboard/floater")) return "floater";
  if (path.startsWith("/dashboard/spa/male")) return "male_spa_attendant";
  if (path.startsWith("/dashboard/spa/female")) return "female_spa_attendant";
  if (path.startsWith("/dashboard/spa")) return activeRole === "male_spa_attendant" ? "male_spa_attendant" : "female_spa_attendant";
  return activeRole;
}

function getBohActiveTabId(path: string): string {
  if (path.startsWith("/dashboard/spa/female") || path.startsWith("/dashboard/spa/male") || path.startsWith("/dashboard/floater")) return "checklist";
  if (path === "/dashboard/messages") return "messages";
  if (path === "/dashboard/class-schedule") return "schedule";
  return "more";
}

function getGenericActiveTabId(path: string): string {
  if (path === "/dashboard" || path === "/dashboard/") return "home";
  if (path === "/dashboard/messages") return "messages";
  return "more";
}

export function DashboardLayout({
  children,
  title
}: DashboardLayoutProps) {
  useInAppNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuthContext();
  const { t } = useLanguage();
  const { data: profile } = useUserProfile(user?.id);
  const { data: roles } = useUserRoles(user?.id);
  const { activeRole, availableRoles, isLoading: activeRoleLoading } = useActiveRole();
  const isMobile = useIsMobile();
  const { count: unreadMessageCount } = useUnreadMessageCount();
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [showBugReport, setShowBugReport] = useState(false);
  const needsWalkthrough = useNeedsWalkthrough();
  const markWalkthroughCompleted = useMarkWalkthroughCompleted();
  const isBoh = activeRole !== null && isBohWalkthroughRole(activeRole);
  const hasAutoCompletedBohRef = useRef(false);

  const effectiveRole = getEffectiveRoleFromPath(location.pathname, activeRole);
  const isBohRole = effectiveRole !== null && BOH_ROLES.includes(effectiveRole);
  const bohActiveTabId = getBohActiveTabId(location.pathname);

  useOfflineBootstrap(
    isMobile && user?.id && effectiveRole
      ? { userId: user.id, role: effectiveRole }
      : null
  );

  const pushNotifications = usePushNotifications({
    userId: user?.id,
    activeRole: effectiveRole,
  });

  const webauthn = useWebAuthn();
  const showBiometricPrompt =
    isMobile &&
    user &&
    webauthn.isSupported &&
    !webauthn.hasStoredCredential() &&
    typeof localStorage !== "undefined" &&
    localStorage.getItem("hume_webauthn_prompt_skipped") !== "true";

  useEffect(() => {
    if (needsWalkthrough && isBoh && !hasAutoCompletedBohRef.current) {
      hasAutoCompletedBohRef.current = true;
      markWalkthroughCompleted.mutate(undefined);
    }
  }, [needsWalkthrough, isBoh, markWalkthroughCompleted]);

  const walkthroughSteps = useMemo(() => {
    if (!needsWalkthrough || isBoh || activeRole === null) return [];
    const firstName = profile?.full_name?.split(" ")[0] ?? "User";
    const hasMultipleRoles = (roles?.length ?? availableRoles?.length ?? 0) > 1;
    return getWalkthroughStepsForRole(activeRole, { firstName, hasMultipleRoles }, t);
  }, [needsWalkthrough, isBoh, activeRole, profile?.full_name, roles?.length, availableRoles?.length, t]);

  const showOverlay =
    needsWalkthrough &&
    !isBoh &&
    !activeRoleLoading &&
    activeRole !== null &&
    walkthroughSteps.length > 0;

  if (isMobile) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex flex-col w-full bg-background">
          <MobileHeader title={title} />
          <PWAInstallBanner />
          {pushNotifications.showPrompt && (
            <PushPromptBanner
              onEnable={async () => {
                await pushNotifications.enablePush();
              }}
              onLater={pushNotifications.dismissPrompt}
            />
          )}
          <GlobalOfflineBanner />
          <main
            className="flex-1 min-h-0 overflow-auto p-4 pt-12 pb-[calc(64px+env(safe-area-inset-bottom))]"
          >
            {showBiometricPrompt && (
              <BiometricSetupPrompt
                onSkip={() => localStorage.setItem("hume_webauthn_prompt_skipped", "true")}
              />
            )}
            {children}
          </main>
          {isBohRole && effectiveRole ? (
            <>
              <MobileBottomNav
                tabs={getBohMobileTabs(effectiveRole, unreadMessageCount)}
                activeId={bohActiveTabId}
                onMoreClick={() => setMoreSheetOpen(true)}
              />
              <MoreMenuSheet
                open={moreSheetOpen}
                onOpenChange={setMoreSheetOpen}
                items={getBohMoreItems()}
                onItemSelect={async (item) => {
                  if (item.id === "sign-out") {
                    const { error } = await signOut();
                    if (error) toast.error("Failed to sign out");
                    else { toast.success("Signed out"); navigate("/"); }
                    return;
                  }
                  if (item.id === "report-bug") { setShowBugReport(true); return; }
                  if (item.path) navigate(item.path);
                }}
              />
            </>
          ) : (
            <>
              <MobileBottomNav
                tabs={getGenericMobileTabs(unreadMessageCount)}
                activeId={getGenericActiveTabId(location.pathname)}
                onMoreClick={() => setMoreSheetOpen(true)}
              />
              <MoreMenuSheet
                open={moreSheetOpen}
                onOpenChange={setMoreSheetOpen}
                items={getGenericMoreItems()}
                onItemSelect={async (item) => {
                  if (item.id === "sign-out") {
                    const { error } = await signOut();
                    if (error) toast.error("Failed to sign out");
                    else { toast.success("Signed out"); navigate("/"); }
                    return;
                  }
                  if (item.id === "report-bug") { setShowBugReport(true); return; }
                  if (item.path) navigate(item.path);
                }}
              />
            </>
          )}
          <BugReportDialog open={showBugReport} onOpenChange={setShowBugReport} />
        </div>
        {showOverlay && (
          <WalkthroughOverlay
            steps={walkthroughSteps}
            onClose={() => {}}
          />
        )}
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <SidebarNav />
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader title={title} />
          <GlobalOfflineBanner />
          <main className="flex-1 p-4 md:p-8 overflow-auto my-0 py-0 px-0">
            {children}
          </main>
        </div>
      </div>
      {showOverlay && (
        <WalkthroughOverlay
          steps={walkthroughSteps}
          onClose={() => {}}
        />
      )}
    </SidebarProvider>
  );
}

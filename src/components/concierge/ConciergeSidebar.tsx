import { useState, useRef, useCallback, useEffect } from "react";
import {
  Home,
  FileText,
  MessageSquare,
  Megaphone,
  Users,
  FileCode,
  FolderOpen,
  PackageOpen,
  Eye,
  HelpCircle,
  User,
  Settings,
  Bug,
  LogOut,
  ChevronRight,
  Link2,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { useUserProfile } from "@/hooks/useUserRoles";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadAnnouncements } from "@/hooks/useUnreadAnnouncements";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoleSwitcher } from "@/components/shared/RoleSwitcher";
import { BugReportDialog } from "@/components/feedback/BugReportDialog";

export type ConciergeView =
  | "home"
  | "report"
  | "messages"
  | "announcements"
  | "whos-working"
  | "templates"
  | "resources"
  | "resources-quick-links"
  | "resources-pages"
  | "lost-found"
  | "packages"
  | "qa";

interface NavItem {
  id: ConciergeView;
  label: string;
  icon: LucideIcon;
  badge?: number;
  hasUnreadDot?: boolean;
  route?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface ConciergeSidebarProps {
  activeView: ConciergeView;
  onViewChange: (view: ConciergeView) => void;
  unreadCount?: number;
}

const RESOURCE_SUB_ITEMS: { id: ConciergeView; label: string; icon: LucideIcon }[] = [
  { id: "resources-quick-links", label: "Quick Links", icon: Link2 },
  { id: "resources-pages", label: "Resource Pages", icon: FileText },
];

function ResourcesSubMenu({
  activeView,
  onViewChange,
}: {
  activeView: ConciergeView;
  onViewChange: (view: ConciergeView) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isResourcesView = activeView.startsWith("resources");

  // Auto-expand when on resources view, auto-collapse when not
  useEffect(() => {
    if (isResourcesView) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [isResourcesView]);

  const handleMouseEnter = useCallback(() => {
    hoverTimerRef.current = setTimeout(() => setIsOpen(true), 2000);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (!isResourcesView) {
      setIsOpen(false);
    }
  }, [isResourcesView]);

  const handleClick = useCallback(() => {
    setIsOpen((prev) => !prev);
    if (!isResourcesView) {
      onViewChange("resources");
    }
  }, [isResourcesView, onViewChange]);

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={handleClick}
          className={cn(
            "flex items-center gap-3 px-3 py-2 text-[12px] uppercase tracking-widest transition-colors",
            "hover:bg-muted/50",
            activeView === "resources" ? "bg-muted text-foreground font-medium" : "text-muted-foreground"
          )}
        >
          <FolderOpen className="h-4 w-4 shrink-0" />
          <span className="flex-1">Resources</span>
          <ChevronRight className={cn("h-3 w-3 transition-transform", isOpen && "rotate-90")} />
        </SidebarMenuButton>
      </SidebarMenuItem>
      {isOpen && (
        <div className="animate-fade-in">
          {RESOURCE_SUB_ITEMS.map((sub) => {
            const Icon = sub.icon;
            const isActive = activeView === sub.id;
            return (
              <SidebarMenuItem key={sub.id}>
                <SidebarMenuButton
                  onClick={() => onViewChange(sub.id)}
                  className={cn(
                    "flex items-center gap-3 pl-10 pr-3 py-1.5 text-[11px] uppercase tracking-widest transition-colors",
                    "hover:bg-muted/50",
                    isActive ? "bg-muted text-foreground font-medium" : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-3 w-3 shrink-0" />
                  <span>{sub.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ConciergeSidebar({
  activeView,
  onViewChange,
  unreadCount = 0,
}: ConciergeSidebarProps) {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { data: profile } = useUserProfile(user?.id);
  const { signOut } = useAuth();
  const [showBugReport, setShowBugReport] = useState(false);
  const { data: hasUnreadAnnouncements } = useUnreadAnnouncements();

  const getFirstName = (fullName: string | null | undefined) => {
    if (!fullName) return "there";
    return fullName.split(" ")[0];
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const sections: NavSection[] = [
    {
      title: "Main",
      items: [
        { id: "home", label: "Home", icon: Home },
        { id: "report", label: "Shift Report", icon: FileText },
      ],
    },
    {
      title: "Communications",
      items: [
        {
          id: "messages",
          label: "Messages",
          icon: MessageSquare,
          badge: unreadCount > 0 ? unreadCount : undefined,
          route: "/dashboard/messages",
        },
        { id: "announcements", label: "Announcements", icon: Megaphone, hasUnreadDot: hasUnreadAnnouncements },
      ],
    },
    {
      title: "References",
      items: [
        { id: "packages" as ConciergeView, label: "Package Tracker", icon: PackageOpen, route: "/dashboard/package-tracking" },
        { id: "lost-found", label: "Lost & Found", icon: Eye },
        { id: "whos-working", label: "Who's Working", icon: Users },
        { id: "qa", label: "Q&A", icon: HelpCircle },
      ],
    },
  ];

  return (
    <Sidebar className="flex flex-col">
      <SidebarContent className="pt-4 flex-1">
        {/* User greeting dropdown and role switcher at top */}
        <div className="px-3 pb-3 space-y-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start gap-2 h-8 px-2 rounded-none"
              >
                <span className="text-[15px] uppercase tracking-widest truncate font-bold">
                  Hi, {getFirstName(profile?.full_name)}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="w-56 rounded-none border-border bg-background z-50" 
              align="start" 
              side="bottom"
            >
              <DropdownMenuItem 
                onClick={() => navigate("/dashboard/profile")} 
                className="text-[10px] uppercase tracking-widest cursor-pointer hover:bg-secondary rounded-none"
              >
                <User className="mr-2 h-3 w-3" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate("/dashboard/settings")} 
                className="text-[10px] uppercase tracking-widest cursor-pointer hover:bg-secondary rounded-none"
              >
                <Settings className="mr-2 h-3 w-3" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem 
                onClick={() => setShowBugReport(true)} 
                className="text-[10px] uppercase tracking-widest cursor-pointer hover:bg-secondary rounded-none"
              >
                <Bug className="mr-2 h-3 w-3" />
                Report a Bug
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleSignOut} 
                className="text-[10px] uppercase tracking-widest cursor-pointer hover:bg-secondary rounded-none"
              >
                <LogOut className="mr-2 h-3 w-3" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <BugReportDialog open={showBugReport} onOpenChange={setShowBugReport} />
          <RoleSwitcher />
        </div>
        {sections.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground px-3">
              {section.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.title === "References" && (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => onViewChange("templates")}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 text-[12px] uppercase tracking-widest transition-colors",
                          "hover:bg-muted/50",
                          activeView === "templates" ? "bg-muted text-foreground font-medium" : "text-muted-foreground"
                        )}
                      >
                        <FileCode className="h-4 w-4 shrink-0" />
                        <span>Response Templates</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <ResourcesSubMenu activeView={activeView} onViewChange={onViewChange} />
                  </>
                )}
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;

                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => {
                          if (item.route) {
                            navigate(item.route);
                          } else {
                            onViewChange(item.id);
                          }
                        }}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 text-[12px] uppercase tracking-widest transition-colors",
                          "hover:bg-muted/50",
                          isActive ? "bg-muted text-foreground font-medium" : "text-muted-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                        {item.hasUnreadDot && (
                          <span className="ml-auto h-2 w-2 bg-primary rounded-full animate-pulse shrink-0" />
                        )}
                        {item.badge !== undefined && !item.hasUnreadDot && (
                          <SidebarMenuBadge className={cn(
                            "ml-auto text-[10px] px-1.5 py-0.5 rounded-none",
                            item.badge > 0 ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-primary text-primary-foreground"
                          )}>
                            {item.badge}
                          </SidebarMenuBadge>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}

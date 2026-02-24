import { useState, useRef, useCallback, useEffect } from "react";
import {
  Home, FileText, MessageSquare, Megaphone, Users, FileCode, FolderOpen, PackageOpen, Eye,
  HelpCircle, User, Settings, Bug, LogOut, ChevronRight, Link2, BookOpen, type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { useUserProfile } from "@/hooks/useUserRoles";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadAnnouncements } from "@/hooks/useUnreadAnnouncements";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoleSwitcher } from "@/components/shared/RoleSwitcher";
import { BugReportDialog } from "@/components/feedback/BugReportDialog";

export type ConciergeView =
  | "home" | "report" | "messages" | "announcements" | "templates"
  | "resources" | "resources-quick-links" | "resources-pages"
  | "lost-found" | "whos-working" | "packages" | "qa";

interface NavItem {
  id: ConciergeView;
  labelKey: string;
  icon: LucideIcon;
  badge?: number;
  hasUnreadDot?: boolean;
  route?: string;
}

interface NavSection {
  titleKey: string;
  items: NavItem[];
}

interface ConciergeSidebarProps {
  activeView: ConciergeView;
  onViewChange: (view: ConciergeView) => void;
  unreadCount?: number;
}

const RESOURCE_SUB_ITEMS: { id: ConciergeView; labelKey: string; icon: LucideIcon }[] = [
  { id: "resources-quick-links", labelKey: "nav.quickLinks", icon: Link2 },
  { id: "resources-pages", labelKey: "nav.resourcePages", icon: FileText },
];

function ResourcesSubMenu({
  activeView,
  onViewChange,
}: {
  activeView: ConciergeView;
  onViewChange: (view: ConciergeView) => void;
}) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isResourcesView = activeView.startsWith("resources");

  useEffect(() => {
    if (isResourcesView) setIsOpen(true);
    else setIsOpen(false);
  }, [isResourcesView]);

  const handleMouseEnter = useCallback(() => {
    hoverTimerRef.current = setTimeout(() => setIsOpen(true), 2000);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) { clearTimeout(hoverTimerRef.current); hoverTimerRef.current = null; }
    if (!isResourcesView) setIsOpen(false);
  }, [isResourcesView]);

  const handleClick = useCallback(() => {
    setIsOpen((prev) => !prev);
    if (!isResourcesView) onViewChange("resources");
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
          <span className="flex-1">{t("nav.resources")}</span>
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
                  <span>{t(sub.labelKey)}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ConciergeSidebar({ activeView, onViewChange, unreadCount = 0 }: ConciergeSidebarProps) {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { data: profile } = useUserProfile(user?.id);
  const { signOut } = useAuth();
  const { t } = useLanguage();
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
      titleKey: "nav.main",
      items: [
        { id: "home", labelKey: "nav.home", icon: Home },
        { id: "report", labelKey: "nav.shiftReport", icon: FileText },
      ],
    },
    {
      titleKey: "nav.communications",
      items: [
        {
          id: "messages",
          labelKey: "nav.messages",
          icon: MessageSquare,
          badge: unreadCount > 0 ? unreadCount : undefined,
        },
        { id: "announcements", labelKey: "nav.announcements", icon: Megaphone, badge: hasUnreadAnnouncements && hasUnreadAnnouncements > 0 ? Number(hasUnreadAnnouncements) : undefined },
      ],
    },
    {
      titleKey: "nav.references",
      items: [
        { id: "packages" as ConciergeView, labelKey: "nav.packageTracker", icon: PackageOpen, route: "/dashboard/package-tracking" },
        { id: "lost-found", labelKey: "nav.lostAndFound", icon: Eye },
        { id: "whos-working", labelKey: "nav.whosWorking", icon: Users },
      ],
    },
  ];

  return (
    <Sidebar className="flex flex-col">
      <SidebarContent className="pt-4 flex-1">
        <div className="px-3 pb-3 space-y-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 h-8 px-2 rounded-none">
                <span className="text-[15px] uppercase tracking-widest truncate font-bold">
                  {t("greeting.hi")}, {getFirstName(profile?.full_name)}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-none border-border bg-background z-50" align="start" side="bottom">
              <DropdownMenuItem onClick={() => navigate("/dashboard/profile")} className="text-[13.5px] uppercase tracking-widest cursor-pointer hover:bg-secondary rounded-none">
                <User className="mr-2 h-3 w-3" />
                {t("menu.profile")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/dashboard/settings")} className="text-[13.5px] uppercase tracking-widest cursor-pointer hover:bg-secondary rounded-none">
                <Settings className="mr-2 h-3 w-3" />
                {t("menu.accountSettings")}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem onClick={() => setShowBugReport(true)} className="text-[13.5px] uppercase tracking-widest cursor-pointer hover:bg-secondary rounded-none">
                <Bug className="mr-2 h-3 w-3" />
                {t("menu.reportBug")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut} className="text-[13.5px] uppercase tracking-widest cursor-pointer hover:bg-secondary rounded-none">
                <LogOut className="mr-2 h-3 w-3" />
                {t("menu.signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <BugReportDialog open={showBugReport} onOpenChange={setShowBugReport} />
          <RoleSwitcher />
        </div>
        {sections.map((section) => (
          <SidebarGroup key={section.titleKey}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground px-3">
              {t(section.titleKey)}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.titleKey === "nav.references" && (
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
                        <span>{t("nav.responseTemplates")}</span>
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
                          if (item.route) navigate(item.route);
                          else onViewChange(item.id);
                        }}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 text-[12px] uppercase tracking-widest transition-colors",
                          "hover:bg-muted/50",
                          isActive ? "bg-muted text-foreground font-medium" : "text-muted-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{t(item.labelKey)}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <SidebarMenuBadge className={cn(
                            "ml-auto text-[10px] h-5 w-5 flex items-center justify-center p-0 rounded-none text-white",
                            item.id === "messages" ? "bg-add-yellow" : "bg-add-orange"
                          )}>
                            {item.badge > 99 ? "99+" : item.badge}
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

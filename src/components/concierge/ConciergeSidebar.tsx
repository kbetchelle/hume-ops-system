import { useState } from "react";
import {
  Home,
  FileText,
  MessageSquare,
  Megaphone,
  Users,
  FileCode,
  Link,
  Package,
  HelpCircle,
  User,
  Settings,
  Bug,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  | "quick-links"
  | "lost-found"
  | "policies-qa";

interface NavItem {
  id: ConciergeView;
  label: string;
  icon: LucideIcon;
  badge?: number;
  hasUnreadDot?: boolean;
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
        },
        { id: "announcements", label: "Announcements", icon: Megaphone, hasUnreadDot: hasUnreadAnnouncements },
      ],
    },
    {
      title: "Resources",
      items: [
        { id: "templates", label: "Response Templates", icon: FileCode },
        { id: "quick-links", label: "Quick Links", icon: Link },
        { id: "lost-found", label: "Lost & Found", icon: Package },
      ],
    },
    {
      title: "Reference",
      items: [
        { id: "whos-working", label: "Who's Working", icon: Users },
        { id: "policies-qa", label: "Policies & Q&A", icon: HelpCircle },
      ],
    },
  ];

  return (
    <Sidebar className="w-60 border-r border-border flex flex-col">
      <SidebarContent className="pt-4 flex-1">
        {/* User greeting and role switcher at top */}
        <div className="px-3 pb-3 space-y-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start gap-2 h-8 px-2 rounded-none pointer-events-none"
          >
            <span className="text-[10px] uppercase tracking-widest truncate">
              Hi, {getFirstName(profile?.full_name)}
            </span>
          </Button>
          <RoleSwitcher />
        </div>
        {sections.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground px-3">
              {section.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;

                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => onViewChange(item.id)}
                        className={`
                          flex items-center gap-3 px-3 py-2
                          text-xs uppercase tracking-widest
                          transition-colors
                          hover:bg-muted/50
                          ${isActive ? "bg-muted text-foreground font-medium" : "text-muted-foreground"}
                        `}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                        {item.hasUnreadDot && (
                          <span className="ml-auto h-2 w-2 bg-primary rounded-full animate-pulse shrink-0" />
                        )}
                        {item.badge !== undefined && !item.hasUnreadDot && (
                          <SidebarMenuBadge className="ml-auto bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-none">
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
      
      {/* User dropdown and bug report at bottom */}
      <div className="p-3 border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start gap-2 h-8 px-2 rounded-none"
            >
              <Settings className="h-4 w-4 shrink-0" />
              <span className="text-[10px] uppercase tracking-widest truncate">
                Settings
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            className="w-56 rounded-none border-border bg-background z-50" 
            align="start" 
            side="top"
          >
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
      </div>
    </Sidebar>
  );
}

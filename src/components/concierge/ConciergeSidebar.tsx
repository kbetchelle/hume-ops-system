import {
  Home,
  FileText,
  MessageSquare,
  Megaphone,
  Users,
  FileCode,
  Link,
  Package,
  FolderOpen,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { useUserProfile } from "@/hooks/useUserRoles";
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
import { RoleSwitcher } from "@/components/shared/RoleSwitcher";

export type ConciergeView =
  | "home"
  | "report"
  | "messages"
  | "announcements"
  | "whos-working"
  | "templates"
  | "quick-links"
  | "lost-found"
  | "documents"
  | "policies-qa";

interface NavItem {
  id: ConciergeView;
  label: string;
  icon: LucideIcon;
  badge?: number;
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
  const { user } = useAuthContext();
  const { data: profile } = useUserProfile(user?.id);

  const getFirstName = (fullName: string | null | undefined) => {
    if (!fullName) return "there";
    return fullName.split(" ")[0];
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
        { id: "announcements", label: "Announcements", icon: Megaphone },
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
        { id: "documents", label: "Documents", icon: FolderOpen },
        { id: "policies-qa", label: "Policies & Q&A", icon: HelpCircle },
      ],
    },
  ];

  return (
    <Sidebar className="w-60 border-r border-border flex flex-col">
      <SidebarContent className="pt-4 flex-1">
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
                        {item.badge !== undefined && (
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
      
      {/* Role Switcher and User Greeting at bottom of sidebar */}
      <div className="p-3 border-t border-border space-y-2">
        <RoleSwitcher />
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-1">
          Hi, {getFirstName(profile?.full_name)}
        </p>
      </div>
    </Sidebar>
  );
}

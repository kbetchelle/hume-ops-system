import {
  Home,
  FileText,
  MessageSquare,
  Megaphone,
  Users,
  FileCode,
  Link,
  BookOpen,
  Package,
  FolderOpen,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
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

export type ConciergeView =
  | "home"
  | "report"
  | "messages"
  | "announcements"
  | "whos-working"
  | "templates"
  | "quick-links"
  | "knowledge-base"
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
        { id: "whos-working", label: "Who's Working", icon: Users },
        { id: "templates", label: "Response Templates", icon: FileCode },
        { id: "quick-links", label: "Quick Links", icon: Link },
        { id: "knowledge-base", label: "Knowledge Base", icon: BookOpen },
        { id: "lost-found", label: "Lost & Found", icon: Package },
      ],
    },
    {
      title: "Reference",
      items: [
        { id: "documents", label: "Documents", icon: FolderOpen },
        { id: "policies-qa", label: "Policies & Q&A", icon: HelpCircle },
      ],
    },
  ];

  return (
    <Sidebar className="w-60 border-r border-border">
      <SidebarContent className="pt-4">
        {sections.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] font-normal text-muted-foreground px-4 py-2">
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
                          rounded-none px-4 py-2 h-auto
                          text-xs tracking-wide
                          transition-colors duration-200
                          hover:bg-muted/50
                          ${isActive ? "bg-muted text-foreground" : "text-muted-foreground"}
                        `}
                      >
                        <Icon className="h-4 w-4 mr-3" />
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
    </Sidebar>
  );
}

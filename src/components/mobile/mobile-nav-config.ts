import type { LucideIcon } from "lucide-react";
import {
  Home,
  FileText,
  MessageSquare,
  Search,
  MoreHorizontal,
  CheckSquare,
  Calendar,
  Bell,
  Users,
  FileCode,
  FolderOpen,
  Package,
  HelpCircle,
  User,
  Settings,
  LogOut,
  ArrowLeftRight,
  Bug,
} from "lucide-react";
import type { AppRole } from "@/types/roles";
import type { ConciergeView } from "@/components/concierge/ConciergeSidebar";

export type { ConciergeView };

export interface MobileTabItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path?: string;
  onSelect?: () => void;
  badge?: number;
}

export interface MoreMenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path?: string;
  view?: ConciergeView;
  badge?: number;
  separator?: boolean;
}

const BOH_CHECKLIST_URL: Record<AppRole, string> = {
  female_spa_attendant: "/dashboard/spa/female",
  male_spa_attendant: "/dashboard/spa/male",
  floater: "/dashboard/floater",
  admin: "/dashboard/admin",
  manager: "/dashboard/manager",
  concierge: "/dashboard/concierge",
  trainer: "/dashboard/trainer",
  cafe: "/dashboard/cafe",
};

function getBohChecklistUrl(role: AppRole): string {
  return BOH_CHECKLIST_URL[role] ?? "/dashboard";
}

/** Concierge main tabs (Home, Report, Messages, Lost & Found, More). */
export function getConciergeMobileTabs(
  unreadMessageCount: number,
  onViewChange: (view: ConciergeView) => void
): MobileTabItem[] {
  return [
    {
      id: "home",
      label: "Home",
      icon: Home,
      onSelect: () => onViewChange("home"),
    },
    {
      id: "report",
      label: "Report",
      icon: FileText,
      onSelect: () => onViewChange("report"),
    },
    {
      id: "messages",
      label: "Messages",
      icon: MessageSquare,
      onSelect: () => onViewChange("messages"),
      badge: unreadMessageCount > 0 ? unreadMessageCount : undefined,
    },
    {
      id: "lost-found",
      label: "Lost & Found",
      icon: Search,
      onSelect: () => onViewChange("lost-found"),
    },
    {
      id: "more",
      label: "More",
      icon: MoreHorizontal,
      // No path/onSelect here; parent opens MoreMenuSheet when More is tapped
    },
  ];
}

/** Concierge "More" sheet items: mix of routes and view-state (view keeps user on Concierge dashboard). */
export function getConciergeMoreItems(): MoreMenuItem[] {
  return [
    { id: "announcements", label: "Announcements", icon: Bell, view: "announcements" },
    { id: "whos-working", label: "Who's Working", icon: Users, view: "whos-working" },
    { id: "templates", label: "Response Templates", icon: FileCode, view: "templates" },
    { id: "resources", label: "Resources", icon: FolderOpen, view: "resources" },
    { id: "packages", label: "Packages", icon: Package, path: "/dashboard/package-tracking" },
    { id: "class-schedule", label: "Class Schedule", icon: Calendar, path: "/dashboard/class-schedule" },
    // User menu items
    { id: "notifications", label: "Notifications", icon: Bell, path: "/dashboard/notifications", separator: true },
    { id: "profile", label: "Profile", icon: User, path: "/dashboard/profile" },
    { id: "settings", label: "Account Settings", icon: Settings, path: "/dashboard/settings" },
    { id: "report-bug", label: "Report a Bug", icon: Bug },
    { id: "sign-out", label: "Sign Out", icon: LogOut },
  ];
}

/** BOH main tabs (Checklist, Messages, Schedule, More). */
export function getBohMobileTabs(activeRole: AppRole, unreadMessageCount: number): MobileTabItem[] {
  const checklistUrl = getBohChecklistUrl(activeRole);
  return [
    {
      id: "checklist",
      label: "Checklist",
      icon: CheckSquare,
      path: checklistUrl,
    },
    {
      id: "messages",
      label: "Messages",
      icon: MessageSquare,
      path: "/dashboard/messages",
      badge: unreadMessageCount > 0 ? unreadMessageCount : undefined,
    },
    {
      id: "schedule",
      label: "Schedule",
      icon: Calendar,
      path: "/dashboard/class-schedule",
    },
    {
      id: "more",
      label: "More",
      icon: MoreHorizontal,
    },
  ];
}

/** BOH "More" sheet items (all routes). */
export function getBohMoreItems(): MoreMenuItem[] {
  return [
    { id: "announcements", label: "Announcements", icon: Bell, path: "/dashboard/announcements" },
    { id: "whos-working", label: "Who's Working", icon: Users, path: "/dashboard/whos-working" },
    { id: "lost-and-found", label: "Lost & Found", icon: Package, path: "/dashboard/lost-and-found" },
    { id: "documents", label: "Documents", icon: FileText, path: "/dashboard/documents" },
    { id: "resources", label: "Resources", icon: FolderOpen, path: "/dashboard/resources" },
    { id: "package-tracking", label: "Package Tracking", icon: Package, path: "/dashboard/package-tracking" },
    { id: "boh-notes", label: "BOH Notes", icon: HelpCircle, path: "/dashboard/boh-notes" },
  ];
}

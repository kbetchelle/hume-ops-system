import type { LucideIcon } from "lucide-react";
import {
  Home, FileText, MessageSquare, Search, MoreHorizontal, CheckSquare, Calendar,
  Bell, Users, FileCode, FolderOpen, Package, HelpCircle, User, Settings, LogOut,
  ArrowLeftRight, Bug,
} from "lucide-react";
import type { AppRole } from "@/types/roles";
import type { ConciergeView } from "@/components/concierge/ConciergeSidebar";

export type { ConciergeView };

export interface MobileTabItem {
  id: string;
  labelKey: string;
  icon: LucideIcon;
  path?: string;
  onSelect?: () => void;
  badge?: number;
}

export interface MoreMenuItem {
  id: string;
  labelKey: string;
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

/** Concierge main tabs */
export function getConciergeMobileTabs(
  unreadMessageCount: number,
  onViewChange: (view: ConciergeView) => void
): MobileTabItem[] {
  return [
    { id: "home", labelKey: "mobile.home", icon: Home, onSelect: () => onViewChange("home") },
    { id: "report", labelKey: "mobile.report", icon: FileText, onSelect: () => onViewChange("report") },
    { id: "messages", labelKey: "nav.messages", icon: MessageSquare, onSelect: () => onViewChange("messages"), badge: unreadMessageCount > 0 ? unreadMessageCount : undefined },
    { id: "lost-found", labelKey: "nav.lostAndFound", icon: Search, onSelect: () => onViewChange("lost-found") },
    { id: "more", labelKey: "menu.more", icon: MoreHorizontal },
  ];
}

/** Concierge "More" sheet items */
export function getConciergeMoreItems(): MoreMenuItem[] {
  return [
    { id: "sign-out", labelKey: "menu.signOut", icon: LogOut },
    { id: "report-bug", labelKey: "menu.reportBug", icon: Bug },
    { id: "settings", labelKey: "menu.accountSettings", icon: Settings, path: "/dashboard/settings" },
    { id: "profile", labelKey: "menu.profile", icon: User, path: "/dashboard/profile" },
    { id: "notifications", labelKey: "menu.notifications", icon: Bell, path: "/dashboard/notifications" },
    { id: "announcements", labelKey: "nav.announcements", icon: Bell, view: "announcements", separator: true },
    { id: "whos-working", labelKey: "nav.whosWorking", icon: Users, view: "whos-working" },
    { id: "templates", labelKey: "nav.responseTemplates", icon: FileCode, view: "templates" },
    { id: "resources", labelKey: "nav.resources", icon: FolderOpen, view: "resources" },
    { id: "packages", labelKey: "nav.packages", icon: Package, path: "/dashboard/package-tracking" },
    { id: "class-schedule", labelKey: "nav.classSchedule", icon: Calendar, path: "/dashboard/class-schedule" },
  ];
}

/** BOH main tabs */
export function getBohMobileTabs(activeRole: AppRole, unreadMessageCount: number): MobileTabItem[] {
  const checklistUrl = getBohChecklistUrl(activeRole);
  return [
    { id: "checklist", labelKey: "mobile.checklist", icon: CheckSquare, path: checklistUrl },
    { id: "messages", labelKey: "nav.messages", icon: MessageSquare, path: "/dashboard/messages", badge: unreadMessageCount > 0 ? unreadMessageCount : undefined },
    { id: "schedule", labelKey: "mobile.schedule", icon: Calendar, path: "/dashboard/class-schedule" },
    { id: "more", labelKey: "menu.more", icon: MoreHorizontal },
  ];
}

/** BOH "More" sheet items */
export function getBohMoreItems(): MoreMenuItem[] {
  return [
    { id: "sign-out", labelKey: "menu.signOut", icon: LogOut },
    { id: "report-bug", labelKey: "menu.reportBug", icon: Bug },
    { id: "settings", labelKey: "menu.accountSettings", icon: Settings, path: "/dashboard/settings" },
    { id: "profile", labelKey: "menu.profile", icon: User, path: "/dashboard/profile" },
    { id: "notifications", labelKey: "menu.notifications", icon: Bell, path: "/dashboard/notifications" },
    { id: "announcements", labelKey: "nav.announcements", icon: Bell, path: "/dashboard/announcements", separator: true },
    { id: "whos-working", labelKey: "nav.whosWorking", icon: Users, path: "/dashboard/whos-working" },
    { id: "lost-and-found", labelKey: "nav.lostAndFound", icon: Package, path: "/dashboard/lost-and-found" },
    { id: "documents", labelKey: "nav.documents", icon: FileText, path: "/dashboard/documents" },
    { id: "resources", labelKey: "nav.resources", icon: FolderOpen, path: "/dashboard/resources" },
    { id: "package-tracking", labelKey: "nav.packageTracking", icon: Package, path: "/dashboard/package-tracking" },
    { id: "boh-notes", labelKey: "nav.bohNotes", icon: HelpCircle, path: "/dashboard/boh-notes" },
  ];
}

/** Generic mobile tabs */
export function getGenericMobileTabs(unreadMessageCount: number): MobileTabItem[] {
  return [
    { id: "home", labelKey: "mobile.home", icon: Home, path: "/dashboard" },
    { id: "messages", labelKey: "nav.messages", icon: MessageSquare, path: "/dashboard/messages", badge: unreadMessageCount > 0 ? unreadMessageCount : undefined },
    { id: "more", labelKey: "menu.more", icon: MoreHorizontal },
  ];
}

/** Generic "More" sheet items */
export function getGenericMoreItems(): MoreMenuItem[] {
  return [
    { id: "sign-out", labelKey: "menu.signOut", icon: LogOut },
    { id: "report-bug", labelKey: "menu.reportBug", icon: Bug },
    { id: "settings", labelKey: "menu.accountSettings", icon: Settings, path: "/dashboard/settings" },
    { id: "profile", labelKey: "menu.profile", icon: User, path: "/dashboard/profile" },
    { id: "notifications", labelKey: "menu.notifications", icon: Bell, path: "/dashboard/notifications" },
    { id: "announcements", labelKey: "nav.announcements", icon: Bell, path: "/dashboard/announcements", separator: true },
    { id: "schedule", labelKey: "nav.classSchedule", icon: Calendar, path: "/dashboard/class-schedule" },
    { id: "resources", labelKey: "nav.resources", icon: FolderOpen, path: "/dashboard/resources" },
  ];
}

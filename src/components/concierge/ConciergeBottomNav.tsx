import { Home, FileText, MessageSquare, Wrench } from "lucide-react";
import type { ConciergeView } from "./ConciergeSidebar";

interface ConciergeBottomNavProps {
  activeView: ConciergeView;
  onViewChange: (view: ConciergeView) => void;
  hasUnreadAnnouncements?: boolean;
}

const tabs = [
  { id: "home" as const, label: "Home", icon: Home },
  { id: "report" as const, label: "Report", icon: FileText },
  { id: "messages" as const, label: "Comms", icon: MessageSquare },
  { id: "templates" as const, label: "Tools", icon: Wrench },
];

export function ConciergeBottomNav({
  activeView,
  onViewChange,
  hasUnreadAnnouncements = false,
}: ConciergeBottomNavProps) {
  // Map the activeView to the closest tab
  const getActiveTab = () => {
    if (tabs.some((t) => t.id === activeView)) return activeView;
    if (["announcements"].includes(activeView)) return "messages";
    if (
      ["whos-working", "resources", "resources-quick-links", "resources-pages", "knowledge-base", "lost-found", "packages", "qa"].includes(
        activeView
      )
    )
      return "templates";
    return "home";
  };

  const activeTab = getActiveTab();

  // Show dot on Comms tab if there are unread announcements
  const showDotOnTab = (tabId: string) => {
    if (tabId === "messages" && hasUnreadAnnouncements) return true;
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onViewChange(tab.id)}
              className={`
                flex flex-col items-center justify-center
                flex-1 h-full relative
                text-[10px] uppercase tracking-widest
                transition-colors duration-200
                ${isActive ? "text-foreground" : "text-muted-foreground"}
              `}
            >
              <div className="relative">
                <Icon className="h-5 w-5 mb-1" />
                {showDotOnTab(tab.id) && (
                  <span className="absolute -top-0.5 -right-1 h-2 w-2 bg-primary rounded-full animate-pulse" />
                )}
              </div>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

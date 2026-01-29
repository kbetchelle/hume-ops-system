import { Home, FileText, MessageSquare, Wrench } from "lucide-react";
import type { ConciergeView } from "./ConciergeSidebar";

interface ConciergeBottomNavProps {
  activeView: ConciergeView;
  onViewChange: (view: ConciergeView) => void;
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
}: ConciergeBottomNavProps) {
  // Map the activeView to the closest tab
  const getActiveTab = () => {
    if (tabs.some((t) => t.id === activeView)) return activeView;
    if (["announcements"].includes(activeView)) return "messages";
    if (
      ["whos-working", "quick-links", "knowledge-base", "lost-found", "documents", "policies-qa"].includes(
        activeView
      )
    )
      return "templates";
    return "home";
  };

  const activeTab = getActiveTab();

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
                flex-1 h-full
                text-[10px] uppercase tracking-widest
                transition-colors duration-200
                ${isActive ? "text-foreground" : "text-muted-foreground"}
              `}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

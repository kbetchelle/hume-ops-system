import { NavLink } from "react-router-dom";
import type { MobileTabItem } from "@/components/mobile/mobile-nav-config";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  tabs: MobileTabItem[];
  activeId: string;
  onMoreClick?: () => void;
}

const TAB_HEIGHT = 64;
const SAFE_BOTTOM = "env(safe-area-inset-bottom)";

export function MobileBottomNav({ tabs, activeId, onMoreClick }: MobileBottomNavProps) {

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border backdrop-blur-lg bg-white/90 flex-shrink-0"
      style={{
        height: `calc(${TAB_HEIGHT}px + ${SAFE_BOTTOM} + 8px)`,
        paddingBottom: `calc(${SAFE_BOTTOM} + 8px)`,
      }}
    >
      <div className="flex items-stretch justify-around h-16">
        {tabs.map((tab) => {
          const isActive = activeId === tab.id;
          const isMore = tab.id === "more";

          if (tab.path) {
            return (
              <NavLink
                key={tab.id}
                to={tab.path}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 min-w-0 min-h-[44px] gap-0.5 transition-colors relative",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className="relative flex items-center justify-center min-w-[44px] min-h-[44px]">
                  <tab.icon className="h-6 w-6" strokeWidth={1.5} />
                  {tab.badge != null && tab.badge > 0 && (
                    <span className="absolute -top-0.5 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-white text-[10px] font-medium" style={{ backgroundColor: '#fcb827' }}>
                      {tab.badge > 99 ? "99+" : tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] uppercase tracking-widest truncate w-full text-center">
                  {tab.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                )}
              </NavLink>
            );
          }

          if (isMore && onMoreClick) {
            return (
              <button
                key={tab.id}
                type="button"
                onClick={onMoreClick}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 min-w-0 min-h-[44px] gap-0.5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className="flex items-center justify-center min-w-[44px] min-h-[44px]">
                  <tab.icon className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <span className="text-[10px] uppercase tracking-widest truncate w-full text-center">
                  {tab.label}
                </span>
              </button>
            );
          }

          if (tab.onSelect) {
            return (
              <button
                key={tab.id}
                type="button"
                onClick={tab.onSelect}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 min-w-0 min-h-[44px] gap-0.5 transition-colors relative",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className="relative flex items-center justify-center min-w-[44px] min-h-[44px]">
                  <tab.icon className="h-6 w-6" strokeWidth={1.5} />
                  {tab.badge != null && tab.badge > 0 && (
                    <span className="absolute -top-0.5 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-white text-[10px] font-medium" style={{ backgroundColor: '#fcb827' }}>
                      {tab.badge > 99 ? "99+" : tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] uppercase tracking-widest truncate w-full text-center">
                  {tab.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            );
          }

          return null;
        })}
      </div>
    </nav>
  );
}

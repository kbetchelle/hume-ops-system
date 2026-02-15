/**
 * Global Keyboard Shortcuts Hook
 * 
 * Provides centralized keyboard shortcut management for search functionality
 */

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export interface KeyboardShortcutHandlers {
  onListSearch?: () => void;
  onPageSearch?: () => void;
}

/**
 * Hook to set up global keyboard shortcuts for search
 * Automatically determines context based on current route
 */
export function useSearchKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isListPage = location.pathname === "/dashboard/resources/pages";
      const isReadingPage = location.pathname.startsWith("/dashboard/resources/pages/") && 
                            location.pathname.split("/").length === 5;

      // Cmd/Ctrl + K - Focus list search (on list page)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        if (isListPage && handlers.onListSearch) {
          e.preventDefault();
          handlers.onListSearch();
        }
      }

      // Cmd/Ctrl + F - Open in-page search (on reading page)
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        if (isReadingPage && handlers.onPageSearch) {
          e.preventDefault();
          handlers.onPageSearch();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [location, handlers]);
}

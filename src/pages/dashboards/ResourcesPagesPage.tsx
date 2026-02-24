import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ResourcePagesTab } from "@/components/staff-resources/ResourcePagesTab";
import { useActiveRole } from "@/hooks/useActiveRole";
import { useResourcePagesByRole } from "@/hooks/useStaffResources";
import { useScrollToResource } from "@/hooks/useScrollToResource";
import { saveSearch } from "@/lib/searchHistory";
import { useSearchKeyboardShortcuts } from "@/hooks/useSearchKeyboardShortcuts";

export default function ResourcesPagesPage() {
  const { activeRole } = useActiveRole();
  const { data: pages = [], isLoading } = useResourcePagesByRole(activeRole ?? "concierge");
  const [searchTerm, setSearchTerm] = useState("");
  const [focusSearch, setFocusSearch] = useState(false);
  
  useScrollToResource();

  // Keyboard shortcuts
  useSearchKeyboardShortcuts({
    onListSearch: () => setFocusSearch(true)
  });

  // Save search to history when user stops typing (debounced)
  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      const timer = setTimeout(() => {
        saveSearch(searchTerm);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [searchTerm]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  return (
    <DashboardLayout title="Resource Pages">
      <div>
        <ResourcePagesTab 
          pages={pages} 
          isLoading={isLoading} 
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          focusSearch={focusSearch}
          onSearchFocus={() => setFocusSearch(false)}
        />
      </div>
    </DashboardLayout>
  );
}

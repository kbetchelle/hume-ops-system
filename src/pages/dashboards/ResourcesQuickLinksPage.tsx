import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { QuickLinksTab } from "@/components/staff-resources/QuickLinksTab";
import { useActiveRole } from "@/hooks/useActiveRole";
import { useQuickLinkGroupsByRole } from "@/hooks/useStaffResources";
import { useScrollToResource } from "@/hooks/useScrollToResource";
import { saveSearch } from "@/lib/searchHistory";
import { useSearchKeyboardShortcuts } from "@/hooks/useSearchKeyboardShortcuts";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function ResourcesQuickLinksPage() {
  const { activeRole } = useActiveRole();
  const { data: groups = [], isLoading } = useQuickLinkGroupsByRole(activeRole ?? "concierge");
  const [searchTerm, setSearchTerm] = useState("");
  const [focusSearch, setFocusSearch] = useState(false);

  useScrollToResource();

  useSearchKeyboardShortcuts({
    onListSearch: () => setFocusSearch(true),
  });

  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      const timer = setTimeout(() => saveSearch(searchTerm), 1000);
      return () => clearTimeout(timer);
    }
  }, [searchTerm]);

  return (
    <DashboardLayout title="Quick Links">
      <div>
        <div className="relative mb-4">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="SEARCH QUICK LINKS"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-6"
            ref={(el) => {
              if (focusSearch && el) {
                el.focus();
                setFocusSearch(false);
              }
            }}
          />
        </div>
        <QuickLinksTab groups={groups} isLoading={isLoading} searchTerm={searchTerm} />
      </div>
    </DashboardLayout>
  );
}

import { useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";

const resourceSubPages = [
  { label: "Quick Links", path: "/dashboard/resources/quick-links" },
  { label: "Resource Pages", path: "/dashboard/resources/pages" },
  { label: "Policies", path: "/dashboard/resources/policies" },
];

export function StaffResourcesView() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const filtered = searchTerm
    ? resourceSubPages.filter((p) =>
        p.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : resourceSubPages;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search resources..."
            className="pl-10 rounded-none"
            autoFocus
          />
        </div>
        <div className="space-y-1">
          {filtered.map((page) => (
            <button
              key={page.path}
              type="button"
              onClick={() => navigate(page.path)}
              className="w-full text-left px-3 py-2.5 text-sm uppercase tracking-widest hover:bg-muted/50 transition-colors flex items-center gap-2"
            >
              <span className="text-muted-foreground text-base leading-none">•</span>
              <span className="hover:underline">{page.label}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-4">
              No resources match your search.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

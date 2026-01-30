import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { NavLink } from "@/components/NavLink";

interface NavItem {
  number?: number;
  title: string;
  url: string;
}

const leadFunnelItems: NavItem[] = [
  { number: 1, title: "All Clients", url: "/dashboard/members/all-clients" },
  { number: 2, title: "Guests", url: "/dashboard/members/guests" },
  { number: 3, title: "Application Submitted", url: "/dashboard/members/application-submitted" },
  { number: 4, title: "Waitlist", url: "/dashboard/members/waitlist" },
  { number: 5, title: "Onboarding", url: "/dashboard/members/onboarding" },
  { number: 6, title: "Subscription Active", url: "/dashboard/members/subscription-active" },
  { number: 7, title: "Subscription Past Due", url: "/dashboard/members/subscription-past-due" },
];

const additionalItems: NavItem[] = [
  { title: "Temporary Memberships", url: "/dashboard/members/temporary-memberships" },
  { title: "Pauses", url: "/dashboard/members/pauses" },
  { title: "Cancellations", url: "/dashboard/members/cancellations" },
];

export function MembersSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (url: string) => location.pathname === url;

  return (
    <aside className="w-64 border-r border-border bg-card/50 h-full shrink-0">
      <div className="p-6">
        {/* Back Button */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>

        {/* Title */}
        <h2 className="text-lg font-semibold mb-6">Member Management</h2>

        {/* Divider */}
        <div className="h-px bg-border mb-6" />

        {/* Lead Funnel Section */}
        <div className="mb-8">
          <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
            Lead Funnel
          </h3>
          <nav className="space-y-1">
            {leadFunnelItems.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm transition-colors rounded-sm",
                  "hover:bg-muted/50"
                )}
                activeClassName="bg-muted text-foreground font-medium"
              >
                <span className="text-xs text-muted-foreground w-4">{item.number}</span>
                <span>{item.title}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Additional Sections */}
        <nav className="space-y-1">
          {additionalItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm transition-colors rounded-sm",
                "hover:bg-muted/50"
              )}
              activeClassName="bg-muted text-foreground font-medium"
            >
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}

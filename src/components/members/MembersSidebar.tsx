import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

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

  return (
    <Sidebar className="w-60 border-r border-border">
      <SidebarContent className="pt-4">
        {/* Back Button */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate("/dashboard")}
                className="rounded-none px-4 py-2 h-auto text-xs tracking-wide transition-colors duration-200 hover:bg-muted/50 text-muted-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-3" />
                <span>←</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Lead Funnel Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] font-normal text-muted-foreground px-4 py-2">
            Lead Funnel
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {leadFunnelItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild className="rounded-none px-4 py-2 h-auto">
                    <NavLink
                      to={item.url}
                      className="text-xs tracking-wide transition-colors duration-200 hover:bg-muted/50 text-muted-foreground"
                      activeClassName="bg-muted text-foreground"
                    >
                      <span className="text-[10px] text-muted-foreground w-4 mr-3">{item.number}</span>
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Additional Sections */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] font-normal text-muted-foreground px-4 py-2">
            Other
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {additionalItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild className="rounded-none px-4 py-2 h-auto">
                    <NavLink
                      to={item.url}
                      className="text-xs tracking-wide transition-colors duration-200 hover:bg-muted/50 text-muted-foreground"
                      activeClassName="bg-muted text-foreground"
                    >
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

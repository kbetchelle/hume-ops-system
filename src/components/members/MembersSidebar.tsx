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
    <Sidebar className="w-[250px] border-r border-border">
      <SidebarContent className="pt-4">
        {/* Back Button */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate("/dashboard")}
                className="rounded-none px-3 py-2 h-auto text-[12px] uppercase tracking-widest transition-colors duration-200 hover:bg-muted/50 text-muted-foreground"
              >
                <ArrowLeft className="h-4 w-4 shrink-0 stroke-[1.5]" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Lead Funnel Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground px-3">
            Lead Funnel
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {leadFunnelItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild className="rounded-none">
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-3 py-2 text-[12px] uppercase tracking-widest transition-colors duration-200 hover:bg-muted/50 text-muted-foreground"
                      activeClassName="bg-muted text-foreground font-medium"
                    >
                      <span className="text-[10px] text-muted-foreground shrink-0">{item.number}</span>
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
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground px-3">
            Other
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {additionalItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild className="rounded-none">
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-3 py-2 text-[12px] uppercase tracking-widest transition-colors duration-200 hover:bg-muted/50 text-muted-foreground"
                      activeClassName="bg-muted text-foreground font-medium"
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

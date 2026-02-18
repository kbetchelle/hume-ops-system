import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ArrowLeftRight, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useActiveRole } from "@/hooks/useActiveRole";
import { getRoleDashboardPath } from "@/hooks/useUserRoles";
import { AppRole } from "@/types/roles";
import { toast } from "sonner";

interface RoleSwitcherProps {
  collapsed?: boolean;
  variant?: "sidebar" | "header";
}

export function RoleSwitcher({ collapsed = false, variant = "sidebar" }: RoleSwitcherProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeRole, setActiveRole, availableRoles, getRoleLabel } = useActiveRole();

  // Detect which role view is currently being displayed based on the URL path
  const getCurrentViewRole = (): AppRole | null => {
    const path = location.pathname;
    if (path.includes("/dashboard/admin")) return "admin";
    if (path.includes("/dashboard/manager")) return "manager";
    if (path.includes("/dashboard/concierge")) return "concierge";
    if (path.includes("/dashboard/trainer")) return "trainer";
    if (path.includes("/dashboard/spa/male")) return "male_spa_attendant";
    if (path.includes("/dashboard/spa/female")) return "female_spa_attendant";
    if (path.includes("/dashboard/spa")) {
      if (activeRole === "male_spa_attendant" || activeRole === "female_spa_attendant") return activeRole;
      return null;
    }
    if (path.includes("/dashboard/floater")) return "floater";
    if (path.includes("/dashboard/cafe")) return "cafe";
    return activeRole;
  };

  const currentViewRole = getCurrentViewRole();
  const hasMultipleRoles = availableRoles.length > 1;

  // Single role: show Badge (or null when collapsed)
  if (!hasMultipleRoles) {
    if (collapsed) return null;
    return (
      <Badge variant="outline" className="text-[10px] uppercase tracking-widest">
        {currentViewRole ? getRoleLabel(currentViewRole) : "No Role"}
      </Badge>
    );
  }

  const handleSwitchRole = (role: string) => {
    setActiveRole(role as AppRole);
    navigate(getRoleDashboardPath(role as AppRole));
    toast.success(`Switched to ${getRoleLabel(role as AppRole)} view`);
  };

  const isSidebar = variant === "sidebar";
  const isHeader = variant === "header";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={isHeader ? "outline" : "ghost"}
          size="sm"
          className={cn(
            "gap-2 rounded-none text-xs uppercase tracking-widest",
            isSidebar && "w-full justify-start px-0 h-auto py-1",
            isSidebar && collapsed && "h-8 w-8 p-0",
            isHeader && "h-8"
          )}
        >
          {isSidebar && !collapsed && (
            <span className="pl-2 whitespace-normal text-left leading-tight">
              {currentViewRole ? `${getRoleLabel(currentViewRole)} Role View` : "Switch View"}
            </span>
          )}
          {isHeader && (
            <>
              <ArrowLeftRight className="h-4 w-4" />
              <span className="text-[10px] uppercase tracking-widest">
                {currentViewRole ? getRoleLabel(currentViewRole) : "Select Role"}
              </span>
            </>
          )}
          <ChevronDown className="h-3 w-3 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side={isSidebar ? "top" : "bottom"}
        className="rounded-none w-48 bg-background border border-border z-50"
      >
        
        {availableRoles.map((userRole) => {
          const isCurrentView = currentViewRole === userRole.role;
          return (
            <DropdownMenuItem
              key={userRole.id}
              onClick={() => handleSwitchRole(userRole.role)}
              className={cn("flex items-center justify-between rounded-none cursor-pointer", isSidebar && "text-xs uppercase tracking-widest")}
              style={isCurrentView ? { backgroundColor: "hsl(0 0% 90%)", color: "hsl(0 0% 0%)" } : undefined}
            >
              <span className="text-xs uppercase tracking-widest">
                {getRoleLabel(userRole.role)}
              </span>
              {isCurrentView && (
                <Check className="h-4 w-4" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

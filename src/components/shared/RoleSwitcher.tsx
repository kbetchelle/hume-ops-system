import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeftRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useActiveRole } from "@/hooks/useActiveRole";
import { getRoleDashboardPath } from "@/hooks/useUserRoles";
import { AppRole } from "@/types/roles";

export function RoleSwitcher() {
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
    if (path.includes("/dashboard/spa")) return "female_spa_attendant";
    if (path.includes("/dashboard/floater")) return "floater";
    if (path.includes("/dashboard/cafe")) return "cafe";
    return activeRole;
  };

  const currentViewRole = getCurrentViewRole();

  // Show if user has multiple roles (managers or admins who can switch between roles)
  const hasManagerRole = availableRoles.some((r) => r.role === "manager");
  const hasAdminRole = availableRoles.some((r) => r.role === "admin");
  const hasMultipleRoles = availableRoles.length > 1;

  // Only show if user has manager/admin role AND has multiple roles to switch between
  if (!(hasManagerRole || hasAdminRole) || !hasMultipleRoles) {
    return null;
  }

  const handleSwitchRole = (role: string) => {
    setActiveRole(role as AppRole);
    navigate(getRoleDashboardPath(role as AppRole));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 rounded-none text-[10px] uppercase tracking-widest"
        >
          <ArrowLeftRight className="h-4 w-4" />
          {currentViewRole ? getRoleLabel(currentViewRole) : "Switch View"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-none w-48 bg-background border border-border z-50">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Role Views
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableRoles.map((userRole) => {
          const isCurrentView = currentViewRole === userRole.role || 
            (currentViewRole === "female_spa_attendant" && userRole.role === "male_spa_attendant") ||
            (currentViewRole === "male_spa_attendant" && userRole.role === "female_spa_attendant");
          return (
            <DropdownMenuItem
              key={userRole.id}
              onClick={() => handleSwitchRole(userRole.role)}
              className="flex items-center justify-between rounded-none cursor-pointer"
            >
              <span className="text-xs uppercase tracking-wide">
                {getRoleLabel(userRole.role)}
              </span>
              {isCurrentView && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

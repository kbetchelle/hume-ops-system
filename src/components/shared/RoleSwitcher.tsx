import { useNavigate } from "react-router-dom";
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

export function RoleSwitcher() {
  const navigate = useNavigate();
  const { activeRole, setActiveRole, availableRoles, getRoleLabel } = useActiveRole();

  // Only show if user has manager role AND is currently viewing a non-manager dashboard
  const hasManagerRole = availableRoles.some((r) => r.role === "manager");
  const isNotManagerView = activeRole !== "manager";

  if (!hasManagerRole || !isNotManagerView) {
    return null;
  }

  const handleSwitchRole = (role: string) => {
    setActiveRole(role as any);
    navigate(getRoleDashboardPath(role as any));
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
          Switch View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-none w-48 bg-background border border-border z-50">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Role Views
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableRoles.map((userRole) => (
          <DropdownMenuItem
            key={userRole.id}
            onClick={() => handleSwitchRole(userRole.role)}
            className="flex items-center justify-between rounded-none cursor-pointer"
          >
            <span className="text-xs uppercase tracking-wide">
              {getRoleLabel(userRole.role)}
            </span>
            {activeRole === userRole.role && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

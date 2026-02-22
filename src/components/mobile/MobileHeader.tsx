import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useActiveRole } from "@/hooks/useActiveRole";
import { getRoleDashboardPath } from "@/hooks/useUserRoles";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/concierge/NotificationBell";
import humeLogo from "@/assets/hume-logo.png";
import type { AppRole } from "@/types/roles";

interface MobileHeaderProps {
  title: string;
  roleChipClassName?: string;
}

function getCurrentViewRole(path: string, activeRole: AppRole | null): AppRole | null {
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
}

export function MobileHeader({ title, roleChipClassName }: MobileHeaderProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const { activeRole, availableRoles, setActiveRole, getRoleLabel } = useActiveRole();
  const currentViewRole = getCurrentViewRole(location.pathname, activeRole);

  const handleRoleSelect = (role: AppRole) => {
    setActiveRole(role);
    navigate(getRoleDashboardPath(role));
  };

  if (!isMobile) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background flex-shrink-0" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="flex h-full items-center justify-between gap-2 px-3">
        {/* Left: logo */}
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="flex items-center shrink-0 min-w-[44px] min-h-[44px] -m-2 items-center justify-center"
          aria-label="Home"
        >
          <img
            src={humeLogo}
            alt="HUME"
            className="h-8 w-auto"
          />
        </button>

        {/* Right: notification bell + role chip */}
        <div className="flex-1 flex items-center justify-end gap-0 shrink-0">
          <div className="min-w-[44px] min-h-[44px] flex items-center justify-center">
            <NotificationBell />
          </div>
          {availableRoles.length > 1 && currentViewRole && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className={cn("rounded-none text-[10px] font-normal h-7 px-2 gap-0.5 shrink-0", roleChipClassName)}
                >
                  <span className="truncate max-w-[80px]">{getRoleLabel(currentViewRole)}</span>
                  <ChevronDown className="h-3 w-3 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[160px]">
                {availableRoles.map(({ role }) => (
                  <DropdownMenuItem
                    key={role}
                    onClick={() => handleRoleSelect(role as AppRole)}
                    className="text-xs uppercase tracking-widest cursor-pointer"
                  >
                    {getRoleLabel(role as AppRole)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}

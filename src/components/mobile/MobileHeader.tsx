import { useNavigate } from "react-router-dom";
import { User, Settings, LogOut, Bell, ChevronDown, ArrowLeftRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { isSharedDevice } from "@/components/auth/LockScreen";
import { useUserProfile } from "@/hooks/useUserRoles";
import { useActiveRole } from "@/hooks/useActiveRole";
import { useLanguage } from "@/contexts/LanguageContext";
import { getRoleDashboardPath } from "@/hooks/useUserRoles";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/concierge/NotificationBell";
import { BugReportDialog } from "@/components/feedback/BugReportDialog";
import { toast } from "sonner";
import { useState } from "react";
import humeLogo from "@/assets/hume-logo.png";
import type { AppRole } from "@/types/roles";

interface MobileHeaderProps {
  title: string;
  hideAvatar?: boolean;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function MobileHeader({ title, hideAvatar = false }: MobileHeaderProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user, signOut, openUserSwitchScreen } = useAuthContext();
  const showSwitchUser = isSharedDevice();
  const { data: profile } = useUserProfile(user?.id);
  const { activeRole, availableRoles, setActiveRole, getRoleLabel } = useActiveRole();
  const { t } = useLanguage();
  const [showBugReport, setShowBugReport] = useState(false);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out");
      navigate("/");
    }
  };

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

        {/* Center: role chip (no title) */}
        <div className="flex-1 min-w-0 flex items-center justify-center">
          {availableRoles.length > 1 && activeRole && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-full text-[10px] font-normal h-7 px-2 gap-0.5 shrink-0"
                >
                  <span className="truncate max-w-[80px]">{getRoleLabel(activeRole)}</span>
                  <ChevronDown className="h-3 w-3 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="min-w-[160px]">
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

        {/* Right: notification bell + avatar */}
        <div className="flex items-center gap-0 shrink-0">
          <div className="min-w-[44px] min-h-[44px] flex items-center justify-center">
            <NotificationBell />
          </div>
          {!hideAvatar && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-10 w-10 min-w-[44px] min-h-[44px]"
                aria-label="Account menu"
              >
                <span className="text-xs font-medium bg-muted rounded-full h-8 w-8 flex items-center justify-center">
                  {getInitials(profile?.full_name)}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-none border-border bg-background z-50">
              <DropdownMenuItem
                onClick={() => navigate("/dashboard/notifications")}
                className="text-xs uppercase tracking-widest cursor-pointer rounded-none"
              >
                <Bell className="mr-2 h-3 w-3" />
                {t("Notifications", "Notificaciones")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate("/dashboard/profile")}
                className="text-xs uppercase tracking-widest cursor-pointer rounded-none"
              >
                <User className="mr-2 h-3 w-3" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate("/dashboard/settings")}
                className="text-xs uppercase tracking-widest cursor-pointer rounded-none"
              >
                <Settings className="mr-2 h-3 w-3" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              {showSwitchUser && (
                <DropdownMenuItem
                  onClick={() => openUserSwitchScreen()}
                  className="text-xs uppercase tracking-widest cursor-pointer rounded-none"
                >
                  <ArrowLeftRight className="mr-2 h-3 w-3" />
                  Switch User
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => setShowBugReport(true)}
                className="text-xs uppercase tracking-widest cursor-pointer rounded-none"
              >
                Report a Bug
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-xs uppercase tracking-widest cursor-pointer rounded-none"
              >
                <LogOut className="mr-2 h-3 w-3" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          )}
        </div>
      </div>
      <BugReportDialog open={showBugReport} onOpenChange={setShowBugReport} />
    </header>
  );
}

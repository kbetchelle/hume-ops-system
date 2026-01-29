import { Search, LogOut, Moon, Sun, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentShift } from "@/hooks/useCurrentShift";
import humeLogo from "@/assets/hume-logo.png";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ConciergeHeader() {
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();
  const { currentShift, isManualOverride, toggleShift, resetToAuto, shiftStartTime, shiftEndTime } =
    useCurrentShift();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <header className="h-14 border-b border-border bg-background flex items-center justify-between px-4 md:px-6">
      {/* Logo */}
      <div className="flex items-center gap-4">
        <img src={humeLogo} alt="HUME" className="h-6" />
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Shift Badge Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleShift}
              onDoubleClick={resetToAuto}
              className="gap-2 rounded-none text-[10px] uppercase tracking-widest"
            >
              <Clock className="h-4 w-4" />
              {currentShift} Shift
              {isManualOverride && (
                <Badge variant="secondary" className="rounded-none text-[9px] ml-1">
                  Manual
                </Badge>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="rounded-none">
            <p className="text-xs">
              {shiftStartTime} - {shiftEndTime}
            </p>
            {isManualOverride && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Double-click to reset to auto
              </p>
            )}
          </TooltipContent>
        </Tooltip>

        {/* Search */}
        <Button variant="ghost" size="icon" className="rounded-none">
          <Search className="h-4 w-4" />
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-none"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* Logout */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-none"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

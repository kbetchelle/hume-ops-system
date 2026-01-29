import { Search, LogOut, Moon, Sun } from "lucide-react";
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
        {/* Shift Badge */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleShift}
              onDoubleClick={resetToAuto}
              className="focus:outline-none"
            >
              <Badge
                variant="outline"
                className={`
                  rounded-none text-[10px] uppercase tracking-widest px-3 py-1
                  cursor-pointer select-none
                  ${isManualOverride ? "border-primary text-primary" : ""}
                `}
              >
                {currentShift} Shift
              </Badge>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="rounded-none">
            <p className="text-xs">
              {shiftStartTime} - {shiftEndTime}
              {isManualOverride && (
                <span className="block text-muted-foreground">
                  Manual override • Double-click to reset
                </span>
              )}
            </p>
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

import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

interface PushPromptBannerProps {
  onEnable: () => Promise<void>;
  onLater: () => void;
  isLoading?: boolean;
}

export function PushPromptBanner({ onEnable, onLater, isLoading }: PushPromptBannerProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 text-sm border-b bg-muted/80 border-border">
      <Bell className="h-5 w-5 shrink-0 text-muted-foreground" />
      <p className="flex-1 min-w-0 font-medium">
        Get notified about new messages and reminders?
      </p>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="sm" onClick={onLater} disabled={isLoading} className="text-xs">
          Later
        </Button>
        <Button size="sm" onClick={onEnable} disabled={isLoading} className="text-xs">
          {isLoading ? "…" : "Enable"}
        </Button>
      </div>
    </div>
  );
}

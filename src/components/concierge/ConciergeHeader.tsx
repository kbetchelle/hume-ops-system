import { useNavigate } from "react-router-dom";
import humeLogo from "@/assets/hume-logo.png";
import { NotificationBell } from "./NotificationBell";

interface ConciergeHeaderProps {
  title?: string;
}

export function ConciergeHeader({ title = "Concierge" }: ConciergeHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="flex h-20 items-center justify-between px-4 md:px-6">
        <h1 className="text-[18px] uppercase tracking-widest font-normal truncate">
          {title}
        </h1>

        <div className="flex items-center gap-2">
          <img
            src={humeLogo}
            alt="Hume"
            className="h-[50px] w-auto cursor-pointer hover:opacity-70 transition-opacity my-[12px]"
            onClick={() => navigate("/dashboard")}
          />
        </div>
      </div>
    </header>
  );
}

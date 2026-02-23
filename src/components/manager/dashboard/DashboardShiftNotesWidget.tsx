import { Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function DashboardShiftNotesWidget() {
  const navigate = useNavigate();

  return (
    <div
      className="border border-border rounded-lg p-4 flex flex-col min-h-[320px] cursor-pointer hover:border-primary/40 transition-colors"
      onClick={() => navigate("/dashboard/members")}
    >
      <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-widest flex items-center gap-2">
          <Users className="h-4 w-4" />
          Membership Changes
        </h3>
      </div>
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Upcoming Feature
      </div>
    </div>
  );
}

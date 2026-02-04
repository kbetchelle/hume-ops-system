import { DevTaskTracker } from "./DevTaskTracker";
import { DevNotesCard } from "./DevNotesCard";

export function DevDashboardSection() {
  return (
    <div className="flex gap-6 h-full">
      {/* Notes card on the left */}
      <DevNotesCard />
      
      {/* Task tracker on the right */}
      <DevTaskTracker />
    </div>
  );
}

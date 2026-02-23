import { FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardShiftNotes } from "@/hooks/useDashboardShiftNotes";
import { add_color } from "@/lib/constants";
import { solidStyle } from "@/lib/notificationConfig";
import { format, parseISO } from "date-fns";

const SOURCE_COLORS: Record<string, string> = {
  concierge: add_color.yellow,
  cafe: add_color.green,
  boh: add_color.purple,
};

export function DashboardShiftNotesWidget() {
  const { notes, isLoading } = useDashboardShiftNotes();

  return (
    <div className="border border-border rounded-lg p-4 flex flex-col min-h-[320px]">
      <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-widest flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Shift Report Notes
          {notes.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 font-medium text-muted-foreground bg-muted">
              {notes.length}
            </span>
          )}
        </h3>
      </div>

      {isLoading ? (
        <div className="space-y-2 flex-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          No shift notes from today or yesterday
        </div>
      ) : (
        <ScrollArea className="flex-1 max-h-[400px]">
          <div className="space-y-2">
            {notes.map((note) => (
              <div
                key={note.id}
                className="rounded border border-border p-3 text-sm"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[10px] px-1.5 py-0.5 uppercase tracking-widest"
                    style={solidStyle(SOURCE_COLORS[note.source] ?? add_color.blue)}
                  >
                    {note.sourceLabel}
                  </span>
                  {note.shiftType && (
                    <span className="text-[10px] px-1.5 py-0.5 uppercase tracking-widest bg-muted text-muted-foreground">
                      {note.shiftType}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {format(parseISO(note.createdAt), "MMM d, h:mm a")}
                  </span>
                </div>
                <p className="text-foreground line-clamp-3">{note.content}</p>
                <p className="text-xs text-muted-foreground mt-1">— {note.staffName}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

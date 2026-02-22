import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import type { MoreMenuItem } from "@/components/mobile/mobile-nav-config";
import { cn } from "@/lib/utils";

interface MoreMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: MoreMenuItem[];
  onItemSelect: (item: MoreMenuItem) => void;
}

/** Drag handle for bottom sheet (swipe-to-dismiss affordance). */
function DragHandle() {
  return (
    <div className="flex justify-center pt-3 pb-2">
      <div className="w-10 h-1 rounded-full bg-muted-foreground/30" aria-hidden />
    </div>
  );
}

export function MoreMenuSheet({ open, onOpenChange, items, onItemSelect }: MoreMenuSheetProps) {
  const handleSelect = (item: MoreMenuItem) => {
    onItemSelect(item);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl pt-0 pb-[env(safe-area-inset-bottom)] max-h-[85vh] overflow-hidden flex flex-col"
      >
        <DragHandle />
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                className={cn(
                  "flex items-center gap-3 w-full min-h-[44px] px-4 py-3 rounded-lg text-left",
                  "text-sm uppercase tracking-widest text-foreground",
                  "hover:bg-muted/60 active:bg-muted transition-colors"
                )}
              >
                <Icon className="h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <span className="shrink-0 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

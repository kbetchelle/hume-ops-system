import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { formatDistanceToNow, parseISO, format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { solidStyle, tintBorderStyle } from "@/lib/notificationConfig";
import { add_color } from "@/lib/constants";
import type { InboxItem, InboxItemType, FlagInboxData } from "@/types/inbox";

const HEX = add_color.orange; // Outdated flags → orange

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  quick_link_group: "Quick Link Group",
  quick_link_item: "Quick Link Item",
  resource_page: "Resource Page",
  club_policy: "Policy",
};

const RESOURCE_VIEW_ROUTES: Record<string, string> = {
  quick_link_group: "/dashboard/resources/quick-links",
  quick_link_item: "/dashboard/resources/quick-links",
  resource_page: "/dashboard/resources/pages",
  club_policy: "/dashboard/resources/policies",
};

const RESOURCE_EDIT_ROUTES: Record<string, string> = {
  quick_link_group: "/dashboard/manager/staff-resources",
  quick_link_item: "/dashboard/manager/staff-resources",
  resource_page: "/dashboard/manager/staff-resources",
  club_policy: "/dashboard/manager/staff-resources",
};

export function FlagInboxItem({ item, onResolve, onMarkRead }: {
  item: InboxItem;
  onResolve: (flagId: string, status: "dismissed" | "resolved", note?: string) => void;
  onMarkRead: (itemType: InboxItemType, itemId: string) => void;
}) {
  const data = item.data as FlagInboxData;
  const navigate = useNavigate();
  const markedRef = useRef(false);

  useEffect(() => {
    if (!item.isRead && !markedRef.current) {
      markedRef.current = true;
      onMarkRead("flag", item.id);
    }
  }, [item.isRead, item.id, onMarkRead]);

  const handleView = () => {
    const route = RESOURCE_VIEW_ROUTES[data.resourceType];
    if (route) navigate(`${route}?highlight=${data.resourceId}`);
  };

  const handleEdit = () => {
    const route = RESOURCE_EDIT_ROUTES[data.resourceType];
    if (route) navigate(route);
  };

  const handleDismiss = () => {
    if (window.confirm("Dismiss this flag? The resource will no longer show as under review.")) {
      onResolve(item.id, "dismissed");
    }
  };

  return (
    <div
      role="article"
      className={cn("flex gap-3 p-4 border transition-colors hover:bg-muted/50")}
      style={!item.isRead ? tintBorderStyle(HEX) : undefined}
    >
      {/* Icon badge – solid */}
      <div className="shrink-0 h-7 w-7 flex items-center justify-center" style={solidStyle(HEX)}>
        <AlertTriangle className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-[9px] px-1.5 py-0.5 uppercase tracking-widest shrink-0"
            style={solidStyle(HEX)}
          >
            Outdated Flag
          </span>
          <span className="text-[10px] text-muted-foreground">{data.flaggedByName}</span>
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true })}
          </span>
        </div>

        <p className="text-sm font-medium">
          {data.resourceLabel}
          {data.flaggedPageNumber && (
            <span className="text-xs font-semibold ml-2" style={{ color: add_color.blue }}>
              Page {data.flaggedPageNumber}
            </span>
          )}
          <span className="text-xs text-muted-foreground font-normal ml-1.5">
            ({RESOURCE_TYPE_LABELS[data.resourceType] ?? data.resourceType})
          </span>
        </p>

        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{data.note}</p>

        {data.flaggedPageContext && (
          <p className="text-xs text-muted-foreground mt-2 italic border-l-2 border-muted pl-2 line-clamp-2">
            "{data.flaggedPageContext}"
          </p>
        )}

        {(data.status === "dismissed" || data.status === "resolved") && (
          <div className="mt-2 text-[10px] text-muted-foreground">
            <span className="capitalize">{data.status}</span>
            {data.resolvedByName && <span> by {data.resolvedByName}</span>}
            {data.resolvedAt && (
              <span> &bull; {format(parseISO(data.resolvedAt), "MMM d, yyyy")}</span>
            )}
            {data.resolutionNote && (
              <span className="block mt-0.5 italic">{data.resolutionNote}</span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {data.status === "pending" && (
        <div className="shrink-0 flex flex-col gap-1 items-end">
          <Button variant="outline" size="sm" className="rounded-none text-xs" onClick={handleView}>
            View
          </Button>
          <Button variant="ghost" size="sm" className="rounded-none text-xs" onClick={handleDismiss}>
            Dismiss
          </Button>
          <Button variant="ghost" size="sm" className="rounded-none text-xs" onClick={handleEdit}>
            Edit Resource
          </Button>
        </div>
      )}
    </div>
  );
}

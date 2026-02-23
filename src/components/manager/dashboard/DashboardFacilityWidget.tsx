import { Wrench, Check, X, Image as ImageIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useFacilityIssues, useUpdateFacilityIssueStatus } from "@/hooks/useFacilityIssues";
import { useUserProfile } from "@/hooks/useUserRoles";
import { useAuthContext } from "@/features/auth/AuthProvider";
import { add_color } from "@/lib/constants";
import { solidStyle, tintBorderStyle } from "@/lib/notificationConfig";
import { format, parseISO } from "date-fns";

export function DashboardFacilityWidget() {
  const { data: issues, isLoading } = useFacilityIssues(5);
  const updateStatus = useUpdateFacilityIssueStatus();
  const { user } = useAuthContext();
  const { data: profile } = useUserProfile(user?.id);

  const pendingIssues = (issues ?? []).filter((i) => i.status === "pending");

  const handleResolve = (issueId: string) => {
    updateStatus.mutate({
      issueId,
      status: "resolved",
      resolvedByName: profile?.full_name ?? "Manager"
    });
  };

  const handleDismiss = (issueId: string) => {
    updateStatus.mutate({
      issueId,
      status: "dismissed",
      resolvedByName: profile?.full_name ?? "Manager"
    });
  };

  const sourceLabel = (s: string) => {
    switch (s) {
      case "concierge":return "Concierge";
      case "cafe":return "Cafe";
      case "boh":return "BoH";
      default:return s;
    }
  };

  return (
    <div className="border border-border rounded-lg p-4 flex flex-col min-h-[320px]">
      <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-widest flex items-center gap-2">
          <Wrench className="h-4 w-4" />
          Recent Facility Issues
          {pendingIssues.length > 0 &&
          <span
            className="text-[10px] flex items-center justify-center font-medium"
            style={{ backgroundColor: add_color.orange, color: "#fff", width: "38px", height: "38px" }}>

              {pendingIssues.length}
            </span>
          }
        </h3>
      </div>

      {isLoading ?
      <div className="space-y-2 flex-1">
          {Array.from({ length: 3 }).map((_, i) =>
        <Skeleton key={i} className="h-16 w-full" />
        )}
        </div> :
      (issues ?? []).length === 0 ?
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Upcoming Feature 
        </div> :

      <ScrollArea className="flex-1 max-h-[400px]">
          <div className="space-y-2">
            {(issues ?? []).map((issue) =>
          <div
            key={issue.id}
            className="rounded border p-3 text-sm"
            style={
            issue.status === "pending" ?
            tintBorderStyle(add_color.orange) :
            undefined
            }>

                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground line-clamp-2">
                      {issue.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{issue.reported_by_name}</span>
                      <span>·</span>
                      <span
                    className="text-[10px] px-1.5 py-0.5 uppercase tracking-widest"
                    style={solidStyle(add_color.blue)}>

                        {sourceLabel(issue.source)}
                      </span>
                      <span>·</span>
                      <span>{format(parseISO(issue.created_at), "MMM d, h:mm a")}</span>
                    </div>
                    {issue.status !== "pending" &&
                <p className="text-xs text-muted-foreground mt-1">
                        {issue.status === "resolved" ? "✓ Resolved" : "✗ Dismissed"} by {issue.resolved_by_name}
                      </p>
                }
                  </div>
                  {issue.photo_url &&
              <img
                src={issue.photo_url}
                alt="Issue photo"
                className="h-10 w-10 rounded object-cover shrink-0" />

              }
                </div>
                {issue.status === "pending" &&
            <div className="flex gap-2 mt-2">
                    <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => handleResolve(issue.id)}
                disabled={updateStatus.isPending}>

                      <Check className="h-3 w-3 mr-1" /> Resolve
                    </Button>
                    <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => handleDismiss(issue.id)}
                disabled={updateStatus.isPending}>

                      <X className="h-3 w-3 mr-1" /> Dismiss
                    </Button>
                  </div>
            }
              </div>
          )}
          </div>
        </ScrollArea>
      }
    </div>);

}
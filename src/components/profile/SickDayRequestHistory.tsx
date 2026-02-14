import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Calendar, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSickDayRequests } from "@/hooks/useSickDayRequests";
import { cn } from "@/lib/utils";

interface SickDayRequestHistoryProps {
  userId: string;
  onRequestSickDay?: () => void;
}

export function SickDayRequestHistory({ userId, onRequestSickDay }: SickDayRequestHistoryProps) {
  const { data: requests, isLoading } = useSickDayRequests(userId);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card className="rounded-none">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-xs uppercase tracking-widest font-normal flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Sick Day Pay Requests
          </CardTitle>
          {onRequestSickDay &&
          <Button variant="outline" size="sm" className="rounded-none text-[10px] uppercase tracking-widest h-7 px-2" onClick={onRequestSickDay}>
              <Plus className="h-3 w-3 mr-1" />
              Request
            </Button>
          }
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) =>
            <Skeleton key={i} className="h-20 w-full rounded-none" />
            )}
          </div>
        </CardContent>
      </Card>);

  }

  if (!requests || requests.length === 0) {
    return (
      <Card className="rounded-none">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-xs uppercase tracking-widest font-normal flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Sick Day Pay Requests
          </CardTitle>
          {onRequestSickDay &&
          <Button variant="outline" size="sm" className="rounded-none text-[10px] uppercase tracking-widest h-7 px-2" onClick={onRequestSickDay}>
              <Plus className="h-3 w-3 mr-1" />
              Request
            </Button>
          }
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            No sick day pay requests yet.
          </p>
        </CardContent>
      </Card>);

  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="text-[9px] px-1.5 py-0 text-amber-600 border-amber-300 bg-amber-50 uppercase tracking-widest">

            Pending
          </Badge>);

      case "approved":
        return (
          <Badge
            variant="outline"
            className="text-[9px] px-1.5 py-0 text-emerald-600 border-emerald-300 bg-emerald-50 uppercase tracking-widest">

            Approved
          </Badge>);

      case "rejected":
        return (
          <Badge
            variant="outline"
            className="text-[9px] px-1.5 py-0 text-red-600 border-red-300 bg-red-50 uppercase tracking-widest">

            Rejected
          </Badge>);

      default:
        return null;
    }
  };

  return (
    <Card className="rounded-none">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-xs uppercase tracking-widest font-normal flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Sick Day Pay Requests
        </CardTitle>
        {onRequestSickDay &&
        <Button variant="outline" size="sm" className="rounded-none text-[10px] uppercase tracking-widest h-7 px-2" onClick={onRequestSickDay}>
            <Plus className="h-3 w-3 mr-1" />
            Request
          </Button>
        }
      </CardHeader>
      <CardContent className="space-y-2">
        {requests.map((request) => {
          const isExpanded = expandedId === request.id;
          const hasReviewInfo =
          (request.status === "approved" || request.status === "rejected") && (
          request.reviewed_by_name || request.review_notes);

          return (
            <div
              key={request.id}
              className={cn(
                "border p-3 transition-colors",
                request.status === "pending" && "border-l-2 border-l-amber-500 bg-amber-50/30"
              )}>

              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Status and Date */}
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(request.status)}
                    <span className="text-muted-foreground text-xs">
                      Submitted {format(parseISO(request.created_at), "MMM d, yyyy")}
                    </span>
                  </div>

                  {/* Requested Dates */}
                  <div className="mb-2">
                    <p className="uppercase tracking-widest text-muted-foreground mb-1 text-xs">
                      Requested Dates
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {request.requested_dates.map((date) =>
                      <Badge
                        key={date}
                        variant="secondary"
                        className="text-[9px] rounded-none">

                          {format(parseISO(date), "MMM d, yyyy")}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Notes (truncated) */}
                  <div>
                    <p className="uppercase tracking-widest text-muted-foreground mb-1 text-xs">
                      Notes
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {request.notes}
                    </p>
                  </div>

                  {/* Review Info (if expanded) */}
                  {isExpanded && hasReviewInfo &&
                  <div className="mt-3 pt-3 border-t space-y-2">
                      {request.reviewed_by_name &&
                    <div>
                          <p className="uppercase tracking-widest text-muted-foreground text-xs">
                            Reviewed By
                          </p>
                          <p className="text-xs">{request.reviewed_by_name}</p>
                        </div>
                    }
                      {request.reviewed_at &&
                    <div>
                          <p className="uppercase tracking-widest text-muted-foreground text-xs">
                            Reviewed On
                          </p>
                          <p className="text-xs">
                            {format(parseISO(request.reviewed_at), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                    }
                      {request.review_notes &&
                    <div>
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            Review Notes
                          </p>
                          <p className="text-xs text-muted-foreground">{request.review_notes}</p>
                        </div>
                    }
                    </div>
                  }
                </div>

                {/* Expand/Collapse button */}
                {hasReviewInfo &&
                <button
                  onClick={() => setExpandedId(isExpanded ? null : request.id)}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">

                    {isExpanded ?
                  <ChevronUp className="h-4 w-4" /> :

                  <ChevronDown className="h-4 w-4" />
                  }
                  </button>
                }
              </div>
            </div>);

        })}
      </CardContent>
    </Card>);

}
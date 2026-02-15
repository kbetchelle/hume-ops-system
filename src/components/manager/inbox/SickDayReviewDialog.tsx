import { useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useReviewSickDayRequest } from "@/hooks/useSickDayRequests";
import type { InboxItem, SickDayInboxData } from "@/types/inbox";

interface SickDayReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: InboxItem | null;
  action: "approve" | "reject" | null;
}

export function SickDayReviewDialog({
  open,
  onOpenChange,
  request,
  action,
}: SickDayReviewDialogProps) {
  const [reviewNotes, setReviewNotes] = useState("");
  const reviewRequest = useReviewSickDayRequest();

  const data = request?.data as SickDayInboxData | undefined;

  const handleSubmit = () => {
    if (!request || !action) return;

    reviewRequest.mutate(
      {
        requestId: request.id,
        status: action === "approve" ? "approved" : "rejected",
        reviewNotes: reviewNotes.trim() || undefined,
      },
      {
        onSuccess: () => {
          setReviewNotes("");
          onOpenChange(false);
        },
      }
    );
  };

  const handleCancel = () => {
    // Reset state
    setReviewNotes("");
    onOpenChange(false);
  };

  if (!data || !action) return null;

  const isApprove = action === "approve";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base uppercase tracking-widest font-normal">
            {isApprove ? "Approve" : "Reject"} Sick Day Request
          </DialogTitle>
          <DialogDescription className="text-xs">
            Review the request details and {isApprove ? "approve" : "reject"} this
            sick day pay request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Employee Name */}
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">
              Employee
            </Label>
            <p className="text-sm mt-1">{data.userName}</p>
          </div>

          {/* Requested Dates */}
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">
              Requested Dates
            </Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {data.requestedDates.map((date) => (
                <Badge key={date} variant="secondary" className="text-[10px] rounded-none">
                  {format(parseISO(date), "MMM d, yyyy")}
                </Badge>
              ))}
            </div>
          </div>

          {/* Employee Notes */}
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">
              Employee Notes
            </Label>
            <p className="text-sm mt-1 text-muted-foreground">{data.notes}</p>
          </div>

          {/* Review Notes (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="review-notes" className="text-xs uppercase tracking-widest">
              Review Notes (Optional)
            </Label>
            <Textarea
              id="review-notes"
              placeholder={
                isApprove
                  ? "Add any notes about this approval..."
                  : "Provide a reason for rejection (recommended)..."
              }
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="rounded-none min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            className="rounded-none text-xs uppercase tracking-widest"
            disabled={reviewRequest.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={reviewRequest.isPending}
            className={
              isApprove
                ? "rounded-none text-xs uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700"
                : "rounded-none text-xs uppercase tracking-widest bg-red-600 hover:bg-red-700"
            }
          >
            {reviewRequest.isPending
              ? isApprove
                ? "Approving..."
                : "Rejecting..."
              : isApprove
              ? "Approve Request"
              : "Reject Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

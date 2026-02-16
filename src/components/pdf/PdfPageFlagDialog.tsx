/**
 * PdfPageFlagDialog
 * 
 * Dialog for flagging a specific page within a PDF document.
 * Allows staff to report issues with a particular page and provide context.
 */

import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface PdfPageFlagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageId: string;
  pageNumber: number;
  pageCount: number;
  fileName?: string;
  pageContext?: string; // Optional: selected text or context from the page
}

const FLAG_REASONS = [
  "Incorrect Information",
  "Outdated Policy",
  "Unclear Wording",
  "Formatting Issues",
  "Missing Information",
  "Conflicting Information",
  "Other Issue",
] as const;

export function PdfPageFlagDialog({
  open,
  onOpenChange,
  pageId,
  pageNumber,
  pageCount,
  fileName,
  pageContext,
}: PdfPageFlagDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState("");
  const [context, setContext] = useState(pageContext || "");

  const flagMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      if (!reason) throw new Error("Please select a reason");

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      const flaggedByName = profile?.full_name || user.email || "Staff Member";

      const { error } = await supabase.from("resource_outdated_flags").insert({
        resource_type: "resource_page",
        resource_id: pageId,
        resource_label: fileName || `Page ${pageNumber}`,
        flagged_by_id: user.id,
        flagged_by_name: flaggedByName,
        note: `${reason}${description.trim() ? `: ${description.trim()}` : ""}`,
        flagged_page_number: pageNumber,
        flagged_page_context: context.trim() || null,
        status: "pending",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdf-page-flags", pageId] });
      queryClient.invalidateQueries({ queryKey: ["resource-flags"] });
      toast.success("Page flagged successfully", {
        description: `Page ${pageNumber} has been flagged for review.`,
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast.error("Failed to flag page", {
        description: error.message,
      });
    },
  });

  const handleClose = () => {
    setReason("");
    setDescription("");
    setContext(pageContext || "");
    onOpenChange(false);
  };

  const handleSubmit = () => {
    if (!reason) {
      toast.error("Please select a reason for flagging this page");
      return;
    }
    flagMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" />
            Flag Page for Review
          </DialogTitle>
          <DialogDescription>
            Report an issue with page {pageNumber} of {pageCount}
            {fileName && ` in "${fileName}"`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Reason Selection */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">
              What's wrong with this page? <span className="text-destructive">*</span>
            </Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {FLAG_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Additional Details (Optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in more detail..."
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Provide specific details to help reviewers understand the issue.
            </p>
          </div>

          {/* Context/Selected Text */}
          {pageContext && (
            <div className="space-y-2">
              <Label htmlFor="context" className="text-sm font-medium">
                Page Context
              </Label>
              <Textarea
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Relevant text from the page..."
                rows={2}
                className="resize-none text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Edit or add text from the page to help locate the issue.
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> Your flag will be sent to managers for review. They'll be notified
              about the specific page ({pageNumber}) you've flagged.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={flagMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || flagMutation.isPending}
            className="gap-2"
          >
            {flagMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            <Flag className="h-4 w-4" />
            Flag Page {pageNumber}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from "react";
import { Send } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useSendNotification } from "@/hooks/useNotifications";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AnswerQuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: {
    id: string;
    question: string;
    context: string | null;
    askedByName: string;
    askedById: string | null;
    createdAt?: string;
  } | null;
}

interface Policy {
  id: string;
  title: string;
  content: string;
  category: string | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AnswerQuestionDialog({
  open,
  onOpenChange,
  question,
}: AnswerQuestionDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const sendNotification = useSendNotification();

  const [answerType, setAnswerType] = useState<
    "direct_answer" | "policy_link"
  >("direct_answer");
  const [answerText, setAnswerText] = useState("");
  const [selectedPolicyId, setSelectedPolicyId] = useState("");

  // Reset state when dialog closes or question changes
  useEffect(() => {
    if (!open) {
      setAnswerType("direct_answer");
      setAnswerText("");
      setSelectedPolicyId("");
    }
  }, [open]);

  // Fetch policies for linking
  const { data: policies } = useQuery({
    queryKey: ["club-policies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("club_policies")
        .select("id, title, content, category")
        .eq("is_active", true)
        .order("title", { ascending: true });

      if (error) throw error;
      return (data || []) as Policy[];
    },
    enabled: open,
  });

  // Answer mutation
  const answerMutation = useMutation({
    mutationFn: async () => {
      if (!question || !user) return;

      const updateData: Record<string, unknown> = {
        is_resolved: true,
        answer_type: answerType,
        answered_by_id: user.id,
        answered_by_name:
          user.user_metadata?.full_name || user.email || "Manager",
      };

      if (answerType === "direct_answer") {
        updateData.answer = answerText;
      } else {
        updateData.linked_policy_id = selectedPolicyId;
      }

      const { error } = await supabase
        .from("staff_qa")
        .update(updateData)
        .eq("id", question.id);

      if (error) throw error;

      // Send notification to the asker
      if (question.askedById) {
        await sendNotification.mutateAsync({
          userId: question.askedById,
          type: "qa_answered",
          title: "Your question has been answered",
          body: question.question.substring(0, 100),
          data: { questionId: question.id },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox-qa"] });
      queryClient.invalidateQueries({ queryKey: ["staff-qa-all"] });
      queryClient.invalidateQueries({ queryKey: ["staff-qa-public"] });
      queryClient.invalidateQueries({ queryKey: ["inbox-unread-count"] });
      onOpenChange(false);
      toast({
        title: "Question Answered",
        description: "The staff member has been notified.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to answer question",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-none">
        <DialogHeader>
          <DialogTitle className="text-sm uppercase tracking-wider">
            Answer Question
          </DialogTitle>
          <DialogDescription className="text-xs">
            Provide an answer to the staff member&apos;s question.
          </DialogDescription>
        </DialogHeader>

        {question && (
          <div className="space-y-4">
            <div className="p-3 bg-muted/50 border">
              <p className="text-xs font-medium mb-1">Question:</p>
              <p className="text-sm">{question.question}</p>
              {question.context && (
                <p className="text-xs text-muted-foreground mt-2 italic">
                  Context: {question.context}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground mt-2">
                Asked by {question.askedByName}
                {question.createdAt && (
                  <>
                    {" "}
                    &bull;{" "}
                    {format(parseISO(question.createdAt), "MMM d, yyyy")}
                  </>
                )}
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider">
                Answer Type
              </Label>
              <RadioGroup
                value={answerType}
                onValueChange={(v) =>
                  setAnswerType(v as typeof answerType)
                }
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="direct_answer" id="direct" />
                  <Label htmlFor="direct" className="text-xs cursor-pointer">
                    Direct Answer
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="policy_link" id="policy" />
                  <Label htmlFor="policy" className="text-xs cursor-pointer">
                    Link to Policy
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {answerType === "direct_answer" ? (
              <div className="space-y-2">
                <Label
                  htmlFor="answer"
                  className="text-xs uppercase tracking-wider"
                >
                  Your Answer
                </Label>
                <Textarea
                  id="answer"
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={4}
                  className="rounded-none"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider">
                  Select Policy
                </Label>
                <Select
                  value={selectedPolicyId}
                  onValueChange={setSelectedPolicyId}
                >
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder="Choose a policy..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(policies || []).map((policy) => (
                      <SelectItem key={policy.id} value={policy.id}>
                        {policy.category || "General Policy"}
                        {policy.category && (
                          <span className="text-muted-foreground ml-2">
                            (Category: {policy.category})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-none"
              >
                Cancel
              </Button>
              <Button
                onClick={() => answerMutation.mutate()}
                disabled={
                  answerMutation.isPending ||
                  (answerType === "direct_answer" && !answerText.trim()) ||
                  (answerType === "policy_link" && !selectedPolicyId)
                }
                className="rounded-none"
              >
                <Send className="h-4 w-4 mr-2" />
                Submit Answer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

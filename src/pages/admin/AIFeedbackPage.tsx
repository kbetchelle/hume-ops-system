import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ThumbsUp, ThumbsDown, ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

interface FeedbackRow {
  id: string;
  rating: string;
  feedback_text: string | null;
  ai_input: string;
  ai_output: string;
  ai_mode: string;
  priority_rank: number;
  created_at: string;
}

export default function AIFeedbackPage() {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "positive" | "negative">("all");

  const { data: feedback = [], isLoading } = useQuery({
    queryKey: ["ai-writer-feedback", filter],
    queryFn: async () => {
      let query = (supabase as any)
        .from("ai_writer_feedback")
        .select("id, rating, feedback_text, ai_input, ai_output, ai_mode, priority_rank, created_at")
        .order("priority_rank", { ascending: false })
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("rating", filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as FeedbackRow[];
    },
  });

  const updateRank = useMutation({
    mutationFn: async ({ id, rank }: { id: string; rank: number }) => {
      const { error } = await (supabase as any)
        .from("ai_writer_feedback")
        .update({ priority_rank: rank })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-writer-feedback"] });
    },
    onError: () => toast.error("Failed to update rank"),
  });

  const deleteFeedback = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("ai_writer_feedback")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-writer-feedback"] });
      toast.success("Feedback deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });

  const negativeCount = feedback.filter((f) => f.rating === "negative").length;
  const positiveCount = feedback.filter((f) => f.rating === "positive").length;

  // Show which ones will be used by the model
  const rankedNegative = feedback
    .filter((f) => f.rating === "negative")
    .slice(0, 8);
  const rankedPositive = feedback
    .filter((f) => f.rating === "positive")
    .slice(0, 5);
  const activeIds = new Set([
    ...rankedNegative.map((f) => f.id),
    ...rankedPositive.map((f) => f.id),
  ]);

  return (
    <DashboardLayout title="AI Writer Feedback">
      <div className="p-6 md:p-8 max-w-4xl space-y-6">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground tracking-wide">
            Rank feedback to control what the AI writer learns from. Top{" "}
            <strong>8 negative</strong> and <strong>5 positive</strong> entries
            (by rank, then recency) are injected into the model's system prompt.
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-3">
          <Badge
            variant={filter === "all" ? "default" : "outline"}
            className="cursor-pointer rounded-none"
            onClick={() => setFilter("all")}
          >
            All ({feedback.length})
          </Badge>
          <Badge
            variant={filter === "negative" ? "destructive" : "outline"}
            className="cursor-pointer rounded-none"
            onClick={() => setFilter("negative")}
          >
            <ThumbsDown className="h-3 w-3 mr-1" />
            Negative ({negativeCount})
          </Badge>
          <Badge
            variant={filter === "positive" ? "default" : "outline"}
            className="cursor-pointer rounded-none"
            onClick={() => setFilter("positive")}
          >
            <ThumbsUp className="h-3 w-3 mr-1" />
            Positive ({positiveCount})
          </Badge>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : feedback.length === 0 ? (
          <p className="text-sm text-muted-foreground">No feedback yet.</p>
        ) : (
          <div className="space-y-2">
            {feedback.map((f) => {
              const isActive = activeIds.has(f.id);
              const isExpanded = expandedId === f.id;

              return (
                <Card
                  key={f.id}
                  className={`rounded-none transition-colors ${
                    isActive
                      ? "border-primary/40 bg-primary/5"
                      : "opacity-60"
                  }`}
                >
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {f.rating === "negative" ? (
                            <ThumbsDown className="h-3.5 w-3.5 text-destructive shrink-0" />
                          ) : (
                            <ThumbsUp className="h-3.5 w-3.5 text-primary shrink-0" />
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {format(parseISO(f.created_at), "MMM d, yyyy")}
                          </span>
                          <Badge variant="outline" className="text-[9px] rounded-none">
                            {f.ai_mode}
                          </Badge>
                          {isActive && (
                            <Badge className="text-[9px] rounded-none bg-primary/20 text-primary border-0">
                              ACTIVE
                            </Badge>
                          )}
                        </div>
                        {f.feedback_text && (
                          <p className="text-xs font-medium">
                            "{f.feedback_text}"
                          </p>
                        )}
                        <p
                          className="text-[11px] text-muted-foreground truncate cursor-pointer hover:text-foreground"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : f.id)
                          }
                        >
                          Input: {f.ai_input.slice(0, 120)}…
                        </p>
                      </div>

                      {/* Rank controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        <div className="flex flex-col items-center mr-2">
                          <span className="text-[10px] text-muted-foreground">
                            Rank
                          </span>
                          <Input
                            type="number"
                            value={f.priority_rank}
                            onChange={(e) =>
                              updateRank.mutate({
                                id: f.id,
                                rank: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-14 h-7 text-xs text-center rounded-none"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() =>
                            updateRank.mutate({
                              id: f.id,
                              rank: f.priority_rank + 1,
                            })
                          }
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() =>
                            updateRank.mutate({
                              id: f.id,
                              rank: Math.max(0, f.priority_rank - 1),
                            })
                          }
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive"
                          onClick={() => deleteFeedback.mutate(f.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="space-y-2 pt-2 border-t">
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
                            Full Input
                          </p>
                          <p className="text-xs whitespace-pre-wrap bg-muted/50 p-2">
                            {f.ai_input}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
                            AI Output
                          </p>
                          <p className="text-xs whitespace-pre-wrap bg-muted/50 p-2 max-h-40 overflow-y-auto">
                            {f.ai_output}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

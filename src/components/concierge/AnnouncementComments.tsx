import { useState } from "react";
import { format } from "date-fns";
import { MessageSquare, Send, Trash2, Loader2, ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  useAnnouncementComments,
  useAddAnnouncementComment,
  useDeleteAnnouncementComment,
} from "@/hooks/useAnnouncementComments";
import { usePermissions } from "@/hooks/usePermissions";

interface AnnouncementCommentsProps {
  announcementId: string;
  commentCount?: number;
  className?: string;
}

export function AnnouncementComments({
  announcementId,
  commentCount = 0,
  className,
}: AnnouncementCommentsProps) {
  const { user } = useAuth();
  const { isManagerOrAdmin } = usePermissions();
  const [isOpen, setIsOpen] = useState(false);
  const [newComment, setNewComment] = useState("");

  const { data: comments, isLoading } = useAnnouncementComments(isOpen ? announcementId : null);
  const addCommentMutation = useAddAnnouncementComment();
  const deleteCommentMutation = useDeleteAnnouncementComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    await addCommentMutation.mutateAsync({
      announcementId,
      comment: newComment.trim(),
    });
    setNewComment("");
  };

  const handleDelete = async (commentId: string) => {
    await deleteCommentMutation.mutateAsync({
      commentId,
      announcementId,
    });
  };

  const displayCount = comments?.length ?? commentCount;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={cn("p-0", className)}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between p-2 h-auto"
        >
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <MessageSquare className="h-3 w-3" />
            {displayCount > 0 ? (
              <>
                {displayCount} comment{displayCount !== 1 ? "s" : ""}
              </>
            ) : (
              "Add a comment"
            )}
          </span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="pt-2 space-y-3">
          <Separator />

          {/* Comments List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : comments && comments.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className={cn(
                    "p-2 bg-muted/50 text-xs group",
                    comment.user_id === user?.id && "bg-primary/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">{comment.user_name}</span>
                        <span className="text-muted-foreground shrink-0">
                          {format(new Date(comment.created_at), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <p className="text-muted-foreground whitespace-pre-wrap break-words">
                        {comment.comment}
                      </p>
                    </div>
                    {(comment.user_id === user?.id || isManagerOrAdmin()) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={() => handleDelete(comment.id)}
                        disabled={deleteCommentMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">
              No comments yet. Be the first to comment!
            </p>
          )}

          {/* Add Comment Form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="text-xs h-8"
              disabled={addCommentMutation.isPending}
            />
            <Button
              type="submit"
              size="sm"
              className="h-8 px-3"
              disabled={!newComment.trim() || addCommentMutation.isPending}
            >
              {addCommentMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Send className="h-3 w-3" />
              )}
            </Button>
          </form>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * Inline comment count badge
 */
export function CommentCountBadge({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  if (count === 0) return null;

  return (
    <Badge variant="secondary" className={cn("gap-1 text-[10px]", className)}>
      <MessageSquare className="h-3 w-3" />
      {count}
    </Badge>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { MessageSquare, Lock, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface ChecklistComment {
  id: string;
  comment_text: string;
  staff_name: string;
  staff_id: string;
  is_private: boolean;
  created_at: string;
  completion_date: string;
  shift_time: string;
  department_table: string;
}

interface ChecklistCommentsProps {
  checklistId?: string;
  itemId?: string;
  completionId?: string;
  completionDate: string;
  shiftTime: string;
  departmentTable: "concierge" | "boh" | "cafe";
  className?: string;
}

export function ChecklistComments({
  checklistId,
  itemId,
  completionId,
  completionDate,
  shiftTime,
  departmentTable,
  className,
}: ChecklistCommentsProps) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  // Get current user
  const { data: userData } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  // Get user role
  const { data: userRole } = useQuery({
    queryKey: ["user-role", userData?.id],
    queryFn: async () => {
      if (!userData?.id) return null;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.id)
        .single();
      return data?.role;
    },
    enabled: !!userData?.id,
  });

  const isManagerOrAdmin = userRole === "manager" || userRole === "admin";

  // Fetch comments
  const { data: comments, isLoading } = useQuery({
    queryKey: [
      "checklist-comments",
      checklistId,
      itemId,
      completionId,
      completionDate,
      shiftTime,
      departmentTable,
    ],
    queryFn: async () => {
      let query = supabase
        .from("checklist_comments")
        .select("*")
        .eq("completion_date", completionDate)
        .eq("shift_time", shiftTime)
        .eq("department_table", departmentTable)
        .order("created_at", { ascending: false });

      if (completionId) {
        query = query.eq("completion_id", completionId);
      } else if (itemId) {
        query = query.eq("item_id", itemId);
      } else if (checklistId) {
        query = query.eq("checklist_id", checklistId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ChecklistComment[];
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async () => {
      if (!userData?.id || !commentText.trim()) return;

      const { error } = await supabase.from("checklist_comments").insert({
        checklist_id: checklistId || null,
        item_id: itemId || null,
        completion_id: completionId || null,
        comment_text: commentText.trim(),
        staff_name: userData.email || userData.id,
        staff_id: userData.id,
        is_private: isPrivate,
        completion_date: completionDate,
        shift_time: shiftTime,
        department_table: departmentTable,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-comments"] });
      setCommentText("");
      setIsPrivate(false);
      setIsAddingComment(false);
    },
  });

  // Delete comment mutation (managers/admins only)
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("checklist_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-comments"] });
    },
  });

  const handleAddComment = () => {
    addCommentMutation.mutate();
  };

  const handleDeleteComment = (commentId: string) => {
    if (confirm(t("Are you sure you want to delete this comment?", "¿Estás seguro de que deseas eliminar este comentario?"))) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  // Filter comments based on user role
  const visibleComments = comments?.filter(
    (comment) => !comment.is_private || isManagerOrAdmin
  ) || [];

  const commentCount = visibleComments.length;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {t("Comments", "Comentarios")}
          </span>
          {commentCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {commentCount}
            </Badge>
          )}
        </div>
        {!isAddingComment && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAddingComment(true)}
            className="h-8 text-xs"
          >
            {t("Add Comment", "Agregar Comentario")}
          </Button>
        )}
      </div>

      {/* Add Comment Form */}
      {isAddingComment && (
        <Card className="p-3 space-y-3">
          <Textarea
            placeholder={t(
              "Enter your comment...",
              "Ingresa tu comentario..."
            )}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                id="private-comment"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
                disabled={!isManagerOrAdmin}
              />
              <Label
                htmlFor="private-comment"
                className="text-xs flex items-center gap-1 cursor-pointer"
              >
                <Lock className="h-3 w-3" />
                {t("Private", "Privado")}
                {!isManagerOrAdmin && (
                  <span className="text-muted-foreground">
                    ({t("Managers only", "Solo gerentes")})
                  </span>
                )}
              </Label>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAddingComment(false);
                  setCommentText("");
                  setIsPrivate(false);
                }}
                disabled={addCommentMutation.isPending}
              >
                {t("Cancel", "Cancelar")}
              </Button>
              <Button
                size="sm"
                onClick={handleAddComment}
                disabled={!commentText.trim() || addCommentMutation.isPending}
              >
                <Send className="h-3 w-3 mr-1" />
                {t("Send", "Enviar")}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Comments List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-3">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : visibleComments.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            {t(
              "No comments yet. Be the first to comment!",
              "Aún no hay comentarios. ¡Sé el primero en comentar!"
            )}
          </div>
        ) : (
          visibleComments.map((comment) => (
            <Card
              key={comment.id}
              className={cn(
                "p-3",
                comment.is_private && "border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {comment.staff_name}
                      </span>
                      {comment.is_private && (
                        <Badge
                          variant="outline"
                          className="text-xs flex items-center gap-1"
                        >
                          <Lock className="h-3 w-3" />
                          {t("Private", "Privado")}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.created_at), "MMM d, h:mm a")}
                      </span>
                      {isManagerOrAdmin &&
                        (userData?.id === comment.staff_id || isManagerOrAdmin) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {comment.comment_text}
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

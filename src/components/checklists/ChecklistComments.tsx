import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ChecklistCommentsProps {
  templateId?: string;
  itemId?: string;
  completionId?: string;
  completionDate: string;
  shiftTime: string;
}

interface Comment {
  id: string;
  template_id: string | null;
  item_id: string | null;
  completion_id: string | null;
  comment_text: string;
  staff_name: string;
  staff_id: string | null;
  is_private: boolean;
  created_at: string;
  completion_date: string;
  shift_time: string;
}

export function ChecklistComments({
  templateId,
  itemId,
  completionId,
  completionDate,
  shiftTime,
}: ChecklistCommentsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const { data: comments, isLoading } = useQuery({
    queryKey: ['checklist-comments', templateId, itemId, completionId, completionDate, shiftTime],
    queryFn: async () => {
      let query = (supabase
        .from('checklist_comments') as any)
        .select('*')
        .eq('completion_date', completionDate)
        .eq('shift_time', shiftTime)
        .order('created_at', { ascending: false });

      if (templateId) query = query.eq('template_id', templateId);
      if (itemId) query = query.eq('item_id', itemId);
      if (completionId) query = query.eq('completion_id', completionId);

      const { data, error } = await query;
      if (error) throw error;
      return data as Comment[];
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async () => {
      if (!user || !newComment.trim()) return;

      const { error } = await (supabase.from('checklist_comments') as any).insert({
        template_id: templateId || null,
        item_id: itemId || null,
        completion_id: completionId || null,
        comment_text: newComment,
        staff_name: user.email || 'Unknown',
        staff_id: user.id,
        is_private: isPrivate,
        completion_date: completionDate,
        shift_time: shiftTime,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setNewComment('');
      setIsPrivate(false);
      queryClient.invalidateQueries({ queryKey: ['checklist-comments'] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        <span className="text-sm font-medium">Comments</span>
        {comments && comments.length > 0 && (
          <Badge variant="secondary">{comments.length}</Badge>
        )}
      </div>

      {/* Comment list */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading comments...</div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="p-3 bg-muted rounded-lg text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{comment.staff_name}</span>
                {comment.is_private && (
                  <Badge variant="outline" className="text-xs">Private</Badge>
                )}
              </div>
              <p className="text-muted-foreground">{comment.comment_text}</p>
              <span className="text-xs text-muted-foreground">
                {new Date(comment.created_at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No comments yet</p>
      )}

      {/* Add comment */}
      <div className="space-y-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={2}
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="rounded"
            />
            Private (managers only)
          </label>
          <Button
            size="sm"
            onClick={() => addCommentMutation.mutate()}
            disabled={!newComment.trim() || addCommentMutation.isPending}
          >
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

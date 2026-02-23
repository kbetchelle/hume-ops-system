import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Send, FileText } from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNotifyManagers, truncateForNotification } from '@/hooks/useNotifications';

export function CafeShiftNotes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const notifyManagers = useNotifyManagers();
  const [noteText, setNoteText] = useState('');

  // Fetch notes submitted by this user
  const { data: myNotes, isLoading } = useQuery({
    queryKey: ['cafe-shift-notes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('staff_qa')
        .select('*')
        .eq('asked_by_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const submitNote = useMutation({
    mutationFn: async () => {
      const askerName = user?.user_metadata?.full_name || user?.email || 'Cafe Staff';

      const { error } = await supabase
        .from('staff_qa')
        .insert({
          question: noteText.trim(),
          context: null,
          asked_by_id: user?.id,
          asked_by_name: askerName,
          is_resolved: false,
          is_public: true,
        });

      if (error) throw error;
      return { noteText: noteText.trim(), askerName };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cafe-shift-notes'] });
      queryClient.invalidateQueries({ queryKey: ['staff-qa-public'] });

      notifyManagers.mutate({
        type: 'qa_new_question',
        title: 'New Cafe Shift Note',
        body: `${data.askerName}: ${truncateForNotification(data.noteText, 80)}`,
      });

      setNoteText('');
      toast({
        title: 'Note Submitted',
        description: 'Management has been notified.',
      });
    },
  });

  return (
    <Card className="rounded-none border flex flex-col flex-1 min-h-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider">
          <FileText className="h-4 w-4" />
          Shift Notes
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-4 flex-1 overflow-auto space-y-4">
        {/* Submit a Note */}
        <div className="p-4 border bg-muted/30 space-y-3">
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Write a note for management..."
            rows={3}
            className="rounded-none"
          />
          <Button
            onClick={() => submitNote.mutate()}
            disabled={!noteText.trim() || submitNote.isPending}
            size="sm"
            className="rounded-none"
          >
            <Send className="h-4 w-4 mr-2" />
            Submit Note
          </Button>
        </div>

        {/* Past Notes */}
        {isLoading ? (
          <div className="text-xs text-muted-foreground text-center py-8">Loading...</div>
        ) : !myNotes || myNotes.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            No notes submitted yet
          </p>
        ) : (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Your Past Notes
            </h4>
            {myNotes.map((note: any) => (
              <div key={note.id} className="p-3 border bg-background">
                <p className="text-xs">{note.question}</p>
                <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                  <span>{format(parseISO(note.created_at), 'MMM d, yyyy · h:mm a')}</span>
                  {note.is_resolved && note.answer && (
                    <>
                      <span>·</span>
                      <span className="text-primary font-medium">Response: {note.answer}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

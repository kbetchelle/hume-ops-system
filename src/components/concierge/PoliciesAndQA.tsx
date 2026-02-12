import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  HelpCircle, Search, MessageCircle, Send, Clock, CheckCircle2, BookOpen
} from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNotifyManagers, truncateForNotification } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

interface QAEntry {
  id: string;
  question: string;
  context: string | null;
  answer: string | null;
  answer_type: 'policy_link' | 'direct_answer' | null;
  linked_policy_id: string | null;
  asked_by_id: string | null;
  asked_by_name: string;
  answered_by_name: string | null;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
}

export function PoliciesAndQA() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const notifyManagers = useNotifyManagers();
  const [searchTerm, setSearchTerm] = useState('');
  const [showDirectAnswers, setShowDirectAnswers] = useState(true);
  const [newQuestion, setNewQuestion] = useState({ question: '', context: '' });
  const [qaFilter, setQaFilter] = useState<'resolved' | 'pending'>('pending');

  const { data: qaEntries, isLoading: qaLoading } = useQuery({
    queryKey: ['staff-qa-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_qa')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as QAEntry[];
    },
  });

  const { data: myQuestions } = useQuery({
    queryKey: ['my-questions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('staff_qa')
        .select('*')
        .eq('asked_by_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as QAEntry[];
    },
    enabled: !!user?.id,
  });

  // Collect linked policy IDs so we can resolve their titles
  const linkedPolicyIds = useMemo(() => {
    const ids = new Set<string>();
    (qaEntries || []).forEach(qa => {
      if (qa.linked_policy_id) ids.add(qa.linked_policy_id);
    });
    return Array.from(ids);
  }, [qaEntries]);

  const { data: linkedPolicies } = useQuery({
    queryKey: ['linked-policy-titles', linkedPolicyIds],
    queryFn: async () => {
      if (linkedPolicyIds.length === 0) return {};
      const { data, error } = await supabase
        .from('club_policies')
        .select('id, title')
        .in('id', linkedPolicyIds);
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((p: { id: string; title: string }) => {
        map[p.id] = p.title;
      });
      return map;
    },
    enabled: linkedPolicyIds.length > 0,
  });

  const submitQuestion = useMutation({
    mutationFn: async () => {
      const questionText = newQuestion.question;
      const askerName = user?.user_metadata?.full_name || user?.email || 'Staff';

      const { error } = await supabase
        .from('staff_qa')
        .insert({
          question: questionText,
          context: newQuestion.context || null,
          asked_by_id: user?.id,
          asked_by_name: askerName,
          is_resolved: false,
          is_public: true,
        });

      if (error) throw error;

      // Return data for onSuccess
      return { questionText, askerName };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['staff-qa-public'] });
      queryClient.invalidateQueries({ queryKey: ['my-questions'] });

      // Notify managers about the new question
      notifyManagers.mutate({
        type: 'qa_new_question',
        title: 'New Staff Question',
        body: `${data.askerName}: ${truncateForNotification(data.questionText, 80)}`,
      });

      setNewQuestion({ question: '', context: '' });
      toast({
        title: 'Question Submitted',
        description: 'Management will be notified and respond soon.',
      });
    },
  });

  const filteredQA = (qaEntries || [])
    .filter(qa => {
      if (qaFilter === 'resolved') return qa.is_resolved;
      if (qaFilter === 'pending') return !qa.is_resolved;
      return true;
    })
    .filter(qa => {
      if (!showDirectAnswers && qa.answer_type === 'direct_answer') return false;
      return true;
    })
    .filter(qa =>
      qa.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      qa.answer?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const pendingCount = (myQuestions || []).filter(q => !q.is_resolved).length;

  return (
    <Card className="rounded-none border flex flex-col flex-1 min-h-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider">
          <HelpCircle className="h-4 w-4" />
          Q&A
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-4 flex-1 overflow-auto">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search questions..."
            className="pl-10 rounded-none"
          />
        </div>

        <div className="space-y-4">
          {/* Ask a Question */}
          <div className="p-4 border bg-muted/30">
            <h4 className="text-xs font-medium mb-3 flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Ask a Question
            </h4>
            <div className="space-y-3">
              <Textarea
                value={newQuestion.question}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, question: e.target.value }))}
                placeholder="What would you like to know?"
                rows={2}
                className="rounded-none"
              />
              <Input
                value={newQuestion.context}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, context: e.target.value }))}
                placeholder="Additional context (optional)"
                className="rounded-none"
              />
              <Button
                onClick={() => submitQuestion.mutate()}
                disabled={!newQuestion.question.trim() || submitQuestion.isPending}
                size="sm"
                className="rounded-none"
              >
                <Send className="h-4 w-4 mr-2" />
                Submit Question
              </Button>
            </div>
          </div>

          {/* My Pending Questions */}
          {pendingCount > 0 && (
            <div className="p-3 border border-amber-500/30 bg-amber-500/5">
              <h4 className="text-xs font-medium mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Your Pending Questions ({pendingCount})
              </h4>
              <div className="space-y-2">
                {(myQuestions || []).filter(q => !q.is_resolved).map(q => (
                  <div key={q.id} className="text-xs p-2 bg-background">
                    <p className="font-medium">{q.question}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Asked {format(parseISO(q.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2 flex-1">
              {(['resolved', 'pending'] as const).map(filter => (
                <Button
                  key={filter}
                  variant={qaFilter === filter ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setQaFilter(filter)}
                  className="rounded-none text-[10px] flex-1"
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="show-direct" className="text-[10px]">Show direct answers</Label>
              <Switch
                id="show-direct"
                checked={showDirectAnswers}
                onCheckedChange={setShowDirectAnswers}
              />
            </div>
          </div>

          {/* Q&A List */}
          {qaLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-none" />)}
            </div>
          ) : filteredQA.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              {searchTerm ? 'No questions match your search' : 'No questions yet'}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredQA.map((qa) => (
                <div
                  key={qa.id}
                  className={cn(
                    'p-3 border',
                    qa.is_resolved ? 'bg-background' : 'bg-amber-500/5 border-amber-500/30'
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-xs font-medium">{qa.question}</p>
                    {qa.is_resolved ? (
                      <Badge variant="outline" className="gap-1 shrink-0 rounded-none">
                        <CheckCircle2 className="h-3 w-3" />
                        Answered
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1 shrink-0 rounded-none">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    )}
                  </div>

                  {qa.is_resolved && qa.answer_type === 'policy_link' && qa.linked_policy_id && (
                    <div className="mt-2 p-2 bg-primary/5 border border-primary/20">
                      <p className="text-[10px] text-muted-foreground mb-1">See Policy:</p>
                      <p className="text-xs font-medium flex items-center gap-1">
                        <BookOpen className="h-3 w-3 shrink-0" />
                        {linkedPolicies?.[qa.linked_policy_id] || 'Linked policy'}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Available in Resources &rarr; Policies
                      </p>
                    </div>
                  )}

                  {qa.is_resolved && qa.answer_type === 'direct_answer' && qa.answer && (
                    <div className="mt-2 p-2 bg-muted/50">
                      <Badge variant="secondary" className="mb-2 text-[10px] rounded-none">Direct Answer</Badge>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                        {qa.answer}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                    <span>Asked by {qa.asked_by_name}</span>
                    <span>&bull;</span>
                    <span>{format(parseISO(qa.created_at), 'MMM d, yyyy')}</span>
                    {qa.answered_by_name && (
                      <>
                        <span>&bull;</span>
                        <span>Answered by {qa.answered_by_name}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

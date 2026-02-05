import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  HelpCircle, Search, CheckCircle2, Clock, Send, Link2, MessageSquare
} from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useSendNotification } from '@/hooks/useNotifications';
import { useMarkQAAsRead, useQAReadStatus } from '@/hooks/useStaffQAReads';
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
  answered_by_id: string | null;
  answered_by_name: string | null;
  is_resolved: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface Policy {
  id: string;
  title: string;
  content: string;
  category: string | null;
}

export function ManagerQAPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const sendNotification = useSendNotification();

  const [activeTab, setActiveTab] = useState<'pending' | 'answered' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState<QAEntry | null>(null);
  const [answerType, setAnswerType] = useState<'direct_answer' | 'policy_link'>('direct_answer');
  const [answerText, setAnswerText] = useState('');
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>('');

  // Fetch all Q&A entries (managers can see all)
  const { data: qaEntries, isLoading } = useQuery({
    queryKey: ['staff-qa-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_qa')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as QAEntry[];
    },
  });

  const qaIds = (qaEntries ?? []).map((q) => q.id);
  const { data: readSet } = useQAReadStatus(qaIds);
  const markAsRead = useMarkQAAsRead();

  // Fetch policies for linking
  const { data: policies } = useQuery({
    queryKey: ['club-policies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('club_policies')
        .select('id, title, content, category')
        .eq('is_active', true)
        .order('title', { ascending: true });

      if (error) throw error;
      return (data || []) as Policy[];
    },
  });

  // Answer question mutation
  const answerQuestion = useMutation({
    mutationFn: async () => {
      if (!selectedQuestion || !user) return;

      const updateData: Partial<QAEntry> = {
        is_resolved: true,
        answer_type: answerType,
        answered_by_id: user.id,
        answered_by_name: user.user_metadata?.full_name || user.email || 'Manager',
      };

      if (answerType === 'direct_answer') {
        updateData.answer = answerText;
      } else {
        updateData.linked_policy_id = selectedPolicyId;
      }

      const { error } = await supabase
        .from('staff_qa')
        .update(updateData)
        .eq('id', selectedQuestion.id);

      if (error) throw error;

      // Send notification to the asker if they have an ID
      if (selectedQuestion.asked_by_id) {
        await sendNotification.mutateAsync({
          userId: selectedQuestion.asked_by_id,
          type: 'qa_answered',
          title: 'Your question has been answered',
          body: selectedQuestion.question.substring(0, 100),
          data: { questionId: selectedQuestion.id },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-qa-all'] });
      queryClient.invalidateQueries({ queryKey: ['staff-qa-public'] });
      setSelectedQuestion(null);
      setAnswerText('');
      setSelectedPolicyId('');
      setAnswerType('direct_answer');
      toast({
        title: 'Question Answered',
        description: 'The staff member has been notified.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to answer question',
        variant: 'destructive',
      });
    },
  });

  // Filter entries based on tab and search
  const filteredEntries = (qaEntries || [])
    .filter(qa => {
      if (activeTab === 'pending') return !qa.is_resolved;
      if (activeTab === 'answered') return qa.is_resolved;
      return true;
    })
    .filter(qa =>
      qa.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      qa.asked_by_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      qa.answer?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const pendingCount = (qaEntries || []).filter(q => !q.is_resolved).length;

  const handleOpenAnswer = (qa: QAEntry) => {
    setSelectedQuestion(qa);
    setAnswerType('direct_answer');
    setAnswerText('');
    setSelectedPolicyId('');
  };

  const getLinkedPolicy = (policyId: string) => policies?.find(p => p.id === policyId);

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider">
            <HelpCircle className="h-4 w-4" />
            Staff Q&A Management
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2 rounded-none">
                {pendingCount} pending
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <div className="px-4">
            <TabsList className="w-full rounded-none">
              <TabsTrigger value="pending" className="flex-1 gap-2 rounded-none">
                <Clock className="h-4 w-4" />
                Pending
                {pendingCount > 0 && (
                  <Badge variant="secondary" className="rounded-none">{pendingCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="answered" className="flex-1 gap-2 rounded-none">
                <CheckCircle2 className="h-4 w-4" />
                Answered
              </TabsTrigger>
              <TabsTrigger value="all" className="flex-1 rounded-none">
                All
              </TabsTrigger>
            </TabsList>
          </div>

          <CardContent className="pt-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search questions, staff names..."
                className="pl-10 rounded-none"
              />
            </div>

            <TabsContent value={activeTab} className="m-0">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-none" />)}
                </div>
              ) : filteredEntries.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">
                  {searchTerm ? 'No questions match your search' : 'No questions in this category'}
                </p>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {filteredEntries.map((qa) => {
                    const linkedPolicy = qa.linked_policy_id ? getLinkedPolicy(qa.linked_policy_id) : null;

                    const isUnread = !qa.is_resolved && !readSet?.has(qa.id);

                    return (
                      <div
                        key={qa.id}
                        className={cn(
                          'p-4 border',
                          !qa.is_resolved && 'bg-amber-500/5 border-amber-500/30',
                          isUnread && 'border-l-4 border-l-amber-500'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{qa.question}</p>
                              {isUnread && (
                                <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" title="Unread" />
                              )}
                            </div>
                            {qa.context && (
                              <p className="text-xs text-muted-foreground mt-1 italic">
                                Context: {qa.context}
                              </p>
                            )}
                          </div>
                          {qa.is_resolved ? (
                            <Badge variant="outline" className="gap-1 shrink-0 rounded-none">
                              <CheckCircle2 className="h-3 w-3" />
                              Answered
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1 shrink-0 rounded-none bg-amber-500/20 text-amber-700">
                              <Clock className="h-3 w-3" />
                              Pending
                            </Badge>
                          )}
                        </div>

                        {/* Show answer if resolved */}
                        {qa.is_resolved && qa.answer_type === 'direct_answer' && qa.answer && (
                          <div className="mt-3 p-2 bg-muted/50 border-l-2 border-primary">
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                              {qa.answer}
                            </p>
                          </div>
                        )}

                        {qa.is_resolved && qa.answer_type === 'policy_link' && linkedPolicy && (
                          <div className="mt-3 p-2 bg-primary/5 border-l-2 border-primary">
                            <p className="text-[10px] text-muted-foreground">Linked to policy:</p>
                            <p className="text-xs font-medium">{linkedPolicy.title}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3 pt-2 border-t">
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>Asked by {qa.asked_by_name}</span>
                            <span>•</span>
                            <span>{format(parseISO(qa.created_at), 'MMM d, yyyy h:mm a')}</span>
                            {qa.answered_by_name && (
                              <>
                                <span>•</span>
                                <span>Answered by {qa.answered_by_name}</span>
                              </>
                            )}
                          </div>

                          {!qa.is_resolved && (
                            <Button
                              size="sm"
                              onClick={() => handleOpenAnswer(qa)}
                              className="rounded-none"
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Answer
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Answer Dialog */}
      <Dialog open={!!selectedQuestion} onOpenChange={(open) => !open && setSelectedQuestion(null)}>
        <DialogContent className="max-w-lg rounded-none">
          <DialogHeader>
            <DialogTitle className="text-sm uppercase tracking-wider">
              Answer Question
            </DialogTitle>
            <DialogDescription className="text-xs">
              Provide an answer to the staff member's question.
            </DialogDescription>
          </DialogHeader>

          {selectedQuestion && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/50 border">
                <p className="text-xs font-medium mb-1">Question:</p>
                <p className="text-sm">{selectedQuestion.question}</p>
                {selectedQuestion.context && (
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    Context: {selectedQuestion.context}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground mt-2">
                  Asked by {selectedQuestion.asked_by_name} • {format(parseISO(selectedQuestion.created_at), 'MMM d, yyyy')}
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-wider">Answer Type</Label>
                <RadioGroup
                  value={answerType}
                  onValueChange={(v) => setAnswerType(v as typeof answerType)}
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

              {answerType === 'direct_answer' ? (
                <div className="space-y-2">
                  <Label htmlFor="answer" className="text-xs uppercase tracking-wider">
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
                  <Select value={selectedPolicyId} onValueChange={setSelectedPolicyId}>
                    <SelectTrigger className="rounded-none">
                      <SelectValue placeholder="Choose a policy..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(policies || []).map(policy => (
                        <SelectItem key={policy.id} value={policy.id}>
                          {policy.title}
                          {policy.category && (
                            <span className="text-muted-foreground ml-2">({policy.category})</span>
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
                  onClick={() => setSelectedQuestion(null)}
                  className="rounded-none"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => answerQuestion.mutate()}
                  disabled={
                    answerQuestion.isPending ||
                    (answerType === 'direct_answer' && !answerText.trim()) ||
                    (answerType === 'policy_link' && !selectedPolicyId)
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
    </>
  );
}

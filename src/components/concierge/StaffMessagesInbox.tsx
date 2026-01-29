import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  MessageSquare, Plus, Inbox, SendHorizontal, Mail, Reply, Send
} from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  sender_id: string | null;
  sender_name: string | null;
  recipient_ids: string[] | null;
  subject: string | null;
  content: string;
  created_at: string;
  is_read?: boolean;
}

export function StaffMessagesInbox() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeForm, setComposeForm] = useState({ recipient: '', subject: '', content: '' });

  const { data: inboxMessages, isLoading: inboxLoading } = useQuery({
    queryKey: ['staff-messages-inbox', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('staff_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return ((data || []) as Message[]).filter(m => m.recipient_ids?.includes(user.id));
    },
    enabled: !!user?.id,
  });

  const { data: sentMessages, isLoading: sentLoading } = useQuery({
    queryKey: ['staff-messages-sent', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('staff_messages')
        .select('*')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Message[];
    },
    enabled: !!user?.id,
  });

  const { data: readMessages } = useQuery({
    queryKey: ['staff-message-reads', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('staff_message_reads')
        .select('message_id')
        .eq('staff_id', user.id);

      if (error) throw error;
      return data?.map(r => r.message_id) || [];
    },
    enabled: !!user?.id,
  });

  const { data: staffList } = useQuery({
    queryKey: ['profiles-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .eq('deactivated', false)
        .order('full_name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (messageId: string) => {
      if (!user?.id) return;
      const { error } = await supabase
        .from('staff_message_reads')
        .upsert({
          message_id: messageId,
          staff_id: user.id,
        }, { onConflict: 'message_id,staff_id' });

      if (error && !error.message.includes('duplicate')) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-message-reads'] });
    },
  });

  const sendMessage = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('staff_messages')
        .insert({
          sender_id: user?.id,
          sender_name: user?.user_metadata?.full_name || user?.email,
          recipient_ids: [composeForm.recipient],
          subject: composeForm.subject,
          content: composeForm.content,
          is_sent: true,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-messages-sent'] });
      setIsComposeOpen(false);
      setComposeForm({ recipient: '', subject: '', content: '' });
      toast({ title: 'Message Sent' });
    },
  });

  const readSet = new Set(readMessages || []);
  const unreadCount = (inboxMessages || []).filter(m => !readSet.has(m.id)).length;

  const openMessage = (message: Message) => {
    setSelectedMessage(message);
    if (!readSet.has(message.id)) {
      markAsRead.mutate(message.id);
    }
  };

  const getInitials = (name: string | null) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const isLoading = activeTab === 'inbox' ? inboxLoading : sentLoading;
  const messages = activeTab === 'inbox'
    ? (inboxMessages || []).map(m => ({ ...m, is_read: readSet.has(m.id) }))
    : (sentMessages || []);

  return (
    <>
      <Card className="rounded-none border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider">
              <MessageSquare className="h-4 w-4" />
              Messages
              {unreadCount > 0 && (
                <Badge variant="destructive" className="animate-pulse rounded-none">{unreadCount}</Badge>
              )}
            </CardTitle>
            <Button size="sm" onClick={() => setIsComposeOpen(true)} className="rounded-none">
              <Plus className="h-4 w-4 mr-1" />
              Compose
            </Button>
          </div>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'inbox' | 'sent')}>
          <div className="px-4">
            <TabsList className="w-full rounded-none">
              <TabsTrigger value="inbox" className="flex-1 gap-2 rounded-none">
                <Inbox className="h-4 w-4" />
                Inbox
                {unreadCount > 0 && <Badge variant="secondary" className="rounded-none">{unreadCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="sent" className="flex-1 gap-2 rounded-none">
                <SendHorizontal className="h-4 w-4" />
                Sent
              </TabsTrigger>
            </TabsList>
          </div>

          <CardContent className="pt-4">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-none" />)}
              </div>
            ) : messages.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                No messages
              </p>
            ) : (
              <div className="space-y-1">
                {messages.map((message) => (
                  <button
                    key={message.id}
                    onClick={() => openMessage(message)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 text-left transition-colors',
                      'hover:bg-muted/50',
                      !message.is_read && activeTab === 'inbox' && 'bg-primary/5 font-medium'
                    )}
                  >
                    <Avatar className="h-8 w-8 rounded-none">
                      <AvatarFallback className="text-xs rounded-none">
                        {getInitials(message.sender_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {!message.is_read && activeTab === 'inbox' && (
                          <Mail className="h-3 w-3 text-primary" />
                        )}
                        <span className="text-xs truncate">
                          {activeTab === 'inbox' ? message.sender_name : `To: ${message.recipient_ids?.length || 0} recipient(s)`}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {message.subject || '(No subject)'}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {format(parseISO(message.created_at), 'MMM d')}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Tabs>
      </Card>

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle className="text-sm">{selectedMessage?.subject || '(No subject)'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="rounded-none">
                <AvatarFallback className="rounded-none">{getInitials(selectedMessage?.sender_name || '')}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{selectedMessage?.sender_name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {selectedMessage && format(parseISO(selectedMessage.created_at), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>
            <div className="p-4 bg-muted/50 whitespace-pre-wrap text-xs">
              {selectedMessage?.content}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-none"
              onClick={() => {
                setComposeForm({
                  recipient: selectedMessage?.sender_id || '',
                  subject: `Re: ${selectedMessage?.subject || ''}`,
                  content: '',
                });
                setSelectedMessage(null);
                setIsComposeOpen(true);
              }}
            >
              <Reply className="h-4 w-4 mr-2" />
              Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compose Dialog */}
      <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle className="text-sm">New Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-wider">To</Label>
              <Select
                value={composeForm.recipient}
                onValueChange={(v) => setComposeForm(prev => ({ ...prev, recipient: v }))}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Select recipient..." />
                </SelectTrigger>
                <SelectContent>
                  {(staffList || []).map((staff) => (
                    <SelectItem key={staff.user_id} value={staff.user_id}>
                      {staff.full_name || staff.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-wider">Subject</Label>
              <Input
                value={composeForm.subject}
                onChange={(e) => setComposeForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Message subject..."
                className="rounded-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-wider">Message</Label>
              <Textarea
                value={composeForm.content}
                onChange={(e) => setComposeForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Type your message..."
                rows={5}
                className="rounded-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsComposeOpen(false)} className="rounded-none">
              Cancel
            </Button>
            <Button
              onClick={() => sendMessage.mutate()}
              disabled={!composeForm.recipient || !composeForm.content || sendMessage.isPending}
              className="rounded-none"
            >
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

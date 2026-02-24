import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Megaphone, Bell, Calendar, Clock } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent } from '@/components/ui/sheet';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn, sanitizeHtml } from '@/lib/utils';
import { AppRole } from '@/types/roles';
import { AnnouncementComments, CommentCountBadge } from './AnnouncementComments';
import { useAnnouncementCommentCounts } from '@/hooks/useAnnouncementComments';

function stripHtmlPreview(html: string, maxLen = 120): string {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length <= maxLen ? text : text.slice(0, maxLen) + '…';
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  announcement_type: 'announcement' | 'weekly_update';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  target_departments: string[] | null;
  week_start_date: string | null;
  photo_url: string | null;
  expires_at: string | null;
  scheduled_at: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  is_read?: boolean;
}

// Sentinel component that marks announcement as read when scrolled to bottom
function ReadSentinel({ announcementId, onVisible }: { announcementId: string; onVisible: (id: string) => void }) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.9) {
            const timeout = setTimeout(() => {
              onVisible(announcementId);
            }, 800);
            return () => clearTimeout(timeout);
          }
        });
      },
      { threshold: 0.9 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [announcementId, onVisible]);

  return <div ref={sentinelRef} className="h-1 w-full" />;
}

interface AnnouncementsBoardProps {
  contextRole?: AppRole;
}

export function AnnouncementsBoard({ contextRole }: AnnouncementsBoardProps) {
  const { user } = useAuth();
  const { data: userRoles } = useUserRoles(user?.id);
  const queryClient = useQueryClient();
  
  // When contextRole is set, filter only by that role (dashboard-aware); memoize so filteredAnnouncements useMemo stays stable
  const roles = useMemo(
    () => (contextRole ? [contextRole] : (userRoles?.map((r) => r.role) || [])),
    [contextRole, userRoles]
  );
  const [activeTab, setActiveTab] = useState<'all' | 'weekly' | 'announcements'>('all');
  const [selectedForSheet, setSelectedForSheet] = useState<(Announcement & { is_read?: boolean }) | null>(null);
  const isMobile = useIsMobile();

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['staff-announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Announcement[];
    },
  });

  // Real-time subscription: refresh on any insert/update/delete
  useEffect(() => {
    const channel = supabase
      .channel('staff-announcements-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff_announcements' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['staff-announcements'] });
          queryClient.invalidateQueries({ queryKey: ['staff-announcements-manager'] });
          queryClient.invalidateQueries({ queryKey: ['staff-announcements-active'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: readAnnouncements } = useQuery({
    queryKey: ['staff-announcement-reads', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('staff_announcement_reads')
        .select('announcement_id')
        .eq('staff_id', user.id);

      if (error) throw error;
      return data?.map(r => r.announcement_id) || [];
    },
    enabled: !!user?.id,
  });

  const filteredAnnouncements = useMemo(() => {
    if (!announcements) return [];
    const now = new Date();
    return announcements.filter((a) => {
      if (a.scheduled_at && new Date(a.scheduled_at) > now) return false;
      if (a.expires_at && new Date(a.expires_at) < now) return false;
      if (!a.target_departments || a.target_departments.length === 0) return true;
      if (!roles || roles.length === 0) return false;
      return roles.some((role) => a.target_departments?.includes(role));
    });
  }, [announcements, roles]);

  const announcementIds = filteredAnnouncements.map((a) => a.id);
  const { data: commentCounts } = useAnnouncementCommentCounts(announcementIds);

  const markAsRead = useMutation({
    mutationFn: async (announcementId: string) => {
      if (!user?.id) return;
      const { error } = await supabase
        .from('staff_announcement_reads')
        .upsert({
          announcement_id: announcementId,
          staff_id: user.id,
        }, { onConflict: 'announcement_id,staff_id' });

      if (error && !error.message.includes('duplicate')) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-announcement-reads'] });
      queryClient.invalidateQueries({ queryKey: ['unread-announcements-check'] });
    },
  });

  const handleSentinelVisible = useCallback((announcementId: string) => {
    if (readAnnouncements?.includes(announcementId)) return;
    markAsRead.mutate(announcementId);
  }, [readAnnouncements, markAsRead]);

  const readSet = new Set(readAnnouncements || []);

  const announcementsList = filteredAnnouncements
    .filter(a => a.announcement_type === 'announcement')
    .map(a => ({ ...a, is_read: readSet.has(a.id) }));

  const weeklyUpdates = filteredAnnouncements
    .filter(a => a.announcement_type === 'weekly_update')
    .map(a => ({ ...a, is_read: readSet.has(a.id) }))
    .sort((a, b) => {
      const dateA = a.week_start_date ? new Date(a.week_start_date) : new Date(a.created_at);
      const dateB = b.week_start_date ? new Date(b.week_start_date) : new Date(b.created_at);
      return dateB.getTime() - dateA.getTime();
    });

  const thisWeekId = useMemo(() => {
    if (weeklyUpdates.length === 0) return null;
    const sixDaysAgo = new Date();
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
    const newest = weeklyUpdates[0];
    return new Date(newest.created_at) >= sixDaysAgo ? newest.id : null;
  }, [weeklyUpdates]);

  const unreadAnnouncements = announcementsList.filter(a => !a.is_read).length;
  const unreadWeekly = weeklyUpdates.filter(w => !w.is_read).length;

  const allItems = useMemo(() => {
    const withRead = [...announcementsList, ...weeklyUpdates];
    return withRead.sort((a, b) => {
      const dateA = a.announcement_type === 'weekly_update' && a.week_start_date
        ? new Date(a.week_start_date).getTime()
        : new Date(a.created_at).getTime();
      const dateB = b.announcement_type === 'weekly_update' && b.week_start_date
        ? new Date(b.week_start_date).getTime()
        : new Date(b.created_at).getTime();
      return dateB - dateA;
    });
  }, [announcementsList, weeklyUpdates]);

  const unreadAll = unreadAnnouncements + unreadWeekly;

  const openAnnouncementSheet = useCallback((item: Announcement & { is_read?: boolean }) => {
    setSelectedForSheet(item);
    if (!item.is_read) markAsRead.mutate(item.id);
  }, [markAsRead]);

  const priorityStyles: Record<string, string> = {
    urgent: 'border-destructive bg-destructive/5',
    high: 'border-amber-500 bg-amber-500/5',
    normal: 'border-border',
    low: 'border-slate-300 bg-slate-50/50',
  };

  const weeklyUpdateStyle = 'border-blue-500 bg-blue-500/5';

  if (isMobile) {
    const mobileItems = activeTab === 'all' ? allItems : activeTab === 'weekly' ? weeklyUpdates : announcementsList;
    const sortedMobileItems = activeTab === 'announcements'
      ? [...(mobileItems as (Announcement & { is_read?: boolean })[])].sort((a, b) => {
          if (a.is_read !== b.is_read) return a.is_read ? 1 : -1;
          const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
          const diff = (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
          return diff !== 0 ? diff : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        })
      : mobileItems;

    return (
      <div className="flex flex-col min-h-0">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'weekly' | 'announcements')}>
          <TabsList className="w-full grid grid-cols-3 h-12 rounded-none border-b bg-muted/30">
            <TabsTrigger value="all" className="rounded-none data-[state=active]:bg-background gap-1.5 text-xs">
              All
              {unreadAll > 0 && <span className="h-2 w-2 bg-primary rounded-full" />}
            </TabsTrigger>
            <TabsTrigger value="weekly" className="rounded-none data-[state=active]:bg-background gap-1.5 text-xs">
              Weekly
              {unreadWeekly > 0 && <span className="h-2 w-2 bg-primary rounded-full" />}
            </TabsTrigger>
            <TabsTrigger value="announcements" className="rounded-none data-[state=active]:bg-background gap-1.5 text-xs">
              News
              {unreadAnnouncements > 0 && <span className="h-2 w-2 bg-primary rounded-full" />}
            </TabsTrigger>
          </TabsList>
          <div className="flex-1 min-h-0 overflow-auto p-3 space-y-2">
            {isLoading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
            ) : sortedMobileItems.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No items</div>
            ) : (
              sortedMobileItems.map((item) => {
                const isWeekly = item.announcement_type === 'weekly_update';
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openAnnouncementSheet(item)}
                    className={cn(
                      'w-full text-left p-4 rounded-xl border shadow-sm transition-all min-h-[44px]',
                      !item.is_read && 'ring-1 ring-primary/20',
                      isWeekly ? weeklyUpdateStyle : priorityStyles[(item as Announcement).priority]
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {!item.is_read && (
                        <span className="h-2 w-2 bg-primary rounded-full shrink-0 mt-1.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base truncate">{item.title}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {format(parseISO(item.created_at), 'MMM d, yyyy')}
                          {item.created_by && ` · ${item.created_by}`}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {stripHtmlPreview(item.content)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Tabs>
        <Sheet open={!!selectedForSheet} onOpenChange={(open) => !open && setSelectedForSheet(null)}>
          <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto p-4 pb-8">
              {selectedForSheet && (
                <>
                  <h3 className="font-semibold text-lg mb-2">{selectedForSheet.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    {format(parseISO(selectedForSheet.created_at), 'MMM d, h:mm a')}
                    {selectedForSheet.created_by && ` · ${selectedForSheet.created_by}`}
                  </p>
                  <div
                    className="text-sm whitespace-pre-wrap prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-primary [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedForSheet.content) }}
                  />
                  {selectedForSheet.photo_url && (
                    <img src={selectedForSheet.photo_url} alt="" className="mt-4 max-h-48 w-full object-cover rounded-lg border" />
                  )}
                  <AnnouncementComments
                    announcementId={selectedForSheet.id}
                    commentCount={commentCounts?.[selectedForSheet.id] || 0}
                    className="mt-4 pt-4 border-t"
                  />
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  const renderWeeklyCard = (item: Announcement & { is_read?: boolean }, isThisWeek = false) => (
    <div
      key={item.id}
      className={cn(
        'p-4 border w-full',
        weeklyUpdateStyle,
        !item.is_read && 'ring-1 ring-primary/20'
      )}
    >
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {isThisWeek && (
          <Badge className="bg-green-600 text-white border-green-600">This Week</Badge>
        )}
        <Badge variant="secondary" className="text-[10px] border-none rounded-none" style={{ backgroundColor: '#62bb47', color: 'white', paddingLeft: '6.25px', paddingRight: '6.25px', paddingTop: '2.25px', paddingBottom: '2.25px' }}>Weekly Update</Badge>
        <div className="flex-1" />
        {item.week_start_date && (
          <Badge variant="outline" className="text-[10px] border-none rounded-none" style={{ backgroundColor: '#7c3aed', color: 'white', paddingLeft: '6.25px', paddingRight: '6.25px', paddingTop: '2.25px', paddingBottom: '2.25px' }}>
            Week of {format(parseISO(item.week_start_date), 'MMM d, yyyy')}
          </Badge>
        )}
        {!item.is_read && (
          <span className="h-2 w-2 bg-primary rounded-full animate-pulse" />
        )}
        <CommentCountBadge count={commentCounts?.[item.id] || 0} />
      </div>
      <h3 className="font-semibold text-sm mb-3">{item.title}</h3>
      <div
        className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-primary [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.content) }}
      />
      {item.photo_url && (
        <img src={item.photo_url} alt="Update attachment" className="mt-4 max-h-48 object-cover border" />
      )}
      <Separator className="my-4" />
      <div className="text-[10px] text-muted-foreground">
        Posted by {item.created_by} • {format(parseISO(item.created_at), 'MMM d, h:mm a')}
      </div>
      <AnnouncementComments
        announcementId={item.id}
        commentCount={commentCounts?.[item.id] || 0}
        className="mt-4 -mx-4 -mb-4 px-4 pb-4 border-t bg-muted/20"
      />
      {!item.is_read && <ReadSentinel announcementId={item.id} onVisible={handleSentinelVisible} />}
    </div>
  );

  const renderAnnouncementCard = (item: Announcement & { is_read?: boolean }) => (
    <div
      key={item.id}
      className={cn(
        'p-4 border transition-all w-full',
        priorityStyles[item.priority],
        !item.is_read && 'ring-1 ring-primary/20'
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h4 className="font-medium text-sm flex-1">{item.title}</h4>
        <div className="flex items-center gap-1.5 shrink-0">
          {!item.is_read && (
            <span className="h-2 w-2 bg-primary rounded-full animate-pulse" />
          )}
          <CommentCountBadge count={commentCounts?.[item.id] || 0} />
        </div>
      </div>
      <div
        className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed prose prose-sm max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-primary [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.content) }}
      />
      {item.photo_url && (
        <img src={item.photo_url} alt="Attachment" className="mt-3 max-h-48 object-cover border" />
      )}
      <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
        <Clock className="h-3 w-3" />
        {format(parseISO(item.created_at), 'MMM d, h:mm a')}
        <span>•</span>
        <span>{item.created_by}</span>
      </div>
      <AnnouncementComments
        announcementId={item.id}
        commentCount={commentCounts?.[item.id] || 0}
        className="mt-3 -mx-4 -mb-4 px-4 pb-4 border-t bg-muted/20"
      />
      {!item.is_read && <ReadSentinel announcementId={item.id} onVisible={handleSentinelVisible} />}
    </div>
  );

  return (
    <div className="space-y-6">

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'weekly' | 'announcements')}>
        <TabsList className="w-full max-w-2xl overflow-x-auto flex-nowrap justify-start">
          <TabsTrigger value="all" className="shrink-0 md:flex-1 gap-2">
            <Megaphone className="h-4 w-4" />
            All
            {unreadAll > 0 && (
              <span className="h-2 w-2 bg-primary rounded-full animate-pulse" />
            )}
          </TabsTrigger>
          <TabsTrigger value="weekly" className="shrink-0 md:flex-1 gap-2">
            <Calendar className="h-4 w-4" />
            Weekly Updates
            {unreadWeekly > 0 && (
              <span className="h-2 w-2 bg-primary rounded-full animate-pulse" />
            )}
          </TabsTrigger>
          <TabsTrigger value="announcements" className="shrink-0 md:flex-1 gap-2">
            <Bell className="h-4 w-4" />
            Announcements
            {unreadAnnouncements > 0 && (
              <span className="h-2 w-2 bg-destructive rounded-full animate-pulse" />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : allItems.length === 0 ? (
            <div className="border bg-muted/30 p-8 text-center">
              <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">No announcements or weekly updates</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allItems.map((item) =>
                item.announcement_type === 'weekly_update'
                  ? renderWeeklyCard(item, item.id === thisWeekId)
                  : renderAnnouncementCard(item)
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="announcements" className="mt-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : announcementsList.length === 0 ? (
            <div className="border bg-muted/30 p-8 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">No active announcements</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcementsList
                .sort((a, b) => {
                  if (a.is_read !== b.is_read) return a.is_read ? 1 : -1;
                  const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
                  const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
                  if (priorityDiff !== 0) return priorityDiff;
                  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                })
                .map((announcement) => renderAnnouncementCard(announcement))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="weekly" className="mt-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : weeklyUpdates.length === 0 ? (
            <div className="border bg-muted/30 p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">No weekly updates available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {weeklyUpdates.map((update) => renderWeeklyCard(update, update.id === thisWeekId))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

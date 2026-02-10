import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { Megaphone, Bell, Calendar, ChevronLeft, ChevronRight, Clock, Sparkles, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { cn } from '@/lib/utils';
import { AnnouncementComments, CommentCountBadge } from './AnnouncementComments';
import { useAnnouncementCommentCounts } from '@/hooks/useAnnouncementComments';

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

export function AnnouncementsBoard() {
  const { user } = useAuth();
  const { data: userRoles } = useUserRoles(user?.id);
  const queryClient = useQueryClient();
  
  // Extract role names from user role objects
  const roles = userRoles?.map((r) => r.role) || [];
  const [activeTab, setActiveTab] = useState<'all' | 'weekly' | 'announcements'>('all');
  const [weekOffset, setWeekOffset] = useState(0);
  const [showAllWeekly, setShowAllWeekly] = useState(false);

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

  // Filter announcements based on role, schedule, and expiration
  const filteredAnnouncements = useMemo(() => {
    if (!announcements) return [];
    
    const now = new Date();
    
    return announcements.filter((a) => {
      // Filter out scheduled announcements that haven't been published yet
      if (a.scheduled_at && new Date(a.scheduled_at) > now) {
        return false;
      }
      
      // Filter out expired announcements
      if (a.expires_at && new Date(a.expires_at) < now) {
        return false;
      }
      
      // Filter by target_departments (role-based filtering)
      // If no targeting, show to everyone
      if (!a.target_departments || a.target_departments.length === 0) {
        return true;
      }
      
      // If user has no roles, only show untargeted announcements
      if (!roles || roles.length === 0) {
        return false;
      }
      
      // Check if any of user's roles match the target departments
      return roles.some((role) => a.target_departments?.includes(role));
    });
  }, [announcements, roles]);

  // Get comment counts for all announcements
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
    },
  });

  const setupReadObserver = useCallback((node: HTMLElement | null, announcementId: string) => {
    if (!node || !user?.id) return;
    if (readAnnouncements?.includes(announcementId)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            setTimeout(() => {
              if (entry.isIntersecting) {
                markAsRead.mutate(announcementId);
              }
            }, 1500);
          }
        });
      },
      { threshold: 0.6 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [user?.id, readAnnouncements, markAsRead]);

  const readSet = new Set(readAnnouncements || []);

  const announcementsList = filteredAnnouncements
    .filter(a => a.announcement_type === 'announcement')
    .map(a => ({ ...a, is_read: readSet.has(a.id) }));

  const weeklyUpdates = filteredAnnouncements
    .filter(a => a.announcement_type === 'weekly_update')
    .map(a => ({ ...a, is_read: readSet.has(a.id) }))
    .sort((a, b) => {
      // Sort by week_start_date descending
      const dateA = a.week_start_date ? new Date(a.week_start_date) : new Date(a.created_at);
      const dateB = b.week_start_date ? new Date(b.week_start_date) : new Date(b.created_at);
      return dateB.getTime() - dateA.getTime();
    });

  // Get week update for the current offset - more flexible matching
  const getWeekUpdate = () => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + (weekOffset * 7));
    const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 });
    
    // Find any update whose week_start_date falls within this week
    return weeklyUpdates.find(u => {
      if (!u.week_start_date) return false;
      const updateDate = new Date(u.week_start_date);
      return isWithinInterval(updateDate, { start: weekStart, end: weekEnd });
    });
  };

  const currentWeekUpdate = getWeekUpdate();
  const unreadAnnouncements = announcementsList.filter(a => !a.is_read).length;
  const unreadWeekly = weeklyUpdates.filter(w => !w.is_read).length;

  // Combined list for "All" tab: announcements + weekly updates, sorted by date desc
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

  // Enhanced priority styles
  const priorityStyles: Record<string, string> = {
    urgent: 'border-destructive bg-destructive/5',
    high: 'border-amber-500 bg-amber-500/5',
    normal: 'border-border',
    low: 'border-slate-300 bg-slate-50/50',
  };

  const weeklyUpdateStyle = 'border-blue-500 bg-blue-500/5';

  return (
    <div className="space-y-6 px-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Announcements
          </h2>
          <p className="text-sm text-muted-foreground">
            Stay updated with announcements and weekly communications.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'weekly' | 'announcements')}>
        <TabsList className="w-full max-w-2xl">
          <TabsTrigger value="all" className="flex-1 gap-2">
            <Megaphone className="h-4 w-4" />
            All
            {unreadAll > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {unreadAll}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex-1 gap-2">
            <Calendar className="h-4 w-4" />
            Weekly Updates
            {unreadWeekly > 0 && (
              <Badge variant="default" className="h-5 px-1.5 text-xs">
                {unreadWeekly}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="announcements" className="flex-1 gap-2">
            <Bell className="h-4 w-4" />
            Announcements
            {unreadAnnouncements > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-xs animate-pulse">
                {unreadAnnouncements}
              </Badge>
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
                item.announcement_type === 'weekly_update' ? (
                  <div
                    key={item.id}
                    ref={(node) => setupReadObserver(node, item.id)}
                    className={cn(
                      'p-4 border w-full',
                      weeklyUpdateStyle,
                      !item.is_read && 'ring-1 ring-primary/20'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">Weekly Update</Badge>
                      {item.week_start_date && (
                        <Badge variant="outline" className="text-[10px]">
                          Week of {format(parseISO(item.week_start_date), 'MMM d, yyyy')}
                        </Badge>
                      )}
                      {!item.is_read && (
                        <Badge variant="default" className="text-[10px] animate-pulse">Unread</Badge>
                      )}
                      <CommentCountBadge count={commentCounts?.[item.id] || 0} />
                    </div>
                    <h3 className="font-semibold text-sm mb-3">{item.title}</h3>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {item.content}
                    </p>
                    {item.photo_url && (
                      <img
                        src={item.photo_url}
                        alt="Update attachment"
                        className="mt-4 max-h-48 object-cover border"
                      />
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
                  </div>
                ) : (
                  <div
                    key={item.id}
                    ref={(node) => setupReadObserver(node, item.id)}
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
                          <Badge variant="default" className="text-[10px] h-5 animate-pulse">New</Badge>
                        )}
                        <CommentCountBadge count={commentCounts?.[item.id] || 0} />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {item.content}
                    </p>
                    {item.photo_url && (
                      <img
                        src={item.photo_url}
                        alt="Attachment"
                        className="mt-3 max-h-48 object-cover border"
                      />
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
                  </div>
                )
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
                .map((announcement) => (
                  <div
                    key={announcement.id}
                    ref={(node) => setupReadObserver(node, announcement.id)}
                    className={cn(
                      'p-4 border transition-all w-full',
                      priorityStyles[announcement.priority],
                      !announcement.is_read && 'ring-1 ring-primary/20'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h4 className="font-medium text-sm flex-1">{announcement.title}</h4>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!announcement.is_read && (
                          <Badge variant="default" className="text-[10px] h-5 animate-pulse">New</Badge>
                        )}
                        <CommentCountBadge count={commentCounts?.[announcement.id] || 0} />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {announcement.content}
                    </p>
                    {announcement.photo_url && (
                      <img
                        src={announcement.photo_url}
                        alt="Attachment"
                        className="mt-3 max-h-48 object-cover border"
                      />
                    )}
                    <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(parseISO(announcement.created_at), 'MMM d, h:mm a')}
                      <span>•</span>
                      <span>{announcement.created_by}</span>
                    </div>
                    
                    <AnnouncementComments
                      announcementId={announcement.id}
                      commentCount={commentCounts?.[announcement.id] || 0}
                      className="mt-3 -mx-4 -mb-4 px-4 pb-4 border-t bg-muted/20"
                    />
                  </div>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="weekly" className="mt-6">
          {/* Toggle between week navigation and all updates */}
          <div className="flex items-center justify-end gap-2 mb-4">
            <Label htmlFor="show-all" className="text-xs text-muted-foreground">
              Show all updates
            </Label>
            <Switch
              id="show-all"
              checked={showAllWeekly}
              onCheckedChange={setShowAllWeekly}
            />
          </div>

          {!showAllWeekly ? (
            <>
              {/* Week Navigation */}
              <div className="flex items-center justify-between mb-4 p-3 border bg-muted/30">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWeekOffset(prev => prev - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="text-center">
                  <p className="text-xs font-medium">
                    {format(
                      startOfWeek(new Date(Date.now() + weekOffset * 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 1 }),
                      'MMM d'
                    )}
                    {' - '}
                    {format(
                      endOfWeek(new Date(Date.now() + weekOffset * 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 1 }),
                      'MMM d, yyyy'
                    )}
                  </p>
                  {weekOffset === 0 && (
                    <Badge variant="outline" className="mt-1 gap-1">
                      <Sparkles className="h-3 w-3" />
                      Current Week
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWeekOffset(prev => prev + 1)}
                  disabled={weekOffset >= 0}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              {currentWeekUpdate ? (
                <div
                  ref={(node) => setupReadObserver(node, currentWeekUpdate.id)}
                  className={cn(
                    'p-4 border w-full',
                    weeklyUpdateStyle,
                    !currentWeekUpdate.is_read && 'ring-1 ring-primary/20'
                  )}
                >
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">Weekly Update</Badge>
                    {!currentWeekUpdate.is_read && (
                      <Badge variant="default" className="text-[10px] animate-pulse">Unread</Badge>
                    )}
                    <CommentCountBadge count={commentCounts?.[currentWeekUpdate.id] || 0} />
                  </div>
                  <h3 className="font-semibold text-sm mb-3">{currentWeekUpdate.title}</h3>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {currentWeekUpdate.content}
                  </p>
                  {currentWeekUpdate.photo_url && (
                    <img
                      src={currentWeekUpdate.photo_url}
                      alt="Update attachment"
                      className="mt-4 max-h-48 object-cover border"
                    />
                  )}
                  <Separator className="my-4" />
                  <div className="text-[10px] text-muted-foreground">
                    Posted by {currentWeekUpdate.created_by} • {format(parseISO(currentWeekUpdate.created_at), 'MMM d, h:mm a')}
                  </div>
                  
                  <AnnouncementComments
                    announcementId={currentWeekUpdate.id}
                    commentCount={commentCounts?.[currentWeekUpdate.id] || 0}
                    className="mt-4 -mx-4 -mb-4 px-4 pb-4 border-t bg-muted/20"
                  />
                </div>
              ) : (
                <div className="border bg-muted/30 p-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">No weekly update for this week</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Use the arrows to navigate to other weeks, or toggle "Show all updates"
                  </p>
                </div>
              )}
            </>
          ) : (
            /* Show all weekly updates */
            isLoading ? (
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
                {weeklyUpdates.map((update) => (
                  <div
                    key={update.id}
                    ref={(node) => setupReadObserver(node, update.id)}
                    className={cn(
                      'p-4 border w-full',
                      weeklyUpdateStyle,
                      !update.is_read && 'ring-1 ring-primary/20'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">Weekly Update</Badge>
                      {update.week_start_date && (
                        <Badge variant="outline" className="text-[10px]">
                          Week of {format(parseISO(update.week_start_date), 'MMM d, yyyy')}
                        </Badge>
                      )}
                      {!update.is_read && (
                        <Badge variant="default" className="text-[10px] animate-pulse">Unread</Badge>
                      )}
                      <CommentCountBadge count={commentCounts?.[update.id] || 0} />
                    </div>
                    <h3 className="font-semibold text-sm mb-3">{update.title}</h3>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {update.content}
                    </p>
                    {update.photo_url && (
                      <img
                        src={update.photo_url}
                        alt="Update attachment"
                        className="mt-4 max-h-48 object-cover border"
                      />
                    )}
                    <Separator className="my-4" />
                    <div className="text-[10px] text-muted-foreground">
                      Posted by {update.created_by} • {format(parseISO(update.created_at), 'MMM d, h:mm a')}
                    </div>
                    
                    <AnnouncementComments
                      announcementId={update.id}
                      commentCount={commentCounts?.[update.id] || 0}
                      className="mt-4 -mx-4 -mb-4 px-4 pb-4 border-t bg-muted/20"
                    />
                  </div>
                ))}
              </div>
            )
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { Megaphone, Bell, Calendar, ChevronLeft, ChevronRight, Clock, Sparkles, Image as ImageIcon } from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

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
  announcement_type: 'alert' | 'weekly_update';
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
  const { roles } = useUserRoles();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'alerts' | 'weekly'>('alerts');
  const [weekOffset, setWeekOffset] = useState(0);

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

  const alerts = filteredAnnouncements
    .filter(a => a.announcement_type === 'alert')
    .map(a => ({ ...a, is_read: readSet.has(a.id) }));

  const weeklyUpdates = filteredAnnouncements
    .filter(a => a.announcement_type === 'weekly_update')
    .map(a => ({ ...a, is_read: readSet.has(a.id) }));

  const getWeekUpdate = () => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + (weekOffset * 7));
    const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 });
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    return weeklyUpdates.find(u => u.week_start_date === weekStartStr);
  };

  const currentWeekUpdate = getWeekUpdate();
  const unreadAlerts = alerts.filter(a => !a.is_read).length;
  const unreadWeekly = weeklyUpdates.filter(w => !w.is_read).length;

  // Enhanced priority styles including low priority and weekly update blue styling
  const priorityStyles: Record<string, string> = {
    urgent: 'border-destructive bg-destructive/5',
    high: 'border-amber-500 bg-amber-500/5',
    normal: 'border-border',
    low: 'border-slate-300 bg-slate-50/50',
  };

  const weeklyUpdateStyle = 'border-blue-500 bg-blue-500/5';

  return (
    <Card className="rounded-none border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider">
          <Megaphone className="h-4 w-4" />
          Announcements
        </CardTitle>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'alerts' | 'weekly')}>
        <div className="px-4">
          <TabsList className="w-full rounded-none">
            <TabsTrigger value="alerts" className="flex-1 gap-2 rounded-none">
              <Bell className="h-4 w-4" />
              Alerts
              {unreadAlerts > 0 && (
                <Badge variant="destructive" className="h-5 px-1.5 text-xs animate-pulse rounded-none">
                  {unreadAlerts}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex-1 gap-2 rounded-none">
              <Calendar className="h-4 w-4" />
              Weekly Update
              {unreadWeekly > 0 && (
                <Badge variant="default" className="h-5 px-1.5 text-xs rounded-none">
                  {unreadWeekly}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <CardContent className="pt-4">
          <TabsContent value="alerts" className="m-0">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-none" />)}
              </div>
            ) : alerts.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                No active announcements
              </p>
            ) : (
              <div className="space-y-3">
                {alerts
                  .sort((a, b) => {
                    // Sort by read status first (unread first)
                    if (a.is_read !== b.is_read) return a.is_read ? 1 : -1;
                    // Then by priority (urgent > high > normal > low)
                    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
                    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
                    if (priorityDiff !== 0) return priorityDiff;
                    // Then by date (newest first)
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                  })
                  .map((alert) => (
                    <div
                      key={alert.id}
                      ref={(node) => setupReadObserver(node, alert.id)}
                      className={cn(
                        'p-3 border transition-all',
                        priorityStyles[alert.priority],
                        !alert.is_read && 'ring-1 ring-primary/20'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium text-sm">{alert.title}</h4>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {!alert.is_read && (
                            <Badge variant="default" className="text-[10px] h-5 rounded-none animate-pulse">New</Badge>
                          )}
                          {alert.priority !== 'normal' && (
                            <Badge
                              variant={alert.priority === 'urgent' ? 'destructive' : 'secondary'}
                              className={cn(
                                "text-[10px] h-5 rounded-none",
                                alert.priority === 'high' && 'bg-amber-500 text-white'
                              )}
                            >
                              {alert.priority}
                            </Badge>
                          )}
                          <CommentCountBadge count={commentCounts?.[alert.id] || 0} />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                        {alert.content}
                      </p>
                      {alert.photo_url && (
                        <img
                          src={alert.photo_url}
                          alt="Attachment"
                          className="mt-2 max-h-32 object-cover border"
                        />
                      )}
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(parseISO(alert.created_at), 'MMM d, h:mm a')}
                        <span>•</span>
                        <span>{alert.created_by}</span>
                      </div>
                      
                      {/* Comments Section */}
                      <AnnouncementComments
                        announcementId={alert.id}
                        commentCount={commentCounts?.[alert.id] || 0}
                        className="mt-2 -mx-3 -mb-3 px-3 pb-3 border-t bg-muted/20"
                      />
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="weekly" className="m-0">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWeekOffset(prev => prev - 1)}
                className="rounded-none"
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
                  <Badge variant="outline" className="mt-1 gap-1 rounded-none">
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
                className="rounded-none"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {currentWeekUpdate ? (
              <div
                ref={(node) => setupReadObserver(node, currentWeekUpdate.id)}
                className={cn(
                  'p-4 border',
                  weeklyUpdateStyle,
                  !currentWeekUpdate.is_read && 'ring-1 ring-primary/20'
                )}
              >
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Badge variant="secondary" className="rounded-none bg-blue-100 text-blue-700">Weekly Update</Badge>
                  {!currentWeekUpdate.is_read && (
                    <Badge variant="default" className="text-[10px] rounded-none animate-pulse">Unread</Badge>
                  )}
                  <CommentCountBadge count={commentCounts?.[currentWeekUpdate.id] || 0} />
                </div>
                <h3 className="font-semibold text-sm mb-2">{currentWeekUpdate.title}</h3>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {currentWeekUpdate.content}
                </p>
                {currentWeekUpdate.photo_url && (
                  <img
                    src={currentWeekUpdate.photo_url}
                    alt="Update attachment"
                    className="mt-3 max-h-48 object-cover border"
                  />
                )}
                <Separator className="my-4" />
                <div className="text-[10px] text-muted-foreground">
                  Posted by {currentWeekUpdate.created_by} • {format(parseISO(currentWeekUpdate.created_at), 'MMM d, h:mm a')}
                </div>
                
                {/* Comments Section */}
                <AnnouncementComments
                  announcementId={currentWeekUpdate.id}
                  commentCount={commentCounts?.[currentWeekUpdate.id] || 0}
                  className="mt-4 -mx-4 -mb-4 px-4 pb-4 border-t bg-muted/20"
                />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">
                No weekly update for this week
              </p>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}

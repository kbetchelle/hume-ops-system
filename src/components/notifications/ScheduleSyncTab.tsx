import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { getPSTToday } from '@/lib/dateUtils';
import { RefreshCw, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  selectFrom,
  updateTable,
  eq,
} from '@/lib/dataApi';
import {
  useClassTypeMappings,
  matchClassCategory,
  CLASS_CATEGORY_LABELS,
  type ClassTypeMapping,
  type ClassCategory,
} from '@/hooks/useClassTypeMappings';
import {
  useNotificationTriggers,
  useCreateTrigger,
  EVENT_TYPE_LABELS,
  type NotificationTrigger,
  type NotificationTriggerEventType,
  type NotificationTriggerTargetDepartment,
} from '@/hooks/useNotificationTriggers';
import { toast } from 'sonner';

interface DailyScheduleRow {
  id: string;
  class_id: string | null;
  class_name: string | null;
  start_time: string | null;
  end_time: string | null;
  schedule_date: string;
  canceled: boolean | null;
}

type SyncLogEntry = { type: 'created' | 'updated' | 'info'; message: string };

function todayLocal(): string {
  return getPSTToday();
}

export function ScheduleSyncTab() {
  const queryClient = useQueryClient();
  const today = todayLocal();

  const { data: mappings = [], isLoading: mappingsLoading } = useClassTypeMappings();
  const { data: triggers = [], isLoading: triggersLoading } = useNotificationTriggers();
  const createTrigger = useCreateTrigger();

  const [syncLog, setSyncLog] = useState<SyncLogEntry[]>([]);
  const [editingMapping, setEditingMapping] = useState<ClassTypeMapping | null>(null);
  const [editPattern, setEditPattern] = useState('');
  const [editCategory, setEditCategory] = useState<ClassCategory>('standard');
  const [editNotes, setEditNotes] = useState('');

  // Today's classes from daily_schedule
  const { data: scheduleRows = [], isLoading: scheduleLoading } = useQuery({
    queryKey: ['daily-schedule-sync', today],
    queryFn: async () => {
      const { data, error } = await selectFrom<DailyScheduleRow>('daily_schedule', {
        filters: [{ type: 'eq' as const, column: 'schedule_date', value: today }],
        order: { column: 'start_time', ascending: true },
      });
      if (error) throw error;
      return data ?? [];
    },
  });

  const classesWithCategory = useMemo(() => {
    return scheduleRows
      .filter((r) => !r.canceled)
      .map((row) => ({
        ...row,
        category: matchClassCategory(row.class_name ?? '', mappings),
      }));
  }, [scheduleRows, mappings]);

  const runSyncTriggers = async () => {
    const log: SyncLogEntry[] = [];
    setSyncLog([]);

    const existingByEvent = new Map<NotificationTriggerEventType, NotificationTrigger>();
    triggers.forEach((t) => {
      existingByEvent.set(t.event_type as NotificationTriggerEventType, t);
    });

    const eventTypes: {
      event: NotificationTriggerEventType;
      defaultMessage: string;
      targetDept: NotificationTriggerTargetDepartment;
    }[] = [
      {
        event: 'class_end_heated_room',
        defaultMessage: 'Heated room class ended — mat cleaning',
        targetDept: 'concierge',
      },
      {
        event: 'class_end_high_roof',
        defaultMessage: 'High Roof class ended — mat cleaning',
        targetDept: 'concierge',
      },
      {
        event: 'room_turnover',
        defaultMessage: 'Room turnover in 5 min',
        targetDept: 'concierge',
      },
    ];

    for (const { event, defaultMessage, targetDept } of eventTypes) {
      const existing = existingByEvent.get(event);
      try {
        if (existing) {
          log.push({ type: 'updated', message: `${EVENT_TYPE_LABELS[event]}: trigger already exists` });
        } else {
          await createTrigger.mutateAsync({
            event_type: event,
            target_department: targetDept,
            message: defaultMessage,
            timing_description: event === 'room_turnover' ? '5 min before class end' : 'At class end',
            timing_window_minutes: 5,
            filter_by_working: true,
          });
          log.push({ type: 'created', message: `Created trigger: ${EVENT_TYPE_LABELS[event]}` });
        }
      } catch (e) {
        log.push({
          type: 'info',
          message: `Error ensuring ${EVENT_TYPE_LABELS[event]}: ${e instanceof Error ? e.message : String(e)}`,
        });
      }
    }

    const heated = classesWithCategory.filter((c) => c.category === 'heated_room').length;
    const highRoof = classesWithCategory.filter((c) => c.category === 'high_roof').length;
    log.push({
      type: 'info',
      message: `Today's classes: ${heated} heated_room, ${highRoof} high_roof, ${classesWithCategory.length - heated - highRoof} standard`,
    });
    setSyncLog(log);
    queryClient.invalidateQueries({ queryKey: ['notification-triggers'] });
    toast.success('Sync complete');
  };

  const openEditMapping = (m: ClassTypeMapping) => {
    setEditingMapping(m);
    setEditPattern(m.class_name_pattern);
    setEditCategory(m.class_category);
    setEditNotes(m.notes ?? '');
  };

  const saveMappingMutation = useMutation({
    mutationFn: async () => {
      if (!editingMapping) return null;
      const { data, error } = await updateTable<ClassTypeMapping>(
        'class_type_mappings',
        {
          class_name_pattern: editPattern,
          class_category: editCategory,
          notes: editNotes || null,
        },
        [eq('id', editingMapping.id)]
      );
      if (error) throw error;
      return data?.[0] ?? null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-type-mappings'] });
      setEditingMapping(null);
      toast.success('Mapping updated');
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Failed to update'),
  });

  const isLoading = scheduleLoading || mappingsLoading;

  return (
    <div className="space-y-6">
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="text-lg">Today&apos;s class schedule</CardTitle>
          <CardDescription>
            Classes from daily_schedule for {today}. Category is determined by class type mappings below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading schedule...</p>
          ) : scheduleRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No classes for today. Ensure Arketa sync has run and daily_schedule is populated.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="rounded-none">Class name</TableHead>
                  <TableHead className="rounded-none">Start</TableHead>
                  <TableHead className="rounded-none">End</TableHead>
                  <TableHead className="rounded-none">Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classesWithCategory.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.class_name ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {row.start_time ? format(parseISO(row.start_time), 'h:mm a') : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {row.end_time ? format(parseISO(row.end_time), 'h:mm a') : '—'}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{CLASS_CATEGORY_LABELS[row.category]}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="mt-4 flex items-center gap-2">
            <Button
              className="rounded-none"
              onClick={runSyncTriggers}
              disabled={triggersLoading || createTrigger.isPending}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync Triggers
            </Button>
          </div>

          {syncLog.length > 0 && (
            <div className="mt-4 rounded border bg-muted/30 p-3 font-mono text-xs space-y-1">
              <p className="font-medium text-muted-foreground">Sync log</p>
              {syncLog.map((entry, i) => (
                <div
                  key={i}
                  className={
                    entry.type === 'created'
                      ? 'text-green-600'
                      : entry.type === 'updated'
                        ? 'text-muted-foreground'
                        : ''
                  }
                >
                  {entry.message}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="text-lg">Class type mappings</CardTitle>
          <CardDescription>
            Class names are matched by pattern (SQL-style: % = any characters). Edit to change which classes map to
            heated_room, high_roof, or standard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mappingsLoading ? (
            <p className="text-sm text-muted-foreground">Loading mappings...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="rounded-none">Pattern</TableHead>
                  <TableHead className="rounded-none">Category</TableHead>
                  <TableHead className="rounded-none">Notes</TableHead>
                  <TableHead className="rounded-none w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-sm">{m.class_name_pattern}</TableCell>
                    <TableCell>{CLASS_CATEGORY_LABELS[m.class_category as ClassCategory]}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate" title={m.notes ?? ''}>
                      {m.notes ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-none"
                        onClick={() => openEditMapping(m)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingMapping} onOpenChange={(o) => !o && setEditingMapping(null)}>
        <DialogContent className="rounded-none max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm uppercase tracking-wider">Edit class type mapping</DialogTitle>
            <DialogDescription>Change pattern or category. Pattern uses % for wildcard.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider">Pattern</Label>
              <Input
                value={editPattern}
                onChange={(e) => setEditPattern(e.target.value)}
                placeholder="e.g. Heated%"
                className="rounded-none font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider">Category</Label>
              <Select value={editCategory} onValueChange={(v) => setEditCategory(v as ClassCategory)}>
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {(Object.keys(CLASS_CATEGORY_LABELS) as ClassCategory[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {CLASS_CATEGORY_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider">Notes (optional)</Label>
              <Input
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="e.g. Heated yoga/pilates"
                className="rounded-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMapping(null)} className="rounded-none">
              Cancel
            </Button>
            <Button
              className="rounded-none"
              onClick={() => saveMappingMutation.mutate()}
              disabled={!editPattern.trim() || saveMappingMutation.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

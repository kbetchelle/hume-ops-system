import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  useNotificationTriggers,
  useCreateTrigger,
  useUpdateTrigger,
  useDeleteTrigger,
  EVENT_TYPE_LABELS,
  TARGET_DEPARTMENT_LABELS,
  type NotificationTrigger,
  type NotificationTriggerEventType,
  type NotificationTriggerTargetDepartment,
} from '@/hooks/useNotificationTriggers';
import { toast } from 'sonner';

export function EventTriggersTab() {
  const { data: triggers = [], isLoading } = useNotificationTriggers();
  const createTrigger = useCreateTrigger();
  const updateTrigger = useUpdateTrigger();
  const deleteTrigger = useDeleteTrigger();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<NotificationTrigger | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formEventType, setFormEventType] = useState<NotificationTriggerEventType>('class_end_heated_room');
  const [formTargetDept, setFormTargetDept] = useState<NotificationTriggerTargetDepartment>('concierge');
  const [formMessage, setFormMessage] = useState('');
  const [formTimingDesc, setFormTimingDesc] = useState('');
  const [formFilterWorking, setFormFilterWorking] = useState(true);

  const activeCount = triggers.filter((t) => t.is_active).length;

  const resetForm = () => {
    setEditingTrigger(null);
    setFormEventType('class_end_heated_room');
    setFormTargetDept('concierge');
    setFormMessage('');
    setFormTimingDesc('');
    setFormFilterWorking(true);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (t: NotificationTrigger) => {
    setEditingTrigger(t);
    setFormEventType(t.event_type);
    setFormTargetDept(t.target_department);
    setFormMessage(t.message);
    setFormTimingDesc(t.timing_description ?? '');
    setFormFilterWorking(t.filter_by_working);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formMessage.trim()) {
      toast.error('Message is required');
      return;
    }

    if (editingTrigger) {
      updateTrigger.mutate(
        {
          id: editingTrigger.id,
          event_type: formEventType,
          target_department: formTargetDept,
          message: formMessage.trim(),
          timing_description: formTimingDesc.trim() || null,
          filter_by_working: formFilterWorking,
        },
        {
          onSuccess: () => {
            toast.success('Trigger updated');
            setDialogOpen(false);
            resetForm();
          },
          onError: () => toast.error('Failed to update trigger'),
        }
      );
    } else {
      createTrigger.mutate(
        {
          event_type: formEventType,
          target_department: formTargetDept,
          message: formMessage.trim(),
          timing_description: formTimingDesc.trim() || null,
          filter_by_working: formFilterWorking,
        },
        {
          onSuccess: () => {
            toast.success('Trigger created');
            setDialogOpen(false);
            resetForm();
          },
          onError: () => toast.error('Failed to create trigger'),
        }
      );
    }
  };

  const handleToggleActive = (t: NotificationTrigger) => {
    updateTrigger.mutate(
      { id: t.id, is_active: !t.is_active },
      {
        onSuccess: () => toast.success(t.is_active ? 'Trigger deactivated' : 'Trigger activated'),
        onError: () => toast.error('Failed to update'),
      }
    );
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteTrigger.mutate(deleteId, {
      onSuccess: () => {
        toast.success('Trigger deleted');
        setDeleteId(null);
      },
      onError: () => toast.error('Failed to delete trigger'),
    });
  };

  const timingDisplay = (t: NotificationTrigger) => {
    if (t.timing_description) return t.timing_description;
    return t.timing_window_minutes
      ? `${t.timing_window_minutes} min window`
      : '-';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium">Event Triggers</h2>
          <Badge variant="secondary" className="rounded-none">
            {activeCount} active
          </Badge>
        </div>
        <Button size="sm" onClick={openCreate} className="rounded-none">
          <Plus className="h-4 w-4 mr-2" />
          Add Trigger
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading triggers...</p>
      ) : triggers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No triggers yet. Add one to get started.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="rounded-none">Event Type</TableHead>
              <TableHead className="rounded-none">Target</TableHead>
              <TableHead className="rounded-none">Message</TableHead>
              <TableHead className="rounded-none">Timing</TableHead>
              <TableHead className="rounded-none">Active</TableHead>
              <TableHead className="rounded-none w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {triggers.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">
                  {EVENT_TYPE_LABELS[t.event_type]}
                </TableCell>
                <TableCell>{TARGET_DEPARTMENT_LABELS[t.target_department]}</TableCell>
                <TableCell className="max-w-[200px] truncate" title={t.message}>
                  {t.message}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {timingDisplay(t)}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={t.is_active}
                    onCheckedChange={() => handleToggleActive(t)}
                    className="data-[state=checked]:bg-primary"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-none"
                      onClick={() => openEdit(t)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-none text-destructive"
                      onClick={() => setDeleteId(t.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); setDialogOpen(o); }}>
        <DialogContent className="rounded-none max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm uppercase tracking-wider">
              {editingTrigger ? 'Edit Trigger' : 'Add Trigger'}
            </DialogTitle>
            <DialogDescription>
              {editingTrigger ? 'Update notification trigger settings.' : 'Create a new event notification trigger.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider">Event Type</Label>
              <Select value={formEventType} onValueChange={(v) => setFormEventType(v as NotificationTriggerEventType)}>
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {(Object.keys(EVENT_TYPE_LABELS) as NotificationTriggerEventType[]).map((k) => (
                    <SelectItem key={k} value={k}>{EVENT_TYPE_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider">Target Department</Label>
              <Select value={formTargetDept} onValueChange={(v) => setFormTargetDept(v as NotificationTriggerTargetDepartment)}>
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {(Object.keys(TARGET_DEPARTMENT_LABELS) as NotificationTriggerTargetDepartment[]).map((k) => (
                    <SelectItem key={k} value={k}>{TARGET_DEPARTMENT_LABELS[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider">Message</Label>
              <Textarea
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
                placeholder="Notification message..."
                rows={3}
                className="rounded-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider">Timing Description (optional)</Label>
              <Input
                value={formTimingDesc}
                onChange={(e) => setFormTimingDesc(e.target.value)}
                placeholder="e.g., 5 min before class end"
                className="rounded-none"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="filter-working"
                checked={formFilterWorking}
                onCheckedChange={(c) => setFormFilterWorking(!!c)}
                className="rounded-none"
              />
              <Label htmlFor="filter-working" className="text-xs cursor-pointer">
                Filter by working staff only
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-none">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formMessage.trim() || createTrigger.isPending || updateTrigger.isPending}
              className="rounded-none"
            >
              {editingTrigger ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete trigger?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the notification trigger. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-none bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

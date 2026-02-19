import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useStaffPushStatus,
  useSendTestPush,
  useSendInAppTest,
  type DepartmentFilter,
} from '@/hooks/useStaffPushStatus';
import { toast } from 'sonner';

const DEPARTMENT_OPTIONS: { value: DepartmentFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'foh', label: 'FOH (Concierge)' },
  { value: 'boh', label: 'BOH (Floater, Spa Attendants)' },
  { value: 'cafe', label: 'Cafe' },
];

export function StaffPushStatusTab() {
  const { data: staff = [], isLoading } = useStaffPushStatus();
  const sendTestPush = useSendTestPush();
  const sendInAppTest = useSendInAppTest();
  const [departmentFilter, setDepartmentFilter] = useState<DepartmentFilter>('all');

  const filtered = useMemo(() => {
    if (departmentFilter === 'all') return staff;
    return staff.filter((s) => s.department === departmentFilter);
  }, [staff, departmentFilter]);

  const stats = useMemo(() => {
    const subscribed = staff.filter((s) => s.isSubscribed).length;
    return {
      total: staff.length,
      subscribed,
      notSubscribed: staff.length - subscribed,
    };
  }, [staff]);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading staff...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-medium">Staff Push Status</h2>
        <Select value={departmentFilter} onValueChange={(v) => setDepartmentFilter(v as DepartmentFilter)}>
          <SelectTrigger className="w-[220px] rounded-none">
            <SelectValue placeholder="Filter by department" />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            {DEPARTMENT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary stats */}
      <div className="flex gap-4">
        <Badge variant="secondary" className="rounded-none">Total: {stats.total}</Badge>
        <Badge variant="default" className="rounded-none bg-green-600">Subscribed: {stats.subscribed}</Badge>
        <Badge variant="destructive" className="rounded-none">Not Subscribed: {stats.notSubscribed}</Badge>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {departmentFilter === 'all' ? 'No active staff.' : `No staff in ${DEPARTMENT_OPTIONS.find((o) => o.value === departmentFilter)?.label}.`}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="rounded-none">Name</TableHead>
              <TableHead className="rounded-none">Position / Role</TableHead>
              <TableHead className="rounded-none">Subscription Status</TableHead>
              <TableHead className="rounded-none">Device Info</TableHead>
              <TableHead className="rounded-none w-[240px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.staffId}>
                <TableCell className="font-medium">{s.fullName}</TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {s.roles.length > 0 ? s.roles.join(', ') : '-'}
                </TableCell>
                <TableCell>
                  {s.isSubscribed ? (
                    <Badge variant="default" className="rounded-none bg-green-600">
                      Subscribed ({s.subscriptionCount})
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="rounded-none">
                      Not Subscribed
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="max-w-[180px] truncate text-xs text-muted-foreground" title={s.deviceInfo ?? undefined}>
                  {s.deviceInfo ?? '-'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-none text-xs h-7"
                      onClick={() =>
                        sendTestPush.mutate(s.staffId, {
                          onSuccess: () => toast.success(`Test push sent to ${s.fullName}`),
                          onError: () => toast.error('Failed to send test push'),
                        })
                      }
                      disabled={sendTestPush.isPending && sendTestPush.variables === s.staffId}
                    >
                      Send Test Push
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-none text-xs h-7"
                      onClick={() =>
                        sendInAppTest.mutate(s.staffId, {
                          onSuccess: () => toast.success(`In-app test sent to ${s.fullName}`),
                          onError: () => toast.error('Failed to send in-app test'),
                        })
                      }
                      disabled={sendInAppTest.isPending && sendInAppTest.variables === s.staffId}
                    >
                      Send In-App Test
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  MessageSquare,
  HelpCircle,
  Megaphone,
  Mail,
  Bug,
  Users,
  Clock,
  Sparkles,
  Package,
  UserCheck,
  UserX,
  AlertTriangle,
} from 'lucide-react';

interface AppEvent {
  type: string;
  label: string;
  description: string;
  route: string;
  icon: React.ReactNode;
  category: 'communication' | 'operations' | 'account' | 'member';
}

const APP_EVENTS: AppEvent[] = [
  {
    type: 'qa_answered',
    label: 'Q&A Answered',
    description: 'Fires when a manager answers a staff question in the inbox.',
    route: '/dashboard/inbox',
    icon: <MessageSquare className="h-4 w-4" />,
    category: 'communication',
  },
  {
    type: 'qa_new_question',
    label: 'New Question',
    description: 'Fires when a staff member submits a new question.',
    route: '/dashboard/inbox',
    icon: <HelpCircle className="h-4 w-4" />,
    category: 'communication',
  },
  {
    type: 'resource_outdated',
    label: 'Resource Flagged Outdated',
    description: 'Fires when a resource is flagged as outdated by staff.',
    route: '/dashboard/inbox',
    icon: <AlertTriangle className="h-4 w-4" />,
    category: 'communication',
  },
  {
    type: 'announcement',
    label: 'Announcement',
    description: 'Fires when a new announcement is published.',
    route: '/dashboard/communications',
    icon: <Megaphone className="h-4 w-4" />,
    category: 'communication',
  },
  {
    type: 'message',
    label: 'Direct Message',
    description: 'Fires when a staff member sends a direct message.',
    route: '/dashboard/messages',
    icon: <Mail className="h-4 w-4" />,
    category: 'communication',
  },
  {
    type: 'bug_report_update',
    label: 'Bug Report Update',
    description: 'Fires when a bug report status changes.',
    route: '/dashboard/bug-reports',
    icon: <Bug className="h-4 w-4" />,
    category: 'operations',
  },
  {
    type: 'member_alert',
    label: 'Member Alert',
    description: 'Fires on member-related alerts (e.g. cancel/pause requests).',
    route: '/dashboard/members/all-clients',
    icon: <Users className="h-4 w-4" />,
    category: 'member',
  },
  {
    type: 'mat_cleaning',
    label: 'Mat Cleaning',
    description: 'Automated reminder triggered by scheduled cron job.',
    route: '/dashboard/my-checklists',
    icon: <Clock className="h-4 w-4" />,
    category: 'operations',
  },
  {
    type: 'package_arrived',
    label: 'Package Arrived',
    description: 'Fires when a package is scanned/logged for a member.',
    route: '/dashboard/my-packages',
    icon: <Package className="h-4 w-4" />,
    category: 'operations',
  },
  {
    type: 'account_approval_pending',
    label: 'Account Approval Pending',
    description: 'Fires when a new staff account is awaiting approval. Auto-dismissed on status change.',
    route: '/dashboard/notifications',
    icon: <Sparkles className="h-4 w-4" />,
    category: 'account',
  },
  {
    type: 'account_approved',
    label: 'Account Approved',
    description: 'Fires when a staff account is approved by a manager.',
    route: '/dashboard/notifications',
    icon: <UserCheck className="h-4 w-4" />,
    category: 'account',
  },
  {
    type: 'account_rejected',
    label: 'Account Rejected',
    description: 'Fires when a staff account request is rejected.',
    route: '/dashboard/notifications',
    icon: <UserX className="h-4 w-4" />,
    category: 'account',
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  communication: 'Communication',
  operations: 'Operations',
  account: 'Account',
  member: 'Member',
};

const CATEGORY_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  communication: 'default',
  operations: 'secondary',
  account: 'outline',
  member: 'destructive',
};

export function AppEventsTab() {
  return (
    <Card className="rounded-md border shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs uppercase tracking-widest font-normal">
          Application-Triggered Events
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          These notifications fire automatically from code when specific actions occur. They do not require manual trigger configuration.
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[10px] uppercase tracking-wider">Event</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider">Category</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider hidden md:table-cell">Description</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider hidden lg:table-cell">Routes To</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {APP_EVENTS.map((event) => (
              <TableRow key={event.type}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{event.icon}</span>
                    <div>
                      <div className="text-sm font-medium">{event.label}</div>
                      <code className="text-[10px] text-muted-foreground">{event.type}</code>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={CATEGORY_VARIANTS[event.category]} className="rounded-none text-[10px]">
                    {CATEGORY_LABELS[event.category]}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground hidden md:table-cell max-w-xs">
                  {event.description}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <code className="text-[10px] bg-muted px-1.5 py-0.5">{event.route}</code>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

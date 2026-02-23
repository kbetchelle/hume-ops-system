import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { add_color } from '@/lib/constants';
import {
  NOTIFICATION_FORMAT,
  ROLE_NOTIFICATION_TYPES,
  ROLE_LABELS,
  getNotificationFormat,
  type AppRole,
} from '@/lib/notificationConfig';
import type { NotificationType } from '@/hooks/useNotifications';

const ALL_ROLES = Object.keys(ROLE_LABELS) as AppRole[];

/** Mock sample data for each notification type */
const SAMPLE_DATA: Record<NotificationType, { title: string; body: string }> = {
  qa_answered:              { title: 'Your question was answered',        body: 'Sarah replied to "How do I reset my password?"' },
  qa_new_question:          { title: 'New question posted',               body: 'John asked "What are the pool hours today?"' },
  announcement:             { title: 'Staff Meeting Tomorrow',            body: 'All staff meeting at 9:00 AM in the conference room.' },
  message:                  { title: 'New message from Maria',            body: 'Hey, can you cover my shift on Friday?' },
  bug_report_update:        { title: 'Bug #42 status changed',            body: 'Status changed from "open" to "in progress".' },
  member_alert:             { title: 'VIP Member arriving',               body: 'John Smith (Gold tier) has an appointment at 2 PM.' },
  class_turnover:           { title: 'Class ending: Hot Yoga',            body: 'Studio A needs turnover in 5 minutes.' },
  mat_cleaning:             { title: 'Mat cleaning needed',               body: 'Studio B mats need sanitization after Pilates.' },
  account_approval_pending: { title: 'New account pending approval',      body: 'carlos@example.com requested access as Trainer.' },
  account_approved:         { title: 'Account approved',                  body: 'Your account has been approved. Welcome!' },
  account_rejected:         { title: 'Account request denied',            body: 'Your account request was not approved.' },
  resource_outdated:        { title: 'Resource needs update',             body: '"Pool Safety Guidelines" was last updated 90 days ago.' },
  package_arrived:          { title: 'Package arrived for member',        body: 'Package for Emily Johnson at the front desk.' },
  room_turnover:            { title: 'Room turnover: Treatment Room 3',   body: 'Room needs to be prepared for next appointment.' },
  tour_alert:               { title: 'Tour scheduled',                    body: 'Prospective member arriving at 11:30 AM for a tour.' },
};

/* ── Notification item (inbox-style) ── */
function NotificationSample({ type }: { type: NotificationType }) {
  const fmt = getNotificationFormat(type);
  const sample = SAMPLE_DATA[type];
  const Icon = fmt.icon;

  return (
    <div className="flex items-start gap-3 p-3 border-b border-border">
      {/* Solid icon badge */}
      <div className={cn('p-1.5 shrink-0', fmt.solidBg, fmt.solidText)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium truncate">{sample.title}</p>
          {/* Solid label tag */}
          <span className={cn('text-[10px] px-1.5 py-0.5 uppercase tracking-widest', fmt.solidBg, fmt.solidText)}>
            {fmt.labelEn}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground truncate">{sample.body}</p>
        <p className="text-[10px] text-muted-foreground mt-1">Feb 23, 10:30 AM</p>
      </div>
      <div className="h-2 w-2 bg-add-red shrink-0 mt-1" />
    </div>
  );
}

/* ── Banner / toast style ── */
function BannerSample({ type, variant }: { type: NotificationType; variant: 'default' | 'urgent' }) {
  const fmt = getNotificationFormat(type);
  const sample = SAMPLE_DATA[type];
  const Icon = fmt.icon;

  if (variant === 'urgent') {
    return (
      <div className="flex items-center gap-3 p-3 border border-add-red/40 bg-add-red/10">
        <div className="p-1.5 bg-add-red shrink-0">
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">
            Urgent: {sample.title}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">{sample.body}</p>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 uppercase tracking-widest bg-add-red text-white shrink-0">
          Urgent
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-3 p-3 border', fmt.tintBorder, fmt.tintBg)}>
      <div className={cn('p-1.5 shrink-0', fmt.solidBg, fmt.solidText)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-xs font-medium truncate', fmt.tintText)}>{sample.title}</p>
        <p className="text-[10px] text-muted-foreground truncate">{sample.body}</p>
      </div>
      <span className={cn('text-[10px] px-1.5 py-0.5 uppercase tracking-widest shrink-0', fmt.solidBg, fmt.solidText)}>
        {fmt.labelEn}
      </span>
    </div>
  );
}

export default function NotificationExamplesPage() {
  return (
    <DashboardLayout title="Notification Examples">
      <div className="p-6 md:p-8 space-y-6">

        {/* ── Brand Color Palette ── */}
        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase tracking-widest font-normal">
              App Color Palette (add_color)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 gap-3">
              {Object.entries(add_color).map(([name, hex]) => (
                <div key={name} className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-full aspect-square border border-border"
                    style={{ backgroundColor: hex }}
                  />
                  <span className="text-[10px] uppercase tracking-widest font-medium">{name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{hex}</span>
                </div>
              ))}
            </div>
            {/* Token usage reference */}
            <div className="mt-4 border-t border-border pt-3">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                Tailwind Token Usage
              </p>
              <div className="grid grid-cols-3 gap-2">
                {Object.keys(add_color).map((name) => (
                  <div key={name} className="flex items-center gap-2">
                    <div className={`w-3 h-3 bg-add-${name}`} style={{ backgroundColor: add_color[name as keyof typeof add_color] }} />
                    <code className="text-[10px] text-muted-foreground">
                      bg-add-{name}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Color Legend (notification type mapping) ── */}
        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase tracking-widest font-normal">
              Notification Type → Color Mapping
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(NOTIFICATION_FORMAT).map(([type, fmt]) => {
                const Icon = fmt.icon;
                return (
                  <div key={type} className="flex items-center gap-1.5">
                    <div className={cn('p-1', fmt.solidBg, fmt.solidText)}>
                      <Icon className="h-3 w-3" />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{fmt.labelEn}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── Banner / Toast Styles ── */}
        <Card className="rounded-none overflow-hidden">
          <CardHeader className="pb-0">
            <CardTitle className="text-[10px] uppercase tracking-widest font-normal">
              Banner / Toast Styles
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 mt-2 space-y-0">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Default Banners</p>
            </div>
            <BannerSample type="announcement" variant="default" />
            <BannerSample type="message" variant="default" />
            <BannerSample type="class_turnover" variant="default" />
            <BannerSample type="member_alert" variant="default" />
            <BannerSample type="package_arrived" variant="default" />
            <BannerSample type="bug_report_update" variant="default" />
            <div className="px-3 py-2 border-b border-border">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Urgent Banner</p>
            </div>
            <BannerSample type="message" variant="urgent" />
            <BannerSample type="member_alert" variant="urgent" />
          </CardContent>
        </Card>

        {/* ── Per-role sections (inbox-style) ── */}
        {ALL_ROLES.map((role) => {
          const types = ROLE_NOTIFICATION_TYPES[role];
          const roleLabel = ROLE_LABELS[role];

          return (
            <Card key={role} className="rounded-none overflow-hidden">
              <CardHeader className="pb-0">
                <CardTitle className="text-[10px] uppercase tracking-widest font-normal flex items-center gap-2">
                  {roleLabel.en}
                  <span className="text-muted-foreground">
                    ({types.length} type{types.length !== 1 ? 's' : ''})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 mt-2">
                {types.map((type) => (
                  <NotificationSample key={type} type={type} />
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
}

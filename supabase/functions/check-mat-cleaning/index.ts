/**
 * check-mat-cleaning: Cron edge function that checks if any class end times
 * (or tour times) fall within notification windows and sends push notifications
 * via the push-notifications function.
 *
 * Invoke with POST (e.g. from pg_cron every 2 minutes). Uses service role.
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

const TIMEZONE = 'America/Los_Angeles';

function getTodayLA(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE });
}

/** Match class name to category using LIKE-style patterns */
function matchCategory(className: string, mappings: { class_name_pattern: string; class_category: string }[]): string {
  const name = (className || '').trim();
  for (const m of mappings) {
    const pattern = m.class_name_pattern.replace(/%/g, '.*').replace(/_/g, '.');
    const re = new RegExp('^' + pattern + '$', 'i');
    if (re.test(name)) return m.class_category;
  }
  return 'standard';
}

/** Resolve target_department to list of auth user IDs (for push) */
async function resolveStaffIds(
  supabase: any,
  targetDepartment: string
): Promise<string[]> {
  const roleMap: Record<string, string[]> = {
    concierge: ['concierge'],
    floater: ['floater'],
    cafe: ['cafe'],
    all_foh: ['concierge', 'floater', 'cafe'],
    all_boh: ['trainer', 'female_spa_attendant', 'male_spa_attendant'],
  };
  const roles = roleMap[targetDepartment] ?? ['concierge'];
  const { data: rows, error } = await supabase
    .from('user_roles')
    .select('user_id')
    .in('role', roles);
  if (error) {
    console.error('[check-mat-cleaning] user_roles query error:', error);
    return [];
  }
  const ids: string[] = [...new Set((rows || []).map((r: { user_id: string }) => r.user_id))];
  return ids;
}

/** Call push-notifications send-notification */
async function sendPush(
  supabaseUrl: string,
  serviceKey: string,
  payload: {
    staffIds: string[];
    title: string;
    body?: string;
    triggerSource: string;
    filterByWorking: boolean;
    type?: string;
  }
): Promise<{ ok: boolean; skipped?: boolean; sent?: number }> {
  const res = await fetch(`${supabaseUrl}/functions/v1/push-notifications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      action: 'send-notification',
      ...payload,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('[check-mat-cleaning] push-notifications error:', res.status, data);
    return { ok: false };
  }
  return {
    ok: true,
    skipped: data.skipped === true,
    sent: data.sent,
  };
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  const corsHeaders = getCorsHeaders(req);
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const today = getTodayLA();
  const now = new Date();
  const summary: { fired: string[]; skipped: string[]; errors: string[] } = { fired: [], skipped: [], errors: [] };

  try {
    const { data: triggers, error: triggersError } = await supabase
      .from('notification_triggers')
      .select('*')
      .eq('is_active', true);

    if (triggersError) {
      console.error('[check-mat-cleaning] triggers query error:', triggersError);
      return new Response(
        JSON.stringify({ success: false, error: triggersError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const triggerList = (triggers || []) as Array<{
      id: string;
      event_type: string;
      target_department: string;
      message: string;
      timing_window_minutes: number;
      filter_by_working: boolean;
    }>;

    const { data: mappings, error: mappingsError } = await supabase
      .from('class_type_mappings')
      .select('class_name_pattern, class_category');

    if (mappingsError) {
      console.error('[check-mat-cleaning] class_type_mappings error:', mappingsError);
      return new Response(
        JSON.stringify({ success: false, error: mappingsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const mappingList = (mappings || []) as Array<{ class_name_pattern: string; class_category: string }>;

    // Today's classes: prefer daily_schedule (has end_time), fallback arketa_classes
    let classesToday: Array<{ id: string; name: string; end_time: string; category: string }> = [];

    const { data: dailyRows } = await supabase
      .from('daily_schedule')
      .select('id, class_id, class_name, end_time')
      .eq('schedule_date', today)
      .not('end_time', 'is', null);

    if (dailyRows && dailyRows.length > 0) {
      classesToday = (dailyRows as Array<{ id: string; class_id: string | null; class_name: string | null; end_time: string }>)
        .filter((r) => r.end_time)
        .map((r) => ({
          id: r.id,
          name: r.class_name ?? '',
          end_time: r.end_time!,
          category: matchCategory(r.class_name ?? '', mappingList),
        }));
    } else {
      const { data: arketaRows } = await supabase
        .from('arketa_classes')
        .select('id, name, start_time, duration_minutes')
        .eq('class_date', today);

      if (arketaRows && arketaRows.length > 0) {
        classesToday = (arketaRows as Array<{ id: string; name: string; start_time: string; duration_minutes: number | null }>).map((c) => {
          const start = new Date(c.start_time).getTime();
          const dur = c.duration_minutes ?? 60;
          const endTime = new Date(start + dur * 60 * 1000).toISOString();
          return {
            id: c.id,
            name: c.name,
            end_time: endTime,
            category: matchCategory(c.name, mappingList),
          };
        });
      }
    }

    const windowMinutes = (mins: number) => mins * 60 * 1000;

    for (const trigger of triggerList) {
      const eventType = trigger.event_type;
      const window = trigger.timing_window_minutes ?? 5;

      if (eventType === 'class_end_heated_room' || eventType === 'class_end_high_roof') {
        const category = eventType === 'class_end_heated_room' ? 'heated_room' : 'high_roof';
        const relevant = classesToday.filter((c) => c.category === category);
        for (const cls of relevant) {
          const endTime = new Date(cls.end_time).getTime();
          const diffMinutes = (now.getTime() - endTime) / (60 * 1000);
          if (diffMinutes >= -window && diffMinutes <= window) {
            const staffIds = await resolveStaffIds(supabase, trigger.target_department);
            if (staffIds.length === 0) {
              summary.errors.push(`${eventType}-${cls.id}: no staff for ${trigger.target_department}`);
              continue;
            }
            const triggerSource = `${eventType}-${cls.id}-${today}`;
            const result = await sendPush(supabaseUrl, serviceKey, {
              staffIds,
              title: trigger.message,
              body: cls.name,
              triggerSource,
              filterByWorking: trigger.filter_by_working ?? true,
              type: eventType,
            });
            if (result.skipped) summary.skipped.push(triggerSource);
            else if (result.ok) summary.fired.push(triggerSource);
          }
        }
      } else if (eventType === 'room_turnover') {
        const relevant = classesToday.filter((c) => c.category === 'heated_room');
        for (const cls of relevant) {
          const endTime = new Date(cls.end_time).getTime();
          const fiveMinBefore = endTime - windowMinutes(5);
          const nowMs = now.getTime();
          if (nowMs >= fiveMinBefore - windowMinutes(window) && nowMs <= fiveMinBefore + windowMinutes(window)) {
            const staffIds = await resolveStaffIds(supabase, trigger.target_department);
            if (staffIds.length === 0) {
              summary.errors.push(`room_turnover-${cls.id}: no staff`);
              continue;
            }
            const triggerSource = `room_turnover-${cls.id}-${today}`;
            const result = await sendPush(supabaseUrl, serviceKey, {
              staffIds,
              title: trigger.message,
              body: cls.name,
              triggerSource,
              filterByWorking: trigger.filter_by_working ?? true,
              type: 'room_turnover',
            });
            if (result.skipped) summary.skipped.push(triggerSource);
            else if (result.ok) summary.fired.push(triggerSource);
          }
        }
      } else if (eventType === 'tour_alert') {
        // Use trigger's timing_window_minutes as "minutes before tour start" (e.g. 30 = alert 30 min before)
        const minutesBeforeTour = window;
        const { data: tours } = await supabase
          .from('scheduled_tours')
          .select('id, start_time, guest_name')
          .eq('tour_date', today)
          .eq('status', 'active');

        // Firing tolerance: 2 min so cron (every 2 min) fires once near the alert time
        const tourFiringToleranceMs = 2 * 60 * 1000;
        for (const tour of (tours || []) as Array<{ id: string; start_time: string; guest_name: string | null }>) {
          const tourStart = new Date(tour.start_time).getTime();
          const alertTime = tourStart - minutesBeforeTour * 60 * 1000;
          const nowMs = now.getTime();
          if (nowMs >= alertTime - tourFiringToleranceMs && nowMs <= alertTime + tourFiringToleranceMs) {
            const staffIds = await resolveStaffIds(supabase, trigger.target_department);
            if (staffIds.length === 0) continue;
            const triggerSource = `tour_alert-${tour.id}-${today}`;
            const result = await sendPush(supabaseUrl, serviceKey, {
              staffIds,
              title: trigger.message,
              body: tour.guest_name ? `Guest: ${tour.guest_name}` : undefined,
              triggerSource,
              filterByWorking: trigger.filter_by_working ?? true,
              type: 'tour_alert',
            });
            if (result.skipped) summary.skipped.push(triggerSource);
            else if (result.ok) summary.fired.push(triggerSource);
          }
        }
      }
    }

    console.log('[check-mat-cleaning] summary', summary);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          fired: summary.fired.length,
          skipped: summary.skipped.length,
          errors: summary.errors.length,
          detail: summary,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[check-mat-cleaning] error:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

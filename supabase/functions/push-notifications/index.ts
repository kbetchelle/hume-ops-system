import { createClient } from 'npm:@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import {
  createUnauthorizedResponse,
  createErrorResponse,
  createSuccessResponse,
} from '../_shared/auth.ts';

// Use web-push via esm.sh for Deno compatibility (Node crypto in npm:web-push can fail in Deno)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let webpushLib: any = null;
try {
  const mod = await import('https://esm.sh/web-push@3.6.7');
  webpushLib = mod?.default ?? mod;
} catch {
  // fallback: will fail at send with clear error
}

async function getAuthUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
}

/** Today's date in America/Los_Angeles as YYYY-MM-DD */
function getTodayLA(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
}

/** Yesterday's date in America/Los_Angeles as YYYY-MM-DD (for overnight shifts) */
function getYesterdayLA(): string {
  const todayLA = getTodayLA();
  const d = new Date(todayLA + 'T12:00:00.000Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split('T')[0];
}

/** Broadcast to Realtime channel in-app-notifications */
async function broadcastInApp(
  supabaseUrl: string,
  supabaseKey: string,
  payload: { title: string; body?: string; data?: object; type?: string; targetStaffIds: string[] }
): Promise<void> {
  const url = `${supabaseUrl}/realtime/v1/api/broadcast`;
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseKey,
    },
    body: JSON.stringify({
      messages: [
        {
          topic: 'in-app-notifications',
          event: 'notification',
          payload,
        },
      ],
    }),
  });
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', corsHeaders, 405);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return createErrorResponse('Invalid JSON body', corsHeaders, 400);
  }

  const action = body.action as string | undefined;
  if (!action) {
    return createErrorResponse('Missing action', corsHeaders, 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  switch (action) {
    case 'get-vapid-key': {
      const publicKey = Deno.env.get('VAPID_PUBLIC_KEY');
      if (!publicKey) {
        return createErrorResponse('VAPID_PUBLIC_KEY not configured', corsHeaders, 400);
      }
      return createSuccessResponse({ publicKey }, corsHeaders);
    }

    case 'subscribe': {
      const userId = await getAuthUserId(req);
      if (!userId) {
        return createUnauthorizedResponse('Authentication required', corsHeaders);
      }
      const staffId = body.staffId as string | undefined;
      const subscription = body.subscription as { endpoint?: string; keys?: { p256dh?: string; auth?: string } } | undefined;
      if (!staffId || !subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
        return createErrorResponse('Missing staffId or subscription (endpoint, keys.p256dh, keys.auth)', corsHeaders, 400);
      }
      if (staffId !== userId) {
        return createErrorResponse('staffId must match authenticated user', corsHeaders, 403);
      }
      const deviceInfo = (body.deviceInfo as string) ?? null;
      const { error } = await supabase
        .from('staff_push_subscriptions')
        .upsert(
          {
            staff_id: staffId,
            endpoint: subscription.endpoint,
            p256dh_key: subscription.keys.p256dh,
            auth_key: subscription.keys.auth,
            device_info: deviceInfo,
          },
          { onConflict: 'staff_id,endpoint' }
        );
      if (error) {
        console.error('[push-notifications] subscribe error:', error);
        return createErrorResponse(error.message, corsHeaders, 500);
      }
      return createSuccessResponse({ ok: true }, corsHeaders);
    }

    case 'unsubscribe': {
      const userId = await getAuthUserId(req);
      if (!userId) {
        return createUnauthorizedResponse('Authentication required', corsHeaders);
      }
      const endpoint = body.endpoint as string | undefined;
      if (!endpoint) {
        return createErrorResponse('Missing endpoint', corsHeaders, 400);
      }
      const { error } = await supabase
        .from('staff_push_subscriptions')
        .delete()
        .eq('staff_id', userId)
        .eq('endpoint', endpoint);
      if (error) {
        console.error('[push-notifications] unsubscribe error:', error);
        return createErrorResponse(error.message, corsHeaders, 500);
      }
      return createSuccessResponse({ ok: true }, corsHeaders);
    }

    case 'send-notification': {
      const authHeader = req.headers.get('Authorization');
      const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : '';
      const isServiceRole = !!supabaseServiceKey && bearerToken === supabaseServiceKey;
      const userId = isServiceRole ? null : await getAuthUserId(req);
      if (!userId && !isServiceRole) {
        return createUnauthorizedResponse('Authentication required', corsHeaders);
      }

      const staffIds = body.staffIds as string[] | undefined;
      const title = body.title as string | undefined;
      const bodyText = body.body as string | undefined;
      const data = (body.data as object) ?? {};
      const triggerSource = body.triggerSource as string | undefined;
      const filterByWorking = body.filterByWorking === true;
      const type = body.type as string | undefined;

      if (!staffIds || !Array.isArray(staffIds) || staffIds.length === 0) {
        return createErrorResponse('staffIds array required', corsHeaders, 400);
      }
      if (!title) {
        return createErrorResponse('title required', corsHeaders, 400);
      }

      // (a) Deduplication
      if (triggerSource) {
        const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { data: existing } = await supabase
          .from('notification_history')
          .select('id')
          .eq('trigger_source', triggerSource)
          .gte('sent_at', since)
          .limit(1);
        if (existing && existing.length > 0) {
          return createSuccessResponse({ skipped: true, reason: 'dedupe' }, corsHeaders);
        }
      }

      // (b) Working staff filter (all comparisons use UTC for timestamptz columns)
      let targetStaffIds = [...staffIds];
      if (filterByWorking) {
        const todayLA = getTodayLA();
        const yesterdayLA = getYesterdayLA();
        const nowUtc = new Date().toISOString();
        const { data: shiftsToday, error: errToday } = await supabase
          .from('staff_shifts')
          .select('sling_user_id')
          .eq('shift_date', todayLA)
          .lte('shift_start', nowUtc)
          .gte('shift_end', nowUtc);
        if (errToday) {
          console.error('[push-notifications] staff_shifts query error:', errToday);
          return createErrorResponse(errToday.message, corsHeaders, 500);
        }
        const { data: shiftsYesterday, error: errYesterday } = await supabase
          .from('staff_shifts')
          .select('sling_user_id')
          .eq('shift_date', yesterdayLA)
          .lte('shift_start', nowUtc)
          .gte('shift_end', nowUtc);
        if (errYesterday) {
          console.error('[push-notifications] staff_shifts (yesterday) query error:', errYesterday);
          return createErrorResponse(errYesterday.message, corsHeaders, 500);
        }
        const shifts = [...(shiftsToday || []), ...(shiftsYesterday || [])];
        const slingUserIds = [...new Set(shifts.map((s: { sling_user_id: number }) => s.sling_user_id).filter(Boolean))];
        if (slingUserIds.length === 0) {
          return createSuccessResponse({ sent: 0, reason: 'no one on shift' }, corsHeaders);
        }
        const { data: slingUsers } = await supabase
          .from('sling_users')
          .select('id')
          .in('sling_user_id', slingUserIds);
        const slingUuids = (slingUsers || []).map((s: { id: string }) => s.id);
        if (slingUuids.length === 0) {
          return createSuccessResponse({ sent: 0, reason: 'no profiles linked to shift staff' }, corsHeaders);
        }
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id')
          .in('sling_id', slingUuids);
        const authIdsOnShift = new Set((profiles || []).map((p: { user_id: string }) => p.user_id));
        targetStaffIds = staffIds.filter((id) => authIdsOnShift.has(id));
        if (targetStaffIds.length === 0) {
          return createSuccessResponse({ sent: 0, reason: 'no target on shift' }, corsHeaders);
        }
      }

      // (c) Subscription lookup
      const { data: subscriptions, error: subError } = await supabase
        .from('staff_push_subscriptions')
        .select('id, staff_id, endpoint, p256dh_key, auth_key')
        .in('staff_id', targetStaffIds);
      if (subError) {
        console.error('[push-notifications] subscriptions query error:', subError);
        return createErrorResponse(subError.message, corsHeaders, 500);
      }
      const subs = subscriptions || [];

      // (d) Send via web-push; (e) log; (f) collect 404/410
      const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');
      const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
      const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:support@example.com';
      if (!webpushLib || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        return createErrorResponse('Web push or VAPID keys not configured', corsHeaders, 500);
      }
      webpushLib.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

      const payloadJson = JSON.stringify({ title, body: bodyText, data, type });
      const endpointsToRemove: string[] = [];
      let historyInsertFailures = 0;

      for (const sub of subs) {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh_key, auth: sub.auth_key },
        };
        let success = true;
        let errorMessage: string | null = null;
        try {
          const res = await webpushLib.sendNotification(pushSubscription, payloadJson);
          const code = res?.statusCode ?? res?.status;
          if (code === 404 || code === 410) {
            endpointsToRemove.push(sub.endpoint);
          }
        } catch (err) {
          success = false;
          errorMessage = err instanceof Error ? err.message : String(err);
          const status = (err as { statusCode?: number })?.statusCode;
          if (status === 404 || status === 410) {
            endpointsToRemove.push(sub.endpoint);
          }
        }
        const { error: insertError } = await supabase.from('notification_history').insert({
          staff_id: sub.staff_id,
          title,
          body: bodyText ?? null,
          type: type ?? null,
          success,
          error_message: errorMessage,
          trigger_source: triggerSource ?? null,
        });
        if (insertError) {
          historyInsertFailures += 1;
          console.error('[push-notifications] notification_history insert error:', insertError.message, 'staff_id:', sub.staff_id);
        }
      }

      if (endpointsToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('staff_push_subscriptions')
          .delete()
          .in('endpoint', endpointsToRemove);
        if (deleteError) {
          console.error('[push-notifications] staff_push_subscriptions delete error:', deleteError.message, 'endpoints:', endpointsToRemove.length);
        }
      }

      // (g) In-app broadcast
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || supabaseServiceKey;
      await broadcastInApp(supabaseUrl, anonKey, {
        title,
        body: bodyText,
        data,
        type,
        targetStaffIds,
      });

      return createSuccessResponse(
        { sent: subs.length, targetStaffIds, historyInsertFailures },
        corsHeaders
      );
    }

    case 'test-in-app-only': {
      const staffIds = body.staffIds as string[] | undefined;
      const title = body.title as string | undefined;
      const bodyText = body.body as string | undefined;
      if (!staffIds || !Array.isArray(staffIds) || !title) {
        return createErrorResponse('staffIds and title required', corsHeaders, 400);
      }
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || supabaseServiceKey;
      await broadcastInApp(supabaseUrl, anonKey, {
        title,
        body: bodyText,
        targetStaffIds: staffIds,
      });
      return createSuccessResponse({ ok: true }, corsHeaders);
    }

    default:
      return createErrorResponse(`Unknown action: ${action}`, corsHeaders, 400);
  }
});

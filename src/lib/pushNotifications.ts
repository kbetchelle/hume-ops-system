import { supabase } from '@/integrations/supabase/client';

/**
 * Converts a base64url-encoded string to a Uint8Array (e.g. for VAPID applicationServerKey).
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    out[i] = raw.charCodeAt(i);
  }
  return out;
}

/**
 * Subscribe the current device to push notifications for the given staff user.
 * Requests notification permission, gets VAPID key, subscribes via the service worker, then saves the subscription server-side.
 * @returns true if subscription succeeded, false if push unsupported, permission denied, or an error occurred.
 */
export async function subscribeToPush(staffId: string): Promise<boolean> {
  if (!('PushManager' in window)) {
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return false;
  }

  const sw = await navigator.serviceWorker.ready;

  const { data: vapidData, error: vapidError } = await supabase.functions.invoke('push-notifications', {
    body: { action: 'get-vapid-key' },
  });
  if (vapidError || !vapidData?.publicKey) {
    return false;
  }

  const applicationServerKey = urlBase64ToUint8Array(vapidData.publicKey);
  let subscription: PushSubscription;
  try {
    subscription = await (sw as any).pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });
  } catch {
    return false;
  }

  const subscriptionJson = subscription.toJSON();
  const payload = {
    endpoint: subscriptionJson.endpoint,
    keys: subscriptionJson.keys,
  };

  const { error: subscribeError } = await supabase.functions.invoke('push-notifications', {
    body: {
      action: 'subscribe',
      staffId,
      subscription: payload,
      deviceInfo: navigator.userAgent,
    },
  });
  if (subscribeError) {
    return false;
  }

  return true;
}

/**
 * Unsubscribe the current device from push notifications.
 * Removes the server-side subscription first, then the local subscription, so a failed server call does not leave client and DB out of sync.
 */
export async function unsubscribeFromPush(): Promise<void> {
  const sw = await navigator.serviceWorker.ready;
  const sub = await (sw as any).pushManager.getSubscription();
  if (!sub) {
    return;
  }
  const endpoint = sub.endpoint;
  const { error } = await supabase.functions.invoke('push-notifications', {
    body: { action: 'unsubscribe', endpoint },
  });
  if (error) {
    throw error;
  }
  await sub.unsubscribe();
}

/**
 * Check whether the current device has an active push subscription.
 * Uses a 3-second timeout to avoid hanging if the service worker is slow.
 */
export async function isSubscribedToPush(): Promise<boolean> {
  if (!('PushManager' in window)) {
    return false;
  }

  const getSub = (): Promise<PushSubscription | null> =>
    navigator.serviceWorker.ready.then((reg) => (reg as any).pushManager.getSubscription());

  const timeout = new Promise<null>((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), 3000)
  );

  try {
    const sub = await Promise.race([getSub(), timeout]);
    return sub != null;
  } catch {
    return false;
  }
}

/**
 * Ask the server to send a test push notification to the given staff user.
 */
export async function sendTestNotification(staffId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('push-notifications', {
    body: {
      action: 'send-notification',
      staffIds: [staffId],
      title: 'Test Notification',
      body: 'Push notifications are working!',
      type: 'test',
    },
  });
  if (error) {
    throw error;
  }
}

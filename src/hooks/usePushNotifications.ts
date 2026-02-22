import { useState, useEffect, useCallback, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { subscribeToPush, isSubscribedToPush } from "@/lib/pushNotifications";
import type { AppRole } from "@/types/roles";

const PROMPT_DELAY_MS = 2 * 60 * 1000; // 2 minutes
const PROMPT_ASKED_KEY = "hume_push_prompt_asked";

export interface UsePushNotificationsOptions {
  userId: string | undefined;
  activeRole: AppRole | null;
}

export interface UsePushNotificationsResult {
  showPrompt: boolean;
  dismissPrompt: () => void;
  enablePush: () => Promise<void>;
  isSubscribed: boolean | null;
}

export function usePushNotifications({
  userId,
  activeRole,
}: UsePushNotificationsOptions): UsePushNotificationsResult {
  const isMobile = useIsMobile();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isMobile || !userId) return;

    let cancelled = false;

    const check = async () => {
      const asked = localStorage.getItem(PROMPT_ASKED_KEY) === "true";
      if (asked) return;

      const sub = await isSubscribedToPush();
      if (cancelled) return;
      setIsSubscribed(sub);
      if (sub) return;

      const t = setTimeout(() => {
        if (cancelled) return;
        setShowPrompt(true);
      }, PROMPT_DELAY_MS);
      timerRef.current = t;
    };

    check();
    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isMobile, userId]);

  const dismissPrompt = useCallback(() => {
    localStorage.setItem(PROMPT_ASKED_KEY, "true");
    setShowPrompt(false);
  }, []);

  const enablePush = useCallback(async () => {
    if (!userId) return;
    const deviceInfo = JSON.stringify({
      platform: navigator.userAgent,
      role: activeRole ?? "concierge",
    });
    localStorage.setItem(PROMPT_ASKED_KEY, "true");
    setShowPrompt(false);
    const ok = await subscribeToPush({ staffId: userId, deviceInfo });
    if (ok) {
      setIsSubscribed(true);
    }
  }, [userId, activeRole]);

  return {
    showPrompt,
    dismissPrompt,
    enablePush,
    isSubscribed,
  };
}

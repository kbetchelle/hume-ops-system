import { useState, useEffect, useCallback } from "react";
import { getOfflineQueueCount } from "./useOfflineQueue";

const RECONNECT_BANNER_MS = 3000;
const PENDING_COUNT_POLL_MS = 15000;

export interface ConnectivityStatus {
  isOnline: boolean;
  wasOffline: boolean;
  pendingChangesCount: number;
  lastOnline: Date | null;
}

export function useConnectivityStatus(): ConnectivityStatus {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);
  const [lastOnline, setLastOnline] = useState<Date | null>(() =>
    typeof navigator !== "undefined" && navigator.onLine ? new Date() : null
  );
  const [pendingChangesCount, setPendingChangesCount] = useState(0);

  const refreshPendingCount = useCallback(() => {
    getOfflineQueueCount().then(setPendingChangesCount);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnline(new Date());
      setWasOffline(true);
      refreshPendingCount();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (navigator.onLine) {
      refreshPendingCount();
    }

    const pollInterval = setInterval(() => {
      if (navigator.onLine) {
        refreshPendingCount();
      }
    }, PENDING_COUNT_POLL_MS);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(pollInterval);
    };
  }, [refreshPendingCount]);

  useEffect(() => {
    if (!wasOffline) return;
    const t = setTimeout(() => setWasOffline(false), RECONNECT_BANNER_MS);
    return () => clearTimeout(t);
  }, [wasOffline]);

  return {
    isOnline,
    wasOffline,
    pendingChangesCount,
    lastOnline,
  };
}

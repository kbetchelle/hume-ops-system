import type { QueryClient } from "@tanstack/react-query";

const FIVE_MIN = 5 * 60 * 1000;
const THIRTY_MIN = 30 * 60 * 1000;

/**
 * Apply mobile-friendly React Query defaults: longer stale/gc time,
 * no refetch on window focus, single retry, offline-first.
 * Call once when initializing the app if the device is mobile.
 */
export function applyMobileQueryDefaults(queryClient: QueryClient): void {
  queryClient.setDefaultOptions({
    queries: {
      staleTime: FIVE_MIN,
      gcTime: THIRTY_MIN,
      refetchOnWindowFocus: false,
      retry: 1,
      networkMode: "offline",
    },
    mutations: {
      networkMode: "offline",
      retry: 1,
    },
  });
}

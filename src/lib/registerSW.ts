/**
 * Service Worker Registration Utility
 * 
 * Registers the service worker for PWA functionality:
 * - Offline caching
 * - Background sync
 * - Push notifications (future)
 */

import { createLogger } from "./logger";

const swLogger = createLogger("[SW]");

export interface SWRegistrationOptions {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onOfflineReady?: () => void;
}

let swRegistration: ServiceWorkerRegistration | null = null;

export async function registerServiceWorker(
  options: SWRegistrationOptions = {}
): Promise<ServiceWorkerRegistration | null> {
  const { onUpdate, onSuccess, onOfflineReady } = options;

  if (!('serviceWorker' in navigator)) {
    swLogger.log('Service workers are not supported');
    return null;
  }

  // Only register in production or when explicitly enabled
  if (import.meta.env.DEV && !import.meta.env.VITE_ENABLE_SW) {
    swLogger.log('Service worker disabled in development');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    swRegistration = registration;
    swLogger.log('Service worker registered:', registration.scope);

    // Check if there's an update available
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New update available
            swLogger.log('New content available, refresh to update');
            onUpdate?.(registration);
          } else {
            // Content cached for offline use
            swLogger.log('Content cached for offline use');
            onSuccess?.(registration);
            onOfflineReady?.();
          }
        }
      });
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SYNC_PENDING_UPLOADS') {
        // Dispatch custom event for the app to handle
        window.dispatchEvent(new CustomEvent('sw-sync-uploads'));
      }
    });

    return registration;
  } catch (error) {
    swLogger.error('Service worker registration failed:', error);
    return null;
  }
}

export function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return Promise.resolve(false);
  }

  return navigator.serviceWorker.ready.then((registration) => {
    return registration.unregister();
  });
}

export function getServiceWorkerRegistration(): ServiceWorkerRegistration | null {
  return swRegistration;
}

export function requestSync(tag: string = 'upload-pending'): Promise<void> {
  if (!swRegistration || !('sync' in swRegistration)) {
    swLogger.log('Background sync not supported');
    return Promise.resolve();
  }

  // @ts-expect-error - sync is not in TypeScript ServiceWorkerRegistration definitions
  return swRegistration.sync.register(tag);
}

export function skipWaiting(): void {
  if (swRegistration?.waiting) {
    swRegistration.waiting.postMessage('skipWaiting');
  }
}

export function clearServiceWorkerCache(): void {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage('clearCache');
  }
}

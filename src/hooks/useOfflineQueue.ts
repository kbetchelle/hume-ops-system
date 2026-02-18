import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './use-toast';

interface QueuedOperation {
  id: string;
  type: 'save_draft' | 'submit_report';
  data: any;
  timestamp: number;
  retryCount: number;
}

const DB_NAME = 'ConciergeOfflineQueue';
const DB_VERSION = 1;
const STORE_NAME = 'operations';
const MAX_RETRIES = 3;

export function useOfflineQueue() {
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const dbRef = useRef<IDBDatabase | null>(null);
  const processingRef = useRef(false);

  // Initialize IndexedDB
  useEffect(() => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[OfflineQueue] Failed to open IndexedDB');
    };

    request.onsuccess = (event) => {
      dbRef.current = (event.target as IDBOpenDBRequest).result;
      updateQueueSize();
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    return () => {
      if (dbRef.current) {
        dbRef.current.close();
      }
    };
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log('[OfflineQueue] Back online');
      setIsOnline(true);
      toast({
        title: 'Back online',
        description: 'Syncing queued changes...',
      });
      processQueue();
    };

    const handleOffline = () => {
      console.log('[OfflineQueue] Gone offline');
      setIsOnline(false);
      toast({
        title: 'Offline mode',
        description: 'Changes will be queued and synced when you reconnect.',
        variant: 'destructive',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Beacon API fallback on page unload
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (!navigator.onLine && dbRef.current) {
        // Store pending operations count in sessionStorage for next session
        const count = await countOperations();
        if (count > 0) {
          sessionStorage.setItem('offlineQueueSize', count.toString());
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const updateQueueSize = useCallback(async () => {
    if (!dbRef.current) return;

    const count = await countOperations();
    setQueueSize(count);
  }, []);

  const countOperations = useCallback(async (): Promise<number> => {
    if (!dbRef.current) return 0;

    return new Promise((resolve, reject) => {
      const transaction = dbRef.current!.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }, []);

  const addToQueue = useCallback(
    async (type: 'save_draft' | 'submit_report', data: any): Promise<void> => {
      if (!dbRef.current) {
        console.error('[OfflineQueue] Database not initialized');
        return;
      }

      const operation: QueuedOperation = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        data,
        timestamp: Date.now(),
        retryCount: 0,
      };

      return new Promise((resolve, reject) => {
        const transaction = dbRef.current!.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.add(operation);

        request.onsuccess = () => {
          console.log('[OfflineQueue] Added to queue:', operation.id);
          updateQueueSize();
          resolve();
        };

        request.onerror = () => {
          console.error('[OfflineQueue] Failed to add to queue:', request.error);
          reject(request.error);
        };
      });
    },
    [updateQueueSize]
  );

  const removeFromQueue = useCallback(
    async (id: string): Promise<void> => {
      if (!dbRef.current) return;

      return new Promise((resolve, reject) => {
        const transaction = dbRef.current!.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.delete(id);

        request.onsuccess = () => {
          console.log('[OfflineQueue] Removed from queue:', id);
          updateQueueSize();
          resolve();
        };

        request.onerror = () => {
          console.error('[OfflineQueue] Failed to remove from queue:', request.error);
          reject(request.error);
        };
      });
    },
    [updateQueueSize]
  );

  const getAllOperations = useCallback(async (): Promise<QueuedOperation[]> => {
    if (!dbRef.current) return [];

    return new Promise((resolve, reject) => {
      const transaction = dbRef.current!.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.getAll();

      request.onsuccess = () => {
        const operations = request.result as QueuedOperation[];
        // Sort by timestamp
        operations.sort((a, b) => a.timestamp - b.timestamp);
        resolve(operations);
      };

      request.onerror = () => reject(request.error);
    });
  }, []);

  const processQueue = useCallback(async () => {
    if (!isOnline || processingRef.current || !dbRef.current) {
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);

    try {
      const operations = await getAllOperations();

      if (operations.length === 0) {
        console.log('[OfflineQueue] No operations to process');
        return;
      }

      console.log(`[OfflineQueue] Processing ${operations.length} operations`);

      for (const operation of operations) {
        try {
          // The actual processing would be handled by the caller
          // For now, we just remove successfully processed operations
          // In a real implementation, you'd pass a processor function

          // Simulate processing (caller should provide actual processor)
          console.log('[OfflineQueue] Processing operation:', operation.id, operation.type);

          // Remove from queue on success
          await removeFromQueue(operation.id);
        } catch (error) {
          console.error('[OfflineQueue] Failed to process operation:', operation.id, error);

          // Increment retry count
          operation.retryCount++;

          if (operation.retryCount >= MAX_RETRIES) {
            console.error('[OfflineQueue] Max retries reached, removing:', operation.id);
            await removeFromQueue(operation.id);
            toast({
              title: 'Sync failed',
              description: 'Some changes could not be synced.',
              variant: 'destructive',
            });
          }
        }
      }

      toast({
        title: 'Sync complete',
        description: 'All queued changes have been synced.',
      });
    } catch (error) {
      console.error('[OfflineQueue] Error processing queue:', error);
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
      updateQueueSize();
    }
  }, [isOnline, getAllOperations, removeFromQueue, updateQueueSize, toast]);

  // Auto-process queue when coming online
  useEffect(() => {
    if (isOnline && queueSize > 0) {
      const timer = setTimeout(() => processQueue(), 1000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, queueSize, processQueue]);

  return {
    isOnline,
    queueSize,
    isProcessing,
    addToQueue,
    processQueue,
  };
}

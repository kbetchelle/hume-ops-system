import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  getPendingUploads,
  savePendingUpload,
  deletePendingUpload,
  incrementRetryCount,
  getPendingUploadCount,
  PendingUpload,
} from '@/lib/offlineDb';

const MAX_RETRY_COUNT = 3;
const SYNC_INTERVAL_MS = 30000; // 30 seconds

interface UseOfflineQueueOptions {
  autoSync?: boolean;
  syncIntervalMs?: number;
}

interface QueuedUpload {
  type: 'photo' | 'signature';
  dataUrl: string;
  storageBucket: string;
  storagePath: string;
  filename: string;
  mimeType: string;
  itemId?: string;
  templateId?: string;
}

export function useOfflineQueue(options: UseOfflineQueueOptions = {}) {
  const { autoSync = true, syncIntervalMs = SYNC_INTERVAL_MS } = options;
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncErrors, setSyncErrors] = useState<string[]>([]);
  
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update queue size
  const refreshQueueSize = useCallback(async () => {
    try {
      const count = await getPendingUploadCount();
      setQueueSize(count);
    } catch (error) {
      console.error('Failed to get queue size:', error);
    }
  }, []);

  // Add item to offline queue
  const addToQueue = useCallback(async (upload: QueuedUpload): Promise<string> => {
    const id = await savePendingUpload(upload);
    await refreshQueueSize();
    return id;
  }, [refreshQueueSize]);

  // Convert base64 data URL to Blob
  const dataUrlToBlob = useCallback((dataUrl: string): Blob => {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }, []);

  // Upload a single pending item
  const uploadPendingItem = useCallback(async (item: PendingUpload): Promise<boolean> => {
    try {
      // Convert data URL to blob
      const blob = dataUrlToBlob(item.dataUrl);
      const filePath = `${item.storagePath}/${item.filename}`;
      
      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from(item.storageBucket)
        .upload(filePath, blob, {
          contentType: item.mimeType,
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(item.storageBucket)
        .getPublicUrl(filePath);

      // If this was associated with a checklist item, update the completion
      if (item.itemId && item.templateId) {
        // Note: The actual update would depend on how completions are stored
        // This could be expanded to update the relevant completion record
        console.log(`Upload complete for item ${item.itemId}: ${urlData.publicUrl}`);
      }

      // Remove from queue
      await deletePendingUpload(item.id);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to upload ${item.id}:`, errorMessage);
      
      // Increment retry count
      await incrementRetryCount(item.id, errorMessage);
      
      // If max retries exceeded, remove from queue and report error
      if (item.retryCount >= MAX_RETRY_COUNT - 1) {
        await deletePendingUpload(item.id);
        setSyncErrors(prev => [...prev, `Failed to upload after ${MAX_RETRY_COUNT} attempts: ${item.filename}`]);
      }
      
      return false;
    }
  }, [dataUrlToBlob]);

  // Process the entire queue
  const processQueue = useCallback(async (): Promise<{ success: number; failed: number }> => {
    if (!navigator.onLine || isSyncing) {
      return { success: 0, failed: 0 };
    }

    setIsSyncing(true);
    setSyncErrors([]);
    
    let successCount = 0;
    let failedCount = 0;

    try {
      const pendingItems = await getPendingUploads();
      
      // Filter out items that have exceeded max retries
      const itemsToProcess = pendingItems.filter(item => item.retryCount < MAX_RETRY_COUNT);
      
      for (const item of itemsToProcess) {
        const success = await uploadPendingItem(item);
        if (success) {
          successCount++;
        } else {
          failedCount++;
        }
      }
      
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Queue processing error:', error);
    } finally {
      setIsSyncing(false);
      await refreshQueueSize();
    }

    return { success: successCount, failed: failedCount };
  }, [isSyncing, uploadPendingItem, refreshQueueSize]);

  // Force sync (manual trigger)
  const forceSync = useCallback(async () => {
    if (!navigator.onLine) {
      console.warn('Cannot sync while offline');
      return { success: 0, failed: 0 };
    }
    return processQueue();
  }, [processQueue]);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setSyncErrors([]);
  }, []);

  // Get all pending uploads (for debugging/UI display)
  const getQueuedItems = useCallback(async (): Promise<PendingUpload[]> => {
    return getPendingUploads();
  }, []);

  // Online/offline event handlers
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      if (autoSync) {
        processQueue();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoSync, processQueue]);

  // Periodic sync when online
  useEffect(() => {
    if (!autoSync || !isOnline) {
      return;
    }

    // Initial queue size check
    refreshQueueSize();

    // Set up periodic sync
    syncTimeoutRef.current = setInterval(() => {
      if (navigator.onLine && queueSize > 0) {
        processQueue();
      }
    }, syncIntervalMs);

    return () => {
      if (syncTimeoutRef.current) {
        clearInterval(syncTimeoutRef.current);
      }
    };
  }, [autoSync, isOnline, queueSize, syncIntervalMs, refreshQueueSize, processQueue]);

  // Initial load
  useEffect(() => {
    refreshQueueSize();
  }, [refreshQueueSize]);

  return {
    // State
    isOnline,
    isSyncing,
    queueSize,
    lastSyncTime,
    syncErrors,
    
    // Actions
    addToQueue,
    processQueue: forceSync,
    getQueuedItems,
    clearErrors,
    refreshQueueSize,
  };
}

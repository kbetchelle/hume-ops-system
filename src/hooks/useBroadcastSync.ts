import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { FormDataType, BroadcastMessage } from '@/types/concierge-form';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseBroadcastSyncOptions {
  reportDate: string;
  shiftType: 'AM' | 'PM';
  sessionId: string;
  onRemoteUpdate?: (data: Partial<FormDataType>) => void;
  onUserTyping?: (userId: string, userName: string, field: string) => void;
  onUserSaved?: (userId: string, userName: string) => void;
}

export function useBroadcastSync({
  reportDate,
  shiftType,
  sessionId,
  onRemoteUpdate,
  onUserTyping,
  onUserSaved,
}: UseBroadcastSyncOptions) {
  const { user } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastBroadcastTime = useRef<number>(0);
  const BROADCAST_DEBOUNCE_MS = 500; // Prevent spam

  const channelName = `broadcast-${reportDate}-${shiftType}`;

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    // Subscribe to broadcast messages
    channel
      .on('broadcast', { event: 'data_updated' }, ({ payload }) => {
        const message = payload as BroadcastMessage;

        // Ignore messages from self
        if (message.sessionId === sessionId) return;

        console.log('[Broadcast] Data updated by:', message.userName);
        if (onRemoteUpdate && message.data) {
          onRemoteUpdate(message.data);
        }
      })
      .on('broadcast', { event: 'user_typing' }, ({ payload }) => {
        const message = payload as BroadcastMessage;

        // Ignore messages from self
        if (message.sessionId === sessionId) return;

        if (onUserTyping && message.field) {
          onUserTyping(message.userId, message.userName, message.field);
        }
      })
      .on('broadcast', { event: 'user_saved' }, ({ payload }) => {
        const message = payload as BroadcastMessage;

        // Ignore messages from self
        if (message.sessionId === sessionId) return;

        if (onUserSaved) {
          onUserSaved(message.userId, message.userName);
        }
      })
      .on('broadcast', { event: 'request_sync' }, async ({ payload }) => {
        const message = payload as BroadcastMessage;

        // Ignore messages from self
        if (message.sessionId === sessionId) return;

        console.log('[Broadcast] Sync requested by:', message.userName);
        // The requesting client wants fresh data - they'll get it from Postgres Realtime
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, reportDate, shiftType, sessionId, channelName, onRemoteUpdate, onUserTyping, onUserSaved]);

  const broadcastUpdate = useCallback(
    async (data: Partial<FormDataType>) => {
      if (!channelRef.current || !user) return;

      // Debounce broadcasts to prevent spam
      const now = Date.now();
      if (now - lastBroadcastTime.current < BROADCAST_DEBOUNCE_MS) {
        return;
      }
      lastBroadcastTime.current = now;

      const message: BroadcastMessage = {
        type: 'data_updated',
        sessionId,
        userId: user.id,
        userName: user.user_metadata?.full_name || user.email || 'Unknown',
        data,
        timestamp: now,
      };

      await channelRef.current.send({
        type: 'broadcast',
        event: 'data_updated',
        payload: message,
      });
    },
    [user, sessionId]
  );

  const broadcastTyping = useCallback(
    async (field: string) => {
      if (!channelRef.current || !user) return;

      const message: BroadcastMessage = {
        type: 'user_typing',
        sessionId,
        userId: user.id,
        userName: user.user_metadata?.full_name || user.email || 'Unknown',
        field,
        timestamp: Date.now(),
      };

      await channelRef.current.send({
        type: 'broadcast',
        event: 'user_typing',
        payload: message,
      });
    },
    [user, sessionId]
  );

  const broadcastSaved = useCallback(async () => {
    if (!channelRef.current || !user) return;

    const message: BroadcastMessage = {
      type: 'user_saved',
      sessionId,
      userId: user.id,
      userName: user.user_metadata?.full_name || user.email || 'Unknown',
      timestamp: Date.now(),
    };

    await channelRef.current.send({
      type: 'broadcast',
      event: 'user_saved',
      payload: message,
    });
  }, [user, sessionId]);

  const requestSync = useCallback(async () => {
    if (!channelRef.current || !user) return;

    const message: BroadcastMessage = {
      type: 'request_sync',
      sessionId,
      userId: user.id,
      userName: user.user_metadata?.full_name || user.email || 'Unknown',
      timestamp: Date.now(),
    };

    await channelRef.current.send({
      type: 'broadcast',
      event: 'request_sync',
      payload: message,
    });
  }, [user, sessionId]);

  return {
    broadcastUpdate,
    broadcastTyping,
    broadcastSaved,
    requestSync,
  };
}

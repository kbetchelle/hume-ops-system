import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { EditorInfo } from '@/types/concierge-form';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface PresenceState {
  user_id: string;
  user_name: string;
  session_id: string;
  focused_field?: string;
  online_at: string;
}

export function useEditorPresence(reportDate: string, shiftType: 'AM' | 'PM') {
  const { user } = useAuth();
  const [activeEditors, setActiveEditors] = useState<EditorInfo[]>([]);
  const [typingFields, setTypingFields] = useState<Map<string, string>>(new Map());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const sessionId = useRef(`${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const typingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const channelName = `presence-${reportDate}-${shiftType}`;

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: sessionId.current,
        },
      },
    });

    channelRef.current = channel;

    // Track presence state changes
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const editors: EditorInfo[] = [];

        Object.keys(state).forEach((key) => {
          const presences = state[key] as unknown as PresenceState[];
          presences.forEach((presence) => {
            // Don't include current user/session
            if (presence.session_id !== sessionId.current) {
              editors.push({
                userId: presence.user_id,
                userName: presence.user_name || 'Unknown User',
                sessionId: presence.session_id,
                focusedField: presence.focused_field,
                lastActivity: new Date(presence.online_at).getTime(),
              });
            }
          });
        });

        setActiveEditors(editors);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('[Presence] User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('[Presence] User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track current user's presence
          await channel.track({
            user_id: user.id,
            user_name: user.user_metadata?.full_name || user.email || 'Unknown',
            session_id: sessionId.current,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
      // Clear all typing timeouts
      typingTimeouts.current.forEach((timeout) => clearTimeout(timeout));
    };
  }, [user, reportDate, shiftType, channelName]);

  const broadcastTyping = useCallback(
    async (field: string) => {
      if (!channelRef.current || !user) return;

      // Update presence with focused field
      await channelRef.current.track({
        user_id: user.id,
        user_name: user.user_metadata?.full_name || user.email || 'Unknown',
        session_id: sessionId.current,
        focused_field: field,
        online_at: new Date().toISOString(),
      });

      // Clear field after 3 seconds of inactivity
      const existingTimeout = typingTimeouts.current.get(field);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const timeout = setTimeout(async () => {
        if (channelRef.current) {
          await channelRef.current.track({
            user_id: user.id,
            user_name: user.user_metadata?.full_name || user.email || 'Unknown',
            session_id: sessionId.current,
            focused_field: undefined,
            online_at: new Date().toISOString(),
          });
        }
        typingTimeouts.current.delete(field);
      }, 3000);

      typingTimeouts.current.set(field, timeout);
    },
    [user]
  );

  // Update typing fields map based on active editors
  useEffect(() => {
    const newTypingFields = new Map<string, string>();
    activeEditors.forEach((editor) => {
      if (editor.focusedField) {
        newTypingFields.set(editor.focusedField, editor.userName);
      }
    });
    setTypingFields(newTypingFields);
  }, [activeEditors]);

  return {
    activeEditors,
    typingFields,
    broadcastTyping,
    sessionId: sessionId.current,
  };
}

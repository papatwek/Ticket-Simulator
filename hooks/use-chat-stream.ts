"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Client-side UUID normalizer
function toUuid(str?: string): string {
  if (!str) return '00000000-0000-0000-0000-000000000000';
  const clean = String(str).trim();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean)) {
    return clean.toLowerCase();
  }
  // Simple deterministic UUID format from string
  let h = 0;
  for (let i = 0; i < clean.length; i++) {
    h = Math.imul(31, h) + clean.charCodeAt(i) | 0;
  }
  const hex = (Math.abs(h).toString(16) + '00000000000000000000000000000000').slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export function useChatStream(sessionId: string) {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!sessionId) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const sessionUuid = toUuid(sessionId);

    // 1. Fetch initial chat history from the `messages` table
    const fetchHistory = async () => {
      try {
        const { data } = await supabase
          .from('messages')
          .select('id, session_id, role, content, created_at')
          .eq('session_id', sessionUuid)
          .order('created_at', { ascending: true });

        if (data) {
          const normalized = data.map((m: any) => ({
            ...m,
            text: m.content || '',
          }));
          setMessages(normalized);
        }
      } catch (e) {
        console.warn('Failed to fetch chat history from Supabase:', e);
      }
    };
    fetchHistory();

    // 2. Subscribe to real-time incoming messages
    const channel = supabase
      .channel(`chat_session_${sessionUuid}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${sessionUuid}`,
        },
        (payload) => {
          if (payload.new) {
            const newMsg = {
              ...payload.new,
              text: payload.new.content || '',
            };
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { messages };
}

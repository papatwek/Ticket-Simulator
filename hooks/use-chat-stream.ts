"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export function useChatStream(sessionId: string) {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!sessionId) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    // 1. Fetch initial chat history from the database
    const fetchHistory = async () => {
      try {
        const { data } = await supabase
          .from('messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });
        if (data) setMessages(data);
      } catch (e) {
        console.warn('Failed to fetch chat history from Supabase:', e);
      }
    };
    fetchHistory();

    // 2. Subscribe to real-time incoming AI messages
    const channel = supabase
      .channel(`chat_session_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    // Cleanup subscription when session changes
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { messages };
}

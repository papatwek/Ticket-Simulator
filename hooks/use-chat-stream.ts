"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (Use environment variables in production)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export function useChatStream(sessionId: string) {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    // 1. Fetch initial chat history from the database
    const fetchHistory = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
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
          filter: `session_id=eq.${sessionId}`, // Only listen to this specific chat
        },
        (payload) => {
          console.log('New message payload received:', payload.new);
          // Append the new AI or User message to the UI instantly
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    // Cleanup subscription when the user leaves the chat page
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return messages;
}

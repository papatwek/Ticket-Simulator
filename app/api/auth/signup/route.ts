import { NextResponse } from 'next/server';
import { createUser } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, password, avatarId, avatar } = body;

    const chosenAvatar = avatarId || avatar || 'pip';

    // 1. Try Supabase insert if configured
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('trainees')
          .insert([
            { email: (email || '').trim().toLowerCase(), name: (name || '').trim(), avatar: chosenAvatar }
          ])
          .select()
          .single();

        if (!error && data) {
          // Also sync to local DB for offline access
          try { createUser(email, name, password || 'P@ssw0rd2026', chosenAvatar); } catch {}
          return NextResponse.json({ success: true, user: data });
        }
      } catch (err) {
        console.warn('Supabase insert error in signup, falling back to local DB:', err);
      }
    }

    // 2. Local DB User Registration
    const result = createUser(email, name, password, chosenAvatar);
    return NextResponse.json({ success: true, user: result.user });
  } catch (error: any) {
    console.error('Signup routing error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create trainee account' },
      { status: 400 }
    );
  }
}

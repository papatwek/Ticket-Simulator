import { NextResponse } from 'next/server';
import { createUser } from '@/lib/db';
import { getSupabase } from '@/lib/supabase';
import crypto from 'node:crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, password, avatarId, avatar } = body;

    const chosenAvatar = avatar || avatarId || 'alex';
    const normalizedEmail = (email || '').trim().toLowerCase();
    const trimmedName = (name || '').trim();

    // 1. Try Supabase trainees table
    const supabase = getSupabase();
    if (supabase) {
      try {
        // Check if trainee already exists in Supabase
        const { data: existing } = await supabase
          .from('trainees')
          .select('id, email, name, avatar, created_at')
          .eq('email', normalizedEmail)
          .maybeSingle();

        if (existing) {
          try { createUser(normalizedEmail, trimmedName, password || 'Wyze2026!', chosenAvatar); } catch {}
          return NextResponse.json({
            success: true,
            user: {
              id: existing.id,
              email: existing.email,
              name: existing.name || trimmedName,
              avatar: existing.avatar || chosenAvatar,
              avatarId: existing.avatar || chosenAvatar
            }
          });
        }

        const traineeUuid = crypto.randomUUID();
        const { data, error } = await supabase
          .from('trainees')
          .insert([
            {
              id: traineeUuid,
              email: normalizedEmail,
              name: trimmedName,
              avatar: chosenAvatar,
              created_at: new Date().toISOString()
            }
          ])
          .select('id, email, name, avatar, created_at')
          .maybeSingle();

        if (!error && data) {
          try { createUser(normalizedEmail, trimmedName, password || 'Wyze2026!', chosenAvatar); } catch {}
          return NextResponse.json({
            success: true,
            user: {
              id: data.id,
              email: data.email,
              name: data.name,
              avatar: data.avatar || chosenAvatar,
              avatarId: data.avatar || chosenAvatar
            }
          });
        } else if (error) {
          console.warn('[Supabase Signup] Trainees insert warning:', error.message);
        }
      } catch (err) {
        console.warn('[Supabase Signup] Insert error, falling back to local DB:', err);
      }
    }

    // 2. Local DB User Registration
    const result = createUser(normalizedEmail, trimmedName, password, chosenAvatar);
    return NextResponse.json({ success: true, user: result.user });
  } catch (error: any) {
    console.error('Signup routing error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create trainee account' },
      { status: 400 }
    );
  }
}

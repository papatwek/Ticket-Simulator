import { NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/db';
import { getSupabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const normalizedEmail = (email || '').trim().toLowerCase();

    // 1. Try Supabase trainees table
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('trainees')
          .select('id, email, name, avatar, created_at')
          .eq('email', normalizedEmail)
          .single();

        if (!error && data) {
          const userObj = {
            id: data.id,
            email: data.email,
            name: data.name,
            avatar: data.avatar || 'pip',
            avatarId: data.avatar || 'pip',
          };
          return NextResponse.json({ success: true, user: userObj });
        }
      } catch (err) {
        console.warn('[Supabase Signin] Query warning, falling back to local DB:', err);
      }
    }

    // 2. Fall back to local DB verification
    const authResult = authenticateUser(email, password || '');
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    return NextResponse.json({ success: true, user: authResult.user });
  } catch (error: any) {
    console.error('Signin routing error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

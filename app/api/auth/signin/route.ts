import { NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/db';
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
    const { email, password } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('trainees')
          .select('*')
          .eq('email', (email || '').trim().toLowerCase())
          .single();

        if (!error && data) {
          return NextResponse.json({ success: true, user: data });
        }
      } catch (err) {
        console.warn('Supabase query error in signin, falling back to local DB:', err);
      }
    }

    // Default & Local DB Verification
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

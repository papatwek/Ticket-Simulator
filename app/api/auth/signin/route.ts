import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body; 

    // Find the trainee in Supabase
    const { data, error } = await supabase
      .from('trainees')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Account not found. Please sign up.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: data });
  } catch (error) {
    console.error("Signin routing error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

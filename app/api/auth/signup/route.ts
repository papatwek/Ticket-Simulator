import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase (ensure these environment variables are set in Vercel)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, avatar } = body; // Adjust these fields based on your UI

    // Insert the new trainee into Supabase
    const { data, error } = await supabase
      .from('trainees')
      .insert([
        { email: email, name: name, avatar: avatar }
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: data });
  } catch (error) {
    console.error("Signup routing error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { traineeId, scenarioType } = body;

    // Create a new active session/ticket in Supabase
    const { data, error } = await supabase
      .from('sessions')
      .insert([
        { 
          trainee_id: traineeId, 
          scenario_type: scenarioType || 'general_support',
          status: 'active'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase session error:", error);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json({ success: true, session: data });
  } catch (error) {
    console.error("Session routing error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

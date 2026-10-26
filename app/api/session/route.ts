import { NextResponse } from 'next/server';
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
    const { traineeId, scenarioType } = body;

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
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

        if (!error && data) {
          return NextResponse.json({ success: true, session: data });
        }
      } catch (err) {
        console.warn('Supabase session insert bypassed:', err);
      }
    }

    return NextResponse.json({
      success: true,
      session: {
        id: 'sess_' + Date.now().toString(36),
        trainee_id: traineeId,
        scenario_type: scenarioType || 'general_support',
        status: 'active'
      }
    });
  } catch (error) {
    console.error("Session routing error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

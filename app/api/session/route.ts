import { NextRequest, NextResponse } from 'next/server';
import { saveSessionToDb, getSessionDetailFromDb, isTrainerPasscode } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing session ID.' }, { status: 400 });
  }

  const trainerKey = url.searchParams.get('key') || req.headers.get('x-trainer-passcode');
  const isTrainer = isTrainerPasscode(trainerKey);

  try {
    const result = getSessionDetailFromDb(id, isTrainer);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true, data: result.data });
  } catch (err: any) {
    console.error('Session retrieval error:', err);
    return NextResponse.json({ error: err.message || 'Database error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Check if this is a full session payload from simulator pushServerSession
    if (body.id) {
      const userId = body.userId || body.traineeId || req.headers.get('x-trainee-id') || 'usr_default';
      const username = body.traineeName || body.username || 'Trainee Agent';

      // 1. Save to SQLite database (primary persistence)
      const saveRes = saveSessionToDb(body, userId, username);

      // 2. Optionally sync to Supabase if credentials are provided
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.from('sessions').upsert({
            id: body.id,
            trainee_id: userId,
            trainee_name: username,
            ticket_id: body.ticketId || '',
            status: body.status || 'OPEN',
            ended: body.ended ? true : false,
            updated_at: new Date().toISOString(),
            data: JSON.stringify(body),
          });
        } catch (sErr) {
          console.warn('Optional Supabase session sync bypassed:', sErr);
        }
      }

      return NextResponse.json({ success: true, ok: true, id: saveRes.id });
    }

    // Otherwise handle new session initialisation request
    const { traineeId, scenarioType } = body;
    const generatedId = 'sess_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

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
        id: generatedId,
        trainee_id: traineeId,
        scenario_type: scenarioType || 'general_support',
        status: 'active'
      }
    });
  } catch (error: any) {
    console.error("Session routing error:", error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

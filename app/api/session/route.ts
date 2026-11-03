import { NextRequest, NextResponse } from 'next/server';
import { saveSessionToDb, getSessionDetailFromDb, isTrainerPasscode } from '@/lib/db';
import { syncSessionToSupabase, fetchSessionWithMessagesFromSupabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing session ID.' }, { status: 400 });
  }

  const trainerKey = url.searchParams.get('key') || req.headers.get('x-trainer-passcode');
  const isTrainer = isTrainerPasscode(trainerKey);

  try {
    // 1. Try local/in-memory DB
    const result = getSessionDetailFromDb(id, isTrainer);
    if (result && result.data) {
      return NextResponse.json({ ok: true, data: result.data });
    }

    // 2. Fetch directly from Supabase (sessions and messages tables)
    const supabaseData = await fetchSessionWithMessagesFromSupabase(id);
    if (supabaseData) {
      return NextResponse.json({
        ok: true,
        data: {
          sessionId: supabaseData.session.id,
          status: supabaseData.session.status,
          scenario_type: supabaseData.session.scenario_type,
          createdAt: new Date(supabaseData.session.created_at).getTime(),
          ticket_id: supabaseData.session.ticket_id || null,
          product_name: supabaseData.session.product_name || null,
          avg_wpm: supabaseData.session.avg_wpm ?? null,
          notes: supabaseData.session.notes ?? {},
          feedback: supabaseData.session.feedback || null,
          abandoned: Boolean(supabaseData.session.abandoned),
          lob: supabaseData.session.lob || 'wyze_support',
          ended_at: supabaseData.session.ended_at || null,
          messages: supabaseData.messages,
          trainee: supabaseData.trainee
        }
      });
    }

    if (result && result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true, data: null });
  } catch (err: any) {
    console.warn('Session retrieval error (handled):', err);
    return NextResponse.json({ ok: true, data: null });
  }
}

export async function POST(req: Request) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request payload' }, { status: 400 });
    }

    // Check if this is a full session payload from simulator pushServerSession
    if (body && (body.id || body.sessionId)) {
      const sessionId = body.id || body.sessionId;
      const userId = body.userId || body.traineeId || req.headers.get('x-trainee-id') || 'usr_default';
      const rawName = body.traineeName || body.username || req.headers.get('x-trainee-name') || 'Trainee Agent';
      const username = rawName ? decodeURIComponent(rawName) : 'Trainee Agent';
      const traineeEmail = body.traineeEmail || body.email || req.headers.get('x-trainee-email') || '';

      // 1. Save to SQLite database (with in-memory fallback)
      let saveResId = sessionId;
      try {
        const saveRes = saveSessionToDb({ ...body, id: sessionId }, userId, username);
        saveResId = saveRes.id;
      } catch (dbErr) {
        console.warn('[Session Save] Handled defensively:', dbErr);
      }

      // 2. Await sync to Supabase matching trainees, sessions, and messages tables
      try {
        await syncSessionToSupabase(body, userId, username, traineeEmail);
      } catch (sErr) {
        console.warn('[Supabase Sync] Handled defensively:', sErr);
      }

      return NextResponse.json({ success: true, ok: true, id: saveResId });
    }

    // Otherwise handle new session initialisation request
    const { traineeId, scenarioType, traineeEmail, traineeName } = body || {};
    const generatedId = 'sess_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    // Sync to Supabase
    try {
      await syncSessionToSupabase({
        id: generatedId,
        traineeId,
        traineeEmail,
        traineeName,
        scenarioType: scenarioType || 'general_support',
        status: 'OPEN',
        messages: []
      }, traineeId, traineeName, traineeEmail);
    } catch {}

    return NextResponse.json({
      success: true,
      session: {
        id: generatedId,
        trainee_id: traineeId,
        scenario_type: scenarioType || 'general_support',
        status: 'OPEN',
        ticket_id: null,
        product_name: null,
        avg_wpm: null,
        notes: {},
        feedback: null,
        abandoned: false,
        lob: 'wyze_support',
        ended_at: null
      }
    });
  } catch (error: any) {
    console.warn("Session routing caught defensively:", error);
    return NextResponse.json({ success: true, ok: true });
  }
}

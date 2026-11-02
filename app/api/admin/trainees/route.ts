import { NextRequest, NextResponse } from 'next/server';
import {
  isTrainerPasscode,
  adminListTrainees,
  adminToggleAccountStatus,
  adminTriggerReset,
  adminCreateTrainee,
  AdminTraineeSummary
} from '@/lib/db';
import { fetchAllTraineesFromSupabase, getSupabase } from '@/lib/supabase';
import crypto from 'node:crypto';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const key = url.searchParams.get('key') || req.headers.get('x-trainer-passcode');

  if (!isTrainerPasscode(key)) {
    return NextResponse.json({ error: 'Unauthorized leadership access.' }, { status: 401 });
  }

  try {
    // 1. Fetch from Supabase trainees table
    const supaTrainees = await fetchAllTraineesFromSupabase();

    // 2. Fetch from local SQLite DB
    const localTrainees = adminListTrainees();

    // 3. Merge by email address
    const mergedMap = new Map<string, AdminTraineeSummary>();

    for (const t of localTrainees) {
      if (t.email) {
        mergedMap.set(t.email.toLowerCase(), t);
      }
    }

    for (const t of supaTrainees) {
      const emailKey = (t.email || '').toLowerCase();
      const existing = mergedMap.get(emailKey);
      if (!existing) {
        mergedMap.set(emailKey, t);
      } else {
        mergedMap.set(emailKey, {
          ...existing,
          id: t.id || existing.id,
          name: t.name || existing.name,
          avatarId: t.avatarId || existing.avatarId,
          totalDrills: Math.max(existing.totalDrills, t.totalDrills),
          resolvedCount: Math.max(existing.resolvedCount, t.resolvedCount),
          resolvedRate: t.totalDrills > 0 ? t.resolvedRate : existing.resolvedRate,
          abandonedCount: Math.max(existing.abandonedCount, t.abandonedCount),
          lastActiveAt: Math.max(existing.lastActiveAt || 0, t.lastActiveAt || 0) || null,
          lastTicketId: t.lastTicketId || existing.lastTicketId,
        });
      }
    }

    const trainees = Array.from(mergedMap.values());
    return NextResponse.json({ ok: true, trainees });
  } catch (err: any) {
    console.error('Error listing trainees for admin:', err);
    return NextResponse.json({ error: err.message || 'Failed to list trainees.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const key = body.key || req.headers.get('x-trainer-passcode');

    if (!isTrainerPasscode(key)) {
      return NextResponse.json({ error: 'Unauthorized leadership access.' }, { status: 401 });
    }

    const { action, userId, email, name, tempPassword, active } = body;

    if (action === 'toggle-status') {
      if (!userId) {
        return NextResponse.json({ error: 'Missing userId.' }, { status: 400 });
      }
      const res = adminToggleAccountStatus(userId, !!active);
      return NextResponse.json(res);
    }

    if (action === 'trigger-reset') {
      const identifier = userId || email;
      if (!identifier) {
        return NextResponse.json({ error: 'Missing trainee identifier.' }, { status: 400 });
      }
      const res = adminTriggerReset(identifier);
      return NextResponse.json(res, { status: res.status });
    }

    if (action === 'invite' || action === 'create') {
      if (!email || !name) {
        return NextResponse.json({ error: 'Email and full name are required.' }, { status: 400 });
      }

      // 1. Create in local DB
      const res = adminCreateTrainee(email, name, tempPassword);

      // 2. Also register in Supabase trainees table
      const supabase = getSupabase();
      if (supabase) {
        try {
          const normEmail = email.trim().toLowerCase();
          const traineeUuid = crypto.randomUUID();
          await supabase.from('trainees').upsert({
            id: traineeUuid,
            email: normEmail,
            name: name.trim(),
            avatar: 'alex',
            created_at: new Date().toISOString()
          }, { onConflict: 'email' });
        } catch (sErr) {
          console.warn('[Admin Invite] Supabase sync non-fatal:', sErr);
        }
      }

      return NextResponse.json(res, { status: res.status });
    }

    return NextResponse.json({ error: 'Unknown admin action.' }, { status: 400 });
  } catch (err: any) {
    console.error('Error executing admin action:', err);
    return NextResponse.json({ error: err.message || 'Admin action failed.' }, { status: 500 });
  }
}

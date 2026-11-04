import { NextRequest, NextResponse } from 'next/server';
import {
  adminListTrainees,
  adminToggleAccountStatus,
  adminTriggerReset,
  saveResetCodeForEmail,
  adminCreateTrainee,
  AdminTraineeSummary
} from '@/lib/db';
import { fetchAllTraineesFromSupabase, getSupabaseAdmin } from '@/lib/supabase';
import { verifyAdminSession } from '@/lib/adminAuth';
import crypto from 'node:crypto';

export async function GET(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json(
      { error: 'Unauthorized leadership access. Admin session required.' },
      { status: 401 }
    );
  }

  try {
    // 1. Fetch from Supabase trainees table
    const supaTrainees = await fetchAllTraineesFromSupabase();

    // 2. Fetch from local DB
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
    return NextResponse.json({ error: 'Failed to list trainees.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json(
      { error: 'Unauthorized leadership access. Admin session required.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { action, userId, email, name, tempPassword, active, isActive, identifier } = body;
    const normalizedAction = String(action || '').toLowerCase().replace(/_/g, '-');
    const resolvedIdentifier = identifier || userId || email;
    const resolvedActive = active !== undefined ? !!active : !!isActive;

    if (normalizedAction === 'toggle-status') {
      const targetId = userId || identifier || email;
      if (!targetId) {
        return NextResponse.json({ error: 'Missing userId.' }, { status: 400 });
      }
      const res = adminToggleAccountStatus(targetId, resolvedActive);
      const supabase = getSupabaseAdmin();
      if (supabase) {
        try {
          await supabase.from('trainees').update({ is_active: resolvedActive }).or(`id.eq.${targetId},email.eq.${targetId}`);
        } catch (sErr) {
          console.warn('[Toggle Status] Supabase admin update non-fatal:', sErr);
        }
      }
      return NextResponse.json(res);
    }

    if (normalizedAction === 'trigger-reset') {
      if (!resolvedIdentifier) {
        return NextResponse.json({ error: 'Missing trainee identifier.' }, { status: 400 });
      }
      let res = adminTriggerReset(resolvedIdentifier);
      if (!res.ok) {
        const supabase = getSupabaseAdmin();
        if (supabase) {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedIdentifier);
          let query = supabase.from('trainees').select('id, email, name');
          if (isUuid) {
            query = query.eq('id', resolvedIdentifier);
          } else {
            query = query.eq('email', resolvedIdentifier.toLowerCase().trim());
          }
          const { data: trainee } = await query.maybeSingle();
          if (trainee && trainee.email) {
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = Date.now() + 60 * 60 * 1000;
            saveResetCodeForEmail(trainee.email, code, expiresAt);
            return NextResponse.json({
              ok: true,
              code,
              email: trainee.email,
              name: trainee.name || trainee.email,
              expiresAt,
              status: 200
            });
          }
        }
      }
      return NextResponse.json(res, { status: res.status });
    }

    if (action === 'invite' || action === 'create') {
      if (!email || !name) {
        return NextResponse.json({ error: 'Email and full name are required.' }, { status: 400 });
      }

      // 1. Create in local DB
      const res = adminCreateTrainee(email, name, tempPassword);

      // 2. Also register in Supabase trainees table using server admin client
      const supabase = getSupabaseAdmin();
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
    return NextResponse.json({ error: 'Admin action failed.' }, { status: 500 });
  }
}

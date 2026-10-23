import { NextRequest, NextResponse } from 'next/server';
import {
  isTrainerPasscode,
  adminListTrainees,
  adminToggleAccountStatus,
  adminTriggerReset,
  adminCreateTrainee
} from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const key = url.searchParams.get('key') || req.headers.get('x-trainer-passcode');

  if (!isTrainerPasscode(key)) {
    return NextResponse.json({ error: 'Unauthorized leadership access.' }, { status: 401 });
  }

  try {
    const trainees = adminListTrainees();
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
      const res = adminCreateTrainee(email, name, tempPassword);
      return NextResponse.json(res, { status: res.status });
    }

    return NextResponse.json({ error: 'Unknown admin action.' }, { status: 400 });
  } catch (err: any) {
    console.error('Error executing admin action:', err);
    return NextResponse.json({ error: err.message || 'Admin action failed.' }, { status: 500 });
  }
}

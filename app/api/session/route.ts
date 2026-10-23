import { NextRequest, NextResponse } from 'next/server';
import {
  saveSessionToDb,
  getSessionDetailFromDb,
  isTrainerPasscode,
} from '@/lib/db';

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Bad JSON body' }, { status: 400 });
  }

  if (!body || !body.id) {
    return NextResponse.json({ error: 'Missing session id' }, { status: 400 });
  }

  const userId =
    req.headers.get('x-websim-user-id') ||
    req.headers.get('x-trainee-id') ||
    body.traineeName ||
    body.userId ||
    'trainee_local';

  const username =
    req.headers.get('x-websim-username') ?? body.traineeName ?? 'anon';

  try {
    const result = saveSessionToDb(body, userId, username);
    return NextResponse.json({ ok: true, id: result.id });
  } catch (err: any) {
    console.error('Error saving session:', err);
    return NextResponse.json(
      { error: err.message || 'Database error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing session id' }, { status: 400 });
  }

  const isTrainerReq =
    url.searchParams.get('trainer') === '1' &&
    isTrainerPasscode(url.searchParams.get('key'));

  const result = getSessionDetailFromDb(id, isTrainerReq);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data);
}

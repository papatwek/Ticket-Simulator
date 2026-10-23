import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/db';

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request payload' }, { status: 400 });
  }

  const { email, password } = body || {};

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Please enter both your ECE email and password.' },
      { status: 400 }
    );
  }

  const result = authenticateUser(String(email), String(password));

  if (result.error || !result.user) {
    return NextResponse.json(
      { error: result.error || 'Invalid credentials' },
      { status: result.status || 401 }
    );
  }

  return NextResponse.json({ ok: true, user: result.user }, { status: 200 });
}

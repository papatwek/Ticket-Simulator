import { NextRequest, NextResponse } from 'next/server';
import { createUser, isEceEmail } from '@/lib/db';

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request payload' }, { status: 400 });
  }

  const { email, name, password, repeatPassword, avatarId } = body || {};

  if (!email || !name || !password || !repeatPassword) {
    return NextResponse.json(
      { error: 'Please provide ECE Email, Name, Password, and Repeat Password.' },
      { status: 400 }
    );
  }

  const trimmedEmail = String(email).trim().toLowerCase();
  const trimmedName = String(name).trim();

  if (!isEceEmail(trimmedEmail)) {
    return NextResponse.json(
      {
        error:
          'Please enter a valid ECE corporate email (e.g. name@ececontactcenters.com or your company ece domain).',
      },
      { status: 400 }
    );
  }

  if (trimmedName.length < 2) {
    return NextResponse.json(
      { error: 'Please enter a valid full name (at least 2 characters).' },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters long.' },
      { status: 400 }
    );
  }

  if (password !== repeatPassword) {
    return NextResponse.json(
      { error: 'Passwords do not match. Please verify and re-enter.' },
      { status: 400 }
    );
  }

  try {
    const result = createUser(trimmedEmail, trimmedName, password, avatarId);
    return NextResponse.json({ ok: true, user: result.user }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to create trainee account.' },
      { status: 400 }
    );
  }
}

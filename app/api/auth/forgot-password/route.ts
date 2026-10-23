import { NextRequest, NextResponse } from 'next/server';
import { requestPasswordReset, resetPasswordWithCode, isEceEmail } from '@/lib/db';

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request payload' }, { status: 400 });
  }

  const { action, email, code, newPassword, repeatPassword } = body || {};

  if (!email) {
    return NextResponse.json({ error: 'Please enter your ECE email.' }, { status: 400 });
  }

  const trimmedEmail = String(email).trim().toLowerCase();

  if (!isEceEmail(trimmedEmail)) {
    return NextResponse.json(
      { error: 'Please enter a valid ECE corporate email address.' },
      { status: 400 }
    );
  }

  if (action === 'request') {
    const result = requestPasswordReset(trimmedEmail);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({
      ok: true,
      code: result.code,
      expiresAt: result.expiresAt,
      message: 'A verification code has been generated for your ECE email account.',
    });
  }

  if (action === 'reset') {
    if (!code) {
      return NextResponse.json(
        { error: 'Please enter the 6-digit verification code.' },
        { status: 400 }
      );
    }
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long.' },
        { status: 400 }
      );
    }
    if (newPassword !== repeatPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match. Please verify and try again.' },
        { status: 400 }
      );
    }

    const result = resetPasswordWithCode(trimmedEmail, String(code), newPassword);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      ok: true,
      message: 'Password reset successfully! You can now sign in with your new credentials.',
    });
  }

  return NextResponse.json(
    { error: 'Invalid action. Supported actions are "request" and "reset".' },
    { status: 400 }
  );
}

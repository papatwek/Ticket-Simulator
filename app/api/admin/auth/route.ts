import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateAdminCredentials,
  getLogoutCookieHeader,
  verifyAdminSession,
} from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON request payload.' }, { status: 400 });
    }

    const action = String(body.action || 'login').toLowerCase();

    if (action === 'logout') {
      const cookieHeader = getLogoutCookieHeader();
      const res = NextResponse.json({ ok: true, message: 'Logged out successfully.' });
      res.headers.set('Set-Cookie', cookieHeader);
      return res;
    }

    if (action === 'login') {
      const passcode = body.passcode || '';
      const authResult = authenticateAdminCredentials(passcode);

      if (!authResult.ok) {
        const status = authResult.error?.includes('configuration') ? 500 : 401;
        return NextResponse.json(
          { ok: false, error: authResult.error || 'Authentication failed.' },
          { status }
        );
      }

      const res = NextResponse.json({
        ok: true,
        message: 'Leadership administrator authenticated successfully.',
      });
      if (authResult.cookieHeader) {
        res.headers.set('Set-Cookie', authResult.cookieHeader);
      }
      return res;
    }

    return NextResponse.json({ ok: false, error: 'Unknown admin auth action.' }, { status: 400 });
  } catch (err: any) {
    console.error('[Admin Auth API Error]:', err);
    return NextResponse.json(
      { ok: false, error: 'An unexpected error occurred during administrative authentication.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const isAuth = verifyAdminSession(req);
  return NextResponse.json({ ok: true, authenticated: isAuth });
}

import { NextRequest } from 'next/server';
import crypto from 'node:crypto';

export const ADMIN_COOKIE_NAME = 'ece_admin_session';

/**
 * Returns the secret used for signing admin session cookies.
 * Strictly requires ADMIN_SESSION_SECRET or SESSION_SECRET from environment.
 * Does not fall back to a hardcoded string.
 */
function getSigningSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.SESSION_SECRET;
  if (!secret || secret.trim().length === 0) {
    return null;
  }
  return secret.trim();
}

/**
 * Authenticates a candidate passcode against TRAINER_PASSCODE in environment.
 * Fails securely if environment variables are missing.
 * Performs a timing-safe comparison to prevent timing attacks.
 */
export function authenticateAdminCredentials(candidatePasscode: string): {
  ok: boolean;
  error?: string;
  cookieHeader?: string;
} {
  const configuredPasscode = process.env.TRAINER_PASSCODE;
  const signingSecret = getSigningSecret();

  if (!configuredPasscode || configuredPasscode.trim().length === 0) {
    console.error('[Admin Auth] Security Error: TRAINER_PASSCODE is not set in environment variables.');
    return {
      ok: false,
      error: 'Server authentication configuration error: TRAINER_PASSCODE is not set.',
    };
  }

  if (!signingSecret) {
    console.error('[Admin Auth] Security Error: ADMIN_SESSION_SECRET is not set in environment variables.');
    return {
      ok: false,
      error: 'Server authentication configuration error: ADMIN_SESSION_SECRET is not set.',
    };
  }

  if (!candidatePasscode || typeof candidatePasscode !== 'string') {
    return { ok: false, error: 'Passcode is required.' };
  }

  // Timing-safe comparison
  const a = Buffer.from(candidatePasscode.trim().toLowerCase());
  const b = Buffer.from(configuredPasscode.trim().toLowerCase());

  let match = false;
  if (a.length === b.length) {
    match = crypto.timingSafeEqual(a, b);
  }

  if (!match) {
    return { ok: false, error: 'Invalid leadership passcode.' };
  }

  // Issue signed session token valid for 12 hours
  const now = Date.now();
  const maxAgeSeconds = 12 * 60 * 60; // 12 hours
  const payload = {
    role: 'admin',
    iat: now,
    exp: now + maxAgeSeconds * 1000,
  };

  const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', signingSecret)
    .update(payloadEncoded)
    .digest('base64url');

  const token = `${payloadEncoded}.${signature}`;
  const isProd = process.env.NODE_ENV === 'production';
  const cookieParts = [
    `${ADMIN_COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (isProd) {
    cookieParts.push('Secure');
  }

  return {
    ok: true,
    cookieHeader: cookieParts.join('; '),
  };
}

/**
 * Produces an invalidating Set-Cookie header for administrative logout.
 */
export function getLogoutCookieHeader(): string {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieParts = [
    `${ADMIN_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];
  if (isProd) {
    cookieParts.push('Secure');
  }
  return cookieParts.join('; '), cookieParts.join('; ');
}

/**
 * Validates the signed administrative session on incoming server requests.
 * Reads the HTTP-only cookie, verifies HMAC integrity and token expiration.
 */
export function verifyAdminSession(req: NextRequest): boolean {
  const cookieVal = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!cookieVal) {
    return false;
  }

  const signingSecret = getSigningSecret();
  if (!signingSecret) {
    console.warn('[Admin Auth] Verification failed: ADMIN_SESSION_SECRET is not configured.');
    return false;
  }

  const parts = cookieVal.split('.');
  if (parts.length !== 2) {
    return false;
  }

  const [payloadEncoded, signature] = parts;

  // Verify HMAC signature timing-safely
  const expectedSignature = crypto
    .createHmac('sha256', signingSecret)
    .update(payloadEncoded)
    .digest('base64url');

  const sigA = Buffer.from(signature);
  const sigB = Buffer.from(expectedSignature);

  if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
    return false;
  }

  // Verify payload expiration and role
  try {
    const payloadJson = Buffer.from(payloadEncoded, 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadJson);

    if (payload.role !== 'admin') {
      return false;
    }

    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

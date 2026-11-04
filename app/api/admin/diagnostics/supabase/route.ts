import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/adminAuth';
import { runSupabaseConnectionDiagnostic } from '@/lib/supabase';

/**
 * Server-side Supabase Diagnostic Endpoint
 * 
 * Securely verifies connectivity to Supabase using the server-side service-role key
 * and tests read access on knowledge_articles & knowledge_article_chunks in a
 * strictly read-only manner (HEAD requests for row counts).
 * 
 * Protected strictly by the verified administrator session cookie.
 * Never returns service-role keys, database credentials, or raw stack traces.
 */
export async function GET(req: NextRequest) {
  // 1. Strictly verify the administrator session cookie
  if (!verifyAdminSession(req)) {
    return NextResponse.json(
      { ok: false, connected: false, error: 'Unauthorized administrator access. Active admin session required.' },
      { status: 401 }
    );
  }

  try {
    // 2. Run strictly read-only connection diagnostic
    const result = await runSupabaseConnectionDiagnostic();

    // 3. Return sanitized diagnostic result
    return NextResponse.json(result);
  } catch (err: any) {
    // Keep raw technical details in server-side logs only
    console.error('[Supabase Diagnostic Error Details]:', err);
    return NextResponse.json(
      {
        ok: false,
        connected: false,
        status: 'unexpected_error',
        error: 'An unexpected database error occurred. Please check server logs.',
        environment: {
          supabaseUrlConfigured: !!(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
          serviceRoleKeyConfigured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        },
        host: null,
        articlesCount: null,
        chunksCount: null,
        latencyMs: null,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

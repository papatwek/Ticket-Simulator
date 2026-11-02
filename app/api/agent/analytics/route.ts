import { NextRequest, NextResponse } from 'next/server';
import { getAgentAnalyticsFromDb } from '@/lib/db';
import { fetchTraineeAnalyticsFromSupabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const user =
    url.searchParams.get('user') ||
    req.headers.get('x-websim-user-id') ||
    req.headers.get('x-trainee-id') ||
    req.headers.get('x-websim-username');

  if (!user) {
    return NextResponse.json({ error: 'Missing trainee identifier.' }, { status: 400 });
  }

  try {
    const localAnalytics = getAgentAnalyticsFromDb(user);
    if (localAnalytics && localAnalytics.kpis && localAnalytics.kpis.totalSessions > 0) {
      return NextResponse.json({ ok: true, analytics: localAnalytics });
    }

    const supaAnalytics = await fetchTraineeAnalyticsFromSupabase(user);
    if (supaAnalytics && supaAnalytics.kpis && supaAnalytics.kpis.totalSessions > 0) {
      return NextResponse.json({ ok: true, analytics: supaAnalytics });
    }

    return NextResponse.json({ ok: true, analytics: supaAnalytics || localAnalytics });
  } catch (err: any) {
    console.error('Error fetching trainee analytics:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to retrieve analytics.' },
      { status: 500 }
    );
  }
}

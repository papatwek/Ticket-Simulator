import { NextRequest, NextResponse } from 'next/server';
import { listSessionsFromDb, isTrainerPasscode } from '@/lib/db';
import { getSupabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const isTrainerReq =
    url.searchParams.get('trainer') === '1' &&
    isTrainerPasscode(url.searchParams.get('key'));

  try {
    const localData = listSessionsFromDb(isTrainerReq);
    let results = localData.results || [];

    // Also fetch from Supabase sessions table matching schema
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: supaSessions, error } = await supabase
          .from('sessions')
          .select('id, trainee_id, scenario_type, status, created_at, trainees(id, email, name, avatar)')
          .order('created_at', { ascending: false })
          .limit(100);

        if (!error && Array.isArray(supaSessions) && supaSessions.length > 0) {
          const supaMapped = supaSessions.map((s: any) => ({
            id: s.id,
            ticket_id: 'WZ-' + s.id.slice(0, 6).toUpperCase(),
            trainee_name: s.trainees?.name || 'Trainee Agent',
            lob: 'Wyze Support',
            category: s.scenario_type || 'General Support',
            status: s.status || 'OPEN',
            ended: s.status === 'RESOLVED' ? 1 : 0,
            username: s.trainees?.email || '',
            created_at: new Date(s.created_at).getTime(),
            updated_at: new Date(s.created_at).getTime(),
          }));

          const seen = new Set(results.map((r: any) => r.id));
          for (const item of supaMapped) {
            if (!seen.has(item.id)) {
              results.push(item);
              seen.add(item.id);
            }
          }
        }
      } catch (sErr) {
        console.warn('[Supabase] Listing sessions non-fatal bypass:', sErr);
      }
    }

    return NextResponse.json({ results, trainer: isTrainerReq });
  } catch (err: any) {
    console.error('Error listing sessions:', err);
    return NextResponse.json(
      { error: err.message || 'Database error' },
      { status: 500 }
    );
  }
}

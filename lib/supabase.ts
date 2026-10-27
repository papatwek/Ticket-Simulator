import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _cachedClient: SupabaseClient | null = null;
let _initAttempted = false;

export function getSupabase(): SupabaseClient | null {
  if (_cachedClient) return _cachedClient;
  if (_initAttempted && !_cachedClient) return null;

  _initAttempted = true;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  try {
    _cachedClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return _cachedClient;
  } catch (err) {
    console.warn('[Supabase] Failed to initialize client:', err);
    return null;
  }
}

export function isSupabaseReady(): boolean {
  return !!getSupabase();
}

/**
 * Persists an entire simulator session to Supabase.
 * Defensively handles variations in table column schemas.
 */
export async function syncSessionToSupabase(session: any, traineeId?: string, traineeName?: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const sessionId = session.id || session.sessionId;
  if (!sessionId) return false;

  const nowIso = new Date().toISOString();
  const serialized = typeof session === 'string' ? session : JSON.stringify(session);
  const resolvedTraineeId = traineeId || session.userId || session.traineeId || 'usr_anon';
  const resolvedTraineeName = traineeName || session.traineeName || session.username || 'Trainee Agent';
  const ticketId = session.ticketId || '';
  const status = session.status || 'OPEN';
  const isEnded = !!session.ended;

  // 1. Upsert into sessions table
  try {
    // Attempt standard rich schema
    const { error: richErr } = await supabase.from('sessions').upsert({
      id: sessionId,
      trainee_id: resolvedTraineeId,
      trainee_name: resolvedTraineeName,
      ticket_id: ticketId,
      status: status,
      ended: isEnded,
      updated_at: nowIso,
      data: serialized,
    }, { onConflict: 'id' });

    if (richErr) {
      // Fallback for minimal schema (e.g. only id and data or updated_at)
      await supabase.from('sessions').upsert({
        id: sessionId,
        status: status,
        updated_at: nowIso,
        data: serialized,
      }, { onConflict: 'id' });
    }
  } catch (err) {
    console.warn('[Supabase] Session upsert non-fatal bypass:', err);
  }

  // 2. Upsert individual messages into messages table
  if (Array.isArray(session.messages) && session.messages.length > 0) {
    try {
      const rows = session.messages.map((m: any, idx: number) => ({
        id: `${sessionId}_${idx}`,
        session_id: sessionId,
        role: m.role || 'user',
        content: m.text || m.content || '',
        text: m.text || m.content || '',
        created_at: m.ts ? new Date(m.ts).toISOString() : nowIso,
      }));

      await supabase.from('messages').upsert(rows, { onConflict: 'id' });
    } catch (msgErr) {
      console.warn('[Supabase] Messages upsert non-fatal bypass:', msgErr);
    }
  }

  return true;
}

/**
 * Saves a single message to the Supabase messages table in real time.
 */
export async function syncSingleMessageToSupabase(
  sessionId: string,
  role: 'agent' | 'customer' | 'system',
  text: string,
  metadata?: any
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase || !sessionId || !text) return false;

  const nowIso = new Date().toISOString();
  const id = `${sessionId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  try {
    const { error } = await supabase.from('messages').insert({
      id,
      session_id: sessionId,
      role,
      content: text,
      text,
      created_at: nowIso,
    });
    if (error) {
      console.warn('[Supabase] Single message insert warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Single message sync non-fatal error:', err);
    return false;
  }
}

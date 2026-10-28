import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

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
 * Ensures any identifier string is converted into a strictly valid PostgreSQL UUID (v4 format).
 * Preserves actual UUIDs, while deterministically mapping string IDs (e.g. "sess_102", "usr_patrick")
 * so the same simulator ID always maps to the same UUID in Supabase.
 */
export function toValidUuid(input?: string): string {
  if (!input) return crypto.randomUUID();
  const clean = String(input).trim();
  // Valid UUID v1-v5 format
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean)) {
    return clean.toLowerCase();
  }
  // Deterministic UUID derived from input via sha1
  const hash = crypto.createHash('sha1').update(clean).digest('hex');
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    '4' + hash.slice(13, 16),
    ((parseInt(hash.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0') + hash.slice(18, 20),
    hash.slice(20, 32),
  ].join('-').toLowerCase();
}

/**
 * Ensures a record in the `trainees` table exists to fulfill foreign key constraints.
 * Schema:
 * - id: uuid (Primary Key)
 * - email: text
 * - name: text
 * - created_at: timestamptz
 * - avatar: text
 */
export async function ensureTraineeRecord(
  traineeIdOrEmail?: string,
  traineeName?: string,
  avatar?: string
): Promise<string> {
  const supabase = getSupabase();
  const fallbackUuid = toValidUuid(traineeIdOrEmail || 'trainee_default');
  if (!supabase) return fallbackUuid;

  const raw = String(traineeIdOrEmail || '').trim().toLowerCase();
  const isEmail = raw.includes('@');
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw);

  try {
    // 1. If given an existing UUID, check if it's already in trainees
    if (isUuid) {
      const { data } = await supabase.from('trainees').select('id').eq('id', raw).single();
      if (data && data.id) return data.id;
    }

    // 2. Search by email if it's an email address
    const emailToSearch = isEmail ? raw : (raw ? `${raw}@ececontactcenters.com` : 'trainee@ececontactcenters.com');
    const { data: byEmail } = await supabase.from('trainees').select('id').eq('email', emailToSearch).single();
    if (byEmail && byEmail.id) return byEmail.id;

    // 3. Upsert into trainees table with exact columns
    const traineeUuid = isUuid ? raw : toValidUuid(emailToSearch);
    const { data: inserted, error } = await supabase
      .from('trainees')
      .upsert({
        id: traineeUuid,
        email: emailToSearch,
        name: traineeName || (isEmail ? emailToSearch.split('@')[0] : 'Trainee Agent'),
        avatar: avatar || 'alex',
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select('id')
      .single();

    if (!error && inserted?.id) return inserted.id;
    return traineeUuid;
  } catch (err: any) {
    console.warn('[Supabase] ensureTraineeRecord caught defensively:', err?.message || err);
    return fallbackUuid;
  }
}

/**
 * Ensures a record in the `sessions` table exists to fulfill foreign key constraints.
 * Schema:
 * - id: uuid (Primary Key)
 * - trainee_id: uuid (Foreign Key -> trainees.id)
 * - scenario_type: text
 * - status: text
 * - created_at: timestamptz
 */
export async function ensureSessionRecord(
  sessionId: string,
  traineeIdOrEmail?: string,
  scenarioType?: string,
  status?: string,
  createdAt?: string | number
): Promise<string> {
  const supabase = getSupabase();
  const sessionUuid = toValidUuid(sessionId);
  if (!supabase) return sessionUuid;

  try {
    const traineeUuid = await ensureTraineeRecord(traineeIdOrEmail);
    const resolvedScenario = scenarioType || 'general_support';
    const resolvedStatus = status || 'OPEN';
    const resolvedCreatedAt = createdAt
      ? new Date(createdAt).toISOString()
      : new Date().toISOString();

    const { error } = await supabase.from('sessions').upsert({
      id: sessionUuid,
      trainee_id: traineeUuid,
      scenario_type: resolvedScenario,
      status: resolvedStatus,
      created_at: resolvedCreatedAt,
    }, { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase] sessions upsert error:', error.message);
    }
  } catch (err: any) {
    console.warn('[Supabase] ensureSessionRecord error:', err?.message || err);
  }

  return sessionUuid;
}

/**
 * Saves a single message to the `messages` table in real time.
 * Schema:
 * - id: uuid (Primary Key)
 * - session_id: uuid (Foreign Key -> sessions.id)
 * - role: text ('agent', 'customer', 'system')
 * - content: text
 * - created_at: timestamptz
 */
export async function syncSingleMessageToSupabase(
  sessionId: string,
  role: 'agent' | 'customer' | 'system',
  content: string,
  metadata?: {
    traineeId?: string;
    scenarioType?: string;
    status?: string;
    messageId?: string;
    createdAt?: string | number;
  }
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase || !sessionId || !content) return false;

  const sessionUuid = toValidUuid(sessionId);
  const nowIso = metadata?.createdAt ? new Date(metadata.createdAt).toISOString() : new Date().toISOString();
  const messageUuid = metadata?.messageId ? toValidUuid(metadata.messageId) : crypto.randomUUID();

  try {
    // 1. Ensure parent session exists first so foreign key constraint passes
    await ensureSessionRecord(
      sessionId,
      metadata?.traineeId,
      metadata?.scenarioType,
      metadata?.status,
      nowIso
    );

    // 2. Insert into messages table with exact columns
    const { error } = await supabase.from('messages').insert({
      id: messageUuid,
      session_id: sessionUuid,
      role: role || 'customer',
      content: content,
      created_at: nowIso,
    });

    if (error) {
      console.warn('[Supabase] messages insert warning:', error.message);
      return false;
    }
    console.log(`[Supabase] Synced message ${messageUuid} (${role}) to session ${sessionUuid}`);
    return true;
  } catch (err: any) {
    console.warn('[Supabase] syncSingleMessageToSupabase error:', err?.message || err);
    return false;
  }
}

/**
 * Synchronizes an entire session and all its messages to Supabase.
 */
export async function syncSessionToSupabase(
  session: any,
  traineeId?: string,
  traineeName?: string
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const sessionId = session.id || session.sessionId;
  if (!sessionId) return false;

  const sessionUuid = toValidUuid(sessionId);
  const resolvedTrainee = traineeId || session.userId || session.traineeId || session.traineeEmail;
  const scenarioType = session.scenario_type || session.category || (session.persona && session.persona.issueCategory) || 'general_support';
  const status = session.status || 'OPEN';
  const createdAtIso = session.created_at
    ? new Date(session.created_at).toISOString()
    : (session.createdAt ? new Date(session.createdAt).toISOString() : new Date().toISOString());

  try {
    // 1. Ensure trainee and sessions row exist
    await ensureSessionRecord(sessionId, resolvedTrainee, scenarioType, status, createdAtIso);

    // 2. Upsert each message into the `messages` table
    if (Array.isArray(session.messages) && session.messages.length > 0) {
      const messageRows = session.messages.map((m: any, idx: number) => {
        const msgText = m.content || m.text || '';
        return {
          id: toValidUuid(`${sessionUuid}_msg_${idx}_${m.role}_${msgText.slice(0, 15)}`),
          session_id: sessionUuid,
          role: m.role || 'user',
          content: msgText,
          created_at: m.ts ? new Date(m.ts).toISOString() : createdAtIso,
        };
      });

      const { error: msgErr } = await supabase.from('messages').upsert(messageRows, { onConflict: 'id' });
      if (msgErr) {
        console.warn('[Supabase] messages batch upsert error:', msgErr.message);
      } else {
        console.log(`[Supabase] Batch synced ${messageRows.length} messages for session ${sessionUuid}`);
      }
    }

    return true;
  } catch (err: any) {
    console.warn('[Supabase] syncSessionToSupabase error:', err?.message || err);
    return false;
  }
}

/**
 * Fetches a session with all its messages from Supabase.
 */
export async function fetchSessionWithMessagesFromSupabase(sessionId: string) {
  const supabase = getSupabase();
  if (!supabase || !sessionId) return null;

  const sessionUuid = toValidUuid(sessionId);
  try {
    const { data: sessionData, error: sErr } = await supabase
      .from('sessions')
      .select('id, trainee_id, scenario_type, status, created_at')
      .eq('id', sessionUuid)
      .single();

    if (sErr || !sessionData) return null;

    const { data: messagesData } = await supabase
      .from('messages')
      .select('id, session_id, role, content, created_at')
      .eq('session_id', sessionUuid)
      .order('created_at', { ascending: true });

    let traineeData: any = null;
    if (sessionData.trainee_id) {
      const { data: tData } = await supabase
        .from('trainees')
        .select('id, email, name, avatar')
        .eq('id', sessionData.trainee_id)
        .single();
      traineeData = tData;
    }

    return {
      session: sessionData,
      messages: (messagesData || []).map(m => ({
        ...m,
        text: m.content || '',
      })),
      trainee: traineeData,
    };
  } catch (err) {
    console.warn('[Supabase] fetchSessionWithMessagesFromSupabase error:', err);
    return null;
  }
}

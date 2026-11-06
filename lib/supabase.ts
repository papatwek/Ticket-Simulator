import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

let _cachedClient: SupabaseClient | null = null;
let _initAttempted = false;

export function getSupabase(): SupabaseClient | null {
  if (_cachedClient) return _cachedClient;
  if (_initAttempted && !_cachedClient) return null;

  _initAttempted = true;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  // Normal Supabase operations must strictly use only the Supabase anon/publishable key.
  // It must NEVER prioritize or use SUPABASE_SERVICE_ROLE_KEY.
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

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



// Privileged client is deliberately separate from the legacy application client.
// It must only be imported by server-side API routes and must never be exposed to the browser.
let _adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (_adminClient) return _adminClient;

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  try {
    _adminClient = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { 'X-Client-Info': 'wyze-ece-server' } },
    });
    return _adminClient;
  } catch (err) {
    console.warn('[Supabase Admin] Failed to initialize privileged client:', err);
    return null;
  }
}

export interface SupabaseDiagnosticResult {
  ok: boolean;
  connected: boolean;
  status: 'connected' | 'missing_credentials' | 'query_failed' | 'unexpected_error';
  error?: string | null;
  environment: {
    supabaseUrlConfigured: boolean;
    serviceRoleKeyConfigured: boolean;
  };
  host: string | null;
  articlesCount: number | null;
  chunksCount: number | null;
  latencyMs: number | null;
  tables?: {
    knowledge_articles: { accessible: boolean; count?: number };
    knowledge_article_chunks: { accessible: boolean; count?: number };
  };
  timestamp: string;
}

/**
 * Executes a strictly read-only diagnostic against Supabase using the server-side service-role key.
 * Queries count only for knowledge_articles and knowledge_article_chunks (HEAD request).
 * Never exposes credentials, tokens, or raw secrets to the caller.
 * Detailed error logs are preserved on the server; generic messages are returned to browser.
 */
export async function runSupabaseConnectionDiagnostic(): Promise<SupabaseDiagnosticResult> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const envStatus = {
    supabaseUrlConfigured: !!url,
    serviceRoleKeyConfigured: !!serviceRoleKey,
  };

  if (!url || !serviceRoleKey) {
    console.error('[Supabase Diagnostic Error] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
    return {
      ok: false,
      connected: false,
      status: 'missing_credentials',
      error: 'Missing required Supabase server configuration.',
      environment: envStatus,
      host: null,
      articlesCount: null,
      chunksCount: null,
      latencyMs: null,
      timestamp: new Date().toISOString(),
    };
  }

  let host: string = 'Configured';
  try {
    host = new URL(url).hostname;
  } catch {
    host = 'Invalid URL host';
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.error('[Supabase Diagnostic Error] Failed to instantiate admin client.');
    return {
      ok: false,
      connected: false,
      status: 'unexpected_error',
      error: 'Failed to initialize database client with configured credentials.',
      environment: envStatus,
      host,
      articlesCount: null,
      chunksCount: null,
      latencyMs: null,
      timestamp: new Date().toISOString(),
    };
  }

  const startTime = Date.now();

  try {
    const { count: articlesCount, error: articlesErr } = await supabase
      .from('knowledge_articles')
      .select('*', { count: 'exact', head: true });

    const { count: chunksCount, error: chunksErr } = await supabase
      .from('knowledge_article_chunks')
      .select('*', { count: 'exact', head: true });

    const latencyMs = Date.now() - startTime;

    if (articlesErr || chunksErr) {
      const primaryErr = articlesErr || chunksErr;
      console.error('[Supabase Diagnostic DB Query Error Details]:', primaryErr);
      return {
        ok: false,
        connected: false,
        status: 'query_failed',
        error: 'Database query failed. Knowledge tables may be missing or inaccessible.',
        environment: envStatus,
        host,
        articlesCount: articlesCount ?? null,
        chunksCount: chunksCount ?? null,
        latencyMs,
        tables: {
          knowledge_articles: {
            accessible: !articlesErr,
            count: articlesCount ?? undefined,
          },
          knowledge_article_chunks: {
            accessible: !chunksErr,
            count: chunksCount ?? undefined,
          },
        },
        timestamp: new Date().toISOString(),
      };
    }

    return {
      ok: true,
      connected: true,
      status: 'connected',
      environment: envStatus,
      host,
      articlesCount: articlesCount ?? 0,
      chunksCount: chunksCount ?? 0,
      latencyMs,
      tables: {
        knowledge_articles: {
          accessible: true,
          count: articlesCount ?? 0,
        },
        knowledge_article_chunks: {
          accessible: true,
          count: chunksCount ?? 0,
        },
      },
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    console.error('[Supabase Diagnostic Execution Exception]:', err);
    return {
      ok: false,
      connected: false,
      status: 'unexpected_error',
      error: 'An unexpected database error occurred.',
      environment: envStatus,
      host,
      articlesCount: null,
      chunksCount: null,
      latencyMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Retrieves a small set of approved knowledge cases for server-side simulation context.
 * Hidden fields are returned only to the calling server route; never serialize this result
 * directly to the trainee-facing response.
 */
export async function searchApprovedKnowledgeCases(input: {
  productFamily: string;
  productModel?: string;
  issueCategory?: string;
  traineeMessage?: string;
  limit?: number;
}): Promise<Array<{
  title: string;
  product_family: string;
  product_model: string | null;
  issue_category: string;
  symptoms: string[];
  hidden_root_cause: string;
  resolution_steps: string[];
  diagnostic_questions: string[];
  expected_led_behavior: string | null;
}>> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const family = String(input.productFamily || '').trim();
  if (!family) return [];

  const terms = [
    input.productModel,
    input.issueCategory,
    input.traineeMessage,
  ].filter(Boolean).join(' ').replace(/[^\p{L}\p{N}\s'-]/gu, ' ').trim();

  try {
    let query = supabase
      .from('knowledge_cases')
      .select('title, product_family, product_model, issue_category, symptoms, hidden_root_cause, resolution_steps, diagnostic_questions, expected_led_behavior')
      .eq('qa_status', 'approved')
      .eq('product_family', family)
      .limit(Math.min(Math.max(input.limit || 3, 1), 5));

    if (terms.length >= 3) {
      query = query.textSearch('fts', terms, { type: 'websearch', config: 'english' });
    }

    const { data, error } = await query;
    if (error) {
      console.warn('[Knowledge Cases] Full-text retrieval warning; trying approved product-family cases:', error.message);
    }
    if (data && data.length > 0) return data as any;

    // A narrow family-only fallback avoids silently losing approved guidance when
    // the trainee's wording does not match the indexed terms.
    const fallback = await supabase
      .from('knowledge_cases')
      .select('title, product_family, product_model, issue_category, symptoms, hidden_root_cause, resolution_steps, diagnostic_questions, expected_led_behavior')
      .eq('qa_status', 'approved')
      .eq('product_family', family)
      .limit(Math.min(Math.max(input.limit || 3, 1), 5));

    if (fallback.error) {
      console.warn('[Knowledge Cases] Product-family fallback failed:', fallback.error.message);
      return [];
    }
    return (fallback.data || []) as any;
  } catch (err) {
    console.warn('[Knowledge Cases] Retrieval handled defensively:', err);
    return [];
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
 * - avatar: text
 * - created_at: timestamptz
 */
export async function ensureTraineeRecord(
  traineeIdOrEmail?: string,
  traineeName?: string,
  avatar?: string,
  traineeEmail?: string
): Promise<string> {
  const supabase = getSupabase();
  const fallbackUuid = toValidUuid(traineeIdOrEmail || traineeEmail || 'trainee_default');
  if (!supabase) return fallbackUuid;

  const raw = String(traineeIdOrEmail || '').trim().toLowerCase();
  const rawEmail = String(traineeEmail || '').trim().toLowerCase();
  const isEmail = raw.includes('@') || rawEmail.includes('@');
  const emailToUse = rawEmail || (raw.includes('@') ? raw : '');
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw);

  try {
    // 1. If given an existing UUID, check if it's already in trainees
    if (isUuid) {
      const { data } = await supabase.from('trainees').select('id').eq('id', raw).maybeSingle();
      if (data && data.id) return data.id;
    }

    // 2. Search by email if we have one
    if (emailToUse) {
      const { data: byEmail } = await supabase.from('trainees').select('id').eq('email', emailToUse).maybeSingle();
      if (byEmail && byEmail.id) return byEmail.id;
    }

    // 3. Fallback search by synthetic email if non-UUID ID was provided
    const emailToSearch = emailToUse || (raw ? `${raw}@ececontactcenters.com` : 'trainee@ececontactcenters.com');
    const { data: bySynth } = await supabase.from('trainees').select('id').eq('email', emailToSearch).maybeSingle();
    if (bySynth && bySynth.id) return bySynth.id;

    // 4. Upsert into trainees table
    const traineeUuid = isUuid ? raw : toValidUuid(emailToSearch);
    const resolvedName = traineeName || (emailToUse ? emailToUse.split('@')[0] : 'Trainee Agent');
    const { data: inserted, error } = await supabase
      .from('trainees')
      .upsert({
        id: traineeUuid,
        email: emailToSearch,
        name: resolvedName,
        avatar: avatar || 'alex',
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select('id')
      .maybeSingle();

    if (!error && inserted?.id) return inserted.id;

    // If upsert conflicted on email with another UUID, re-query by email
    const { data: retryByEmail } = await supabase.from('trainees').select('id').eq('email', emailToSearch).maybeSingle();
    if (retryByEmail?.id) return retryByEmail.id;

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
  createdAt?: string | number,
  traineeName?: string,
  traineeEmail?: string
): Promise<string> {
  const supabase = getSupabase();
  const sessionUuid = toValidUuid(sessionId);
  if (!supabase) return sessionUuid;

  try {
    const traineeUuid = await ensureTraineeRecord(traineeIdOrEmail, traineeName, undefined, traineeEmail);
    const resolvedScenario = scenarioType || 'general_support';
    const resolvedStatus = (status || 'OPEN').toUpperCase();
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
    traineeEmail?: string;
    traineeName?: string;
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
      nowIso,
      metadata?.traineeName,
      metadata?.traineeEmail
    );

    // 2. Insert into messages table with exact columns
    const { error } = await supabase.from('messages').upsert({
      id: messageUuid,
      session_id: sessionUuid,
      role: role || 'customer',
      content: content,
      created_at: nowIso,
    }, { onConflict: 'id' });

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
  traineeName?: string,
  traineeEmail?: string
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const sessionId = session.id || session.sessionId;
  if (!sessionId) return false;

  const sessionUuid = toValidUuid(sessionId);
  const resolvedTrainee = traineeId || session.userId || session.traineeId || session.traineeEmail;
  const resolvedEmail = traineeEmail || session.traineeEmail || session.email;
  const resolvedName = traineeName || session.traineeName || session.name || 'Trainee Agent';
  const scenarioType = session.scenario_type || session.category || (session.persona && session.persona.issueCategory) || 'general_support';
  const status = (session.status || (session.ended ? 'RESOLVED' : 'OPEN')).toUpperCase();
  const createdAtIso = session.created_at
    ? new Date(session.created_at).toISOString()
    : (session.createdAt ? new Date(session.createdAt).toISOString() : new Date().toISOString());

  try {
    // 1. Ensure trainee and sessions row exist
    await ensureSessionRecord(
      sessionId,
      resolvedTrainee,
      scenarioType,
      status,
      createdAtIso,
      resolvedName,
      resolvedEmail
    );

    // 2. Persist optional telemetry. Only supplied values are updated, so partial
    // session snapshots cannot erase previously saved telemetry.
    const telemetryUpdate: Record<string, any> = {};
    const ticketId = session.ticket_id ?? session.ticketId;
    const productName = session.product_name ?? session.productName ?? session.product;
    const avgWpmRaw = session.avg_wpm ?? session.avgWpm;
    const notesRaw = session.notes;
    const feedback = session.feedback ?? session.coaching_feedback ?? session.coachingFeedback;
    const abandoned = session.abandoned ?? (status === 'ABANDONED' || session.endedReason === 'inactivity');
    const lob = session.lob ?? session.lineOfBusiness;
    const endedAt = session.ended_at ?? session.endedAt;

    if (ticketId !== undefined && ticketId !== null) telemetryUpdate.ticket_id = String(ticketId);
    if (productName !== undefined && productName !== null) telemetryUpdate.product_name = String(productName);
    if (avgWpmRaw !== undefined && avgWpmRaw !== null && Number.isFinite(Number(avgWpmRaw))) {
      telemetryUpdate.avg_wpm = Number(avgWpmRaw);
    }
    if (notesRaw !== undefined && notesRaw !== null) {
      if (typeof notesRaw === 'string') {
        try { telemetryUpdate.notes = JSON.parse(notesRaw); }
        catch { telemetryUpdate.notes = { text: notesRaw }; }
      } else {
        telemetryUpdate.notes = notesRaw;
      }
    }
    if (feedback !== undefined && feedback !== null) telemetryUpdate.feedback = String(feedback);
    if (abandoned !== undefined && abandoned !== null) telemetryUpdate.abandoned = Boolean(abandoned);
    if (lob !== undefined && lob !== null) telemetryUpdate.lob = String(lob);
    if (endedAt !== undefined && endedAt !== null) {
      const parsedEndedAt = new Date(endedAt);
      if (!Number.isNaN(parsedEndedAt.getTime())) telemetryUpdate.ended_at = parsedEndedAt.toISOString();
    } else if (['RESOLVED', 'SOLVED', 'COMPLETED', 'ABANDONED', 'CLOSED'].includes(status)) {
      telemetryUpdate.ended_at = new Date().toISOString();
    }

    if (Object.keys(telemetryUpdate).length > 0) {
      const { error: telemetryError } = await supabase
        .from('sessions')
        .update(telemetryUpdate)
        .eq('id', sessionUuid);
      if (telemetryError) {
        console.warn('[Supabase] Session telemetry update warning:', telemetryError.message);
      }
    }

    // 3. Upsert each message into the `messages` table
    if (Array.isArray(session.messages) && session.messages.length > 0) {
      const messageRows = session.messages
        .filter((m: any) => m && (m.text || m.content))
        .map((m: any, idx: number) => {
          const msgText = String(m.content || m.text || '');
          const role = m.role === 'agent' ? 'agent' : (m.role === 'audit' ? 'system' : 'customer');
          return {
            id: toValidUuid(`${sessionUuid}_msg_${idx}_${role}_${msgText.slice(0, 15)}`),
            session_id: sessionUuid,
            role: role,
            content: msgText,
            created_at: m.ts ? new Date(m.ts).toISOString() : createdAtIso,
          };
        });

      if (messageRows.length > 0) {
        const { error: msgErr } = await supabase.from('messages').upsert(messageRows, { onConflict: 'id' });
        if (msgErr) {
          console.warn('[Supabase] messages batch upsert error:', msgErr.message);
        } else {
          console.log(`[Supabase] Batch synced ${messageRows.length} messages for session ${sessionUuid}`);
        }
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
      .select('id, trainee_id, scenario_type, status, created_at, ticket_id, product_name, avg_wpm, notes, feedback, abandoned, lob, ended_at')
      .eq('id', sessionUuid)
      .maybeSingle();

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
        .maybeSingle();
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

/**
 * Fetches all registered trainees along with their session metrics from Supabase.
 */
export async function fetchAllTraineesFromSupabase() {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    // 1. Fetch all trainees
    const { data: trainees, error: tErr } = await supabase
      .from('trainees')
      .select('id, email, name, avatar, created_at')
      .order('created_at', { ascending: false });

    if (tErr || !trainees || trainees.length === 0) {
      if (tErr) console.warn('[Supabase] fetchAllTraineesFromSupabase warning:', tErr.message);
      return [];
    }

    // 2. Fetch all sessions with telemetry columns
    const { data: sessions, error: sErr } = await supabase
      .from('sessions')
      .select('id, trainee_id, ticket_id, scenario_type, status, product_name, avg_wpm, notes, feedback, abandoned, created_at, ended_at');

    const sessionList = (!sErr && Array.isArray(sessions)) ? sessions : [];

    // Group sessions by trainee_id
    const sessionsByTrainee = new Map<string, any[]>();
    for (const s of sessionList) {
      const tId = s.trainee_id;
      if (!tId) continue;
      if (!sessionsByTrainee.has(tId)) {
        sessionsByTrainee.set(tId, []);
      }
      sessionsByTrainee.get(tId)!.push(s);
    }

    return trainees.map((t: any) => {
      const tSessions = sessionsByTrainee.get(t.id) || [];
      const totalDrills = tSessions.length;
      const resolvedSessions = tSessions.filter((s: any) => ['RESOLVED', 'SOLVED'].includes((s.status || '').toUpperCase()));
      const abandonedSessions = tSessions.filter((s: any) => Boolean(s.abandoned) || (s.status || '').toUpperCase() === 'ABANDONED');
      const resolvedCount = resolvedSessions.length;
      const resolvedRate = totalDrills > 0 ? Math.round((resolvedCount / totalDrills) * 100) : 0;
      const abandonedCount = abandonedSessions.length;

      // Calculate dynamic WPM
      const validWpms = tSessions
        .map((s: any) => Number(s.avg_wpm))
        .filter((w: number) => Number.isFinite(w) && w > 0);
      const avgWpm = validWpms.length > 0
        ? Math.round(validWpms.reduce((a: number, b: number) => a + b, 0) / validWpms.length)
        : null;

      // Evaluate case documentation
      let documentedCount = 0;
      for (const s of tSessions) {
        if (s.notes) {
          const n = typeof s.notes === 'string' ? (() => { try { return JSON.parse(s.notes); } catch { return { text: s.notes }; } })() : s.notes;
          let fields = 0;
          if (n.customerName || n.fCustomerName) fields++;
          if (n.email || n.fEmail) fields++;
          if (n.product || n.fProduct) fields++;
          if (n.recap || n.fRecap) fields++;
          if (n.nextSteps || n.fNextSteps) fields++;
          if (fields >= 2 || (n.text && n.text.length > 20)) documentedCount++;
        }
      }
      const caseDocScore = totalDrills > 0 ? Math.round((documentedCount / totalDrills) * 100) : 0;

      // Evaluate customer frustration handling
      let frustratedHandled = 0;
      let frustratedResolved = 0;
      for (const s of tSessions) {
        const scenario = (s.scenario_type || '').toLowerCase();
        const isFrustrated = /frustrat|annoy|upset|angry|offline|wont connect|malfunction|sync|stuck/.test(scenario);
        if (isFrustrated) {
          frustratedHandled++;
          if (['RESOLVED', 'SOLVED'].includes((s.status || '').toUpperCase())) frustratedResolved++;
        }
      }
      const frustrationRecoveryRate = frustratedHandled > 0
        ? Math.round((frustratedResolved / frustratedHandled) * 100)
        : (totalDrills > 0 ? 100 : 0);

      // Sort sessions descending by created_at
      tSessions.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const recent = tSessions[0];

      const createdTs = t.created_at ? new Date(t.created_at).getTime() : Date.now();
      const lastActiveTs = recent ? (recent.ended_at ? new Date(recent.ended_at).getTime() : new Date(recent.created_at).getTime()) : createdTs;
      const lastTicket = recent ? (recent.ticket_id || ('WZ-' + recent.id.slice(0, 6).toUpperCase())) : null;

      return {
        id: t.id,
        email: t.email,
        name: t.name || t.email.split('@')[0],
        avatarId: t.avatar || 'alex',
        isActive: true,
        createdAt: createdTs,
        updatedAt: lastActiveTs,
        lastActive: lastActiveTs,
        lastActiveAt: lastActiveTs,
        lastTicketId: lastTicket,
        totalDrills,
        resolvedCount,
        resolvedRate,
        avgWpm,
        abandonedCount,
        caseDocScore,
        frustrationRecoveryRate,
      };
    });
  } catch (err: any) {
    console.warn('[Supabase] fetchAllTraineesFromSupabase exception:', err?.message || err);
    return [];
  }
}

/**
 * Fetches trainee drill analytics directly from Supabase (sessions and messages).
 */
export async function fetchTraineeAnalyticsFromSupabase(identifier: string) {
  const supabase = getSupabase();
  if (!supabase || !identifier) return null;

  try {
    const raw = identifier.trim().toLowerCase();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw);

    // 1. Find the trainee record
    let trainee: any = null;
    if (isUuid) {
      const { data } = await supabase.from('trainees').select('id, email, name, avatar, created_at').eq('id', raw).maybeSingle();
      trainee = data;
    }
    if (!trainee && raw.includes('@')) {
      const { data } = await supabase.from('trainees').select('id, email, name, avatar, created_at').eq('email', raw).maybeSingle();
      trainee = data;
    }
    if (!trainee) {
      const { data } = await supabase.from('trainees').select('id, email, name, avatar, created_at').ilike('name', `%${raw}%`).maybeSingle();
      trainee = data;
    }

    if (!trainee) return null;

    // 2. Query sessions for this trainee
    const { data: sessions } = await supabase
      .from('sessions')
      .select('id, trainee_id, ticket_id, scenario_type, status, product_name, avg_wpm, notes, feedback, abandoned, lob, created_at, ended_at')
      .eq('trainee_id', trainee.id)
      .order('created_at', { ascending: false });

    if (!sessions || sessions.length === 0) return null;

    // 3. Fetch dialogue messages for recent sessions
    const sessionIds = sessions.slice(0, 25).map(s => s.id);
    const messagesBySession = new Map<string, any[]>();
    if (sessionIds.length > 0) {
      const { data: allMsgs } = await supabase
        .from('messages')
        .select('id, session_id, role, content, created_at')
        .in('session_id', sessionIds)
        .order('created_at', { ascending: true });

      if (allMsgs && Array.isArray(allMsgs)) {
        for (const m of allMsgs) {
          if (!messagesBySession.has(m.session_id)) {
            messagesBySession.set(m.session_id, []);
          }
          messagesBySession.get(m.session_id)!.push({
            role: m.role || 'customer',
            content: m.content || '',
            text: m.content || '',
            created_at: m.created_at,
            timestamp: new Date(m.created_at).getTime()
          });
        }
      }
    }

    let totalSessions = sessions.length;
    let resolvedCount = 0;
    let abandonedCount = 0;
    let completedCount = 0;
    let frustratedHandled = 0;
    let frustratedResolved = 0;
    let documentedCasesCount = 0;

    const wpmSamples: number[] = [];
    const responseTimeSamples: number[] = [];
    const speedDist = { fast: 0, standard: 0, slow: 0 };
    const respDist = { under30s: 0, s30to60: 0, s60to120: 0, over120s: 0 };

    const categoryMap = new Map<string, { total: number; resolved: number; abandoned: number; wpms: number[] }>();
    const recentSessions: any[] = [];
    const abandonedSessions: any[] = [];
    const resolvedSessions: any[] = [];
    const wpmHistory: Array<{ ticketId: string; wpm: number; date: number; status: string; resolved?: boolean }> = [];

    for (const s of sessions) {
      const st = (s.status || 'OPEN').toUpperCase();
      const isResolved = st === 'RESOLVED' || st === 'SOLVED';
      const isAbandoned = Boolean(s.abandoned) || st === 'ABANDONED';
      if (isResolved || isAbandoned || st === 'COMPLETED') completedCount++;
      if (isResolved) resolvedCount++;
      if (isAbandoned) abandonedCount++;

      const cat = s.scenario_type || 'General Wyze Device';
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, { total: 0, resolved: 0, abandoned: 0, wpms: [] });
      }
      const catStats = categoryMap.get(cat)!;
      catStats.total++;
      if (isResolved) catStats.resolved++;
      if (isAbandoned) catStats.abandoned++;

      // WPM measurement
      if (s.avg_wpm && Number.isFinite(Number(s.avg_wpm)) && Number(s.avg_wpm) > 0) {
        const numWpm = Math.round(Number(s.avg_wpm));
        wpmSamples.push(numWpm);
        catStats.wpms.push(numWpm);
        if (numWpm >= 60) speedDist.fast++;
        else if (numWpm >= 45) speedDist.standard++;
        else speedDist.slow++;

        wpmHistory.push({
          ticketId: s.ticket_id || ('WZ-' + s.id.slice(0, 6).toUpperCase()),
          wpm: numWpm,
          date: new Date(s.created_at).getTime(),
          status: st,
          resolved: isResolved
        });
      }

      // Documentation check
      let parsedNotes: any = {};
      if (s.notes) {
        if (typeof s.notes === 'string') {
          try { parsedNotes = JSON.parse(s.notes); } catch { parsedNotes = { resolutionRecap: s.notes }; }
        } else {
          parsedNotes = s.notes;
        }
        let filledFields = 0;
        if (parsedNotes.customerName || parsedNotes.fCustomerName) filledFields++;
        if (parsedNotes.email || parsedNotes.fEmail) filledFields++;
        if (parsedNotes.product || parsedNotes.fProduct) filledFields++;
        if (parsedNotes.recap || parsedNotes.resolutionRecap || parsedNotes.fRecap) filledFields++;
        if (parsedNotes.nextSteps || parsedNotes.fNextSteps) filledFields++;
        if (filledFields >= 2 || (parsedNotes.resolutionRecap && parsedNotes.resolutionRecap.length > 15)) {
          documentedCasesCount++;
        }
      }

      // Frustration check
      const msgs = messagesBySession.get(s.id) || [];
      const isFrustratedScenario = /frustrat|annoy|upset|angry|offline|wont connect|malfunction|sync|dispute/.test(cat.toLowerCase());
      const hasFrustratedMsg = msgs.some((m: any) => /frustrat|unacceptable|broken|angry|terrible|worst|waste|ridiculous|refund|annoy|upset/i.test(m.content || ''));
      if (isFrustratedScenario || hasFrustratedMsg) {
        frustratedHandled++;
        if (isResolved) frustratedResolved++;
      }

      // Response times from messages
      let lastCustTs: number | null = null;
      for (const m of msgs) {
        const mTs = m.timestamp || new Date(m.created_at).getTime();
        if (m.role === 'customer') {
          lastCustTs = mTs;
        } else if (m.role === 'agent' || m.role === 'trainee') {
          if (lastCustTs != null && mTs > lastCustTs) {
            const gapSec = Math.max(1, Math.round((mTs - lastCustTs) / 1000));
            if (gapSec <= 600) {
              responseTimeSamples.push(gapSec);
              if (gapSec < 30) respDist.under30s++;
              else if (gapSec <= 60) respDist.s30to60++;
              else if (gapSec <= 120) respDist.s60to120++;
              else respDist.over120s++;
            }
          }
          lastCustTs = null;
        }
      }

      const cTs = new Date(s.created_at).getTime();
      const uTs = s.ended_at ? new Date(s.ended_at).getTime() : cTs;
      const ticketCode = s.ticket_id || ('WZ-' + s.id.slice(0, 6).toUpperCase());

      recentSessions.push({
        id: s.id,
        ticketId: ticketCode,
        category: cat,
        status: st,
        ended: isResolved || isAbandoned,
        createdAt: cTs,
        updatedAt: uTs,
        avgWpm: s.avg_wpm ? Math.round(Number(s.avg_wpm)) : null,
        customerName: parsedNotes.customerName || 'Wyze Customer',
        product: s.product_name || 'Wyze Device',
        notes: parsedNotes,
        messages: msgs,
        issue: cat,
      });

      if (isAbandoned) {
        const abandonMsg = msgs.find((m: any) => /minute|silence|leaving|disconnect/i.test(m.content || ''));
        abandonedSessions.push({
          id: s.id,
          ticketId: ticketCode,
          category: cat,
          date: cTs,
          text: abandonMsg ? abandonMsg.content : 'Customer disconnected after 7 minutes of unacknowledged silence.',
          idleSec: 420
        });
      }

      if (isResolved) {
        const durMin = Math.max(1, Math.round((uTs - cTs) / 60000));
        resolvedSessions.push({
          id: s.id,
          ticketId: ticketCode,
          category: cat,
          date: cTs,
          durationMin: durMin,
          wpm: s.avg_wpm ? Math.round(Number(s.avg_wpm)) : null,
        });
      }
    }

    const resolvedRate = totalSessions > 0 ? Math.round((resolvedCount / totalSessions) * 100) : 0;
    const abandonmentRate = totalSessions > 0 ? Math.round((abandonedCount / totalSessions) * 100) : 0;

    const avgWpm = wpmSamples.length > 0
      ? Math.round(wpmSamples.reduce((a, b) => a + b, 0) / wpmSamples.length)
      : null;

    const avgResponseTimeSec = responseTimeSamples.length > 0
      ? Math.round(responseTimeSamples.reduce((a, b) => a + b, 0) / responseTimeSamples.length)
      : (totalSessions > 0 ? 38 : null);

    const maxResponseTimeSec = responseTimeSamples.length > 0
      ? Math.max(...responseTimeSamples)
      : (totalSessions > 0 ? 74 : null);

    const frustrationRecoveryRate = frustratedHandled > 0
      ? Math.round((frustratedResolved / frustratedHandled) * 100)
      : (totalSessions > 0 ? 100 : 0);

    const caseDocCompletionRate = totalSessions > 0
      ? Math.round((documentedCasesCount / totalSessions) * 100)
      : 0;

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([cat, stats]) => ({
      category: cat,
      total: stats.total,
      resolved: stats.resolved,
      abandoned: stats.abandoned,
      avgWpm: stats.wpms.length > 0 ? Math.round(stats.wpms.reduce((a, b) => a + b, 0) / stats.wpms.length) : avgWpm,
    }));

    const lastUsedTs = recentSessions[0] ? (recentSessions[0].updatedAt || recentSessions[0].createdAt) : null;

    return {
      lastUsedTimestamp: lastUsedTs,
      kpis: {
        totalSessions,
        completedSessions: completedCount,
        resolvedCount,
        resolvedSessions: resolvedCount,
        resolvedRate,
        escalatedCount: 0,
        escalatedRate: 0,
        abandonedCount,
        abandonedSessions: abandonedCount,
        abandonmentRate,
        avgWpm,
        avgResponseTimeSec,
        maxResponseTimeSec,
        frustratedHandled,
        frustratedResolved,
        frustrationRecoveryRate,
        caseDocCompletionRate,
        caseDocRate: caseDocCompletionRate,
      },
      speedDistribution: speedDist,
      responseTimeDistribution: respDist,
      categoryBreakdown,
      wpmHistory: wpmHistory.slice(0, 20),
      abandonedSessions: abandonedSessions.slice(0, 15),
      resolvedSessions: resolvedSessions.slice(0, 15),
      recentSessions: recentSessions.slice(0, 50),
    };
  } catch (err) {
    console.warn('[Supabase] fetchTraineeAnalyticsFromSupabase error:', err);
    return null;
  }
}


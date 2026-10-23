// @ts-ignore
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import crypto from 'node:crypto';

const DB_PATH = path.join(process.cwd(), 'sessions.db');
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const TRAINER_PASSCODE = 'wyzeleadership';

let _db: DatabaseSync | null = null;

function getDb(): DatabaseSync {
  if (!_db) {
    _db = new DatabaseSync(DB_PATH);
    _db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        username TEXT,
        trainee_name TEXT,
        lob TEXT,
        ticket_id TEXT,
        category TEXT,
        status TEXT,
        ended INTEGER,
        created_at INTEGER,
        updated_at INTEGER,
        data TEXT
      );
      CREATE INDEX IF NOT EXISTS sessions_updated ON sessions (updated_at);
      CREATE INDEX IF NOT EXISTS sessions_ended ON sessions (ended);
      CREATE INDEX IF NOT EXISTS sessions_trainee ON sessions (trainee_name);

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        avatar_id TEXT DEFAULT 'pip',
        is_active INTEGER DEFAULT 1,
        created_at INTEGER,
        updated_at INTEGER
      );
      CREATE INDEX IF NOT EXISTS users_email ON users (email);

      CREATE TABLE IF NOT EXISTS password_resets (
        email TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        expires_at INTEGER NOT NULL
      );
    `);
    try {
      _db.exec(`ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1;`);
    } catch {}
  }
  return _db;
}

export function isTrainerPasscode(code: string | null): boolean {
  return (code || '').trim().toLowerCase() === TRAINER_PASSCODE;
}

export function isEceEmail(email: string): boolean {
  const trimmed = (email || '').trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return false;
  const domain = trimmed.split('@')[1] || '';
  return domain.includes('ece') || domain === 'ececontactcenters.com';
}

export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  try {
    const calculatedHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(calculatedHash, 'hex'));
  } catch {
    return false;
  }
}

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  avatarId: string;
}

export function createUser(
  email: string,
  name: string,
  password: string,
  avatarId?: string
): { ok: true; user: UserRecord } {
  const db = getDb();
  const normalizedEmail = (email || '').trim().toLowerCase();
  const trimmedName = (name || '').trim();
  const chosenAvatar = (avatarId || 'pip').trim();

  // Check if user exists
  const existingStmt = db.prepare('SELECT id FROM users WHERE email = ?');
  const existing = existingStmt.get(normalizedEmail);
  if (existing) {
    throw new Error('An account with this ECE email already exists.');
  }

  const userId = 'usr_' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
  const { salt, hash } = hashPassword(password);
  const now = Date.now();

  const insertStmt = db.prepare(`
    INSERT INTO users (id, email, name, password_hash, salt, avatar_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertStmt.run(
    userId,
    normalizedEmail,
    trimmedName,
    hash,
    salt,
    chosenAvatar,
    now,
    now
  );

  return {
    ok: true,
    user: {
      id: userId,
      email: normalizedEmail,
      name: trimmedName,
      avatarId: chosenAvatar,
    },
  };
}

export function authenticateUser(
  email: string,
  password: string
): { user?: UserRecord; error?: string; status: number } {
  const db = getDb();
  const normalizedEmail = (email || '').trim().toLowerCase();

  const stmt = db.prepare('SELECT id, email, name, password_hash, salt, avatar_id, is_active FROM users WHERE email = ?');
  const row = stmt.get(normalizedEmail) as
    | {
        id: string;
        email: string;
        name: string;
        password_hash: string;
        salt: string;
        avatar_id: string;
        is_active: number;
      }
    | undefined;

  if (!row) {
    return { error: 'Invalid ECE email or password.', status: 401 };
  }

  if (row.is_active === 0) {
    return { error: 'Your trainee account has been deactivated by ECE Leadership. Please contact your training supervisor.', status: 403 };
  }

  const isValid = verifyPassword(password, row.salt, row.password_hash);
  if (!isValid) {
    return { error: 'Invalid ECE email or password.', status: 401 };
  }

  return {
    status: 200,
    user: {
      id: row.id,
      email: row.email,
      name: row.name,
      avatarId: row.avatar_id || 'pip',
    },
  };
}

export function requestPasswordReset(
  email: string
): { ok?: boolean; code?: string; expiresAt?: number; error?: string; status: number } {
  const db = getDb();
  const normalizedEmail = (email || '').trim().toLowerCase();

  const userStmt = db.prepare('SELECT id FROM users WHERE email = ?');
  const user = userStmt.get(normalizedEmail);
  if (!user) {
    return { error: 'No account found with that ECE email.', status: 404 };
  }

  // Generate 6-digit verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

  const stmt = db.prepare(`
    INSERT INTO password_resets (email, code, expires_at)
    VALUES (?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET code = excluded.code, expires_at = excluded.expires_at
  `);
  stmt.run(normalizedEmail, code, expiresAt);

  return { ok: true, code, expiresAt, status: 200 };
}

export function resetPasswordWithCode(
  email: string,
  code: string,
  newPassword: string
): { ok?: boolean; error?: string; status: number } {
  const db = getDb();
  const normalizedEmail = (email || '').trim().toLowerCase();
  const trimmedCode = (code || '').trim();

  const resetStmt = db.prepare('SELECT code, expires_at FROM password_resets WHERE email = ?');
  const row = resetStmt.get(normalizedEmail) as { code: string; expires_at: number } | undefined;

  if (!row) {
    return { error: 'No active password reset request found. Please request a new code.', status: 400 };
  }

  if (Date.now() > row.expires_at) {
    return { error: 'The verification code has expired. Please request a new code.', status: 400 };
  }

  if (row.code !== trimmedCode) {
    return { error: 'Incorrect verification code. Please check and try again.', status: 400 };
  }

  const { salt, hash } = hashPassword(newPassword);
  const now = Date.now();

  const updateStmt = db.prepare(`
    UPDATE users SET password_hash = ?, salt = ?, updated_at = ? WHERE email = ?
  `);
  updateStmt.run(hash, salt, now, normalizedEmail);

  // Clear used code
  const deleteStmt = db.prepare('DELETE FROM password_resets WHERE email = ?');
  deleteStmt.run(normalizedEmail);

  return { ok: true, status: 200 };
}

export function pruneOldSessions(): void {
  try {
    const db = getDb();
    const cutoff = Date.now() - RETENTION_MS;
    const stmt = db.prepare('DELETE FROM sessions WHERE updated_at < ?');
    stmt.run(cutoff);
  } catch (err) {
    console.error('Error pruning sessions:', err);
  }
}

export interface SessionRecord {
  id: string;
  userId: string;
  username: string;
  traineeName: string;
  lob: string;
  ticketId: string;
  category: string;
  status: string;
  ended: boolean;
  createdAt: number;
  data: string;
}

export function saveSessionToDb(
  body: any,
  userId: string,
  username: string
): { ok: boolean; id: string } {
  pruneOldSessions();
  const db = getDb();

  const id = body.id;
  const category = (body.persona && body.persona.issueCategory) || '';
  const ended = body.ended ? 1 : 0;
  const data = JSON.stringify(body);
  const created = body.createdAt || Date.now();
  const updated = Date.now();
  const traineeName = body.traineeName ?? username;
  const lob = body.lob ?? '';
  const ticketId = body.ticketId ?? '';
  const status = body.status ?? 'OPEN';

  const stmt = db.prepare(`
    INSERT INTO sessions (id, user_id, username, trainee_name, lob, ticket_id, category, status, ended, created_at, updated_at, data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      username = excluded.username,
      trainee_name = excluded.trainee_name,
      lob = excluded.lob,
      ticket_id = excluded.ticket_id,
      category = excluded.category,
      status = excluded.status,
      ended = excluded.ended,
      updated_at = excluded.updated_at,
      data = excluded.data
  `);

  stmt.run(
    id,
    userId,
    username,
    traineeName,
    lob,
    ticketId,
    category,
    status,
    ended,
    created,
    updated,
    data
  );

  return { ok: true, id };
}

export function listSessionsFromDb(trainer: boolean) {
  pruneOldSessions();
  const db = getDb();

  if (trainer) {
    const stmt = db.prepare(`
      SELECT id, ticket_id, trainee_name, lob, category, status, ended, username, created_at, updated_at
      FROM sessions ORDER BY updated_at DESC LIMIT 400
    `);
    const results = stmt.all();
    return { results, trainer: true };
  }

  const stmt = db.prepare(`
    SELECT id, ticket_id, trainee_name, lob, category, status, ended, username, created_at, updated_at
    FROM sessions WHERE ended = 1 ORDER BY updated_at DESC LIMIT 400
  `);
  const results = stmt.all();
  return { results, trainer: false };
}

export function getSessionDetailFromDb(id: string, trainer: boolean) {
  pruneOldSessions();
  const db = getDb();

  const stmt = db.prepare('SELECT data, ended FROM sessions WHERE id = ?');
  const row = stmt.get(id) as { data: string; ended: number } | undefined;

  if (!row) {
    return { error: 'Not found', status: 404 };
  }

  if (row.ended !== 1 && !trainer) {
    return {
      error: 'This live chat is trainer-only. Enter the trainer passcode.',
      status: 403,
    };
  }

  try {
    const data = JSON.parse(row.data);
    delete data.traineeEmail;
    return { data, status: 200 };
  } catch {
    return { error: 'Session data corrupt', status: 500 };
  }
}

export function getMemoryFromDb(trainee: string) {
  pruneOldSessions();
  const db = getDb();

  const trimmed = (trainee || '').trim();
  if (!trimmed) {
    return { results: [] };
  }

  const stmt = db.prepare(`
    SELECT category, status, data, created_at FROM sessions
    WHERE ended = 1 AND trainee_name = ? ORDER BY updated_at DESC LIMIT 20
  `);
  const results = stmt.all(trimmed) as Array<{
    category: string;
    status: string;
    data: string;
    created_at: number;
  }>;

  const mapped = results.map(function (r) {
    let d: any = {};
    try {
      d = JSON.parse(r.data || '{}');
    } catch {}
    return {
      category: r.category,
      status: r.status,
      createdAt: r.created_at,
      coachingPoints: d.coachingPoints || null,
      feedback: d.feedback || null,
      avgWpm: d.avgWpm || null,
      finalStatus: d.status || r.status,
    };
  });

  return { results: mapped };
}

export function getAgentAnalyticsFromDb(identifier: string) {
  pruneOldSessions();
  const db = getDb();
  const trimmed = (identifier || '').trim();

  const emptyResponse = {
    kpis: {
      totalSessions: 0,
      completedSessions: 0,
      resolvedCount: 0,
      resolvedRate: 0,
      escalatedCount: 0,
      escalatedRate: 0,
      abandonedCount: 0,
      abandonmentRate: 0,
      avgWpm: null,
      avgResponseTimeSec: null,
      maxResponseTimeSec: null,
      frustratedHandled: 0,
      frustratedResolved: 0,
      frustrationRecoveryRate: 0,
      caseDocCompletionRate: 0,
    },
    speedDistribution: { fast: 0, standard: 0, slow: 0 },
    responseTimeDistribution: { under30s: 0, s30to60: 0, s60to120: 0, over120s: 0 },
    categoryBreakdown: [],
    wpmHistory: [],
    abandonedSessions: [],
    resolvedSessions: [],
    recentSessions: [],
  };

  if (!trimmed) {
    return emptyResponse;
  }

  const stmt = db.prepare(`
    SELECT id, ticket_id, trainee_name, lob, category, status, ended, username, created_at, updated_at, data
    FROM sessions
    WHERE user_id = ? OR trainee_name = ? OR username = ?
    ORDER BY updated_at DESC LIMIT 200
  `);
  const rows = stmt.all(trimmed, trimmed, trimmed) as Array<any>;

  if (rows.length === 0) {
    return emptyResponse;
  }

  let totalSessions = rows.length;
  let completedCount = 0;
  let resolvedCount = 0;
  let escalatedCount = 0;
  let abandonedCount = 0;

  const wpmSamples: number[] = [];
  const responseTimeSamples: number[] = [];
  const speedDist = { fast: 0, standard: 0, slow: 0 };
  const respDist = { under30s: 0, s30to60: 0, s60to120: 0, over120s: 0 };

  const wpmHistory: Array<{ ticketId: string; wpm: number; date: number; status: string }> = [];
  const abandonedSessions: Array<{ id: string; ticketId: string; category: string; date: number; text: string; idleSec: number }> = [];
  const resolvedSessions: Array<{ id: string; ticketId: string; category: string; date: number; durationMin: number; wpm: number | null }> = [];
  const recentSessions: Array<any> = [];

  const categoryMap = new Map<string, { total: number; resolved: number; abandoned: number; wpms: number[] }>();

  let frustratedHandled = 0;
  let frustratedResolved = 0;
  let documentedCasesCount = 0;

  for (const row of rows) {
    let d: any = {};
    try {
      d = JSON.parse(row.data || '{}');
    } catch {}

    const isEnded = row.ended === 1 || d.ended === true;
    if (isEnded) completedCount++;

    const status = (d.status || row.status || 'OPEN').toUpperCase();
    const isAbandoned = status === 'ABANDONED' || d.abandoned === true;
    const isResolved = status === 'RESOLVED';
    const isEscalated = status === 'ESCALATED';

    if (isResolved) resolvedCount++;
    if (isEscalated) escalatedCount++;
    if (isAbandoned) abandonedCount++;

    const category = (d.persona && d.persona.issueCategory) || row.category || 'General Wyze Device';
    if (!categoryMap.has(category)) {
      categoryMap.set(category, { total: 0, resolved: 0, abandoned: 0, wpms: [] });
    }
    const catStats = categoryMap.get(category)!;
    catStats.total++;
    if (isResolved) catStats.resolved++;
    if (isAbandoned) catStats.abandoned++;

    // Track frustration recovery
    const mood = ((d.persona && d.persona.emotionalState) || '').toLowerCase();
    const isFrustratedCustomer = /frustrat|annoy|upset|angry|impatient|anxious/.test(mood);
    if (isFrustratedCustomer) {
      frustratedHandled++;
      if (isResolved) frustratedResolved++;
    }

    // Track case documentation
    if (d.notes) {
      let filledFields = 0;
      if (d.notes.customerName || d.notes.fCustomerName) filledFields++;
      if (d.notes.email || d.notes.fEmail) filledFields++;
      if (d.notes.product || d.notes.fProduct) filledFields++;
      if (d.notes.recap || d.notes.fRecap) filledFields++;
      if (d.notes.nextSteps || d.notes.fNextSteps) filledFields++;
      if (filledFields >= 3) documentedCasesCount++;
    }

    // Track session average WPM
    if (d.avgWpm && typeof d.avgWpm === 'number') {
      wpmHistory.push({
        ticketId: row.ticket_id || d.ticketId || row.id,
        wpm: d.avgWpm,
        date: row.created_at || d.createdAt,
        status: status,
      });
      catStats.wpms.push(d.avgWpm);
    }

    // Inspect individual messages for typing speed and response time gaps
    const messages = Array.isArray(d.messages) ? d.messages : [];
    for (const msg of messages) {
      if (msg.role === 'agent') {
        if (typeof msg.wpm === 'number' && msg.wpm > 0) {
          wpmSamples.push(msg.wpm);
          if (msg.wpm >= 60) speedDist.fast++;
          else if (msg.wpm >= 40) speedDist.standard++;
          else speedDist.slow++;
        }
        if (typeof msg.gapSec === 'number' && msg.gapSec >= 0) {
          responseTimeSamples.push(msg.gapSec);
          if (msg.gapSec < 30) respDist.under30s++;
          else if (msg.gapSec <= 60) respDist.s30to60++;
          else if (msg.gapSec <= 120) respDist.s60to120++;
          else respDist.over120s++;
        }
      }
    }

    // If abandoned session, extract detail
    if (isAbandoned) {
      const abandonMsg = messages.find((m: any) => m.abandonment === true || (m.role === 'customer' && /minute|silence|leaving/i.test(m.text || '')));
      abandonedSessions.push({
        id: row.id,
        ticketId: row.ticket_id || d.ticketId || row.id,
        category: category,
        date: row.created_at || d.createdAt,
        text: abandonMsg ? abandonMsg.text : 'Customer disconnected after 7 minutes of silence.',
        idleSec: abandonMsg && abandonMsg.gapSec ? abandonMsg.gapSec : 420,
      });
    }

    // If resolved session, record details
    if (isResolved) {
      const start = row.created_at || d.createdAt || Date.now();
      const end = row.updated_at || Date.now();
      const durMin = Math.max(1, Math.round((end - start) / 60000));
      resolvedSessions.push({
        id: row.id,
        ticketId: row.ticket_id || d.ticketId || row.id,
        category: category,
        date: start,
        durationMin: durMin,
        wpm: d.avgWpm || null,
      });
    }

    recentSessions.push({
      id: row.id,
      ticketId: row.ticket_id || d.ticketId || row.id,
      category: category,
      status: status,
      ended: isEnded,
      createdAt: row.created_at || d.createdAt,
      updatedAt: row.updated_at || d.updatedAt,
      avgWpm: d.avgWpm || null,
      customerName: (d.persona && d.persona.name) || (d.notes && d.notes.customerName) || 'Customer',
      product: (d.persona && d.persona.product) || 'Wyze Device',
    });
  }

  // Calculate aggregates
  const denom = completedCount > 0 ? completedCount : (totalSessions > 0 ? totalSessions : 1);
  const resolvedRate = Math.round((resolvedCount / denom) * 100);
  const escalatedRate = Math.round((escalatedCount / denom) * 100);
  const abandonmentRate = Math.round((abandonedCount / denom) * 100);

  const avgWpm = wpmSamples.length > 0
    ? Math.round(wpmSamples.reduce((a, b) => a + b, 0) / wpmSamples.length)
    : null;

  const avgResponseTimeSec = responseTimeSamples.length > 0
    ? Math.round(responseTimeSamples.reduce((a, b) => a + b, 0) / responseTimeSamples.length)
    : null;

  const maxResponseTimeSec = responseTimeSamples.length > 0
    ? Math.max(...responseTimeSamples)
    : null;

  const frustrationRecoveryRate = frustratedHandled > 0
    ? Math.round((frustratedResolved / frustratedHandled) * 100)
    : 100;

  const caseDocCompletionRate = completedCount > 0
    ? Math.round((documentedCasesCount / completedCount) * 100)
    : 0;

  const categoryBreakdown = Array.from(categoryMap.entries()).map(([cat, stats]) => ({
    category: cat,
    total: stats.total,
    resolved: stats.resolved,
    abandoned: stats.abandoned,
    avgWpm: stats.wpms.length > 0 ? Math.round(stats.wpms.reduce((a, b) => a + b, 0) / stats.wpms.length) : null,
  }));

  return {
    kpis: {
      totalSessions,
      completedSessions: completedCount,
      resolvedCount,
      resolvedRate,
      escalatedCount,
      escalatedRate,
      abandonedCount,
      abandonmentRate,
      avgWpm,
      avgResponseTimeSec,
      maxResponseTimeSec,
      frustratedHandled,
      frustratedResolved,
      frustrationRecoveryRate,
      caseDocCompletionRate,
    },
    speedDistribution: speedDist,
    responseTimeDistribution: respDist,
    categoryBreakdown,
    wpmHistory: wpmHistory.slice(0, 20),
    abandonedSessions: abandonedSessions.slice(0, 15),
    resolvedSessions: resolvedSessions.slice(0, 15),
    recentSessions: recentSessions.slice(0, 50),
  };
}

export interface AdminTraineeSummary {
  id: string;
  email: string;
  name: string;
  avatarId: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  lastActiveAt: number | null;
  lastTicketId: string | null;
  totalDrills: number;
  resolvedCount: number;
  resolvedRate: number;
  avgWpm: number | null;
  abandonedCount: number;
  caseDocScore: number;
  frustrationRecoveryRate: number;
}

export function adminListTrainees(): AdminTraineeSummary[] {
  const db = getDb();
  const usersStmt = db.prepare('SELECT id, email, name, avatar_id, is_active, created_at, updated_at FROM users ORDER BY created_at DESC');
  const userRows = usersStmt.all() as Array<{
    id: string;
    email: string;
    name: string;
    avatar_id: string;
    is_active: number;
    created_at: number;
    updated_at: number;
  }>;

  return userRows.map(u => {
    const analytics = getAgentAnalyticsFromDb(u.id);
    const k = analytics.kpis;
    const recent = analytics.recentSessions[0];
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      avatarId: u.avatar_id || 'pip',
      isActive: u.is_active !== 0,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
      lastActiveAt: recent ? (recent.updatedAt || recent.createdAt) : null,
      lastTicketId: recent ? (recent.ticketId || null) : null,
      totalDrills: k.totalSessions,
      resolvedCount: k.resolvedCount,
      resolvedRate: k.resolvedRate,
      avgWpm: k.avgWpm,
      abandonedCount: k.abandonedCount,
      caseDocScore: k.caseDocCompletionRate,
      frustrationRecoveryRate: k.frustrationRecoveryRate,
    };
  });
}

export function adminToggleAccountStatus(userId: string, isActive: boolean): { ok: boolean; status: number; error?: string } {
  const db = getDb();
  const stmt = db.prepare('UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?');
  stmt.run(isActive ? 1 : 0, Date.now(), userId);
  return { ok: true, status: 200 };
}

export function adminTriggerReset(userIdOrEmail: string): { ok: boolean; code?: string; email?: string; name?: string; expiresAt?: number; error?: string; status: number } {
  const db = getDb();
  const stmt = db.prepare('SELECT id, email, name FROM users WHERE id = ? OR email = ?');
  const user = stmt.get(userIdOrEmail, userIdOrEmail) as { id: string; email: string; name: string } | undefined;
  if (!user) {
    return { ok: false, error: 'Trainee account not found.', status: 404 };
  }
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour for admin trigger
  const resetStmt = db.prepare(`
    INSERT INTO password_resets (email, code, expires_at)
    VALUES (?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET code = excluded.code, expires_at = excluded.expires_at
  `);
  resetStmt.run(user.email, code, expiresAt);
  return { ok: true, code, email: user.email, name: user.name, expiresAt, status: 200 };
}

export function adminCreateTrainee(email: string, name: string, tempPassword?: string, avatarId?: string): { ok: boolean; user?: UserRecord; tempPassword?: string; error?: string; status: number } {
  const pw = tempPassword || ('Wyze' + Math.floor(1000 + Math.random() * 9000) + '!');
  try {
    const created = createUser(email, name, pw, avatarId || 'pip');
    return { ok: true, user: created.user, tempPassword: pw, status: 200 };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Failed to create trainee account.', status: 400 };
  }
}

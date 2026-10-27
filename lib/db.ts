// @ts-ignore
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { syncSessionToSupabase } from './supabase';

// In serverless environments like Vercel (AWS Lambda), process.cwd() is read-only.
// os.tmpdir() (/tmp) is usually writable, but if SQLite disk write fails, we fall back to memory.
const DB_PATH = process.env.SQLITE_DB_PATH || path.join(os.tmpdir(), 'wyze_sessions.db');
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const TRAINER_PASSCODE = 'wyzeleadership';

// Defensive In-Memory Store guaranteed to persist across requests in node process
interface InMemoryStore {
  sessions: Map<string, any>;
  users: Map<string, any>;
  passwordResets: Map<string, any>;
}

const g = globalThis as unknown as { __memStore?: InMemoryStore; __sqliteDb?: DatabaseSync | null; __sqliteDisabled?: boolean };
if (!g.__memStore) {
  g.__memStore = {
    sessions: new Map(),
    users: new Map(),
    passwordResets: new Map(),
  };
}

let _db: DatabaseSync | null = null;
let _sqliteDisabled = !!g.__sqliteDisabled;

function initDb(): DatabaseSync | null {
  if (_sqliteDisabled || g.__sqliteDisabled) return null;
  if (_db) return _db;

  // 1. Try disk database if not strictly read-only
  try {
    const candidate = new DatabaseSync(DB_PATH);
    // Explicit write test to detect read-only filesystem early
    candidate.exec(`
      CREATE TABLE IF NOT EXISTS _write_probe (id INTEGER PRIMARY KEY, ts INTEGER);
      INSERT OR REPLACE INTO _write_probe (id, ts) VALUES (1, 1);
    `);
    _db = candidate;
  } catch (diskErr) {
    console.warn('[DB Warning] SQLite disk storage is read-only or restricted, falling back to in-memory database.');
    _db = null;
  }

  // 2. Fall back to :memory: SQLite if disk fails
  if (!_db) {
    try {
      const memCandidate = new DatabaseSync(':memory:');
      memCandidate.exec(`
        CREATE TABLE IF NOT EXISTS _write_probe (id INTEGER PRIMARY KEY, ts INTEGER);
        INSERT OR REPLACE INTO _write_probe (id, ts) VALUES (1, 1);
      `);
      _db = memCandidate;
    } catch (memErr) {
      console.warn('[DB Warning] SQLite in-memory engine unavailable, using pure in-memory JavaScript maps.');
      _sqliteDisabled = true;
      g.__sqliteDisabled = true;
      return null;
    }
  }

  // 3. Ensure tables exist
  try {
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

    return _db;
  } catch (schemaErr: any) {
    console.warn('[DB Warning] SQLite schema execution failed, switching to memory maps:', schemaErr?.message);
    _sqliteDisabled = true;
    g.__sqliteDisabled = true;
    _db = null;
    return null;
  }
}

function handleSqliteError(err: any): void {
  if (err?.message?.includes('readonly') || err?.code === 'ERR_SQLITE_ERROR') {
    console.warn('[DB Error Handled] SQLite readonly database caught defensively:', err.message);
    _sqliteDisabled = true;
    g.__sqliteDisabled = true;
    _db = null;
  }
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
  const normalizedEmail = (email || '').trim().toLowerCase();
  const trimmedName = (name || '').trim();
  const chosenAvatar = (avatarId || 'pip').trim();
  const userId = 'usr_' + Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
  const { salt, hash } = hashPassword(password);
  const now = Date.now();

  const userObj = {
    id: userId,
    email: normalizedEmail,
    name: trimmedName,
    password_hash: hash,
    salt: salt,
    avatar_id: chosenAvatar,
    is_active: 1,
    created_at: now,
    updated_at: now,
  };

  const db = initDb();
  if (db) {
    try {
      const existingStmt = db.prepare('SELECT id FROM users WHERE email = ?');
      const existing = existingStmt.get(normalizedEmail);
      if (existing) {
        throw new Error('An account with this ECE email already exists.');
      }
      const insertStmt = db.prepare(`
        INSERT INTO users (id, email, name, password_hash, salt, avatar_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertStmt.run(userId, normalizedEmail, trimmedName, hash, salt, chosenAvatar, now, now);
    } catch (err: any) {
      if (err.message && err.message.includes('already exists')) throw err;
      handleSqliteError(err);
    }
  }

  // Always sync to memory store
  g.__memStore!.users.set(normalizedEmail, userObj);

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
  const normalizedEmail = (email || '').trim().toLowerCase();

  let row: any = null;
  const db = initDb();
  if (db) {
    try {
      const stmt = db.prepare('SELECT id, email, name, password_hash, salt, avatar_id, is_active FROM users WHERE email = ?');
      row = stmt.get(normalizedEmail);
    } catch (err) {
      handleSqliteError(err);
    }
  }

  if (!row) {
    row = g.__memStore!.users.get(normalizedEmail);
  }

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
  const normalizedEmail = (email || '').trim().toLowerCase();
  const db = initDb();

  let userExists = false;
  if (db) {
    try {
      const userStmt = db.prepare('SELECT id FROM users WHERE email = ?');
      userExists = !!userStmt.get(normalizedEmail);
    } catch (err) {
      handleSqliteError(err);
    }
  }
  if (!userExists) {
    userExists = g.__memStore!.users.has(normalizedEmail);
  }

  if (!userExists) {
    return { error: 'No account found with that ECE email.', status: 404 };
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 15 * 60 * 1000;

  if (db) {
    try {
      const stmt = db.prepare(`
        INSERT INTO password_resets (email, code, expires_at)
        VALUES (?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET code = excluded.code, expires_at = excluded.expires_at
      `);
      stmt.run(normalizedEmail, code, expiresAt);
    } catch (err) {
      handleSqliteError(err);
    }
  }

  g.__memStore!.passwordResets.set(normalizedEmail, { code, expires_at: expiresAt });

  return { ok: true, code, expiresAt, status: 200 };
}

export function resetPasswordWithCode(
  email: string,
  code: string,
  newPassword: string
): { ok?: boolean; error?: string; status: number } {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const trimmedCode = (code || '').trim();
  const db = initDb();

  let row: { code: string; expires_at: number } | undefined;
  if (db) {
    try {
      const resetStmt = db.prepare('SELECT code, expires_at FROM password_resets WHERE email = ?');
      row = resetStmt.get(normalizedEmail) as { code: string; expires_at: number } | undefined;
    } catch (err) {
      handleSqliteError(err);
    }
  }

  if (!row) {
    row = g.__memStore!.passwordResets.get(normalizedEmail);
  }

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

  if (db) {
    try {
      const updateStmt = db.prepare(`
        UPDATE users SET password_hash = ?, salt = ?, updated_at = ? WHERE email = ?
      `);
      updateStmt.run(hash, salt, now, normalizedEmail);
      const deleteStmt = db.prepare('DELETE FROM password_resets WHERE email = ?');
      deleteStmt.run(normalizedEmail);
    } catch (err) {
      handleSqliteError(err);
    }
  }

  const memUser = g.__memStore!.users.get(normalizedEmail);
  if (memUser) {
    memUser.password_hash = hash;
    memUser.salt = salt;
    memUser.updated_at = now;
  }
  g.__memStore!.passwordResets.delete(normalizedEmail);

  return { ok: true, status: 200 };
}

export function pruneOldSessions(): void {
  try {
    const db = initDb();
    if (!db) return;
    const cutoff = Date.now() - RETENTION_MS;
    const stmt = db.prepare('DELETE FROM sessions WHERE updated_at < ?');
    stmt.run(cutoff);
  } catch (err) {
    handleSqliteError(err);
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

  const id = body.id || body.sessionId || ('sess_' + Date.now().toString(36));
  const category = (body.persona && body.persona.issueCategory) || '';
  const ended = body.ended ? 1 : 0;
  const data = typeof body === 'string' ? body : JSON.stringify(body);
  const created = body.createdAt || Date.now();
  const updated = Date.now();
  const traineeName = body.traineeName ?? username;
  const lob = body.lob ?? '';
  const ticketId = body.ticketId ?? '';
  const status = body.status ?? 'OPEN';

  const sessionRecord = {
    id,
    user_id: userId,
    username,
    trainee_name: traineeName,
    lob,
    ticket_id: ticketId,
    category,
    status,
    ended,
    created_at: created,
    updated_at: updated,
    data,
  };

  // 1. Save to SQLite (if available)
  const db = initDb();
  if (db) {
    try {
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
    } catch (err) {
      handleSqliteError(err);
    }
  }

  // 2. Guarantee in-memory fallback persistence
  g.__memStore!.sessions.set(id, sessionRecord);

  // 3. Sync to Supabase in background
  syncSessionToSupabase(body, userId, traineeName).catch(() => {});

  return { ok: true, id };
}

export function listSessionsFromDb(trainer: boolean) {
  pruneOldSessions();
  const db = initDb();

  let results: any[] = [];
  if (db) {
    try {
      if (trainer) {
        const stmt = db.prepare(`
          SELECT id, ticket_id, trainee_name, lob, category, status, ended, username, created_at, updated_at
          FROM sessions ORDER BY updated_at DESC LIMIT 400
        `);
        results = stmt.all();
      } else {
        const stmt = db.prepare(`
          SELECT id, ticket_id, trainee_name, lob, category, status, ended, username, created_at, updated_at
          FROM sessions WHERE ended = 1 ORDER BY updated_at DESC LIMIT 400
        `);
        results = stmt.all();
      }
    } catch (err) {
      handleSqliteError(err);
    }
  }

  if (results.length === 0 && g.__memStore!.sessions.size > 0) {
    const all = Array.from(g.__memStore!.sessions.values());
    all.sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));
    results = trainer ? all : all.filter(s => s.ended === 1);
  }

  return { results, trainer };
}

export function getSessionDetailFromDb(id: string, trainer: boolean) {
  pruneOldSessions();
  const db = initDb();

  let row: { data: string; ended: number } | undefined;
  if (db) {
    try {
      const stmt = db.prepare('SELECT data, ended FROM sessions WHERE id = ?');
      row = stmt.get(id) as { data: string; ended: number } | undefined;
    } catch (err) {
      handleSqliteError(err);
    }
  }

  if (!row) {
    const mem = g.__memStore!.sessions.get(id);
    if (mem) {
      row = { data: mem.data, ended: mem.ended };
    }
  }

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
  const trimmed = (trainee || '').trim();
  if (!trimmed) {
    return { results: [] };
  }

  const db = initDb();
  let results: any[] = [];
  if (db) {
    try {
      const stmt = db.prepare(`
        SELECT category, status, data, created_at FROM sessions
        WHERE ended = 1 AND trainee_name = ? ORDER BY updated_at DESC LIMIT 20
      `);
      results = stmt.all(trimmed);
    } catch (err) {
      handleSqliteError(err);
    }
  }

  if (results.length === 0) {
    results = Array.from(g.__memStore!.sessions.values())
      .filter(s => s.ended === 1 && s.trainee_name === trimmed)
      .slice(0, 20);
  }

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

  const db = initDb();
  let rows: Array<any> = [];
  if (db) {
    try {
      const stmt = db.prepare(`
        SELECT id, ticket_id, trainee_name, lob, category, status, ended, username, created_at, updated_at, data
        FROM sessions
        WHERE user_id = ? OR trainee_name = ? OR username = ?
        ORDER BY updated_at DESC LIMIT 200
      `);
      rows = stmt.all(trimmed, trimmed, trimmed) as Array<any>;
    } catch (err) {
      handleSqliteError(err);
    }
  }

  if (rows.length === 0 && g.__memStore!.sessions.size > 0) {
    rows = Array.from(g.__memStore!.sessions.values()).filter(
      s => s.user_id === trimmed || s.trainee_name === trimmed || s.username === trimmed
    );
    rows.sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));
  }

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

    const mood = ((d.persona && d.persona.emotionalState) || '').toLowerCase();
    const isFrustratedCustomer = /frustrat|annoy|upset|angry|impatient|anxious/.test(mood);
    if (isFrustratedCustomer) {
      frustratedHandled++;
      if (isResolved) frustratedResolved++;
    }

    if (d.notes) {
      let filledFields = 0;
      if (d.notes.customerName || d.notes.fCustomerName) filledFields++;
      if (d.notes.email || d.notes.fEmail) filledFields++;
      if (d.notes.product || d.notes.fProduct) filledFields++;
      if (d.notes.recap || d.notes.fRecap) filledFields++;
      if (d.notes.nextSteps || d.notes.fNextSteps) filledFields++;
      if (filledFields >= 3) documentedCasesCount++;
    }

    if (d.avgWpm && typeof d.avgWpm === 'number') {
      wpmHistory.push({
        ticketId: row.ticket_id || d.ticketId || row.id,
        wpm: d.avgWpm,
        date: row.created_at || d.createdAt,
        status: status,
      });
      catStats.wpms.push(d.avgWpm);
    }

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
  const db = initDb();
  let userRows: Array<any> = [];

  if (db) {
    try {
      const usersStmt = db.prepare('SELECT id, email, name, avatar_id, is_active, created_at, updated_at FROM users ORDER BY created_at DESC');
      userRows = usersStmt.all() as Array<any>;
    } catch (err) {
      handleSqliteError(err);
    }
  }

  if (userRows.length === 0 && g.__memStore!.users.size > 0) {
    userRows = Array.from(g.__memStore!.users.values());
  }

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
  const db = initDb();
  const now = Date.now();
  if (db) {
    try {
      const stmt = db.prepare('UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?');
      stmt.run(isActive ? 1 : 0, now, userId);
    } catch (err) {
      handleSqliteError(err);
    }
  }
  for (const u of g.__memStore!.users.values()) {
    if (u.id === userId) {
      u.is_active = isActive ? 1 : 0;
      u.updated_at = now;
      break;
    }
  }
  return { ok: true, status: 200 };
}

export function adminTriggerReset(userIdOrEmail: string): { ok: boolean; code?: string; email?: string; name?: string; expiresAt?: number; error?: string; status: number } {
  const db = initDb();
  let user: { id: string; email: string; name: string } | undefined;

  if (db) {
    try {
      const stmt = db.prepare('SELECT id, email, name FROM users WHERE id = ? OR email = ?');
      user = stmt.get(userIdOrEmail, userIdOrEmail) as { id: string; email: string; name: string } | undefined;
    } catch (err) {
      handleSqliteError(err);
    }
  }

  if (!user) {
    user = Array.from(g.__memStore!.users.values()).find(
      u => u.id === userIdOrEmail || u.email === userIdOrEmail
    );
  }

  if (!user) {
    return { ok: false, error: 'Trainee account not found.', status: 404 };
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 60 * 60 * 1000;

  if (db) {
    try {
      const resetStmt = db.prepare(`
        INSERT INTO password_resets (email, code, expires_at)
        VALUES (?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET code = excluded.code, expires_at = excluded.expires_at
      `);
      resetStmt.run(user.email, code, expiresAt);
    } catch (err) {
      handleSqliteError(err);
    }
  }

  g.__memStore!.passwordResets.set(user.email, { code, expires_at: expiresAt });

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

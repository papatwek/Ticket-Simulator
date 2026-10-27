export const schema = `
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
`;

const TRAINER_PASSCODE = "wyzeleadership";
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

let endedColumnReady = false;
async function ensureEndedColumn(env) {
  if (endedColumnReady) return;
  try {
    const r = await env.DB
      .prepare("SELECT count(*) AS c FROM pragma_table_info('sessions') WHERE name = 'ended'")
      .first();
    if (r && r.c === 0) {
      await env.DB.prepare("ALTER TABLE sessions ADD COLUMN ended INTEGER").run();
    }
  } catch (e) { /* column already present or table missing; schema handles fresh tables */ }
  endedColumnReady = true;
}

function isTrainer(url) {
  const p = url.searchParams;
  if (p.get("trainer") !== "1") return false;
  return p.get("key") === TRAINER_PASSCODE;
}

async function pruneOldSessions(env) {
  await env.DB.prepare("DELETE FROM sessions WHERE updated_at < ?")
    .bind(Date.now() - RETENTION_MS)
    .run();
}

const serverHandler = {
  async fetch(request, env) {
    const url = new URL(request.url);
    await ensureEndedColumn(env);

    /* ---- Save a session (ended or ongoing) ---- */
    if (request.method === "POST" && url.pathname === "/api/session") {
      const userId = request.headers.get("x-websim-user-id");
      if (!userId) {
        return Response.json({ error: "Sign in to save sessions" }, { status: 401 });
      }
      const username = request.headers.get("x-websim-username") ?? "anon";
      let body;
      try { body = await request.json(); } catch (e) {
        return Response.json({ error: "Bad JSON body" }, { status: 400 });
      }
      if (!body || !body.id) {
        return Response.json({ error: "Missing session id" }, { status: 400 });
      }
      const category = (body.persona && body.persona.issueCategory) || "";
      const ended = body.ended ? 1 : 0;
      const data = JSON.stringify(body);
      const created = body.createdAt || Date.now();
      const updated = Date.now();
      await env.DB.prepare(
        "INSERT INTO sessions (id, user_id, username, trainee_name, lob, ticket_id, category, status, ended, created_at, updated_at, data) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
        "ON CONFLICT(id) DO UPDATE SET " +
        "username = excluded.username, trainee_name = excluded.trainee_name, lob = excluded.lob, " +
        "ticket_id = excluded.ticket_id, category = excluded.category, status = excluded.status, " +
        "ended = excluded.ended, updated_at = excluded.updated_at, data = excluded.data"
      ).bind(
        body.id, userId, username,
        body.traineeName ?? "", body.lob ?? "",
        body.ticketId ?? "", category, body.status ?? "OPEN",
        ended, created, updated, data
      ).run();
      await pruneOldSessions(env);
      return Response.json({ ok: true, id: body.id });
    }

    /* ---- List sessions. Default: everyone's ended conversations.
           With the trainer passcode: also include ongoing chats. ---- */
    if (request.method === "GET" && url.pathname === "/api/sessions") {
      await pruneOldSessions(env);
      const trainer = isTrainer(url);
      if (trainer) {
        const { results } = await env.DB.prepare(
          "SELECT id, ticket_id, trainee_name, lob, category, status, ended, username, created_at, updated_at " +
          "FROM sessions ORDER BY updated_at DESC LIMIT 400"
        ).all();
        return Response.json({ results, trainer: true });
      }
      const { results } = await env.DB.prepare(
        "SELECT id, ticket_id, trainee_name, lob, category, status, ended, username, created_at, updated_at " +
        "FROM sessions WHERE ended = 1 ORDER BY updated_at DESC LIMIT 400"
      ).all();
      return Response.json({ results, trainer: false });
    }

    /* ---- Session detail. Ongoing chats require the trainer passcode. ---- */
    if (request.method === "GET" && url.pathname === "/api/session") {
      await pruneOldSessions(env);
      const id = url.searchParams.get("id");
      if (!id) return Response.json({ error: "Missing session id" }, { status: 400 });
      const row = await env.DB.prepare(
        "SELECT data, ended FROM sessions WHERE id = ?"
      ).bind(id).first();
      if (!row) return Response.json({ error: "Not found" }, { status: 404 });
      const trainer = isTrainer(url);
      if (row.ended !== 1 && !trainer) {
        return Response.json({ error: "This live chat is trainer-only. Enter the trainer passcode." }, { status: 403 });
      }
      let data;
      try { data = JSON.parse(row.data); } catch (e) {
        return Response.json({ error: "Session data corrupt" }, { status: 500 });
      }
      delete data.traineeEmail;
      return Response.json(data);
    }

    /* ---- AI memory endpoint: a trainee's completed sessions for coaching ---- */
    if (request.method === "GET" && url.pathname === "/api/memory") {
      await pruneOldSessions(env);
      const trainee = (url.searchParams.get("trainee") || "").trim();
      if (!trainee) return Response.json({ results: [] });
      const { results } = await env.DB.prepare(
        "SELECT category, status, data, created_at FROM sessions " +
        "WHERE ended = 1 AND trainee_name = ? ORDER BY updated_at DESC LIMIT 20"
      ).bind(trainee).all();
      const mapped = results.map(function (r) {
        let d = {};
        try { d = JSON.parse(r.data || "{}"); } catch (e) {}
        return {
          category: r.category,
          status: r.status,
          createdAt: r.created_at,
          coachingPoints: d.coachingPoints || null,
          feedback: d.feedback || null,
          avgWpm: d.avgWpm || null,
          finalStatus: d.status || r.status
        };
      });
      return Response.json({ results: mapped });
    }

    return new Response("Not found", { status: 404 });
  },
};

export default serverHandler;

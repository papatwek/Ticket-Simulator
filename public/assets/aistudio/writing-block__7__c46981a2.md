Revise the supplied V2.3 Supabase package into V2.4. Preserve the three formal approval gates. Do not execute SQL or modify application files.

**Approval 1 — Read-only diagnostics**
1. Make the orphaned source_session_id check conditional on the existence of public.sessions and sessions.id.
2. Make the approved_by check conditional on public.trainees and trainees.id.
3. Explicitly report missing application tables and missing referenced columns.
4. Ensure all diagnostic queries remain read-only and safe against incomplete schemas.

**Approval 2 — Transactional migration**
1. Reconcile and validate every required knowledge_cases column, including id. Do not silently invent IDs or replace existing data.
2. Validate the actual types of all existing required columns, including product_family, issue_category, hidden_root_cause, approved_by, source_session_id, created_at, and updated_at.
3. Verify that sessions.id and trainees.id are UUID primary keys or otherwise uniquely constrained before adding foreign keys.
4. Verify existing foreign-key definitions, including referenced table, referenced column, and ON DELETE behavior. Do not rely on constraint names alone.
5. Verify existing CHECK constraint definitions. Abort if an existing named constraint has an incorrect definition.
6. Verify the FTS column's actual udt_name is tsvector, is generated ALWAYS, and has the exact intended generation expression. If any mismatch exists, abort for manual review. Never use DROP COLUMN CASCADE.
7. Require ended_at to be TIMESTAMPTZ. Do not silently accept timestamp without time zone.
8. Check every existing column for incompatible types and nullability before applying constraints.
9. Ensure any failure aborts the complete transaction without partial changes.
10. Preserve existing RLS policies on trainees, sessions, and messages. Keep knowledge_cases inaccessible to anon and authenticated clients.

**Approval 3 — Not part of this task**
Do not implement Next.js retrieval, OpenRouter, Gemini, or fallback code yet.

**Output**
- Complete V2.4 read-only diagnostics SQL.
- Complete V2.4 transactional migration SQL.
- Complete post-migration verification SQL.
- Exact conditions that require stopping.
- Explain any assumptions or limitations honestly.

Do not claim that a condition is validated unless the SQL actually checks it. Do not execute anything.
# FINAL TARGETED CORRECTION — SUPABASE MIGRATION

Your previous package is close to completion. Do not redesign the database, introduce new features, or restart the revision cycle.

Make ONLY the following necessary corrections to the supplied package.

### 1. Separate the transactions

Produce two independent SQL migrations:

**Migration A — Knowledge Repository**
- Create and configure `public.knowledge_cases`.
- Include its required columns, primary key, foreign keys, constraints, generated FTS column, indexes, RLS, and permissions.
- Commit independently.
- Do not depend on optional session telemetry changes.

**Migration B — Session Metadata**
- Add the optional telemetry columns and indexes to `public.sessions`.
- Run separately after Migration A has succeeded.
- If this migration fails, Migration A must remain committed.

### 2. Correct prerequisite validation

Verify that:
- `sessions.id` exists, is UUID, and is a primary key or otherwise uniquely constrained before attaching its foreign key.
- `trainees.id` meets the same requirements.
- The pre-execution checks inspect the actual primary-key columns, not merely whether a table has any primary key.
- Missing prerequisites produce clear diagnostic messages.

Do not silently skip required foreign keys when their target tables are missing or invalid. Stop Migration A with an explicit explanation.

### 3. Reconcile existing knowledge_cases safely

For pre-existing tables:
- Verify existing column types before relying on them.
- Verify that `id` is UUID and is the actual primary key.
- Verify required fields have the intended NOT NULL properties.
- Check existing records for NULL or incompatible values before enforcing constraints.
- Do not silently convert, delete, or overwrite existing data.
- If an unsafe conflict exists, stop with a clear diagnostic rather than attempting destructive repair.

Verify the actual definitions of existing constraints and indexes before treating them as correct.

### 4. Correct the verification output

- Report 19 expected columns, including `fts`.
- Verify that `fts` is a stored generated TSVECTOR column with the intended field and weight mapping.
- Verify actual foreign-key source and target columns.
- Verify actual CHECK constraint definitions.
- Verify RLS and permissions without changing policies on `trainees`, `sessions`, or `messages`.

### 5. Preserve the security boundary

Keep `knowledge_cases` restricted to server-side service-role access.

The application must retrieve only approved cases. Hidden fields such as `hidden_root_cause` and `resolution_steps` must remain server-side and must never be returned in the trainee-facing API response.

Do not claim that database RLS alone guarantees that an application endpoint cannot leak hidden fields.

### 6. Output requirements

Return:
1. Complete Migration A SQL.
2. Complete Migration A pre-execution checks.
3. Complete Migration A post-execution verification.
4. Complete Migration B SQL.
5. Complete Migration B verification.
6. Brief application integration notes.

Do not generate another migration versioning framework. Do not add unnecessary validation or optional features.

Do not execute SQL or claim database changes have been made.

The goal is a practical, safe migration that can finally be executed and verified.
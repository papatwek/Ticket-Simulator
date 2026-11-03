# FINAL REVIEW CORRECTION — DO NOT REDESIGN

The latest independent migration package is substantially improved. Keep its two-transaction architecture, existing table design, security model, and overall SQL structure.

Make only these targeted corrections:

### 1. Correct the knowledge_cases primary-key check
- Verify that `knowledge_cases.id` itself is the single-column primary key.
- Do not treat a primary key on another column as sufficient.
- If a different primary key already exists, stop and report the conflict.
- Do not automatically drop or replace an existing primary key.

### 2. Correct required-column reconciliation
For an existing knowledge_cases table, verify:
- title: TEXT NOT NULL
- product_family: TEXT NOT NULL
- issue_category: TEXT NOT NULL
- hidden_root_cause: TEXT NOT NULL
- symptoms: TEXT[] NOT NULL
- resolution_steps: TEXT[] NOT NULL

If required columns are missing, incorrectly typed, or contain NULL values, report the exact issue and stop safely.

Do not fabricate values, overwrite existing records, or silently leave required columns nullable.

For a new table, ensure all required columns are created with the correct constraints.

### 3. Verify existing constraints and FTS definitions
- Do not accept an existing foreign key or CHECK constraint solely because its name matches.
- Verify its actual source columns, target columns, allowed values, and ON DELETE behavior.
- Verify the FTS generated expression has the exact intended field-to-weight mapping:
  title A, product_model B, issue_category B, symptoms C, hidden_root_cause D.
- If an existing definition conflicts, halt and explain the conflict instead of silently accepting it.

### 4. Preserve everything else
- Keep Migration A and Migration B completely independent.
- Preserve existing records and unrelated tables.
- Do not modify existing RLS policies on trainees, sessions, or messages.
- Keep knowledge_cases inaccessible to browser roles.
- Retain server-side service-role access.
- Retain the existing post-execution verification scripts and update them only where necessary.

### 5. Final output
Return the complete corrected package, including both migrations and their checks.

Give one final verdict: READY TO EXECUTE or NOT READY, with specific reasons.

Do not introduce another migration versioning cycle, new tables, optional features, or unnecessary validation frameworks.

Do not execute SQL or claim database changes have occurred.
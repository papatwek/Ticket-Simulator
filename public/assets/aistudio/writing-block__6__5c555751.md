Revise the supplied Supabase SQL into **V2.3**. Do not execute SQL, modify application files, or assume any database state that has not been verified.

**Part 1 — Approval 1 diagnostics**
- Correct the invalid `row_security` reference.
- Make every diagnostic safe when `knowledge_cases` or individual expected columns do not exist.
- Do not use unguarded `regclass` references.
- Detect NULL values as well as invalid enum-like values.
- Inspect all eight proposed `sessions` telemetry columns and their existing types.
- Inspect existing foreign keys, constraints, indexes, RLS policies, and grants.
- Ensure the entire diagnostic script is read-only.

**Part 2 — Approval 2 migration**
- Reconcile every required `knowledge_cases` column, not just optional columns.
- Validate existing column types, nullability, constraints, and foreign-key targets before changing anything.
- Detect NULL and invalid legacy values before applying NOT NULL or CHECK constraints.
- Verify existing constraint definitions, not just constraint names.
- Verify the exact FTS column type and generated expression.
- Never use `DROP COLUMN ... CASCADE` as automatic FTS repair. Abort with a clear explanation if an incompatible FTS column or dependency exists.
- Reconcile the intended foreign keys, including `source_session_id` and `approved_by`, only after validating referenced columns and existing data.
- Validate all eight `sessions` telemetry column types.
- Preserve all existing data. Never invent replacement values to make a migration pass.
- Keep all schema changes inside an explicit transaction. Any failed validation must abort the transaction.
- Keep knowledge-case data inaccessible to browser clients. Maintain server-only service-role access and do not expose hidden answer-key fields to trainees.
- Do not change existing RLS policies on `trainees`, `sessions`, or `messages`.

**Part 3 — Verification**
Provide read-only post-migration queries that verify actual column types, nullability, constraints, foreign keys, FTS expression, indexes, RLS, policies, and grants.

**Output requirements**
1. Complete Approval 1 diagnostic SQL.
2. Complete Approval 2 V2.3 migration SQL.
3. Complete post-migration verification SQL.
4. A clear list of conditions that require stopping rather than migrating.
5. A short explanation of rollback behavior and any remaining manual steps.

Do not claim the SQL is production-safe merely because it has a transaction. Explain any assumptions and unresolved schema conflicts. Do not execute anything. Preserve the three formal approval gates.
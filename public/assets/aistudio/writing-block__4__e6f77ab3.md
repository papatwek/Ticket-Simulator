### V2.2 FINAL DATABASE MIGRATION HARDENING

Review the complete V2.1 SQL migration. Preserve its architecture and make only the following additional corrections:

1. Verify every required knowledge_cases column and data type. CREATE TABLE IF NOT EXISTS does not reconcile an existing table. Safely add missing columns where possible and stop with a clear diagnostic where automatic changes could risk existing data.

2. Verify that an existing fts column is actually the expected generated TSVECTOR expression. Do not merely check whether the column exists. If its definition is incorrect, report the issue and provide a safe corrective migration.

3. Replace GRANT ALL with least-privilege grants for service_role: SELECT, INSERT, UPDATE, DELETE.

4. Before dropping and recreating constraints, inspect existing records for invalid qa_status, source_type, product_family, source_session_id, and approved_by values. Do not silently modify or delete records to force constraints to pass.

5. Verify the existing sessions columns and types before adding telemetry fields. Preserve all existing data and report incompatible columns.

6. Keep the dynamic RLS policy purge and explicitly verify that anon, authenticated, and PUBLIC have no table privileges or remaining access policies.

7. Preserve the existing messages, sessions, and trainees policies. Do not change unrelated application functionality.

8. Keep the solution compatible with Vercel Hobby/Free, Supabase Free, and Render Free. Another web application shares the Vercel account. Do not add paid services, paid embeddings, background workers, or infrastructure.

OUTPUT:
- Complete V2.2 SQL migration.
- Pre-migration validation queries.
- Post-migration verification queries.
- A list of any conditions that would prevent safe execution.
- Confirmation that no SQL was executed and no application files were modified.

IMPORTANT: Do not execute SQL, modify the live Supabase database, or modify application files. Wait for my explicit approval.
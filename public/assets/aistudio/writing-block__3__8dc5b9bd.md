### V2.1 FINAL MIGRATION REVIEW — DO NOT EXECUTE

Review the attached V2 SQL migration and make the following final corrections:

1. Inspect all existing policies on public.knowledge_cases. Do not assume the three named policies in V2 are the only policies present. Ensure no anon or ordinary authenticated user can access the table through PostgREST.

2. Make the migration safe if knowledge_cases already exists. CREATE TABLE IF NOT EXISTS does not update existing column defaults or constraints. Explicitly verify and correct the required defaults, constraints, and generated FTS column.

3. Verify existing sessions column types before relying on ADD COLUMN IF NOT EXISTS. Do not silently assume existing columns match the intended application types.

4. Verify database permissions for server-side retrieval. Keep SUPABASE_SERVICE_ROLE_KEY exclusively in server-side environment variables.

5. Verify that no API response or frontend code exposes hidden_root_cause, resolution_steps, or internal SOP information to trainees.

6. Confirm that the session telemetry structure matches the actual serializeSession() and saveSessionToDb() implementations.

7. Preserve all existing sessions, messages, trainees, RLS policies, and current simulator functionality.

8. Do not introduce paid services, paid embeddings, background workers, or additional infrastructure. The project uses Vercel Hobby/Free, Supabase Free, and Render Free, and another application shares the Vercel account.

OUTPUT:
- Complete V2.1 SQL migration.
- List of corrections made.
- RLS and permissions verification queries.
- Existing-schema compatibility checks.
- Explicit confirmation that no SQL was executed and no application files were modified.

Do not execute the migration. Wait for explicit approval.
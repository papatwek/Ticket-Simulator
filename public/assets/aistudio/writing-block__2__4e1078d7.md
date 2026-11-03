### FINAL SECURITY AND DATABASE DESIGN CORRECTION

I approve the overall knowledge_cases architecture, JSONB troubleshooting structure, QA approval workflow, audit trail, PostgreSQL full-text search, and session telemetry additions.

However, make the following mandatory corrections before presenting the final SQL migration:

1. Do not grant anon or ordinary authenticated users direct SELECT access to the knowledge_cases table. RLS row policies do not hide individual columns.

2. All knowledge_cases retrieval must occur through authorized server-side Next.js API routes using the existing secure server-side Supabase configuration.

3. Never expose hidden_root_cause, resolution_steps, internal answer keys, or supervisor-only information to the trainee's browser.

4. Only approved and active knowledge cases may be retrieved by the AI engine.

5. Use PENDING as the default qa_status. approved_at must remain NULL until an authorized supervisor approves the record.

6. Verify administrative authorization independently. A foreign key to trainees.id does not establish administrator privileges.

7. Ensure the service-role key is exclusively server-side and never exposed in frontend JavaScript, browser requests, or public environment variables.

8. Preserve existing RLS policies on messages, sessions, and trainees.

9. Verify that the new sessions fields match the actual application data structures before including them in the migration.

10. Keep native PostgreSQL full-text search. Do not introduce paid embeddings or paid services.

11. Do not promise fixed query performance. Use actual tests to assess retrieval speed.

12. Ensure that only verified Wyze technical information is classified as authoritative knowledge.

OUTPUT:
- Complete corrected SQL migration.
- Explanation of database permissions and RLS.
- Explanation of how hidden technical information remains server-side.
- Compatibility assessment with the current Next.js application.
- Confirmation that the migration is non-destructive.

Do not execute the SQL or modify application files. Wait for my approval.
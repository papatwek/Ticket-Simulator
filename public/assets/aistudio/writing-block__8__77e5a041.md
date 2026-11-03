# SUPABASE KNOWLEDGE CASES — FINAL MIGRATION CORRECTION

Act as a senior Supabase/PostgreSQL database engineer. We have repeatedly revised this migration (V2.3, V2.4, and subsequent reviews) without reaching execution. Stop the endless revision cycle.

Your task is to review the existing V2.4 SQL package and produce a **simplified, final, executable migration** based on the actual requirements below.

## 1. Primary objective

Create a working `knowledge_cases` table in Supabase that the Wyze ECE AI Simulator can use as its curated technical knowledge repository.

The table must support:
- Wyze product families, models, and issue categories.
- Customer symptoms and diagnostic questions.
- Hidden root causes and resolution steps for AI-side use.
- Draft, approved, and archived knowledge records.
- Searchable knowledge cases.
- Source tracking and approval metadata.

Only approved and active knowledge cases should be retrieved for customer-simulation responses.

## 2. Keep the implementation simple

Do not introduce unnecessary complexity, additional tables, new infrastructure, vector databases, embedding services, or paid services.

Use native PostgreSQL and Supabase capabilities wherever possible.

Keep the existing table relationships and intended design from V2.4 unless a change is genuinely necessary for correctness or security.

Separate the work into two independent areas:

**Phase A — Knowledge repository**
- Create and configure `knowledge_cases`.
- Add its required constraints, indexes, and search functionality.
- Configure secure server-side access.
- Verify the completed table.

**Phase B — Session metadata**
- Handle optional additions to the existing `sessions` table separately.
- Do not allow optional session improvements to block Phase A.
- Preserve existing session and message data.

## 3. Review only genuine blockers

Classify findings as:

- CRITICAL — Prevents safe execution, causes data loss, breaks required functionality, or creates a security vulnerability.
- IMPORTANT — Should be corrected but does not necessarily prevent migration.
- OPTIONAL — Improvement that can be documented and addressed later.

Do not reject the migration for theoretical edge cases, cosmetic improvements, redundant validation, or optional enhancements.

Check the following essentials:

1. Required columns have correct data types and defaults.
2. Primary keys and foreign keys reference the correct columns and tables.
3. Required constraints enforce the intended allowed values.
4. Full-text search works and uses the intended fields.
5. Required indexes exist and support the intended queries.
6. Existing data is preserved.
7. Existing RLS policies on `trainees`, `sessions`, and `messages` remain unchanged.
8. `knowledge_cases` cannot be accessed directly by unauthorized browser users.
9. Only the server-side service role can perform the intended knowledge repository operations.
10. Hidden fields such as `hidden_root_cause` and `resolution_steps` are never exposed to trainees.

Do not rely on constraint or index names alone when checking whether they are correct. Verify their actual definitions where necessary.

## 4. Security requirements

- Do not expose the Supabase service role key in frontend code.
- Do not allow trainees to retrieve hidden knowledge fields directly.
- Only approved cases should be available to the simulator's retrieval process.
- Approval must be protected by server-side authorization, not merely by an `approved_by` field.
- Do not weaken existing security policies.
- Do not create broad public access to the knowledge repository.

## 5. Preserve existing data and functionality

Do not drop or recreate existing tables.

Do not delete existing records.

Do not overwrite existing RLS policies.

Do not fabricate knowledge records or approval history.

Do not modify application code as part of this task.

Do not introduce paid services or infrastructure.

## 6. Required output

Produce the following:

**A. Final SQL migration**
- Complete SQL, from beginning to end.
- Ready to paste into the Supabase SQL Editor.
- Safe handling of existing tables and records.
- Clear transaction and error handling.
- No placeholders or incomplete SQL.

**B. Pre-execution checks**
- Only checks necessary to identify genuine execution or security blockers.
- Explain any condition that must be resolved before running the migration.

**C. Post-execution verification**
- SQL queries to confirm the table, columns, relationships, constraints, indexes, full-text search, RLS, and permissions.
- Explain what successful results should look like.

**D. Application integration notes**
- Briefly explain how the existing Next.js backend should retrieve approved knowledge cases.
- Do not modify or generate application code yet.

## 7. Final decision

Give one clear result:

- READY TO EXECUTE
- NOT READY — with only the specific critical blockers listed.

If the package is ready, do not invent additional reasons to reject it.

If an important or optional improvement remains, document it without unnecessarily blocking execution.

Do not generate another review framework or propose V2.6, V2.7, or another revision cycle.

**Your priority is to deliver a practical, secure, executable migration—not to create an endlessly evolving SQL validation system.**

Return the entire final package in one response. Do not execute SQL, access the Supabase project, modify application files, or claim that anything has been deployed.
### STAGE 1: PREPARE THE SUPABASE DATABASE MIGRATION

Inspect my existing Supabase database and prepare the database changes required for Supabase-powered knowledge retrieval.

Existing tables:
- messages
- sessions
- trainees

RLS is already enabled on all three tables. Do not unnecessarily enable it again or recreate existing policies.

Tasks:

1. Inspect the actual columns, data types, constraints, foreign keys, indexes, RLS policies, and existing database functions.
2. Confirm the current application uses the expected tables and relationships.
3. Design a new public.knowledge_cases table containing:

- id UUID primary key
- product_family TEXT
- product_name TEXT
- issue_category TEXT
- led_indicator TEXT
- symptom_summary TEXT
- hidden_root_cause TEXT
- resolution_steps JSONB
- sample_opening_chat TEXT
- sample_opening_email TEXT
- keywords TEXT[]
- qa_status TEXT with appropriate default and validation
- is_active BOOLEAN
- source_type TEXT
- source_reference TEXT
- source_session_id UUID where appropriate
- approved_at TIMESTAMPTZ
- approved_by UUID where appropriate
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

4. Add a generated PostgreSQL tsvector column and GIN index for full-text retrieval. Include product name, issue category, symptom summary, and keywords.
5. Add a product-name index and any other justified indexes.
6. Review existing sessions columns and identify which additional fields are genuinely needed for persistent training records. Do not duplicate existing fields.
7. Design appropriate RLS policies for knowledge_cases. Unapproved knowledge must not be available to ordinary trainees. Only authorized administrative operations may approve, reject, or modify knowledge.
8. Keep privileged database access server-side.
9. Do not delete or overwrite existing records.

OUTPUT:
- Complete SQL migration, ready to copy into Supabase SQL Editor.
- Explanation of every change.
- RLS policy explanation.
- Any required assumptions or unresolved questions.

IMPORTANT:
Do not execute SQL, modify application files, or make database changes. Wait for my approval.
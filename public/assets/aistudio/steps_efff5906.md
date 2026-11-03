Perform ONLY the following three targeted corrections to the supplied Supabase migration package. Do not redesign the schema, introduce new features, or repeat previously resolved issues.

**1. Migration A — Preserve existing security policies**
- Before modifying policies on `public.knowledge_cases`, inspect whether any policies already exist.
- If policies exist, halt with their names and definitions for manual review.
- Do not automatically drop existing policies.
- If no policies exist, retain the intended RLS-enabled, deny-by-default configuration.
- Preserve all existing policies on `trainees`, `sessions`, and `messages`.

**2. Migration A — Verify CHECK constraints exactly**
- Verify the complete allowed-value sets for `qa_status`, `source_type`, and `product_family`.
- Do not rely on substring or keyword matching.
- A constraint that permits additional values or omits an intended value must be treated as a conflict.
- Halt safely if an existing constraint conflicts. Never automatically drop or replace it.

**3. Migration B — Validate all eight existing column types**
Validate `ticket_id`, `product_name`, `avg_wpm`, `notes`, `feedback`, `abandoned`, `lob`, and `ended_at` before applying changes.
- Expected types: TEXT, TEXT, NUMERIC-compatible, JSON/JSONB, TEXT, BOOLEAN, TEXT, TIMESTAMPTZ respectively.
- Halt with a clear diagnostic if an existing column has an incompatible type.
- Do not automatically convert or overwrite existing data.

**Final output requirements**
- Return the complete corrected package, not snippets.
- Preserve independent atomic transactions for Migration A and Migration B.
- Preserve read-only pre-checks and post-execution verification.
- Preserve existing records and unrelated database policies.
- Keep all service-role access server-side.
- Do not claim SQL has been executed.
- End with exactly one verdict: READY TO EXECUTE or NOT READY TO EXECUTE.
- Do not introduce additional optional improvements or theoretical blockers. Only address the three specified items.
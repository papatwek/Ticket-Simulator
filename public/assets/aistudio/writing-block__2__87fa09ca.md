# SECURITY CORRECTION — SUPABASE ADMIN DIAGNOSTICS AND AUTHENTICATION

Review the existing GitHub-connected project and implement the following security corrections. Do not merely provide recommendations or sample code. Inspect the actual repository, make the necessary code changes, and validate the complete implementation.

## 1. Correct `lib/supabase.ts`

- Separate normal Supabase access from administrator access.
- `getSupabase()` must use only the Supabase anon/publishable key. It must never prioritize or use `SUPABASE_SERVICE_ROLE_KEY`.
- `getSupabaseAdmin()` must use only `SUPABASE_SERVICE_ROLE_KEY` and must remain server-side.
- Never expose the service-role key through frontend code, API responses, logs, or client-side imports.
- Preserve existing Supabase functions and compatibility with current application features.
- Review every import and usage to ensure the admin client cannot enter the browser bundle.

## 2. Secure Administrator Authentication

Inspect the existing trainer login, `isTrainerPasscode()`, `lib/db.ts`, and all administrator API routes before changing authentication.

Implement secure server-side administrator authentication:

- Never embed the trainer passcode in `public/app.js`, HTML, browser storage, or frontend JavaScript.
- Never transmit the passcode through URL query parameters.
- Authenticate through a server-side POST request.
- After successful authentication, issue a signed, HTTP-only, Secure, SameSite cookie with an appropriate expiration.
- Use environment variables for the trainer passcode and session-signing secret. Do not hardcode fallback credentials.
- Verify the signed session on every protected administrator API request.
- Do not rely on a frontend-only check or a passcode stored in localStorage.
- Ensure logout invalidates the administrator session.
- If required environment variables are missing, fail securely and provide a clear server-side configuration message.
- Do not weaken existing RLS policies or expose service-role access to trainees.

Update all dependent administrator API routes consistently if necessary. Do not secure only the diagnostic endpoint while leaving other administrator endpoints exposed.

## 3. Correct the Supabase Diagnostic API Route

Update `app/api/admin/diagnostics/supabase/route.ts`:

- Require the verified administrator session.
- Remove `?key=` and passcode-header authentication.
- Keep the database checks strictly read-only.
- Check Supabase connectivity and the existence/accessibility of `knowledge_articles` and `knowledge_article_chunks`.
- Return useful diagnostic status, latency, and table counts without exposing credentials or sensitive database information.
- Return generic errors to the browser. Keep technical error details in server-side logs.
- Return HTTP 401 for unauthorized access.
- Do not expose raw exception messages or environment-variable values.

## 4. Correct `public/app.js`

- Remove all hardcoded trainer passcodes and any frontend references to the passcode value.
- Update administrator login to use the secure server-side authentication flow.
- Do not save the passcode in localStorage, sessionStorage, URLs, or browser-visible configuration.
- Update the Supabase diagnostic button to call the protected endpoint using the authenticated session cookie.
- Preserve the existing diagnostic modal, status indicators, and administrator interface.
- Ensure the diagnostic function is accessible from the correct scope and event handlers are registered only once.
- Preserve all existing simulator and administrator functionality.

## 5. Preserve Existing Features

Do not redesign the application or remove existing functionality.

Preserve:
- Two simultaneous customer conversation slots.
- Live Chat and Email Ticketing modes.
- Trainee analytics and leadership administration.
- Trainee management and QA history.
- Existing Supabase tables and data.
- Existing knowledge-case and support-article integrations.
- Existing simulator AI routing and fallback architecture.
- Existing API contracts unless a security correction requires a coordinated update.

Do not modify unrelated files unnecessarily.

## 6. Validation — Required Before Completion

Run the available checks and inspect the actual code:

1. Confirm normal Supabase operations use only the anon/publishable key.
2. Confirm service-role access is restricted to server-side administrative operations.
3. Search the entire frontend for hardcoded trainer passcodes and service-role credentials.
4. Confirm no administrator endpoint accepts credentials through URL parameters.
5. Confirm unauthenticated users receive HTTP 401 from protected administrator endpoints.
6. Confirm authenticated administrators can still access trainee management and diagnostics.
7. Confirm logout invalidates the session.
8. Confirm the diagnostic endpoint performs no database writes.
9. Run the production build, TypeScript checks, and available lint/tests.
10. Check for broken imports, duplicate event handlers, and regressions.

## 7. Final Report

After implementation, provide:

- Every file changed and why.
- The authentication flow now used.
- Required environment variables and where to configure them in Vercel.
- Any existing environment variables that need to be removed or rotated.
- Build, lint, and test results.
- Any issues that could not be verified.
- Exact GitHub commit/deployment readiness status.

Do not claim a live Supabase connection or successful deployment unless you actually tested it.

IMPORTANT: Do not invent credentials, use placeholder production secrets, weaken security to make tests pass, or remove existing features to simplify implementation. Keep the changes compatible with the current project architecture and free-tier hosting.
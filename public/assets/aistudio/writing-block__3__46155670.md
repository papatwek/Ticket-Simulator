# WYZE ECE AI SIMULATOR — FULL FUNCTIONALITY, AI QUALITY AND PERFORMANCE AUDIT

Act as a senior full-stack engineer, AI systems architect, QA engineer, and performance optimization specialist.

Review the ENTIRE existing GitHub-connected repository for my Wyze ECE AI Simulator.

My priority is to improve the application's overall functionality, AI customer realism, response speed, reliability, and performance — not to redesign the application or focus on additional security changes.

IMPORTANT: First inspect the existing implementation and identify actual problems. Do not assume that a feature is broken simply because it could be improved. Do not remove working functionality.

## 1. AI CUSTOMER ENGINE — HIGHEST PRIORITY

The AI must consistently act as a REAL Wyze customer seeking support.

Improve:
- Relevance to the trainee's latest message.
- Natural, human-like conversational responses.
- Context retention across the entire conversation.
- Consistency of customer identity, device, symptoms, history, and previous troubleshooting results.
- Appropriate emotional progression based on the trainee's actions and response time.
- Realistic responses to troubleshooting instructions.
- Ability to answer questions without unnecessarily repeating previously provided information.
- Avoidance of generic, scripted, repetitive, robotic, or unrelated responses.

The customer must:
- Never become the support agent or trainer.
- Never tell the trainee what the correct troubleshooting procedure is.
- Never reveal hidden scenario answers, root causes, expected resolutions, or QA scoring criteria.
- Cooperate with the trainee, maintain trust, and provide information naturally.
- Follow the trainee's lead and report realistic observations when asked to perform an action.
- Use fictional customer information when documentation requires it.

Official Wyze support articles are background knowledge for product terminology, features, symptoms, and troubleshooting context. They must NOT dictate the customer's behavior or turn the bot into a support assistant.

## 2. AI PROVIDER ROUTING AND CONTINUITY

Preserve the intended free-tier architecture:

1. Gemini API — primary AI provider.
2. OpenRouter — explicitly free model backup, using the configured free Gemma model.
3. Local contextual engine — final fallback, with no API charges.

Requirements:
- Detect provider quota errors, rate limits, timeouts, unavailable models, and malformed responses.
- Fail over correctly without creating duplicate customer messages.
- Preserve conversation history and scenario context during provider switching.
- Prevent repeated retry loops.
- Use reasonable timeouts and limited retries.
- Do not silently switch to paid models or paid services.
- If all providers are unavailable, provide a natural, controlled fallback response and maintain conversation continuity.
- Clearly log which provider handled each response without exposing API keys.

Do not change provider models or environment-variable names without inspecting the current configuration first.

## 3. RESPONSE SPEED AND PERFORMANCE

Inspect the complete request lifecycle from the frontend through Vercel API routes, Render/backend services, AI providers, and Supabase.

Identify:
- Unnecessary sequential API calls.
- Duplicate database queries.
- Excessive conversation-history payloads.
- Slow AI response handling.
- Unnecessary frontend rerendering.
- Memory leaks and excessive timers.
- Repeated polling or unnecessary requests.
- Inefficient database queries and indexes.
- Large frontend JavaScript bundles.
- Operations that block the user interface.

Optimize where justified:
- Parallelize independent operations.
- Reduce unnecessary database and network round trips.
- Keep conversation context concise without losing important facts.
- Use appropriate request timeouts and cancellation.
- Avoid duplicate submissions and overlapping AI requests.
- Keep timers and UI updates efficient.
- Lazy-load nonessential administrative features where appropriate.
- Avoid unnecessary caching of live conversation or user-specific data.

Do not introduce paid infrastructure, Redis, paid monitoring, or other paid services.

## 4. CONVERSATION RELIABILITY

Test and improve:
- Enter sends a message.
- Shift+Enter creates a new line.
- Loading and typing indicators.
- Duplicate message prevention.
- Message ordering.
- Conversation history persistence.
- Switching between Slot 1 and Slot 2.
- Ending and restarting conversations.
- Handling failed AI responses.
- Handling slow or disconnected providers.
- Session recovery after refresh.
- Prevention of stale or cross-slot conversation context.

Each slot must retain its own independent customer persona, scenario, conversation history, timers, and state.

## 5. SCENARIO AND CUSTOMER REALISM

Evaluate the scenario generator and customer persona engine.

Ensure:
- Product families and device models are relevant to Wyze.
- Issue categories cover the supported Wyze product range.
- Customer symptoms and device behavior are plausible.
- Troubleshooting results are consistent with the scenario.
- Different personas produce genuinely different conversational behavior.
- Customer frustration develops naturally rather than appearing randomly.
- The bot does not reveal the hidden issue or resolution too early.
- Email Ticketing conversations feel different from Live Chat conversations.

Use the existing approved knowledge repository and support-article knowledge integration where available.

## 6. EXISTING FEATURE REGRESSION TESTING

Preserve and test all existing features:

- Two simultaneous customer conversation slots.
- Live Chat mode.
- Email Ticketing mode.
- Customer personas and issue selection.
- SLA timers and warning/danger states.
- Seven-minute inactivity abandonment.
- WPM tracking.
- Trainee name and session tracking.
- Session history and QA history.
- Leadership Admin dashboard.
- Trainee Analytics.
- Trainee management.
- Supabase knowledge-case repository.
- Wyze support-article retrieval.
- Existing AI provider configuration and fallback behavior.

Do not remove, simplify, or replace a working feature just to make optimization easier.

## 7. PERFORMANCE MEASUREMENT

Establish a baseline before optimization.

Where possible, measure:
- Frontend initial load time.
- API response time.
- AI provider response time.
- Time to first customer response.
- Supabase query latency.
- Memory and CPU usage where available.
- Failed requests and retry frequency.

After optimization, compare the results against the baseline. Do not invent performance improvements or claim tests were performed if they were not.

## 8. FREE-TIER REQUIREMENT

All recommendations and implementation changes must remain compatible with:
- Vercel Free/Hobby.
- Supabase Free.
- Render Free.
- Gemini free-tier access where available.
- OpenRouter explicitly free models.
- Local contextual fallback without API charges.

Disclose any proposed paid dependency before implementing it. Do not add paid services or silently introduce usage-based costs.

## 9. IMPLEMENTATION RULES

- Inspect the complete repository before changing files.
- Identify the actual root causes, not just symptoms.
- Prioritize high-impact issues.
- Make coordinated changes across dependent files.
- Preserve current architecture unless a change is demonstrably necessary.
- Do not overwrite unrelated changes.
- Do not modify database schemas without explaining why and providing a migration.
- Do not remove existing data or reset existing Supabase tables.
- Keep API contracts consistent.
- Do not commit or deploy automatically.

## 10. FINAL REPORT

Provide:

1. Overall application health assessment.
2. Actual functionality problems discovered.
3. AI conversation quality problems discovered.
4. Performance bottlenecks discovered.
5. Files that need changes and why.
6. Recommended fixes ranked by impact.
7. Free-tier compatibility assessment.
8. Test plan and actual test results.
9. Features that remain unverified.

Start with a comprehensive audit and prioritized action plan. Then implement the highest-impact improvements in coordinated stages, validating each stage before proceeding.

The ultimate objective is a reliable, fast, realistic Wyze customer-service training simulator — not merely a project that compiles successfully.
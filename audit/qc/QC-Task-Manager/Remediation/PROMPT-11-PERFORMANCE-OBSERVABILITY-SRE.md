# PROMPT 11 — PERFORMANCE, OBSERVABILITY & SRE BUDGETS

TASK ID:
QC-REMEDIATION-011

PRIORITY:
P1 / P2

ROLE:
Site Reliability Engineer (SRE), Performance Architect, Observability Lead.

DEPENDS ON:
PROMPT-08.

BLOCKS:
GATE C.

SOURCE FINDINGS:
- Audit Sections 20, 29, 30, 82, 84.
- Lack of formalized numeric performance budgets (p95 latency, query execution time, asset size).

AFFECTED DOMAINS:
Domain 29 (Performance Engineering), Domain 30 (Observability / Monitoring / Alerting), Domain 82 (Incident Management), Domain 84 (Capacity Planning).

MISSION:
Establish and enforce numeric performance budgets across all critical user journeys, implement structured correlation IDs across request lifecycles, wire deep diagnostic health and readiness probes (`/api/health`, `/api/readiness`), and capture client-side UX telemetry events (`/api/ux/events`) for actionable crash and friction analytics.

CURRENT-REALITY REQUIREMENT:
Before modifications:
* read `.agents/mind/01-mind-latest.md`
* read Performance & Observability Deep Dive (Section 20)
* inspect `apps/qc-task-manager/src/pages/api/health.ts`
* inspect `apps/qc-task-manager/src/pages/api/readiness.ts`
* inspect `apps/qc-task-manager/src/lib/observability.ts`.

MANDATORY SOURCE INSPECTION:
- `apps/qc-task-manager/src/pages/api/health.ts`
- `apps/qc-task-manager/src/pages/api/readiness.ts`
- `apps/qc-task-manager/src/lib/observability.ts`
- `apps/qc-task-manager/src/pages/api/ux/events.ts`
- `apps/qc-task-manager/scripts/test-observability.mjs`

MANDATORY SKILLS:
- `.agents/skills/verification-before-completion/SKILL.md`
- `.agents/skills/performance-profiling/SKILL.md`

REQUIREMENTS:
1. Formal Numeric Performance Budgets:
   - Define and enforce latency thresholds in automated performance tests:
     - Health / readiness response time: < 20ms.
     - Task list SSR page generation: p95 < 150ms.
     - Standard SQLite write transaction: < 25ms.
     - Total standalone JS bundle payload: < 180KB (gzipped).
2. Structured Correlation ID & Logging:
   - In `src/middleware/index.ts`, attach a unique `x-request-id` to every incoming request.
   - Propagate `requestId` to all structured JSON logs, database activity events, and error responses.
3. Health & Readiness Deep Inspection:
   - In `/api/health.ts`: return liveness status (process uptime, memory RSS).
   - In `/api/readiness.ts`: execute a lightweight SQL query (`SELECT 1`), verify writable disk path for database and uploads, and return HTTP 200 `{ status: "ready" }` or HTTP 503 if database connection fails.
4. Client UX Telemetry:
   - Ensure `/api/ux/events.ts` records friction events (rage clicks, form submission failures) in `ux_events` table without capturing PII or sensitive form inputs.

NON-NEGOTIABLE BUSINESS RULES:
- Performance telemetry must NEVER slow down the user's primary workflow.
- Error logs must NEVER expose passwords, session tokens, or raw SQL queries containing user data.

IMPLEMENTATION REQUIREMENTS:
- TypeScript type safety.
- Non-blocking asynchronous event batching.

DO NOT:
- Do NOT install heavy external APM agents that bloat node_modules.
- Do NOT log stack traces in production HTTP response bodies.

TEST-FIRST / DEBUGGING REQUIREMENT:
Simulate database disconnection -> verify `/api/readiness` returns HTTP 503 Service Unavailable within 50ms.

TEST QUALITY REQUIREMENT:
Measure wall-clock latency with `performance.now()` across 100 sample requests and assert p95 < 150ms.

REQUIRED AUTOMATED TESTS:
- `pnpm run test:observability`
- New: latency budget and health probe verification test.

REQUIRED BROWSER TESTS:
- Measure Lighthouse performance score: assert Performance score >= 90.

REQUIRED DATABASE TESTS:
- Verify `/api/readiness` verifies database read/write access.

REQUIRED SECURITY TESTS:
- Verify `/api/health` and `/api/readiness` do not leak environment variables or secret keys.

REQUIRED ACCESSIBILITY TESTS:
None for SRE prompt.

REQUIRED ROLE TESTS:
- Verify health endpoints are accessible to monitoring probes without requiring user login.

REQUIRED NEGATIVE TESTS:
- Corrupted database file -> `/api/readiness` returns 503 with structured diagnosis code.

REGRESSION REQUIREMENT:
All 74 unit tests and 28 E2E suites must pass.

ACCEPTANCE CRITERIA:
- AC-01: Numeric latency budgets established and verified by automated benchmark.
- AC-02: `x-request-id` header attached and propagated to logs.
- AC-03: `/api/readiness` tests database read/write and disk availability.
- AC-04: Client UX friction events recorded in database without PII.
- AC-05: Lighthouse performance score >= 90 on core dashboards.
- AC-06: Evidence file written to `audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-11-EVIDENCE.md`.

TARGET:
All applicable AC = PASS (6/6).

EVIDENCE OUTPUT:
`audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-11-EVIDENCE.md`

FINAL VERIFICATION:
Run `pnpm run test:observability` and latency benchmarks.

FINAL RESPONSE FORMAT:
Status: PASS / PARTIAL / BLOCKED
Criteria: 6/6
Tests: ...
Remaining: ...

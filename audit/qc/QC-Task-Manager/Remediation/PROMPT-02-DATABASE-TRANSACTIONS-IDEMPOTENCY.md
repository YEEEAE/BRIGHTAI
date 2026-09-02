# PROMPT 02 — DATABASE RELIABILITY, CONCURRENCY & IDEMPOTENCY

TASK ID:
QC-REMEDIATION-002

PRIORITY:
P1 / P2

ROLE:
Database Reliability Engineer (DBRE), Backend Systems Architect, Concurrency Specialist.

DEPENDS ON:
GATE A (PROMPT-01).

BLOCKS:
PROMPT-04, PROMPT-06, GATE B.

SOURCE FINDINGS:
- P1-7: Single-thread process model, SQLite WAL concurrency, busy timeout, and failover strategy.
- P2-6: Missing idempotency key handling on mutation endpoints (POST/PUT).
- Audit Sections 7, 9, 17, 35, 75, 76, 77.

AFFECTED DOMAINS:
Domain 4 (Data Integrity), Domain 7 (Database Engineering), Domain 8 (Workflow Rules), Domain 20 (Reliability / Resilience), Domain 35 (Concurrency / Transaction Design), Domain 76 (Data Quality).

MISSION:
Harden SQLite WAL mode connection settings, configure deterministic `busy_timeout` (5000ms), implement atomic transaction helpers for all multi-table mutations, establish server-side Idempotency-Key validation on critical POST endpoints to prevent double-submissions, and verify zero data corruption under concurrent load.

CURRENT-REALITY REQUIREMENT:
Before modifications:
* read `.agents/mind/01-mind-latest.md`
* read assigned findings P1-7 and P2-6
* inspect `apps/qc-task-manager/src/lib/db.ts`
* inspect all transaction usage in `src/lib/` and `src/pages/api/`
* inspect migration 001 to 039 parity.

MANDATORY SOURCE INSPECTION:
- `apps/qc-task-manager/src/lib/db.ts`
- `apps/qc-task-manager/src/pages/api/tasks/[id]/close.ts`
- `apps/qc-task-manager/src/pages/api/lab/tests/[id]/review.ts`
- `apps/qc-task-manager/src/pages/api/findings/[id]/capa.ts`
- `apps/qc-task-manager/scripts/test-database-100.mjs`
- `apps/qc-task-manager/scripts/test-concurrency-transactions-100.mjs`

MANDATORY SKILLS:
- `.agents/skills/verification-before-completion/SKILL.md`
- `.agents/skills/performance-profiling/SKILL.md`

REQUIREMENTS:
1. SQLite Connection Pragma Hardening:
   - Ensure `src/lib/db.ts` enforces:
     - `PRAGMA journal_mode = WAL;`
     - `PRAGMA synchronous = NORMAL;` (or FULL for audit trail durability)
     - `PRAGMA foreign_keys = ON;`
     - `PRAGMA busy_timeout = 5000;`
2. Idempotency Key Architecture:
   - Create canonical utility `src/lib/idempotency.ts` backed by table `idempotency_keys` (or migration if needed).
   - Require `Idempotency-Key` header on critical mutating APIs:
     - `/api/tasks/[id]/close`
     - `/api/lab/tests/[id]/review`
     - `/api/findings/[id]/capa`
   - If a duplicate request with the same idempotency key arrives within 24 hours, return the cached status/response rather than re-executing mutations.
3. Transaction Atomicity:
   - Audit all mutations touching multiple tables (e.g. task close + activity log + attachment status) to ensure they are strictly wrapped inside `db.transaction(() => { ... })()`.
4. Concurrency Test Suite:
   - Strengthen `scripts/test-concurrency-transactions-100.mjs` to simulate 20 parallel writes to ensure no `SQLITE_BUSY` unhandled exceptions escape to the client.

NON-NEGOTIABLE BUSINESS RULES:
- Never disable `foreign_keys = ON`.
- Never execute financial, approval, or deletion mutations outside an atomic transaction.
- Preserve backward-compatibility for all existing 39 migrations.

IMPLEMENTATION REQUIREMENTS:
- TypeScript type safety for idempotency middleware.
- Clean error responses (HTTP 409 or cached 200/201 on replay).

DO NOT:
- Do NOT switch away from better-sqlite3.
- Do NOT swallow SQLite disk I/O errors.
- Do NOT introduce unindexed foreign keys.

TEST-FIRST / DEBUGGING REQUIREMENT:
Create an automated test attempting duplicate POST requests with identical `Idempotency-Key` header and verify only one database row is inserted.

TEST QUALITY REQUIREMENT:
Verify actual database row counts and state transitions; do not just check HTTP response codes.

REQUIRED AUTOMATED TESTS:
- `pnpm run test:database-100`
- `pnpm run test:concurrency-transactions-100`
- `pnpm run test:schema-reference`
- New: `pnpm run test:idempotency`

REQUIRED BROWSER TESTS:
- Rapid double-click on form submit buttons to verify UI disables button and backend rejects duplicate submission.

REQUIRED DATABASE TESTS:
- `PRAGMA integrity_check` returning `'ok'`.
- `PRAGMA foreign_key_check` returning 0 violations.

REQUIRED SECURITY TESTS:
- Attempt replay attack with altered body on same idempotency key -> must return 400 Mismatched Payload.

REQUIRED ACCESSIBILITY TESTS:
None for this backend prompt.

REQUIRED ROLE TESTS:
- Verify idempotency keys are scoped per user session to prevent cross-user key collision.

REQUIRED NEGATIVE TESTS:
- Forced database lock timeout -> returns graceful HTTP 503 / 429 with retry-after header.

REGRESSION REQUIREMENT:
All 74 unit suites and 28 E2E suites must continue to pass.

ACCEPTANCE CRITERIA:
- AC-01: `db.ts` enforces WAL, foreign_keys=ON, busy_timeout=5000.
- AC-02: Idempotency utility implemented and tested with 100% test coverage.
- AC-03: Critical mutation endpoints enforce idempotency key validation.
- AC-04: Concurrent write test with 20 threads passes with 0 unhandled SQLITE_BUSY.
- AC-05: Database integrity and foreign key checks return clean status.
- AC-06: Dedicated evidence logged at `audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-02-EVIDENCE.md`.

TARGET:
All applicable AC = PASS (6/6).

EVIDENCE OUTPUT:
`audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-02-EVIDENCE.md`

FINAL VERIFICATION:
Run `pnpm run test:database-100` and `pnpm run test:concurrency-transactions-100`.

FINAL RESPONSE FORMAT:
Status: PASS / PARTIAL / BLOCKED
Criteria: 6/6
Tests: ...
Remaining: ...

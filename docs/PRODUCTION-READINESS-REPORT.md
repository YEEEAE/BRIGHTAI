# Production Readiness Report

**Project:** BRIGHTAI / QC Task Manager  
**Audit date:** 2026-08-12  
**Scope:** local repository, generated build artifacts, temporary SQLite databases, unit tests, and local acceptance servers. No production credentials or production database were accessed.

## Executive decision

**Decision: NO-GO**

This audit found strong local implementation and test evidence, but not enough operational evidence for release. There are P0 blockers:

1. The repository-level `render.yaml` defines the main BrightAI site only. It does not define a QC Task Manager Render service, persistent disk, or QC runtime environment. The QC deployment document is guidance, not an active deployment configuration.
2. QC has no public `/api/health` route. The only health route found is for the separate Next.js dashboard. A QC service cannot use the requested application health contract as currently wired.
3. `GROQ_API_KEY` is unset in the audit environment. A live Groq request could not be verified, and the root deployment-surface check returned `500` for `/api/ai/chat/` without provider configuration. Mocked provider tests are not evidence of a live provider integration.

The system must not be described as production ready while these blockers remain.

## Scorecard

The percentages below measure audit evidence coverage and assurance for this review. They are not a release approval and do not override P0 blockers.

| Area | Score | Evidence summary |
|---|---:|---|
| Architecture | 82% | Architecture guard and source-of-truth checks pass; QC deployment wiring is incomplete. |
| Security | 72% | Auth/RBAC/IDOR/CSRF/upload/session checks pass locally; production secret rotation, distributed limits, and CSP cleanup are not verified. |
| Database | 86% | Migration, schema, FK, index, integrity, backup, restore, and retention coverage pass locally. Production disk and restore drill are unverified. |
| Testing | 90% | Required root commands pass; QC suite and elevated acceptance suites pass. Manual accessibility and production-like load evidence are incomplete. |
| Performance | 58% | Query plans and a 1,001-row local SQLite exercise pass; production concurrency, N+1 profiling, and AI latency are unverified. |
| QC Operations | 88% | RBAC, lifecycle, field locking, evidence, SLA, findings/CAPA/RCA, workflow, workload, and reports have local test evidence. Some new UI flows lack dedicated live E2E coverage. |
| AI Governance | 72% | Human review, strict Zod output, redaction, prompt boundaries, retries, and AI audit are tested with mocked providers; live Groq and production PII controls are unverified. |
| Deployment | 35% | Main-site standalone surface passes 56/57 checks; QC Render service, persistent disk, QC health endpoint, and production env verification are missing. |
| **Overall** | **75%** | Good local engineering evidence, insufficient release evidence. |

## Build and test evidence

| Command | Result | Fresh evidence |
|---|---|---|
| `pnpm typecheck` | **PASS** | Root recursive typecheck exited 0. QC Astro check: 144 files, 0 errors, 0 warnings, 13 hints. |
| `pnpm test` | **PASS** | Root suites: 16 + 29 + 38 = 83 tests passed. The output includes soft-fail warnings because `DATABASE_URL` and `GA4_API_SECRET` are unset. |
| `pnpm build` | **PASS with warnings** | Astro server built, 258 public URLs and 269 HTML files generated. Duplicate route-collision warnings remain and may become future build errors. |
| `pnpm e2e:acceptance` | **PASS outside sandbox** | 49 admin-users + 44 auth-lockout + 196 shared-task + 39 delete-request + 45 dashboard + 13 backup checks passed, plus restart-persistence verification. The first sandbox run failed before tests at `listen EPERM`; the elevated rerun passed. |
| `pnpm --filter @brightai/qc-task-manager test` | **PASS** | 265 checks passed, including migrations, architecture, QC operations, templates, audit integrity, AI foundation/features, domain, SLA, workflow, DB rules, and dashboard reports. |
| `node apps/qc-task-manager/scripts/verify-security-hygiene.mjs` | **PASS** | Security hygiene scanner passed. |
| `pnpm run verify:deployment-surface` | **FAIL** | 56/57 checks passed. `/api/ai/chat/` returned 500 because no provider configuration was present. |
| `pnpm lint` | **FAIL** | Dashboard ESLint stopped on existing `@typescript-eslint/no-explicit-any` errors in `apps/dashboard/lib/observability/logger.ts:81`; multiple existing warnings were also reported. |

Important test warnings were retained as evidence, not hidden:

- QC tests repeatedly logged backup scheduler `SQLITE_CANTOPEN` while temporary test databases were being removed. The assertions passed, but the warning needs a clean lifecycle fix or an explicit test-harness waiver.
- Development DB initialization warned that `ADMIN_DEFAULT_PASSWORD` was unset and used the local fallback. Production seeding correctly refuses to continue without that variable, but an actual production boot was not performed.

## Database audit

| Control | Status | Evidence |
|---|---|---|
| Migrations | **Implemented + Tested + Verified locally** | Fresh/existing/upgrade/repeat/checksum drift/failure recovery/data preservation/destructive guard tests passed. Temporary DB reached schema version 10 with 10 migrations. |
| Schema | **PASS locally** | Temporary initialized DB contained 29 tables. Runtime schema validation is fail-fast. |
| Foreign keys | **PASS locally** | `PRAGMA foreign_key_check` returned no violations; migration and domain tests cover FK behavior. Runtime `db.ts` sets `foreign_keys=ON`. |
| Indexes | **PASS locally** | Temporary DB contained 51 indexes; required task, attachment, activity, login, AI-audit, and report indexes were present. |
| Integrity | **PASS locally** | `PRAGMA integrity_check` returned `ok`. |
| Backup | **PASS locally** | Unit/E2E coverage verifies WAL-safe snapshot, metadata, SHA-256, schema/count checks, retention, corruption rejection, and backup not served over HTTP. Backup E2E: 13 checks passed. |
| Restore | **PASS locally / production unverified** | Restore tests verify temporary validation, safety backup, atomic replacement, confirmation guard, and failed-restore preservation. No production restore drill was run. |
| Locking | **PARTIAL** | Runtime config sets WAL and 5-second busy timeout. A synthetic two-connection test showed a concurrent write waited about 5.4s and then returned `SQLITE_BUSY`; this is expected contention evidence, not proof of production capacity. |

The repository contains local database artifacts under `apps/qc-task-manager/db/`; tracked-file scanning found no tracked `.env`, SQLite, or database WAL files. Production persistence remains unverified until the QC Render service and disk are actually configured.

## Security audit

| Control | Status | Evidence / remaining gap |
|---|---|---|
| Authentication | **PASS locally** | bcrypt verification, generic login errors, inactive-user handling, unknown-user dummy hash, 12-hour opaque sessions, logout, and lockout covered by tests/E2E. |
| Authorization / RBAC | **PASS locally** | Central permissions module, server-side role gates, employee/supervisor scope, admin protections, and role acceptance suites passed. |
| IDOR | **PASS locally** | Task/evidence ownership and cross-user access scenarios passed in acceptance suites. |
| CSRF | **PASS locally** | Origin guard and mutation checks covered by root CSRF tests and QC API/E2E checks. |
| Rate limiting | **PARTIAL** | Account lockout and AI feature rate limiting are tested. Distributed production rate limiting and a live endpoint saturation/429 test are unverified; request limits are process-local in parts of the QC app. |
| Upload security | **PASS locally** | Size, extension, MIME, magic bytes, filename normalization, executable rejection, SHA-256, and evidence authorization are covered. |
| Session security | **PASS locally** | HttpOnly, SameSite, Secure-on-HTTPS, path, expiry, server-side session lookup, cleanup, and logout are implemented/tested. `SESSION_SECRET` is documented but currently reserved and not consumed by the opaque-token implementation. |
| Secrets | **PARTIAL** | Current environment had `GROQ_API_KEY=UNSET`; no key-shaped token was found in current files, client bundles, or client HTML. `.env` files are ignored and only examples are tracked. The brain records provider secrets in old Git history as compromised; revoke/rotate outside this workspace is still required. |
| Headers / CSP | **PARTIAL** | QC headers include DENY, nosniff, referrer, COOP/CORP, HSTS in production, and CSP. `style-src` is `'self'` plus one SHA-256 hash for Astro's static island style — `unsafe-inline` removed 2026-08-14 (charts/bars use SVG attributes; verified live with 0 inline style attributes served). Main-site deployment surface protected deny-list paths (56 passing checks), but the same surface check failed the unconfigured AI route. |

## Groq audit

| Requirement | Status | Evidence |
|---|---|---|
| Server-side `GROQ_API_KEY` read | **PASS by source inspection** | `serverAiConfig()` reads `process.env.GROQ_API_KEY` in server code; the request provider sends it in the server-side Authorization header. |
| Model | **PASS by source inspection/tests** | Default is `llama-3.3-70b-versatile`; provider tests assert the model contract. |
| Key absent from Git/current files | **PASS for current checkout / history risk** | No key-shaped token in current files or tracked files. Historical provider-key exposure is recorded as a rotation risk; this audit did not rewrite history. |
| Key absent from bundle | **PASS for key value** | Server bundles contain provider-name/model markers but no key-shaped value; client bundles contain neither key marker nor key-shaped value. |
| Key absent from HTML | **PASS for current build** | Client HTML scan found no key-shaped token or `GROQ_API_KEY` marker. |
| Key absent from logs | **UNVERIFIED live** | Source avoids logging key, Authorization, raw prompt, and raw provider errors. No production log stream was available for verification. |
| Key absent from client env | **PASS for current build** | No client `import.meta.env` exposure was found for the provider key; client bundle scan was clean. |
| Actual server-side request | **BLOCKED** | `GROQ_API_KEY` was unset. No fake or invented key was used. The mocked tests cover provider request construction, structured JSON mode, timeout, retries, 429, and 500, but do not prove external connectivity/quota. |

## AI governance audit

| Control | Status | Evidence / gap |
|---|---|---|
| Human approval | **PASS locally** | Schemas require `human_review_required: true`; prompts declare advisory-only behavior; evidence lifecycle uses `AI_PENDING`/`AI_REVIEWED` and human states. |
| Structured output / Zod | **PASS locally** | Strict feature schemas, bounded confidence/evidence fields, invalid JSON/schema tests passed. |
| Timeout / retry / 429 / 500 | **PASS with mocks** | Abort timeout and bounded transient retries are implemented and tested. Live provider behavior remains unverified. |
| Prompt injection | **PASS locally** | Untrusted QC content is delimited and treated as data; system prompt forbids mutation, approval, closure, RBAC, and deletion authority; injection tests passed. |
| PII minimization | **PARTIAL** | Email, Saudi phone patterns, and secret-like keys are redacted in the QC AI context; evidence BLOBs are not sent. The AI-context path does not demonstrate equivalent redaction for every sensitive class covered by the broader firewall, such as IDs, IBANs, or payment-card data. |
| AI audit | **PASS locally** | `ai_audit_log` records user, feature, model, request/response references, outcome, and sanitized failure information; tests passed. |
| AI failure safety | **PASS locally** | Provider errors return non-authoritative failure responses; evidence failure returns `UNVERIFIED`; no AI result directly mutates approval/RBAC/task state. |

## Business and QC operations audit

| Area | Status | Evidence |
|---|---|---|
| RBAC / field locking | **PASS locally** | Permissions and server-side field locks are tested; UI is not treated as authority. |
| Task lifecycle | **PASS locally** | Status transitions, completion wizard, read-only terminal state, reopen/cancel controls, recurrence, checklists, and dependency blocking are covered by domain and acceptance tests. |
| Evidence | **PASS locally** | Required/optional evidence, metadata, file validation, hash, verification state, completion gate, and retained evidence after reopen are covered. |
| SLA / escalation | **PASS locally** | Policies, timers, thresholds, pause behavior, idempotency, retry recovery, dashboard/report fields, and notifications are covered. There is no separately verified production worker; updates are request/dashboard triggered. |
| Findings / CAPA / RCA | **PASS locally / live UI partial** | State machines and close gates pass. Dedicated live browser coverage for every findings/CAPA/RCA page was not run in this audit. |
| Workflow | **PASS locally / live UI partial** | Snapshot definitions, approvals/rejections, reasons, action audit, workload metrics, and assignment suggestions pass tests. No autonomous assignment was found. |
| Reports | **PASS locally** | Eight report types, CSV/XLSX/PDF paths, scope enforcement, employee restriction, audit metadata, and chunk/keyset reader design are covered. |

## Auditability

| Control | Status | Evidence |
|---|---|---|
| Activity log | **PASS locally** | Server-side task activity events are written in mutation paths and covered by tests. |
| Hash chain | **PASS locally** | SHA-256 canonical event chain, backfill, append verification, and tamper detection tests passed. The chain detects alteration; it does not make SQLite immutable. |
| AI audit | **PASS locally** | Sanitized AI audit records and outcome fields tested. |
| Evidence audit | **PASS locally** | Evidence metadata, hashes, status, uploader, and related activity are stored and tested. |
| Approval audit | **PASS locally** | Workflow/Finding/CAPA approval and rejection reasons/actors are persisted and tested. |

## Performance audit

- Reporting uses parameterized set-based queries and keyset pagination/chunk size 500. The local `EXPLAIN QUERY PLAN` exercise used the attachment index for the correlated evidence lookup.
- Synthetic SQLite exercise: 1,001 tasks seeded into a temporary DB; 251 completed rows returned from a bounded report query in about 0.22ms locally; no N+1 query loop was found in the report reader.
- Synthetic locking exercise: WAL enabled, second connection had a 5,000ms busy timeout, and a held write transaction caused the concurrent write to wait about 5.4s before `SQLITE_BUSY`. This exposes the current contention behavior; it is not a production SLO result.
- No production-shaped dashboard/report volume benchmark, browser performance trace, large evidence upload test, concurrent HTTP load test, or live AI latency measurement was available.
- One findings query plan showed a full task scan for a department-filtered query. This is a P2 tuning candidate; add an index only after measuring a representative production dataset.

## Deployment audit

| Check | Status | Evidence |
|---|---|---|
| Astro SSR / Node artifact | **PASS locally** | QC build produced a Node standalone server; root standalone surface served expected public/deny-list paths. |
| Main-site Render config | **PARTIAL** | Root `render.yaml` defines `brightai-site`, Node start, and `/api/health/`; this is not a QC service. |
| QC Render service | **BLOCKED** | No QC service exists in root `render.yaml`; `apps/qc-task-manager/docs/DEPLOYMENT.md` explicitly says manual service creation is still required. |
| Persistent SQLite | **UNVERIFIED operationally** | Documentation specifies `/var/data/qc_tasks.db` and `/var/data/backups`, but no actual Render disk was inspected. |
| Environment variables | **UNVERIFIED operationally** | Names and source contracts exist; current shell has no production values. Required names include `QC_DATABASE_PATH`, `QC_BACKUP_DIR`, `ADMIN_DEFAULT_PASSWORD`, and Groq provider configuration. Values are intentionally omitted. |
| Health endpoint | **BLOCKED for QC** | No `apps/qc-task-manager/src/pages/api/health*` route exists. `/login` is documented as the QC Render health check, but that is not a dedicated health contract. |
| Backup / recovery | **PASS locally / operationally partial** | Local tests and runbooks pass; independent off-service backup and timed restore drill are not evidenced. |
| Pre-deploy gate | **FAIL in this checkout** | `pnpm run verify:deployment-surface`: 56 passed, 1 failed because `/api/ai/chat/` returned 500 without provider env. |

## P0 blockers

### P0-1 — QC deployment is not wired as a releasable service

**Evidence:** `render.yaml` contains only `brightai-site`; QC deployment docs say the service must be created separately. There is no verified Render service, persistent disk, runtime env, or QC start/health contract in the repository deployment surface.

**Required next action:** create/review the QC Node Web Service configuration, attach persistent storage, configure environment names in the deployment system, and run a real post-deploy smoke/health check.

### P0-2 — Groq live integration and provider configuration are unverified

**Evidence:** current `GROQ_API_KEY` is unset. Mocked provider tests pass, but `/api/ai/chat/` returned 500 in the real standalone deployment-surface probe. No live request was attempted with a fabricated value.

**Required next action:** configure the secret in the server environment only, run one controlled server-side request, capture sanitized status/model/latency evidence, and verify logs/bundles/client HTML without printing the key.

### P0-3 — QC health endpoint is absent

**Evidence:** no QC health route exists under `apps/qc-task-manager/src/pages/api`; the health route found belongs to `apps/dashboard`.

**Required next action:** define the operational health contract and wire the QC deployment check to it, then verify HTTP status and DB readiness on the deployed service.

## P1 risks

- Historical provider secrets are recorded as exposed in Git history and need external revoke/rotate confirmation.
- Rate limiting is not proven across multiple instances; some limits are process-local.
- AI PII minimization is narrower than the broader firewall’s sensitive-data coverage.
- Production backup disk, off-service copy, restore drill, and retention monitoring are not verified.
- Backup scheduler emits `SQLITE_CANTOPEN` warnings during temporary test cleanup.
- Manual accessibility QA (keyboard plus screen reader) and production-like HTTP load evidence are absent.
- Root build reports duplicate route collisions that may become hard errors in a future Astro version.

## P2 improvements

- Add production-shaped `EXPLAIN QUERY PLAN` and benchmark fixtures before adding composite indexes.
- Add a documented QC health/readiness probe and a sanitized deployment smoke script.
- Add live E2E coverage for Findings/CAPA/RCA/Workflow/Workload/AI approval pages.
- Separate test backup scheduler lifecycle from temporary DB teardown.
- Add AI latency/429/5xx telemetry with redacted logs and an operational SLO.
- Remove the remaining CSP inline-style dependency when the UI can migrate safely.

## Release gate

Release approval remains **NO-GO** until every P0 is closed and re-verified. The minimum evidence package for a subsequent review is:

1. QC Render service + persistent disk + environment names configured and captured without secret values.
2. QC health endpoint returning the agreed healthy response from the deployed service.
3. Controlled live Groq request using `llama-3.3-70b-versatile`, with sanitized response status, latency, model, retry behavior, and log scan.
4. Post-deploy auth/RBAC/IDOR/CSRF/upload smoke checks against the deployed URL.
5. Independent backup copy and a timed restore drill with evidence of preserved data and rollback behavior.

No feature was added as part of this audit. This document records verification status only.

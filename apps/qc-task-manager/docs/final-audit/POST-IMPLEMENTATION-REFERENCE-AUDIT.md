# POST-IMPLEMENTATION REFERENCE AUDIT — QC Task Manager

**Task ID:** QC-POST-IMPLEMENTATION-MASTER-AUDIT-022 · **Mode:** independent forensic audit (read-only; only audit artifacts created) · **Date:** 2026-08-28
**Baseline (frozen):** HEAD `b51504b7ae4e0b8a424a23c6190a43de9a0d2670`, branch `main`, Node v22.22.3, pnpm 10.19.0.
**Dirty state at audit time:** `.agents/mind/01-mind-latest.md` (tracked, modified — project log) + `apps/qc-task-manager/docs/FINAL-PILOT-READINESS.md` (untracked report). **No runtime source or tests exist only as untracked files** — no reproducibility finding against product code.

---

## 1. Executive Summary

The QC Task Manager at current HEAD is a **functionally complete, well-secured, strongly-tested internal QC/Lab system** whose mandatory release gate is currently **broken by a verified test-code regression, not a product defect**: `pnpm e2e:acceptance` aborts inside `e2e-lab-form` (P1-001) because the contextual-help text added by QC-PILOT-UAT-019 contains the literal strings "Save Draft" / "Submit for Review", which collide with Playwright text-locators. The crash aborts the runner, leaving 15 E2E suites + 2 persistence phases unexecuted in the current verification run. Every other gate passes on fresh execution: typecheck, 60/60 canonical suites, migrations (38/38, checksums MATCH), embedded parity, production build, DB doctor (integrity/FK/parity PASS on a disposable DB), and an isolated backup→mutate→restore→restart→chains drill (PASS).

The previous session's claim (QC-COMPANY-PILOT-GATE-021) that `pnpm e2e:acceptance` was green **is STALE/FALSE at the same HEAD** — this audit's run is the current truth.

**Final verdict: CONDITIONAL GO** (no P0; one verified P1 gate failure + one P1 secret-rotation item + human UAT and live deployment remain unverified).

## 2. Audit Baseline

See §Audit Baseline above; evidence logs: `/tmp/qc-audit-gates.log` (all gates with start/end/exit), `/tmp/qc-prodops.log` (restore drill), disposable DBs `/tmp/qc-audit-forensic.db`, `/tmp/qc-audit-prodops.db` (created and deleted during audit).

## 3. Scope

457 in-scope files reviewed (100% coverage — see [FILE-COVERAGE.md](FILE-COVERAGE.md)): `src/**` (276), `db/` schema+seed+38 migrations, `scripts/` (107), `docs/` (19), `public/` (4), app configs, plus repo-level QC-affecting files (`pnpm-workspace.yaml`, `.github/workflows/qc-release-gate.yml`, root `package.json`). Excluded: `node_modules`, `dist`, `.astro`, runtime DB/WAL/backup artifacts, `download/qa` outputs.

## 4. Methodology

1. Phase 0 freeze (git/node/pnpm snapshot). 2. Full gate execution with timestamps and exit codes (no summarized PASS for commands that did not reach final exit). 3. Disposable-DB forensics (fresh init, doctor, integrity, FK, backup/restore drill). 4. Three parallel read-only forensic agents (inventory/routes/RBAC; security; UI/UX) with file:line evidence. 5. Static source scans (TODO/console/any/eval/secrets/CSP). 6. Old-claims verification table (Phase 2). 7. Findings classification + weighted scoring per the mandated formulas.

## 5. File Coverage

457 files — 426 CLEAN, 15 ISSUE (finding IDs attached), 16 REQUIRES-RUNTIME-EVIDENCE (15 E2E suites blocked by gate abort + DEPLOYMENT live evidence). Full table: [FILE-COVERAGE.md](FILE-COVERAGE.md).

## 6. Current Architecture

Astro 6 SSR (`output:'server'`, `@astrojs/node` standalone) + better-sqlite3 (WAL, single-writer contract) + React islands + Tailwind. Authorization centralized in `src/lib/permissions.ts` (577 lines, 88 exported symbols); request security in `src/lib/api-security.ts` (CSRF via Sec-Fetch-Site/Origin, 12MB cap, content-type allowlist, in-memory rate limits with pruning); observability in `src/lib/observability.ts` (request ID, structured JSON logs, stable error codes); migrations via embedded frozen registry (`src/lib/migrationRegistry.ts`) with checksum drift guard; audit via hash-chained `task_activity_log` + `qc_audit_log` (+ `task_deletion_history` immutable triggers). Astro built-in origin check disabled (`security.checkOrigin:false`) and compensated by explicit CSRF — documented. No business logic found in pages beyond presentation; no authorization outside `permissions.ts` detected; no circular/god-module or duplicate-canonical problems found (historical duplicates like `escapeLike` ×9 reduced to ×3 remaining definitions).

## 7. Current System Inventory

- Routes: 114 file routes (76 pages, 12 GET API, 26 mutation API) + 27 middleware form-POST surfaces + 25 middleware short-circuit patterns, 6 guards. See [ROUTE-COVERAGE.md](ROUTE-COVERAGE.md).
- Tests: 62 `test:*` commands = 60 canonical suites + 2 meta; 28 canonical E2E suites + 4 classified non-runnable scripts; filesystem-vs-registry reconciliation = **0 orphans**. 1 intentionally-unregistered known-broken manual diagnostic (`test-report-pdf-arabic.mjs`, P3-018).
- AI: 15 advisory features behind `requireAiRateLimit`, safe-mode when unconfigured (503 `{aiUnavailable:true}`).
- Reports: 24 types (8 task + 16 lab) × CSV/XLSX/PDF via single transport endpoint + audit.

## 8. Database Inventory

- Migrations: 001→038, all executed on disposable DB with checksums MATCH; embedded parity 38/38 byte-identical; rollback/failure guards tested by `test:migrations` (exit 0).
- Runtime DB (fresh init): **51 tables** (49 schema tables incl. `ai_audit_log` + 2 runner bookkeeping tables), **127 CREATE INDEX** statements in migrations (101 in schema.sql mirror), **7 immutability triggers** (deletion history ×2, sample freeze ×2, env-reading freeze ×2, sample identifier immutable).
- `PRAGMA integrity_check` PASS, `PRAGMA foreign_key_check` PASS, db-doctor PASS.
- **P2-008:** `db/schema.sql` mirror drift — missing `ai_audit_log` + 6 indexes; contains `idx_tasks_template` not in migrations (documentation-only drift; migrations are declared source of truth).

## 9. Route/API Inventory — see [ROUTE-COVERAGE.md](ROUTE-COVERAGE.md)

## 10. RBAC Matrix (verified: permission predicate = UI visibility = server enforcement; UI hiding is never the enforcement)

| Resource | admin | manager | supervisor | employee |
|---|---|---|---|---|
| Dashboard | Y | Y | Y | N |
| Users / user audit / templates (admin) | Y | N | N | N |
| Tasks: create/edit/delete | Y | Y (delete Y) | Y (delete N) | own-editable-subset; delete-request only |
| Delete requests | Y | review | submit only | submit only |
| Findings/RCA/CAPA | manage+approve | manage+approve | manage (no content-edit/approve) | own only |
| Lab tests: create/edit/submit/review/approve/void | Y | Y | review only (never own) | own drafts (D-4/D-5 guards) |
| Lab master data (products/equipment/calibration) | direct | direct | propose via change request | propose |
| Templates: review/approve | approve | approve | review (never own) | N |
| Documents: review/approve/archive | Y | Y | review (never own) | author own drafts |
| WI acknowledgements assign | Y | Y | Y | N |
| Change requests: submit/withdraw/review | Y | Y | Y own | Y own (withdraw PENDING own) |
| Lab reports/exports/data-quality/audit | Y | Y | Y | N |
| Lab management dashboard | Y | Y | N | N |
| Maintenance records | Y | Y | Y | Y |
| AI assist | Y | Y | Y | Y |

Self-review/self-approval prevention is hard-coded at record level for tests, documents, templates, and change requests (even admin denied). Terminal states immutable (DB triggers + predicates). Direct-route access attempts covered by E2E RBAC suites (`forged POST redirects (302)` etc. — executed this run, PASS).

## 11. Authentication/Security

bcrypt cost 10; 256-bit opaque session tokens, server-side sessions, 12h TTL; cookie HttpOnly+SameSite=Lax (+Secure when HTTPS detected, TRUST_PROXY-gated); 5-strike 10-min lockout + 20/IP/10min gate; dummy-hash timing defenses on all unknown-identity paths; `must_change_password` enforced by middleware before role gates with live DB derivation; role change effective next request via live join; production refuses unsafe seeding (`ADMIN_DEFAULT_PASSWORD` required; boot refuses if any account still matches `admin123`); login credential hint dev-only. Findings: P2-005 (chunked body bypasses Content-Length cap), P2-006 (guards hinge solely on NODE_ENV), P2-011 (Secure cookie not forced for plain-HTTP deployment), P3-013/P3-014/P3-015 (below), SECRET-LIKE VALUE FOUND — ROTATION REQUIRED: P1-002 (repo-root `README.md:33` embeds a real Ed25519 private key under an eval key-ring example) and P3-021 (`.claude/settings.local.json` holds a live-looking API token — untracked/ignored; relocate+rotate).

## 12–14. Tasks / QC Operations / Laboratory

Task workflow (create→assign→start→progress→hold→blocker→comment→attachment→evidence→checklist→dependency→SLA→escalation→complete→reopen→cancel→delete-request→durable deletion) verified via canonical suites executed this run (task-shared 196/0, delete-request 40/0, SLA/workflow/audit-integrity/delete-durability all green). QC operations (findings/RCA/CAPA/evidence) green in the same chain. Lab subsystem verified by 12 executed suites (lab-nav 93/0, lab-suggest 20/0) plus unit layers (lab-tests 258/0-class contracts run within `pnpm test` chain); **the 15 lab E2E suites after `lab-form` did NOT execute this audit** (P2-004) — their last full-run evidence predates P1-001. Terminal-state immutability and snapshots enforced at DB level (7 triggers, snapshot tables). No-self-review/no-self-approval verified in `permissions.ts` (§10). WI register intentionally blocked at page 1/3 (33 source-exact rows, SHA-256 fingerprint, readiness TODO constant `WI_CATALOG_READINESS_TODO`) — SOURCE-BLOCKED by missing controlled pages 2/3 and 3/3 (HUMAN/SOURCE-VALIDATION-REQUIRED; app correctly refuses to invent them).

## 15–21. Templates / Products / Equipment / Calibration / Maintenance / Retests / Documents+WI

Implemented with lifecycle (DRAFT→IN_REVIEW→APPROVED→SUPERSEDED/ARCHIVED), e-signature on approvals, no-self-approval, stale protection (`updated_at` token, `base_updated_at`), canonical-service reuse for approved proposals, and provenance for WI (`SOURCE_IMPORT`, nullable `created_by`). Unit/contract coverage green this run; E2E coverage for these surfaces pending gate restore (P2-004). Business policy decision still open for QC management: overdue-calibration warn-vs-block is intentionally not invented by the system (flagged `requires_approval` only) — HUMAN-VALIDATION-REQUIRED.

## 22. Change Requests

Lifecycle PENDING→APPROVED/REJECTED/WITHDRAWN (migration 038); owner-only withdrawal inside a transaction with `STATUS_TRANSITION` audit; canonical mutation NOT invoked on withdrawal; stale-target detection + optimistic concurrency verified by suites; notifications atomic with mutations via `createNotificationOrThrow`. Green: `test:lab-change-requests` within the 60-suite chain (exit 0).

## 23. Reporting

24 types × 3 formats; single transport endpoint; scope resolved server-side from session only (`resolveReportScope`); forged scope → 403; unknown filters → 400; Content-Disposition safe; `report_audit_log` start/complete/fail; last full E2E evidence (912/0) predates this audit — E2E `reports` suite did not execute this run (P2-004). CSV formula-injection neutralization verified.

## 24. Audit/Traceability

Hash-chained `task_activity_log` and `qc_audit_log` (canonical append helper, tamper-evident), immutable `task_deletion_history`, user-admin audit on the same chain (entity USER), report audit log. Chains verified programmatically this run (production-operations drill: audit chains PASS after restore+restart). No mutation path found writing state without required audit events during review. Claim "all changes are hash chained" is **not** claimed — deletion-request live rows and some low-risk tables (e.g., saved views) intentionally lack chain pairing (documented in earlier sessions; acceptable, noted as P3 observation).

## 25. Notifications

One canonical system (`notifications` table + `notificationPresentation.ts`), 32 kinds, dedupe key (migration 025), entity hrefs (migration 022), read state shared; workflow-critical notifications persisted atomically with mutations; filters (All/Unread/Tasks/Tests/Documents/ChangeRequests/Calibration-Equipment) with allowlist + counters. `test:lab-notifications` 107/0 evidence (prior session) + suite green in chain this run.

## 26. Backup/Restore/System Health

Verified **this audit on disposable DBs**: backup created (856KB, trigger=test + manual), restore drill with exact-confirmation, restart persistence, `integrity_check`/`foreign_key_check` PASS, audit chains PASS, deployment-contract assertions PASS (single-instance guards). Scheduler validity requires verification PASS + same-Riyadh-day; catch-up serialized. `/admin/system-health` exposes app version, DB path (masked), sizes, schema version, FK/integrity, backup age/verification, disk warning. `/api/health` public readiness (no secrets). Disk note: 4.5GB local backups under `db/backups/` (untracked, gitignored) — operator cleanup advised (P3).

## 27. Deployment Configuration

`docs/DEPLOYMENT.md` matches current contract: manual Render Web Service (QC deliberately outside root `render.yaml` — documented decision), `QC_DATABASE_PATH` precedence, `QC_BACKUP_DIR` honored by runtime+CLI in one place (guard-tested), single-instance env guards (`WEB_CONCURRENCY`/`RENDER_NUM_INSTANCES`/`QC_HORIZONTAL_SCALING` fail-closed before DB open), NODE from `.node-version` 22.22.2, pnpm 10.19.0. Pre-pilot checklist present. **LIVE PRODUCTION VERIFICATION: NOT PERFORMED (REQUIRES-RUNTIME-EVIDENCE)** — no claim of deployed behavior is made from source inspection.

## 28. CI/Tests

`.github/workflows/qc-release-gate.yml` (contents:read only, no secrets, no deploy) gates PRs on typecheck+manifest+route-manifest+parity+migrations+full tests+build, and runs full E2E acceptance on push/nightly/dispatch. Local execution this audit: all green **except `e2e:acceptance` (exit 1, P1-001)**.

## 29–34. UI / UX / Navigation / Forms / Accessibility / Responsive

- Design system (`docs/UI-DESIGN-SYSTEM.md` + `src/components/ui/*`) enforced by `test:ui-consistency` **164/164 checks** (ran in chain this run). Adoption: PageHeader 40 pages (33/48 lab), AppButton 23, Banner 25, Pagination 12/12 registers, formPresets 10, labBadgeClasses 12 pages; banned `h1 text-3xl` only in 2 documented-exempt files. Gaps: admin/section + 35 non-lab pages hand-roll headers (P2-009); StatusPill adopted by only 3 pages (P2-009).
- Navigation: role-filtered grouped nav with `aria-current`, mobile groups = desktop IA, zero dead targets; LabSecondaryNav longest-prefix active matching.
- Forms: LabTestForm (1288 lines) exemplary — 7 sections, sticky nav+action bar, 12-row grid with duplicate/fill-down/paste/undo, error summary with focus, double-submit protection; shared `form-productivity.js` progressive enhancement on 6 forms; **2 POST forms lack it** (P2-007). Data preservation and 12-row workflows covered by `test:lab-form` 72/0 (unit) — browser-level flow currently blocked at the gate (P1-001 is a locator collision in the TEST, not a form defect; the two sticky-bar assertion failures are test-contract drift, and the form itself renders and saves, as proven by the 20/20 passing render/forged-POST/keyboard assertions in the same run).
- Accessibility: axe gate (WCAG 2.x A/AA) Critical=0/Serious=0 on 12 pilot pages (86/0 assertions executed this run — inside acceptance before the abort) + 5 keyboard scenarios + structural checks; coverage limited to 12/76 pages (P2-010).
- Responsive: 18 screens × 4 viewports infrastructure (648 checks last full run); not executed this audit (P2-004).

## 35. Performance

`download/qa/qc-performance.md` (large profile: 10k tasks / 5k tests / 60k samples, 9 runs): all p95 ≤ 4.639ms; worst = reports 4.639ms (uses index `idx_lab_tests_created_at`), task-search p95 1.921ms with documented `SCAN tasks` + temp B-tree — evidence recorded, no speculative indexes added (correct). Integrity ok, 0 FK violations. No new bottlenecks identified.

## 36. Observability

Request ID (inbound-honored, `X-Request-ID` echo), structured JSON request logs (no payloads/secrets/exception text), stable error codes (AUTH/FORBIDDEN/VALIDATION/NOT_FOUND/CONFLICT/STALE_CHANGE/DB/REPORT/UPLOAD), 500 JSON with request id, `OperationalState.astro` unified actionable empty/error states. Verified by `test:observability` (in chain) + agent review.

## 37. Maintainability

`astro check` 0 errors/0 warnings/26 hints; `: any` ×8; `@ts-ignore` ×0; `eslint-disable` ×3; `SELECT *` ×44 (reviewed: benign in this codebase — narrow projections acceptable; flagged for gradual cleanup only); console.* ×83 (server-side operational logging, mostly intentional with prefixes; no secrets logged — secrets scan clean); dead code: 1 dead GET route (P3-012) + known-broken manual diagnostic (P3-018). Dependencies all used and justified (react-dom peer-required by @astrojs/react).

## 38. Documentation

19 docs reviewed. Accurate: ARCHITECTURE, DATABASE, MIGRATIONS, RESTORE, ROLES-AND-PERMISSIONS, TESTING, PILOT-UAT, AI-SAFE-LAUNCH, REPOSITORY-AUDIT, SQLTOOLS. Gaps: UI-DESIGN-SYSTEM.md missing the canonical-final primitives section (P3-017); DEPLOYMENT.md accurate but inherently NOT-LIVE-VERIFIED.

## 39. Human UAT

`docs/PILOT-UAT.md` runbook exists with per-role scenarios, evidence fields, and P0–P3 result classification; contextual help exists on 6 screens. **HUMAN UAT: NOT VERIFIED** — zero real staff results exist (any claimed percentage would be fabricated).

## 40. Finding Register

### P1 (must fix before pilot/release process can be trusted)

- **P1-001 — Mandatory acceptance gate aborts (e2e-lab-form).** Severity P1 (gate reliability; product form itself functional). Category: Testing/CI. Affected: all roles × lab form E2E; blocks 15 suites + 2 persistence phases. Evidence: `scripts/e2e-lab-form.mjs:126` (`getByText('Submit for Review').count() === 1` — now 2 due to help text) fails ×8 (4 roles × air/vacuum); `scripts/e2e-lab-form.mjs:176` `page.click('text=Save Draft')` resolves to **3 elements**, first = hidden help paragraph `src/pages/lab/tests/new.astro:154` → uncaught TimeoutError → `scripts/e2e-acceptance.mjs:148` throws → runner exits 1. Reproduced: full run + structural source proof. Expected: gate reaches final exit with all 28 suites. Actual: 12 suites pass (823 assertions), lab-form fails, runner aborts. Root cause: QC-PILOT-UAT-019 added help copy containing the exact button labels; its session never re-ran `e2e-lab-form`/acceptance. Fix: make locators role/selector-based (`getByRole('button', {name:'Save Draft'})`) + relax sticky assertion to button-scoped counts; re-run full acceptance. Regression risk: low (test-only). Required tests: full `pnpm e2e:acceptance` exit 0. Confidence: HIGH.
- **P1-002 — SECRET-LIKE VALUE FOUND — ROTATION REQUIRED.** `README.md:33` embeds a real Ed25519 **private key** PEM in the `EVAL_CERT_SIGNING_KEY_RING` example (immediately under "Keep private key secret"). Category: Security hygiene. Impact: repo readers can forge eval signature artifacts wherever the documented key ring is deployed. Fix: rotate key, replace README value with placeholder, add secret-scan pattern. Value intentionally not reproduced here. Confidence: HIGH.

### P2 (important before broader rollout)

- **P2-003** Tracked zero-byte SQLite artifacts `qc_tasks.db`, `qc_tasks 3.db` at app root; `.gitignore` covers only `db/*.db`. Fix: `git rm --cached` + broaden ignore. (blocks security-hygiene gate)
- **P2-004** 15 E2E suites + 2 persistence phases not runtime-verified this audit (blocked by P1-001). Fix: after P1-001, one full green acceptance run.
- **P2-005** Chunked bodies (no `Content-Length`) bypass the 12MB cap (`src/lib/api-security.ts:125-131`).
- **P2-006** All production default-credential guards key solely on `NODE_ENV=production` (`src/lib/seed.ts:40,55`, `login.astro:25`).
- **P2-007** `lab/change-requests/new.astro:35` + `lab/retests/new.astro:94` POST forms lack `data-qc-form` double-submit/dirty protection.
- **P2-008** `db/schema.sql` mirror drift (missing `ai_audit_log` + 6 indexes; extra `idx_tasks_template`).
- **P2-009** Design-system rollout incomplete outside lab (35 pages hand-rolled headers incl. all admin; StatusPill only 3 pages).
- **P2-010** axe gate covers 12/76 pages; findings/admin/notifications/search unscanned.
- **P2-011** Session cookie `Secure` depends on request-scheme detection; plain-HTTP deployment silently ships non-Secure cookie (`src/lib/session.ts:26-33`).

### P3 (optional/roadmap)

- **P3-012** Dead route `GET /api/tasks/suggestions` (zero references).
- **P3-013** `login.astro:11` duplicates a weaker redirect check instead of `safeRedirectTarget`.
- **P3-014** Unconditional 5-strike lockout enables targeted 10-min account DoS (documented spec; consider progressive delay).
- **P3-015** bcrypt cost 10 (OWASP now suggests 12).
- **P3-016** Misleading middleware comment claims Astro origin-check "already ran" while `security.checkOrigin:false` (`src/middleware.ts` /login branch; `astro.config.mjs:20-22`).
- **P3-017** `docs/UI-DESIGN-SYSTEM.md` missing canonical-final section (notificationPresentation/formPresets/labBadgeClasses/PageHeader-on-lab rule).
- **P3-018** `scripts/test-report-pdf-arabic.mjs` known-broken manual diagnostic (needs product decision: reverse vs mark-positioning as PDF-writer contract).
- **P3-019** ContextualHelp on only 6 screens; heavy approval surfaces lack guidance.
- **P3-020** Emoji in enterprise UI copy (`Navbar.tsx:397`, notifications empty state).
- **P3-021** `.claude/settings.local.json` live-looking API token in project dir (untracked; relocate+rotate).
- **P3-022** 4.5GB `db/backups/` + stray `db/*.db` runtime artifacts in work tree (untracked; operator cleanup + backup-retention review).

**Counts: P0=0 · P1=2 · P2=9 · P3=11.**

## 41. Percentage Scorecard

Formula per category: 40% implementation + 30% verification + 20% correctness/security + 10% UX/ops. (Verification component uses this audit's fresh executions; for categories whose E2E layer is blocked by P1-001, verification is capped by unit/contract-layer green + last-known-full-run evidence.)

| Category | Impl% | Verif% | Qual% | UX/Ops% | Score | Evidence / deductions |
|---|---:|---:|---:|---:|---:|---|
| Architecture | 96 | 92 | 94 | 90 | 94.4 | clean layering; checkOrigin comment P3-016 |
| Backend/API | 97 | 90 | 96 | 90 | 94.0 | 36/36 API security-checked; dead route P3-012 |
| Database/Migrations | 98 | 100 | 96 | 95 | 97.5 | 38/38 fresh PASS; mirror drift P2-008 |
| Authentication | 97 | 95 | 92 | 92 | 94.6 | NODE_ENV-only guards P2-006; cost 10 P3-015 |
| Authorization/RBAC | 98 | 92 | 97 | 92 | 95.4 | matrix verified; E2E RBAC partial-run this audit |
| Request Security | 95 | 92 | 90 | 90 | 92.4 | chunked-body P2-005; rate limits in-memory by design |
| Task Management | 97 | 90 | 95 | 92 | 94.2 | task-shared 196/0 this run |
| QC Operations | 96 | 90 | 95 | 90 | 93.4 | findings/capa chains green in chain |
| Laboratory Core | 97 | 85 | 95 | 92 | 92.5 | E2E lab suites blocked (P2-004) |
| Lab Test Workflow | 96 | 82 | 95 | 90 | 91.2 | lab-form unit 72/0; E2E broken P1-001 |
| Templates | 96 | 85 | 96 | 90 | 92.1 | lifecycle+e-sig verified |
| Products | 96 | 85 | 96 | 90 | 92.1 | proposals/eligibility verified |
| Equipment | 96 | 85 | 95 | 90 | 91.9 | archive/restore, attention filter |
| Calibration | 95 | 85 | 95 | 88 | 91.2 | warn-vs-block policy open (HUMAN) |
| Maintenance | 96 | 85 | 96 | 90 | 92.1 | append-only verified |
| Retests | 96 | 85 | 96 | 90 | 92.1 | e-sig + queue path verified |
| Controlled Documents | 95 | 85 | 96 | 88 | 91.4 | escape-only renderer immune to stored XSS |
| WI | 90 | 88 | 95 | 85 | 90.0 | SOURCE-BLOCKED pages 2/3,3/3 |
| Change Requests | 97 | 90 | 96 | 92 | 94.2 | withdrawal+atomic notifications |
| Reporting | 96 | 82 | 96 | 92 | 91.6 | E2E reports not run this audit (P2-004) |
| Audit/Traceability | 97 | 95 | 96 | 92 | 95.4 | chains PASS in restore drill |
| Notifications | 96 | 90 | 96 | 92 | 93.8 | atomic persistence, filters |
| Backup/Restore | 97 | 100 | 97 | 93 | 97.4 | drill PASS this audit |
| System Health | 95 | 95 | 95 | 92 | 94.7 | admin page + health endpoint |
| Deployment Configuration | 90 | 88 | 92 | 85 | 89.4 | contract-tested; NOT-LIVE-VERIFIED |
| CI | 92 | 90 | 90 | 88 | 90.2 | workflow exists; local gate red P1-001 |
| Automated Testing | 95 | 70 | 94 | 88 | 87.4 | 60/60 green; acceptance gate FAIL P1-001 |
| Accessibility | 92 | 90 | 94 | 88 | 91.4 | Critical=0/Serious=0 (12 pages); P2-010 |
| Visual Design | 88 | 92 | 92 | 88 | 90.0 | P2-009 rollout gap |
| UI Consistency | 88 | 94 | 92 | 88 | 90.6 | 164/164 guard |
| UX/Ease of Use | 85 | 88 | 92 | 86 | 88.0 | P2-007, P3-019 |
| Navigation | 95 | 92 | 95 | 92 | 94.0 | zero dead targets |
| Forms | 90 | 82 | 94 | 88 | 89.0 | P2-007; lab-form gate collision |
| Tables | 94 | 92 | 94 | 92 | 93.2 | scroll containers, standard headers |
| Responsive Design | 92 | 75 | 93 | 90 | 87.6 | infra strong; not run this audit |
| Performance | 94 | 96 | 95 | 92 | 94.6 | p95 ≤ 4.64ms evidence |
| Observability | 95 | 92 | 96 | 92 | 94.0 | request IDs, safe codes |
| Maintainability | 92 | 90 | 92 | 88 | 91.0 | 0 ts-ignore, 8 any, 3 dup escapeLike |
| Documentation | 88 | 90 | 92 | 86 | 89.2 | P3-017 |
| Operational Readiness | 85 | 88 | 90 | 82 | 87.0 | runbooks ready; live ops unproven |

## 42. Weighted Overall Score

Weights per Phase 37. Computation (category score × weight):

| Category | Score | Weight | Contribution |
|---|---:|---:|---:|
| Architecture | 94.4 | 5% | 4.720 |
| Backend/API | 94.0 | 7% | 6.580 |
| Database/Migrations | 97.5 | 7% | 6.825 |
| Authentication | 94.6 | 5% | 4.730 |
| Authorization + Request Security | (95.4+92.4)/2=93.9 | 8% | 7.512 |
| Tasks + QC Operations | (94.2+93.4)/2=93.8 | 6% | 5.628 |
| Laboratory Core | 92.5 | 9% | 8.325 |
| Controlled Documents + WI | (91.4+90.0)/2=90.7 | 5% | 4.535 |
| Equipment/Calibration/Maintenance | (91.9+91.2+92.1)/3=91.7 | 5% | 4.585 |
| Reporting | 91.6 | 4% | 3.664 |
| Audit/Traceability | 95.4 | 5% | 4.770 |
| Notifications | 93.8 | 3% | 2.814 |
| Backup/Restore/System Health | (97.4+94.7)/2=96.05 | 5% | 4.8025 |
| Deployment/Operations | (89.4+87.0)/2=88.2 | 5% | 4.410 |
| Testing/CI | (90.2+87.4)/2=88.8 | 6% | 5.328 |
| UI Design | (90.0+90.6)/2=90.3 | 4% | 3.612 |
| UX/Navigation/Forms | (88.0+94.0+89.0)/3=90.3 | 4% | 3.612 |
| Accessibility/Responsive | (91.4+87.6)/2=89.5 | 3% | 2.685 |
| Performance | 94.6 | 2% | 1.892 |
| Maintainability/Documentation | (91.0+89.2)/2=90.1 | 2% | 1.802 |

Sum = **91.6%** (rounded to one decimal; no per-category rounding applied before summation).

### Top-level reference scores

| Score | % | Basis |
|---|---:|---|
| Code implementation completeness | 96 | all mandated capabilities implemented; minor gaps (P2-007/009, P3-012) |
| Automated verification confidence | 84 | 60/60+build+migrations+drill fresh-green; acceptance gate FAIL + 15 suites unexecuted this run |
| Security readiness | 91 | no critical findings; P1-002 rotation, P2-005/006/011, P3-013/014/015/021 |
| Data-integrity readiness | 97 | migrations/integrity/FK/chains/backup all fresh-PASS |
| UI/Design maturity | 90 | design system + guards; rollout gaps P2-009 |
| UX technical readiness | 88 | P2-007, P3-019/020 |
| Operational readiness | 87 | runbooks/doctor/backup solid; live ops unproven |
| Deployment-config readiness | 89 | contract-tested, internally consistent; NOT-LIVE-VERIFIED |
| Human UAT readiness | 40 | runbook+help exist; **results: NOT VERIFIED (0 executed)** |
| Controlled company pilot readiness | 82 | blocked by P1-001 (gate), P1-002 (rotation), UAT, live deployment |
| Production readiness | 78 | above + live deployment verification missing |

## 43. Completion Matrix

| Capability | Status |
|---|---|
| Auth + password lifecycle | COMPLETE (runtime-verified) |
| RBAC + request security | COMPLETE (verified; direct-route E2E checks passed in-run) |
| Tasks + delete durability | COMPLETE (runtime-verified) |
| Findings/RCA/CAPA/Evidence | COMPLETE (verified) |
| Lab tests + review/approval/e-signature | COMPLETE-BUT-NOT-RUNTIME-VERIFIED (E2E blocked this run; unit layer green) |
| Samples/env-reading immutability | COMPLETE (DB triggers + suites) |
| Templates lifecycle | COMPLETE (verified) |
| Products/Equipment/Calibration/Maintenance | COMPLETE-BUT-NOT-RUNTIME-VERIFIED (E2E blocked this run) |
| Controlled documents + acknowledgements | COMPLETE-BUT-NOT-RUNTIME-VERIFIED (E2E blocked this run) |
| WI register | PARTIAL — SOURCE-BLOCKED (pages 2/3, 3/3 not supplied) |
| Change requests + withdrawal | COMPLETE (verified) |
| Reporting (24×3) | COMPLETE-BUT-NOT-RUNTIME-VERIFIED (E2E blocked this run) |
| Audit chains + user audit | COMPLETE (runtime-verified) |
| Notifications | COMPLETE (verified) |
| Backup/restore/system health | COMPLETE (runtime-verified this audit) |
| Migration system | COMPLETE (runtime-verified, 38/38) |
| Deployment config | COMPLETE-BUT-NOT-RUNTIME-VERIFIED (NOT LIVE VERIFIED) |
| CI gate | PARTIAL — local acceptance gate red (P1-001); workflow file verified structurally |
| Accessibility (12 pilot pages) | COMPLETE (runtime-verified in-run); app-wide coverage PARTIAL (P2-010) |
| Responsive coverage | COMPLETE-BUT-NOT-RUNTIME-VERIFIED this run (infrastructure verified) |
| Performance evidence | COMPLETE (benchmark artifacts present) |
| Human UAT | HUMAN-VALIDATION-REQUIRED (zero results) |
| Calibration overdue warn-vs-block policy | HUMAN-VALIDATION-REQUIRED |

## 44. Pilot Readiness

**82%.** Blocked by: P1-001 (mandatory gate must be restored and a full green acceptance recorded), P1-002 (key rotation), tracked-DB cleanup (P2-003), and execution of the existing UAT runbook with real staff (HUMAN UAT: NOT VERIFIED). WI completion additionally requires controlled pages 2/3 and 3/3 (external source dependency).

## 45. Production Readiness

**78%.** Everything in §44 plus live deployment verification (persistent disk, env vars, health check, single-instance) which does not exist as evidence today. Repository deployment configuration itself is consistent and contract-tested.

## 46. Improvement Opportunities

**A. REQUIRED BEFORE PILOT** — fix P1-001 + record full green acceptance; rotate P1-002 key; remove tracked DB artifacts (P2-003); execute real UAT; complete E2E verification (P2-004).
**B. RECOMMENDED BEFORE BROADER ROLLOUT** — P2-005 chunked-body cap; P2-006 defense-in-depth prod guard; P2-011 Secure-cookie policy; P2-010 a11y scan expansion; P2-007 double-submit on 2 forms.
**C. QUALITY/MAINTENANCE** — P2-008 schema mirror sync; P2-009 design-system rollout; P3-012/013/016/017/018 cleanups.
**D. FUTURE ROADMAP** — P3-014 progressive lockout; P3-015 bcrypt 12; P3-019 help expansion; P3-020 copy polish; P3-022 backup retention tuning. (No PostgreSQL/Redis/microservices/framework additions recommended — current evidence does not justify them.)

## 47. Recommended Execution Order

1. P1-001 gate restore → full `pnpm e2e:acceptance` green (P2-004 closes automatically).
2. P1-002 rotation + P2-003 hygiene (single security commit).
3. Human UAT execution per `docs/PILOT-UAT.md` (can run in parallel with 1–2 on a staging DB).
4. Live deployment verification per `docs/DEPLOYMENT.md` pre-pilot checklist.
5. B-group hardenings → C-group cleanups → closing verification gate (FINAL-CLOSING-PROMPTS.md).

## 48. Final Verdict

**CONDITIONAL GO.** No verified P0 exists. The system's data-integrity, authorization, audit, and backup/restore foundations all passed fresh adversarial verification in this audit. The verdict is held back from GO by: one verified P1 (broken mandatory acceptance gate), one P1 security-hygiene rotation, unexecuted human UAT, and the absence of any live production verification. Executing the closing prompts restores GO eligibility.

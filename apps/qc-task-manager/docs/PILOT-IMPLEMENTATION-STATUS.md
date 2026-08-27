# PILOT IMPLEMENTATION STATUS — QC-PILOT-BASELINE-000

**Task ID:** QC-PILOT-BASELINE-000
**Date:** 2026-08-27
**Purpose:** Baseline and execution contract for the QC Task Manager real-company pilot. No fixes were applied in this task. No commit, push, or deploy was performed.

---

## 1. Environment & Repository State

| Item | Value |
|---|---|
| HEAD SHA | `1e7bf03d82b1c954a183be563c669dd3d2339877` |
| Working tree | **DIRTY** (1 untracked path): `?? audit/qc/QC-Task-Manager/prompt8.md` |
| Node | v22.22.3 |
| pnpm | 10.19.0 |
| Branch | main |

Note: the working tree is *clean with respect to all application code* under `apps/qc-task-manager/`. The only dirty state is an untracked audit prompt document outside the app tree.

## 2. Baseline Commands

| Command | Exit code | Result | Notes |
|---|---|---|---|
| `git rev-parse HEAD` | 0 | PASS | `1e7bf03d82b1c954a183be563c669dd3d2339877` |
| `git status --short` | 0 | PASS | 1 untracked file only (see §1) |
| `node --version` | 0 | PASS | v22.22.3 |
| `pnpm --version` | 0 | PASS | 10.19.0 |
| `pnpm --filter @brightai/qc-task-manager typecheck` | 0 | PASS | 256 files, 0 errors, 0 warnings, 17 hints |
| `pnpm --filter @brightai/qc-task-manager test:manifest` | 0 | PASS | 47 canonical suites registered |
| `pnpm --filter @brightai/qc-task-manager test:route-manifest` | 0 | PASS | 109 file routes, 25 middleware routes, 6 middleware guards |
| `pnpm --filter @brightai/qc-task-manager test:migrations` | 0 | PASS | Fresh DB, legacy upgrade, checksum drift, rollback, destructive guard — all passed |
| `NODE_ENV=production pnpm --filter @brightai/qc-task-manager build` | 0 | PASS | "Complete!" — known non-blocking Vite dynamic-import warnings |

**Baseline failures: none** among the mandated baseline commands.

## 3. What Was Inspected

- Repository instructions: `.agents/mind/01-mind-latest.md` (read in full, per Zero Rule), user `AGENTS.md`.
- `apps/qc-task-manager/package.json`, `README.md`-adjacent docs (`docs/ARCHITECTURE.md`, `DATABASE.md`, `DEPLOYMENT.md`, `MIGRATIONS.md`, `ROLES-AND-PERMISSIONS.md`, `TESTING.md`, `ACCEPTANCE-CHECKLIST.md`, `RESTORE.md`, `REPOSITORY-AUDIT.md`, `QC-LAB-ARCHITECTURE.md`).
- `apps/qc-task-manager/src/` (lib, pages, middleware), `db/` (schema.sql + migrations 001–035), `scripts/` (79+ scripts: unit/domain suites, E2E suites, ops scripts).
- Root `render.yaml`.
- Prior QC audit/report documents under `audit/qc/` (per project mind ledger: PRE-LAUNCH-REPORT.md, prompt-lineage analyses).

## 4. Implementation Queue Status (P0/P1/P2)

Classification keys: IMPLEMENTED / PARTIAL / MISSING / BLOCKED / RUNTIME-NOT-VERIFIED.

### P0 — Pilot-blocking

| Item | Status | Evidence |
|---|---|---|
| Typecheck / manifest / route-manifest / migrations / build gates | **IMPLEMENTED** (this baseline: all PASS) | §2 |
| Full E2E acceptance run (`pnpm e2e:acceptance`) completed end-to-end | **RUNTIME-NOT-VERIFIED** | Suite registered (`e2e-acceptance.mjs`, 26 suites incl. `lab-nav`); prior ledger records full completion never achieved post-fix (cleanup FK blocker in `task-shared`, browser-leak history). Not re-run in this task by design. |
| Deployment target for QC app | **MISSING** | Root `render.yaml` contains **zero** references to `qc-task-manager` — the QC service block was deliberately removed by the user (documented in mind ledger). `docs/DEPLOYMENT.md` documents single-writable-instance contract but no live deploy target exists. |
| Production runtime verification (live health, backup, restore on real instance) | **RUNTIME-NOT-VERIFIED** | `/api/health`, `admin/system-health`, backup/verify scheduler implemented in code; never proven live. |
| AI provider (Groq) live key rotation + smoke | **RUNTIME-NOT-VERIFIED** | Prior ledger: old key exposed; `smoke-ai-live.mjs` exists; live provider check failed historically. |

### P1 — Required for pilot quality, not structurally missing

| Item | Status | Evidence |
|---|---|---|
| Reporting transport (`GET /api/reports/[reportType].csv\|xlsx\|pdf`, `/api/reports/audit`) | **IMPLEMENTED** (unit-verified; live HTTP not re-proven this task) | `src/pages/api/reports/[reportType].[format].ts`, `src/pages/api/reports/audit.ts`, `src/lib/reporting/*` (catalog, authorization, filters, scope, reader, audit, writers). |
| Migration 031 | **IMPLEMENTED** (reserved slot, by design) | `db/migrations/031_reserved.sql` — 1 line: "Reserved migration slot. Keep the ordered migration history contiguous." This is intentional: the runner enforces contiguous ordering; 032 was the real content. Do not repurpose without a real migration. |
| Test manifest | **IMPLEMENTED** | `scripts/test-manifest-guard.mjs` PASS, 47 canonical suites. |
| E2E acceptance runner | **IMPLEMENTED** as harness (`scripts/e2e-acceptance.mjs`, child timeout + SIGTERM/SIGKILL, cleanup) — **RUNTIME-NOT-VERIFIED** end-to-end. |
| Orphan lab-search suites (`test-lab-search.mjs`, `e2e-lab-search.mjs`) | **PARTIAL / BLOCKED (decision pending)** | Files exist but are not registered in package.json or e2e-acceptance manifest; documented RBAC failure at HEAD in `e2e-lab-search.mjs`; decision (register+fix vs remove) still open. |
| Git hygiene: tracked empty DB files (`qc_tasks.db`, `qc_tasks 3.db`) | **MISSING fix (user decision)** | Still tracked in git per ledger. |
| WITHDRAWN state for change requests | **MISSING** | Documented as the last functional-cycle gap; requires a small migration; not started. |
| Accessibility | **IMPLEMENTED** (guards) / **RUNTIME-NOT-VERIFIED** (live browser) | `scripts/e2e-a11y.mjs` (suite `a11y`, 14/0 last recorded), `test:badge-contrast`, `test:lab-ux-presentation`, `test:lab-ux-performance`. Keyboard/screen-reader manual pass not evidenced. |

### P2 — Post-stability improvements

| Item | Status |
|---|---|
| Dedupe `escapeLike` (×9), pagination component (×9), notification label maps, zod bounds, exceljs interop boilerplate | **MISSING** (documented tech debt; non-blocking) |
| `llms`-style INDEX for prompt lineage / stale checkbox cleanup in prompt docs | **MISSING** (docs hygiene) |
| Soft-delete design session, palette, FTS5 | **MISSING** (intentionally deferred per pre-launch report) |

## 5. Topic-Area File Map (exact current files)

- **Reporting transport:** `src/pages/api/reports/[reportType].[format].ts`, `src/pages/api/reports/audit.ts`, `src/lib/reporting/{types,catalog,authorization,filters,scope,queries,reader,audit,drilldown}.ts`, `src/lib/reporting/writers/`, E2E: `scripts/e2e-reports.mjs`.
- **Migration 031:** `db/migrations/031_reserved.sql` (reserved, intentional), runner: `src/lib/migrations.ts`, registry: `src/lib/db.ts` (embedded migrations), mirror: `db/schema.sql`.
- **Test manifest:** `scripts/test-manifest-guard.mjs` (47 suites), aggregate runner: `scripts/run-full-tests.mjs`.
- **E2E acceptance runner:** `scripts/e2e-acceptance.mjs` (+ 23 `e2e-*.mjs` suites, incl. `lab-nav`).
- **Deployment:** root `render.yaml` (QC service **absent**), `docs/DEPLOYMENT.md`, `docs/DATABASE.md` (single-instance contract, `assertSqliteDeploymentContract`), `scripts/backup-db.mjs`, `scripts/restore-db.mjs`, `scripts/test-production-operations.mjs`.
- **Authentication:** `src/lib/auth.ts`, `src/lib/session.ts`, `src/middleware.ts` (session + CSRF + guards), `docs/ROLES-AND-PERMISSIONS.md`.
- **User audit (RBAC authority):** `src/lib/permissions.ts` (sole authority), audit chains: `src/lib/audit/{index,chain,qcChain}.ts`, `qc_audit_log` schema + migrations 030/032, `scripts/test-audit-integrity.mjs`, `scripts/test-delete-durability.mjs`.
- **Accessibility:** `scripts/e2e-a11y.mjs`, `scripts/verify-badge-contrast.mjs`, `scripts/test-lab-ux-presentation.mjs`, `scripts/test-lab-ux-performance.mjs`.
- **Lab navigation:** `src/pages/lab/**` (role-focused home `src/pages/lab/index.astro`), `src/components/lab/{LabDocumentStatusBadge,LabActionButton}.astro`, `scripts/e2e-lab-nav.mjs`.
- **WI import:** `db/migrations/029_wi_catalog_import.sql`, `db/migrations/033_wi_provenance.sql`, `src/lib/lab/wiCatalog.ts`, `src/lib/lab/documents.ts`, `scripts/test-lab-documents.mjs`.

## 6. Honesty Boundary

All statuses above reflect this baseline inspection only. No completion is claimed for anything marked RUNTIME-NOT-VERIFIED or MISSING. No fixes, migrations, or config changes were made in this task. No commit, push, or deploy was performed.

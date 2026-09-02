# Automated Verification 100 Evidence

Task: `QC-100-VERIFICATION-005`  
Date: 2026-09-02  
Scope: local, reproducible QC Task Manager verification only. Production p95/RUM Core Web Vitals remain external evidence until PROMPT 14.

## Verdict

**Partial, by explicit instruction.** The time-consuming complete canonical chain and full E2E acceptance were not re-run after the user instructed to skip long-running work. No skipped suite is reported as passing.

## Deterministic inventory

`scripts/test-manifest.mjs` and `scripts/e2e-registry.mjs` are the single sources of truth. `test:manifest` cross-checks their package commands, every `test-*.mjs` and `e2e-*.mjs` file, existence, duplicates, and the two orchestrators. A new conventional test file therefore fails the guard unless it is registered or explicitly classified.

| Class | Inventory | Execution contract |
| --- | --- | --- |
| Canonical unit/integration/contract/database/security/UI/performance suites | 69 `test:*` entries in `CANONICAL_TEST_SCRIPTS` | `pnpm test` executes each entry, fails fast, and is run by QC CI. |
| Canonical E2E acceptance suites | 28 entries in `CANONICAL_E2E_SUITES` | `pnpm e2e:acceptance` builds production and runs each suite on isolated temporary SQLite databases and ports. |
| Meta guards | `test`, `test:manifest`, `test:architecture` | Explicitly outside the canonical array because they orchestrate or validate it. |
| Explicit non-runnable test files | `test-manifest.mjs`, `test-manifest-guard.mjs`, `test-responsive-e2e-contract.mjs`, `test-report-pdf-arabic.mjs` | Registry data, guard, E2E-wiring contract, and a manual PDF diagnostic respectively. The last has an open failure below; it is not silently skipped. |
| Explicit non-runnable E2E files | `e2e-registry.mjs`, `e2e-acceptance.mjs`, `e2e-persistence.mjs`, `e2e-task-search.mjs` | Registry, orchestrator, persistence phase, and imported E2E spec. |
| Operational/manual diagnostics | `backup-db.mjs`, `db-doctor.mjs`, `generate-schema-reference.mjs`, `init-db.mjs`, `reset-user-password.mjs`, `restore-db.mjs`, `route-manifest.mjs`, `run-performance.mjs`, `scheduled-notifications.mjs`, `smoke-ai-live.mjs`, `ui-screenshots.mjs`, `verify-badge-contrast.mjs`, `verify-security-hygiene.mjs` | Invoked through named package commands where safe; live AI and visual screenshot checks require deliberately supplied external configuration or human review. |

The 69 canonical entries cover migrations, schema/parity, domain/workflow/SLA, database rules and doctor, reports, audit integrity, RBAC/request security/privacy, observability, AI safe mode, controlled documents, e-signatures, lab records, notifications, responsive contracts, source/UI guards, accessibility-related contrast checks, and the local performance benchmark contract.

## Evidence executed in this task

| Gate | Result | Evidence |
| --- | --- | --- |
| Test manifest guard | PASS | `69` canonical suites, `28` canonical E2E suites, `4` classified non-runnable test files, `4` classified E2E files. |
| Route manifest + architecture guard | PASS | `115` file routes, `25` middleware routes, `6` middleware guards; ownership/trust-boundary guard passed. |
| Migrations | PASS (during started canonical chain) | Fresh/upgrade/checksum/rollback/destructive-SQL checks passed. |
| Embedded migration parity | PASS | `39/39` SHA-256-identical migrations. |
| Schema reference | PASS | `165` fresh canonical schema objects match. |
| Domain/RBAC/audit sample | PASS (during started canonical chain) | Domain suite `343 passed, 0 failed`; auth lifecycle `23/23`; user-audit `21/21`; audit-integrity passed. |
| PDF Arabic diagnostic | FAIL, explicit | The real report pipeline exposes Arabic wrapping/ToUnicode assertions, no mark-position path for the selected fixture, and pagination expectation failure. The diagnostic no longer crashes when a decoded cell is missing. |
| Full canonical chain | NOT RE-RUN | Skipped after the explicit request to bypass work that takes a long time. |
| Full E2E acceptance | NOT RE-RUN | Skipped after the explicit request to bypass work that takes a long time. |
| Production p95/RUM CWV | EXTERNAL | Out of local scope until PROMPT 14. |

## Root cause found: PDF diagnostic

The diagnostic incorrectly expected equipment code `AR-PDF-01` in the `Report ID` column; the real pipeline correctly emits `RPT-PDF-AR-001`. It also dereferenced missing decoded cells and stopped with `TypeError`, masking later results. The diagnostic now asserts presence before alignment and emits optional decoded-line evidence via `QC_PDF_DEBUG=1`. Its remaining assertions are intact and still fail; this is an open quality gate, not a pass.

## Observability coverage

`test:observability` validates UUID request IDs, safe replacement of invalid IDs, structured JSON request logging, stable error categories, sensitive-message redaction, and UI recovery states. Startup/DB/backup behavior is additionally covered by `test:database-100`, `test:db-doctor`, and `test:production-operations`. Health/readiness and live service logs require an actual deployed process and are not asserted as local production evidence.

## Local performance budget status

`run-performance.mjs` measures disposable SQLite fixtures for dashboard, task and lab search, registers/large tables, lab surfaces, audit, and reports; `test:performance` verifies its 11-scenario artifact, p50/p95/max fields, query counts, integrity, and query plans. It currently has **no enforced numeric p95 budget**, so zero local budget failures cannot honestly be claimed. The next implementation step is to record a clean-machine large-profile baseline and codify per-scenario p95 limits with variance headroom, then make `test:performance` fail on a breach.

## CI contract audit

`.github/workflows/qc-release-gate.yml` is reproducible by contract: frozen lockfile install, Node from `.node-version`, QC typecheck, manifest/route/parity, isolated SQLite migrations, full canonical suite, production build, and full E2E on push/nightly/manual. Security and database verification are in the canonical suite. The E2E job intentionally does not run on PRs; that is visible in the workflow rather than a silent skip.

No GitHub workflow, deployment, commit, or push was changed.

## Required follow-up gates

1. Fix the remaining Arabic PDF rendering/pagination failures and register it as an automated canonical suite if it is a release requirement.
2. Establish and enforce measured local performance p95 budgets.
3. Re-run `pnpm test` and `pnpm e2e:acceptance` after those changes.
4. Collect production RUM/CWV, readiness, health, logging, and deployed DB evidence in PROMPT 14.

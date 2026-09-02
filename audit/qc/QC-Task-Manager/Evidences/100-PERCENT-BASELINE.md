# QC Task Manager — Current Truth Baseline

**Task ID:** `QC-100-BASELINE-001`
**Baseline date:** 2026-09-02 (Asia/Riyadh)
**Repository:** `/Users/yzydalshmry/Desktop/BRIGHTAI`
**Scope:** `apps/qc-task-manager`
**Purpose:** freeze the current repository truth before remediation. Previous PASS, percentage, readiness, and production claims are historical inputs only; this document uses independently reproduced evidence.

## 1. Executive result

The current repository is technically testable and the local automated gates are green, but it is **not a 100-percent baseline** and there is no evidence here for production deployment, real-user UAT, manual assistive-technology validation, or operator production restore. The only pre-existing working-tree change is the user-owned modification to `audit/qc/QC-Task-Manager/prompt10.md`.

The scoring model below is deliberately criterion-based. It has **173 binary criteria**, of which **125 are evidenced as met** and **48 remain unmet, blocked, or not yet evidenced**. The aggregate `125/173 = 72.254%` is a planning signal, not a readiness approval and not a production claim. A domain reaches 100% only when every criterion in its denominator has evidence.

## 2. Frozen repository and runtime facts

| Fact | Current value | Reproduction |
|---|---|---|
| HEAD | `05ae8fbab78eacf7bc8363a3d75177f849a835de` | `git rev-parse HEAD` |
| Branch | `main` tracking `origin/main` | `git branch --show-current`; `git status` |
| Working tree | `M audit/qc/QC-Task-Manager/prompt10.md`; no other status reported | `git -c core.fsmonitor=false status --short --branch` |
| Diff | 1 user-owned file; 1,193 insertions / 1,011 deletions in the current diff stat | `git -c core.fsmonitor=false diff --stat` |
| OS/runtime | macOS Darwin 25.5.0, arm64 | `uname -a` |
| Node | `v22.22.3` | `node --version` |
| pnpm | `10.19.0` | `pnpm --version` |
| App | `@brightai/qc-task-manager@0.1.0` | `apps/qc-task-manager/package.json` |
| Architecture | Astro 6 SSR + `@astrojs/node` standalone server + React 19 islands + Tailwind 3 + better-sqlite3 + bcryptjs + Zod | package manifest and `apps/qc-task-manager/README.md` |
| Database model | One writable SQLite database, WAL, foreign keys on, one application instance, persistent disk required in production | `docs/DATABASE.md`, `docs/DEPLOYMENT.md`, `src/lib/db.ts` |
| Tracked QC files | 487 | `git -C apps/qc-task-manager ls-files | wc -l` |
| File routes | 116 | `pnpm run test:route-manifest` |
| API route files | 36 | `find src/pages/api -type f | wc -l` |
| Middleware route contract | 25 routes, 6 guard categories | `pnpm run test:route-manifest` |
| Migrations | 39 sequential SQL migrations | `find db/migrations -name '*.sql'` |
| Fresh schema | 49 tables, 108 non-system indexes, 7 triggers, 0 views; migration version 39 | fresh isolated `db:init` + SQLite catalog query |
| Schema reference | 165 objects match fresh canonical database | `pnpm run test:schema-reference` |
| Registered skills | 365 in `skills-lock.json`; 365 local skill directories | `jq '.skills | length' skills-lock.json` and `find .agents/skills ...` |
| Unit/integration manifest | 65 canonical suites; 4 classified non-runnable test scripts | `pnpm run test:manifest` |
| E2E manifest | 28 canonical suites; 4 classified E2E scripts | `pnpm run test:manifest` |
| Documentation files in app | 29 Markdown files under `apps/qc-task-manager/docs` | `find docs -maxdepth 1 -name '*.md'` |

## 3. Required source reading and authority boundary

Read before this baseline: `.agents/mind/01-mind-latest.md`, `AGENTS.md`, `.agents/AGENTS.md`, `CLAUDE.md`, every existing file in `audit/qc/QC-Task-Manager/`, `apps/qc-task-manager/README.md`, `apps/qc-task-manager/SECURITY.md`, the app architecture/database/deployment/migration/restore/testing/RBAC/UI/UX documents, and `skills-lock.json`.

`CLAUDE.md` is byte-identical to `AGENTS.md`. `.agents/AGENTS.md` differs only in its stale documentation count (`67` vs the measured `365`); the current lock and local directory inventory are authoritative for this baseline. Historical audit files contain conflicting claims and are not used as proof.

Applicable local skills inspected and applied: `audit-verify-explain-grade-5`, `iterate-until-verified`, `astro-developer` plus its architecture/constraints/debugging/testing references, `accessibility-audit`, `accessibility-testing-strategy`, `responsive-review`, `form-design`, `performance-profiling` (its guidance is Apple-oriented and therefore only partially applicable), `design-qa-checklist`, `design-system-governance`, `information-architecture`, `ux-writing`, `usability-test-plan`, `test-scenario`, `documentation-template`, and `design-debt-audit`. No dedicated local skill was registered for SQLite, migrations, TypeScript, authentication, RBAC, security engineering, E2E, or observability; those areas were evaluated against source, app contracts, and executable tests.

## 4. Application surface inventory

### Routes and APIs

The route source contains 116 page/API files. The 36 API files cover authentication-adjacent flows, health/readiness, tasks, attachments, notifications, exports, findings, AI, reports, lab modules, and UX events. The complete authoritative route list is emitted by `scripts/route-manifest.mjs`; the route-manifest gate passed with 116 file routes, 25 middleware routes, and 6 middleware guards.

### Middleware and authorization

`src/middleware.ts` resolves the server-side session into `context.locals.user`, applies request security, handles login and password-change POSTs, requires authentication for non-public routes, applies prefix guards for dashboard/admin/manager/supervisor/lab, dispatches guarded form POSTs, applies CSRF to form mutations, and rejects unsafe non-API methods outside the declared endpoint set. `src/lib/permissions.ts` is the documented single permission authority; handlers re-check permissions server-side.

### Database objects

The fresh database catalog contains the core task tables, QC audit/evidence/finding/CAPA/RCA objects, workflow/SLA/report/AI/UX objects, and the laboratory entities for tests, documents, templates, products, equipment, calibration, maintenance, retests, samples, acknowledgements, views, and change requests. The exact catalog is reproducible from the isolated database command recorded in the evidence matrix; no live production database was inspected.

### Tests and documentation

The repository has 65 canonical unit/integration suites and 32 E2E files, with 28 canonical E2E workflows registered by the manifest. E2E coverage includes auth, users, tasks, delete requests, dashboard, accessibility, backups, search, findings, lab workflows, reports, responsive checks, and restart persistence. App documentation includes architecture, migrations, deployment, database, restore, RBAC, testing, design system, IA, UX writing, UX research, pilot UAT, and service blueprint documents.

## 5. Independently reproduced verification

| Check | Result | Evidence |
|---|---|---|
| Typecheck | PASS: 0 errors, 0 warnings, 27 hints | `pnpm run typecheck` |
| Production build | PASS: Astro server build complete; known Vite dynamic/static import warnings | `NODE_ENV=production pnpm run build` |
| Full local suite | PASS: 65 canonical suites | `pnpm test` |
| Test manifest | PASS: 65 unit + 28 E2E canonical suites | `pnpm run test:manifest` |
| Route manifest | PASS: 116 / 25 / 6 | `pnpm run test:route-manifest` |
| Schema reference | PASS: 165 objects | `pnpm run test:schema-reference` |
| Migration tests | PASS: fresh, upgrade, preservation, failure recovery, destructive-SQL guard | `pnpm run test:migrations` |
| Embedded migration parity | PASS: 39/39 byte-identical | `pnpm run test:embedded-migration-parity` |
| Security hygiene | PASS | `node scripts/verify-security-hygiene.mjs` |
| Deployment contract | PASS: 22 checks | `pnpm run test:deployment-contract` |
| Production operations | PASS: local backup, restore drill, restart, integrity, FK, migrations, audit chains | `pnpm run test:production-operations` |
| UI consistency | PASS: 207/207 | `pnpm run test:ui-consistency` |
| Responsive E2E contract | PASS | `pnpm run test:responsive-e2e-contract` |
| Full acceptance E2E | PASS when run with localhost binding permission: 30/30; 3,059+ assertions; 224,896 ms | `pnpm e2e:acceptance` |
| E2E a11y subset | PASS: 86/0 inside acceptance | `scripts/e2e-a11y.mjs` via acceptance runner |
| Responsive subset | PASS: 648/0 inside acceptance | `scripts/e2e-responsive.mjs` via acceptance runner |
| Initial sandbox E2E attempt | BLOCKED by environment `listen EPERM` on 127.0.0.1:4500; not a product failure | direct `node scripts/e2e-acceptance.mjs` |
| Invalid a11y command attempt | FAIL: `scripts/test-e2e-contract.mjs` does not exist; not a product failure | command error recorded during baseline |

## 6. What is not proven

- No staging or production URL, commit, deployed artifact, persistent disk, or live environment was independently read back.
- No real QC staff UAT was performed; the pilot UAT document is a runbook, not result evidence.
- No manual VoiceOver/NVDA, keyboard expert sign-off, 200% zoom/orientation matrix, or testing with disabled users is evidenced by this task.
- Local backup/restore and restart persistence pass, but production backup retention, off-service copy, operator restore read-back, and disaster recovery RTO/RPO are not proven.
- Contract tests and local timing checks do not prove production Core Web Vitals, telemetry, SLOs, alerting, or real-user performance.
- Historical audit documents contain stale or contradictory counts; they remain context only.

## 7. Current scorecard

The exact denominator, criteria, evidence, owner, proof mode, and command for every domain are in `100-PERCENT-EVIDENCE-MATRIX.md`. The following is the frozen score summary:

| # | Domain | Score |
|---:|---|---:|
| 1 | Architecture | 4/5 |
| 2 | Database / migrations | 5/6 |
| 3 | Security | 5/6 |
| 4 | Authentication | 5/6 |
| 5 | RBAC / authorization | 5/6 |
| 6 | Functional workflows | 6/7 |
| 7 | Testing | 6/7 |
| 8 | UI | 4/5 |
| 9 | UX | 4/5 |
| 10 | Visual Design | 4/5 |
| 11 | Design System | 4/5 |
| 12 | Information Architecture | 4/5 |
| 13 | Interaction Design | 4/5 |
| 14 | Motion & Digital Art | 3/4 |
| 15 | UX Writing / Microcopy | 4/5 |
| 16 | UX Research Evidence | 3/4 |
| 17 | Accessibility / A11y | 2/5 |
| 18 | Ergonomics | 2/4 |
| 19 | Responsive Design | 3/5 |
| 20 | Service Design | 2/4 |
| 21 | Dashboard Design | 4/5 |
| 22 | Data Visualization | 3/4 |
| 23 | Privacy UX | 3/5 |
| 24 | Security UX | 4/5 |
| 25 | Advanced Forms | 4/5 |
| 26 | Information Architecture & Permissions | 4/5 |
| 27 | Performance | 2/5 |
| 28 | Observability | 4/5 |
| 29 | Deployment | 3/5 |
| 30 | Backup / Restore | 3/5 |
| 31 | Documentation | 4/5 |
| 32 | Maintainability | 4/5 |
| 33 | QC Compliance readiness | 3/5 |
| 34 | Company operational readiness | 1/5 |
|  | **Total** | **125/173** |

## 8. Baseline reproduction protocol

Run from the repository root on the frozen commit, without changing source or tests:

```bash
git rev-parse HEAD
git -c core.fsmonitor=false status --short --branch
node --version
pnpm --version
pnpm --dir apps/qc-task-manager typecheck
NODE_ENV=production pnpm --dir apps/qc-task-manager build
pnpm --dir apps/qc-task-manager test:manifest
pnpm --dir apps/qc-task-manager test:route-manifest
pnpm --dir apps/qc-task-manager test:schema-reference
pnpm --dir apps/qc-task-manager test:migrations
pnpm --dir apps/qc-task-manager test:embedded-migration-parity
node apps/qc-task-manager/scripts/verify-security-hygiene.mjs
pnpm --dir apps/qc-task-manager test:deployment-contract
pnpm --dir apps/qc-task-manager test:production-operations
pnpm --dir apps/qc-task-manager test
pnpm --dir apps/qc-task-manager e2e:acceptance
```

The E2E command needs an execution environment that permits the local Astro server to bind to `127.0.0.1`. Record the exact HEAD, dirty status, command exit code, suite counts, assertion counts, duration, and any environment-only failure. Do not edit assertions to make the result green.

## 9. Baseline conclusion

**Status: PARTIAL / CONDITIONAL TECHNICAL BASELINE.** The local implementation and automated gates are reproducible at this HEAD. The score is below 100 by definition because required external and human evidence is absent. Remediation is intentionally out of scope for `QC-100-BASELINE-001`.

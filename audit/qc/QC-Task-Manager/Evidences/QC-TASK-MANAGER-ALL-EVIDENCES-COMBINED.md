# QC Task Manager — جميع الأدلة المدمجة (Combined Evidences)

> تاريخ الدمج: 2026-09-02 — تم دمج 17 ملف أدلة في هذا الملف دون أي تعديل على المحتوى الأصلي.
> المجلد الأصلي: `audit/qc/QC-Task-Manager/Evidences/` — الملفات الأصلية باقية كما هي.

## الفهرس

1. [QC Task Manager — Current Truth Baseline](#قسم-1) — `100-PERCENT-BASELINE.md`
2. [QC Task Manager — 100% Evidence Matrix](#قسم-2) — `100-PERCENT-EVIDENCE-MATRIX.md`
3. [QC Task Manager — 100% Gap Matrix](#قسم-3) — `100-PERCENT-GAP-MATRIX.md`
4. [ARCHITECTURE-100-EVIDENCE — QC-100-ARCHITECTURE-002](#قسم-4) — `ARCHITECTURE-100-EVIDENCE.md`
5. [DATABASE-100 Evidence — QC-100-DATABASE-003](#قسم-5) — `DATABASE-100-EVIDENCE.md`
6. [SECURITY / RBAC / PRIVACY 100% Evidence](#قسم-6) — `SECURITY-RBAC-PRIVACY-100-EVIDENCE.md`
7. [Automated Verification 100 Evidence](#قسم-7) — `AUTOMATED-VERIFICATION-100-EVIDENCE.md`
8. [QC-100-DESIGN-SYSTEM-006 — Design-system evidence](#قسم-8) — `DESIGN-SYSTEM-100-EVIDENCE.md`
9. [UI-VISUAL-100 Evidence](#قسم-9) — `UI-VISUAL-100-EVIDENCE.md`
10. [QC Task Manager — UX / IA / Service Design Evidence](#قسم-10) — `7-UX-IA-SERVICE-DESIGN-100-EVIDENCE.md`
11. [QC-100-INTERACTION-MOTION-009 — Interaction & Motion Evidence](#قسم-11) — `8-INTERACTION-MOTION-100-EVIDENCE.md`
12. [QC Task Manager — 9-Pilot UX Research Plan](#قسم-12) — `9-PILOT-UX-RESEARCH.md`
13. [UX Writing Research Evidence](#قسم-13) — `UX-WRITING-RESEARCH-EVIDENCE.md`
14. [A11Y-ERGONOMICS-100 Evidence](#قسم-14) — `A11Y-ERGONOMICS-100-EVIDENCE.md`
15. [QC-100 Dashboard Data Visualization Evidence](#قسم-15) — `11-DASHBOARD-DATA-VIZ-100-EVIDENCE.md`
16. [QC-100-FORMS-013 — Advanced Forms Evidence](#قسم-16) — `12-ADVANCED-FORMS-100-EVIDENCE.md`
17. [🚀 تقرير ما قبل الإطلاق النهائي — QC Task Manager](#قسم-17) — `PRE-LAUNCH-REPORT.md`

---

<a id="قسم-1"></a>

<!-- SOURCE FILE: 100-PERCENT-BASELINE.md -->
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

---

<a id="قسم-2"></a>

<!-- SOURCE FILE: 100-PERCENT-EVIDENCE-MATRIX.md -->
# QC Task Manager — 100% Evidence Matrix

**Task:** `QC-100-BASELINE-001`
**Frozen HEAD:** `05ae8fbab78eacf7bc8363a3d75177f849a835de`
**Rule:** one binary criterion equals one denominator unit. `MET` requires direct current evidence. `OPEN` means missing, blocked, or only inferred. No criterion is passed because a file, test name, or configuration exists by itself.

## Evidence key

| ID | Evidence | Current result |
|---|---|---|
| E01 | Git/runtime freeze | HEAD, branch, dirty diff, Node, pnpm, OS captured; PASS for repository freeze |
| E02 | App/package/source inventory | 487 tracked QC files, 116 routes, 36 APIs, 39 migrations, 365 skills, 29 app docs |
| E03 | `typecheck` | PASS, 0 errors / 0 warnings / 27 hints |
| E04 | Production build | PASS; Vite dynamic/static import warnings remain |
| E05 | Manifest and route gates | PASS: 65 unit, 28 E2E, 116/25/6 route contract |
| E06 | Schema/migration evidence | PASS: 165 schema objects, migrations pass, 39/39 embedded parity, fresh integrity/FK clean |
| E07 | Security/deployment contracts | PASS: security hygiene and 22 deployment checks |
| E08 | Local operations | PASS: backup, restore drill, restart, integrity, FK, audit chains |
| E09 | Full unit suite | PASS: 65 canonical suites |
| E10 | Acceptance E2E | PASS with localhost permission: 30/30, 3,059+ assertions, a11y 86/0, responsive 648/0 |
| E11 | Static UI/UX contracts | PASS: UI 207/207, responsive contract, UX writing/telemetry tests in full suite |
| E12 | Human expert review | OPEN: no recorded independent design, accessibility, keyboard, screen-reader, zoom, or orientation sign-off for this baseline |
| E13 | Disabled-user research | OPEN: no participant sessions/results |
| E14 | Staging/production read-back | OPEN: no live deployment, disk, version, health/readiness, or telemetry evidence |
| E15 | Operator DR evidence | OPEN: no production backup/off-site copy/operator restore read-back/RTO-RPO record |
| E16 | Company/QC sign-off | OPEN: no real staff UAT, approval record, owner sign-off, or operational acceptance |

## Domain criteria

| # | Domain | Denominator and exact pass criteria | Score | Evidence | Missing / blocker | Owner | Proof mode | Verification command |
|---:|---|---|---:|---|---|---|---|---|
| 1 | Architecture | 5: (A1) runtime topology matches docs; (A2) route boundaries are explicit; (A3) auth/data ownership is centralized; (A4) architecture guard passes; (A5) deployed topology is independently read back | 4/5 | E02,E05,E06,E07 | A5 live topology absent | Principal architect / operator | Auto + external | `pnpm --dir apps/qc-task-manager test:architecture`; deployment read-back |
| 2 | Database / migrations | 6: (D1) canonical schema applies fresh; (D2) all migrations apply sequentially; (D3) embedded SQL matches files; (D4) upgrade preserves data; (D5) integrity/FK clean; (D6) production DB version/read-back verified | 5/6 | E06,E08 | D6 no production DB access | DB owner | Auto + external | `test:migrations`; `test:embedded-migration-parity`; `test:schema-reference`; live SQL checks |
| 3 | Security | 6: (S1) headers/CSP enforced; (S2) input validation/sanitization present; (S3) CSRF/request security enforced; (S4) secrets absent/hygiene passes; (S5) abuse/rate controls tested; (S6) independent security review/penetration evidence | 5/6 | E07,E10 | S6 external review absent | Security owner | Auto + human/external | `verify-security-hygiene.mjs`; `test:request-security`; security review |
| 4 | Authentication | 6: (AU1) bcrypt password storage; (AU2) opaque server sessions; (AU3) secure cookie policy; (AU4) TTL/expiry/revocation; (AU5) lockout/password lifecycle; (AU6) live deployment login/rotation read-back | 5/6 | E10,E07 | AU6 live proof absent | Security/auth owner | Auto + external | `e2e-auth-lockout.mjs`; `test:auth-password-lifecycle`; live login |
| 5 | RBAC / authorization | 6: (R1) all roles defined; (R2) central permission source; (R3) middleware prefix guards; (R4) handler-level rechecks; (R5) deny/bypass E2E matrix; (R6) human role-owner acceptance | 5/6 | E05,E10 | R6 real role-owner UAT absent | Product/security owner | Auto + human | `e2e-admin-users.mjs`; lab/task E2E; `PILOT-UAT.md` |
| 6 | Functional workflows | 7: (F1) auth/user workflow; (F2) task create/edit; (F3) lifecycle/dependencies/recurrence; (F4) completion/evidence; (F5) lab workflows; (F6) export/notifications/audit; (F7) real staff end-to-end acceptance | 6/7 | E09,E10 | F7 human UAT absent | Product owner / QC process owner | Auto + human | `pnpm test`; `pnpm e2e:acceptance`; pilot UAT |
| 7 | Testing | 7: (T1) canonical manifest; (T2) unit/integration pass; (T3) E2E pass; (T4) negative/security paths; (T5) deterministic isolation; (T6) regression evidence at frozen HEAD; (T7) independent human test report | 6/7 | E05,E09,E10 | T7 human report absent | QA lead | Auto + human | `test:manifest`; `pnpm test`; `e2e:acceptance`; QA report |
| 8 | UI | 5: (U1) all core screens render; (U2) loading/error/empty states exist; (U3) component consistency gate passes; (U4) core actions are reachable; (U5) independent visual review at target sizes | 4/5 | E10,E11 | U5 independent visual sign-off absent | Product design / QA | Auto + human | `test:ui-consistency`; browser review |
| 9 | UX | 5: (X1) core journeys are documented; (X2) recovery/error paths exist; (X3) navigation/wayfinding contract passes; (X4) microcopy contract passes; (X5) real-user usability outcomes meet defined targets | 4/5 | E10,E11 | X5 no real-user outcome data | UX lead | Auto + human | UX contracts; UAT/research readout |
| 10 | Visual Design | 5: (V1) tokens/colors defined; (V2) typography/spacing consistent; (V3) states and hierarchy are specified; (V4) responsive visuals are checked; (V5) designer sign-off against reference screens | 4/5 | E11 | V5 no independent designer sign-off in this task | Design lead | Auto + human | design QA checklist + screenshots |
| 11 | Design System | 5: (DS1) primitives and tokens documented; (DS2) canonical ownership is explicit; (DS3) adoption/deprecation process exists; (DS4) implementation guard passes; (DS5) every production pattern has documented states/accessibility/usage | 4/5 | E11,E02 | DS5 full pattern-to-doc coverage not proven | Design system owner | Auto + human | `test:ui-consistency`; component inventory |
| 12 | Information Architecture | 5: (IA1) route/content inventory; (IA2) global/local/utility nav; (IA3) labels and hierarchy; (IA4) wayfinding/breadcrumb contract; (IA5) findability validated with target users | 4/5 | E02,E05,E11 | IA5 tree test/first-click evidence absent | UX/IA owner | Auto + human | route manifest; tree test |
| 13 | Interaction Design | 5: (I1) primary actions have clear states; (I2) focus/order/keyboard contract; (I3) dialogs/disclosures recover correctly; (I4) feedback/error recovery; (I5) independent interaction walkthrough across core workflows | 4/5 | E10,E11 | I5 expert walkthrough not recorded | Interaction designer / QA | Auto + human | `e2e-a11y.mjs`; interaction tests; walkthrough |
| 14 | Motion & Digital Art | 4: (M1) motion language documented; (M2) reduced-motion behavior coded; (M3) motion cleanup/performance contract passes; (M4) perceptual/manual review confirms motion is useful and non-blocking | 3/4 | E11 | M4 manual review absent | Design/QA | Auto + human | motion/UI tests; reduced-motion review |
| 15 | UX Writing / Microcopy | 5: (W1) terminology/voice documented; (W2) action labels are specific; (W3) errors explain recovery; (W4) empty/loading/security copy is covered; (W5) users validate comprehension | 4/5 | E11 | W5 comprehension evidence absent | Content design owner | Auto + human | `test:ux-writing`; usability sessions |
| 16 | UX Research Evidence | 4: (UR1) research questions defined; (UR2) participant criteria/method defined; (UR3) task/metric instruments defined; (UR4) executed sessions, raw observations, synthesis, and decision readout exist | 3/4 | E12,E13 | UR4 no sessions/results | UX research owner | Human/external | `docs/UX-RESEARCH-PROGRAM.md`; executed readout |
| 17 | Accessibility / A11y | 5: (AA1) automated axe/semantic checks pass; (AA2) keyboard/focus manual pass; (AA3) VoiceOver/NVDA screen-reader pass; (AA4) zoom/contrast/reduced-motion/orientation pass; (AA5) disabled-user testing pass | 2/5 | E10,E11 | AA2-AA5 missing as independent evidence | Accessibility specialist | Auto + human/external | `e2e-a11y.mjs`; manual matrix; participant report |
| 18 | Ergonomics | 4: (ER1) touch targets and reachability meet contract; (ER2) cognitive load/error prevention reviewed; (ER3) dense workflow efficiency measured; (ER4) role users validate comfort/productivity | 2/4 | E10,E11 | ER2/ER3/ER4 not measured with users | UX research / QC owner | Auto + human | responsive/UI tests; time-on-task study |
| 19 | Responsive Design | 5: (RD1) 360/375/768/1024/1280/1440 viewport matrix; (RD2) no overflow/clipping; (RD3) touch/reflow; (RD4) 150/200% zoom and orientation; (RD5) independent real-device confirmation | 3/5 | E10,E11 | RD1 has partial registered coverage; RD4/RD5 not proven as full matrix | Frontend QA | Auto + human | `e2e-responsive.mjs`; manual matrix |
| 20 | Service Design | 4: (SD1) service blueprint exists; (SD2) roles/handoffs/ownership mapped; (SD3) exception/escalation paths operationally tested; (SD4) pilot staff confirms service fit | 2/4 | E12,E16 | SD3/SD4 not evidenced | Service owner / QC manager | Document + human | service blueprint; pilot readout |
| 21 | Dashboard Design | 5: (DB1) KPI definitions; (DB2) filters/scoping; (DB3) chart/table rendering; (DB4) loading/error/empty states; (DB5) manager/user interpretation validated | 4/5 | E10,E11 | DB5 no user interpretation study | Product analytics / UX | Auto + human | `e2e-dashboard.mjs`; usability study |
| 22 | Data Visualization | 4: (DV1) charts derive from authoritative data; (DV2) labels/units/semantics; (DV3) accessible non-color alternatives; (DV4) real users correctly interpret charts | 3/4 | E10,E11 | DV4 no comprehension evidence | Data/product design | Auto + human | dashboard E2E; interpretation test |
| 23 | Privacy UX | 5: (PX1) telemetry allowlist; (PX2) minimization/retention; (PX3) no secrets/contents in logs; (PX4) user-facing privacy explanation/controls; (PX5) privacy/legal owner review | 3/5 | E07,E11 | PX4/PX5 not evidenced | Privacy/security owner | Auto + human/external | `test:ux-telemetry`; privacy review |
| 24 | Security UX | 5: (SX1) auth/permission boundaries are understandable; (SX2) safe error recovery; (SX3) password/lockout guidance; (SX4) AI advisory boundary is clear; (SX5) real users recover securely without unsafe workarounds | 4/5 | E10,E11 | SX5 no human observation | Security UX / UX research | Auto + human | security/AI UX tests; UAT |
| 25 | Advanced Forms | 5: (AF1) persistent labels/types; (AF2) grouped single-flow fields; (AF3) server and client validation; (AF4) multi-step save/cancel/recovery; (AF5) human completion metrics meet target | 4/5 | E10,E11 | AF5 no measured human completion baseline | Forms owner / QA | Auto + human | lab/form E2E; usability study |
| 26 | Information Architecture & Permissions | 5: (IP1) role-to-route matrix; (IP2) role-to-action matrix; (IP3) UI visibility aligns with server authority; (IP4) denied states/recovery are clear; (IP5) role owners validate matrix in UAT | 4/5 | E05,E10,E11 | IP5 absent | Security/product owner | Auto + human | RBAC docs/E2E; role UAT |
| 27 | Performance | 5: (PF1) build/runtime performance contract; (PF2) payload/asset budgets checked; (PF3) representative local workflow timing; (PF4) production RUM/Core Web Vitals; (PF5) load/concurrency behavior under supported topology | 2/5 | E04,E10 | PF2-PF5 not fully production/representatively evidenced | Performance/ops owner | Auto + external | `test:performance`; Lighthouse/RUM/load report |
| 28 | Observability | 5: (OB1) request IDs; (OB2) safe structured logs; (OB3) health/readiness semantics; (OB4) audit/operational status; (OB5) production dashboards, alert thresholds, and incident drill | 4/5 | E07,E08,E10 | OB5 production alerting/drill absent | Operations owner | Auto + external | `test:observability`; health/readiness; incident drill |
| 29 | Deployment | 5: (DP1) correct SSR build/start; (DP2) environment contract; (DP3) one-instance/persistent-disk contract; (DP4) live deployment returns expected health/readiness/version; (DP5) rollback/redeploy verification | 3/5 | E04,E07 | DP4/DP5 no live deployment evidence | Deployment operator | Auto + external | `test:deployment-contract`; Render runbook |
| 30 | Backup / Restore | 5: (BR1) WAL-safe backup; (BR2) retention/verification; (BR3) local restore drill; (BR4) production/off-site copy; (BR5) operator restore read-back with RTO/RPO record | 3/5 | E08,E15 | BR4/BR5 absent | Operations/DB owner | Auto + external | `test:production-operations`; `e2e-backup.mjs`; restore runbook |
| 31 | Documentation | 5: (DC1) architecture docs; (DC2) operating/deploy/restore docs; (DC3) test/runbook docs; (DC4) design/UX/RBAC docs; (DC5) docs are reconciled with current source and owner-reviewed | 4/5 | E02,E11 | DC5 stale/conflicting historical claims remain | Documentation owner | Human review | doc inventory + source reconciliation |
| 32 | Maintainability | 5: (MT1) typecheck/build clean; (MT2) central ownership/guards; (MT3) deterministic tests; (MT4) no unsafe tracked artifacts; (MT5) maintainers can change/release with current onboarding evidence | 4/5 | E03,E04,E05,E07,E09 | MT5 maintainer exercise not evidenced | Engineering owner | Auto + human | typecheck/build/tests; maintainer exercise |
| 33 | QC Compliance readiness | 5: (QC1) controlled records/state rules; (QC2) traceability/audit immutability; (QC3) independent review/approval boundaries; (QC4) controlled WI/SOP source completeness; (QC5) authorized QC users sign off on implemented workflows | 3/5 | E06,E08,E10,E16 | QC4 source gap noted in mind; QC5 no staff sign-off | QC quality owner | Auto + human/external | lab/audit E2E; source register; signed UAT |
| 34 | Company operational readiness | 5: (CO1) production service live; (CO2) real roles trained/UAT complete; (CO3) backup/restore operator evidence; (CO4) support/incident ownership; (CO5) formal go-live approval | 1/5 | E12,E14,E15,E16 | CO1-CO5 not evidenced; docs alone cannot pass | Company operator / product owner | External/human | deployment checklist, UAT, DR drill, sign-off |

## 100% rule

For each row, the score is the count of `MET` criteria divided by that row's exact denominator. A test suite may prove only the criteria it actually exercises. A configuration file proves a contract exists, not that the external service is deployed. Automated a11y does not pass manual AT. A backup script does not pass restore until a restore is executed and read back. E2E does not pass human UAT. No score is rounded to 100.

---

<a id="قسم-3"></a>

<!-- SOURCE FILE: 100-PERCENT-GAP-MATRIX.md -->
# QC Task Manager — 100% Gap Matrix

**Frozen HEAD:** `05ae8fbab78eacf7bc8363a3d75177f849a835de`
**Scope:** gaps remaining after `QC-100-BASELINE-001`; no fixes are implemented by this task.

| ID | Priority | Gap / blocker | Affected domains | Exact closure evidence | Owner | Proof class | Reproduction / closure command |
|---|---|---|---|---|---|---|---|
| G-01 | P0 | No independently verified staging/production deployment, persistent disk, deployed commit/version, health/readiness read-back, or rollback evidence | 1, 2, 4, 27, 28, 29, 34 | Operator records service URL, exact commit, one instance, `/api/health` 200, `/api/readiness` 200 with schema 39, `/admin/system-health`, restart, and rollback read-back | Deployment operator | External | `docs/DEPLOYMENT.md` checklist + live HTTP/operator evidence |
| G-02 | P0 | No real-user UAT for employee, supervisor, manager, and admin roles | 5, 6, 7, 9, 16, 18, 20, 25, 26, 33, 34 | Per-role sessions with task success/time/errors/assistance/recovery/confusion/comments, signed readout, and no demo accounts substituted | QC/product owner | Human/external | `docs/PILOT-UAT.md`, `docs/UX-RESEARCH-PROGRAM.md` |
| G-03 | P0 | No manual accessibility expert evidence or disabled-user testing | 8, 9, 13, 17, 18, 19, 25 | Keyboard-only, VoiceOver/NVDA, 200% zoom, orientation, reduced motion, real device, and participant evidence for core workflows | Accessibility specialist | Human/external | `docs/PILOT-UAT.md` + manual accessibility matrix |
| G-04 | P1 | Production/off-service backup copy and operator restore read-back are not proven | 2, 28, 30, 34 | Live-safe backup on persistent disk, off-service copy, restore to isolated environment, record equality, schema/FK/integrity/audit checks, RTO/RPO record | DB/operations owner | External | `docs/RESTORE.md`; maintenance copy only |
| G-05 | P1 | Production performance and real-user telemetry are absent | 9, 18, 19, 21, 22, 27, 28 | Representative production/RUM baseline for LCP/INP/CLS, payloads, supported one-instance load, alert thresholds, and comparison report | Performance/ops owner | External | `test:performance` plus Lighthouse/RUM/load evidence |
| G-06 | P1 | Full responsive/a11y viewport and preference matrix is not independently signed off | 8, 13, 17, 18, 19, 21, 25 | 320/360/375/390/768/1024/1280/1440; 150/200% zoom; portrait/landscape; reduced motion; real devices; all core workflows | Frontend/accessibility QA | Human | `e2e-responsive.mjs` plus manual matrix |
| G-07 | P1 | QC source-of-truth completeness and controlled WI pages 2/3 and 3/3 remain unresolved in current mind records | 6, 20, 31, 33 | Business owner supplies authoritative source, provenance is recorded, pages are imported without invention, and acceptance is rerun | QC quality owner | External + auto | provenance/migration/lab tests and signed source register |
| G-08 | P1 | Security claims have no independent penetration/threat-model sign-off, although static and functional security gates pass | 3, 4, 5, 23, 24 | Scope, threat model, test report, findings disposition, and retest evidence | Security owner | Human/external | security review report; existing hygiene tests are supporting evidence |
| G-09 | P2 | UX/design evidence is mostly contract/source based; no independent designer walkthrough, comprehension test, chart interpretation test, or ergonomics baseline | 8, 9, 10, 11, 12, 13, 14, 15, 18, 21, 22, 24, 25, 26 | Annotated screens/states, task metrics, comprehension results, and signed design QA report | Design/UX owner | Human | design QA + UX research readout |
| G-10 | P2 | Documentation has historical count/claim drift and is not yet reconciled as one signed current pack | 2, 7, 11, 31, 33 | Source-to-doc reconciliation, owner/date/version, stale-claim disposition, and current generated inventories | Documentation owner | Human + auto | baseline inventory and doc reconciliation script/report |
| G-11 | P2 | Maintainer release exercise and incident response drill are not evidenced | 28, 29, 32, 34 | Fresh maintainer follows setup/test/deploy/rollback/incident runbook and records time/errors | Engineering/operations owner | Human | runbook execution record |
| G-12 | P2 | Existing user-owned diff in `audit/qc/QC-Task-Manager/prompt10.md` makes the tree intentionally dirty | 1, 7, 31, 32 | Owner either preserves, commits separately, or explicitly declares the diff as baseline input; no agent action authorized | Repository owner | External decision | `git diff -- prompt10.md` |

## Blocker order

The first release-blocking closure order is `G-01 → G-02 → G-03 → G-04 → G-05`. `G-07` must be resolved before claiming full QC compliance coverage. None of these gaps authorizes implementation in the baseline task; they are closure requirements only.

---

<a id="قسم-4"></a>

<!-- SOURCE FILE: ARCHITECTURE-100-EVIDENCE.md -->
# ARCHITECTURE-100-EVIDENCE — QC-100-ARCHITECTURE-002

> **المهمة:** QC-100-ARCHITECTURE-002 — رفع Architecture / Code Quality / Maintainability / Separation of Concerns / Dependency Boundaries / Type Safety / Error Handling إلى 100% مدعوم بالأدلة.
> **النطاق:** `apps/qc-task-manager/` كاملًا · **المرجع:** مخرجات PROMPT 00 المجمّدة + `REPORT3.md` (نفس المجلد).
> **التاريخ:** 2026-09-02 · **الفرع:** `main` · **لا commit ولا push ولا deploy** — الالتزام على المالك.
> **البيئة:** Node v22.22.3 + pnpm 10.19.0 (مطابق `.node-version` و`packageManager`).

---

## 1. الأهداف الصلبة — النتيجة الفعلية

| الهدف | المطلوب | الفعلي | أمر التحقق |
|---|---|---|---|
| typecheck errors | 0 | **0** | `npx astro check` |
| typecheck warnings | 0 | **0** | `npx astro check` |
| typecheck actionable hints | 0 | **0** (كانت 27) | `npx astro check` |
| build | clean | **exit 0، صفر تحذير** | `NODE_ENV=production npx astro build` |
| architecture guard | PASS | **PASS بـ9 قواعد** (كانت 5) | `node scripts/architecture-guard.mjs` |
| dead code غير مبرر | 0 | **0** | §3 |
| duplicated permission authority | 0 | **0** | §4 |
| Vite import warnings | 0 أو موثقة | **0** | §6 |
| unresolved architectural violations | 0 | **0 داخل نطاق المهمة**؛ دورات `lab/changeRequests` مؤجّلة وموثقة (§13.4) | §5 · §13.4 |
| e2e acceptance | PASS | **غير مُتحقَّق على الشجرة النهائية** — راجع §13.2 | `pnpm e2e:acceptance` |

## 2. جدول المقاييس قبل/بعد

| المقياس | قبل | بعد | الدليل |
|---|---|---|---|
| typecheck (errors/warnings/hints) | 0 / 0 / 27 | **0 / 0 / 0** | مخرج `astro check` (قائمة الـ27 كاملة في REPORT3 §2.1) |
| تحذيرات Vite للبناء | 2 (db.ts، validation.ts) | **0** | `grep -ci warn` على مخرج البناء = 0 |
| قواعد architecture-guard | 5 | **9** | `grep -c '^function check' scripts/architecture-guard.mjs` |
| canonical unit suites | 65 | **67** | `test:manifest` → «67 canonical suites, 28 canonical E2E» |
| `canApproveFinding` معرّفة | 2 مرة (permissions + findings) | **1** | §4 |
| صادرات ميتة في lib | ~11 مؤكدة | **0** | §3 |
| مسارات API يتيمة | 1 (`/api/tasks/suggestions`) | **0** | §3 + قاعدة ORPHAN_ROUTE |
| employee-scope SQL منسوخ | 13 موضعًا | **1** (`src/lib/scope.ts`) | §5.1 |
| `PER_PAGE_OPTIONS` مُعلنة | 12 نسخة + `DEFAULT_*` 13 نسخة | **1 + 1** (`src/lib/pagination.ts`) | §5.2 |
| SQL داخل `src/pages/**` | 17 statement في 5 صفحات | **0** | §5.3 + قاعدة PAGE_DB_ACCESS |
| SQL داخل `src/pages/api/**` | 4 ملفات | **1** (`readiness.ts` — probe موثق) | §5.3 |
| لهجات ردود API | 4 (`{ok,error}` / `{ok,error,code}` / plain-text / `reason`) | **1** (`apiJson` / `apiJsonError`) | §7 |
| أخطاء API بلا `code` | 53 | **0** | `test:api-contract` 159 فحصًا |
| helpers `json()` محلية في API | 15 | **0** | قاعدة API_CONTRACT |
| أكبر ملف mutation | `taskUpdates.ts` 1,556 سطرًا | **6 ملفات**: 655/483/313/168/109/30 | §8 |
| bcrypt cost inline | 6 مواضع | **1** (`BCRYPT_ROUNDS`) | §9 |
| catch blocks تبتلع الخطأ بلا تسجيل | 10 في TSX + 2 في lib | **0** | §10 |
| روابط تصدير مكسورة (404) | 2 | **0** | §11 |

## 3. الكود الميت — حُذف فعليًا (بموافقة صريحة من المالك)

| العنصر | الدليل قبل الحذف | الإجراء |
|---|---|---|
| `src/pages/api/tasks/suggestions.ts` | صفر مراجع في `src/`, `public/scripts/`, `scripts/` | حُذف — عدّ المسارات 116 → 115 (`test:route-manifest`) |
| `scripts/smoke-task-detail.mjs` | غير مسجل في package.json ولا أي registry | حُذف |
| `auth.ts:requireRole` | صفر مستدعين | حُذف |
| `systemHealth.ts`: `safeDatabasePath`, `fileSize`, `getDiskHealth`, `applicationIdentity` | تُستخدم داخليًا فقط | أُلغي التصدير (الدوال باقية) |
| `backup-scheduler.ts:schedulerOptionsForDatabase` | صفر مستدعين | حُذفت الدالة + استيرادها |
| `searchExport.ts`: `ExportColumn`, `ExportCellMap`, `SEARCH_EXPORT_COLUMNS`, `searchRowToCells` | داخلية فقط | أُلغي التصدير |
| `seed.ts:isUsersEmpty` | داخليًا فقط | أُلغي التصدير |
| `lab/overview.ts`: `getLabReturnedTests`, `getLabOwnedWIContent` (+ نوعاهما) | الصفحة توقفت عن عرضهما (commit `05a32acd`)؛ استعلاما DB كانا يُنفّذان بلا مستهلك | حُذفت |
| `lab/index.astro`: `documentsInReview` + `getLabDocumentInReviewCount()` | متغيّر محسوب ولا يُعرض | أُزيل النداء (الدالة باقية — تستخدمها `documents/index.astro`) |

**مُبرّأة من قائمة «الميت»** بعد تحقق سطر-بسطر (تقرير الوكيل كان خاطئًا فيها): صادرات `backup-scheduler` الأربع و`observability.ERROR_CODES` و`lab/seed.EQUIPMENT_SEED_ROWS` تستخدمها سويتات الاختبار فعليًا (`scripts/test.mjs:32-36`, `test-observability.mjs:9`, `test-lab-equipment.mjs:93`).

**سكربتات غير مسجلة أُبقيت وصُنّفت (justified):** `smoke-ai-live.mjs` و`ui-screenshots.mjs` مُحال إليهما في `docs/`؛ `verify-security-hygiene.mjs` صار له أمر `test:security-hygiene` ودخل الـmanifest.

## 4. سلطة الصلاحيات — صفر ازدواجية

| الحالة قبل | بعد |
|---|---|
| `canApproveFinding` معرّفة في `permissions.ts:165` **و** `findings/index.ts:36` بجسمين مستقلين | التعريف الوحيد في `permissions.ts`؛ `canReviewFinding` نُقلت إليه أيضًا؛ `api/findings/[id].ts` يستوردهما من مصدر واحد |
| قاعدة إنشاء retest موجودة في الصفحة فقط (`retests/new.astro:22`) وبصيغة مختلفة عن الـhandler | predicate واحد `canOpenLabRetestForm(role)` في `permissions.ts` تستهلكه الصفحة والـhandler |
| row-authorization محسوبة داخل `lab/tests/[id].astro:58` و`print.astro:34` | predicate واحد `canViewLabTestRecord(user, record)` في `permissions.ts` |
| `immutable = status === 'APPROVED' \|\| status === 'VOID'` في صفحتين | `isLabTestRecordImmutable(status)` في `lib/lab/policy.ts` |
| delete-request eligibility (CORE RULE #4) داخل `tasks/[id].astro:150` | `canRequestTaskDeletion(user, task)` في `lib/task-policy.ts` |

الحارس يمنع الرجوع: قاعدة `DUPLICATE_AUTHORITY` القائمة + `SCOPE_AUTHORITY` الجديدة.

## 5. حدود الاعتماد وفصل المسؤوليات

### 5.1 employee-scope SQL: 13 → 1
`src/lib/scope.ts` صار المالك الوحيد لعبارة الملكية بستة أشكال (task/lab-test/lab-document × مُسبَّق `t.`/`d.` وغير مُسبَّق) + `rowScopeParams()`. المستهلكون: `taskSearch`, `notifications`, `export`, `reporting/scope`, `lab/search` (موضعان), `lab/overview` (أربعة), `lab/calendar`, `lab/testSearch`, `roleWorkspace`. قاعدة `SCOPE_AUTHORITY` تفشل على أي نسخة أخرى.

### 5.2 الترقيم: 25 إعلانًا → 1
`src/lib/pagination.ts` يملك `PER_PAGE_OPTIONS`, `DEFAULT_PER_PAGE`, `isPerPage`, `isSortDir`, `buildOrderClause` (بـtiebreaker `id DESC`), `mergeWheres`. الوحدات الـ12 تُبقي أسماءها العامة كـaliases توافقية (`LAB_TEST_PER_PAGE_OPTIONS = PER_PAGE_OPTIONS`)، فلا تغيير في أي واجهة. أُزيلت النسخ المكررة حرفيًا لـ`mergeWheres`/`orderClause`/`isPerPage`/`isDir` من `taskSearch` و`lab/testSearch` و`lab/review`، وصفحة `lab/tests/review.astro` توقفت عن hardcode المصفوفة.

### 5.3 قاعدة البيانات خارج طبقة العرض
`src/lib/roleWorkspace.ts` جديد يملك استعلامات صفحات الأدوار الثلاث (SQL المدير/المشرف كان توأمًا copy-paste). `listAdminUsers()` في `users.ts` و`listFindingFormOptions()` في `qc-operations.ts` و`getTaskCore()` في `taskDetails.ts` و`addTaskComment()` في `taskUpdates` و`listReportAuditLog()` في `reporting/reader.ts` استقبلت باقي الاستعلامات من الصفحات والـendpoints. خريطة `ATTENTION_TONE` صارت في `components/ui/statusTones.ts` بدل ثلاث نسخ متطابقة.

### 5.4 خرائط labels المكررة
`LAB_RETEST_REASON_SHORT_LABELS`, `LAB_SAMPLE_STATUS_LABELS`, `LAB_TEST_PARAM_LABELS`, `LAB_FAIL_RATE_ALERT_THRESHOLD` انتقلت إلى `lib/lab/policy.ts`؛ صفحتا الاختبار والطباعة تستهلكانها بـalias، و`documents/[id].astro` صار يستورد `LAB_DOCUMENT_STATUS_LABELS` من `lib/lab/documents.ts`.

## 6. تحذيرات Vite — 0 (PERF-001 مغلقة)

**قبل:** تحذيران يقولان إن `db.ts` (يُستورد ديناميكيًا من `tasks.ts`) و`validation.ts` (من 10 وحدات lab) مُستورَدان ساكنًا في مكان آخر، فلا ينتج chunk منفصل.

**الجذر:** الديناميكية كانت لازمة تاريخيًا لأن `db.ts` يستورد `?raw` (39 هجرة) فلا يُحمَّل في Node العادي. لكن الوحدات الـ10 كلها تستورد `db` **ساكنًا** أصلًا (تحقق: `static_db_imports=1` لكل واحدة)، و`tasks.ts` يستورد `getDb` ساكنًا في السطر 16 وديناميكيًا في 418 — أي الديناميكية زائدة بلا فائدة.

**الإجراء:** حُوِّلت 13 ديناميكية زائدة إلى static؛ أُزيلت الأغلفة العدمية (`getSearchDb`, `getReviewDb`, `getLabTestDb`) والتعليقات المتقادمة التي تدّعي قيدًا لم يبقَ. الديناميكيات اللازمة الوحيدة الباقية: `import('exceljs')` (حزمة CJS خارجية عبر `vite.ssr.external`).

**النتيجة:** `NODE_ENV=production npx astro build` → exit 0 وصفر تحذير.

## 7. معالجة الأخطاء وعقد API

**قبل:** أربع لهجات — `apiJsonError`، 15 helper `json()` محلي بلا `code` وبلا `no-store`، plain-text في `findings/{capa,evidence,rca}`، و`{ok:false, reason}` في readiness. و53 خطأ بلا `code`، و`findings/[id].ts:17` يرد 400 على أي استثناء (بما فيها أعطال السيرفر).

**بعد (TDD — الاختبار كُتب أولًا وفشل بـ38 مخالفة ثم أُخضِر):**
- `apiJson(body[, status])` جديد بجانب `apiJsonError(msg, status[, code][, extra])`؛ كلاهما JSON + `no-store`.
- 35 endpoint مُرحَّل؛ صفر helper محلي؛ صفر body نصي؛ `AI` أُضيف لـ`SafeErrorCode` بدل تمرير حالة AI كنص.
- `scripts/test-api-contract.mjs` (**159 فحصًا**، أمر `test:api-contract`) مسجل canonical → 67 suite.

### 7.1 فصل «رفض السياسة» عن «عطل السيرفر» (تصحيح ذاتي أثناء التنفيذ)

المحاولة الأولى حوّلت كل catch في مسارات findings من 400 إلى 500. **هذا كان خطأ**، وكشفه `e2e-findings` بثلاثة إخفاقات: مخالفات قواعد QC (انتقال CAPA للخلف، إغلاق قبل الاعتماد، إغلاق بلا دليل) تُرمى كاستثناءات وهي **رفض متوقع** لا عطل، فتستحق 400.

التصحيح المعماري: صنف `DomainRuleError` جديد في `qc-operations.ts` (10 مواضع رمي قواعد صارت مُصنَّفة). في الـendpoints:

```ts
} catch (error) {
  if (error instanceof DomainRuleError) return apiJsonError(error.message, 400);
  return apiJsonError('… generic …', 500);
}
```

فصار: نص القاعدة (وهو نص موجَّه للمستخدم أصلًا) يظهر مع 400، وأي عطل غير متوقع يظهر برسالة عامة مع 500 بلا تسريب نص استثناء. وحُدِّثت القاعدة 4 في حارس العقد لتعتبر `DomainRuleError` استثناءً مشروعًا للـ400.

## 8. تفكيك وحدة المهام (قرار المالك: عند الشقوق الآمنة)

`taskUpdates.ts` (1,556 سطرًا) → مجلد `src/lib/taskUpdates/` بشقوق مأخوذة من عناوين الأقسام في الملف نفسه:

| الملف | الأسطر | المسؤولية |
|---|---|---|
| `update.ts` | 655 | تحديث الحقول + checklist + dependencies |
| `closure.ts` | 483 | تدفق الإغلاق + بوابة الأدلة |
| `shared.ts` | 313 | أنواع النتائج + حدود التدقيق + تحقق الملفات |
| `lifecycle.ts` | 168 | cancel / reopen |
| `attachments.ts` | 109 | رفع المرفقات + التعليقات |
| `index.ts` | 30 | الواجهة العامة + re-exports التوافقية |

الواجهة العامة **لم تتغير** — كل المستوردين (7 endpoints + صفحة + سويتان) يعملون بلا تعديل عدا مساري import صريحين بـ`.ts` في سكربتي اختبار. الوحدات الضخمة الأخرى (`lab/documents.ts` 1,553، `validation.ts` 1,359 كـschema hub، `lab/tests.ts` 1,191، `dashboard.ts` 1,114) بقيت بقرار المالك وتُوثَّق ملكيتها في `docs/ARCHITECTURE.md`.

## 9. Magic values

`BCRYPT_ROUNDS` مُصدَّر من `auth.ts` ويستهلكه `auth.ts` و`users.ts` و`seed.ts` (6 مواضع inline → 1)؛ `RETENTION_WINDOW_MS` في `db.ts` (نسختان inline → 1)؛ `LAB_FAIL_RATE_ALERT_THRESHOLD` في `lib/lab/policy.ts` (نسختان → 1)؛ خيارات الترقيم (§5.2).

## 10. الأخطاء المبتلعة

12 موضعًا كان يرمي كائن الخطأ تمامًا صار يسجّل `console.error` تشخيصيًا مع **إبقاء نص المستخدم حرفيًا** (فحوص `test:ux-writing` و`test:interaction-feedback` تحرسه): `TaskLifecycle` (3)، `CommentBox`، `AttachmentUploader`، `MarkReadButton`، `MarkAllReadButton`، `DeleteRequestDialog`، `Navbar` (fetch الخلفي)، `backup-scheduler` (catch-up).

## 11. اكتشاف عرضي: رابطا تصدير مكسورا (404)

قاعدة `ORPHAN_ROUTE` الجديدة كشفت أن `/api/lab/tests/export.csv` و`export.xlsx` بلا أي مُحيل — والسبب أن `lab/tests/index.astro:177-178` كانا يشيران إلى `/lab/tests/export.csv|xlsx`، وهذان **غير موجودين** كصفحة أو endpoint. أي زر «Export CSV/XLSX» في سجل اختبارات المختبر كان يرد 404. أُصلح المساران، وأُضيف فحص regression في `test:ui-consistency` (212 فحصًا الآن) يفشل على أي رابط تصدير لا يستهدف `/api/`.

## 12. سجل التحقق النهائي (أوامر ومخرجات فعلية على الشجرة النهائية)

| الأمر | المخرج |
|---|---|
| `npx astro check` | **0 errors / 0 warnings / 0 hints** |
| `NODE_ENV=production npx astro build` | **exit 0** · `warnings=0` (تحقق بـ`grep -ci warn` على السجل) |
| `node scripts/architecture-guard.mjs` | **PASS** — 9 قواعد |
| `node scripts/route-manifest.mjs --check` | **PASS** — 115 file routes / 25 middleware / 6 guards |
| `node scripts/test-manifest-guard.mjs` | **PASS** — 67 canonical suites, 28 canonical E2E |
| `node scripts/test-api-contract.mjs` | **PASS** — 159 checks / 35 endpoints |
| `node scripts/test-ui-consistency.mjs` | **PASS** — 212/212 |
| `node scripts/verify-security-hygiene.mjs` | **PASS** |
| `node scripts/test-qc-operations.mjs` | **PASS** |
| `git diff --check` | نظيف (أُصلحت مسافة زائدة واحدة في `tasks.ts:400`) |
| `node scripts/run-full-tests.mjs` | آخر تشغيل كامل: 66/67 ثم أُخضِر الأخير (§13.1) — **لم يُعَد تشغيل السلسلة بعد تعديلات §7.1** |
| `node scripts/e2e-acceptance.mjs` | **غير مُتحقَّق على الشجرة النهائية** (§13.2) |

### 12.1 تعديلان على ملفي حراسة — بالسبب

1. **`test-lab-ux-presentation.mjs`** كان يطلب ظهور نصوص حالات المستندات حرفيًا داخل `documents/[id].astro`؛ بعد إزالة الخريطة المكررة صارت النصوص في مالكها الوحيد `lib/lab/documents.ts`. أُضيف هذا الملف لخريطة الحارس فصار يقبل المصدر الكنسي — **نية الفحص محفوظة** (الحالات لا تزال صريحة ومعروضة للمستخدم)، ولم يُضعَّف أي شرط.
2. **`test-api-contract.mjs`** القاعدة 4: أُضيف `DomainRuleError` كاستثناء مشروع لرد 400، لأن رفض قاعدة QC رفضٌ متوقع لا عطل (§7.1).

لم يُعطَّل أو يُحذف أي assertion، ولم يُخفَّف أي فحص لإخضار نتيجة.

## 13. الحدود الصادقة — ما لم يُثبت في هذه المهمة

### 13.1 سلسلة الوحدات
آخر تشغيل كامل لـ`run-full-tests.mjs` (بعد كل تعديلات §3–§11 وقبل §7.1) أعطى **66 من 67 خضراء** والفشل الوحيد كان `test:lab-ux-presentation` من نوع «نص انتقل لمالكه الكنسي» — أُصلح وأُعيد تشغيل السويتة وحدها: **14/14 PASS**. لم تُعَد السلسلة كاملة بعد تعديلات §7.1 بأمر المستخدم بتخطي الاختبارات؛ السويتات المتأثرة مباشرة (`test-qc-operations`, `test-api-contract`, `architecture-guard`, `astro check`, `build`) شُغّلت فرديًا وكلها خضراء.

### 13.2 بوابة القبول E2E
التشغيل الكامل قبل §7.1 أعطى **فشلًا واحدًا** في `e2e-findings` بثلاث assertions تطلب 400 لرفض قواعد CAPA/الإغلاق — وهي بالضبط ما يعالجه تصحيح §7.1. **لم يُعَد تشغيل `e2e:acceptance` بعد التصحيح** (تخطي بأمر المستخدم)، لذلك حالته على الشجرة النهائية **غير مُتحقَّقة** ولا يجوز اعتبارها خضراء. الخطوة الأولى قبل أي نشر: `pnpm e2e:acceptance` في runner يسمح بـlocalhost.

### 13.3 الفجوات الخارجية (بلا تغيير)
G-01 نشر حي · G-02 UAT بشري · G-03 وصول يدوي بخبير · G-04 restore إنتاجي · G-05 RUM. هذه المهمة معمارية داخلية ولا تدّعي إغلاق أي منها.

### 13.4 قرارات justified موثقة (لا إنجازات)
- الوحدات الضخمة الأربع الباقية: `lab/documents.ts` 1,553 · `validation.ts` 1,359 (schema hub) · `lab/tests.ts` 1,191 · `dashboard.ts` 1,114 — بقرار المالك «فصل عند الشقوق الآمنة فقط».
- ~566 cast عند حدود better-sqlite3 — نمط مقصود بلا طبقة row-mapper في هذا النطاق؛ الهدف الرقمي كان typecheck 0/0/0 وتحقق.
- middleware كموجّه POST (25 معالجًا) + CSP hashes + `ENDPOINT_PAGE_PATHS` — عقد قائم موثق، لم يُفكَّك.
- `BaseLayout` يستعلم إشعارات الجرس في كل render — متطلب وظيفي موثق.
- دورات استيراد `lab/changeRequests ↔ {equipment, products, calibration, retests}` — **لم تُفكَّك** في هذه المهمة (تحتاج inversion عبر sink module؛ تُسجَّل كعمل تالٍ).

### 13.5 حدود الحوكمة
لا commit ولا push ولا deploy — القاعدة الثانية في دستور المشروع؛ الالتزام والنشر على المالك.

---

<a id="قسم-5"></a>

<!-- SOURCE FILE: DATABASE-100-EVIDENCE.md -->
# DATABASE-100 Evidence — QC-100-DATABASE-003

Date: 2026-09-02 (Asia/Riyadh)

## Scope and safety

- Scope: `apps/qc-task-manager` SQLite database, migrations, embedded migration bundle, initialization, doctor, integrity constraints, backup, restore, and retention.
- Every database opened by the consolidated gate is created under an OS temporary directory and removed in `finally` cleanup.
- No production database was opened, modified, restored, or used as a source.
- This document does not claim live production restore evidence. Live/staging operator evidence remains outside this local gate.

## Automated result

Command executed:

```text
node --import ../../scripts/test-ts-loader.mjs --experimental-strip-types scripts/test-database-100.mjs
```

Result: **DATABASE-100: PASS (23 checks)**

The equivalent package entry point is `pnpm test:database-100`. The direct Node invocation was used for this run because the local runner could not download Corepack's pnpm package from npm; this was an environment limitation, not a product failure.

## Mandatory validation matrix

| Requirement | Evidence | Result |
|---|---|---|
| Fresh initialization | Fresh nested temp path initialized by `scripts/init-db.mjs` | PASS |
| Migration 001 → latest | `scripts/test-migrations.mjs`; 39 migrations applied | PASS |
| Migration checksum parity | `scripts/test-migrations.mjs` drift checks; embedded SHA-256 parity | PASS |
| Embedded migration parity | `scripts/test-embedded-migration-parity.mjs`; **39/39 byte-identical** | PASS |
| Schema-reference parity | `scripts/test-schema-reference.mjs`; **165 objects** | PASS |
| Foreign-key integrity | Fresh and restored `PRAGMA foreign_key_check` return `[]` | PASS |
| SQLite integrity check | Fresh and restored `PRAGMA integrity_check` return `ok` | PASS |
| WAL configuration | `journal_mode=wal`, `foreign_keys=1`, `busy_timeout=5000`, `synchronous=NORMAL` | PASS |
| Transaction rollback | Intentional exception leaves transaction sentinel absent | PASS |
| Duplicate prevention | Duplicate `users.username` rejected by UNIQUE constraint | PASS |
| Invalid state prevention | Invalid task status rejected by CHECK constraint | PASS |
| Downgrade/failure behavior | Migration failure rollback, failure ledger, checksum drift, and destructive SQL guard | PASS |
| Restart persistence | Existing isolated production-operations drill | PASS |
| Backup creation | Online SQLite backup creates a timestamped snapshot and metadata | PASS |
| Backup validation | Backup checksum, metadata counts, schema version, integrity, and FK validation | PASS |
| Restore into clean environment | Verified backup copied into a new isolated DB path | PASS |
| Restored DB integrity | Restored `PRAGMA integrity_check = ok` | PASS |
| Restored DB FK check | Restored `PRAGMA foreign_key_check = []` | PASS |
| Restored schema version | Restored `schema_migrations` max version = **39** | PASS |
| Critical record equality | Restore marker row matched before/after restore | PASS |

Additional gates in the run covered retention behavior, DB doctor diagnostics, and the operational backup/restore/restart drill.

## Index audit

The audit compared all index definitions in `db/schema.sql` against the startup contract in `src/lib/db.ts` and found **106/106** covered indexes. The audit used the observed prepared-query paths in `src/` and `scripts/` as the query inventory; no speculative index was added.

The audit found seven existing indexes that were not previously enforced by startup validation:

- `idx_attachments_evidence_type`
- `idx_login_attempts_ip_failure`
- `idx_qc_audit_user_actor_time`
- `idx_report_audit_actor_time`
- `idx_report_audit_type_time`
- `idx_task_templates_department`
- `idx_task_templates_status`

They are now included in the required-index contract. Schema and migration SQL were not changed because all seven indexes already existed and schema-reference parity was already exact.

## Files changed

- `src/lib/db.ts` — startup validation now covers all 106 schema indexes.
- `scripts/test-database-100.mjs` — isolated consolidated evidence gate.
- `package.json` — `test:database-100` script.
- `DATABASE-100-EVIDENCE.md` — this evidence record.

## Verification notes

- Existing migration, embedded parity, schema-reference, DB doctor, DB rules, retention, and production-operations suites all passed inside the isolated gate.
- No commit, push, deployment, or production mutation was performed.
- The evidence is local automated evidence only; it is not a substitute for PROMPT 14 live restore evidence.

---

<a id="قسم-6"></a>

<!-- SOURCE FILE: SECURITY-RBAC-PRIVACY-100-EVIDENCE.md -->
# SECURITY / RBAC / PRIVACY 100% Evidence

**Task:** `QC-100-SECURITY-004`  
**Application:** `apps/qc-task-manager`  
**Evidence scope:** local source, isolated SQLite databases, deterministic unit/contract suites, and production-build artifacts.  
**Canonical authorization source:** `src/lib/permissions.ts` (`PERMISSIONS` plus its entity-level predicates).

## Result

**Local automatable status: PASS (unit/contract scope).** No known critical, high, or medium exploitable authorization defect remains in the exercised scope. A cross-entity CAPA/evidence IDOR found during this task was fixed in `src/lib/qc-operations.ts` and covered by a regression test.

This is not a claim of live production security or human/UAT completion. External evidence blockers are listed at the end.

## Coverage matrix

| Area | Evidence | Result |
|---|---|---|
| Login, password, reset, lockout, disabled users | `test:auth-password-lifecycle`, `e2e-auth-lockout`, `e2e-auth-password-flow` | PASS |
| Sessions, expiry, logout, cookie flags, open redirect | auth/session tests and `safeRedirectTarget` contract | PASS |
| CSRF, Fetch Metadata, request size/content type | `test:request-security`, `test:lab-security` | PASS |
| XSS and injection | schema bounds, output escaping contracts, LIKE escaping, hostile live search | PASS |
| SQL usage | parameterized query guards and `test:api-contract` / `test:security-hygiene` | PASS |
| IDOR / horizontal access | task scopes, lab record scopes, notification/filter ownership, CAPA parent binding | PASS |
| Vertical access / RBAC | `test-security-rbac-privacy-100` plus existing lab/admin/findings/report suites | PASS |
| File upload / MIME / filename / executable bytes / size | `test:lab-security`, upload validators, attachment E2E | PASS |
| Exports and reports | task/search/lab/report E2E suites, role-scoped report authorization | PASS |
| AI endpoints | AI feature/lab suites, consent, per-user limiter, record scopes, safe provider errors | PASS |
| Admin, backup, audit, signatures | admin-users, backup, audit-integrity, esignature suites | PASS |
| Security headers / CSP / CORS | middleware contract and `test:request-security` / `test:security-hygiene` | PASS |
| Error leakage / sensitive logs / tracked secrets | `test:observability`, `test:security-hygiene`, source scan | PASS locally |

## RBAC matrix

The executable matrix tests every role-only sensitive gate across `employee`, `supervisor`, `manager`, and `admin`, with anonymous access denied by the session/API wall. It covers allowed and denied decisions for dashboard, user administration, templates, delete requests, assignment, workload, findings/CAPA, lab tests, products, templates, equipment, calibration, reports, exports, audit, management dashboards, change requests, and AI assist.

Entity-level segregation is tested for:

- laboratory test: tester cannot review/approve their own record; reviewer cannot approve the same record; terminal records are immutable;
- controlled document and document version: author/owner cannot review or approve their own version;
- lab template: author cannot approve their own version;
- change request: requester cannot approve their own request;
- task/finding/CAPA/evidence: ownership and parent-entity binding are checked server-side;
- signatures: approval re-verifies the current password and is rate-limited/audited.

## Remediation recorded in this task

- Removed duplicate exported permission declarations for `canManageTemplates` and `canOverrideEvidenceGate`; callers use the `PERMISSIONS` object.
- Bound CAPA evidence to the parent Finding in both the API contract and the operation layer. A mismatched CAPA/Finding pair returns the same safe “target not found” domain error and creates no row.
- Inaccessible task/Finding detail, attachment, PDF, comment, and AI contexts use a not-found surface where revealing the record would create an enumeration oracle. Role-only denials on an already-visible resource remain explicit permission denials.
- Replaced the remaining direct management/report role gates with canonical predicates from `src/lib/permissions.ts`; role scope remains data scoping, not a second permission source.
- Added `scripts/test-security-rbac-privacy-100.mjs` and registered it in the canonical test manifest.

## Executed results

- All registered local `test:*` unit/integration/contract scripts: **69/69 PASS**.
- `test-security-rbac-privacy-100`: PASS; `test-lab-security`: **66/66**; `test-request-security`: **56/56**; deployment contract: **22/22**.
- `astro check`: **0 errors / 0 warnings / 0 hints**; production build: PASS, both executed before the final test-expectation-only E2E edits.
- Acceptance execution verified the non-discovery behavior for foreign task PDFs and Findings, then exposed two stale 403 expectations in `e2e-findings`; those expectations were corrected to 404. The requested final re-run was intentionally skipped by the user, so there is no final full-acceptance claim for this working tree.

## Reproducible checks

| Command | Expected evidence |
|---|---|
| `node --import ../../scripts/test-ts-loader.mjs --experimental-strip-types scripts/test-security-rbac-privacy-100.mjs` | RBAC matrix + canonical-source scan PASS |
| `node --import ../../scripts/test-ts-loader.mjs --experimental-strip-types scripts/test-lab-security.mjs` | 66 checks PASS, including CAPA/Finding IDOR regression |
| `node --import ../../scripts/test-ts-loader.mjs --experimental-strip-types scripts/test-request-security.mjs` | 56 checks PASS |
| `pnpm test:manifest` | canonical registry has no drift |
| `pnpm test:security-hygiene` | no tracked DB/env/private-key material or sensitive logging |
| `pnpm typecheck` | zero type errors/warnings |
| `NODE_ENV=production pnpm build` | production build completes |

## Explicit blockers outside local automation

- **Credential rotation blocker:** `.claude/settings.local.json` contains a local third-party Anthropic credential configuration previously recorded by the project mind. No revoke/rotation evidence exists in this task. Treat the credential as exposed until the human owner revokes and rotates it, then records provider-side evidence. The secret value is intentionally not reproduced here.
- **Live deployment blocker:** no staging/production deployment, live header capture, or production database access was authorized or performed.
- **Human validation blocker:** real employee/supervisor/manager/admin UAT and independent VoiceOver/NVDA/manual security review remain required; automated tests are not substituted for them.
- **Final acceptance rerun:** intentionally skipped at user direction after correcting the two stale E2E status expectations. Run `NODE_ENV=production pnpm e2e:acceptance` before release to record final browser acceptance evidence.

No commit, push, deploy, or external credential mutation was performed.

---

<a id="قسم-7"></a>

<!-- SOURCE FILE: AUTOMATED-VERIFICATION-100-EVIDENCE.md -->
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

---

<a id="قسم-8"></a>

<!-- SOURCE FILE: DESIGN-SYSTEM-100-EVIDENCE.md -->
# QC-100-DESIGN-SYSTEM-006 — Design-system evidence

**Date:** 2026-09-02  
**Scope:** `apps/qc-task-manager` visual foundations, reusable primitives, and machine-verifiable consistency rules.  
**Out of scope:** workflow rules, server-side RBAC/CSRF, route URLs, SQLite data, and user-visible business behavior.

## Outcome

The task manager now has a versioned v2 token contract and a canonical primitive
catalogue. The guard makes raw palette values and unbounded transitions fail inside
the shared UI layer, while preserving a clearly reported legacy migration boundary for
route markup that cannot safely be bulk-rewritten.

## Audit evidence

| Area | Count | Finding |
| --- | ---: | --- |
| Astro pages | 76 | Mixed legacy page-level Tailwind visual rules remain. |
| Visual components | 45 | Shared UI owns the canonical recipes; domain adapters are retained. |
| Files containing raw palette utilities | 98 | Legacy migration queue, not a canonical-system claim. |
| High-frequency drift | 620 `text-slate-500`, 530 `text-slate-900`, 304 `border-slate-200` | Replaced in shared primitives by semantic aliases; routes migrate safely in follow-up batches. |

The audit included pages, Astro/React components, shared panels, forms, badges,
notifications, tables, page headers, navigation primitives, charts' semantic color
roles, and existing dialog/drawer behavior owners. No business behavior was changed.

## Implemented canonical contract

- Foundation tokens cover typography, spacing, radius, borders, elevation/shadows,
  opaque/glass/overlay surfaces, icon sizes, container/breakpoint references, motion,
  focus rings, chart roles, and semantic colors.
- Semantic aliases provide default/neutral, primary/accent, secondary/content,
  success, warning, danger, info, and disabled roles.
- Canonical form/action primitives now include `AppButton`, `IconButton`, `Input`,
  `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch`, `DateControl`, `SearchInput`,
  and `FormField`.
- Presentation primitives include `Card`, `StatusPill`, `Banner`, `Toast`,
  `Skeleton`, `Pagination`, `Breadcrumbs`, `EmptyState`, `PageHeader`, and
  `SectionHeader`. Existing dialog, drawer, dropdown, tooltip, tabs, table and chart
  implementations are governed by the documented shell contracts until their
  behavior-specific adapters are migrated.
- `WorkflowContext`, contextual help, status attention surfaces, and lab badge maps
  were migrated from raw colors to semantic roles.

## Automated guards

`pnpm test:design-system-100` verifies:

1. Required v2 foundation and semantic token families exist.
2. The canonical primitive catalogue is present.
3. Shared `src/components/ui/` files contain no raw color palette utilities.
4. Shared primitives do not use `transition-all`.
5. System documentation contains both the catalogue and explicit legacy boundary.

The suite is registered in the canonical test manifest, so future test-registry drift
is also rejected.

## Claim boundary

This evidence does **not** claim that all 98 legacy source files already use semantic
tokens. It does establish zero unexplained visual primitive duplication in the shared
layer and prevents new shared drift. Reaching route-level 100% semantic usage requires
route-sized migrations with browser/regression evidence; bulk replacement would risk
changing validated enterprise workflows.

---

<a id="قسم-9"></a>

<!-- SOURCE FILE: UI-VISUAL-100-EVIDENCE.md -->
# UI-VISUAL-100 Evidence

**Task:** `QC-100-UI-VISUAL-007`  
**Date:** 2026-09-02  
**Scope:** `apps/qc-task-manager` visual routes

## What changed

- Added a single `qc-page-content` flow to the shared `BaseLayout`; standard
  pages now use a wider responsive content shell (`max-w-7xl`) with consistent
  mobile/tablet/desktop gutters.
- Added token-backed `qc-page-stack`, `qc-surface-panel`, `qc-table-panel`, and
  `type-metadata` recipes. Tables inherit readable headers, aligned cells,
  semantic surfaces, and bounded hover feedback without changing their data or
  links.
- Migrated the search, laboratory test register, and controlled-document
  register to the shared table panel. Their GET filters, pagination, links,
  and status components are unchanged.
- Migrated sign-in and 404 surfaces to the shared page title, form-field,
  banner, button, and surface primitives. Authentication behaviour is unchanged.
- Added a deterministic route guard (`test:ui-visual-100`) that inventories all
  76 Astro pages, identifies the 5 print routes and the `/admin` redirect, and
  prevents unclassified visual pages or missing shared recipes.

## Route coverage

Every Astro page below was included in the route guard and reviewed for layout
ownership, page classification, shared shell coverage, and visual recipe use.
`/admin` is a redirect-only route; print routes retain their dedicated print
layout. API endpoints and `logout.ts` are non-visual and are intentionally not
counted as pages.

| Route | Review result |
| --- | --- |
| `/404`, `/login`, `/` | Entry surface + title hierarchy reviewed |
| `/account/security`, `/dashboard`, `/dashboard/drilldown`, `/notifications`, `/reports`, `/search` | Shared shell and action/data hierarchy reviewed |
| `/employee`, `/employee/new`, `/supervisor`, `/supervisor/new` | Workflow shell and form surfaces reviewed |
| `/manager`, `/manager/new`, `/manager/requests`, `/manager/workload` | Workflow shell, KPIs, and workload surfaces reviewed |
| `/tasks/[id]`, `/findings`, `/findings/[id]` | Detail/register hierarchy and breadcrumbs reviewed |
| `/admin` | Redirect-only exception verified |
| `/admin/settings`, `/admin/system-health`, `/admin/templates`, `/admin/templates/new`, `/admin/templates/[id]/edit` | Admin shell and supporting information reviewed |
| `/admin/users`, `/admin/users/audit` | Admin register/table hierarchy reviewed |
| `/lab`, `/lab/management`, `/lab/search`, `/lab/notifications`, `/lab/calendar`, `/lab/audit`, `/lab/data-quality`, `/lab/reports`, `/lab/saved-views` | Lab command-center hierarchy reviewed |
| `/lab/tests`, `/lab/tests/new`, `/lab/tests/review`, `/lab/tests/[id]`, `/lab/tests/[id]/print` | Test workflow, status, register, and print exception reviewed |
| `/lab/retests`, `/lab/retests/new`, `/lab/retests/[id]` | Retest workflow and status hierarchy reviewed |
| `/lab/change-requests`, `/lab/change-requests/new`, `/lab/change-requests/[id]` | Change-request workflow and action hierarchy reviewed |
| `/lab/products`, `/lab/products/new`, `/lab/products/[id]`, `/lab/products/[id]/edit` | Product register/form/detail surfaces reviewed |
| `/lab/equipment`, `/lab/equipment/new`, `/lab/equipment/[id]`, `/lab/equipment/[id]/edit`, `/lab/equipment/[id]/maintenance`, `/lab/equipment/[id]/print` | Equipment surfaces and print exception reviewed |
| `/lab/calibration`, `/lab/calibration/new`, `/lab/calibration/[id]`, `/lab/calibration/[id]/edit`, `/lab/calibration/[id]/print` | Calibration surfaces and print exception reviewed |
| `/lab/maintenance/[id]/print` | Maintenance print exception reviewed |
| `/lab/documents`, `/lab/documents/new`, `/lab/documents/[id]`, `/lab/documents/[id]/edit`, `/lab/documents/[id]/versions`, `/lab/documents/[id]/print` | Controlled-document surfaces, register, and print exception reviewed |
| `/lab/templates`, `/lab/templates/new`, `/lab/templates/[id]`, `/lab/templates/[id]/edit` | Lab template register/form/detail surfaces reviewed |
| `/lab/acknowledgements`, `/lab/acknowledgements/assign` | Acknowledgement workflow surfaces reviewed |

**Guard result:** `76/76` Astro routes classified; `5` print routes and `1`
redirect-only exception explicitly identified.

## Responsive coverage

| Viewport | Source contract | Browser run |
| --- | --- | --- |
| 320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920 | Responsive layout uses fluid width, wrapping actions, and scrollable register panels | Pending dedicated visual capture |

The existing responsive E2E contract passed and the new guard confirms the
shared shell and register panel are present. A dedicated screenshot/visual
capture at every requested width still needs a browser session; it is not
claimed here as completed evidence.

## Verification

- `pnpm test:ui-visual-100` ✅ — 171/171 checks, 76 Astro routes.
- `pnpm test:ui-consistency` ✅ — 212/212 checks.
- `pnpm test:design-system-100` ✅ — 29 token checks, 21 primitive checks.
- `pnpm test:interaction-feedback` ✅ — 25/25 checks.
- `pnpm test:responsive-e2e-contract` ✅.
- `pnpm test:manifest` ✅ — 71 canonical suites, 28 E2E suites.
- `pnpm typecheck` ✅ — 0 errors, 0 warnings, 0 hints.
- `NODE_ENV=production pnpm build` ✅ — Complete.
- `git diff --check` ✅.
- `pnpm e2e:acceptance` ⏭️ — cancelled at the user's request after the first
  three suites had started; no acceptance-pass claim is made.

## Remaining evidence gap

No claim is made for a human designer sign-off, VoiceOver/NVDA review, or a
fresh screenshot run at all ten requested widths because no browser capture was
available in this execution. These are the remaining manual acceptance items.

---

<a id="قسم-10"></a>

<!-- SOURCE FILE: 7-UX-IA-SERVICE-DESIGN-100-EVIDENCE.md -->
# QC Task Manager — UX / IA / Service Design Evidence

**Task ID:** `QC-100-UX-IA-008`  
**Scope:** employee, supervisor, manager, and admin experiences across the QC Task Manager  
**Review date:** 2026-09-02  
**Review type:** principal UX architecture audit of the current product and target information architecture

## Executive finding

The product has a sound technical navigation foundation: role-filtered global navigation, a permission-filtered Laboratory secondary navigation, shared breadcrumbs on key detail pages, and route-level guards. The current experience is not yet a complete task-oriented service model, however. The main cognitive-load risks are duplicated work-area concepts, incomplete cross-workflow continuation, and a mismatch between the requested end-to-end journeys and the existing service blueprint.

This document is evidence, not a claim of human UX validation. Automated route, accessibility, responsive, and workflow checks show implementation behavior; they do not prove that employees can find a destination, understand ownership, or complete the work without assistance. Human tree testing, role-based UAT, and screen-reader review remain open.

## Evidence boundary and sources

The audit used the current source and existing project documentation:

| Evidence | What it establishes |
|---|---|
| `src/components/Navbar.tsx` | Global labels and role-specific entry points; notification utility and More grouping |
| `src/lib/lab/navigation.ts` | Laboratory secondary-nav groups, permission filtering, and implemented-route allowlist |
| `src/pages/**` and `src/pages/api/**` | Current visual routes, action endpoints, and record families |
| `src/pages/dashboard.astro` | Attention-oriented dashboard cards and drilldown entry points |
| `src/pages/lab/management.astro` | Management attention/risk/quality/assurance entry points |
| `src/pages/lab/reports.astro` | Report catalogue, filter preview, and download flow |
| `docs/INFORMATION-ARCHITECTURE.md` | Previous IA contract and current state grouping |
| `docs/SERVICE-BLUEPRINT.md` | Previous four-journey handoff contract |
| `docs/UX-RESEARCH-PROGRAM.md` | Unexecuted human validation plan and role task matrix |
| `scripts/route-manifest.mjs` | Separation of file routes, middleware routes, and guards |

Source citations below use repository-relative paths and line numbers so the findings can be rechecked after later changes.

## 1. User mental models and jobs to be done

The primary IA should be organized around the work people are trying to finish, not around application folders or database entities.

| Role | Primary job | Questions the IA must answer | Natural home |
|---|---|---|---|
| Employee | Complete assigned work correctly and hand it off | What is mine? What is blocked? What do I submit next? Who receives it? | **My Work** |
| Supervisor | Review team work and resolve exceptions | What needs my review? What should I return? Who owns the correction? | **Team Review** |
| Manager | Make controlled decisions and monitor operational risk | What needs approval? What risk is aging? What decision is mine? | **Command Center** |
| Admin | Keep people, configuration, and service operation healthy | What is a service/admin issue? What can I change safely? What is the audit impact? | **Administration** |

### Recommended top-level mental model

```text
My Work / Team Review / Command Center
├── Work queue (tasks, tests, reviews, returned work)
├── Quality issues (findings, RCA, CAPA, evidence)
├── Laboratory operations (testing, assets, documents, changes)
├── Insights (reports, audit, data quality)
└── Administration (users, templates, settings, system health)
```

The current implementation can preserve existing URLs while exposing these concepts through labels, section headings, contextual links, and role-specific entry points. URL hierarchy is not required to mirror the mental model.

## 2. Current-state IA audit

### Global navigation

The global header currently exposes Dashboard, Tasks, Search, Findings, Laboratory, and Reports for manager/supervisor/admin roles; employees receive My Tasks, Search, Findings, and Laboratory. Admin and manager utility destinations are in More. This is evidenced in `src/components/Navbar.tsx:40-101`.

What works:

- Role filtering is explicit and server permission checks remain authoritative.
- Primary work areas are visible at desktop widths; mobile navigation groups the same destinations under Workspace and Administration (`Navbar.tsx:103-113`).
- Notifications are treated as a utility affordance with an unread count and recent-item dropdown (`Navbar.tsx:17-32`).
- Employee access correctly starts at My Tasks rather than the manager/supervisor dashboard (`Navbar.tsx:90-100`).

IA risks:

| Finding | Evidence | Severity | Why it increases cognitive load | Target direction |
|---|---|---:|---|---|
| Dashboard, Tasks, and My Tasks are different labels for different role homes | `Navbar.tsx:46-100` | P1 | A user cannot infer whether Dashboard is a summary, queue, or home; training must explain role-specific route semantics | Use a role-specific home label plus a consistent explanatory subtitle: “Command Center”, “Team Review”, or “My Work” |
| Search is global while Laboratory also owns a second search | `Navbar.tsx:48-55`, `lab/navigation.ts:61-66` | P1 | Users must choose a search scope before knowing what is indexed | Make global Search the cross-record search and label Lab Search “Laboratory search”; show scope in the page title and query controls |
| Reports exist globally and inside Laboratory | `Navbar.tsx:48-55`, `lab/navigation.ts:82-86` | P1 | The same word suggests the same result, but the scope and catalogue differ | Keep both routes, but label them “QC Reports” and “Laboratory Reports”; link each to the other only when scope changes |
| Notifications exist globally and inside Laboratory | `Navbar.tsx:17-32`, `lab/navigation.ts:61-66` | P1 | A user may split attention across two inboxes and miss ownership-changing events | Make the global inbox canonical; make Lab Notifications a filtered view with a visible “Laboratory notifications” scope |
| Administration is a mixed More menu | `Navbar.tsx:56-63`, `Navbar.tsx:74-77` | P2 | Delete Requests, Workload, Users, Templates, Backups, and System Health have different jobs and risk | Group More into “Team operations” and “System administration”; retain RBAC filtering |

### Laboratory secondary navigation

The current five groups are a useful starting point: Overview, Testing, Master Data, Controlled Documents, and Operations (`src/lib/lab/navigation.ts:39-52`). The nav is permission-filtered and restricted to implemented routes (`navigation.ts:139-147`), which is a strong anti-dead-link contract.

The grouping is still partly system-oriented. “Master Data” hides work users think of as “Equipment readiness” and “Test setup”; “Operations” combines decisions, reporting, quality assurance, and change control. Recommended labels and grouping:

| Current group | Target user-facing group | Included jobs |
|---|---|---|
| Overview | **Laboratory home** | Command Center, calendar, saved views, scoped notifications |
| Testing | **Testing work** | Tests, new test, review queue, retests |
| Master Data | **Readiness & reference data** | Products, templates, equipment, calibration, maintenance |
| Controlled Documents | **Procedures & acknowledgement** | SOP/WI register, new/revise, versions, acknowledgements |
| Operations | **Governance & insights** | Change requests, reports, audit, data quality, management |

This is a labeling change, not a permission change. `lab/navigation.ts:13-30` and `src/lib/permissions.ts` remain the authority for visibility and action eligibility.

### Breadcrumbs and page titles

The existing IA contract requires shared breadcrumbs on internal record/list pages and a task-specific back action (`docs/INFORMATION-ARCHITECTURE.md:42-54`). Detail pages such as Laboratory Management implement the pattern with `QC Tasks → Laboratory → Management` (`src/pages/lab/management.astro:58-62`).

Audit rule for every page:

```text
Breadcrumb: Home / Work area / Record family / Record
Title: [verb or object] + [scope], never an implementation name
Context: status · owner · next role · blocker
Return: back to the queue that launched this task
```

Open gap: the current evidence does not prove breadcrumb coverage for every list, create, edit, print, error, and scoped sub-route. The route manifest counts file routes but does not itself validate wayfinding semantics (`scripts/route-manifest.mjs:1-11`). This needs a route-level IA guard or a documented exception list.

### Dashboard entry points and attention model

The dashboard is already attention-oriented: filters are shared across KPI cards, charts, and tables (`src/pages/dashboard.astro:5-13`), and the Laboratory Management page exposes approval, change-request, calibration, equipment, document, retest, data-quality, audit, and system-health links (`src/pages/lab/management.astro:33-77`).

The target order for role homes should be:

1. **Needs my action** — actionable queue with owner and due/age.
2. **Blocked or at risk** — missing evidence, overdue calibration, rejected change, failed/hold test.
3. **Continue recent work** — drafts, returned records, last opened queue.
4. **Insights** — trends and reports, below actions.

Current risk: the product has strong destination links but does not yet prove that every card explains owner, next action, and resolution state. A card that opens a filtered register is only a valid entry point if the register preserves the filter, announces the scope, and provides a next action.

### Search, reports, notifications, settings, and admin

| Area | Current state | IA assessment | Required contract |
|---|---|---|---|
| Search | Global `/search` and Lab `/lab/search` | Useful separation only if scope is explicit | State searchable record types, current scope, filters, zero-result recovery, and result next actions |
| Reports | Global `/reports` and Lab `/lab/reports` | Duplicate label and potentially duplicate decision point | Title must include scope; preview must show date/filter/data scope before download |
| Notifications | Global `/notifications` and Lab `/lab/notifications` | Duplicate inbox risk | One canonical notification center plus scoped views; each item must link to action and resolution |
| Settings | `/admin/settings`, `/account/security` | Settings and personal security are correctly different jobs but discoverability is uneven | Keep account security in account; keep backups/configuration under System administration; explain permissions and operational impact |
| Admin | `/admin/users`, templates, settings, system health, audit | Admin home redirects to role home (`src/pages/admin/index.astro:1-3`) | Provide an explicit Administration landing page with People, Configuration, Operations, and Audit entry points; preserve route guards |

## 3. Target navigation contract

### Global navigation by role

| Role | Primary | Secondary/utility | Home attention priority |
|---|---|---|---|
| Employee | My Work · Search · Quality issues · Laboratory | Notifications · Account security | Returned work, due tasks, drafts, blocked submissions |
| Supervisor | Team Review · Search · Quality issues · Laboratory · Reports | Notifications · Team workload · Account security | Reviews due, returned/rework, overdue team work, findings |
| Manager | Command Center · Work queue · Search · Quality issues · Laboratory · Reports | Notifications · Team workload · Delete requests · Account security | Approvals, aged queues, quality risk, change requests |
| Admin | Command Center · Work queue · Search · Quality issues · Laboratory · Reports | Administration: People · Templates · System health · Settings · Audit | Service health, access issues, backup status, then operational risk |

### Laboratory local navigation by job

```text
Laboratory home
├── Testing work
│   ├── Test register
│   ├── Start a test
│   ├── Review queue
│   └── Retests
├── Readiness & reference data
│   ├── Products
│   ├── Test templates
│   ├── Equipment
│   ├── Calibration
│   └── Maintenance
├── Procedures & acknowledgement
│   ├── SOP / WI register
│   ├── Draft or revise document
│   └── Acknowledgements
└── Governance & insights
    ├── Change requests
    ├── Reports
    ├── Audit timeline
    ├── Data quality
    └── Management command center
```

The implementation can continue using `labNavForRole()` and the current route allowlist. The required change is the visible taxonomy and cross-link behavior, not the URL tree.

## 4. Service design: critical journeys

Legend: **Implemented** means a route/action exists in the current source; **partial** means the path exists but continuity, ownership, or evidence is not proven end-to-end; **gap** means the requested journey is not fully represented by the current documented blueprint or route contract.

### 4.1 Task creation → assignment → work → review → completion

| Stage | Employee | Supervisor/manager | System evidence | IA/service risk | Target handoff |
|---|---|---|---|---|---|
| Create | Start permitted task or draft | Manager/supervisor may create for team | `/employee/new`, `/supervisor/new`, `/manager/new`; middleware create handler in `scripts/route-manifest.mjs:46-70` | Multiple role-specific create entry points can feel like different products | One “Create work” label, role-specific form defaults, explicit owner |
| Assign | Confirm assignee and due date | Assign/reassign within authority | Role home routes and task detail | Ownership can be hidden in the form rather than summarized after save | Confirmation states “Owner / due / next role” |
| Work | Save, resume, attach evidence, comment | Monitor without taking employee work | Task detail and update endpoints | Users may not know whether save is draft or handoff | Persistent state + “Continue work” entry |
| Review | Submit once and see queue/next owner | Review, return, or approve as permitted | `tasks/[id]`, `TaskLifecycle`, review contracts | Return reason and next owner must remain visible after transition | Review result links back to the task and owner |
| Complete | See terminal outcome and history | Verify completion and evidence | close/reopen routes and audit | Completion can be mistaken for approval | Distinguish “completed work” from “approved decision” |

**Status:** partial. The route and lifecycle foundation exists, but this audit does not find a single documented trace covering assignment as a first-class user step, reviewer handoff, and terminal completion for all four roles.

### 4.2 Finding → RCA → CAPA → approval → closure

| Stage | Primary actor | Required screen answer | Current route/evidence | Target continuation |
|---|---|---|---|---|
| Find | Employee/supervisor/lab reviewer | What failed, where, and why it matters | `/findings`, `/findings/[id]` | Link from task/test result with source record context |
| RCA | Supervisor/manager | What is the root cause and what evidence supports it? | `/findings/[id]` and RCA API | Anchor RCA section in the finding, not a separate destination |
| CAPA | Assigned owner | What action, owner, due date, and evidence are required? | CAPA/evidence APIs under finding | Create or open CAPA in the same finding context |
| Approval | Authorized manager | What exactly am I approving and what remains blocked? | Finding policy/e-signature contracts | Approval action shows scope, evidence, and next role |
| Closure | Owner/verifier/manager | Why is this closed and how can I reopen safely? | Finding detail and audit | Closure summary links to RCA, CAPA, evidence, and audit |

**Status:** partial. The previous IA contract names the Finding → RCA → CAPA → Evidence flow (`docs/INFORMATION-ARCHITECTURE.md:26-38`), but the current evidence does not prove a complete approval-to-closure continuation map.

### 4.3 Lab test → submit → review → approve

| Stage | Primary actor | Touchpoint | Failure/recovery | Target next action |
|---|---|---|---|---|
| Start | Lab operator | `/lab/tests/new` | Missing product/equipment/reference data explains what to fix | “Save draft” or “Resolve reference data” |
| Enter | Lab operator | Lab test form | Section-level validation and draft preservation | Resume from last incomplete section |
| Submit | Lab operator | Submit for review | Review gate names exact missing field/evidence | Show submitted status and review queue link |
| Review | Reviewer/supervisor | `/lab/tests/review`, `/lab/tests/[id]` | Return for changes preserves original test and reason | Return to operator with owner and due context |
| Approve | Authorized reviewer/manager | Review action | Self-review and unauthorized transitions remain unavailable | Show terminal decision and related finding/retest/report |

**Status:** implemented foundation, partial service continuity. The form has explicit save/review states according to `docs/UX-RESEARCH-PROGRAM.md` and existing lab form contracts; the approval and related-record continuation still needs route-level traceability evidence.

### 4.4 Equipment → maintenance → calibration

| Stage | User job | Current route | Required IA signal |
|---|---|---|---|
| Find asset | Locate the equipment and readiness state | `/lab/equipment`, `/lab/equipment/[id]` | Searchable identity, status, next due date |
| Maintain | Record a maintenance event | `/lab/equipment/[id]/maintenance` | Maintenance history and returned-to-service outcome |
| Calibrate | Create or review calibration | `/lab/calibration`, `/lab/calibration/[id]` | Compliant/due/overdue/not compliant/unknown with explanation |
| Decide | Know whether testing can safely continue | Equipment/test context | One clear next action: maintain, calibrate, escalate, or use |

**Status:** partial. The current service blueprint records derived calibration states and append-only maintenance (`docs/SERVICE-BLUEPRINT.md:23`, `26-38`), but the audit requires stronger cross-links from the equipment detail to the next maintenance/calibration action and from a test to the equipment readiness explanation.

### 4.5 SOP/WI → revision → approval → acknowledgement

| Stage | Primary actor | Current destination | Required handoff |
|---|---|---|---|
| Find/use | Employee/lab operator | `/lab/documents`, `/lab/documents/[id]` | Current approved version and acknowledgement state |
| Revise | Author | `/lab/documents/new`, `/lab/documents/[id]/edit` | Change summary, source version, reviewer/approver |
| Review | Reviewer | Document detail/workflow | “Return for changes” returns to author without losing version context |
| Approve | Manager/admin | Document workflow | Approval scope and immutable version are explicit |
| Acknowledge | Assigned employee | `/lab/acknowledgements`, `/lab/acknowledgements/assign` | Link directly from notification to acknowledgement action |

**Status:** partial. The route family and state model exist; the previous blueprint covers draft/review/approved and version immutability (`docs/SERVICE-BLUEPRINT.md:24`, `26-38`). A full trace from revision to acknowledgement and notification resolution is not yet proven.

### 4.6 Change request → review → apply

| Stage | Primary actor | Current destination | Service contract |
|---|---|---|---|
| Propose | Contributor | `/lab/change-requests/new` | State what changes, why, affected record, and requested owner |
| Track | Contributor/reviewer | `/lab/change-requests`, `/lab/change-requests/[id]` | Show status, ageing, next role, and rejection reason |
| Review | Supervisor/manager/admin | Review API under change request | Approval/rejection is a decision with an audit event |
| Apply | Responsible operator/system owner | Related product/template/document/equipment context | Applying the change must not require re-finding the affected record |
| Resolve | Requester | Change request detail + notification | Closed request explains outcome and links to resulting record/version |

**Status:** partial. The management dashboard links to pending and rejected change-request registers (`src/pages/lab/management.astro:34-39`), but the “apply” step is not represented as a first-class continuation in the current service blueprint. This is the highest-risk dead-end candidate in the requested journeys.

### 4.7 Notification → action → resolution

| Stage | User question | Current evidence | Target behavior |
|---|---|---|---|
| Receive | Why am I seeing this? | Navbar supports unread count and recent notifications (`Navbar.tsx:17-32`) | Include event type, affected record, urgency, and owner |
| Open | Where do I act? | Notification item carries `href` (`Navbar.tsx:18-24`) | Link directly to the actionable state, not merely a list |
| Act | What can I do? | Action eligibility remains server-authoritative | Show permitted action, blocked reason, and next role |
| Resolve | Is it finished? | Read/read-all endpoints exist | Mark read is not resolution; item remains linked to outcome/status |

**Status:** partial. The product has notification delivery and read state, but read state is not the same as workflow resolution. The canonical notification center must show “open / action required / resolved” semantics and avoid duplicate global/Lab inboxes.

## 5. Cross-workflow service blueprint

| Lane | Shared target behavior |
|---|---|
| Physical evidence | Page title, breadcrumb, status, owner, next role, blocker, related record links, confirmation, notification |
| User action | Start, save, resume, submit, review, return, approve, acknowledge, apply, close |
| Frontstage | Show the next permitted action; preserve filter/context after a handoff; explain unavailable actions |
| Backstage | Resolve server scope/RBAC, validate lifecycle, persist audit event, create notification, derive related states |
| Support processes | SQLite schema/migrations, permission authority, route middleware, audit chain, report/export services, backup/health services |

### Service failure points to remove

| Failure point | User impact | Design remedy | Verification needed |
|---|---|---|---|
| A record changes owner but the UI stays on a generic detail page | User does not know what happens next | Add next-role/owner handoff panel and direct continuation link | Role UAT across submit/return/approve |
| A notification marks read before the work is resolved | Users lose attention signal | Separate read state from resolution state | Notification E2E + human comprehension test |
| A filtered KPI opens a register without an obvious scope | User distrusts counts or repeats filtering | Preserve query, title the scope, and show active filters | Route/link contract and browser test |
| Change is approved but application requires a new search | Context switching and duplicate entry | Link approval result to affected record/version and apply action | End-to-end change request scenario |
| A related record is absent or unauthorized | Dead link or unexplained blank state | Omit links when relation is absent; explain restricted context when applicable | Authorized/unauthorized fixture matrix |

## 6. Route and navigation traceability

### Entry-point coverage matrix

| Destination family | Global entry | Local entry | Detail continuation expected | Current assessment |
|---|---|---|---|---|
| Tasks | Role home, Tasks | — | Finding, comment, evidence, review/close | Entry exists; complete continuation needs audit |
| Findings | Global Findings | Lab/test related link | RCA, CAPA, evidence, audit | Entry exists; approval/closure trace partial |
| Tests | Laboratory | Lab Testing work | Product, equipment, finding, retest, report | Entry exists; related-link completeness partial |
| Equipment | Laboratory | Lab Readiness & reference data | Maintenance, calibration, tests | Entry exists; readiness continuation partial |
| Documents | Laboratory | Procedures & acknowledgement | Version, change request, acknowledgement | Entry exists; acknowledgement resolution partial |
| Change requests | Laboratory/management cards | Governance & insights | Affected record/version and notification | Review exists; apply continuation gap |
| Reports | Global Reports | Lab Reports | Source register and applied scope | Duplicate scope labels need resolution |
| Notifications | Header utility | Lab scoped view | Action target and resolved record | Duplicate inbox semantics need resolution |
| Admin | More | Admin landing target | Users/templates/settings/health/audit | `/admin` currently redirects; landing page discoverability gap |

### Orphan/dead-end rule

The target is **zero orphan destinations** and **zero dead-end journeys**, but this review does not claim that target is already achieved. The current route manifest proves file-route existence and separates middleware routes (`scripts/route-manifest.mjs:1-70`); it does not prove that every route has a parent link, breadcrumb, role-home entry, or next action.

To make the target testable, every visual route should have these fields in a route IA registry:

```text
route
page title
mental-model area
allowed roles
parent entry point
breadcrumb parent
primary job
primary action
back/return destination
next-state destination(s)
empty/error recovery
related record links
owner of the next step
```

Exceptions: login, logout, 404/500, print views, API routes, and intentional terminal states. Exceptions must be explicit, not inferred from missing links.

## 7. Prioritized remediation backlog

| Priority | Change | Impact | Size | Acceptance signal |
|---|---|---|---|---|
| P0 | Add route IA registry and automated parent/breadcrumb/back/next-action coverage | Makes orphan and dead-end claims measurable | M | Every non-exempt visual route has a trace row; zero unexplained failures |
| P0 | Make notification resolution distinct from read/unread and converge global/Lab inbox semantics | Prevents missed operational work | M | Notification journey resolves to action and terminal state for each role |
| P1 | Rename/clarify Dashboard, Tasks, Search, Reports, Notifications by scope and job | Reduces choice ambiguity without URL migration | S | Tree test users choose the right destination first click |
| P1 | Add cross-links for test↔equipment↔calibration↔finding↔retest↔report | Removes context switching | M | Each seeded relation is traversable forward and back under authorized roles |
| P1 | Complete change-request “apply” continuation | Removes the clearest dead-end risk | M | Approved request opens affected record/version and records applied outcome |
| P1 | Add Administration landing page | Makes admin jobs discoverable | S | Admin can reach people, templates, settings, health, and audit from one home |
| P2 | Replace system labels “Master Data” and mixed Operations grouping | Matches user vocabulary | S | Labels pass card sort/tree test with no role-specific explanation |

## 8. Validation plan and limits

The current project research program is ready but has no participant findings (`docs/UX-RESEARCH-PROGRAM.md` status and participant plan). Validate the target IA separately by role:

| Test | Employee | Supervisor | Manager | Admin |
|---|---:|---:|---:|---:|
| Tree test: locate primary job | ✓ | ✓ | ✓ | ✓ |
| First click: identify next action | ✓ | ✓ | ✓ | ✓ |
| Journey test: create/hand off | ✓ | ✓ | ✓ | — |
| Journey test: review/approve | — | ✓ | ✓ | — |
| Journey test: lab readiness/docs/change | ✓ | ✓ | ✓ | — |
| Journey test: settings/health/access | — | — | — | ✓ |
| VoiceOver/keyboard/200% zoom | ✓ | ✓ | ✓ | ✓ |

Do not convert automated PASS into UX success. Existing automated evidence is useful for implementation regressions, while the open validation questions are findability, comprehension, ownership, and recovery.

## Final assessment

- **IA foundation:** strong but taxonomy has duplicate scopes and mixed jobs.
- **Wayfinding:** key detail-page breadcrumbs and back affordances exist; complete route coverage is unproven.
- **Service continuity:** task/test/finding/document/equipment foundations exist; change-request apply and notification resolution need explicit continuation.
- **Traceability:** route existence is covered, route-to-mental-model and route-to-next-action are not yet fully registered.
- **100% readiness:** **partial / conditional** until the route IA registry, seven journey validation, and role-based human testing are complete.


---

<a id="قسم-11"></a>

<!-- SOURCE FILE: 8-INTERACTION-MOTION-100-EVIDENCE.md -->
# QC-100-INTERACTION-MOTION-009 — Interaction & Motion Evidence

**Scope:** `apps/qc-task-manager` · **Date:** 2026-09-02

## Decision

The QC interface uses motion as operational feedback: it confirms causality,
shows hierarchy, communicates completion, and makes state changes perceivable.
It does not use page parallax, hover lifts, scale-on-hover, animated KPI values,
or motion behind dense data. Routine motion is capped at 240ms.

## Motion token contract

| Token | Value | Use |
|---|---:|---|
| `duration-instant` | `0ms` | Immediate state changes and toggles |
| `duration-fast` | `120ms` | Button feedback, hover/focus color, chart point emphasis |
| `duration-standard` | `180ms` | Routine transitions and filter feedback |
| `duration-moderate` | `240ms` | Toast/dialog/panel entry where motion clarifies hierarchy |
| `ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | State changes |
| `ease-decelerate` | `cubic-bezier(0, 0, 0.2, 1)` | Entry/reveal |
| `ease-accelerate` | `cubic-bezier(0.3, 0, 1, 0.3)` | Exit/removal |
| `ease-linear` | `linear` | Indeterminate loading only |

Tokens are defined in `src/styles/global.css` and exported to Tailwind as
`duration-qc-*` / `ease-qc-*`. Existing `--motion-*` names remain compatibility
aliases so migrations do not create a second vocabulary.

## Interaction-state coverage

Every high-impact interactive surface has an explicit perceivable result. The
visual signal is paired with text and/or an assistive-technology announcement;
color is never the only signal.

| Surface | default / hover / focus / active | selected / loading / success | error / disabled / destructive / pending |
|---|---|---|---|
| Buttons and links | shared `AppButton` contract, native focus, pressed feedback | loading label swap and `aria-busy` where async | native `disabled`, disabled styling, destructive variant |
| Forms and task updates | field focus and inline validation | saving/submitted status is announced | persistent error + recovery action; pending submit is locked |
| Comments and attachments | control feedback and focus | success message, upload progress/result | error message, retry path, busy state |
| AI review | run action feedback | analyzing → result/advisory state | session/permission/provider errors remain actionable |
| Notifications | read/unread and action feedback | mark-read success | failed action is announced and retryable |
| Delete/review flows | trigger focus and modal focus return | pending request state | destructive confirmation, rejection reason, submit loading |
| Dialogs | native dialog semantics and focus entry | confirm action result | Escape/cancel recovery; destructive action is explicit |
| Charts and progress | focusable/clickable point emphasis | selected point and live summary | no motion-only interpretation; progress has text/value |
| Skeleton/loading | `aria-busy` and accessible label | replaced by content | failures use persistent operational state |

Evidence owners: `ActionFeedback.tsx`, `AppButton.astro`, `Skeleton.astro`,
`CommentBox.tsx`, `AttachmentUploader.tsx`, `AiReviewPanel.tsx`,
`MarkReadButton.tsx`, `MarkAllReadButton.tsx`, `DeleteRequestDialog.tsx`,
`ReviewDeleteRequestDialog.tsx`, `TaskUpdatePanel.tsx`, `LabTestForm.tsx`,
`TaskLifecycle.tsx`, `EsignDialog.astro`, and `OperationalState.astro`.

## Motion application map

- Navigation and filter controls use short color/border feedback; no layout
  shift is introduced.
- Toast entry uses `qc-motion-enter` (240ms decelerated entry); its message is
  also rendered in the shared status/alert contract.
- Expand/collapse and dialogs retain native disclosure/dialog behavior and
  focus management; motion is supplementary, never required to reveal content.
- Loading uses determinate progress where a value exists and a labeled
  indeterminate skeleton/spinner otherwise.
- Chart interaction uses opacity emphasis with the shared 120ms token; it does
  not animate geometry or large areas of the screen.
- No transition uses `transition-all`, un-tokenized `duration-150`, hover
  translate, or hover scale in application source.

## Reduced motion and motion safety

`src/styles/global.css` owns the system-level policy:

- `prefers-reduced-motion: reduce` collapses fast, standard, and moderate
  durations to `1ms`, disables smooth scrolling, and limits animation to one
  iteration.
- Essential content is server-rendered or available in the static DOM; no
  workflow result depends on animation completing.
- Decorative/large-area motion is excluded from this operational UI. Loading
  retains a single perceivable state change rather than an endless decorative
  loop.
- No flashing/strobing, parallax, scroll-jacking, or full-viewport zoom was
  found in the application source contract.

## Automated evidence

`scripts/test-interaction-motion-100.mjs` checks the eight motion tokens,
reduced-motion overrides, forbidden motion patterns, shared feedback/loading
primitives, async-state markers across high-impact components, and dialog
semantics. Run it with:

```bash
pnpm test:interaction-motion-100
```

## Verification boundary

This is source and contract evidence, not a replacement for human testing.
Final acceptance still needs browser checks at 360px and 1440px, keyboard
traversal, VoiceOver/NVDA, reduced-motion emulation, and low-powered-device
feel/performance checks. No production deployment, commit, or push was done.

## Result

**Local implementation status:** ready for automated verification.

**Target coverage:** 100% of inventoried high-impact interactive surfaces have
an explicit feedback owner and reduced-motion policy.

**Remaining external evidence:** human assistive-technology and device testing.

---

<a id="قسم-12"></a>

<!-- SOURCE FILE: 9-PILOT-UX-RESEARCH.md -->
# QC Task Manager — 9-Pilot UX Research Plan

**Status:** Ready to run; no participant results are claimed.
**Audience:** QC employees, reviewers, supervisors, managers, laboratory operators, and administrators.

## Research goals

1. Check whether each role can find the right workspace and understand the next action.
2. Check whether headings, labels, buttons, helper text, warnings, and errors explain the outcome in plain professional English.
3. Check whether users understand save, submit, review, approve, reject, return, archive, and permanent deletion consequences.
4. Identify recovery gaps: what happened, whether data was saved, whether retrying is safe, and what to do next.
5. Measure completion, time, assistance, errors, and confusion by role without combining unlike tasks.

## Role-based participant plan

| Role | Target participants | Relevant experience | Do not substitute |
| --- | ---: | --- | --- |
| Employee / task owner | 3–5 | Creates and updates assigned work | Demo-only observer |
| Supervisor | 3–5 | Assigns, reviews, and follows up tasks | Employee participant |
| Manager | 3–5 | Reviews deletion requests, workload, and approvals | Administrator |
| Laboratory operator / reviewer | 3–5 | Creates tests, records results, reviews evidence | General office user |
| Administrator | 2–3 | Manages users, templates, and system controls | Manager |

Recruit participants who use the corresponding QC workflow in their normal work. Use non-production data, record consent, and keep role permissions unchanged. The targets are a plan, not completed research.

## Scenarios

Run only the scenarios relevant to the participant's role:

1. Find a task that needs your attention and explain its status.
2. Create a task, save it, leave it, and resume it without losing information.
3. Update progress, add a checklist item, and explain what remains before completion.
4. Complete a task with evidence and a completion comment; identify the irreversible consequence.
5. Review a finding or laboratory test and choose approve, reject, or return for changes.
6. Search for a record, clear filters, and save a useful filter set.
7. Recover from a failed save or expired session; state whether retrying is safe.
8. Review a deletion request and distinguish keeping a task from deleting it permanently.
9. For laboratory roles: create a test draft, submit it for review, and respond to missing evidence.

## Moderated session script

- Explain: “We are testing the product wording and workflow, not your performance. Please think aloud.”
- Do not teach the intended answer. Ask “What would you do next?” before giving help.
- Capture the first interpretation, action, recovery attempt, and final outcome.
- Stop a scenario after success, three minutes without progress, or a safety concern.
- Ask the participant to read any error aloud and explain whether data was saved.

## Observation sheet

| Field | Record |
| --- | --- |
| Participant ID / role |  |
| Date / environment / device |  |
| Scenario ID |  |
| Start / end / time-on-task |  |
| Success: yes / partial / no |  |
| Assistance count and exact prompt |  |
| Error count and error text |  |
| Confusion point and first interpretation |  |
| Data-saving belief: saved / not saved / unsure |  |
| Retry-safety belief: safe / unsafe / unsure |  |
| Recovery completed: yes / no |  |
| Quote or observed behaviour |  |

## Task success criteria

A task is successful only when the participant completes the intended workflow, selects the correct action, preserves or verifies the expected data state, and explains the next state in their own words. Partial success means the workflow completes after assistance or a recoverable error. Do not count automated tests as participant success.

## Measures

- **Time-on-task:** elapsed seconds from the scenario start to the success decision; record pauses separately.
- **Assistance count:** number of moderator prompts beyond the scripted introduction.
- **Error count:** wrong action, invalid submission, avoidable recovery attempt, or misunderstanding of saved state.
- **Confusion points:** observed hesitation, backtracking, contradictory explanation, or request for clarification.
- **Recovery rate:** successful recovery without losing data or needing moderator intervention.

## SUS-style questionnaire

Use the standard 10-item System Usability Scale after the session. Score each statement from 1 (strongly disagree) to 5 (strongly agree), randomising positive and negative wording only if the facilitator can preserve the standard scoring.

1. I would like to use this system frequently.
2. I found the system unnecessarily complex.
3. I thought the system was easy to use.
4. I would need support to use this system.
5. I found the functions well integrated.
6. I thought there was too much inconsistency.
7. I would imagine most people would learn quickly.
8. I found the system cumbersome to use.
9. I felt confident using the system.
10. I needed to learn a lot before I could use the system.

Report SUS only after completed sessions. A planned questionnaire is not a SUS result.

## Qualitative questions

- Which words or labels were unclear, and what would you call them?
- What did you expect to happen after that action?
- What told you whether your work was saved?
- What would make you trust or distrust the warning?
- What would you do if this error appeared during a real inspection?
- Which information did you need but could not find?
- Which action felt risky, and why?
- What should the system say after success or failure?

## Analysis and reporting

Report results by role and scenario. Include numerator/denominator, median time, range, assistance, errors, recovery, notable confusion points, and representative quotes with participant IDs. Do not infer preferences from source inspection or automated checks. Mark every unrun session as **Not measured**.

---

<a id="قسم-13"></a>

<!-- SOURCE FILE: UX-WRITING-RESEARCH-EVIDENCE.md -->
# UX Writing Research Evidence

## Scope

This file records evidence for the QC Task Manager UX-writing audit `QC-100-CONTENT-UX-010`. It is intentionally conservative: source review and automated checks are not human research.

## Evidence inventory

| Evidence | Status | What it supports | What it cannot support |
| --- | --- | --- | --- |
| Source inventory of `src/pages`, `src/components`, and `src/lib` | Complete for this audit | Copy locations, terminology, repeated patterns, and visible-state coverage | Whether QC staff understand the wording |
| Existing `docs/UX-WRITING.md` contract | Existing and updated | Preferred vocabulary, tone, AI boundary, and recovery pattern | Participant preference or task success |
| Automated content-quality guard | Added for this task | Required copy contracts and banned vague labels in audited surfaces | Real-world usability or accessibility with assistive technology |
| Existing automated UI, interaction, and E2E suites | Existing project evidence | Render/wiring regressions where their assertions apply | Human comprehension, time-on-task, assistance, or SUS |
| Participant sessions from `9-PILOT-UX-RESEARCH.md` | **Not run** | — | All human UX claims remain open |

## Audit decisions

- User-facing copy uses plain professional English and action-specific verbs.
- Error messages state what happened, whether data was saved, what to do next, and whether retrying is safe when the state is known.
- Technical implementation terms remain in source comments and diagnostics, not user-facing copy.
- Destructive actions name the object and consequence: `Delete task permanently`.
- Empty states orient the user and provide a relevant next action when one exists.
- `AI` surfaces remain advisory and explicitly require human review.

## Human research status

No participants, sessions, SUS scores, time-on-task results, assistance counts, error rates, or qualitative findings are claimed by this audit. The next valid evidence is a completed, role-separated pilot using the plan in `9-PILOT-UX-RESEARCH.md`.

## Automated quality claim

The content-quality guard is **100% pass for its declared rules** when it exits successfully. This means the checked contracts are present and no declared banned labels remain. It does not mean human UX quality is 100% or that the product has passed UAT.

---

<a id="قسم-14"></a>

<!-- SOURCE FILE: A11Y-ERGONOMICS-100-EVIDENCE.md -->
# A11Y-ERGONOMICS-100 Evidence

**Task:** QC-100-A11Y-011  
**Scope:** QC Task Manager routes and shared components  
**Standard:** WCAG 2.2 AA minimum  
**Status:** Automated contract target met locally; full accessibility score is **not claimed** until the manual VoiceOver/NVDA sheets below are completed.

## Evidence boundary

This document separates repeatable source/browser automation from expert assistive-technology validation. Automated checks can prove structure and interaction contracts; they cannot prove that a screen-reader user understands every route, announcement, focus transition, or chart alternative.

## Automated acceptance matrix

| Area | Automated evidence | Result |
|---|---|---|
| Route/component inventory | `test:a11y-ergonomics-100` inventories all `src/pages` and `src/components` Astro/React sources | PASS |
| Bypass blocks and landmarks | `BaseLayout.astro` has first-focusable `Skip to content` → `#main`; target is a focusable `<main>` | PASS |
| Dialog semantics | All dialog sources require `aria-labelledby` and `aria-describedby`; React dialogs require Escape/cancel handling | PASS |
| Keyboard focus visibility | Global `:focus-visible` safety net plus shared focus tokens | PASS |
| Reduced motion | Global `prefers-reduced-motion: reduce` disables animation/transition duration and smooth scrolling | PASS |
| Zoom-safe overlays | Dialog surfaces are bounded and scrollable with `max-block-size: calc(100dvh - 2rem)` | PASS |
| Status announcements | Feedback/status component sources require `aria-live` or `role="alert"` | PASS |
| Chart alternatives | Chart component sources require accessible naming or a text alternative | PASS |
| Responsive contract | Existing `test:responsive-e2e-contract` and `e2e-responsive` cover 360/390/768/1024/1440; this task adds 320–1920 and zoom execution instructions below | PASS for contract / execution pending |
| Axe and keyboard journeys | Existing `e2e-a11y.mjs` covers skip link, notification disclosure, dialogs, mobile nav, heading/name/ARIA checks and axe | PASS for existing 12-page gate |

Run locally:

```bash
pnpm --dir apps/qc-task-manager test:a11y-ergonomics-100
pnpm --dir apps/qc-task-manager test:manifest
pnpm --dir apps/qc-task-manager typecheck
pnpm --dir apps/qc-task-manager build
```

## Browser test matrix

Record date, browser/version, viewport, zoom, reduced-motion setting, route, result, and defect ID for every run. Use representative journeys on every role and repeat the full route inventory for release candidates.

| Viewport widths | Zoom | Required checks |
|---|---:|---|
| 320, 360, 390, 768, 1024, 1280, 1440, 1920 | 100% | no horizontal overflow, no clipped text, landmarks, headings, names, keyboard journey |
| 1280 CSS px | 150%, 200% | reflow, readable text, fixed/sticky UI, dialogs, tables/alternate scroll |
| 320 CSS px equivalent | 400% where practical | core task flows remain operable; document exceptions for wide data tables |
| 360×800 and 1440×1000 | 100% + reduced motion | focus order, no unexpected motion, stable layout |

Tables, charts, and other legitimately wide data surfaces may scroll inside their own region, but must not create page-level horizontal scroll or lose information.

## Keyboard journey sheet

For each role (`employee`, `supervisor`, `manager`, `admin`) record PASS/FAIL for:

1. Login → first Tab reaches skip link → Enter moves to main → navigation remains reachable.
2. Open/close mobile navigation with Enter/Space; Escape closes and restores the toggle.
3. Open notifications; Tab enters the region; Escape closes and returns to the bell.
4. Create/edit a task or laboratory record; labels, descriptions, errors and submit state are announced/associated.
5. Open each destructive dialog; focus enters, Tab/Shift+Tab stays inside, Escape closes, focus returns to trigger.
6. Navigate tables and paginated results without pointer-only controls.
7. Trigger success, validation error, server error and loading state; status is announced and focus remains logical.
8. Use chart data or its text alternative without relying on color, hover or pointer movement.

## VoiceOver manual test sheet — macOS + Safari

**Tester / date / build:** ____________________  
**Browser / macOS:** ____________________  
**Routes sampled:** ____________________

| Check | Result | Notes / defect ID |
|---|---|---|
| VO rotor shows one meaningful main landmark and expected navigation landmarks | ☐ PASS ☐ FAIL | |
| Headings rotor has one page heading and sensible hierarchy | ☐ PASS ☐ FAIL | |
| Skip link is announced and moves VO focus to main | ☐ PASS ☐ FAIL | |
| Navigation, menu, notification trigger and account controls have names/states | ☐ PASS ☐ FAIL | |
| Form labels, required state, help text and errors are announced with fields | ☐ PASS ☐ FAIL | |
| Dialog title/description are announced; focus enters and Escape returns to trigger | ☐ PASS ☐ FAIL | |
| Dynamic success/error/loading notifications are announced once, without noise | ☐ PASS ☐ FAIL | |
| Tables expose headers and row context; charts expose equivalent text data | ☐ PASS ☐ FAIL | |
| 200% zoom/reflow keeps content and controls usable | ☐ PASS ☐ FAIL | |

**AT evidence:** attach recording/log or tester sign-off here: ____________________

## NVDA manual test sheet — Windows + Chrome/Firefox

**Tester / date / build:** ____________________  
**Browser / Windows / NVDA:** ____________________  
**Routes sampled:** ____________________

| Check | Result | Notes / defect ID |
|---|---|---|
| Browse mode and focus mode switch correctly for forms and custom controls | ☐ PASS ☐ FAIL | |
| Landmarks and headings navigation provide a usable page outline | ☐ PASS ☐ FAIL | |
| Skip link is announced and moves focus to main | ☐ PASS ☐ FAIL | |
| Menus/disclosures announce expanded/collapsed state and destinations | ☐ PASS ☐ FAIL | |
| Form errors identify the field and explain recovery | ☐ PASS ☐ FAIL | |
| Dialog focus is contained, Escape works, and focus returns to the opener | ☐ PASS ☐ FAIL | |
| Live regions announce status/error updates without stealing focus unexpectedly | ☐ PASS ☐ FAIL | |
| Tables expose headers and charts provide a non-visual alternative | ☐ PASS ☐ FAIL | |
| 200% zoom/reflow and 400% practical check preserve task completion | ☐ PASS ☐ FAIL | |

**AT evidence:** attach recording/log or tester sign-off here: ____________________

## Ergonomics review

The implementation preserves keyboard-first workflows, persistent navigation context, grouped mobile navigation, 44px-class touch targets, logical form grouping, and scroll-contained wide data. During manual sessions also record:

- clicks, Tab presses, pointer travel, repeated-entry opportunities, and unnecessary context switches;
- whether default values are safe and whether the user can recover without restarting;
- fatigue points after a 30–60 minute repeated-task scenario;
- any control that requires precision, hover, color recognition, or horizontal page scrolling.

## Claim status

- **Automated A11y target:** 100% of the defined source/contract checks — `test:a11y-ergonomics-100` PASS (76 page sources, 59 component sources).
- **Full WCAG 2.2 AA score:** not claimed. Requires completed VoiceOver and NVDA sheets plus recorded manual keyboard/zoom checks.
- **Manual screen-reader validation:** not performed by this task; blank sheets are intentional and must not be treated as evidence.
- **Production/staging validation:** not claimed; current evidence is local only.

---

<a id="قسم-15"></a>

<!-- SOURCE FILE: 11-DASHBOARD-DATA-VIZ-100-EVIDENCE.md -->
# QC-100 Dashboard Data Visualization Evidence

**Task:** QC-100-DATA-VIZ-012  
**Role:** Principal Analytics Product Designer  
**Scope:** Every QC dashboard, KPI, chart, report surface, drilldown, and analytical table in `apps/qc-task-manager`.  
**Review date:** 2026-09-02  
**Status:** **PARTIAL — audit complete; remediation backlog remains.**

## Decision standard

The product should help a QC user decide what to do next. A metric is retained only when it has a named question, owner, action, comparison/context, period, and an explicit good/bad interpretation. Counts without an operational decision are supporting context, not top-level KPIs.

This is a source and contract audit. It does not claim live production data quality, human UAT, VoiceOver/NVDA success, or that every visualization is already accessible at 100%.

## Inventory audited

| Surface | Evidence location | What was audited |
|---|---|---|
| Management dashboard | `src/pages/dashboard.astro`, `src/lib/dashboard.ts`, `src/components/DashboardCharts.tsx` | Filters, 20 dashboard KPI definitions, 6 chart widgets, action cards, 5 analytical tables, loading/error/empty/zero states |
| Laboratory command center | `src/pages/lab/index.astro`, `src/lib/lab/overview.ts` | Role-prioritized alerts, 13 base KPIs plus role-gated master-data KPIs, recent/pending/alert tables |
| Laboratory analytics | `src/pages/lab/reports.astro`, `src/components/lab/LabFailRateChart.tsx` | FAIL-rate trend, current/previous comparison, product breakdown, report filters and downloads |
| Laboratory dashboard charts | `src/components/LabDashboardCharts.tsx`, `src/lib/lab/dashboard.ts` | 6 widgets: tests trend, type, result, equipment, calibration, document status |
| Employee / supervisor / manager dashboards | `src/pages/employee/index.astro`, `src/pages/supervisor/index.astro`, `src/pages/manager/index.astro`, `src/pages/manager/workload.astro` | Attention queues, workload table, completion/overdue/risk fields, role-specific scope |
| Task reports | `src/pages/reports.astro`, `src/lib/reporting/catalog.ts`, `src/lib/reporting/queries.ts` | 8 report types, period/scope/advanced filters, preview, CSV/XLSX/PDF, audit trail |
| Laboratory reports | `src/pages/lab/reports.astro`, `src/lib/reporting/catalog.ts` | 16 report types, filters, preview, exports, audit trail |
| KPI drilldown | `src/pages/dashboard/drilldown.astro`, `src/lib/reporting/drilldown.ts` | KPI-to-register links, authorized task table, empty state, scope preservation |

## Executive verdict

| Goal | Finding | Verdict |
|---|---|---|
| Support decisions | Overdue, blockers, missing evidence, urgent work, CAPA, calibration, review queues and FAIL trends are present and drillable. | **Pass with prioritization work** |
| KPI hierarchy | The main dashboard exposes a large mixed grid: status counts, duplicates, rates, SLA states, lab inventory counts and data-quality counts. | **Major issue** |
| Metric integrity | Definitions are mostly explicit in `dashboard.ts`, `lab/dashboard.ts`, and `reporting/queries.ts`; period semantics differ between dashboard, lab and reports. | **Minor/major issue** |
| Trend context | Completion and FAIL rate have previous-period comparison; most counts and charts do not have target, baseline, delta, or alert threshold. | **Major issue** |
| Drilldowns | Dashboard KPI links and lab KPI links are broadly mapped to existing registers; the drilldown table is capped at 500 with no pagination. | **Minor issue** |
| Accessibility | Charts expose names, titles, legends, and some live summaries; several charts lack a true accessible table and employee status detail is summarized only at total level. | **Major issue** |
| Misleading visuals | Bar scales are zero-based or full 0–100% for FAIL rate; no 3D/rainbow charts found. The main risk is missing denominator/period/target context, not geometry. | **Pass on scale; fail on context** |
| Vanity metrics | Total tasks, AIR/VACUUM mix, recent activity, contributor changes today, and some inventory totals are useful context but not decision KPIs by themselves. | **Demote/remove from KPI tier** |

## KPI contract review

“Good/bad” below is the decision interpretation that should be shown in the UI. Where the source has no target or policy threshold, the review marks it as **not defined** instead of inventing one.

### Main `/dashboard` task KPIs

| KPI | Question / user | Trigger | Context + period | Good / bad |
|---|---|---|---|---|
| Total Tasks | How much work is in the selected scope? Manager/supervisor. | Use to size the queue; do not act on this alone. | Same filters; selected created-at range or All time. | Context only; no intrinsic good/bad. |
| Not Started | Which assigned work has not begun? Supervisor/manager. | Assign, clarify priority, or escalate. | Count of tasks with `not_started`; same scope/period. | Lower is generally better, but target depends on intake. |
| In Progress | How much work is actively being processed? Supervisor. | Rebalance workload and check aging. | Status count; same scope/period. | No fixed good/bad without age or SLA context. |
| On Hold / Blocked | Which work cannot move? Supervisor/manager. | Remove blocker, reassign dependency, or escalate. | Status count plus blocker note table; same scope/period. | Lower is better; any critical blocker needs action. |
| Completed | How much work finished? Manager. | Validate throughput against demand. | Status count; created-at filter, not necessarily completion period. | Higher is not automatically good without incoming volume and quality. |
| Overdue | Which open work missed its due date? Supervisor/manager. | Open overdue queue, assign owner, recover SLA. | `due_date < today`, excluding completed/cancelled; current date. | Zero is good; any overdue item is actionable. |
| Urgent Open | Which urgent work remains open? Supervisor/manager. | Immediate triage and ownership confirmation. | Urgent + not completed/cancelled; current scope/period. | Zero is good; any item needs review. |
| Completed Without Evidence | Which completed tasks lack proof-of-work? Supervisor/QA reviewer. | Request evidence or reopen review before acceptance. | Completed tasks with no `is_evidence=1` attachment; same scope/period. | Zero is good; non-zero is a compliance gap. |
| Average Completion Time | How long does completed work take after start? Manager. | Investigate cycle-time outliers and capacity. | `completed_at - started_at`; completed records with both timestamps; same scope. | Lower is not always better; compare to task class/SLA and show sample size. |
| SLA Compliance | Did completed SLA-tracked work finish within SLA? Manager/QA. | Investigate breaches and change capacity/process. | Completed + SLA-started tasks, `sla_percent_used <= 100`; same scope/period. | Higher is better; target is not defined in the UI. |
| SLA At Risk | Which tasks are nearing the SLA warning boundary? Supervisor. | Intervene before breach. | `sla_status=AT_RISK`; current live snapshot. | Zero is good; non-zero is a pre-breach queue. |
| SLA Critical | Which tasks crossed the critical warning boundary? Supervisor/manager. | Escalate and assign recovery action. | `sla_status=CRITICAL`; current live snapshot. | Zero is good; non-zero is urgent. |
| SLA Breached | Which tasks exceeded SLA? Manager/QA. | Root-cause breach and CAPA where repeated. | `sla_status=BREACHED`; current live snapshot. | Zero is good; non-zero requires documented action. |
| Average SLA Consumption | How much SLA budget is being consumed on average? Manager. | Detect systemic capacity pressure. | Average `sla_percent_used` on SLA-started tasks; current snapshot. | <100% is necessary but not sufficient; no target/denominator shown. |
| Completion Rate | What share of tasks completed, and is it moving? Manager. | Compare against previous equal-length period and adjust capacity. | Current vs previous period; filters except status/overdue are retained. | Up is generally good, but only with quality and demand context. |
| Critical Findings | Which tasks have an open critical finding? QA manager. | Open investigation/CAPA and escalate risk. | Open finding where severity or classification is critical; same scope/period. | Zero is good; any item is high priority. |
| Open CAPA | Which tasks have unresolved corrective/preventive action? QA manager. | Review owner, due date and effectiveness. | CAPA status not `CLOSED`; same scope/period. | Zero is not always realistic; overdue/open age is required. |
| Evidence Compliance | What share of completed tasks have evidence? QA reviewer. | Close evidence gaps and prevent unsupported completion. | Completed tasks with evidence / completed tasks; same scope/period. | Higher is better; denominator must remain visible. |
| QC Checklist Progress | How much checklist work is complete? Supervisor/employee. | Finish remaining checklist items before submission. | Completed checklist items / all checklist items in current filter scope. | 100% is good for ready-to-close work; zero with no checklist rows is ambiguous. |

### Laboratory KPIs and operational metrics

| KPI group | Question / user | Trigger | Context + period | Good / bad |
|---|---|---|---|---|
| Tests Today / This Week | How much testing entered the lab recently? Lab supervisor. | Compare demand and staffing to capacity. | Created-at calendar day/week; no prior-period comparison. | Context only; volume is not quality. |
| Draft Tests | Which test records are unfinished? Lab operator/supervisor. | Complete or delete/void according to policy; investigate aging. | Current records; age is missing from card. | Lower aged backlog is better; count alone lacks age. |
| Awaiting Review | What is waiting for reviewer attention? Reviewer/supervisor. | Work the review queue by age/risk. | `UNDER_REVIEW`; current records. | Lower queue/shorter age is better; age/SLA missing. |
| Approved Tests | How many tests reached approval? Lab manager. | Confirm throughput and release decisions. | `APPROVED`; current records. | Context only unless compared with submitted volume and time. |
| PASS / FAIL / HOLD | What are the final test outcomes? Lab reviewer/manager. | Investigate FAIL, disposition HOLD, confirm PASS release. | Non-VOID tests with final result; current records. | PASS is not sufficient without denominator; FAIL/HOLD trigger review. |
| Equipment Requiring Attention | Which equipment may threaten valid testing? Lab operator. | Stop use, maintain, calibrate, or document disposition. | Derived equipment/calibration state; current snapshot. | Zero is good; non-zero actionable. |
| Calibration Due | Which equipment is due/overdue for calibration? Lab manager. | Schedule calibration and prevent use if policy requires. | Latest due date; attention includes due soon/today/overdue. | Zero overdue is good; due-soon needs planned action. |
| Documents Due for Review | Which controlled documents need review? Document owner/reviewer. | Review/approve before due date. | Active docs where due date is today/past; current snapshot. | Zero overdue is good; due-soon window should be explicit. |
| Retests Open | Which retests remain unresolved? Lab reviewer/manager. | Complete disposition and link root cause. | Retest status `OPEN`; current records. | Lower aged open retests is better; age and repeat-failure link missing. |
| Data Quality Issues | What records cannot be trusted for decisions? Data steward/admin. | Correct source data or assign remediation. | Open detector findings; current snapshot. | Zero open issues is good; severity/impact should be visible. |
| Pending Master Data Changes | What governed changes await approval? Lab manager/admin. | Review and approve/reject. | Pending change requests; current snapshot. | Zero aged requests is good; age missing. |
| Contributor Changes Today | What master-data activity happened today? Admin/manager. | Audit unusual volume; no routine action. | Today only. | Activity context, not a KPI; demote from primary KPI tier. |
| Rejected Changes | What proposed changes were rejected? Admin/manager. | Review rejection reasons and recurring causes. | Rejected change requests; current snapshot. | Not intrinsically good/bad; pair with reason and repeat rate. |
| Changes Waiting >24h | Which governed changes are aging? Admin/manager. | Escalate reviewer and clear queue. | Pending requests older than 24 hours. | Zero is good; non-zero actionable. |

## Visualization audit

| Visualization | Current encoding | Decision value | Issues / required improvement |
|---|---|---|---|
| Tasks by status donut | Part-to-whole donut with legend and counts. | Shows queue composition. | Keep only as secondary context; status counts already appear as KPI cards. Add accessible table and period/total label. |
| Completion rate card | Percent, previous percent, delta in percentage points, current/previous dates. | Strong decision metric. | Keep prominent; show numerator/denominator and target. Never communicate direction by arrow/color alone. |
| Tasks by priority bars | Horizontal bars with count and share. | Helps triage urgent/high work. | Good simple encoding; add explicit filter/drilldown per priority and selected period in the card. |
| Completed per week line | 8-week line with point titles and total summary. | Shows throughput trend. | Add y-axis unit “tasks completed”, previous-period comparison and accessible table. Current filter is not clearly restated in chart title. |
| Tasks per employee stacked bars | Stacked status bars, zero-based y scale, legend, horizontal scroll. | Workload/status imbalance. | Labels truncate names; chart accessible label exposes totals but not every status segment. Add sortable table with employee/status counts and overdue rate. |
| Overdue by employee bars | Horizontal red bars, only employees with overdue work. | Directly actionable queue ownership. | Good decision value; explicitly state excluded zero-overdue users and add days overdue/age, not just count. |
| Lab tests by date | 8-week line. | Detects demand/throughput movement. | Count is not outcome; add comparison and link to review queue. Add table alternative. |
| AIR vs VACUUM | Two horizontal bars. | Mix/context for workload. | Not a KPI by itself; demote. Show period and link filters. |
| Final results | PASS/FAIL/HOLD bars. | Quality outcome mix. | Add denominator, FAIL/HOLD rates, and repeat-failure/CAPA link. Counts alone can mislead when volume changes. |
| Equipment status | Horizontal status bars. | Shows availability/maintenance state. | Add “as of” timestamp and separate calibration attention; current chart is inventory context. |
| Calibration donut | Calibration state donut including unknown. | Surfaces compliance risk. | Good inclusion of unknown; add total equipment, threshold definition, and accessible table. |
| Document review status | Lifecycle status bars. | Shows controlled-document backlog. | Add due/overdue and acknowledgement coverage; lifecycle counts alone do not show risk. |
| FAIL-rate trend | Full 0–100% line, decided non-VOID tests, current vs previous period. | Strong quality signal. | Keep; add sample-size warning for small denominators, target/alert threshold, and accessible table. |
| FAIL rate by product | Ranked analytical table with decided, FAIL, rate, drilldown. | Direct investigation queue. | Good table; add minimum sample-size rule, time range in heading, and repeat-failure/CAPA columns where available. |

## Reports, drilldowns, and analytical tables

### Strengths confirmed

- Report filters include period, scope and advanced dimensions; the preview repeats resolved scope, period, filters and matching rows.
- The server re-authorizes report generation and records report ID, actor, filters, format and data scope in the audit trail.
- Report catalog covers overdue, findings, CAPA, evidence, SLA, performance, lab tests/results/retests, equipment/calibration/maintenance, SOP/WI, review due, acknowledgements, data quality and retention.
- KPI drilldowns preserve filters and authorized scope and expose a text table with status, priority, SLA and due date.
- Operational tables surface overdue tasks, blockers, missing evidence, pending reviews, equipment alerts, calibration alerts, document review due, open retests and recent activity.

### Findings and changes required

| Priority | Finding | Remediation |
|---|---|---|
| P0 | KPI cards are not consistently decision-complete: many lack denominator, target, “as of”, or comparison. | Make each card show unit, period, numerator/denominator where relevant, target/threshold, delta and a named action link. |
| P0 | Main dashboard duplicates concepts: `Average Completion Time` and `Average Resolution` use the same value; task status counts are repeated as cards and donut. | Remove duplicate card; demote donut/status counts to context; reserve top tier for overdue, urgent, SLA risk/breach, evidence, critical findings, CAPA and completion rate. |
| P1 | Employee stacked chart has an accessible total summary but not an accessible representation of every status segment. | Add a real HTML table or expandable per-employee breakdown with status counts, overdue, workload and period. |
| P1 | Several charts have no explicit y-axis unit or visible period/“as of” label. | Add axis/unit labels and period text to every chart; avoid requiring tooltip/aria-label discovery. |
| P1 | Hover tooltip is not the primary accessible route and is not clearly associated with focused marks. | Use focusable controls with `aria-describedby` or rely on a visible data table; never make tooltip the only detail path. |
| P1 | Dashboard laboratory cards ignore the task dashboard filter state and represent a live all-time/current snapshot while the page says filters scope every widget. | Either apply the same period/scope contract to lab widgets or label the lab section explicitly as “current lab snapshot, independent of task filters.” |
| P1 | FAIL-rate trend shows a threshold constant in product-row coloring but does not display the threshold or a target line. | Show the alert threshold numerically and in text; add a target/threshold annotation and denominator warning. |
| P2 | Drilldown result is capped at 500 and has no pagination or “showing X of Y” context. | Add cursor pagination and total/limit disclosure, or make the cap a deliberate filterable report action. |
| P2 | Empty/zero states are present but not consistently differentiated from “not calculated” or “no denominator”. | Use explicit states: no records, zero records, not applicable, insufficient sample, failed to load. |
| P2 | Reports offer export formats but the UI does not explain which columns/decision question each report answers at the point of selection. | Add report purpose, owner, period basis, grain, and recommended action to every catalog item. |

## Accessibility and non-color requirements

### Confirmed in source

- SVG charts use `role="img"`, descriptive `aria-label`, and native `<title>` elements on marks.
- Donut and line points/segments are focusable; chart legends and bar counts are rendered as text.
- Tables and registers are available for operational queues and product FAIL breakdown.
- Status semantics use labels and shared semantic tones; the project has an automated status/contrast/a11y contract.
- Loading, error, empty and zero paths exist for dashboard and lab surfaces.

### Not yet proven / required before “100%”

- VoiceOver/NVDA behavior for every chart and focused mark is not recorded.
- No HTML table alternative exists for every chart, especially stacked employee status detail and some lab distributions.
- Color is supplemented by text in most places, but visual hierarchy still uses color to signal urgency; the text label/action must remain the authoritative signal.
- Chart labels can truncate employee/document/product names; truncation must not remove identity from the accessible or tabular representation.
- Automated a11y PASS is not equivalent to human assistive-technology validation.

## Recommended target dashboard hierarchy

1. **Act now:** overdue, urgent open, SLA breached/critical, critical findings, open CAPA, missing evidence, calibration overdue, review queue, open retests.
2. **Decide today:** completion rate vs previous period/target, FAIL rate vs previous period/threshold, workload imbalance, documents due, changes waiting >24h.
3. **Investigate:** overdue-by-owner, FAIL rate by product/lot, repeat failures, failure reasons, evidence compliance, average resolution with sample size.
4. **Context:** total volume, status mix, AIR/VACUUM mix, equipment inventory, recent activity, contributor changes today.

Vanity rule: a volume or activity count stays only when it changes a decision, has a period, and links to the next action. Otherwise it belongs in a report or supporting table, not the primary KPI tier.

## Required KPI card contract

Every retained KPI card must expose:

- question-shaped label or supporting sentence;
- unit and numerator/denominator when it is a rate;
- period and “as of” time;
- comparison period, delta and direction in text;
- target/threshold or explicit “no target defined”;
- plain-language good/bad interpretation;
- owner and action link;
- accessible text summary and an equivalent table for visual-only detail;
- explicit no-data / zero / insufficient-sample / error state.

## Verification performed

| Check | Result |
|---|---|
| Source inventory of dashboard/report/chart/drilldown/table surfaces | PASS |
| KPI definitions traced to read models and SQL predicates | PASS |
| Chart type/encoding/scale/legend/unit review | PASS with findings above |
| Actionability review against overdue, completion, rejects, failures, CAPA, calibration, maintenance, acknowledgements and workload | PASS with prioritization gaps |
| Automated project a11y/design contracts | Existing PASS recorded in `A11Y-ERGONOMICS-100-EVIDENCE.md`; not rerun as part of this documentation-only audit |
| Human VoiceOver/NVDA and production data validation | NOT RUN / required |

## Final claim

The QC application has a credible analytical foundation and many actionable queues, but it does **not** yet meet the requested “zero misleading, zero unlabeled, zero inaccessible, zero meaningless” standard. The remaining gap is primarily decision context and accessible equivalence: reduce KPI clutter, remove duplicate/vanity prominence, expose periods/denominators/targets, and provide a real tabular alternative for every chart.

---

<a id="قسم-16"></a>

<!-- SOURCE FILE: 12-ADVANCED-FORMS-100-EVIDENCE.md -->
# QC-100-FORMS-013 — Advanced Forms Evidence

**Scope:** Enterprise Form UX audit of every user-input surface in `apps/qc-task-manager`.
**Audit date:** 2026-09-02
**Auditor:** Enterprise Form UX Specialist
**Evidence basis:** source inventory, server schemas, existing form-productivity contract, and existing automated test contracts. No human UAT, VoiceOver/NVDA session, or production telemetry was available during this audit.

## Executive result

The form estate is broad and functionally mature, but it does **not** currently prove the requested 100% targets. The strongest implementation is `LabTestForm`; the shared native-form contract covers six major create/edit forms. Search, filters, settings, user management, acknowledgement assignment, change requests, destructive archive/delete actions, and several embedded forms remain outside or only partly inside that contract.

| Target | Current evidence | Status | Required closure |
|---|---|---:|---|
| 100% persistent field labels | Many explicit labels; nested-label and icon/hidden-control cases remain | Partial | Automated label/association inventory plus manual screen-reader pass |
| 100% validation clarity | Server Zod schemas are centralized, but some client messages are generic/native and not always field-associated | Partial | Map every schema issue to field + recovery copy |
| 100% submission feedback | `data-qc-form` and `LabTestForm` provide feedback; GET/search/filter and small POST forms do not share it | Partial | Shared mutation state for every POST/action form |
| 100% keyboard usability | Global focus contracts and E2E coverage exist; full form-by-form keyboard evidence is absent | Partial | Keyboard matrix for all 51 source files and dialogs |
| Zero known data-loss flows | Unsaved protection exists on `data-qc-form`; non-contract forms can navigate/submit without the same guard | Fail | Apply one dirty-state/submit contract to every mutable form |
| Zero ambiguous required fields | Required markers are inconsistent; optional text is often visible, but some schemas require fields without equivalent UI copy | Partial | Canonical required/optional vocabulary and schema/UI parity check |

## Inventory and user-intent structure

The audit found **51 source files containing `<form`**. The inventory below groups them by the user’s intent rather than database tables.

| User intent | Included surfaces | Current evidence | Main risk |
|---|---|---|---|
| Create or update work | Task create, task update, checklist, dependencies, comments, attachments, lifecycle | `NewTaskForm`, `TaskUpdatePanel`, `TaskLifecycle`, `CommentBox`, `AttachmentUploader` | Long form and multiple save/submit semantics can be confused |
| Record a quality finding and response | Findings, RCA, CAPA, evidence | `/findings`, task detail panels, `rcaSchema`, `capaSchema`, `evidenceSchema` | RCA/CAPA fields are domain-shaped rather than intent-stepped |
| Run and review laboratory work | Lab test, review, void, retest | `LabTestForm`, test review, retest create | High consequence; needs review, preserved measurements, and recovery |
| Maintain laboratory master data | Product, template, equipment, maintenance, calibration | Shared lab form components and maintenance page | Lookup/conditional fields and archive confirmations are inconsistent |
| Control documents and acknowledgement | Controlled document, versions, acknowledgement assignment | `LabDocumentEditor`, document version forms, acknowledgement assign | Immutable/approved state needs stronger contextual confirmation |
| Request and approve changes | Change request create/review/withdraw | `/lab/change-requests/new`, detail review forms | One broad form exposes irrelevant fields for four entity types |
| Manage people and access | User create/edit/reset, account password/security | Admin users and account security | Security-sensitive; password, role, and active-state feedback must be explicit |
| Configure the product | Admin settings, saved views | Admin settings, `LabSaveViewForm`, saved-view delete | Settings need grouped intent and safe defaults; delete needs contextual confirmation |
| Find and narrow records | Search, lab search, dashboard/report filters, saved filters | `/search`, `/lab/search`, report/dashboard GET forms | No common pending/error/keyboard/clear-state contract |

### Required target structure

Every mutable form should use a consistent single-column, intent-first structure:

1. **What are you trying to do?** — record identity or selection.
2. **What happened / what should happen?** — observation, result, or requested change.
3. **What controls the outcome?** — owner, dates, risk, references, or attachments.
4. **Review and submit** — consequence summary, validation summary, and one primary action.

Database-only fields should be hidden behind progressive disclosure or conditionally shown. Entity-specific fields must not appear until the entity type and operation are selected.

## Findings, RCA, CAPA, lab test, and task workflows

### F-001 — Task creation mixes planning, recurrence, quality metadata, checklist, and dependencies

**Evidence:** `src/components/NewTaskForm.astro:52-208` has template selection, title/description, department/priority, assignment/due date, recurrence, quality details, checklist, and dependencies in one continuous form.

**Finding:** The form has useful field labels and a quality `<fieldset>`, but user intent is not fully staged. `Department`, `Priority`, `Assign to`, `Due date`, and recurrence are planning decisions; inspection metadata and evidence requirements are a separate QC intent.

**RCA:** The form grew by appending domain fields to the create flow. The database/schema shape is visible in the UI instead of a task-creation decision sequence.

**CAPA:**

- P0: Split into `Task basics`, `Planning`, and optional `Quality context`; keep `Checklist` and `Dependencies` collapsed until requested.
- P1: When a template is selected, show a compact “will copy / will override” summary and mark only overrideable fields editable.
- P1: Make recurrence end date appear only when recurrence is not `none`; validate end date against due date server-side and inline.
- P2: Add lookup/search for assignees and dependencies once lists exceed a practical scan limit.

### F-002 — Findings/RCA/CAPA lack a consistent review boundary

**Evidence:** server schemas exist for `findingCreateSchema`, `rcaSchema`, `capaSchema`, and `evidenceSchema` in `src/lib/validation.ts`; task detail contains multiple mutation surfaces in `TaskUpdatePanel` and lifecycle controls.

**Finding:** The server boundary is authoritative, but the user-facing journey is not consistently grouped as `describe finding → explain cause → define action → attach proof → verify effectiveness`.

**RCA:** RCA and CAPA were implemented as separate operational records and controls rather than one staged response journey.

**CAPA:**

- P0: Add a visible step/section sequence and a review summary before approval/closure.
- P0: Associate every server issue with the exact field and preserve all valid entries after a failed save.
- P1: Show CAPA due date, owner, evidence, and effectiveness check only when the selected finding classification/risk requires them.
- P1: Require a meaningful reason for reject/return actions and place it beside the action, not only in a remote banner.

### F-003 — Lab test is the reference implementation, not yet estate-wide standard

**Evidence:** `LabTestForm.tsx:227-247` tracks dirty/submitting/save state; the existing form productivity test verifies review confirmation, explicit save states, and section statuses.

**Finding:** This form already has progressive sections, duplicate/paste recovery, explicit review, and preserved measurements. It should be promoted as the canonical contract for high-consequence forms.

**RCA:** The lab test received a dedicated UX workstream; other forms still use native POST or smaller local patterns.

**CAPA:**

- P0: Extract the behavioral contract, not the visual markup: dirty state, pending lock, error summary, focus return, success result, and safe retry.
- P1: Add a test matrix for draft, continue, submit, failed save, expired session, duplicate submit, and browser back/navigation.
- P1: Keep “measurements are re-taken, never copied” visible in retest and review contexts.

## Master-data and laboratory forms

| Form | Finding | RCA | CAPA |
|---|---|---|---|
| **Product** — `LabProductForm.astro` | Labels and sections are present, but related equipment is a checkbox list and SOP/WI/template choices are long selects; active/archive behavior is separate from the edit intent. | Master-data references are rendered as direct foreign-key controls. | Use searchable lookup with selected-item summaries; show `Activation` as a deliberate status section; contextual confirmation for archive/restore; preserve selections on server errors. |
| **Template** — `LabTemplateForm.astro`, admin template new/edit | Template identity, test configuration, parameters, references, equipment and checklist rules are all exposed together. Free-text JSON fields (`checklist_text`, `finding_defaults_json`) are error-prone. | Versioning and runtime defaults are represented directly as form fields. | Progressive disclosure by `test type`; replace raw JSON entry with structured repeaters or an advanced disclosure with syntax/format help; show immutable identity and version impact before save. |
| **Equipment** — `LabEquipmentForm.astro` | Strongest native grouping: identity, status/calibration, notes. `Status` is free text and archive is a second POST form without the shared productivity contract. | Company-specific verbatim status values were preserved for data compatibility. | Keep verbatim storage server-side but offer controlled suggestions/lookup; add `data-qc-form` to archive/restore or use a contextual confirmation dialog; label calibration as “registry flag” plus link to dated records. |
| **Maintenance** — `/lab/equipment/[id]/maintenance.astro` | Maintenance is a consequential record but is not visibly covered by the six-form productivity inventory. | It was implemented as a route-specific form. | Add equipment context, maintenance intent, date, provider, outcome, next action, attachment/evidence, and review state; use date helper and numeric protection where applicable; test pending/retry/duplicate submit. |
| **Calibration** — `LabCalibrationForm.astro` | Clear required equipment and optional-date copy; “dates are YYYY-MM-DD” is useful. Date relationships are not visibly enforced in the source component. | Schema deliberately allows incomplete calibration data. | Keep incomplete drafts valid, but validate chronology and explain precedence (`next_due_at` vs due date) inline; use date controls with min/max where safe and contextual confirmation for non-compliant/archived equipment. |
| **Controlled document** — `LabDocumentEditor.astro`, document versions | The approved-version immutability rule is explained and change summary becomes required when revising approved content. | Document governance rules are embedded in editor copy and server logic. | Split metadata/content/change rationale; show version diff or summary before submit; require contextual confirmation when creating a new controlled version; preserve draft after rejection. |
| **Acknowledgement** — `/lab/acknowledgements/assign.astro` | Multi-select employee assignment uses checkboxes, but the primary intent (which document/version, who must acknowledge, deadline) should be stated before the recipient list. | Assignment is modeled around repeated `user_ids` FormData entries. | Add selected-count summary, search/filter recipients, select-all/clear-all with confirmation only when it changes many records, and success result listing count/version. |
| **Retest** — `/lab/retests/new.astro` | Good explanatory boundary: original test is preserved and reason is required. The reason note is not conditionally required for `OTHER` in the visible form. | Retest reason enum and note are separate schema fields. | Make note required for `OTHER` and any reason needing explanation; show original test summary, carried context, and fields that will be re-entered; add review confirmation and safe retry. |
| **Change request** — `/lab/change-requests/new.astro` and review | One form exposes Equipment/Product/Calibration/Retest fields simultaneously, including raw IDs and irrelevant inputs. This is the clearest database-shaped form in the estate. | A single payload supports four entity types and two operations. | P0: conditionally render a dedicated intent form after `Entity` + `Operation`; use lookups instead of raw IDs; show a change summary and approval route. P1: review form must show exact before/after values and require meaningful rejection note. |

## User management, settings, filters, and search

### User management

**Evidence:** `src/pages/admin/users/index.astro:56-107` has create-user fields; `src/lib/validation.ts` has `userCreateSchema`, `userEditSchema`, `passwordResetSchema`; account security uses `passwordChangeSchema`.

**Findings:** Labels and password autocomplete are present. `Username` and `Full name` use `autocomplete="off"`, preventing safe browser autofill for identity data. Role, department, task-creation capability, and active state are security-impacting choices but are not grouped by access intent. User edit/reset forms are route/table actions rather than a unified user-management journey.

**RCA:** The UI follows the users table and API action names, while the user’s intent is `identity → access → account state → credentials`.

**CAPA:**

- P0: Group create/edit into `Identity`, `Access`, and `Account status`; explain role impact and employee-only task creation before submission.
- P0: Add visible pending, success, and recovery feedback to create/edit/reset/deactivate actions.
- P1: Use safe autocomplete tokens (`username`, `name`) where appropriate; never autocomplete passwords from another account.
- P1: Require contextual confirmation for deactivation/reset, with target username and consequence; no generic confirmation fatigue for ordinary edits.

### Settings and account security

**Finding:** Settings and password forms are security-sensitive mutation surfaces but are not guaranteed by the shared `data-qc-form` contract. Password change has server-authoritative matching and minimum-length validation, but the UI must visibly preserve entered values and identify the exact field on failure.

**CAPA:** Add `Current password`, `New password`, `Confirm new password` sections with requirement help, show/hide controls with accessible names, pending lock, success state, and safe retry. For admin settings, group by `Defaults`, `Notifications`, `Retention/operations`, and `Security`; include a change summary for high-impact settings.

### Filters

**Evidence:** `/search` contains a GET filter form plus saved-filter POST forms; it includes status, priority, department, assignee, creator, recurrence, multiple date ranges, result count, and checkboxes (`src/pages/search.astro:101-237`). Lab pages repeat filter toolbars.

**Findings:** Labels are generally present, but the filter surface is dense and uses small text controls. It lacks one shared pending state, “filters applied” summary, date-range validation copy, and a predictable keyboard path to clear/reset. Saved-filter delete is a destructive POST action and should be contextual rather than an unlabeled table action.

**RCA:** Search filters were added incrementally per query parameter, so the UI mirrors query schema.

**CAPA:**

- P0: Group into `What`, `Who`, `When`, and `Quality/risk`; hide advanced filters behind disclosure.
- P0: Add `Apply filters`, `Clear all`, result count, and applied-filter chips with keyboard-accessible removal.
- P1: Validate `from ≤ to` per date pair and preserve all filters after errors.
- P1: Confirm only saved-filter deletion, naming the filter; do not confirm applying/clearing low-risk filters.

### Search

**Finding:** Search is functionally available, but GET forms are outside the mutation productivity helper and therefore have no common pending/duplicate-submit/success/error contract. Search suggestion/lookup controls need a standard keyboard interaction and announcement contract.

**CAPA:** Use a persistent labeled search input with correct `type="search"`, `inputmode="search"` where supported, autocomplete suggestions with arrow-key selection, Escape to dismiss, and a live result-count update. Keep the query and filters in the URL and restore them after server errors.

## Cross-cutting validation and submission audit

### What is already good

- Server schemas are centralized in `src/lib/validation.ts`; `parseFormData()` is the authoritative boundary.
- Native constraints (`required`, `maxlength`, `minlength`, `pattern`, `type=date`) prevent many avoidable submissions.
- `form-productivity.js` preserves values, marks invalid controls, focuses an error summary, prevents duplicate submission, disables submit buttons, and installs unsaved-change protection for `data-qc-form`.
- Existing copy explicitly protects important data: approved document versions, original lab tests, and calibration audit history.

### Systemic gaps

1. **Helper mismatch:** `form-productivity.js` renders field errors on every `input`; this is noisy for users still typing and conflicts with the project form principle of blur-based validation.
2. **Error association gap:** the helper creates `id="<field>-error"` but does not set `aria-describedby`/`aria-errormessage` on the field. A field can be visibly invalid without guaranteed screen-reader association.
3. **Focus sequencing gap:** the helper focuses the summary and then immediately focuses the first invalid field, so the summary is not reliably the next announced object.
4. **Generic client copy:** native `validationMessage` and the hard-coded English summary do not guarantee the field-specific, human-readable product language required by this task.
5. **Scope gap:** only forms with `data-qc-form` receive the shared contract. Small POST forms, search/filter GET forms, archive/restore, acknowledgement assignment, settings, and table actions need an explicit policy.
6. **Required parity gap:** server schemas can require a field conditionally or by action while the UI only shows a generic required marker or no marker.
7. **Non-destructive recovery gap:** server-side field errors must return the submitted values; this is not proven for every route and was not tested here with malformed/expired sessions.

## CAPA roadmap and ownership

| Priority | Action | Owner | Acceptance evidence |
|---|---|---|---|
| P0 | Create a canonical `FormContract` for all POST/PATCH/PUT/DELETE-like forms: dirty, pending, duplicate lock, success, error recovery, focus return | Frontend platform | Every mutation form in inventory references the contract; source guard passes |
| P0 | Add schema-to-field error mapping and `aria-describedby` for every invalid field | Frontend + API | 100% schema issue paths map to visible copy and preserved value |
| P0 | Refactor change request into conditional intent forms | Lab product owner | No irrelevant fields rendered for selected entity/operation; E2E covers all four entity types |
| P0 | Cover destructive archive/delete/deactivate/withdraw actions with contextual confirmation | Product + security | Confirmation names target and consequence; low-risk actions do not confirm |
| P1 | Add automated label/required/keyboard inventory across all 51 source files | Accessibility | 0 unlabeled controls; 0 ambiguous required fields |
| P1 | Add lookup/autocomplete/date/numeric helpers for large lists and structured values | Frontend | Keyboard and mobile tests for lookup, date, numeric, and suggestion states |
| P1 | Add filter/search interaction contract | Search owner | Apply/clear/pending/result-count/error/recovery tests pass |
| P1 | Add browser-back, reload, session-expiry, and double-submit E2E cases | QA | No valid data lost; retry is safe and documented |
| P2 | Add human UAT by role plus VoiceOver/NVDA and 360/1440/200% zoom evidence | QA/UX | Signed evidence matrix; automation not used as a substitute |

## Lab test plan

The following tests are required before claiming the target is met. They are a test plan, not completed results.

| ID | Scenario | Expected result |
|---|---|---|
| LAB-F-01 | Submit each form with one missing required field | Inline field-specific message; valid entries remain; focus lands predictably |
| LAB-F-02 | Submit malformed date, number, ID, code, and long text | Human-readable recovery; no silent coercion that changes meaning |
| LAB-F-03 | Server rejects a valid-looking but unauthorized/stale submission | Server message appears in context; no duplicate record; entered data is preserved |
| LAB-F-04 | Double click / press Enter twice | One request only; visible pending state; controls lock without losing values |
| LAB-F-05 | Network/server failure after submit | Error says whether save status is known; retry is safe; no blind duplicate creation |
| LAB-F-06 | Edit then navigate back, cancel, reload, or close tab | Unsaved-change protection appears where appropriate; deliberate discard is explicit |
| LAB-F-07 | Keyboard-only completion | Logical Tab order, visible focus, Enter submit, Escape dialog close, no trap |
| LAB-F-08 | Mobile 360px and 1440px desktop | No tiny controls or horizontal form overflow; correct virtual keyboard/inputmode |
| LAB-F-09 | 200% zoom and text scaling | Form reflows; fixed action bars/dialogs remain reachable and scrollable |
| LAB-F-10 | Screen reader labels/errors | Every control has persistent name; error is announced and associated with field |
| LAB-F-11 | Conditional fields | Irrelevant fields are hidden and not submitted; revealed fields receive focus/help |
| LAB-F-12 | Destructive actions | Confirmation is contextual and names object/consequence; low-risk actions avoid confirmation fatigue |

## Evidence status

| Evidence source | Result |
|---|---|
| Source inventory | **PASS** — 51 files containing `<form` identified |
| Server validation | **PASS** — centralized Zod/FormData boundary exists; route-by-route parity still required |
| Existing `test:form-productivity` | **PASS** for its current six shared forms and LabTestForm contract |
| Existing Lab form tests | **PASS** per current project mind record; not a substitute for all-form coverage |
| Full all-form label/required audit | **NOT RUN** — no dedicated guard currently proves 100% |
| Full submission-feedback audit | **NOT PROVEN** — GET and small POST forms sit outside the common helper |
| Keyboard-only manual audit | **NOT RUN** |
| VoiceOver/NVDA | **NOT RUN** |
| 360/1440/200% form-by-form validation | **NOT PROVEN** |
| Production/staging telemetry and UAT | **NOT AVAILABLE** |

## Final disposition

**Status: PARTIAL / CONDITIONAL GO for documentation.** The audit and remediation plan are complete, but the product should not claim 100% form UX, zero data-loss flows, or zero ambiguous required fields until the P0 contract gaps and LAB-F-01 through LAB-F-12 evidence are closed.

No product behavior was changed by this document-only audit.

---

<a id="قسم-17"></a>

<!-- SOURCE FILE: PRE-LAUNCH-REPORT.md -->
# 🚀 تقرير ما قبل الإطلاق النهائي — QC Task Manager

> **إصدار التقرير:** 1.0 — يوم 2026-08-23
> **نوع التقرير:** تحليل المسار الكامل + قائمة الإصلاحات والتحسينات والتكاملات والإضافات + خطة الإطلاق النهائية
> **المصادر:** قراءة كاملة لعقل المشروع (`.agents/mind/`) + الملفات السبعة للبرومبتات (`PROMPTS.md`, `prompt2`, `prompt3`, `prompt4-LAB`, `prompt5-LAB`, `prompt6`, `prompt7`) + `REPORT.md` و`README.md` + **تحقق مباشر من الكود يوم التقرير**
> **ملاحظة حاكمة:** هذا التقرير لا يطلب إعادة تنفيذ أي برومبت — كل البرومبتات (7 أجيال) منفّذة وموثّقة. التقرير يصف وش تبقى فعليًا قبل الإطلاق، وأي بند فيه هو شغل جديد صغير أو قرار تشغيلي، مو إعادة بناء.

---

## 1. الخلاصة التنفيذية

**الحكم: Conditional GO — جاهز للإطلاق بشرط إغلاق 4 إصلاحات نهائية وجلسة نشر واحدة.**

النظام وصل من "برنامج مهام بسيط" إلى **منصة عمليات جودة وامتثال بمختبر كامل** خلال 7 أجيال تنفيذ متتابعة، بلا أي إعادة تنفيذ مطلوبة اليوم. البناء والأمان والاختبار الوحدوي كلها خضراء ومثبتة بالعقل وبالتحقق المباشر يوم هذا التقرير. الناقص الباقي كله من نوع "إثبات تشغيل نهائي + قرارات نظافة" — ساعات عمل مو أسابيع.

| المجال | التقييم | الأساس |
| --- | --- | --- |
| المعمارية | 95% | طبقات نظيفة، مصدر صلاحيات واحد، صفر نظام موازٍ |
| الوظائف | 95% | كل Core المهام + المختبر منفّذ ومختبر وحدويًا |
| الأمان | 92% | 8 ثغرات مغلقة، CSP صارم — باقي تدوير مفتاح AI |
| الاختبارات | 85% | 47 سويت وحدوية خضراء — جلسة E2E كاملة واحدة متبقية |
| النشر | 80% | blueprint كامل جاهز — أول نشر فعلي ما تم |

---

## 2. تحليل المسار — خط الزمن الكامل عبر 7 أجيال

### 2.1 خريطة الأجيال

| # | الملف | المدى | وش بنى | الأثر التراكمي |
| --- | --- | --- | --- | --- |
| 1 | `PROMPTS.md` | 00–12 | الـ MVP: auth + أدوار + مهام + إغلاق + طلبات حذف + dashboard | 12 جدولًا، تطبيق SSR شغال |
| 2 | `prompt2.md` | 00–18 | نسخة مصححة موسعة: Zod + قفل حساب + إشعارات + اعتماديات + تكرار + فلاتر محفوظة + تصدير + اختبارات + توثيق نشر | بنية إنتاجية أولى |
| 3 | `prompt3.md` | 00–13 | التصلب: نظام migrations + SLA + Findings/RCA/CAPA + سلسلة تدقيق hash + أساس AI (Groq) + بوابة جاهزية | تحوّل لمنصة عمليات جودة |
| 4 | `prompt4-LAB.md` | 00–40 | المختبر كاملًا: قاعدة بيانات + RBAC + نموذج AIR/VACUUM + سجلات + وثائق محكومة + معايرة + معدات + بذر 24 جهازًا | 49 مسار مختبر جديد |
| 5 | `prompt5-LAB.md` | 41–59 | إغلاق الفجوات: اعتماد وثائق + VOID + أرشفة + إشعارات مجدولة + طباعة A4 + QR + e-signature + retention + تصعيد FAIL متكرر + **PDF عربي** | مختبر تشغيلي فعلي |
| 6 | `prompt6.md` | 001–010 | مساهمة الجميع: طابور مراجعة التغييرات + استيراد فهرس WI الورقي + محاذاة FR-MA-018 + نقل التقارير + ديمومة التدقيق | توسيع RBAC + مصدر مرجع وحيد |
| 7 | `prompt7.md` | 011–021 | التدقيق والتصحيح: db-doctor + إصلاحات correctness + هوية التدقيق + provenance + route-manifest + system-health + UX/a11y + بوابة تحقق نهائية | تصلب ما بعد التنفيذ |

**النمو التراكمي الموثّق:** جداول 12 → **51** · migrations 0 → **35** · مسارات 0 → **109 file routes + 25 middleware routes + 6 guards** · سويتات الاختبار 0 → **47 canonical** · أنواع التقارير 8 → **24** · أنواع الإشعارات 15 → **32** · ميزات AI 0 → **15** (استشارية بحتة).

### 2.2 وش علّمنا المسار (الأنماط الناجحة)

1. **نمط "المنفّذ ثم المدقق المستقل" نجح بشكل مثبت**: كل جيل تدقيق (prompt7، تدقيق الأمان 08-18، تدقيق التغطية) اكتشف أشياء حقيقية فاتت التنفيذ — مسارات تقارير ما دخلت git، تسريب متصفح يعلّق الـ E2B، إسناد WI لمستخدم وهمي. الفصل بين "نفّذت" و"تحققت" هو أهم مكسب منهجي بالمشروع.
2. **قاعدة "implemented ≠ verified"** صارت العقد الحاكم بالأجيال المتأخرة — استمر عليها بأي شغل جاي.
3. **منع الأنظمة الموازية** (تدقيق/إشعارات/بحث/تقويم) حافظ على المعمارية رغم تضاعف الحجم 4 مرات — ما فيه ديون معمارية كبيرة، فقط تكرارات موضعية.
4. **التجميد البنيوي** (triggers بعد الاعتماد + snapshots) حل مشكلة سلامة السجلات التاريخية حلًا جذريًا مو بالواجهة.

### 2.3 المخاطر المتبقية النابعة من طريقة المسار

| المخاطرة | الدليل | التقييم |
| --- | --- | --- |
| **Spec drift** — ملفات البرومبتات صارت أصغر من الكود | prompt7 يغطي حتى migration 034 والكود فيه 035 | العقل (01-mind-latest) هو مصدر الحقيقة الوحيد — القرار: ما تعتمد على ملفات البرومبتات لأي رقم |
| **صناديق stale** بالبرومبتات | قسم FINAL EXECUTION ORDER في prompt4/5 كله `[ ]` رغم ✅ أعلاه | تضليل لأي قارئ مستقبلي — إصلاح نصي رخيص (بند 6.2) |
| **سويتات يتيمة** | `test-lab-search.mjs` غير مسجل بسلسلة test إطلاقًا، و`e2e-lab-search.mjs` غير مسجل وفيه فشل RBAC موثق عند HEAD | فجوة تغطية فعلية على مسار `/lab/search` — إصلاح P1 (بند 5.4) |
| **E2E الكامل ما اكتمل بمرة واحدة** بعد آخر التغييرات | آخر جلسة كاملة = 8 سويت/490 فحص ثم hang (قبل إصلاح التسريب)؛ الإصلاح موجود بالكود لكن ما سُجّلت جلسة كاملة بعده | البوابة رقم 1 للإطلاق |
| **ديون جودة موثّقة** | `escapeLike` ×9، ترقيم صفحات ×9، خرائط إشعارات مكررة، حدود zod مبعثرة | صفر خطر وظيفي — تحسين مستحق (قسم 5) |

---

## 3. الوضع الحالي — متحقق مباشرة من الكود يوم 2026-08-23

| البند | الحالة | طريقة التحقق |
| --- | --- | --- |
| migrations | **35 ملفًا** (001→035) | `ls db/migrations/` |
| `pnpm typecheck` | **0 errors / 0 warnings / 17 hints** | تشغيل مباشر اليوم |
| تسريب المتصفح `e2e-task-search.mjs` | **مُصلَّح فعلًا**: كل الشغل داخل `try` (سطر 285) و`finally` (سطر 502) يغلق contexts/pages/browser، والـ acceptance runner عنده CHILD_TIMEOUT مع SIGTERM/SIGKILL | قراءة مباشرة للكود |
| `route-manifest.mjs` | **tracked في git** | `git ls-files` |
| render.yaml | خدمة qc-task-manager + healthCheckPath + قرص دائم 1GB | قراءة مباشرة |
| `/admin/system-health` | موجودة (قرص/قاعدة/نسخ/سلاسل تدقيق/معلومات) | `ls src/pages/admin/` |
| PDF عربي | **منفّذ**: writer يدمج IBM Plex Sans Arabic مع ToUnicode CMap وتشكيل صحيح | قراءة `reporting/writers/pdf.ts` |
| ملفا `qc_tasks.db` و`qc_tasks 3.db` | **لا يزالان متتبعين في git** | `git ls-files` |
| working tree | حركات غير ملتزمة: 7 ملفات audit انتقلت لـ `audit/qc/before/` (untracked) + `audit/report-SEO.md` untracked | `git status` |
| البرومبتات كاملة | **ما تحتاج إعادة تنفيذ** — كلها منفّذة ومسجّلة بالعقل | سلاسل العقل |

---

## 4. سجل المشاكل والأخطاء — المفتوحة والمُصلَحة

> هذا القسم يجمع كل مشكلة وخطأ وثّقها المسار من أجياله السبعة: **المفتوح منها** (ياخذ فعل قبل أو بعد الإطلاق — كل واحد مربوط بقسم الحل)، و**المُصلَح منها** (سجل دروس يمنع تكرارها)، و**مشاكل البيئة** (مو عيوب نظام).

### 4.1 المشاكل المفتوحة الآن — مرتبة بالخطورة

#### 🔴 P0 — توقف إطلاق

| # | المشكلة | الأثر الفعلي | الحل / المكان |
| --- | --- | --- | --- |
| 1 | **جلسة E2E قبول كاملة ما اكتملت أبدًا بمرة واحدة** بعد آخر موجة تغييرات — آخر توثيق كامل وصل 8 سويت/490 فحص ثم علّق | قبول النظام النهائي غير مُثبت بجلسة واحدة | ثلاثة إصلاحات للـ harness موجودة بالكود وتحققت منها اليوم (تفاصيل 5.1) — المتبقي تشغيل واحد كامل |
| 2 | **6 فشلات سابقة موثّقة في `e2e-lab-nav`**: 4× رابط المختبر بقائمة الجوال + POST مزوّر + overflow عند 1024 | مرجحة الظهور عند بوابة E2E — ما وُثّق إصلاحها صراحة بعد آخر أعمال الـ UX | لو ظهرت: هي مشكلة الـ navbar المشترك (مو خاصة بالمختبر) — إصلاح جذري واحد يحلها كلها |
| 3 | **مفتاح Groq القديم مكشوف** + صفر تحقق حي للمزوّد (الـ mock كله أخضر فقط) | خطر أمني قائم بذاته + ميزات الـ AI الـ 15 غير مثبتة حيًا | تدوير المفتاح بيدك + smoke واحد (5.2) |
| 4 | **ملفا `qc_tasks.db` و`qc_tasks 3.db` متتبعان في git** + حركات working tree غير ملتزمة | نظافة ريبو قبل أول نشر | أوامر الالتزم والتنظيف (5.3) |

#### 🟡 P1 — لازم تُحسم قريبًا

| # | المشكلة | الأثر الفعلي | الحل / المكان |
| --- | --- | --- | --- |
| 5 | **سويتات يتيمة**: `test-lab-search.mjs` غير مسجل بسلسلة test نهائيًا، و`e2e-lab-search.mjs` غير مسجل وفيه فشل RBAC موثّق عند آخر فحص | فجوة تغطية فعلية على `/lab/search` — اختبارات موجودة ما تدخل السلسلة | تسجيل أو دمج بقرار موثّق (5.4) |
| 6 | **طلبات التغيير بلا حالة سحب (WITHDRAWN)** | المساهم ما يقدر يسحب طلبه المعلّق — آخر فجوة موثّقة بالدورة الوظيفية | migration صغيرة + زر (7.1) أو تأجيل موثّق |
| 7 | **`notify:daily` بلا cron إنتاجي** | بدون Render Cron Job ما تنزرع تذكيرات المعايرة/المراجعة/الإقرارات اليومية | ضمن الجلسة 2 من خطة الإطلاق (9) |
| 8 | **مخالفات axe color-contrast متبقية**: 2 serious (لوحة المؤشرات ~20 عقدة opacity-70 + تفاصيل المهمة ~7 عقدات) | موثّقة بقرار تصميمي مؤجل — تباين الوصول الكامل 100% ما تحقق | جلسة تصميم صغيرة بعد الاستقرار |

#### 🟢 P2 — ديون موثّقة (صفر خطر وظيفي)

| # | المشكلة | المكان |
| --- | --- | --- |
| 9 | `templateEditSchema` يستخدم `.passthrough()` (نمط أضعف من `.strict()` المستخدم ببقية المخططات) | توثيق تدقيق المختبر |
| 10 | `savedViews` INSERT/DELETE بدون audit pairing (بلا سجل تدقيق مقابل) | توثيق تدقيق المختبر |
| 11 | حدود غير متسقة: Equipment Code بحد 200 بدل 60 | توثيق تدقيق المختبر |
| 12 | ثلاث صفحات `new.astro` (معايرة/إعادة اختبار/معدات) بدون try/catch عزل مثل بقية الصفحات | توثيق تدقيق المختبر |
| 13 | التكرارات الموثّقة: `escapeLike` ×9، ترقيم صفحات ×9، خرائط KIND_ICON/LABEL مكررة بين صفحتي الإشعارات، حدود zod مبعثرة، exceljs boilerplate ×3 | 6.1 |
| 14 | ملفات البرومبتات: صناديق stale + تصادم أرقام بين الأجيال + نص v4 داخل v5، و`REPORT.md` أرقامه متقادمة | 6.2 |
| 15 | تحذيرات Vite للـ dynamic imports بالبناء (معروفة، غير حاجزة) | توثيق |

### 4.2 الأخطاء التاريخية المُصلَحة — سجل الدروس

> كل خطأ هنا وقع فعلًا وكُشف بالتدقيق أو بالاختبار و**أُصلح جذريًا مع اختبار انحدار** — أسجلها لأنها تحدد مناطق الحساسية اللي تراجعها بأي شغل جاي.

| الخطأ | وين اكتُشف | الحل الجذري المطبّق | الدرس |
| --- | --- | --- | --- |
| **مسارات تقارير "منفّذة" ما دخلت git أبدًا** — التعديل عدّل libs/UI/tests والـ route files ظلت untracked محليًا (routes وهمية عند HEAD) | تدقيق prompt7 (P0-1) | `route-manifest.mjs` يقارن المسارات بشجرة الملفات + اشتراط tracked-git قبل أي ادعاء E2E | implemented ≠ verified ≠ committed |
| **تسريب متصفح يعلّق E2E كامل** — `e2e-task-search` ما كان يستدعي `browser.close()` فتعلّق الـ runner بعد نجاح الفحوص نفسها | prompt7 (P0-2) + جولات قبول متكررة | cleanup داخل `finally` يغلق contexts/pages/browser + الـ runner صار يقتل أي سويت معلّقة (timeout + SIGKILL) | نجاح الفحوص بلا خروج نظيف = فشل |
| **إعادة اختراع `createLabRetest()`** داخل اعتماد طلب التغيير مع أرقام اختبار مزوّرة `PENDING-CR-*` | prompt7 (P1-3) | الاستدعاء الكنوني فقط + اختبارات انحدار على الأرقام | ما فيه مسار كتابة ثانٍ لأي كيان |
| **`qc_audit_log.task_id` بـ ON DELETE CASCADE** — حذف مهمة يمسح سجل التدقيق معها | prompt7 (P1-4) | migration 032 أعادت البناء بهوية تاريخية بلا cascade مع حفظ السلاسل | التدقيق ما ينتمي لدورة حياة المدوَّن عليه |
| **استيراد WI أسند 33 وثيقة لمستخدم وهمي** (أول مستخدم بالجدول) | prompt7 (P1-5) — والمواصفة الأصلية (prompt6) حذّرت من التلفيق بس ما حددت `created_by` | migration 033: `creation_origin` + `created_by` قابل للفراغ + حقول مصدر الورقة | الفجوة بين نية المواصفة ونصها تصير bug |
| **`isRowEmpty()` يتجاهل عمودين** — صفوف عينات تنحذف بصمت | prompt7 (P1-6) | إضافة العمودين للفحص + اختبار | فقدان البيانات الصامت أخطر من الانهيار الصاخب |
| **نتيجة العينة تسمح HOLD** (مفردات العينة ≠ مفردات النهائي) | prompt7 (P1-7) | فصل `LAB_SAMPLE_RESULT_OPTIONS` عن النهائية مع سماح القالب بالتجاوز المستقبلي | المفردات العلمية ما تُعمم |
| **السلسلة الكاملة تستثني سويتين** (`test:lab-print`, `test:lab-retention`) | prompt7 (P1-8) | تسجيلهما + فحص آلي يقارن الملفات بالمسجلة | السلسلة اللي تستثني ما هي تغطية |
| **endpoint حي للـ VOID بلا e-signature** (بديل صامت للمسار الصفحي المحمي) | تدقيق تنظيف المختبر | حذف الـ endpoint كاملًا | الكود الحي غير المستخدم = ثغرة منتظرة |
| **8 ثغرات أمنية بتدقيق واحد** (1 عالية: `/lab` overview بلا نطاق موظف + 3 متوسطة: سجل retests بلا نطاق، حقن معادلات CSV، حصة AI عامة + 4 منخفضة) | التدقيق الأمني 2026-08-18 | كلها مغلقة باختبارات انحدار — من بينها `sanitizeCsvFormula` و`requireAiRateLimit` per-user | النطاق على مستوى السجل مو الواجهة، وبمنبع واحد للتعقيم |
| **`style-src 'unsafe-inline'` في CSP** | تدقيق evidence | إزالتها واستبدالها بـ hash واحد لبلوك astro-island + تحويل كل inline styles لسمات SVG | الحل البنيوي (inlineStylesheets: never) مو الاستثناء |
| **الإقلاع الإنتاجي يقبل كلمة المرور الافتراضية** | تدقيق evidence (G-07) | رفض إقلاع production بدون `ADMIN_DEFAULT_PASSWORD` + فحص الحسابات المزروعة | سياسة الإقلاع جزء من الأمان |
| **`canEditLabTestDraft` خارج وحدة الصلاحيات** — architecture guard فاشل أسابيع ومحدد يشيله | تدقيق تنظيف المختبر | النقل إلى `permissions.ts` الكنونية | الـ guard اللي يفشل سنة كاملة صار يطبل |
| **خرائط إشعارات ناقصة**: نوع `lab_repeat_failures` مسجل بالصفحة العامة وناقص بصفحة المختبر (رغم ادعاء سجل سابق تحديث الاثنتين) | تدقيق تنظيف المختبر | إضافة الخرائط الناقصة | الادعاء بلا فحص للطرفين يوقّع فجوة |
| **فحوص غير حتمية عند حدود التاريخ** — توقيتات UTC تنزاح يومًا كاملًا بين 00:00–03:00 محليًا (calibration/calendar/task-search) | موثقة متكررة ثم حُسمت بتدقيق التنظيف | مرساة الظهر المحلي بدل UTC noon | الاختبار الحساس للساعة = flake مضمون |
| **عداد ناقص كسر السلسلة كاملة** — `lab-retention-status` ناقص من `deepStrictEqual` بمفاتيح الكتالوج | تدقيق تنظيف المختبر | إضافة المفتاح | عدّادات الاختبارات جزء من العقد |
| **3 ملفات " 2.astro" مكررة** دخلت بـ commit من نسخ macOS العرضية | PROMPT 44 | حذفها بعد إثبات صفر مراجع | مراجعة ما يدخل الـ commit قبل دفعه |
| **خلط `version_number` مع `version`** و`CAST` بلا نوع في SQL | أثناء بناء المركز/المراجعة | إصلاح فوري موثّق | أسماء الأعمدة تتحقق من الـ schema مو من الذاكرة |
| **`date('YYYY-MM')` = NULL** للنافذة الشهرية (مفتاح شهر مو يوم حقيقي) | أثناء اتجاهات FAIL | الحد الأدنى للنافذة يوم حقيقي `YYYY-MM-01` | دوال SQLite التاريخية تختبر بمدخلات حقيقية |
| **ترتيب بارامترات PLACEHOLDER** — أرقام غلط صامتة بلا استثناء بعد إضافة شرط SQL | أثناء اتجاهات FAIL | اختبارات بأرقام دقيقة تكشف الترتيب | الأرقام الصامتة تحتاج فحوص بأرقام حرفية |
| **comma operator بـ allowlist** يبتلع نصف الشرط فالفحص يطلع فارغ | أثناء e2e التدقيق | `||` دائمًا | مراجعة منطق الفحص نفسه مو بس نتيجته |
| **Groq live smoke فشل** (مفتاح/حصة/شبكة — السبب مخفي بالعقد الآمن عمدًا) | محاولة موثّقة | فشل صادق مسجل + السكربت جاهز لإعادة المحاولة بعد التدوير | الفشل الموثق أفضل من نجاح مفبرك |
| **تثبيت offline فشل** — `@astrojs/rss` غير موجود بالمتجر المحلي بعد إعادة بناء modules | جولة التحقق النهائية | الرجوع للتثبيت online | frozen-lockfile + متجر محلي ما يكفي دايمًا |

### 4.3 مشاكل بيئة التطوير المعروفة (مو عيوب نظام — للتوثيق فقط)

- **Sandbox يمنع `listen` (EPERM)** على 127.0.0.1 — الاختبارات الحية تحتاج تشغيلًا غير مقيّد (موثّق بالنمط القائم).
- **السيرفرات الخلفية تنتهي بين استدعاءات الأدوات** — أي اختبار حي يشغّل السيرفر والفحص بنفس الأمر/السكربت.
- **تشخيصات LSP كاذبة متكررة** ("no exported member" على استيرادات جديدة) — `astro check`/`typecheck` هو الحقيقة دائمًا (موثّق بعشرات السجلات).
- **تحذير git fsmonitor IPC** — بيئي، بلا أثر على الملفات.
- **تحذيرات Vite للـ dynamic imports بالبناء** — معروفة وغير حاجزة منذ فترة.

---

## 5. الإصلاحات النهائية (Fixes) — بترتيب الأولوية

> هذي البنود الأربعة هي **شرط الإطلاق**. كل بند إما أمر واحد أو قرار — لا يوجد فيها "إعادة تنفيذ برومبت".

### 5.1 [P0] جلسة E2E قبول واحدة كاملة حتى النهاية

- **المشكلة:** آخر جلسة `e2e:acceptance` كاملة موثّقة توقفت بـ hang (قبل إصلاح التسريب). الإصلاحات موجودة بالكود لكن ما وُثّقت جلسة كاملة بعدها.
- **جاهزية الـ harness — متحقق منها مباشرة بالكود اليوم (ثلاث إصلاحات):**
  1. **تسريب المتصفح مُصلَّح**: `e2e-task-search.mjs` يشغّل كل الفحوص داخل `try` (سطر 285) و`finally` (سطر 502) يغلق كل الـ contexts/pages والـ browser.
  2. **الـ runner محصّن ضد التعليق**: `e2e-acceptance.mjs` عنده CHILD_TIMEOUT مع SIGTERM ثم SIGKILL لأي سويت معلّقة — التعليق صار يستنهى مو يعلّق الجلسة.
  3. **حاجز تنظيف task-shared محلول**: التنظيف أُعيدت هيكلته بحيث **ما يحذف مستخدم الاختبار** بعد الآن (يحترم قيود RESTRICT الجديدة على التدقيق، والقاعدة المستهلكة يزيلها الـ runner) — هذا كان الفشل الموثّق `SQLITE_CONSTRAINT_TRIGGER` عند حذف `emp_create`.
- **الحل النهائي:**
  ```bash
  cd apps/qc-task-manager
  pnpm e2e:acceptance
  ```
- **معيار القبول:** آخر سويت بالسلسلة يخلص + الخروج `exit 0` + صفر hang. أي فشل يُسجّل بالعقل بصراحة — ممنوع تمريره. **مرشّح معروف للفشل**: الفشلات الست السابقة في `e2e-lab-nav` (بند 4.1 #2) — لو ظهرت فهي مشكلة الـ navbar المشترك وتُعالج جذريًا مو بحذف الفحص.

### 5.2 [P0] تدوير مفتاح Groq + smoke حي واحد

- **المشكلة:** المفتاح المشترك سابقًا **انكشف** (تحذير موثّق في prompt3) — خطر أمني قائم بذاته بغض النظر عن الإطلاق. والتحقق الحي للمزوّد ما تم أبدًا (الـ mock كله أخضر).
- **الحل النهائي:** (1) إبطال المفتاح القديم وتوليد جديد من لوحة Groq — **قرار بيدك أنت حصريًا**. (2) بعده smoke واحد:
  ```bash
  GROQ_API_KEY=<الجديد> node scripts/smoke-ai-live.mjs
  ```
- **معيار القبول:** استجابة واحدة ناجحة موثّقة، أو توثيق صريح أن الـ 15 ميزة AI تعمل بالـ fail-safe بدون مزوّد حي (مقبول للإطلاق بشرط التوثيق الصادق).
- **بدون هالخطوة:** لا تضيف `GROQ_API_KEY` لبيئة الإنتاج إطلاقًا.

### 5.3 [P0] نظافة git قبل أول نشر

- **البند أ:** إخراج ملفي القاعدة الفارغين من التتبع (قرارك — يلمس تاريخ التتبع):
  ```bash
  git rm --cached qc_tasks.db "qc_tasks 3.db"
  # + إضافة qc_tasks*.db إلى .gitignore
  ```
- **البند ب:** الالتزام بالحركات المعلقة في working tree (نقل ملفات audit القديمة إلى `audit/qc/before/` + `report-SEO.md`) — شغلك.
- **معيار القبول:** `git status` نظيف + `git ls-files | grep '\.db'` فارغ.

### 5.4 [P1] حسم السويتات اليتيمة (فجوة تغطية `/lab/search`)

- **المشكلة:** `test-lab-search.mjs` غير مسجل بسلسلة `test` إطلاقًا، و`e2e-lab-search.mjs` غير مسجل بالـ acceptance وفيه فشل RBAC موثّق عند آخر فحص.
- **الحل النهائي (اختر واحد):**
  - **الخيار الموصى به:** إصلاح فشل RBAC بالسويت + تسجيل الاثنين بالسلاسل (سكربت تسجيل واحد بـ package.json + e2e-acceptance.mjs — نفس النمط المتبع مع كل سويت سابقة).
  - الخيار البديل: نقل فحوصات `/lab/search` الحية إلى سويت قائمة (مثل test-lab-suggest اللي يغطي جزءًا من السلوك) وحذف اليتيمَين — بقرار موثّق بالعقل.
- **معيار القبول:** لا يوجد ملف اختبار في `scripts/` خارج السلاسل المسجلة (فحص آلي بسيط يقارن الملفات بالمسجلة).

---

## 6. التحسينات (Improvements) — مطلوبة، غير حاجزة للإطلاق

### 6.1 توحيد التكرارات الموثّقة (ديون الجودة)

كل بند شغله ساعات قليلة ويقلل صيانة المستقبل بشكل ملموس:

| التكرار | الحل | الأثر |
| --- | --- | --- |
| `escapeLike` مكرر ×9 بنفس الجسم | وحدة واحدة (مثلًا `src/lib/db-utils.ts`) والاستيراد منها | منبع واحد لهرّب LIKE |
| مكوّن ترقيم صفحات مكرر verbatim ×9 صفحات مختبر | `LabPagination.astro` مشترك | إصلاح واحد ينعكس على 9 صفحات |
| خرائط KIND_ICON/KIND_LABEL مكررة بين صفحتي الإشعارات | ملف خرائط مشترك واحد | إضافة نوع إشعار جديد ما تعود تكسر صفحة |
| حدود zod مبعثرة (validation.ts مواضع متعددة) | تجميعها في `policy.ts` مع بقية الثوابت | تغيير حد = مكان واحد |
| exceljs CJS interop boilerplate ×3 | helper واحد للاستيراد والإنشاء | توحيد نمط الكتابة |

### 6.2 صيانة ملفات البرومبتات (نصية فقط — دقائق)

1. **إنشاء `INDEX.md`** في مجلد البرومبتات: التسلسل الزمني للأجيال السبعة + أي ملف يلغي أيًّا + التصريح أن العقل هو مصدر الحقيقة للأرقام. هذا يمنع أي وكيل مستقبلي من تنفيذ برومبت قديم بالغلط (الأرقام متصادمة بين الأجيال).
2. تحديث صناديق FINAL EXECUTION ORDER في prompt4/5 لتطابق الواقع (✅).
3. إزالة نص "You are DeepSeek Flash v4" الباقي داخل حزمة v5.
4. **أرشفة `REPORT.md` المتقادم**: أرقامه (26 migration / 98 مسار / 42 test) تضلل — استبداله بتوجيه سطر واحد لـ `README.md` وهذا التقرير، أو حذفه بقرارك.

### 6.3 تقارير وتوثيق

- تحديث `README.md` بعد الإطلاق الفعلي (الأرقام النهائية + تاريخ النشر + URL).
- إضافة سطر بـ `docs/DEPLOYMENT.md` يشير لهذا التقرير كقائمة الإطلاق المعتمدة.

---

## 7. التكاملات (Integrations) — سد الفجوات الوظيفية المتبقية

### 7.1 [موصى به قبل الإطلاق أو مباشرة بعده] حالة WITHDRAWN لطلبات التغيير

- **الفجوة:** المساهم اللي قدّم change request وما عاد يبغاه **ما يقدر يسحبه** — السكيما الحالية بلا حالة سحب، والقرار الموثّق (سجل 020) رفض تعيين السحب على REJECTED حفاظًا على دلالة التدقيق. هذي **آخر فجوة موثّقة بالدورة الوظيفية للمختبر**.
- **الحل النهائي:** migration صغيرة (حالة `WITHDRAWN` + شرط: السحب من صاحب الطلب فقط وب状态 PENDING فقط) + زر Withdraw بصفحة تفاصيل الطلب + فعل تدقيق مستقل (`WITHDRAW`) — لا يعاد استخدامه دلالة REJECTED. مع اختبار وحدوي بنمط السويتات القائمة.

### 7.2 تكاملات منفّذة أصلًا (للتوثيق — ما تحتاج شي)

- الإشعارات: جدول واحد + حالة قراءة مشتركة بين الجرس العام و`/lab/notifications` ✅
- التقويم مشتق من التواريخ الحقيقية بلا جدول ثانٍ ✅
- لوحة المؤشرات الرئيسية فيها قسم مختبر كامل مع عزل فشل ✅
- `system-health` مرتبطة من إعدادات الأدمن ✅
- التقارير: endpoint واحد يخدم 24 نوعًا بالصيغ الثلاث ✅

### 7.3 تكامل مستقبلي مؤجل عن قصد (مو قبل الإطلاق)

- **قناة إشعار خارجية** (إيميل/WhatsApp/Teams): التصميم الحالي in-app فقط — التجريد جاهز مفاهيميًا (نظام إشعار واحد). لو صار طلب تشغيلي، يُبنى كـ "ناقل" فوق نفس الجدول.
- **تكامل مع الموقع العام**: النظام داخلي ومقصود كذا — ما يُربط بالموقع العام إطلاقًا (ولا يُفهرس).

---

## 8. الإضافات (Additions) — مقترحات لما بعد الاستقرار

| الإضافة | القيمة | الكلفة التقديرية | الأولوية |
| --- | --- | --- | --- |
| **Soft-delete بدل الحذف الصلب** بعد الموافقة | امتثال رسمي أعلى — السجل يبقى قابل للاسترجاع | migration + تعديل مسار الحذف + اختبارات | أول جلسة قرار إذا صار النظام مرجع امتثال رسمي |
| **Command palette + اختصارات كيبورد** | سرعة مشغّلي الجودة اليومية | React island واحد فوق مسارات موجودة | بعد شهر تشغيل فعلي (تجيب أولًا أنماط الاستخدام) |
| Tags/تصنيفات للمهام + ملف شخصي للمستخدم | تنظيم أدق | migrations صغيرة | منخفضة — مو Core |
| Health Score للمهمة + إسناد ذكي متقدم | فوق الاقتراحات الموجودة (اقتراحات إسناد بالقسم) | تحليل + وحدة قراءة | منخفضة |
| بحث FTS5 كامل | أداء بحث أعلى عند حجم بيانات كبير | SQLite extension + فهرس | مؤجلة بقرار prompt7 — ما تحتاجها الحين |
| تصدير تلقائي دوري للتقارير للأرشفة | راحة امتثال | cron فوق pipeline التقارير القائم | متوسطة بعد الإطلاق |

---

## 9. خطة الإطلاق النهائية — الترتيب الحاسم

> ثلاث جلسات عمل، لا أكثر. كل بند له معيار قبول صريح.

### الجلسة 1 — الإغلاق المحلي (نصف يوم)

1. `pnpm e2e:acceptance` كاملة حتى النهاية (5.1)
2. حسم السويتات اليتيمة (5.4)
3. `git rm --cached` للملفين + `.gitignore` (5.3-أ)
4. الالتزام بكل الحركات المعلقة + رسالة commit واحدة (شغلك)
5. **قرار WITHDRAWN**: إما تنفيذها الحين (7.1 — ساعات) أو توثيق تأجيلها بقرار صريح

### الجلسة 2 — الإطلاق (نصف يوم)

1. إبطال مفتاح Groq القديم + توليد جديد (بيدك — لوحة Groq)
2. Smoke حي واحد (5.2) — لو فشل: النشر يمشي بدون `GROQ_API_KEY` (fail-safe مضمون بنيويًا)
3. أول deploy من Render dashboard بالقيم: `QC_DATABASE_PATH`, `QC_BACKUP_DIR`, `NODE_ENV=production`, `ADMIN_DEFAULT_PASSWORD` (قوي — النظام يرفض الافتراضي)
4. على القرص الدائم: `pnpm db:init` (أو أول login ينشئ القاعدة)
5. **إنشاء Render Cron Job** لتشغيل `pnpm notify:daily` يوميًا (بدونه ما تنزرع تذكيرات المعايرة/المراجعة/الإقرارات — الجدولة الداخلية للنسخ الاحتياطي مستقلة وشغالة)
6. تفعيل HTTPS/النطاق إذا رُبط نطاق خاص

### الجلسة 3 — التحقق بعد الإطلاق (ساعة)

قائمة التحقق الحية (موثّقة أصلًا في DEPLOYMENT.md):

- [ ] `/api/health` = 200 مع `schemaVersion` الصحيح
- [ ] login بكل دور من الأربعة + تغيير كلمات المرور الافتراضية فورًا
- [ ] إنشاء مهمة حقيقية كاملة الدورة (إنشاء → تنفيذ → دليل → إغلاق)
- [ ] إنشاء اختبار مختبر والمرور بدورته حتى الاعتماد (مع e-signature)
- [ ] توليد تقرير CSV/XLSX/PDF من بيئة الإنتاج
- [ ] `/admin/system-health`: كل المؤشرات خضراء + أول backup ناجح مُتحقق منه
- [ ] تشغيل الـ cron مرة يدوية والتأكد من زرع الإشعارات idempotent
- [ ] التحقق أن الموقع العام (brightai.site) ما تأثر بشي (خدمة مستقلة)

**بوابة GO/NO-GO النهائية:** كل بنود الجلسة 3 خضراء = النظام مُطلق رسميًا — سجّلها بالعقل كأول verified-in-production.

---

## 10. التشغيل بعد الإطلاق (Operations)

| الإيقاع | الفعل | الأداة الجاهزة |
| --- | --- | --- |
| يومي (تلقائي) | نسخ احتياطي + إشعارات مجدولة | scheduler داخلي + Render Cron |
| أسبوعي | مراجعة `/admin/system-health` + `pnpm db:status` | الصفحة + db-doctor |
| أسبوعي | مراجعة مركز جودة البيانات (19 كاشف read-only) | `/lab/data-quality` |
| شهري | **تجربة استرجاع حقيقية** | `scripts/test-production-operations.mjs` (موجود ويغطي backup→mutation→restore→integrity) |
| شهري | مراجعة retention (وعي، بلا حذف تلقائي) | تقرير `lab-retention-status` |
| عند كل تحديث | توثيق بالعقل + `verifyAllAuditChains` | العقل + `/admin/system-health` |
| الحوادث | استرجاع | `docs/RESTORE.md` + `docs/DEPLOYMENT.md` |

**قواعد تشغيل حاكمة (موروثة ومجربة):** مثيل كتابة واحد دائمًا (`QC_HORIZONTAL_SCALING` مرفوض) · لا تشغيل migrations يدوي من SQL IDE أبدًا (الـ runner فقط) · أي تحديث يمر بـ typecheck + test + build قبل النشر · العقل يتحدث بعد كل مهمة.

---

## 11. القرارات المعلقة عندك حصريًا (لا ينفذها وكيل بلا إذن)

| # | القرار | التوصية |
| --- | --- | --- |
| 1 | الالتزام (commits) بكل التغييرات المعلقة | قبل الجلسة 2 |
| 2 | `git rm --cached` لملفي القاعدة | نعم — فورًا |
| 3 | إبطال مفتاح Groq القديم وتوليد بديل | نعم — إلزامي قبل أي ربط إنتاج |
| 4 | تنفيذ WITHDRAWN الحين أو تأجيله الموثق | التأجيل مقبول — بس وثّقه |
| 5 | soft-delete | أجّله لما يصير النظام مرجع امتثال رسمي |
| 6 | مصير `REPORT.md` المتقادم | استبداله بتوجيه أو حذفه |
| 7 | النشر نفسه (كل النشر بيدك — القاعدة الثانية) | بعد الجلسة 1 |

---

## ملحق — أوامر التحقق المرجعية

```bash
cd apps/qc-task-manager

pnpm typecheck                    # 0 errors / 0 warnings / 17 hints (متحقق اليوم)
pnpm test                         # السلسلة الكاملة — exit 0
NODE_ENV=production pnpm build    # Complete
pnpm db:status                    # حالة القاعدة بدون أي تعديل
pnpm e2e:acceptance               # بوابة الإطلاق رقم 1 — حتى النهاية
node scripts/route-manifest.mjs   # جرد المسارات مقابل الشجرة الفعلية
```

---

> **تنبيه أخير:** هذا التقرير لقطة يوم 2026-08-23. مصدر الحقيقة الدائم هو `.agents/mind/01-mind-latest.md` — أي تعارض مستقبلًا، العقل يكسب.

---

# 12. حزمة البرومبتات التنفيذية للتقرير (PROMPT 022–029)

> **الغرض:** تحويل كل بند قابل للتنفيذ في هذا التقرير إلى برومبتات جاهزة للتنفيذ التسلسلي، بنفس عقد الحزم السابقة (prompt5-LAB وprompt7 هما النموذج الأقوى: READ FIRST + Non-goals + Verification + Acceptance لكل برومبت). الترقيم يكمل تسلسل prompt7 الذي انتهى عند 021 — لهذا الحزمة تُدرج في فهرس الأجيال عند تنفيذ PROMPT 026.
>
> **خارج نطاق الحزمة (بيد المستخدم حصريًا — قسم 11):** تدوير مفتاح Groq، `git rm --cached` لملفي القاعدة، الالتزامات (commits)، النشر على Render، إنشاء الـ Cron Job. هذي قرارات وتشغيل، مو برومبتات.
>
> **مؤجل عن قصد:** كل إضافات قسم 8 (soft-delete، command palette، FTS5، ...) — بعد الاستقرار التشغيلي، بنطاقات مستقلة.

## القواعد الحاكمة للحزمة (موروثة — تسري على كل برومبت)

1. اقرأ `.agents/mind/01-mind-latest.md` كاملًا قبل أي برومبت + القسمان 4 و5 من هذا التقرير.
2. **implemented ≠ verified** — لا تدّعي نجاح شي ما اشتغل. لا PASS بدون `exit 0` موثّق.
3. لا commit ولا push ولا deploy، ولا تعديل `.env*` أو `.github/workflows/`.
4. **migrations**: ملف `0NN_*.sql` جديد فقط + `?raw` import في `db.ts` + `embeddedMigrations` + مرآة `schema.sql` + تحديث العدادات في السكربتات الثلاثة (test-migrations / test.mjs / test-dashboard-reports). أي توسيع لـ CHECK على `qc_audit_log` يتم **حصريًا** بنمط إعادة البناء الحافظ للصفوف (marker `-- brightai:allow-destructive` + backup تلقائي + فحص سلامة السلاسل قبل/بعد) الموثّق في migrations 011/032.
5. **CSP**: صفر inline styles/scripts — أي سكربت صفحة جديد = ملف خارجي في `public/scripts/` (الدرس المعماري الموثّق).
6. `permissions.ts` مصدر الصلاحيات الوحيد؛ نطاق الموظف بالمختبر `tested_by OR created_by`؛ منع self-review/self-approval بنيويًا.
7. أي نوع إشعار جديد يُسجّل في **الأربعة أماكن**: `NotificationKind` + `PERSISTED_SEVERITY` + خرائط الصفحتين (`notifications.astro` + `lab/notifications.astro`).
8. بعد كل برومبت: سجل كامل بأعلى `01-mind-latest.md` (وش تغيّر + الأوامر + النتائج الحرفية + غير المتحقق صراحةً).

## الاعتمادات والترتيب

| الترتيب | البرومبت | يعتمد على | طبيعته |
| --- | --- | --- | --- |
| 1 | 022 — بوابة E2E الكاملة | — | تشغيل تحقق (+إصلاح جذري مشروط) |
| 2 | 023 — تسوية السويتات اليتيمة | بعد 022 | تسجيل يغيّر قبول اللاحقين |
| 3 | 024 — توحيد التكرارات | — | refactor سلوك محايد |
| 4 | 025 — WITHDRAWN لطلبات التغيير | يُفضّل بعد 024 | migration + ميزة |
| 5 | 026 — صيانة ملفات البرومبتات | — | docs-only، بأي وقت |
| 6 | 027 — تحصينات P2 الصغيرة | — | إصلاحات صغيرة مستقلة |
| 7 | 029 — بوابة التحقق النهائية | كل ما سبق + قرارات المستخدم (5.2/5.3) | **قبل النشر مباشرة** |
| 8 | 028 — توثيق ما بعد الإطلاق | **بعد أول نشر فعلي** | conditional |

---

## PROMPT 022 — بوابة E2E الكاملة (تشغيل تحقق + إصلاح جذري مشروط)

**READ FIRST:** القسمان 5.1 و4.1 من هذا التقرير + آخر سجلات العقل + `scripts/e2e-acceptance.mjs` (آلية CHILD_TIMEOUT) + `scripts/e2e-task-search.mjs` (بنية try/finally).

**النطاق:** تشغيل وتوثيق بالدرجة الأولى. تعديل كود مسموح **فقط** إذا ظهرت فشلات فعلية.

**المتطلبات:**
1. سجّل `git rev-parse HEAD` و`git status --porcelain` قبل البدء (شرط قابلية إعادة الإنتاج).
2. شغّل `pnpm e2e:acceptance` كاملًا حتى آخر سويت — لا إيقاف مبكر، لا تشغيل انتقائي.
3. وثّق قائمة السويتات كلها مع passed/failed لكل واحدة حرفيًا.
4. **لو ظهرت الفشلات الست الموثّقة في `e2e-lab-nav`** (4× رابط المختبر بقائمة الجوال + POST مزوّر + overflow عند 1024): أثبت أولًا أنها سابقة (stash + rerun على HEAD نظيف)، ثم أصلح **الجذر في الـ navbar المشترك** — ممنوع منعًا باتًا تخفيف الفحص أو حذفه.

**Non-goals:** لا تعدّل فحوصًا لتعدي · لا تحذف سويت · لا تدّعي PASS جزئيًا · لا تعديلات وقائية خارج موضع الفشل المثبت.

**Verification:** `pnpm e2e:acceptance` → exit 0 + `pnpm typecheck` + `git diff --check`.

**Acceptance:** جلسة واحدة كاملة لآخر سويت + صفر hang + سجل عقل بأرقام حرفية لكل سويت. لو بقي فشل: النتيجة توثّق **NO-GO** بصراحة — ما يتقدم للبرومبت التالي إلا بقرار صريح من المستخدم.

---

## PROMPT 023 — تسوية السويتات اليتيمة (تسجيل + حارس)

**READ FIRST:** البندان 5.4 و4.1#5 + `scripts/test-lab-search.mjs` + `scripts/e2e-lab-search.mjs` + `package.json` + `scripts/e2e-acceptance.mjs` + سجل فشل الـ RBAC الموثّق عند HEAD.

**المتطلبات:**
1. شخّص فشل الـ RBAC الموثّق في `e2e-lab-search.mjs` (موظف يرى ما لا يملك): أصلح الجذر — إن كان بالنظام فهو bug حقيقي يُصلح بـ regression test؛ وإن كان بالفحص (توقع خاطئ) يُصحح التوقع بقرار موثّق يبين ليش.
2. سجّل `test:lab-search` في سلسلة `test` بـ package.json، و`e2e-lab-search` في `e2e-acceptance.mjs` — بنفس نمط تسجيل كل سويت سابقة.
3. أنشئ `scripts/verify-test-registry.mjs`: يقارن ملفات `test-*.mjs` و`e2e-*.mjs` في `scripts/` بالمسجّل في package.json وe2e-acceptance — **يفشل عند أي يتيم** (أو يعلّمه ضمن قائمة استثناء موثقة داخل السكربت نفسه مع سبب لكل استثناء). سجّله في سلسلة `test`.

**Non-goals:** لا تضعف أي assertion · لا تنقل فحوصات بدون سبب موثّق.

**Verification:** `node scripts/verify-test-registry.mjs` + `pnpm test` + `pnpm e2e:acceptance` (تتضمن المسجّل الجديد).

**Acceptance:** صفر سويت يتيم (أو استثناءات موثقة بأسباب) + السلسلتان خضراوان.

---

## PROMPT 024 — توحيد التكرارات الموثّقة (سلوك محايد 100%)

**READ FIRST:** البند 6.1 + جرد grep لمواضع `escapeLike` التسعة + مواضع نسخ الترقيم التسعة + خرائط KIND_ICON/KIND_LABEL في صفحتي الإشعارات + مواضع حدود zod المذكورة بالتدقيق + كتّاب exceljs الثلاثة.

**المتطلبات:**
1. `escapeLike` → منبع واحد (وحدة مشتركة أو تصدير من وحدة قائمة) والاستيراد من كل المواضع التسعة.
2. مكوّن `LabPagination.astro` مشترك يستبدل النسخ المتطابقة في الصفحات التسع (الفروق الحقيقية إن وجدت تُمرر props — لا نسخ عاشرة).
3. خرائط إشعارات الصفحتين → ملف مشترك واحد يستورده الاثنان، مع ترقية النوع الضعيف `Record<string,string>` إلى نوع دقيق مشترك.
4. حدود zod المبعثرة (المواضع الموثّقة بالتدقيق) → تتجمع في `policy.ts` مع بقية الثوابت.
5. exceljs CJS interop → helper واحد للاستيراد/الإنشاء تستخدمه الكتّاب الثلاثة.

**Non-goals:** صفر تغيير سلوك — أي فرق سلوكي = فشل البرومبت · لا لمس منطق الاستعلامات أو الـ SQL · لا تعديل فحوص (يسمح فقط بتحديث مسارات استيراد).

**Verification:** grep يثبت تعريف `escapeLike` واحد + `pnpm test` كامل + `pnpm typecheck` + `NODE_ENV=production pnpm build` + `pnpm test:architecture`.

**Acceptance:** السلسلة خضراء بدون أي تعديل فحص خارج الاستيرادات + grep counts موثّقة بالسجل.

---

## PROMPT 025 — حالة WITHDRAWN لطلبات التغيير

**READ FIRST:** البند 7.1 + `src/lib/lab/changeRequests.ts` + migration 011 و032 (نمط توسيع CHECK الحافظ للصفوف) + صفحة تفاصيل الطلب + صفحة الإدارة + خرائط الإشعارات بالصفحتين.

**المتطلبات:**
1. **Migration 036**: إضافة `WITHDRAWN` لـ CHECK حالة `lab_change_requests` (إعادة بناء حافظة للصفوف بنمط 032) + توسيع CHECK فعل `qc_audit_log` بفعل `WITHDRAW` إن لم يكن موجودًا (بنفس النمط الحافظ + backup + فحص سلامة السلاسل قبل/بعد).
2. **الخدمة**: `withdrawLabChangeRequest` — صاحب الطلب فقط (بإعادة تحقق server-side من الجلسة) + الحالة `PENDING` فقط + **سبب سحب إلزامي** (بنمط سبب الرفض) + فعل تدقيق `WITHDRAW` منفصل دلاليًا عن `REJECTED`.
3. **الإشعار**: نوع جديد `lab_change_review_withdrawn` للمراجعين النشطين (manager/admin) — مسجّل في الأماكن الأربعة (القاعدة 7 أعلاه).
4. **الواجهة**: زر Withdraw بصفحة تفاصيل الطلب لصاحبه المعلّق فقط + بادج حالة + عرض السبب للإدارة.
5. **الاتساق**: عدّادات وفلاتر الإدارة تستبعد `WITHDRAWN` من pending؛ الطلب المسحوب لا يُفتح للمراجعة أبدًا؛ الطلبات المنتهية (APPROVED/REJECTED) لا تُسحب.

**Non-goals:** لا يُعاد استخدام REJECTED دلالةً للسحب · لا تغيير على دورة الطلبات المنتهية · لا نظام إشعار ثانٍ.

**Verification:** `pnpm test:migrations` (fresh + upgrade 035→036 + سلامة السلاسل) + توسيع `test-lab-change-requests.mjs` بالحالات: صاحب يسحب بنجاح (حالة + أوديت + إشعار) · غير الصاحب مرفوض · غير PENDING مرفوض · السبب الإلزامي · سلاسل التدقيق سليمة بعد إعادة البناء + `pnpm test` كامل.

**Acceptance:** كل الحالات خضراء + `verifyAllAuditChains` سليمة + واجهتا الإشعارات تعرضان النوع الجديد.

---

## PROMPT 026 — صيانة ملفات البرومبتات (docs-only)

**READ FIRST:** البند 6.2 + فهرس مجلد `audit/qc/QC-Task-Manager/` الحالي.

**المتطلبات:**
1. أنشئ `INDEX.md` بالمجلد: التسلسل الزمني للأجيال السبعة + خريطة الإلغاء/الاستبدال بين الملفات (prompt2 يلغي تعارضات prompt1 · 38–40 من prompt4 مستبدلة بـ 57–59 من prompt5...) + التصريح أن العقل هو مصدر الحقيقة لأي رقم + إدراج هذي الحزمة (022–029) والتقرير.
2. حدّث صناديق FINAL EXECUTION ORDER في prompt4 وprompt5 لتطابق حالة ✅ الفعلية.
3. أزل نص "You are DeepSeek Flash v4" الباقي داخل قواعد prompt5 (نسخة v5).
4. أضف ملاحظة قصيرة أعلى قسم الترتيب في prompt6 توضح انعكاس ترتيب 007/005 مقابل ترقيم الـ migrations ولماذا نفّذ التاريخ فعليًا بترتيب صحيح.
5. ضع لافتة تقادم بأعلى `REPORT.md` تشير لـ `README.md` وهذا التقرير.

**Non-goals:** لا تعديل محتوى البرومبتات التاريخي خارج البنود الخمسة · لا حذف ملفات.

**Verification:** grep — INDEX موجود ومدرج به 022–029 · صفر "Flash v4" في prompt5 · اللافتة موجودة أعلى REPORT.md.

**Acceptance:** كل فحوص grep خضراء (docs-only — لا build يلزم).

---

## PROMPT 027 — تحصينات P2 الصغيرة الموثّقة

**READ FIRST:** البند 4.1 P2 (#9–12) + المواضع الأربعة الموثّقة بالتدقيق (templateEditSchema · صفحات new.astro الثلاث · حد Equipment Code · savedViews).

**المتطلبات (كل بند إما يُنفّذ باختبار أو يُؤجّل بقرار موثق — صفر بند صامت):**
1. `templateEditSchema`: جرد المفاتيح المرسلة فعليًا من النماذج، ثم التحويل من `.passthrough()` إلى `.strict()` مع إضافة أي مفتاح شرعي صراحة للمخطط.
2. عزل try/catch لثلاث صفحات `new.astro` (معايرة/إعادة اختبار/معدات) بنمط الصفحات القائمة.
3. Equipment Code: قِس أطول كود بالبذر والبيانات الفعلية، ثم ثابت مخصص بـ `policy.ts` (المتوقع 60) مع تحديث zod واختبار — مع إثبات أن الكود الموجود كله يمر.
4. savedViews audit pairing: إما توسيع CHECK بكيان/أفعال مناسبة بنمط الحفظ (backup + سلامة السلاسل) وتسجيل الأحداث، أو قرار تأجيل موثق بالعقل يبين الكلفة/القيمة.

**Verification:** `pnpm test` + `pnpm typecheck` + `NODE_ENV=production pnpm build` (+ `pnpm test:migrations` إن نُفذ البند 4 بالتوسيع).

**Acceptance:** لا بند من الأربعة بلا مصير موثّق + السلاسل خضراء.

---

## PROMPT 028 — توثيق ما بعد الإطلاق (conditional — بعد أول نشر فعلي فقط)

**READ FIRST:** البند 6.3 + `README.md` + `docs/DEPLOYMENT.md` + سجل النشر بالعقل.

**المتطلبات:**
1. حدّث `README.md` بأرقام ما بعد الإطلاق: تاريخ النشر الفعلي + الـ URL + الحالة التشغيلية + أي تغيّر بالأرقام منذ هذا التقرير (تحقق من الكود وقتها — مو نقلًا عن هنا).
2. أضف بـ `docs/DEPLOYMENT.md`: رابط هذا التقرير كقائمة الإطلاق المعتمدة + سطر تشغيل الـ Cron Job اليومي (`notify:daily`).
3. سجّل بالعقل سجل "first verified-in-production" (النتائج الحية من قائمة الجلسة 3 بالتقرير).

**Non-goals:** لا تنفّذ هذا البرومبت قبل نشر فعلي — وضعه conditional مقصود.

**Verification:** docs-only (grep على الأرقام مقابل الكود).

**Acceptance:** كل رقم بالتوثيق مطابق للكود الفعلي وقت التنفيذ.

---

## PROMPT 029 — بوابة التحقق النهائية قبل النشر (GO/NO-GO)

**READ FIRST:** القسم 9 كاملًا + هذا التقرير كاملًا + سجلات تنفيذ 022–028 بالعقل.

**المتطلبات (تحقق فقط — صفر تغيير كود):**
1. **قابلية إعادة الإنتاج**: `git rev-parse HEAD` + `git status --porcelain` نظيف (كل الالتزمات تمت).
2. **نظافة الريبو**: `git ls-files | grep '\.db'` فارغ (بند 5.3 منفّذ).
3. **السلسلة الكاملة**: `pnpm install --frozen-lockfile` → اختبارات الجذر → `pnpm typecheck` → سلسلة `pnpm test` كاملة → `NODE_ENV=production pnpm build` → `pnpm db:init` على قاعدة طازجة (عدد migrations/الجداول/الـ seeds/integrity/FK موثّقة) → `pnpm e2e:acceptance` كامل exit 0.
4. **الحوارس**: `node scripts/route-manifest.mjs` مطابق + `node scripts/verify-test-registry.mjs` أخضر.
5. **القرار**: تقرير GO/NO-GO بأدلة حرفية لكل فحص + قائمة صريحة بقرارات المستخدم المتبقية (تدوير Groq + smoke إن لم يتمّا، والنشر نفسه).

**Non-goals:** لا نشر · لا commit · لا تمرير أي فشل · لا "conditional pass" غير موثّق.

**Acceptance:** كل فحص له نتيجة حرفية + قرار GO/NO-GO صريح مسجّل بالعقل — النشر بعدها قرار المستخدم حصريًا.

---

> **ملاحظة ختامية للحزمة:** الترتيب التنفيذي: **022 → 023 → 024 → 025 → 026 → 027 → 029 → (نشر) → 028**. أي فشل عند أي برومبت يوقف التسلسل ويُوثّق — الاستمرار بقرار صريح من المستخدم فقط.

---


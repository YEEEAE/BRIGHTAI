# Final Pilot Readiness — QC-COMPANY-PILOT-GATE-021

**Verification date:** 2026-08-28  
**Verifier:** Independent final verifier  
**Repository state verified:** `b51504b7ae4e0b8a424a23c6190a43de9a0d2670` on `main...origin/main`  
**Initial working tree:** clean  
**Runtime:** Node `v22.23.1`; pnpm `10.19.0`

## Final classification: CONDITIONAL GO

The current source passes the requested application gates, production-like SQLite restore drill, full isolated acceptance run, and accessibility gate. It is **not a GO** because the repository hygiene gate exits non-zero for two tracked zero-byte SQLite files, and neither real deployment verification nor human UAT evidence was supplied.

**RUNTIME USER UAT REQUIRED.** No human UAT result is claimed in this report.

## A. Completed

- Ran the required type, manifest, route, migration, full-test, production-build, and full E2E acceptance gates on the stated HEAD.
- Confirmed embedded migration parity: all 38 migrations are byte-identical to the embedded registry; current schema version is 38.
- Ran a fresh production-like SQLite drill: migrations, `integrity_check`, `foreign_key_check`, both audit chains, backup creation/verification, restore, and post-restore persistence all passed.
- Confirmed the E2E acceptance runner completed with exit 0 using 28 isolated workflow databases plus its two-phase restart-persistence database. Its suite catalog covers task workflow, laboratory, documents, master data, reports, backup, auth/RBAC/security, responsive UI, and a11y.
- Confirmed the a11y report for 12 pilot pages: Critical `0`, Serious `0`, Moderate `0`, Minor `0`.
- Confirmed WI source coverage is restricted to supplied controlled material only: page 1 has exactly 33 source-exact rows; pages 2 and 3 are rejected until supplied.

## Scorecard

Scores reflect current-source and local-runtime evidence only. They are not a substitute for real-user UAT or a live deployment drill.

| Area | Score | Evidence | Remaining gap | Severity |
| --- | ---: | --- | --- | --- |
| Backend | 96% | `pnpm test`, E2E acceptance, architecture guard all exit 0 | Live service observability not verified | P1 |
| Database | 95% | Migration v38; migrations, parity, DB doctor, integrity and FK checks pass | No real persistent-disk inspection | P1 |
| Authentication | 94% | Password-lifecycle and auth-lockout suites pass; production-default guard covered | Real identity-provider/production configuration not exercised | P1 |
| RBAC | 96% | Unit and E2E role/record-scope checks pass, including forged-scope denial | Human role-permission UAT still required | P1 |
| Security | 84% | CSRF, Fetch Metadata, request size, sessions, rate limits, secret-log checks pass | `verify-security-hygiene` exits 1: tracked `qc_tasks.db` and `qc_tasks 3.db` | P1 |
| Tasks | 95% | E2E task-shared covers create, assign, progress, comment, evidence, complete and authorized terminal actions | Human workflow timing/usability not evidenced | P1 |
| QC Operations | 93% | QC operations, workflow, findings, audit and E2E suites pass | Live operating procedure not exercised | P1 |
| Laboratory | 94% | Draft/sample entry, submit, review, approve/e-sign, immutable approval and print are covered by lab E2E/tests | Human laboratory acceptance required | P1 |
| Documents | 84% | Document catalog, drafts, content, submit/review/approve/revision and immutable versions pass | Controlled pages 2/3 and 3/3 have not been supplied | P1 |
| Equipment / Calibration | 93% | Equipment, maintenance and calibration test/E2E suites pass | Real instrument records not UAT-tested | P1 |
| Reporting | 96% | CSV, XLSX, PDF, audit report, authorization/scope and print suites pass | Real report-consumer acceptance required | P1 |
| Audit | 96% | Audit-integrity/user-audit and post-restore task/QC chains pass | Live retention/operational review not run | P1 |
| Notifications | 93% | Notification/workflow suites pass | Scheduled delivery not observed in live service | P1 |
| Backup / Restore | 94% | Backup verification, corruption refusal, restore drill and restart persistence pass on temporary DBs | Real persistent-volume restore drill not run | P1 |
| Deployment | 83% | Deployment contract (21 checks) passes; one-writable-instance and paths are pinned | Manual Render service, disk, health probe and live backup remain unverified | P1 |
| Testing | 96% | 60 canonical unit suites, 28 canonical E2E suites, manifest guards and full acceptance exit 0 | CI/live execution not inspected | P1 |
| Accessibility | 100% | axe pilot gate: Critical 0, Serious 0 across 12 pages; keyboard checks included | Assistive-technology human test still required | P1 |
| UI Consistency | 92% | Responsive E2E, UI-consistency and visual technical checks are in acceptance | Product/design stakeholder review not supplied | P2 |
| UX Technical Readiness | 90% | Form productivity, error/empty states, navigation and focus checks pass | Human completion-time/error-rate evidence absent | P1 |
| Responsive Design | 96% | Responsive suite covers 18 screens × 4 viewports; acceptance exits 0 | Real-device/browser matrix not supplied | P2 |
| Performance | 88% | Performance suite is in the passing canonical test set | No current live/4G performance measurement | P2 |
| Operational Readiness | 81% | Restore/backup/deployment contracts and observability tests pass | Resolve hygiene gate, execute live checklist, and complete UAT | P1 |

**Final percentage: 92/100** (unweighted mean of the 22 scored areas, rounded from 92.23).

## B. Remaining P0 / P1 / P2

### P0

- None found in the current local verification.

### P1

- Remove the two tracked empty database files from version control through an approved change: `apps/qc-task-manager/qc_tasks.db` and `apps/qc-task-manager/qc_tasks 3.db`; rerun `node scripts/verify-security-hygiene.mjs` until exit 0. They are both currently 0 bytes and contain no tables, but their tracked presence fails the security hygiene gate.
- Complete the manual single-instance Render deployment checklist with persistent disk, `/api/health`, backup verification, restore drill, and restart verification on the actual service.
- Run and record role-based human UAT using `docs/PILOT-UAT.md`.
- Supply the controlled source pages 2/3 and 3/3 before claiming the WI register complete. Current code correctly refuses to invent them.

### P2

- Run a real-device/browser compatibility pass and a live 4G performance measurement.
- Complete assistive-technology testing with real keyboard and screen-reader users.

## C. Company pilot checklist

- [ ] Remove tracked SQLite artifacts and obtain `verify-security-hygiene` exit 0.
- [ ] Create/configure the manual QC Render service as one writable instance only.
- [ ] Attach persistent storage and configure `QC_DATABASE_PATH=/var/data/qc_tasks.db` and `QC_BACKUP_DIR=/var/data/backups`.
- [ ] Set a non-default `ADMIN_DEFAULT_PASSWORD` and production session/provider secrets outside the repository.
- [ ] Verify `/api/health`, system health, scheduled backup, backup verification, restore, and restart on the actual service.
- [ ] Run UAT for employee, supervisor, manager, and admin; attach results to `docs/PILOT-UAT.md` or the approved evidence location.
- [ ] Obtain pages 2/3 and 3/3 of the controlled WI register before loading any further WI identities.

## D. Commands and exit codes

| Command | Exit | Current result |
| --- | ---: | --- |
| `pnpm typecheck` | 0 | 279 files; 0 errors, 0 warnings, 26 hints |
| `pnpm test:manifest` | 0 | 60 canonical suites; 28 canonical E2E suites |
| `pnpm test:route-manifest` | 0 | 114 file routes; 25 middleware routes; 6 guards |
| `pnpm test:embedded-migration-parity` | 0 | 38/38 byte-identical migrations |
| `pnpm test:migrations` | 0 | Fresh, upgrade, rollback, checksum and destructive guards pass |
| `pnpm test` | 0 | Full canonical suite passes |
| `pnpm build` | 0 | Production server build complete (known Vite import warnings only) |
| `pnpm e2e:acceptance` | 0 | 28 isolated workflow suites + two restart-persistence phases pass |
| `pnpm test:production-operations` | 0 | Backup/verify/restore, migration 38, integrity, FK, audit chains pass |
| `pnpm test:deployment-contract` | 0 | 21 deployment/secret-hygiene contract checks pass |
| `pnpm test:db-doctor` | 0 | DB integrity/FK and migration diagnostics pass |
| `pnpm test:lab-documents` | 0 | 303 passed, 0 failed; only supplied WI page 1 accepted |
| `node scripts/verify-security-hygiene.mjs` | 1 | Fails only for the two tracked zero-byte SQLite files |

### Security evidence

- Anonymous access and role boundaries are exercised by acceptance suites; forged report scope is denied by reporting authorization/E2E coverage.
- CSRF, Fetch Metadata, request-size/content-type limits, session/password lifecycle, lockout, and no-default-production-password safeguards pass in `pnpm test`.
- `pnpm test:deployment-contract` confirms no source console logging of configured provider/session/admin secrets and no public health probe environment disclosure.
- Source scan found no provider-secret literal. The acceptance runner's password is fixture-only and the source has a production guard against `admin123`; this does not clear the separate tracked-DB hygiene failure.

### Accessibility and UI evidence

- `download/qa/a11y-qc-report.json`: 12 scanned pilot pages, Critical 0, Serious 0.
- Acceptance includes navigation, buttons, forms, tables, error/empty states, desktop/mobile viewports, horizontal-overflow checks, responsive behavior, and UI consistency checks.
- This is technical automated evidence only; human usability acceptance is still required.

## E. Files changed

- `apps/qc-task-manager/docs/FINAL-PILOT-READINESS.md` — this independent final-readiness report.
- `.agents/mind/01-mind-latest.md` — required project task ledger entry.

## F. Final percentage

**92/100**

## G. GO / CONDITIONAL GO / NO-GO

**CONDITIONAL GO**

Conditions before promoting this to GO: security-hygiene exit 0, real deployment backup/restore/restart proof, and supplied recorded human UAT results. No commit, push, or deployment was performed by this verification task.

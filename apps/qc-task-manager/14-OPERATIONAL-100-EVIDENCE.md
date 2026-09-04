# QC-100-OPERATIONS-015 — Operational Closure Evidence (Human / Operator)

**Task:** QC-100-OPERATIONS-015 · **Date:** 2026-09-04 · **Status:** CONDITIONAL / OPEN — human-operator stages pending
**Rule:** only verified human/operator evidence may close these rows. Automated E2E is NOT UAT evidence and is recorded separately below. No secret values are recorded in this file.

---

## 0. Audited build identity (verified locally, read-only)

| Field | Verified value |
|---|---|
| commit SHA (HEAD) | `394be485cc2c32301cb4b5dea866520fe18e5a61` (`2026-09-04 01:57:30 +0300`, message `update site`) |
| package | `@brightai/qc-task-manager@0.1.0` (`apps/qc-task-manager/package.json`) |
| migration version (latest) | **40** — `db/migrations/001_initial.sql` … `040_dashboard_created_at_index.sql` (40 files, verified by listing + parity gate) |
| embedded migration parity | **PASS 40/40 byte-identical (sha256)** — `test-embedded-migration-parity.mjs`, re-run 2026-09-04 |
| deployment contract | **PASS 22/22** — `test-deployment-contract.mjs`, re-run 2026-09-04 (single instance, DB/backup paths, secret hygiene, root `render.yaml` owns public site only) |
| DATABASE-100 (isolated, temp dirs) | **PASS 23/23** — `test-database-100.mjs`, re-run 2026-09-04 (fresh init, 001→latest, parity, schema, integrity, constraints, retention, isolated backup/verify/restore, restart, failure behavior) |
| production-operations (isolated drill) | **PASS** — `test-production-operations.mjs`, re-run 2026-09-04 (restore drill, restart, integrity, FK, migrations, audit chains, deployment contract) |
| production build for staging | **NOT RUN in this task** — no staging deploy was triggered (owner-only per `docs/DEPLOYMENT.md`) |

> These rows are **automated local evidence only**. They do not close any human/operator row below.

---

## STAGE 1 — STAGING (status: NOT DEPLOYED — operator action required)

Documented process: `apps/qc-task-manager/docs/DEPLOYMENT.md` — manually created Render **Node Web Service** (never Static Site, never via root `render.yaml`):

- Build: `pnpm install --frozen-lockfile && NODE_ENV=production pnpm --filter @brightai/qc-task-manager build`
- Start: `pnpm --filter @brightai/qc-task-manager start` (`node ./dist/server/entry.mjs`)
- Health check path: `/api/health` (public liveness, no DB dependency by design)
- Readiness probe: `/api/readiness` (public; `200` only when SQLite reachable + migrated; never exposes paths/secrets)
- Persistent disk mounted at `/var/data`; `QC_DATABASE_PATH=/var/data/qc_tasks.db`; `QC_BACKUP_DIR=/var/data/backups`
- Single writable instance only (startup fails on `QC_HORIZONTAL_SCALING=true`, `QC_SQLITE_INSTANCE_COUNT>1`, `RENDER_NUM_INSTANCES>1`, `WEB_CONCURRENCY>1`)

| Required record | Value / status |
|---|---|
| commit SHA staged | **none** — no staging deploy performed |
| build identifier | **none** — production build for staging not run |
| environment (service URL) | **none** — no QC staging service exists in the repo; creation is a manual Render-dashboard step owned by the user |
| database path | intended `/var/data/qc_tasks.db` — **unverified live** |
| persistent storage | intended disk at `/var/data` — **unverified live** |
| health (`GET /api/health`) | source verified (`src/pages/api/health.ts` returns `{ok:true, service:'qc-task-manager', status:'healthy', live:true}`) — **no live response collected** |
| readiness (`GET /api/readiness`) | source verified (`src/pages/api/readiness.ts` returns `schemaVersion` integer, `503` when unmigrated) — **no live response collected** |
| migration version live | expected **40** — **unverified live** |

**Doc drift noted (non-blocking):** `docs/DEPLOYMENT.md` readiness example shows `"schemaVersion": 38`; actual latest migration is **40**. Example should be refreshed when the doc is next touched.

**Operator sign-off block (do not pre-fill):**

```text
Staging service URL: ________________________________
Render deploy ID / date: ____________________________
Commit SHA deployed: ________________________________
GET /api/health response (status + body): ___________
GET /api/readiness response (status + body): ________
DB file on disk (/var/data/qc_tasks.db exists): ____
Backup dir on disk (/var/data/backups writable): ____
Admin password rotated (yes/no + date): _____________
Operator name + date + signature: ___________________
```

---

## STAGE 2 — HUMAN UAT (status: NOT EXECUTED — zero sessions)

Runbook: `apps/qc-task-manager/docs/PILOT-UAT.md` (scenario script + evidence worksheet; explicitly not a statement of completed UAT). No participant has performed any scenario under this task. **Automated suites (`e2e-acceptance`, role E2E, a11y gates) are not UAT and are not recorded as UAT passes.**

Required coverage per role (worksheets to be filled by the facilitator, one row per scenario):

### Employee — OPEN (0/11 scenarios)

| Scenario (per PILOT-UAT.md) | Success | Time | Confusion | Assistance | Nav errors | Data-entry errors | Recovery | Comments / participant ID |
|---|---|---|---|---|---|---|---|---|
| Login + first-login password replace | — | — | — | — | — | — | — | — |
| Find own task | — | — | — | — | — | — | — | — |
| Update task | — | — | — | — | — | — | — | — |
| Create task (or permission limitation understood) | — | — | — | — | — | — | — | — |
| Create lab test (AIR/VACUUM draft) | — | — | — | — | — | — | — | — |
| Fill samples + human-selected result | — | — | — | — | — | — | — | — |
| Submit test for review | — | — | — | — | — | — | — | — |
| Search (test/document/equipment/product) | — | — | — | — | — | — | — | — |
| Find WI (controlled version) | — | — | — | — | — | — | — | — |
| Start WI content (draft, no approval claim) | — | — | — | — | — | — | — | — |
| Submit master-data proposal | — | — | — | — | — | — | — | — |

### Supervisor — OPEN (0/4 scenarios)

| Scenario | Success | Time | Confusion | Assistance | Nav errors | Data-entry errors | Recovery | Comments / participant ID |
|---|---|---|---|---|---|---|---|---|
| Review test (inspect measurements/samples) | — | — | — | — | — | — | — | — |
| Return for changes (actionable reason visible to tester) | — | — | — | — | — | — | — | — |
| Review controlled document (leave/return) | — | — | — | — | — | — | — | — |
| Team workspace (attention item → record) | — | — | — | — | — | — | — | — |

### Manager — OPEN (0/6 scenarios)

| Scenario | Success | Time | Confusion | Assistance | Nav errors | Data-entry errors | Recovery | Comments / participant ID |
|---|---|---|---|---|---|---|---|---|
| Approve test with e-signature (own current password) | — | — | — | — | — | — | — | — |
| Change-request review (approve/reject + rationale) | — | — | — | — | — | — | — | — |
| Document/template approval (status/version outcome) | — | — | — | — | — | — | — | — |
| Reports (preview scope, export/print) | — | — | — | — | — | — | — | — |
| Calibration risk (due/overdue → record) | — | — | — | — | — | — | — | — |
| Audit (trail for a recent workflow action) | — | — | — | — | — | — | — | — |

### Admin — OPEN (0/5 scenarios)

| Scenario | Success | Time | Confusion | Assistance | Nav errors | Data-entry errors | Recovery | Comments / participant ID |
|---|---|---|---|---|---|---|---|---|
| Create user (role + task-creation flag; no password recorded) | — | — | — | — | — | — | — | — |
| Reset password (next login forces replacement) | — | — | — | — | — | — | — | — |
| Role management (re-login shows intended access change) | — | — | — | — | — | — | — | — |
| System health (action required or not) | — | — | — | — | — | — | — | — |
| Backup (approved path; artifact/status only) | — | — | — | — | — | — | — | — |

### Accessibility observations (required alongside UAT) — OPEN

| Dimension | Observer notes (per session) |
|---|---|
| keyboard-only full task path | — (not observed) |
| responsive 360px + 1440px | — (not observed; automated `e2e-responsive` is not a human observation) |
| 200% zoom reflow | — (not observed) |
| screen reader (NVDA/VoiceOver) | — (not observed; `test-screen-reader-semantic-100` is static markup, not AT evidence) |
| focus visibility + error recovery wording | — (not observed) |

---

## STAGE 3 — BACKUP & RESTORE (status: ISOLATED GATES PASS; LIVE DRILL NOT DONE)

Verified automatically (isolated temp dirs, **not production data**): DATABASE-100 23/23 PASS + production-operations PASS (restore drill, restart, integrity, FK, audit chains) — re-run 2026-09-04. No production database was touched.

Live drill (requires operator approval first — **do not run against production without it**):

- [ ] Operator approval recorded (name + date): _______________
- [ ] Staging/live-safe backup generated (artifact name + size + verification status): _______________
- [ ] Artifact validated (checksum / verify PASS): _______________
- [ ] Restored into **isolated** recovery environment (path, NOT the live file): _______________
- [ ] Schema version match (expected 40; source vs restored): _______________
- [ ] Critical row counts match (users/tasks/findings/lab_tests + audit chains): _______________
- [ ] `PRAGMA integrity_check` clean: _______________
- [ ] `PRAGMA foreign_key_check` zero violations: _______________
- [ ] Restored environment restarted + smoke test (`/api/health` 200, `/api/readiness` 200, login): _______________

Reference commands: `docs/RESTORE.md` (`db:restore` with exact `--confirm="RESTORE QC DATABASE"`) and `docs/DEPLOYMENT.md` checklist items 4–7. Never copy a `.db` file over production; never reuse `-wal`/`-shm` sidecars.

---

## STAGE 4 — PRODUCTION TELEMETRY (status: NOT COLLECTED — no live env)

No staging/production service exists, so no live telemetry was collected. When the operator deploys, collect from the real service and paste actual values:

| Signal | Source | Actual value |
|---|---|---|
| health | `GET /api/health` (status + body) | — |
| readiness | `GET /api/readiness` (status + body incl. `schemaVersion`) | — |
| error rate | Render logs / monitoring window | — |
| response latency (avg) | monitoring window | — |
| p50 / p95 / p99 | where available | — |
| memory / CPU | Render metrics | — |
| DB behavior (`/admin/system-health`: integrity, FK, audit chains, backup verification, disk) | operator screenshot/notes | — |
| LCP / CLS / INP (browser-facing, where practical) | Lighthouse/PSI/CrUX on staging URL | — |

Do not substitute local `astro dev` timings for production telemetry.

---

## STAGE 5 — SECURITY CLOSURE (status: OPEN — owner revocation/rotation unverified)

No secret values are recorded here. Verification state as of 2026-09-04 (read-only checks):

| Item | State |
|---|---|
| Anthropic config previously noted in `.claude/settings.local.json` (QC-100-SECURITY-004 blocker) | Current file contains `permissions` only — **no key material present now**. Provider-side revoke/rotation receipt **NOT verified** — owner must confirm in the provider dashboard and record date. |
| Semrush token shared in chat (mind 2026-09-03) | Never stored in repo (verified: no secret committed by this task). Rotation in Semrush dashboard **NOT verified** — owner must confirm. |
| `ADMIN_DEFAULT_PASSWORD` | Code correctly requires a strong value for production seeding (`src/lib/seed.ts`) with local-only `admin123` fallback; deployment contract secret-hygiene checks PASS. Actual production value/rotation **only the operator can confirm** — never write it here. |
| `GROQ_API_KEY` (optional) | Optional per `docs/DEPLOYMENT.md`; enablement requires the AI-SAFE-LAUNCH operator checklist + key rotation outside the repo. No live value checked in. |
| `SESSION_SECRET` | Reserved, not implemented — must NOT be configured until consumed (`docs/DEPLOYMENT.md`). |
| Repo secret scan by this task | `rg` for `sk-ant`/password patterns in `src/lib`, `docs`, `SECURITY.md` shows only documented env-var handling (no embedded secrets found by these patterns); deployment-contract secret hygiene **22/22 PASS**. This is a local pattern check, not a full provider-side audit. |

**Owner sign-off block (do not pre-fill):**

```text
Anthropic key revoked/rotated in provider dashboard (date + operator): ___
Semrush token rotated (date + operator): _______________________________
Staging/prod ADMIN_DEFAULT_PASSWORD set + first-login rotation (date): _
GROQ_API_KEY state (unset / rotated outside repo + date): ______________
Operator name + date + signature: ______________________________________
```

---

## Row-closure summary (honest counts)

| Stage | Closed by this task | Remaining for human/operator |
|---|---|---|
| 1 Staging | 0 (build identity + contract verified locally) | 8 records (deploy + health + readiness + paths + rotation) |
| 2 UAT | 0 sessions | 26 role scenarios + 5 accessibility dimensions |
| 3 Backup & restore | 0 live (isolated gates PASS) | 9 live-drill items after operator approval |
| 4 Telemetry | 0 | 8+ signals from the live service |
| 5 Security | 0 (local hygiene PASS, no secrets committed) | 4 owner revocation/rotation confirmations |

**Overall: CONDITIONAL — code/automated evidence green locally; operational closure awaits the operator.**

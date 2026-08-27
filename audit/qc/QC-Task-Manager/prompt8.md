نعم. راجعت `main` الحالي قبل تجهيز الحزمة، وما زال عند نفس الـHEAD:

`1e7bf03d82b1c954a183be563c669dd3d2339877`

وبنيت البرومبتات أدناه على **الكود الحالي الفعلي**، مو على التقرير التاريخي فقط. مثلًا صفحة Reports ما زالت تولد `/api/reports/...`، بينما البحث الحالي ما وجد tracked routes تحت `api/reports`، والـAcceptance Runner الحالي ما زال لا يشغّل `e2e-lab-search.mjs`.

أنصح تشغلها **بالترتيب من 00 إلى 20** على Codex 5.6 Luna، وكل Prompt في جلسة/Task مستقلة. لا تخليه يسوي كل شيء في Prompt واحد؛ التقسيم هذا يقلل regression ويخلي كل مرحلة قابلة للتحقق.

---

# Prompt 00 — Baseline + Execution Contract

```text
TASK ID: QC-PILOT-BASELINE-000

You are working on the private repository:

YEEEAE/BRIGHTAI

Primary application:
apps/qc-task-manager/

Goal:
Prepare the QC Task Manager for a controlled real-company pilot. This task is the baseline and execution contract for all following tasks.

IMPORTANT:
Do not implement unrelated features in this task.
Do not commit.
Do not push.
Do not deploy.
Do not rewrite working architecture without evidence.
Do not modify historical migrations that have already shipped.
Do not invent scientific, quality, regulatory, ISO, medical-device, testing, calibration, or acceptance values.

Communication:
Talk to me in Saudi Arabic.
Keep application UI text in English.
Code/comments may remain English.

PROJECT INVARIANTS:
1. Astro SSR remains the application framework.
2. SQLite + better-sqlite3 remains the database.
3. One writable application instance.
4. src/lib/permissions.ts is the only RBAC authority.
5. qc_audit_log remains the canonical QC/Lab audit system.
6. Use the existing notifications table; do not introduce another notification system.
7. APPROVED/VOID/final controlled records remain immutable according to existing workflow rules.
8. Preserve approval snapshots and historical traceability.
9. Prevent self-review/self-approval where the existing workflow requires separation.
10. All unsafe POST/PUT/PATCH/DELETE operations must retain CSRF protection.
11. Do not weaken CSP.
12. Do not introduce unsafe-inline or unsafe-eval into the QC application.
13. No heavy UI framework.
14. No new cloud service unless absolutely required by an existing feature.
15. No PostgreSQL migration.
16. No Redis requirement for QC.
17. No breaking schema reset.
18. Existing user/company data must survive upgrades.
19. Existing WI source spelling and provenance must remain intact.
20. Do not silently “fix” controlled-source data.

FIRST:
Read the repository instructions that apply to this project.
Inspect:
- package.json
- apps/qc-task-manager/package.json
- apps/qc-task-manager/README.md
- apps/qc-task-manager/src/
- apps/qc-task-manager/db/
- apps/qc-task-manager/scripts/
- apps/qc-task-manager/docs/ if present
- repository QC audit/report documents
- AGENTS.md / CLAUDE.md / project instruction files if present

Then establish current reality by running from the repository/app as appropriate:
- git rev-parse HEAD
- git status --short
- node --version
- pnpm --version
- pnpm --filter @brightai/qc-task-manager typecheck
- pnpm --filter @brightai/qc-task-manager test:manifest
- pnpm --filter @brightai/qc-task-manager test:route-manifest
- pnpm --filter @brightai/qc-task-manager test:migrations
- pnpm --filter @brightai/qc-task-manager build

Do NOT fix failures yet unless the failure prevents the baseline inspection.

Create:
apps/qc-task-manager/docs/PILOT-IMPLEMENTATION-STATUS.md

The document must contain:
- HEAD SHA
- dirty/clean working-tree state
- Node/pnpm versions
- each command
- exit code
- PASS/FAIL
- exact failing suite if any
- current P0/P1/P2 implementation queue
- no guessed completion claims

Classify every item as:
IMPLEMENTED
PARTIAL
MISSING
BLOCKED
RUNTIME-NOT-VERIFIED

Also capture the exact current files relevant to:
- reporting transport
- migration 031
- test manifest
- E2E acceptance runner
- deployment
- authentication
- user audit
- accessibility
- Lab navigation
- WI import

Final response:
1. What you inspected
2. Commands run
3. Baseline failures
4. Files created/changed
5. Risks
6. Exact recommendation for the next task

Stop after the baseline.
Do not commit/push/deploy.
```

---

# Prompt 01 — إصلاح Reporting API بالكامل P0

هذا أول blocker فعلي؛ صفحة Reports الحالية تعتمد على endpoints غير موجودة في الشجرة الحالية.

```text
TASK ID: QC-REPORT-TRANSPORT-001
PRIORITY: P0

Fix the QC Task Manager reporting HTTP transport completely.

Application:
apps/qc-task-manager/

Before changing code, inspect:
- src/pages/reports.astro
- src/pages/lab/reports*
- src/lib/reporting/**
- src/lib/lab/report*
- scripts/e2e-reports.mjs
- scripts/route-manifest.mjs
- src/lib/permissions.ts
- src/lib/api-security.ts
- existing export API routes for patterns
- all existing report writers/catalogs/types

Known current contract:
The UI generates routes shaped like:
- /api/reports/[reportType].csv
- /api/reports/[reportType].xlsx
- /api/reports/[reportType].pdf
- /api/reports/audit

Current tracked source must be verified because these HTTP routes were reported missing.

GOAL:
Implement/restore the missing report API transport without duplicating report domain logic.

Requirements:
1. Reuse existing report catalog, scope resolver, query builders and CSV/XLSX/PDF writers.
2. Do not implement a second reporting engine.
3. Server must ignore any forged client scope and recalculate authoritative scope from authenticated user + permissions.
4. Employee: only authorized employee scope.
5. Supervisor: only allowed department/team scope according to current permissions.
6. Manager/admin: organization scope only where existing permissions allow it.
7. Invalid report type => controlled 404/400 JSON response.
8. Invalid format => controlled response.
9. Authentication required.
10. No IDOR.
11. No scope escalation through query parameters.
12. Validate all report filters server-side.
13. Generated files need correct Content-Type.
14. Generated files need safe Content-Disposition filenames.
15. No user-input path interpolation.
16. Report audit event must be persisted using the existing report audit mechanism.
17. Audit endpoint itself must be permission protected.
18. No inline scientific/regulatory assumptions.

Expected Astro routes should map cleanly to the URL contract, using the minimum number of files.

Update:
- route manifest
- report tests
- E2E where necessary

Add tests for:
- CSV
- XLSX
- PDF
- invalid report
- anonymous
- employee forged organization scope
- supervisor forged organization scope
- manager valid organization scope
- audit persistence
- audit permission
- Content-Type
- filename
- date filters
- user filters

Run:
pnpm typecheck
pnpm test:dashboard-reports
pnpm test:lab-reports
pnpm test:route-manifest
pnpm test
pnpm build

Then run the reports E2E against an isolated database.

Do not alter unrelated UI in this task.
Do not commit/push/deploy.

Finish with a Saudi-Arabic report:
- root cause
- files changed
- endpoints implemented
- authorization behavior
- tests and exact results
- remaining issues
```

---

# Prompt 02 — Migration 031 + Embedded Migration Parity P0

`db.ts` الحالي يعرّف 031 بشكل مختلف عن الملف الحقيقي على القرص؛ والـmigration runner حساس للاسم والـchecksum.

```text
TASK ID: QC-MIGRATION-PARITY-002
PRIORITY: P0

Fix migration source parity in apps/qc-task-manager without rewriting migration history.

Inspect:
- db/migrations/001_*.sql through latest
- specifically db/migrations/031_reserved.sql
- src/lib/db.ts
- src/lib/migrations.ts
- scripts/test-migrations.mjs
- scripts/db-doctor.mjs

Problem to verify:
The on-disk migration is:
031_reserved.sql

The embedded migration list in src/lib/db.ts may define version 031 using a different filename/source string.

The migration engine verifies:
- version
- name
- checksum

Therefore disk vs bundled startup behavior must be byte-for-byte/source-equivalent for every embedded migration.

GOAL:
Make every embedded migration exactly match the repository migration file.

Rules:
1. Never edit already-applied historical migration contents just to satisfy a test.
2. Import 031_reserved.sql using ?raw exactly like all other embedded SQL migrations.
3. Use exactly the same filename/name/source in embeddedMigrations.
4. Preserve sequential versions.
5. Do not create migration 036 for this problem unless schema data actually needs changing—it should not.
6. Preserve migration checksum history.

Create a new test:
scripts/test-embedded-migration-parity.mjs

It must:
- enumerate every repository migration file
- extract version/name
- compare against the application embedded migration registry
- compare exact source content or SHA-256
- fail on:
  * missing embedded migration
  * extra embedded migration
  * wrong filename
  * wrong name
  * wrong version
  * checksum/source mismatch
  * non-sequential history

Refactor only if necessary to expose an immutable embedded migration registry for testing without initializing the production DB.

Register the test in:
- package.json
- canonical test manifest
- full test runner

Update db-doctor if useful so it reports disk/bundle parity separately.

Acceptance:
- fresh DB migrates to latest
- existing DB migration history remains valid
- second migration run applies zero migrations
- checksum drift test still catches real drift
- foreign_key_check PASS
- integrity_check PASS
- embedded parity PASS

Run:
pnpm test:migrations
pnpm test:embedded-migration-parity
pnpm db:status on a disposable initialized database
pnpm test
pnpm typecheck
pnpm build

Do not reset any non-disposable DB.
Do not commit/push/deploy.

Report exact hashes/names for migration 031 before and after.
```

---

# Prompt 03 — Test Registry + Lab Search + Full Acceptance P0

الـAcceptance Runner الحالي يحتوي 25 suites ولا يحتوي `e2e-lab-search.mjs`.  كما أن manifest guard الحالي يقارن package scripts بالmanifest فقط، ولا يمسح ملفات الاختبارات نفسها.

```text
TASK ID: QC-TEST-GATE-003
PRIORITY: P0

Make the QC test/acceptance registry impossible to silently drift.

Inspect:
- apps/qc-task-manager/package.json
- scripts/test-manifest.mjs
- scripts/test-manifest-guard.mjs
- scripts/run-full-tests.mjs
- scripts/e2e-acceptance.mjs
- every scripts/test-*.mjs
- every scripts/e2e-*.mjs
- specifically scripts/e2e-lab-search.mjs

GOALS:
A. Register the Lab Search E2E in the official acceptance runner.
B. Detect orphan test/E2E files automatically.
C. Produce a deterministic full acceptance result.

Modify the test registry guard so it inspects the filesystem.

Required classification:
- canonical unit/integration test scripts
- meta tests
- canonical E2E suites
- intentional helpers/non-runnable scripts

Do not treat every arbitrary .mjs as an executable test. Use explicit filename conventions plus a small documented allowlist where needed.

The guard must fail if:
1. package.json test:* command is absent from the manifest.
2. manifest command does not exist in package.json.
3. scripts/test-*.mjs exists but is unregistered and not explicitly classified.
4. scripts/e2e-*.mjs exists but is absent from the E2E registry and not explicitly classified.
5. registered file does not exist.
6. duplicate canonical entries exist.

Add:
e2e-lab-search.mjs
to the main E2E acceptance runner.

Do not weaken its existing:
- employee data isolation
- manager visibility
- search coverage
- mobile/desktop overflow checks

Enhance the acceptance summary to include:
- suite name
- script
- passed assertions
- failed assertions
- duration
- timeout status
- total suites
- total assertions if parsable
- HEAD SHA
- dirty status

Preserve:
- isolated SQLite DB per suite
- isolated port per suite
- forced process timeout
- server teardown
- browser teardown
- restart persistence suite

Run:
pnpm test:manifest
pnpm test
pnpm build
pnpm e2e:acceptance

The final task is not complete unless e2e:acceptance actually exits 0.

If it fails:
debug the exact first failing suite,
fix real defects,
rerun from the beginning.

Do not remove assertions merely to make tests green.
Do not increase timeouts unless you prove the test legitimately needs it.
Do not commit/push/deploy.

Produce a final acceptance table in Saudi Arabic.
```

---

# Prompt 04 — Deployment + Persistent SQLite + Backup Contract P0

```text
TASK ID: QC-DEPLOYMENT-CONTRACT-004
PRIORITY: P0

Make repository deployment documentation and executable deployment configuration for apps/qc-task-manager match exactly.

Inspect:
- root render.yaml
- apps/qc-task-manager docs deployment files
- apps/qc-task-manager README.md
- src/lib/db.ts
- src/lib/backup.ts
- src/lib/backup-scheduler.ts
- src/lib/systemHealth.ts
- src/pages/api/health.ts
- package.json scripts

Known requirement:
QC uses SQLite and MUST run as exactly one writable application instance with persistent storage.

Do not modify or break the existing public BrightAI site's Render service.

Decide the safest supported configuration:
- add a second service to the existing Render blueprint if that is the actual repository deployment approach,
OR
- keep a separate QC deployment configuration/documented manual service if the repository deliberately separates them.

Do not invent a deployment mechanism that Render does not support.

QC deployment requirements:
- Node 22 compatible
- build from monorepo correctly
- production start command points to apps/qc-task-manager/dist/server/entry.mjs
- health endpoint checks the QC app, not public BrightAI
- one writable instance
- persistent disk
- QC_DATABASE_PATH on persistent disk, e.g. under /var/data
- no DB in ephemeral working directory
- NODE_ENV=production
- ADMIN_DEFAULT_PASSWORD supplied as secret, never hardcoded
- AI secrets optional
- no secret value in repository
- SQLite horizontal scaling guard remains active
- backup directory is persistent
- restart preserves data

Fix the QC backup environment contract:
If docs advertise QC_BACKUP_DIR, either:
A. implement:
process.env.QC_BACKUP_DIR ?? backupDirectoryForDatabase(DB_PATH)
or
B. remove the unsupported variable everywhere.

Prefer supporting QC_BACKUP_DIR while retaining the current fallback.

Add deployment-contract tests covering:
- one instance accepted
- WEB_CONCURRENCY >1 rejected
- RENDER_NUM_INSTANCES >1 rejected
- QC_HORIZONTAL_SCALING=true rejected
- DB path resolution
- backup path resolution
- no secret logging

Update:
DEPLOYMENT.md
README where necessary
environment variable reference
restore runbook

Add a pre-pilot deployment checklist:
- persistent disk attached
- DB path verified
- backup write verified
- restart data persistence verified
- health PASS
- audit chain PASS
- DB integrity PASS

Do NOT deploy.
Do NOT create paid resources.
Do NOT pick an arbitrary paid disk size if repository requirements do not define one; mark that as an operator choice.

Run all affected tests + build.

Final response:
show exact config drift you found and how it was eliminated.
```

---

# Prompt 05 — Password Lifecycle + AI Safe Launch + Secret Hygiene P1

```text
TASK ID: QC-AUTH-PILOT-HARDENING-005
PRIORITY: P1

Harden authentication for real employee pilot use without replacing the existing session/auth architecture.

Inspect:
- src/lib/auth.ts
- src/lib/seed.ts
- src/lib/users.ts
- src/lib/validation.ts
- src/lib/permissions.ts
- login/logout routes
- admin user pages
- migrations
- auth E2E
- any AI provider configuration

Keep:
- bcrypt
- server-side sessions
- current 12h session model unless existing business policy says otherwise
- lockout
- IP brute-force protection
- dummy hash anti-enumeration behavior

Implement a controlled first-login password lifecycle.

Add the minimum DB fields using the NEXT sequential migration only:
- must_change_password INTEGER/boolean style consistent with schema
- password_changed_at TEXT nullable

Behavior:
1. Newly created user with an admin-set temporary password is marked must_change_password.
2. Fresh seeded pilot accounts are also marked must_change_password.
3. After valid login, a user with this flag may access only the password-change flow and logout.
4. Add an authenticated account security/password page.
5. Require current password.
6. Require new password + confirmation.
7. Validate using existing password policy.
8. Password change clears must_change_password and sets password_changed_at.
9. Invalidate all other sessions for that user after password change.
10. Keep the current session or replace it safely according to existing session implementation.
11. Admin password reset marks must_change_password again.
12. Never log passwords or hashes.

Do not build email password recovery.
Do not add an external identity provider.

AI safe launch:
- Never put GROQ/GEMINI secrets in code/docs/tests.
- Search repository for accidental provider secrets or suspicious hardcoded tokens.
- Do not print any discovered secret in the final response.
- Ensure QC works completely with AI credentials absent.
- AI UI must show a controlled unavailable state when no provider is configured.
- Core QC workflows must never depend on AI.
- Keep AI advisory only.
- Add provider-health diagnostics without exposing secrets.

If a provider credential has historically leaked, code cannot rotate it.
Add an explicit operator checklist stating:
ROTATE THE PROVIDER KEY OUTSIDE THE REPOSITORY BEFORE ENABLEMENT.

Tests:
- first login redirect
- cannot bypass password change by direct URL
- successful change
- wrong current password
- confirmation mismatch
- other sessions invalidated
- admin reset re-enables must_change_password
- no password/hash in logs
- AI absent does not break build/core app

Run typecheck/test/build/E2E auth.

Do not commit/push/deploy.
```

---

# Prompt 06 — Durable User Administration Audit P1

```text
TASK ID: QC-USER-AUDIT-006
PRIORITY: P1

Replace console-only administrative user-change auditing with durable database-backed auditing while preserving existing QC/Lab audit architecture.

Inspect:
- src/lib/users.ts
- qc_audit_log schema and helpers
- src/lib/audit/**
- admin user routes/pages
- permissions.ts
- system health/audit pages

Do NOT create another generic audit table if qc_audit_log can safely support these events.

Determine the minimum compatible extension.

Required durable events:
- USER_CREATE
- USER_UPDATE
- USER_ROLE_CHANGE
- USER_ACTIVATE
- USER_DEACTIVATE
- USER_PASSWORD_RESET

Never persist:
- raw password
- password hash
- session token

Record:
- target user id
- actor user id
- action
- before values when relevant
- after values when relevant
- reason/note if supplied
- timestamp
- audit chain/hash according to existing qc audit implementation

If qc_audit_log entity/action CHECK constraints need new vocabulary:
use the next sequential migration.
Preserve every historical row and verified hash chain.
Backfill only using the established audit-chain mechanism.

Admin self-protection remains:
- no self-deactivation
- no self-demotion

Add an Admin Audit view/filter if the existing audit UI can expose USER events without confusing Lab users.

Tests:
- each admin operation emits exactly expected audit event
- no password data
- unauthorized user cannot access admin audit
- hash chain PASS
- historical Lab/QC audit unchanged
- failed mutation does not emit false successful audit

Run migrations/audit/user tests/full tests/build.

Do not commit/push/deploy.
```

---

# Prompt 07 — Request Security Hardening P1

```text
TASK ID: QC-REQUEST-SECURITY-007
PRIORITY: P1

Hardening task only. Do not redesign authentication.

Inspect:
- src/lib/api-security.ts
- src/middleware.ts
- every API mutation route
- all fetch() calls from React/Astro UI
- CSRF tests
- security tests

Improve request protection while preserving existing behavior.

1. Keep current Origin-based CSRF checks.
2. Add Fetch Metadata defense-in-depth for unsafe requests:
   - reject Sec-Fetch-Site: cross-site
   - do not break same-origin requests
   - handle older clients where header is absent by falling back to current Origin checks.
3. Ensure ALL POST/PUT/PATCH/DELETE endpoints invoke the canonical request security/CSRF path.
4. Add an architecture/security test that scans mutation routes for the required protection pattern.
5. Preserve allowed Content-Types.
6. Preserve request-size enforcement.
7. Preserve API authentication.

Rate limiter:
Current in-memory buckets are appropriate for the one-instance QC architecture.
Add bounded cleanup so stale entries cannot grow forever.
Do not add Redis.

Use:
- periodic opportunistic pruning
or
- pruning when maps exceed a safe bounded threshold.

Test:
- same-origin accepted
- cross-site rejected
- invalid Origin rejected
- old/no Sec-Fetch still protected by Origin
- mutation content-type
- request size
- rate limit
- stale bucket pruning
- login lockout unaffected
- AI limiter unaffected

Do not weaken CSP.
Do not add unsafe-inline.
Do not add CORS wildcard.

Run security/unit/typecheck/build.
```

---

# Prompt 08 — Dedicated QC CI / Release Gate P1

```text
TASK ID: QC-CI-RELEASE-GATE-008
PRIORITY: P1

Create a dedicated, repository-native CI release gate for:
apps/qc-task-manager/

Inspect existing .github/workflows first.
Do not break the public BrightAI website workflows.

Create or extend the smallest appropriate GitHub Actions workflow dedicated to QC.

PR gate must run:
1. frozen pnpm install
2. QC typecheck
3. test manifest guard
4. route manifest
5. embedded migration parity
6. migration tests
7. full canonical QC test suite
8. production build

Main/nightly/manual gate:
run the complete QC E2E acceptance suite.

Use:
- existing Node version contract
- pnpm via project/package manager configuration
- dependency caching where safe

Never require production secrets to run tests.
Use acceptance-only test password/environment.
Use isolated temporary SQLite DBs.

Upload useful artifacts on failure where applicable:
- acceptance summary
- accessibility report
- screenshot diff report when added later
- logs without secrets

Add a single aggregate required job name such as:
QC / Release Gate

Document recommended GitHub branch protection:
- require QC / Release Gate
- require branch up to date if appropriate
- prohibit direct unreviewed production changes according to team workflow

Do not attempt to modify GitHub repository settings from code.
Do not deploy.

Make sure current HEAD can run the same commands locally.

Final output:
workflow path
jobs
triggers
expected secrets (should be none for CI)
local equivalent commands
```

---

# Prompt 09 — Accessibility Gate P1

```text
TASK ID: QC-A11Y-GATE-009
PRIORITY: P1

Upgrade QC accessibility testing from partial/report-only coverage to a real pilot gate.

Inspect:
- scripts/e2e-a11y.mjs
- BaseLayout.astro
- Navbar.tsx
- global.css
- forms/dialogs/tables
- existing accessibility helpers

Keep the current keyboard tests.

Change axe behavior:
FAIL the acceptance suite if:
- critical violations > 0
- serious violations > 0

Moderate/minor:
record in report and summary but do not initially block unless they affect a critical workflow.

Expand axe coverage to representative authenticated role pages:
- /login
- employee home
- manager/dashboard home
- task detail
- /lab
- /lab/tests
- /lab/tests/new
- lab test detail
- /lab/documents
- /lab/change-requests
- /lab/search
- /reports where authorized

Use deterministic test fixtures.

Also check:
- input labels
- aria-describedby for validation errors
- required state
- table headers
- modal names
- focus management
- skip link
- color-independent status labels
- keyboard navigation
- focus-visible
- mobile nav

Fix genuine violations in shared components first.

Do not “disable” axe rules just to pass.
If an exception is genuinely necessary, document why and scope it narrowly.

Write machine-readable:
download/qa/a11y-qc-report.json

Acceptance:
critical=0
serious=0

Run:
a11y E2E
full tests
build
full acceptance after changes.

Do not commit/push/deploy.
```

---

# Prompt 10 — UI Design System + Navbar + Navigation

```text
TASK ID: QC-UI-DESIGN-SYSTEM-010
PRIORITY: P1/P2

Improve UI consistency and navigation without changing business logic.

This is an internal QC enterprise application:
clarity, speed and traceability are more important than decorative design.

Inspect all:
- shared components
- layouts
- Navbar.tsx
- Breadcrumbs
- EmptyState
- FlashNotice
- lab components
- major pages
- Tailwind config
- global.css

Build a lightweight internal design system using existing Astro/Tailwind.
Do not add Material UI, Chakra, Ant, Bootstrap or another heavy design system.

Create/reuse standardized primitives:
- ActionButton
- StatusBadge
- PageHeader
- SectionHeader
- FormField
- FormError
- ValidationSummary
- Card
- MetricCard
- DataTable wrapper
- FilterBar
- Pagination
- EmptyState
- ErrorState
- WarningState
- ConfirmDialog pattern

Extend LabActionButton or consolidate instead of duplicating components.

Button hierarchy:
Primary
Secondary
Destructive
Ghost/text where justified

Minimum touch target:
44px-ish/current min-h-11 convention.

Navbar:
Current role navigation can become crowded.
Reorganize it into a simpler mental model while preserving all reachable routes.

Preferred top-level structure:
- Dashboard / My Tasks as role appropriate
- Tasks
- Quality
- Laboratory
- Reports where permitted

Move administrative utilities to a user/admin menu:
- Notifications
- Users
- Templates/settings where appropriate
- System Health
- Sign out

Do not expose unauthorized links.

Add:
- clear current-section state
- aria-current
- consistent hover/focus
- mobile equivalent
- no dead links

Laboratory secondary navigation:
Preserve the existing grouped concepts:
Overview
Testing
Master Data
Controlled Documents
Operations

Improve mobile behavior so 20 links do not become an unreadable wrapped wall.
Use a lightweight responsive section picker or grouped collapsible presentation with no new library.

Do not move authorization into UI components.
permissions.ts remains authority.

Create:
docs/UI-DESIGN-SYSTEM.md

Run:
UI source tests
a11y
responsive E2E
full tests
build

Do not commit/push/deploy.
```

---

# Prompt 11 — Lab Command Center + Management Dashboard

```text
TASK ID: QC-LAB-MANAGEMENT-UX-011
PRIORITY: P1/P2

Improve the Laboratory landing experience and implement the currently latent management dashboard only if the current permission/navigation architecture already expects it.

Inspect:
- src/pages/lab/index.astro
- src/lib/lab/overview.ts
- src/lib/lab/navigation.ts
- src/lib/permissions.ts
- LabSecondaryNav
- change requests
- tests
- calibration
- documents
- data quality
- audit

PART A — Lab home

Do not remove useful KPIs, but reduce initial cognitive overload.

Change the information hierarchy from:
“show every metric first”
to:
“show what the current role must act on first”.

Employee:
- My Tests
- Draft Tests
- Returned for Changes
- My WI Content
- Quick New Test

Supervisor:
- Tests waiting for review
- Returned/rework
- team operational alerts
- controlled-document review tasks

Manager/Admin:
Create a prominent:
Needs your attention
section including authoritative counts such as:
- tests awaiting approval/review as applicable
- pending master data changes
- overdue calibration
- documents requiring action
- unresolved data-quality issues

Put secondary metrics into a lower section.

Do not change query scope rules.

PART B — /lab/management

Verify whether navigation/permissions already define this route.
If yes, implement it for management roles only.

Manager/Admin management dashboard should contain:
- Approval/Review queue summary
- Pending Change Requests
- Changes waiting >24h
- Rejected contributor changes
- Calibration risk
- Equipment requiring attention
- Controlled Document health
- WI content progress
- FAIL/HOLD trends using existing trend queries
- Retest/open investigations
- Data Quality
- Audit-chain/system-health summary where permission allows

Every metric must be based on existing database records.
No fake seed numbers.

Every actionable card should link to the correct filtered register.

No new analytics library.

Add unit/query tests + RBAC + responsive E2E.

Run full affected tests/build.
```

---

# Prompt 12 — Forms + Lab Sample Productivity

```text
TASK ID: QC-FORM-USABILITY-012
PRIORITY: P2

Standardize high-frequency forms for real QC staff usage without changing controlled scientific rules.

Inspect:
- LabTestForm.tsx
- Equipment forms
- Product forms
- Calibration forms
- Template forms
- Controlled Document editor
- Task create/edit flows

Shared UX requirements:
- consistent required indicators
- consistent validation messages
- top validation summary after failed submit
- focus first invalid field
- sticky Save/Submit actions for long forms where appropriate
- unsaved-changes protection
- clear Save Draft vs Submit semantics
- no accidental double submission
- disabled/loading state
- explicit successful save feedback

Do not autosave controlled workflow transitions.
Draft autosave may only be added where it is safe and does not create hidden approval/audit actions.

Lab sample table productivity:
Use the existing data model.

Implement safe convenience tools:
- Duplicate previous row
- Fill down selected non-scientific/manual value
- clear selected range/row
- paste multiple tabular rows from spreadsheet when schema mapping is unambiguous
- undo last bulk paste if feasible without a new dependency

Never automatically calculate PASS/FAIL unless an approved existing template rule already does so.
Never invent acceptance criteria.

For repeated values, optionally provide:
Apply to all samples
only for fields where that semantic is valid based on current form model.

Keep paper-aligned field names and legacy compatibility.

Add keyboard tests and 12-sample workflow E2E.

Measure in test output:
- number of sample rows entered
- no data loss
- validation correctness

Do not change scientific reference values.
```

---

# Prompt 13 — Change Request Withdraw + Notification Reliability

```text
TASK ID: QC-WORKFLOW-NOTIFICATIONS-013
PRIORITY: P2

Improve contributor change-request lifecycle and notification reliability using existing systems.

Inspect:
- src/lib/lab/changeRequests.ts
- migration for lab_change_requests
- change request pages/API
- notifications.ts
- notification UI
- permissions.ts
- audit chain

PART A:
Add controlled withdrawal lifecycle.

New status:
WITHDRAWN

Requirements:
- requester may withdraw only their own PENDING request
- manager/admin may not silently rewrite it as withdrawn on requester behalf unless current business rules explicitly support it
- APPROVED/REJECTED cannot be withdrawn
- withdrawal requires CSRF
- server rechecks ownership/status
- audit event records PENDING → WITHDRAWN
- no canonical entity mutation is applied
- pending queues/counts stop including it

Use next sequential migration if CHECK constraints require schema rebuild.
Preserve existing data and audit chain.

PART B:
Review notification transaction semantics.

For workflow-critical persisted notifications:
- review requested
- rejected/returned
- approval outcome

If notification row is part of the same local SQLite business transaction, make its persistence atomic where safe.

Do not make external delivery a transaction dependency.
Do not introduce another notifications table.

PART C:
Improve /notifications filtering using existing notification types:
- All
- Tasks
- Tests
- Documents
- Change Requests
- Calibration/Equipment if existing types support it
- Unread

Do not invent dozens of new notification kinds.

Tests:
ownership
CSRF
forged id
terminal status
audit
notification
management counts
employee visibility
```

---

# Prompt 14 — Reports UX + Print Quality

```text
TASK ID: QC-REPORT-PRINT-UX-014
PRIORITY: P2
DEPENDENCY: QC-REPORT-TRANSPORT-001 must already pass.

Improve report-generation UX and controlled printing.

PART A — Reports preview

On /reports and lab report pages:
Before users download a file, show an authoritative preview summary:
- report type
- resolved data scope
- date range
- filters
- estimated/exact matching row count when cheap
- generated-for role/user context

Do not expose unauthorized counts.
Server must resolve preview scope using the exact same authorization path used by generation.

Download buttons remain:
CSV
XLSX
PDF

PART B — Print validation

Audit print pages for:
- Lab Test
- Equipment
- Maintenance
- Calibration
- controlled documents where applicable

Requirements:
- A4-friendly
- no clipped critical columns
- appropriate portrait/landscape per existing form
- sensible page breaks
- authorization/signature metadata retained
- QR remains printable
- source/reference metadata retained
- no navigation/buttons in print
- no uncontrolled scientific value substitutions

Add Playwright print-oriented checks using CSS media=print and screenshots/PDF generation where practical.

Do not introduce a browser PDF dependency if Playwright already provides what is needed for tests.

Add report preview tests + print regression tests.
```

---

# Prompt 15 — Observability + Error/Empty States

```text
TASK ID: QC-OBSERVABILITY-015
PRIORITY: P2

Make the internal QC application much easier to debug during company pilot.

Do not add an external SaaS observability provider.

PART A — request correlation

Add a request/correlation ID:
- generated server-side
- available to logs
- included in safe 5xx responses/support messages where useful
- propagated through major mutation handling
- never derived from sensitive data

Structured server logs should include:
- timestamp
- request_id
- method
- route
- authenticated actor id when available
- role when useful
- status
- duration_ms
- safe error code

Never log:
password
hash
session token
sensitive file contents
AI secrets

PART B — consistent user states

Create/reuse standardized UI states:
- no records yet
- no results for filters
- permission denied
- load/system error
- conflict/stale record
- success
- warning

Every state should tell the user what action is available.

PART C — mutation error codes

Where practical, create stable internal error codes for:
AUTH
FORBIDDEN
VALIDATION
NOT_FOUND
CONFLICT
STALE_CHANGE
DB
REPORT
UPLOAD

Do not leak SQL messages to the browser.

System Health should retain existing DB/backup/audit status and may expose aggregate recent application error counts only if this can be done without introducing a large logging database.

Add tests for sanitization and request IDs.

Keep UI English.
```

---

# Prompt 16 — Visual Regression + Responsive Coverage

```text
TASK ID: QC-VISUAL-RESPONSIVE-016
PRIORITY: P2

Create lightweight Playwright visual/responsive regression coverage using dependencies already present.

Do not add a heavy visual testing SaaS.

Cover these representative screens:
- login
- employee home
- manager/dashboard
- task detail
- lab command center
- lab tests register
- new lab test
- lab test detail
- documents register
- document detail/editor state
- equipment register/detail
- change request
- lab search
- reports
- lab management if now implemented

Viewports:
- 1440 desktop
- 1024 laptop
- 768 tablet
- 360 mobile

For each:
1. assert no unintended horizontal page overflow
2. important primary actions remain reachable
3. navigation remains usable
4. tables use responsive strategy
5. no dialog goes outside viewport
6. no clipped validation/error messages

Use deterministic fixtures and disable nondeterministic timestamps/animation as needed.

Store screenshots under a clearly ignored/generated QA artifact directory, not in production assets.

If baseline screenshots are intentionally committed, keep the set small and document update procedure.

Integrate responsive assertions into nightly/full acceptance, not necessarily every fast unit-test run.

Do not redesign pages solely for screenshot similarity.
Fix actual usability regressions.
```

---

# Prompt 17 — Performance / Realistic Data Load

```text
TASK ID: QC-PERFORMANCE-017
PRIORITY: P2

Create evidence-based performance testing for the single-instance SQLite QC application.

Do not optimize blindly.
Do not add indexes until measurements show need.

Create a disposable performance fixture generator.
Never use production DB.

Target realistic large local fixture such as approximately:
- 10k tasks
- 5k lab tests
- ~60k samples
- equipment + maintenance/calibration history
- controlled documents/versions
- large audit history
but parameterize fixture size so CI can use a smaller profile.

Benchmark read paths:
- global/task dashboard
- employee task list
- task search
- lab command center
- lab search
- tests register
- equipment register
- documents register
- change request queue
- audit timeline
- reports

Measure:
- p50
- p95
- max
- query count where measurable
- generated report duration

Create a readable benchmark report:
download/qa/qc-performance.json
and Markdown summary.

Identify slow SQL with EXPLAIN QUERY PLAN where applicable.

Only add an index when:
- query path is important
- benchmark demonstrates benefit
- write overhead is acceptable

Any schema index addition uses the next sequential migration.
Do not alter historical migrations.

Define reasonable pilot budgets based on observed baseline and existing product expectations—not arbitrary “regulatory” numbers.

Run integrity/FK tests after any schema change.
```

---

# Prompt 18 — Onboarding + UAT + Feedback

Codex ما يقدر يمثل موظفين حقيقيين، لذلك هذا البرومبت يجهز النظام والاختبارات لاستقبال UAT فعلي.

```text
TASK ID: QC-PILOT-UAT-018
PRIORITY: P1/P2

Prepare the QC application for structured employee UAT.

Do NOT claim human usability has been validated.
Codex cannot replace real staff testing.

PART A — lightweight onboarding

Add contextual help only where users commonly need it:
- first login/password change
- role home explanation
- task workflow
- creating a Lab Test
- Submit vs Draft
- review/approval separation
- controlled document lifecycle
- contributor change requests

Keep help concise.
Do not add a tour library.

PART B — UAT runbook

Create:
apps/qc-task-manager/docs/PILOT-UAT.md

Include role-specific scenarios:

Employee:
- login + password change
- find own task
- update task
- create permitted task where flag allows
- create AIR/VACUUM test
- complete sample rows
- submit test
- search lot/test/sample
- find WI
- start WI content
- submit master-data proposal

Supervisor:
- review appropriate test
- return for changes
- review controlled document not owned by self
- verify team workspace

Manager:
- approve appropriate test with e-signature
- review master-data change
- approve document/template under separation rules
- run reports
- inspect calibration risk
- inspect audit

Admin:
- create user
- reset user password
- role management
- system health
- backup status

For each scenario record:
- success yes/no
- completion time
- assistance required
- error encountered
- confusing labels/buttons
- expected button location
- comments

PART C — feedback classification

Create:
P0 = blocks work/data integrity/security
P1 = major workflow friction/wrong behavior
P2 = usability/polish
P3 = future enhancement

Do not build a complex feedback platform.
If an in-app feedback action is added, persist a simple internal issue/feedback record only if a suitable existing table/domain exists; otherwise keep UAT external/document-based.

Do not invent employee feedback results.
```

---

# Prompt 19 — WI Catalog Completion Guard

هذا مهم لأن الموجود حاليًا هو بيانات الصفحة 1/3 فقط، فلا نخلي Codex يخترع الصفحتين الباقية.

```text
TASK ID: QC-WI-CATALOG-COMPLETION-019
PRIORITY: SOURCE-BLOCKED

Audit the WI catalog import architecture but DO NOT invent pages 2/3 or 3/3.

Inspect:
- src/lib/lab/wiCatalog.ts
- WI migrations
- lab_documents
- document versions
- WI UI
- existing source provenance fields

Current imported source is page 1/3 only.

Requirements:
1. Preserve all existing 33 source-exact rows.
2. Preserve spelling exactly as controlled source.
3. Preserve:
   creation_origin
   source_register_code
   source_class
   source_page
   source_row_no
   source_revision
   source_date
4. No placeholder WI rows.
5. No guessed code/title/revision/date.
6. No fake document content.
7. Catalog-only row remains “Missing Content” until a user creates actual content.
8. First user content creates a legitimate document version and ownership according to current workflow.

Improve importer so additional controlled pages can later be added cleanly:
- explicit source_page on every catalog row
- source_row_no from that page
- idempotent by document code
- collision report
- never overwrite real content/status/version
- source metadata fill only where safe

Add a validation test that ensures:
- no duplicate code
- source page known
- no blank code/title
- existing page 1 rows unchanged
- no invented pages 2/3 or 3/3

Create a clearly marked TODO in the UAT/readiness report:
“WI register incomplete until controlled source pages 2/3 and 3/3 are supplied.”

Stop there.

When those source images/files are later supplied, transcribe only what the controlled source actually contains.
```

---

# Prompt 20 — Final Company Pilot Acceptance / Re-Audit

هذا آخر برومبت فقط بعد انتهاء 01–19.

```text
TASK ID: QC-COMPANY-PILOT-GATE-020
PRIORITY: FINAL GATE

Perform the final, evidence-based pre-pilot audit of:
apps/qc-task-manager/

Do not implement speculative features during the first pass.
First verify everything.

Capture:
- HEAD SHA
- git status
- Node
- pnpm

Run all required gates:
1. pnpm typecheck
2. pnpm test:manifest
3. pnpm test:route-manifest
4. embedded migration parity test
5. pnpm test:migrations
6. pnpm test
7. pnpm build
8. complete pnpm e2e:acceptance

Then verify a disposable production-like DB:
- migration latest version
- integrity_check
- foreign_key_check
- audit chains
- backup creation
- backup verification
- restore to disposable target
- restart persistence

Security:
- anonymous route protection
- RBAC matrix
- CSRF
- request limits
- session
- password lifecycle
- no default production credentials
- no provider secrets in repository

Functional smoke:
TASK:
create → assign → progress → comment/evidence → complete/reopen/cancel as allowed

LAB:
create draft → fill samples → submit → supervisor review where applicable → manager approval/e-sign → immutable approved record → print

DOCUMENT:
catalog/new draft → content → submit/review → approve → revision

MASTER DATA:
employee/supervisor proposal → manager review → canonical apply → audit

REPORTS:
CSV
XLSX
PDF
report audit
forged scope rejected

WI:
confirm current source coverage accurately reflects only supplied controlled pages.

UI/UX technical verification:
- navigation
- buttons
- error states
- empty states
- mobile
- desktop
- critical/serious a11y = 0
- no dead links
- no unintended horizontal overflow

Generate:
apps/qc-task-manager/docs/FINAL-PILOT-READINESS.md

Score these 0-100 using explicit evidence:
- Backend
- Database
- Authentication
- RBAC
- Security
- Tasks
- QC Operations
- Laboratory
- Documents
- Equipment/Calibration
- Reporting
- Audit
- Notifications
- Backup/Restore
- Deployment configuration
- Test coverage
- Accessibility
- UI consistency
- UX technical readiness
- Responsive design
- Performance
- Operational readiness

For each category provide:
- percentage
- evidence
- remaining gap
- blocker severity

Final classification must be exactly one:
GO
CONDITIONAL GO
NO-GO

GO is allowed only if:
- zero P0 defects
- all required automated gates exit 0
- DB integrity/FK PASS
- backup/restore verified
- no critical/serious a11y violations
- reporting transport works
- deployment contract is consistent
- no known default/exposed production secret
- real human UAT is either completed successfully OR clearly remains the only external prerequisite before broader rollout

Never claim human UAT passed unless real results are provided.

Finally provide:
A. completed items
B. remaining P0/P1/P2
C. exact company-pilot checklist
D. exact commands and exit codes
E. files changed during the full implementation program

Do not commit.
Do not push.
Do not deploy.
```

---

## ترتيب التنفيذ المقترح

شغّلها كذا:

```text
00 Baseline

P0:
01 Reports
02 Migration parity
03 Test/E2E registry
04 Deployment contract

P1:
05 Auth/password/AI safe mode
06 User durable audit
07 Request security
08 QC CI
09 Accessibility

UX / Pilot hardening:
10 Design system/navigation
11 Lab command center/management
12 Forms/sample UX
13 Change requests/notifications
14 Reports/print UX
15 Observability
16 Visual/responsive
17 Performance
18 UAT/onboarding
19 WI source guard

Final:
20 Full acceptance + re-audit
```

أهم شيء: **لا تجمع 01–20 في جلسة Luna واحدة.** خله ينفذ كل Task، يشغل اختباراته، يصلح أي Regression، ويعطيك النتيجة قبل ما ترسل اللي بعده. بهذه الطريقة ما يصير عندك Agent يغيّر 70 ملف وبالأخير ما تعرف أي تغيير كسر النظام.

وحسب `package.json` الحالي عندك بالفعل قاعدة اختبار كبيرة جدًا ومجموعة scripts جاهزة، لذلك البرومبتات مصممة لإعادة استخدام الموجود بدل اختراع Testing Framework ثاني.

ملاحظة واحدة ما يقدر Codex يحلها من الكود نفسه: **تدوير أي API key انكشف سابقًا لازم يتم من لوحة مزود الخدمة**؛ Prompt 05 يخلي النظام آمن بدون المفتاح ويمنع تسريبه، لكنه ما يقدر يخترع أو يدوّر Secret بالنيابة عنك.

# BRIGHTAI QC Task Manager
## Master Pilot Prompt Pack v8 (00 → 21) — Execution Checklist Edition

**Repository:** `YEEEAE/BRIGHTAI`
**Target application:** `apps/qc-task-manager/`
**Prompt language:** English (reports to the user in Saudi Arabic)
**Execution model:** Execute sequentially by priority. Do not skip acceptance criteria.

---

# How to Use This Checklist

- Mark `☐` as not completed.
- Change it to `✅` when the prompt has been implemented and verified.
- Do not mark a prompt complete until its acceptance criteria and tests pass.
- If implementation is partial, leave `☐` and record notes in the status area.
- The executing agent must inspect the current repository before making changes.
- Existing BRIGHTAI architecture is the source of truth.

## Global Prompt Execution Status

- [✅] Prompt 00 — Baseline + Execution Contract
- [✅] Prompt 01 — Reporting API Transport
- [✅] Prompt 02 — Migration Parity
- [✅] Prompt 03 — Test Registry + Full E2E
- [✅] Prompt 04 — Deployment Contract
- [✅] Prompt 05 — Auth + Password Lifecycle + AI Safe Mode
- [✅] Prompt 06 — Full Product UI/UX Reconstruction
- [✅] Prompt 07 — Durable User Administration Audit
- [✅] Prompt 08 — Request Security
- [☐] Prompt 09 — Dedicated QC CI
- [☐] Prompt 10 — Accessibility Gate
- [☐] Prompt 11 — Design System Verification + Navigation Refinement
- [☐] Prompt 12 — Lab Management Dashboard
- [☐] Prompt 13 — Forms + Sample Productivity
- [☐] Prompt 14 — Change Request Withdraw + Notification Reliability
- [☐] Prompt 15 — Reports UX + Print Quality
- [☐] Prompt 16 — Observability + Error States
- [☐] Prompt 17 — Visual Regression + Responsive
- [☐] Prompt 18 — Performance
- [☐] Prompt 19 — Onboarding + Human UAT Preparation
- [☐] Prompt 20 — WI Catalog Source Guard (SOURCE-BLOCKED)
- [☐] Prompt 21 — Final Company Pilot Gate

## Execution Dependencies & Blocking

- Prompt 06 (full UI/UX reconstruction) MUST land before 11, 13, and 17 —
  those prompts verify/refine the design system instead of redesigning it.
  Do not run 11 before 06 exists.
- Prompt 09 (QC CI) should land after 02 and 03 so the CI gate can include
  embedded-migration parity and the full test/E2E registry from day one.
- Prompt 10 (a11y gate) depends on the shared design primitives from 06 —
  fix accessibility in shared components, not per-page.
- Prompt 15 (reports/print) requires the reporting transport (01) working.
- Prompt 12 (lab management) depends on the role-home and navigation
  patterns established by 06.
- Prompt 20 (WI catalog) is SOURCE-BLOCKED: controlled source pages 2/3 and
  3/3 are not supplied. Audit + guard only. Do not invent pages.
- Prompt 21 (final gate) is strictly last and requires 00–20 done
  (20 may be exempted as SOURCE-BLOCKED with an explicit gap entry).
- Status notes for partially completed prompts:

```text
00 ✅ delivered (baseline + execution contract)
01 ✅ delivered (reporting transport)
02 ✅ delivered (migration parity)
03 ✅ delivered (test/E2E gate)
04 ✅ delivered (deployment contract)
05 ✅ delivered (password lifecycle migration 036 + AI safe mode)
06 ☐ not started
```

---

هذي النسخة النهائية المرتبة **00 → 21** بعد إضافة برومبت التصميم الشامل كرقم **06**، مع تعديل البرومبتات اللي بعده بحيث ما تعيد نفس الشغل بدون داعي.

---

# 00 — Baseline + Execution Contract

```text
TASK ID: QC-PILOT-BASELINE-000

You are working on the private repository:

YEEEAE/BRIGHTAI

Primary application:
apps/qc-task-manager/

Goal:
Prepare the QC Task Manager for a controlled real-company pilot.

This task establishes the technical baseline and execution contract for all following tasks.

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
6. Use the existing notifications table.
7. APPROVED/VOID/final controlled records remain immutable.
8. Preserve approval snapshots and historical traceability.
9. Prevent self-review/self-approval where required.
10. All unsafe mutations retain CSRF protection.
11. Do not weaken CSP.
12. Do not introduce unsafe-inline or unsafe-eval.
13. No heavy UI framework.
14. No unnecessary cloud dependency.
15. No PostgreSQL migration.
16. No Redis requirement for QC.
17. No breaking schema reset.
18. Existing company/user data must survive upgrades.
19. Existing WI source spelling/provenance must remain intact.
20. Do not silently correct controlled-source data.

FIRST:

Read all project instructions that apply.

Inspect:

package.json
apps/qc-task-manager/package.json
apps/qc-task-manager/README.md
apps/qc-task-manager/src/
apps/qc-task-manager/db/
apps/qc-task-manager/scripts/
apps/qc-task-manager/docs/
AGENTS.md
CLAUDE.md
.agents/
any QC-specific project instructions

Then establish current reality:

git rev-parse HEAD
git status --short
node --version
pnpm --version

Run:

pnpm --filter @brightai/qc-task-manager typecheck
pnpm --filter @brightai/qc-task-manager test:manifest
pnpm --filter @brightai/qc-task-manager test:route-manifest
pnpm --filter @brightai/qc-task-manager test:migrations
pnpm --filter @brightai/qc-task-manager build

Do not fix failures yet unless a failure prevents inspection.

Create:

apps/qc-task-manager/docs/PILOT-IMPLEMENTATION-STATUS.md

Document:

HEAD SHA
dirty/clean state
Node version
pnpm version
commands
exit codes
PASS/FAIL
exact failing suites
P0/P1/P2 queue

Classify each feature as:

IMPLEMENTED
PARTIAL
MISSING
BLOCKED
RUNTIME-NOT-VERIFIED

Explicitly inspect:

reporting transport
migration parity
test manifest
E2E acceptance
deployment
authentication
user audit
accessibility
navigation
WI import
backup
audit
permissions

Final response in Saudi Arabic:

1. What you inspected
2. Commands run
3. Baseline failures
4. Files created/changed
5. Risks
6. Exact next recommended task

Stop after baseline.

Do not commit.
Do not push.
Do not deploy.
```

---

# 01 — Reporting API Transport

```text
TASK ID: QC-REPORT-TRANSPORT-001
PRIORITY: P0

Repository:
YEEEAE/BRIGHTAI

Application:
apps/qc-task-manager/

MISSION:

Fix the QC Task Manager reporting HTTP transport completely.

Before changing code inspect:

src/pages/reports.astro
src/pages/lab/reports*
src/lib/reporting/**
src/lib/lab/report*
scripts/e2e-reports.mjs
scripts/route-manifest.mjs
src/lib/permissions.ts
src/lib/api-security.ts
existing export API routes

Expected URL contract:

/api/reports/[reportType].csv
/api/reports/[reportType].xlsx
/api/reports/[reportType].pdf
/api/reports/audit

Verify the real tracked source first.

GOAL:

Implement or restore missing report API routes without duplicating report-domain logic.

REQUIREMENTS:

1. Reuse existing report catalog.
2. Reuse existing report authorization.
3. Reuse existing query/filter logic.
4. Reuse existing CSV/XLSX/PDF writers.
5. Do not build another report engine.
6. Server must resolve authoritative scope.
7. Ignore forged client-side scope.
8. Employee only sees authorized employee data.
9. Supervisor only sees authorized team/department scope.
10. Manager/admin organization scope only where permissions allow.
11. Invalid report type gets controlled error.
12. Invalid format gets controlled error.
13. Authentication required.
14. No IDOR.
15. Validate every filter server-side.
16. Safe Content-Type.
17. Safe Content-Disposition.
18. Never interpolate user input into filesystem paths.
19. Persist report audit.
20. Protect audit endpoint.
21. Do not invent quality/scientific values.

TEST:

CSV
XLSX
PDF
invalid report
anonymous
employee forged organization scope
supervisor forged organization scope
manager valid organization scope
audit persistence
audit permission
Content-Type
filename
date filters
employee filters

Run:

pnpm typecheck
pnpm test:dashboard-reports
pnpm test:lab-reports
pnpm test:route-manifest
pnpm test
pnpm build

Then execute reporting E2E against isolated SQLite.

Do not commit.
Do not push.
Do not deploy.

Final Saudi-Arabic report:

root cause
files changed
routes implemented
authorization behavior
tests
exact results
remaining issues
```

---

# 02 — Migration Parity

```text
TASK ID: QC-MIGRATION-PARITY-002
PRIORITY: P0

Repository:
YEEEAE/BRIGHTAI

Application:
apps/qc-task-manager/

MISSION:

Ensure on-disk migrations and embedded application migrations are identical.

Inspect:

db/migrations/**
src/lib/db.ts
src/lib/migrations.ts
scripts/test-migrations.mjs
scripts/db-doctor.mjs

Specifically inspect migration 031.

RULES:

Do not modify historical migration content merely to make tests pass.

Do not rewrite applied migrations.

Every embedded migration must exactly match:

version
filename
migration name
source
SHA-256 checksum

Fix migration 031 registration if disk and embedded values differ.

Prefer importing the real SQL file using ?raw.

Create:

scripts/test-embedded-migration-parity.mjs

The test must enumerate repository migrations and compare against the embedded registry.

FAIL on:

missing migration
extra migration
wrong filename
wrong name
wrong version
source mismatch
checksum mismatch
non-sequential history

Expose an immutable embedded migration registry if necessary.

Register the new test in:

package.json
test manifest
full test runner

Acceptance:

fresh DB migrates to latest
existing DB remains valid
second migration run applies zero
checksum drift detection still works
foreign_key_check PASS
integrity_check PASS
embedded parity PASS

Run:

pnpm test:migrations
pnpm test:embedded-migration-parity
pnpm test
pnpm typecheck
pnpm build

Never reset a non-disposable DB.

Do not commit.
Do not push.
Do not deploy.

Final response:

exact issue
exact migration mismatch
files changed
checksums
test results
```

---

# 03 — Test Registry + Full E2E

```text
TASK ID: QC-TEST-GATE-003
PRIORITY: P0

Repository:
YEEEAE/BRIGHTAI

Application:
apps/qc-task-manager/

MISSION:

Make the test and E2E registry impossible to silently drift.

Inspect:

package.json
scripts/test-manifest.mjs
scripts/test-manifest-guard.mjs
scripts/run-full-tests.mjs
scripts/e2e-acceptance.mjs
scripts/test-*.mjs
scripts/e2e-*.mjs

Specifically inspect:

scripts/e2e-lab-search.mjs

GOALS:

A. Register Lab Search E2E.
B. Detect orphan tests.
C. Detect orphan E2Es.
D. Produce deterministic full acceptance.

Create explicit classifications:

canonical tests
meta tests
canonical E2Es
helpers/non-runnable scripts

The guard must fail if:

1. package test:* missing from manifest
2. manifest command absent from package.json
3. test-*.mjs unregistered
4. e2e-*.mjs unregistered
5. registered file missing
6. duplicate entries

Add lab-search to acceptance.

Preserve:

employee data isolation
manager visibility
search fields
mobile/desktop checks
isolated DB per suite
isolated port
timeouts
server cleanup
browser cleanup
restart persistence

Enhance acceptance summary:

suite
script
passed assertions
failed assertions
duration
timeout
total suites
total assertions
HEAD SHA
dirty state

Run:

pnpm test:manifest
pnpm test
pnpm build
pnpm e2e:acceptance

The task is incomplete unless:

pnpm e2e:acceptance

exits with code 0.

If it fails:

fix the real first failure
rerun the complete acceptance suite

Do not weaken assertions.
Do not arbitrarily increase timeouts.

Do not commit.
Do not push.
Do not deploy.
```

---

# 04 — Deployment Contract

```text
TASK ID: QC-DEPLOYMENT-CONTRACT-004
PRIORITY: P0

Repository:
YEEEAE/BRIGHTAI

Application:
apps/qc-task-manager/

MISSION:

Make repository deployment configuration and documentation match the real QC runtime.

Inspect:

render.yaml
apps/qc-task-manager deployment docs
README
src/lib/db.ts
src/lib/backup.ts
src/lib/backup-scheduler.ts
src/lib/systemHealth.ts
src/pages/api/health.ts
package.json

Do not break the public BrightAI website deployment.

QC REQUIREMENTS:

Astro Node SSR
Node 22-compatible
one writable instance
persistent disk
SQLite database on persistent disk
QC_DATABASE_PATH configured
NODE_ENV=production
no secrets in repository
health endpoint
backup directory persistent
restart persistence

Determine the safest deployment structure:

existing Render blueprint second service

OR

separate QC deployment config/manual service

Do not invent unsupported Render behavior.

Fix backup env contract.

If docs advertise:

QC_BACKUP_DIR

then support:

process.env.QC_BACKUP_DIR
?? backupDirectoryForDatabase(DB_PATH)

Preserve current fallback.

Add deployment contract tests:

one instance accepted
WEB_CONCURRENCY >1 rejected
RENDER_NUM_INSTANCES >1 rejected
QC_HORIZONTAL_SCALING=true rejected
DB path resolution
backup path resolution
no secret logging

Update:

DEPLOYMENT.md
README
env variable reference
restore runbook

Add pre-pilot checklist:

persistent disk
DB path
backup write
restart persistence
health
audit chain
integrity
foreign keys

Do not deploy.
Do not create paid resources.
Do not hardcode disk size unless requirements define it.

Run affected tests and build.

Final Saudi-Arabic report:
configuration drift
changes
remaining operator steps
```

---

# 05 — Auth + Password Lifecycle + AI Safe Mode

```text
TASK ID: QC-AUTH-PILOT-HARDENING-005
PRIORITY: P1

Repository:
YEEEAE/BRIGHTAI

Application:
apps/qc-task-manager/

MISSION:

Harden authentication for real employee pilot use without replacing the current auth architecture.

Inspect:

src/lib/auth.ts
src/lib/seed.ts
src/lib/users.ts
src/lib/validation.ts
src/lib/permissions.ts
login/logout
admin users
migrations
auth E2E
AI provider configuration

KEEP:

bcrypt
server-side sessions
lockout
IP protection
dummy hash protection
current role/session architecture

Add controlled password lifecycle.

Using the next sequential migration add:

must_change_password
password_changed_at

Behavior:

1. Newly created users with temporary password require change.
2. Seeded pilot users require change.
3. User with must_change_password can only access password-change flow and logout.
4. Add account security/password page.
5. Require current password.
6. New password.
7. Confirm password.
8. Existing password policy.
9. Successful change clears must_change_password.
10. Set password_changed_at.
11. Invalidate other sessions.
12. Admin reset sets must_change_password again.
13. Never log passwords/hashes.

Do not add email recovery.
Do not add external identity provider.

AI:

Search repository for exposed/hardcoded provider secrets.

Do not print discovered secrets.

Ensure application works fully without AI provider.

AI must remain advisory.

If provider unavailable:

show controlled unavailable state.

Core workflows must not depend on AI.

Add provider-health diagnostics without exposing secrets.

Document:

ROTATE ANY PREVIOUSLY EXPOSED AI PROVIDER KEY OUTSIDE THE REPOSITORY BEFORE ENABLEMENT.

Tests:

first login redirect
bypass prevention
correct password change
wrong current password
confirmation mismatch
session invalidation
admin reset
no secret logging
AI absent
build/core app unaffected

Run:

typecheck
tests
build
auth E2E

Do not commit.
Do not push.
Do not deploy.
```

---

# 06 — Full Product UI/UX Reconstruction

```text
TASK ID: QC-PRODUCT-UIUX-RECONSTRUCTION-006
PRIORITY: P1

Repository:
YEEEAE/BRIGHTAI

Application:
apps/qc-task-manager/

MISSION:

Perform a complete product-level UI/UX/design audit and improvement.

This is NOT merely a CSS task.

Review and improve literally:

Visual design
UI nature
Product appearance
Page composition
Information hierarchy
Element placement
Element sizing
Spacing
Typography
Icons
Cards
Tables
Forms
Buttons
Button placement
Button hierarchy
Navigation
Search
Filters
Status indicators
Empty states
Loading states
Error states
Success states
Dialogs
Dropdowns
Dashboards
Laboratory screens
Task screens
Admin screens
Reports
Documents
Mobile
Tablet
Desktop
Ease of use
Clicks
Cognitive load
Discoverability
Workflow clarity

The application must feel like one polished internal enterprise product.

CRITICAL:

Do not change business rules for design reasons.
Do not weaken RBAC.
Do not move permission logic from permissions.ts.
Do not break audit.
Do not break CSRF.
Do not weaken CSP.
Do not add unsafe-inline.
Do not add a heavy UI library.
Do not replace Astro/Tailwind/React.
Do not invent scientific values.
Do not remove functionality just because it is difficult to redesign.

UI remains English.

Final explanation must be Saudi Arabic.

PHASE 1 — INVENTORY

Recursively inspect every user-facing route in src/pages.

Inspect:

src/components/
src/layouts/
src/styles/
src/lib/lab/navigation.ts
src/lib/permissions.ts

Build a screen matrix:

Route
Purpose
Primary role
Other roles
Primary action
Secondary actions
Destructive actions
Navigation
Forms
Tables
Filters
Search
Empty state
Error state
Responsive behavior
UX problems
Design inconsistencies

Cover:

Login
Employee
Supervisor
Manager
Admin
Tasks
Search
Notifications
Delete requests
Findings
RCA
CAPA
Evidence
Reports
Lab
Tests
Test Form
Review
Products
Equipment
Calibration
Maintenance
Templates
Documents
WI
SOP
Acknowledgements
Retests
Change Requests
Lab Search
Calendar
Audit
Data Quality
System Health
Users

PHASE 2 — PRINCIPLES

Use:

clarity over decoration
one obvious primary action
destructive actions separated
users know where they are
users know current status
users know next action
reduce unnecessary scroll
reduce unnecessary navigation
progressive disclosure
dense operational data remains readable
avoid dashboard card overload
tables for comparison
cards for summary
forms follow real task order
status not color-only
mobile actions reachable
controlled actions unmistakable

PHASE 3 — DESIGN LANGUAGE

Create:

docs/UI-DESIGN-SYSTEM.md

Define:

typography
spacing
radius
shadows
brand colors
neutral colors
info
success
warning
danger
status semantics

Standardize:

DRAFT
PENDING
SUBMITTED
IN REVIEW
APPROVED
REJECTED
PASS
FAIL
HOLD
VOID
ARCHIVED
OVERDUE

PHASE 4 — PRIMITIVES

Audit existing components before adding new ones.

Consolidate/create:

AppButton
PageHeader
SectionHeader
StatusBadge
DataCard
MetricCard
InfoBanner
WarningBanner
ErrorBanner
SuccessBanner
FormField
FormHelp
FormError
ValidationSummary
FilterBar
SearchField
DataTable
Pagination
EmptyState
LoadingState
ErrorState
ConfirmDialog
DropdownMenu
ActionMenu
StickyActionBar
PageTabs
SectionNavigation

Avoid duplicate components.

PHASE 5 — BUTTON SYSTEM

Classify all buttons:

PRIMARY
SECONDARY
GHOST
DESTRUCTIVE
ICON-ONLY

Examples:

Primary:
Save
Create
Submit
Approve
Generate

Secondary:
Save Draft
Edit
Export
Request Changes
Back

Destructive:
Delete
Void
Archive

Standardize button placement.

Form desktop example:

[Cancel] [Save Draft] [Submit for Review]

Keep destructive actions visually separate.

Use explicit labels:

Submit for Review
Approve Test
Save Draft
Add Equipment
Generate PDF

Icon-only buttons require aria-label and usable target.

PHASE 6 — PAGE STRUCTURE

Standard page skeleton:

Breadcrumb
Page Header
Title
Description
Status
Primary actions
Important alerts
Filters/Search
Main content
Secondary/history
Danger actions

Long forms:

Breadcrumb
Header
Status
Section navigation/progress
Form
Sticky actions

PHASE 7 — NAVIGATION

Simplify global mental model.

Prefer high-level groups:

Dashboard
Tasks
Quality
Laboratory
Reports

Administrative utilities should move to secondary/account/admin menus.

Add:

active state
aria-current
consistent focus
mobile navigation

LAB:

Preserve:

Overview
Testing
Master Data
Controlled Documents
Operations

Desktop:
structured section nav/sidebar if useful.

Mobile:
section selector/collapsible groups.

Avoid giant wrapped navigation lists.

PHASE 8 — ROLE HOME

EMPLOYEE:

My Tasks
My Draft Tests
Returned for Changes
My Pending Change Requests
My WI Content
Quick New Test

SUPERVISOR:

Tests Awaiting Review
Documents Awaiting Review
Team Issues
Overdue Tasks
Open Retests
Operational Alerts

MANAGER/ADMIN:

Approvals Waiting
Change Requests
Calibration Risks
FAIL/HOLD Tests
Document Risks
Data Quality
Audit/System Health

Secondary KPIs lower.

PHASE 9 — INFORMATION DENSITY

If 15 equal cards appear, redesign hierarchy.

Use:

Needs Attention
Operational Summary
Secondary Analytics

Do not delete useful data.

PHASE 10 — TABLES

Standardize:

headers
row height
hover
status
pagination
filters
alignment
action column
empty state

Avoid multiple buttons per row.

Use detail link + action menu.

Keep important columns first.

Avoid exposing meaningless internal IDs.

Mobile:
intentional horizontal scroll or compact cards where appropriate.

PHASE 11 — SEARCH/FILTERS

Standard pattern:

Search
Status
Type
Date
More Filters
Reset

Show active filters.
Show result count.
Collapse advanced filters.

PHASE 12 — DETAIL PAGES

Top block:

Identifier
Title/Product
Status
Result
Owner/Tester
Important date
Primary actions

Then:

Overview
Workflow
Related Data
Evidence/Documents
History/Audit

Do not let audit history dominate active operations.

PHASE 13 — LAB TEST FORM

Optimize for high-frequency use.

Suggested flow:

1 Sample Identification
2 Equipment/Product
3 Approved References
4 Test Conditions
5 Samples
6 Final Result
7 Review

Separate:

Approved reference values

from

Recorded values

Reference values must look read-only.

Do not invent scientific data.

PHASE 14 — DOCUMENTS / WI / SOP

Clearly distinguish:

Catalog only
Missing Content
Draft
In Review
Approved
Superseded
Archived

Catalog-only WI primary action:

Add Content

not vague Edit.

PHASE 15 — CHANGE REQUESTS

Make review UI diff-oriented.

Header:

Request
Entity
Requester
Submitted
Status
Target

Diff:

Field | Current | Proposed

Reviewer actions separated from requester actions.

PHASE 16 — EQUIPMENT/CALIBRATION

Equipment detail must quickly answer:

What equipment?
Where?
Can it be used?
Calibration state?
Maintenance due?
Dependencies?

Hierarchy:

Identity
Operational Status
Calibration
Maintenance
Relations
History

PHASE 17 — REPORTS UI

Improve:

Report Type
Basic Filters
Advanced Filters
Resolved Scope
Matching records
Downloads

Downloads:

CSV
XLSX
PDF

PHASE 18 — ADMIN/SYSTEM HEALTH

Admin must look operational.

User management:

Search
User
Role
Department
Status
Actions

Avoid many inline buttons.

System Health groups:

Application
Database
Backup
Audit
Storage
Deployment

Healthy state calm.
Problems prominent.

PHASE 19 — STATES

Differentiate:

No records
No search results
No permission
Load error
Pending review
Missing content
No assigned work

Give next action.

PHASE 20 — DANGEROUS ACTIONS

Audit:

Delete
Archive
Void
Reject
Cancel
Restore
Approval when irreversible

Use clear accessible confirmations.

PHASE 21 — RESPONSIVE

Audit at:

1440
1280
1024
768
390
360

Desktop:
efficient use.

Tablet:
avoid squeezed forms.

Mobile:
single column
sticky actions
usable navigation
no clipped dialogs
no accidental page overflow

Do not shrink buttons/text excessively.

PHASE 22 — ACCESSIBILITY

Improve:

keyboard
focus
labels
aria
errors
dialogs
reduced motion
semantic tables

Target:

Critical Axe = 0
Serious Axe = 0

PHASE 23 — MICRO INTERACTIONS

Allowed:

loading state
hover
focus
collapse
success feedback
subtle transitions

Avoid:

decorative animation
marketing motion
parallax

PHASE 24 — PRODUCT POLISH

Audit:

capitalization
terminology
date formats
status names
button labels
breadcrumbs
page titles
help text

Same concept = same wording.

PHASE 25 — FUNCTIONAL UX

Count unnecessary clicks.

High-frequency actions should usually be reachable within 1–2 navigation decisions.

Examples:

Employee → New Test
Supervisor → Awaiting Review
Manager → Change Requests
Admin → Users

PHASE 26 — AUTOMATED UX SAFEGUARDS

Add lightweight semantic checks:

no dead internal links
no unauthorized nav links
no page overflow
icon-only buttons have labels
major forms have validation summaries
Critical/Serious Axe zero
one H1 per major page
no conflicting primary actions

Avoid brittle Tailwind-class tests.

PHASE 27 — VISUAL QA

Use Playwright screenshots.

Screens:

Login
Employee home
Manager home
Task detail
Lab home
Tests
New Test
Test Detail
Products
Equipment
Documents
WI missing content
Change Request
Reports
Admin Users
System Health

Widths:

1440
768
390

Review actual screenshots.

Fix:

overflow
misalignment
crowded actions
weak hierarchy
bad whitespace
clipping
inconsistent cards

PHASE 28 — NO OVER-REDESIGN

Every change must improve:

clarity
speed
consistency
accessibility
error prevention
discoverability
responsive usability

PHASE 29 — VALIDATION

Run:

pnpm typecheck
pnpm test:manifest
pnpm test:route-manifest
pnpm test
pnpm build
affected E2Es
pnpm e2e:acceptance

The task is incomplete if business E2E breaks.

PHASE 30 — REPORT

Create:

apps/qc-task-manager/docs/UI-UX-PRODUCT-AUDIT.md

Include:

screens audited
problems
changes
components
navigation before/after
buttons
tables
forms
lab
mobile
a11y
screenshots
remaining UX risks
UAT requirements

Score BEFORE/AFTER:

Visual Design
UI Consistency
Information Architecture
Navigation
Buttons
Forms
Tables
Laboratory UX
Task UX
Admin UX
Mobile
Accessibility
Ease of Use
Error Prevention
Product Polish
Overall Product UX

Do NOT claim human UAT.

Mark:

RUNTIME USER UAT REQUIRED

Final response in Saudi Arabic.

Do not commit.
Do not push.
Do not deploy.
```

---

# 07 — Durable User Administration Audit

```text
TASK ID: QC-USER-AUDIT-007
PRIORITY: P1

Repository:
YEEEAE/BRIGHTAI

Application:
apps/qc-task-manager/

MISSION:

Replace console-only user administration audit with durable database-backed auditing.

Inspect:

src/lib/users.ts
qc_audit_log
src/lib/audit/**
admin user routes/pages
permissions.ts
audit views

Do not create another audit system if qc_audit_log can support this safely.

Required events:

USER_CREATE
USER_UPDATE
USER_ROLE_CHANGE
USER_ACTIVATE
USER_DEACTIVATE
USER_PASSWORD_RESET

Never persist:

password
password hash
session token

Persist:

target user
actor
action
before
after
note/reason
timestamp
hash chain

If CHECK constraints require new entity/action values:

use the next sequential migration.

Preserve all historical rows and chain integrity.

Self-protection remains:

no self-deactivation
no self-demotion

Add Admin audit filtering if appropriate.

Tests:

every operation emits expected audit
no passwords
unauthorized audit access rejected
hash chain PASS
historical audit unchanged
failed mutation does not emit successful audit

Run:

migrations
audit tests
user tests
full tests
build

Do not commit.
Do not push.
Do not deploy.
```

---

# 08 — Request Security

```text
TASK ID: QC-REQUEST-SECURITY-008
PRIORITY: P1

Repository:
YEEEAE/BRIGHTAI

Application:
apps/qc-task-manager/

MISSION:

Strengthen request security without replacing authentication.

Inspect:

src/lib/api-security.ts
src/middleware.ts
every mutation API
UI fetch calls
CSRF tests
security tests

Keep current Origin CSRF.

Add Fetch Metadata defense:

Reject:

Sec-Fetch-Site: cross-site

Accept:

same-origin

If Sec-Fetch-Site absent:

fall back to existing Origin logic.

Ensure every:

POST
PUT
PATCH
DELETE

uses canonical request security.

Add architecture/security scanning test.

Preserve:

Content-Type validation
request size
auth
rate limits

Rate-limit buckets:

keep in-memory because QC is one-instance.

Add stale-entry pruning.

Do not add Redis.

Tests:

same-origin accepted
cross-site rejected
invalid Origin rejected
no Fetch Metadata still protected
content type
size limit
rate limit
pruning
login lockout
AI rate limiter

Do not weaken CSP.
Do not add wildcard CORS.

Run tests/typecheck/build.

Do not commit.
Do not push.
Do not deploy.
```

---

# 09 — Dedicated QC CI

```text
TASK ID: QC-CI-RELEASE-GATE-009
PRIORITY: P1

Repository:
YEEEAE/BRIGHTAI

Application:
apps/qc-task-manager/

MISSION:

Create a dedicated GitHub Actions release gate for QC.

Inspect all existing .github/workflows.

Do not break public BrightAI workflows.

PR gate:

frozen pnpm install
QC typecheck
test manifest
route manifest
embedded migration parity
migration tests
full QC tests
production build

Main/nightly/manual:

full QC E2E acceptance

Use repository Node/pnpm versions.

No production secrets required.

Use isolated temporary SQLite DBs.

On failure upload safe artifacts where useful:

acceptance summary
a11y report
visual QA report
safe logs

Add aggregate job:

QC / Release Gate

Document recommended branch protection:

require QC / Release Gate

Do not modify GitHub settings automatically.

Do not deploy.

Final output:

workflow path
jobs
triggers
local equivalent commands
required secrets
```

---

# 10 — Accessibility Gate

```text
TASK ID: QC-A11Y-GATE-010
PRIORITY: P1

Repository:
YEEEAE/BRIGHTAI

Application:
apps/qc-task-manager/

MISSION:

Turn accessibility from report-only checking into a real pilot gate.

Inspect:

scripts/e2e-a11y.mjs
BaseLayout
Navbar
global.css
forms
dialogs
tables
new shared design primitives from Task 006

KEEP:

existing keyboard tests.

Axe behavior:

FAIL if:

critical > 0
serious > 0

Moderate/minor:

report but initially do not block unless affecting core workflow.

Cover:

/login
employee home
manager home
task detail
/lab
/lab/tests
/lab/tests/new
test detail
/lab/documents
/lab/change-requests
/lab/search
/reports

Use deterministic fixtures.

Check:

labels
aria-describedby
required fields
headers
dialog names
focus
skip link
status not color-only
keyboard
focus-visible
mobile navigation

Fix genuine problems in shared components first.

Do not disable rules just to pass.

Create:

download/qa/a11y-qc-report.json

Target:

critical = 0
serious = 0

Run:

a11y E2E
full tests
build
full acceptance

Do not commit.
Do not push.
Do not deploy.
```

---

# 11 — Design System Verification + Navigation Refinement

> هذا صار **Verification/Consolidation** لأن برومبت 06 سوّى الشغل الكبير.

```text
TASK ID: QC-UI-CONSOLIDATION-011
PRIORITY: P1/P2

Repository:
YEEEAE/BRIGHTAI

Application:
apps/qc-task-manager/

DEPENDENCY:

QC-PRODUCT-UIUX-RECONSTRUCTION-006 must already be implemented.

MISSION:

Do NOT redesign the product again.

Verify, consolidate and clean up the UI architecture introduced by Task 006.

Inspect:

docs/UI-DESIGN-SYSTEM.md
shared UI primitives
Navbar
LabSecondaryNav
all remaining manually styled high-frequency buttons/cards/forms
Tailwind config
global.css

GOALS:

1. Remove duplicated design primitives.
2. Ensure equivalent actions use the same component/pattern.
3. Ensure legacy button styling does not conflict with the new system.
4. Ensure navigation remains reachable for every role.
5. Ensure no permission decision moved into UI.
6. Ensure active navigation states are correct.
7. Ensure mobile navigation matches desktop information architecture.
8. Ensure no dead links were introduced by redesign.
9. Ensure no major page visually bypasses the design system without reason.

Audit repeated patterns:

buttons
status badges
cards
form errors
validation summaries
filter bars
page headers
tables
empty states
dialogs
sticky action bars

Do not mechanically replace one-off elements if doing so makes the code worse.

Run:

design-related tests
navigation E2E
a11y
full tests
build
acceptance

Update UI-DESIGN-SYSTEM.md with the final canonical components.

Final response:
what was consolidated
what remained intentionally custom
remaining inconsistencies

Do not commit.
Do not push.
Do not deploy.
```

---

# 12 — Lab Management Dashboard

```text
TASK ID: QC-LAB-MANAGEMENT-UX-012
PRIORITY: P1/P2

Repository:
YEEEAE/BRIGHTAI

Application:
apps/qc-task-manager/

MISSION:

Improve Lab command center and implement management dashboard if current architecture expects it.

Inspect:

src/pages/lab/index.astro
src/lib/lab/overview.ts
src/lib/lab/navigation.ts
permissions.ts
LabSecondaryNav
change requests
tests
calibration
documents
data quality
audit

PART A — ROLE-BASED LAB HOME

Do not remove useful KPIs.

Prioritize actions.

Employee:

My Tests
Draft Tests
Returned for Changes
My WI Content
My Change Requests
Quick New Test

Supervisor:

Tests Awaiting Review
Documents Awaiting Review
Team Issues
Open Retests
Operational Alerts

Manager/Admin:

Needs Your Attention

Include:

tests requiring action
pending master-data changes
overdue calibration
documents requiring action
data-quality issues

Move secondary metrics lower.

PART B — /lab/management

If navigation/permissions already define it:

implement Manager/Admin-only dashboard.

Include:

Approval queue
Change Requests
Waiting >24h
Rejected contributor changes
Calibration risk
Equipment attention
Document health
WI completion
FAIL/HOLD trends
Retests
Data Quality
Audit/System Health summary

No fake data.

Cards link to real filtered registers.

No new analytics library.

Tests:

RBAC
queries
responsive
navigation

Run affected tests + full tests + build.

Do not commit.
Do not push.
Do not deploy.
```

---

# 13 — Forms + Sample Productivity

```text
TASK ID: QC-FORM-USABILITY-013
PRIORITY: P2

Repository:
YEEEAE/BRIGHTAI

Application:
apps/qc-task-manager/

DEPENDENCY:

Task 006 UI/UX reconstruction already implemented.

MISSION:

Refine real operational form productivity without redoing visual design.

Inspect:

LabTestForm.tsx
Equipment forms
Product forms
Calibration forms
Template forms
Document editor
Task forms
shared form primitives

Verify all high-frequency forms use:

required indicators
consistent errors
validation summary
first-invalid focus
sticky actions where useful
unsaved change protection
Save Draft vs Submit clarity
loading state
double-submit prevention
successful save feedback

LAB SAMPLE PRODUCTIVITY:

Add/refine safe helpers:

Duplicate previous row
Fill down
Clear row
Paste spreadsheet rows
Undo last bulk paste if feasible

Never calculate PASS/FAIL unless existing approved logic explicitly defines it.

Never invent scientific criteria.

Allow Apply to all samples only where semantics are already valid.

Preserve paper-aligned fields.

Preserve legacy data.

Add:

keyboard tests
12-sample E2E
paste tests
data-loss tests

Run affected tests, full tests, build, acceptance.

Do not commit.
Do not push.
Do not deploy.
```

---

# 14 — Change Request Withdraw + Notification Reliability

```text
TASK ID: QC-WORKFLOW-NOTIFICATIONS-014
PRIORITY: P2

Repository:
YEEEAE/BRIGHTAI

Application:
apps/qc-task-manager/

MISSION:

Improve contributor request lifecycle and workflow notifications.

Inspect:

src/lib/lab/changeRequests.ts
lab_change_requests migration/schema
change request pages
notifications.ts
permissions.ts
audit

PART A — WITHDRAW

Add status:

WITHDRAWN

Rules:

requester only
own request only
PENDING only

Cannot withdraw:

APPROVED
REJECTED
already WITHDRAWN

Require CSRF.
Revalidate server-side.

Audit:

PENDING → WITHDRAWN

No canonical mutation applied.

Remove withdrawn requests from pending counts.

Use next sequential migration if needed.

PART B — NOTIFICATION RELIABILITY

Review workflow-critical notification persistence:

review requested
returned/rejected
approval outcome

Where safe:

persist notification in the same SQLite transaction as the workflow mutation.

Do not make external delivery atomic.

Do not add another notifications table.

PART C — NOTIFICATION UX

Filters:

All
Unread
Tasks
Tests
Documents
Change Requests
Calibration/Equipment if existing notification types allow

Do not invent unnecessary notification kinds.

Tests:

ownership
CSRF
forged request
terminal states
audit
notifications
counts
visibility

Do not commit.
Do not push.
Do not deploy.
```

---

# 15 — Reports UX + Print Quality

```text
TASK ID: QC-REPORT-PRINT-UX-015
PRIORITY: P2

DEPENDENCY:

Reporting transport must already be working.

Repository:
YEEEAE/BRIGHTAI

Application:
apps/qc-task-manager/

MISSION:

Refine report-generation UX and controlled print quality.

PART A — REPORT PREVIEW

Before download show:

report type
resolved data scope
date range
filters
matching row count where cheap
current user/role context

Use same authorization path as actual generation.

Never expose unauthorized counts.

Downloads:

CSV
XLSX
PDF

Use shared standardized buttons.

PART B — PRINT

Audit:

Lab Test
Equipment
Maintenance
Calibration
Controlled Documents where applicable

Print requirements:

A4-friendly
no clipped critical columns
appropriate orientation
page breaks
authorization metadata
signature/e-signature metadata
QR
reference/source metadata
no navigation
no action buttons
no altered scientific values

Use Playwright print media.

Add print regression checks.

Do not add another PDF framework if Playwright/existing PDF solution suffices.

Run:

report tests
print tests
full tests
build
acceptance

Do not commit.
Do not push.
Do not deploy.
```

---

# 16 — Observability + Error States

```text
TASK ID: QC-OBSERVABILITY-016
PRIORITY: P2

Repository:
YEEEAE/BRIGHTAI

Application:
apps/qc-task-manager/

MISSION:

Make the application easy to troubleshoot during company pilot.

Do not add external SaaS monitoring.

PART A — REQUEST ID

Generate server-side request/correlation ID.

Include in safe server logs.

Log:

timestamp
request_id
method
route
actor_id where available
role where useful
HTTP status
duration_ms
safe error code

Never log:

password
password hash
session token
file contents
AI secrets

PART B — UI ERROR STATES

Standardize:

No records
No search results
Permission denied
System error
Conflict
Stale record
Success
Warning

Every state should suggest available next action.

PART C — ERROR CODES

Create stable safe codes where useful:

AUTH
FORBIDDEN
VALIDATION
NOT_FOUND
CONFLICT
STALE_CHANGE
DB
REPORT
UPLOAD

Do not leak SQLite errors to users.

System Health may show aggregate operational status without becoming a full logging platform.

Tests:

request ID
sanitization
safe messages
no secrets
conflict states

Do not commit.
Do not push.
Do not deploy.
```

---

# 17 — Visual Regression + Responsive

```text
TASK ID: QC-VISUAL-RESPONSIVE-017
PRIORITY: P2

Repository:
YEEEAE/BRIGHTAI

Application:
apps/qc-task-manager/

MISSION:

Add lightweight visual/responsive regression checks using Playwright.

Do not add visual-testing SaaS.

Screens:

login
employee home
manager home
task detail
lab home
tests register
new test
test detail
documents
document detail/editor
equipment
change request
lab search
reports
lab management if implemented
admin users
system health

Viewports:

1440
1024
768
360

For each:

no accidental page overflow
primary action reachable
navigation usable
responsive table strategy
dialogs inside viewport
errors not clipped

Use deterministic fixtures.

Disable nondeterministic animation/time where necessary.

Store QA artifacts in generated/ignored directory unless intentionally maintaining small committed baselines.

Integrate major responsive assertions into full/nightly acceptance.

Do not modify UI merely for pixel similarity.

Fix actual usability regressions.

Run full affected E2E and tests.

Do not commit.
Do not push.
Do not deploy.
```

---

# 18 — Performance

```text
TASK ID: QC-PERFORMANCE-018
PRIORITY: P2

Repository:
YEEEAE/BRIGHTAI

Application:
apps/qc-task-manager/

MISSION:

Create evidence-based performance testing for single-instance SQLite QC.

Do not optimize blindly.

Do not use production DB.

Create parameterized disposable fixture generation.

Large profile approximately:

10k tasks
5k lab tests
~60k samples
equipment history
calibration history
maintenance
documents
versions
audit events

CI profile may be smaller.

Benchmark:

dashboard
employee tasks
task search
lab home
lab search
tests register
equipment
documents
change requests
audit
reports

Measure:

p50
p95
max
query counts where possible
report duration

Generate:

download/qa/qc-performance.json
Markdown summary

Use EXPLAIN QUERY PLAN for slow SQL.

Only add indexes with evidence.

Any new index uses next sequential migration.

Preserve integrity and FK checks.

Do not create arbitrary regulatory performance thresholds.

Run performance tests + schema tests.

Do not commit.
Do not push.
Do not deploy.
```

---

# 19 — Onboarding + Human UAT Preparation

```text
TASK ID: QC-PILOT-UAT-019
PRIORITY: P1/P2

Repository:
YEEEAE/BRIGHTAI

Application:
apps/qc-task-manager/

MISSION:

Prepare the QC application for real employee UAT.

Do NOT claim Codex validated human usability.

PART A — ONBOARDING

Add concise contextual help where needed:

first login/password change
role dashboard
task workflow
Lab Test creation
Save Draft vs Submit
review/approval
controlled document lifecycle
change requests

Do not add a tour library.

PART B — UAT RUNBOOK

Create:

apps/qc-task-manager/docs/PILOT-UAT.md

EMPLOYEE SCENARIOS:

login/password
find own task
update task
create task if allowed
create lab test
fill samples
submit
search
find WI
start WI content
submit master-data proposal

SUPERVISOR:

review test
return for changes
review controlled document
team workspace

MANAGER:

approve test with e-signature
change request review
document/template approval
reports
calibration risk
audit

ADMIN:

create user
reset password
role management
system health
backup

For every scenario collect:

success yes/no
completion time
assistance required
errors
confusing labels/buttons
expected button location
comments

PART C — CLASSIFICATION

P0:
blocks work/data/security

P1:
major workflow issue

P2:
usability/polish

P3:
future enhancement

Do not invent UAT results.

Do not build complex feedback software.

Do not commit.
Do not push.
Do not deploy.
```

---

# 20 — WI Catalog Source Guard

```text
TASK ID: QC-WI-CATALOG-COMPLETION-020
PRIORITY: SOURCE-BLOCKED

Repository:
YEEEAE/BRIGHTAI

Application:
apps/qc-task-manager/

MISSION:

Audit WI catalog architecture without inventing missing controlled-source pages.

Inspect:

src/lib/lab/wiCatalog.ts
WI migrations
lab_documents
lab_document_versions
WI pages/UI
source provenance

Current supplied source:

page 1/3 only.

Requirements:

1. Preserve all existing page-1 rows.
2. Preserve exact spelling.
3. Preserve:
   creation_origin
   source_register_code
   source_class
   source_page
   source_row_no
   source_revision
   source_date
4. No placeholder rows.
5. No guessed codes.
6. No guessed titles.
7. No guessed revisions.
8. No guessed dates.
9. No fake content.
10. Catalog-only remains Missing Content until authored.

Ensure importer can later handle more pages safely.

Every catalog record should have:

source_page
source_row_no

Importer must be:

idempotent
code-based
collision-aware
non-destructive

Never overwrite real:

content
versions
status

Add validation:

no duplicate code
no blank code/title
known source page
existing page-1 rows unchanged
no invented page 2/3
no invented page 3/3

Add readiness TODO:

WI register incomplete until controlled source pages 2/3 and 3/3 are supplied.

Stop there.

Do not commit.
Do not push.
Do not deploy.
```

---

# 21 — Final Company Pilot Gate

```text
TASK ID: QC-COMPANY-PILOT-GATE-021
PRIORITY: FINAL

Repository:
YEEEAE/BRIGHTAI

Application:
apps/qc-task-manager/

ROLE:

Independent final verifier.

Do not trust previous completion messages.

Do not trust historical reports.

Only current source + actual execution count.

Capture:

HEAD SHA
git status
Node
pnpm

Run:

pnpm typecheck
pnpm test:manifest
pnpm test:route-manifest
embedded migration parity
pnpm test:migrations
pnpm test
pnpm build
pnpm e2e:acceptance

Verify disposable production-like DB:

latest migration
integrity_check
foreign_key_check
audit chains
backup
backup verification
restore
restart persistence

SECURITY:

anonymous access
RBAC
CSRF
Fetch Metadata
request size
sessions
password lifecycle
no default production passwords
no exposed provider secrets

TASK SMOKE:

create
assign
progress
comment
evidence
complete
reopen/cancel as authorized

LAB SMOKE:

create draft
fill samples
submit
review
approve/e-sign
immutable approved state
print

DOCUMENT:

catalog/new draft
content
submit
review
approve
revision

MASTER DATA:

employee/supervisor proposal
manager review
canonical apply
audit

REPORTS:

CSV
XLSX
PDF
audit
forged scope denied

WI:

confirm source coverage matches supplied controlled pages only

UI/UX TECHNICAL:

navigation
buttons
forms
tables
error states
empty states
mobile
desktop
a11y
dead links
horizontal overflow
visual consistency

Accessibility gate:

Critical = 0
Serious = 0

Generate:

apps/qc-task-manager/docs/FINAL-PILOT-READINESS.md

Score 0–100:

Backend
Database
Authentication
RBAC
Security
Tasks
QC Operations
Laboratory
Documents
Equipment/Calibration
Reporting
Audit
Notifications
Backup/Restore
Deployment
Testing
Accessibility
UI Consistency
UX Technical Readiness
Responsive Design
Performance
Operational Readiness

For each:

percentage
evidence
remaining gap
severity

Final classification exactly one:

GO
CONDITIONAL GO
NO-GO

GO requires:

zero P0
all automated gates exit 0
DB integrity PASS
FK PASS
backup/restore verified
Critical/Serious a11y = 0
reporting works
deployment contract consistent
no known production default/exposed secret

Human UAT:

Never claim it passed unless real results are supplied.

If UAT has not happened, state clearly:

RUNTIME USER UAT REQUIRED

Final sections:

A. Completed
B. Remaining P0/P1/P2
C. Company pilot checklist
D. Commands and exit codes
E. Files changed
F. Final percentage
G. GO / CONDITIONAL GO / NO-GO

Do not commit.
Do not push.
Do not deploy.
```

## FINAL EXECUTION ORDER

### Phase A — Foundation (delivered ✅)

- [✅] 00 Baseline
- [✅] 01 Reporting API
- [✅] 02 Migration Parity
- [✅] 03 Test/E2E Gate
- [✅] 04 Deployment
- [✅] 05 Auth + Password + AI

### Phase B — Product experience (start here)

- [☐] 06 Full Product UI/UX

### Phase C — Hardening + infrastructure

- [☐] 07 User Audit
- [☐] 08 Request Security
- [☐] 09 QC CI
- [☐] 10 Accessibility
- [☐] 11 UI Consolidation

### Phase D — Operational improvements

- [☐] 12 Lab Management
- [☐] 13 Forms/Sample Productivity
- [☐] 14 Change Requests/Notifications
- [☐] 15 Reports/Print
- [☐] 16 Observability

### Phase E — Verification + readiness

- [☐] 17 Visual/Responsive
- [☐] 18 Performance
- [☐] 19 UAT/Onboarding
- [☐] 20 WI Source Guard (SOURCE-BLOCKED — audit/guard only)
- [☐] 21 Final Pilot Gate

---

# DEFINITION OF DONE

The QC pilot prompt pack (v8) is complete only when Prompts 06–21 are
verified with their acceptance criteria passing (20 may be closed as
SOURCE-BLOCKED with an explicit gap entry), Prompt 21 classifies at least
CONDITIONAL GO, and no prior BRIGHTAI functionality is broken.

---

# AGENT EXECUTION CONTRACT

```text
DO NOT EXECUTE ALL PROMPTS AS ONE BLIND BATCH.

After each prompt:

1. Read .agents/mind/01-mind-latest.md first (project Rule Zero).
2. Inspect current state.
3. Implement only the requested scope.
4. Run relevant tests + typecheck + build.
5. Verify acceptance criteria.
6. List changed files, commands executed, actual results.
7. Update the checklist status in this file.
8. Append a ledger entry to .agents/mind/01-mind-latest.md.
9. Continue only after the prompt is verified.

If something already exists: REUSE IT.
If something partially exists: EXTEND IT.
If something is missing: IMPLEMENT IT.
If something conflicts: STOP THAT SUBTASK, EXPLAIN THE CONFLICT, AND CHOOSE
THE SMALLEST COMPATIBLE CHANGE.

Do not commit.
Do not push.
Do not deploy.
```

وبما إنك نفذت `00–05`، ابدأ الآن مباشرة بـ **06** ثم كمل إلى **21**. أهم فرق في النسخة هذي أن `06` صار المسؤول عن إعادة بناء تجربة المنتج كاملة، بينما `11` و`13` و`17` صار دورهم **تثبيت وتحسين وفحص** بدل ما Codex يعيد نفس التصميم ثلاث مرات.

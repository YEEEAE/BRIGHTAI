# BRIGHTAI QC Laboratory
## Complete DeepSeek Flash v5 Master Implementation Prompt Pack (Continuation)

**Repository:** `YEEEAE/BRIGHTAI`
**Target application:** `apps/qc-task-manager/`
**Primary route:** `/lab`
**Prerequisite:** `audit/qc/prompt4-LAB.md` Prompts 00–37 delivered; 38–40 outstanding.
**Prompt language:** English
**Execution model:** Execute sequentially. Do not skip acceptance criteria.

---

# How to Use This Checklist

- Mark `☐` as not completed.
- Change it to `✅` when the prompt has been implemented and verified.
- Do not mark a prompt complete until its acceptance criteria and tests pass.
- If implementation is partial, leave `☐` and record notes in the status area.
- The executing agent must inspect the current repository before making changes.
- Existing BRIGHTAI architecture is the source of truth.

## Global Prompt Execution Status

- [✅] Prompt 41 — Document Approval Workflow
- [ ] Prompt 42 — Test VOID Handler
- [ ] Prompt 43 — Product Archive + Test Draft Editing
- [ ] Prompt 44 — Legacy Duplicate File Cleanup
- [ ] Prompt 45 — e2e-lab-nav Pre-existing Failures
- [ ] Prompt 46 — Scheduled Notification Jobs
- [ ] Prompt 47 — Unified A4 Print Layouts
- [ ] Prompt 48 — Sample QR Codes
- [ ] Prompt 49 — Smarter Unified Search
- [ ] Prompt 50 — Arabic PDF Reports
- [ ] Prompt 51 — Session Environmental Readings
- [ ] Prompt 52 — Live Criteria Side-by-Side Display
- [ ] Prompt 53 — Product FAIL Trend Analytics
- [ ] Prompt 54 — Electronic Signature on Approvals
- [ ] Prompt 55 — Records Retention Policy
- [ ] Prompt 56 — Repeated-FAIL Escalation Rule
- [ ] Prompt 57 — Final Code Quality Pass
- [ ] Prompt 58 — Production Readiness Audit
- [ ] Prompt 59 — Final Master Regression

## Execution Dependencies & Blocking

- Prompt 44 (duplicate cleanup) is independent — may run first, it is the
  cheapest and reduces noise for everything after it.
- Prompt 45 (e2e fixes) BLOCKS e2e verification of Prompts 47, 48, 54 — do
  not use e2e as acceptance evidence before 45 is green.
- Prompt 46 (scheduled jobs) must land before 56 relies on it; 56 must not
  create a second detector.
- Prompts 57, 58, 59 are strictly sequential and require 41–56 done.
- prompt4-LAB.md Prompts 38–40 are superseded by 57–59 here — do not run
  them twice.

---

# MASTER RULES — APPLY TO EVERY PROMPT

```text
You are DeepSeek Flash v4 acting as a senior staff full-stack engineer inside the
existing BRIGHTAI monorepo.

Repository:
YEEEAE/BRIGHTAI

Target application:
apps/qc-task-manager/

THIS IS NOT A GREENFIELD PROJECT.

The current BRIGHTAI implementation is the source of truth.

Before changing anything:

1. Read .agents/mind/01-mind-latest.md completely.
2. Read audit/qc/prompt4-LAB.md MASTER RULES.
3. Inspect apps/qc-task-manager/ sufficiently to understand:
   - routing, layouts, components
   - authentication, sessions, RBAC, permissions
   - database, migrations, validation
   - CSRF, audit logging, notifications
   - dashboard, exports, tests
   - existing workflow/state transition patterns

NON-NEGOTIABLE (carried over from prompt4 — still in force):

- Do not create a second application/auth/RBAC/notification/audit/
  dashboard/export/workflow system.
- Do not modify previous database migrations.
- Every schema change must use a new sequential migration
  (current last migration: 024).
- Do not modify .env or .env.* files. Never introduce secrets.
- Do not modify CI/CD workflows unless explicitly instructed.
- All authorization must be enforced server-side.
- Use prepared/parameterized SQLite queries.
- Protect all state-changing requests with the existing CSRF mechanism.
- Do not invent medical, regulatory, scientific, or quality requirements.
- Do not invent formulas or acceptance criteria.
- Never allow AI to automatically decide PASS/FAIL or approve anything.
- Never overwrite approved records silently.
- Preserve historical traceability.
- CSP is strict: style-src 'self' + sha256 only — no inline style attributes
  in new islands; use SVG attributes or classes.
- Do not claim something is verified unless the actual verification command
  passed.

When a requirement conflicts with the existing architecture:

1. inspect the implementation;
2. preserve the architecture;
3. choose the smallest compatible extension;
4. document the decision in the mind ledger;
5. do not silently create an alternative architecture.

After every prompt:

1. List exact files changed.
2. List exact commands executed.
3. Report actual command results.
4. Report implementation status and test status.
5. Report anything still unverified.
```

---

# PROMPT 41 — DOCUMENT APPROVAL WORKFLOW (complete DRAFT → IN_REVIEW → APPROVED → SUPERSEDED/ARCHIVED)

**Execution Checklist**

- [✅] Prompt executed and verified

```text
Implement the full controlled-document workflow that is currently reserved but
unexecuted. The infrastructure already exists: lab_document_versions,
immutability of approved versions (editing APPROVED creates a new version —
already implemented), approver_id (migration 013) and approved_at
(migration 023), reserved audit actions (auditLabDocument union), and
acknowledgement assignment machinery.

Implement:

1. SUBMIT: DRAFT → IN_REVIEW by the owner (or canEditLabDocument role).
   Requires a change summary if not already supplied.
2. REQUEST CHANGES: IN_REVIEW → DRAFT by canReviewLabDocument.
   Requires reason (reuse the shared-reason pattern from
   /lab/tests/review.astro — server-side conditional requirement, no
   unconditional required attribute).
3. APPROVE: IN_REVIEW → APPROVED by canApproveLabDocument.
   Approver must differ from the author (no self-approval — reuse the
   structural pattern proven in tests.ts/review.ts).
   Sets approver_id + approved_at + effective/acknowledgement assignment.
   Approved version becomes immutable (already enforced — do not weaken).
4. SUPERSEDE: approving a newer version automatically supersedes the previous
   one. Historical tests referencing the old version must remain unchanged
   (version-locked references — verify with a test).
5. ARCHIVE: APPROVED/SUPERSEDED → ARCHIVED by canArchiveLabDocument.
   Archived documents never appear in test-form dropdowns but remain fully
   readable.

Rules:

- Every transition audited using the ALREADY RESERVED action names in the
  auditLabDocument union — do not invent new action names.
- Every transition notifies via the existing notification system
  (reuse the 10 lab notification kinds pattern; add new kinds only via
  the existing central registry).
- All state changes through the service layer inside one transaction.
- Server-side authorization on every endpoint; page guards are UX only.

UI:

- Extend /lab/documents/[id] with a workflow panel (submit / request changes /
  approve / archive) conditioned on role and status.
- Add an "In Review" queue view for reviewers (may live as a filter on
  /lab/documents — reuse, do not duplicate).
- Acknowledgement assignment is NOT auto-triggered by approval unless an
  existing pattern already does so; assignment remains an explicit manager
  action via /lab/acknowledgements/assign. Document the decision either way.
- Only update existing tests whose asserted behavior intentionally changed
  in this prompt; list every modified test with the reason. No silent test
  edits (project rule: never modify a failing test without understanding
  why it failed).

Rerun after this prompt (minimum):
- scripts/test-lab-documents.mjs, test-lab-acknowledgements.mjs,
  test-lab-data-quality.mjs, test-lab-reports.mjs, test-lab-security.mjs,
  test.mjs.

Acceptance criteria:

- Unit tests: full happy path DRAFT→IN_REVIEW→APPROVED, request-changes loop,
  self-approval rejected, approved version immutable, supersede keeps old
  version content byte-identical, historical test still shows old version,
  all transitions audited, employee denied.
- Existing document tests (207 acknowledgements/documents suite) still pass.
```

---

# PROMPT 42 — TEST VOID HANDLER

**Execution Checklist**

- [ ] Prompt executed and verified

```text
VOID status exists in the schema (CHECK constraint), filters, reports, and
data-quality exclusions — but there is no mutation path. Implement it.

Implement:

- Action available on /lab/tests/[id] for manager+ only
  (new permission canVoidLabTest — manager/admin, matching LAB_TEST_VOID).
- Requires a mandatory reason (server-validated).
- Allowed from any non-terminal status except APPROVED and VOID.
  Voiding an APPROVED test is forbidden (approved = immutable).
  If the business later requires voiding approved records, stop and
  surface the conflict — do not decide silently.
- VOID keeps the record fully visible and historically intact:
  it is excluded from PASS/FAIL/HOLD aggregates (already implemented)
  but shown in the register with a clear VOID badge.
- Audit action: use the reserved verb in LabAuditAction — do not invent one.
- Notification to the tester and their supervisor.
- Decide and document the behavior for OPEN RETESTS of a voided test.
  Smallest compatible option: block voiding while open retests exist,
  with a clear Arabic message — do not orphan retest records silently.

Rerun after this prompt (minimum):
- scripts/test-lab-tests.mjs, test-lab-review.mjs, test-lab-retests.mjs,
  test-lab-security.mjs, test.mjs.

Acceptance criteria:

- Unit tests: void allowed from DRAFT/SUBMITTED/UNDER_REVIEW/REJECTED,
  rejected from APPROVED and VOID, reason required, employee/supervisor
  denied, audit row written, aggregates exclude voided test.
```

---

# PROMPT 43 — PRODUCT ARCHIVE + TEST DRAFT EDITING

**Execution Checklist**

- [ ] Prompt executed and verified

```text
Two reserved-but-missing mutations:

A. PRODUCT ARCHIVE
- Endpoint to toggle is_active on lab_products (canEditLabProduct).
- Uses the reserved audit action verb.
- Inactive products disappear from test-form dropdowns but remain on
  historical tests (Product ID is the canonical relationship — verify
  historical identity snapshot unchanged).
- Guard: archiving a product used by a non-VOID test is allowed but emits
  a data-quality finding (already exists as product_inactive_in_use).

B. TEST DRAFT EDITING
- DRAFT tests may be edited by their creator (tested_by/created_by scope
  rule — employee scope is `tested_by OR created_by`).
- Editing is limited to DRAFT status only; SUBMITTED and beyond are
  read-only (review flow already owns them).
- Every field change audited as LAB_TEST/UPDATE with old/new values.
- Update the form at /lab/tests/new to support edit mode, or add
  /lab/tests/[id]/edit — choose the smaller compatible extension and
  document the decision.
- On update, the full sample grid + five-sample rules + template reference
  are revalidated server-side exactly as create (no partial-update bypass).
- Reuse the existing unsaved-change detection; do not rebuild it.

Acceptance criteria:

- Unit tests: archive toggles + audit + dropdown exclusion + historical
  tests unchanged; draft edit by creator allowed, by other employee 404,
  non-draft 400, audit rows written.
```

---

# PROMPT 44 — LEGACY DUPLICATE FILE CLEANUP

**Execution Checklist**

- [ ] Prompt executed and verified

```text
Two duplicate files ship on production routes:

- src/pages/lab/documents/[id]/edit 2.astro
- src/components/lab/LabDocumentEditor 2.astro

Verify (by grep for imports/references) that ONLY the non-suffixed versions
are referenced, then delete the two " 2" files.

Also scan the whole app for any other " 2.ext" duplicate files and report
findings before deleting (delete only Laboratory-introduced duplicates).

Acceptance criteria:

- grep proves zero references to the deleted files.
- pnpm typecheck → 0 errors; production build → Complete.
- All routes still resolve (run the route-listing check or e2e-lab-nav
  standalone and compare against the documented baseline).
```

---

# PROMPT 45 — CLOSE PRE-EXISTING e2e-lab-nav FAILURES

**Execution Checklist**

- [ ] Prompt executed and verified

```text
The documented baseline of e2e-lab-nav is 75 passed / 6 failed at HEAD:

- 4× mobile-menu failures
- 1× forged POST
- 1× overflow at 1024

Reproduce each, identify the root cause, fix the ROOT CAUSE (not the test),
and rerun.

Guidance:

- Root cause may live in the PRODUCT or in the TEST. Fix the product unless
  you can prove the test asserts stale behavior; if you align the test,
  justify it with the security/UX decision that changed the behavior.
  A green run obtained by weakening an assertion is a failure, not a fix.

- mobile-menu: inspect aria-expanded/aria-controls wiring, event handlers,
  and viewport behavior in the existing shared navigation component —
  do not redesign the menu.
- forged POST: confirm the CSRF origin gate actually rejects the forged
  scenario the test constructs; if the test asserts a behavior the security
  layer intentionally changed, align the TEST only after proving the
  production behavior is the secure one — document the decision.
- overflow 1024: find the overflowing element at 1024px width and fix with
  the existing responsive utilities (logical properties, RTL-safe).

Acceptance criteria:

- e2e-lab-nav standalone → 0 failed, 2 consecutive runs.
- No new failures introduced in neighboring e2e suites.
- Production build + typecheck still clean.
```

---

# PROMPT 46 — SCHEDULED NOTIFICATION JOBS

**Execution Checklist**

- [ ] Prompt executed and verified

```text
Today, reminders (calibration due, document review due, acknowledgement
pending) are computed at read time. Users discover them only when they open
the page. Implement true scheduled notifications WITHOUT a second
notification system.

Implement:

- A single idempotent daily job script (Node, apps/qc-task-manager/scripts/)
  that runs the existing derivation logic (LATEST_DUE_SQL,
  deriveCalibrationState, deriveDocumentReviewState) and inserts
  notifications at 30/15/7 days, due-today, and overdue — using the
  EXISTING notification table and kinds/registry. Idempotent: re-running
  the same day must not duplicate notifications (unique key on
  user+kind+entity+date — via a new migration if needed).
- Recipients: role-derived (owners, reviewers, acknowledgers, equipment
  managers) using existing permission helpers.
- Job runs as a system actor: decide and document the actor identity for
  notification rows (nullable actor or a dedicated system user) following
  the existing schema constraints — never impersonate a real user.
- Scheduling: do NOT modify .github/workflows. Provide the script plus a
  documented invocation line (cron on the host / existing scheduler).
  If the repository already has a scheduler entry point, reuse it.

Acceptance criteria:

- Unit tests on temp DB: correct buckets, correct recipients, idempotency
  (run twice → same rows), no notifications for archived/inactive entities.
- Manual run of the script against a seeded temp DB produces the exact
  expected notification rows.
```

---

# PROMPT 47 — UNIFIED A4 PRINT LAYOUTS

**Execution Checklist**

- [ ] Prompt executed and verified

```text
/lab/tests/[id]/print.astro + PrintLayout.astro already render a compliant
A4 laboratory record. Extend the SAME print architecture to:

1. Calibration certificate/report per calibration record
   (/lab/calibration/[id]/print or print query param — choose the smaller
   extension and document it).
2. Equipment history report per equipment
   (usage + maintenance + calibration + returned-to-service timeline).
3. Maintenance record print.

Rules:

- Reuse PrintLayout.astro; do not create a second print layout.
- Server-rendered, no dashboard chrome, no navigation.
- Exact stored values only; controlled version metadata where relevant.
- Semantic structure: one h1, section h2s, dl/th scope (match the
  a11y pass conventions from the mind ledger).

Acceptance criteria:

- Each print page renders full content at A4 with zero horizontal overflow.
- Content matches stored record exactly (spot-check via test or manual
  verification, recorded).
```

---

# PROMPT 48 — SAMPLE QR CODES

**Execution Checklist**

- [ ] Prompt executed and verified

```text
Sample identifiers are stable (LAB-TEST-00081-S03). Make them scannable.

Implement:

- QR code generation for sample identifiers and test IDs.
  No heavy dependency: prefer a small zero-dependency QR encoder
  (pure JS, <20KB) — justify the choice in the mind ledger. If any
  dependency is added, document why no existing alternative works.
- Render QR (SVG, CSP-safe, no external service, no canvas-only fallback
  without <img> alternative) on:
  - the test print page (one QR per sample row or a QR sheet section)
  - the test detail page (compact)
- The QR payload is the identifier string itself plus a resolvable URL
  (/lab/tests/[id]#sample-S03) — absolute URL from the site origin
  configuration already used elsewhere.
- Add a "scan" input on /lab/search accepting a scanned identifier and
  resolving directly to the test/sample.

Acceptance criteria:

- Generated SVGs decode (verify with an offline decoder in a test) to the
  exact identifier.
- CSP unchanged and still strict; no inline styles.
- Print page includes QRs without breaking A4 layout.
```

---

# PROMPT 49 — SMARTER UNIFIED SEARCH

**Execution Checklist**

- [ ] Prompt executed and verified

```text
Improve /lab/search without a second search system.

Implement:

- Partial/prefix matching on identifiers (test ID, sample ID, document code)
  using the existing escapeLike + parameterized patterns.
- A single debounced suggestion endpoint (GET, parameterized, LIMIT 5 per
  entity, same RBAC record-scope as the full search) returning grouped
  suggestions; the UI renders them as an accessible combobox
  (aria-expanded, keyboard navigable, Escape closes).
- The full search page remains server-rendered and indexable — suggestions
  are progressive enhancement only; without JS the current behavior is
  unchanged.

Acceptance criteria:

- Suggestion endpoint respects employee record scope (404-style non-discovery
  for unauthorized records — tested).
- Debounced input does not fire more than one request per pause window
  (unit test).
- Page still passes the a11y conventions (focus visible, combobox ARIA).
```

---

# PROMPT 50 — ARABIC PDF REPORTS

**Execution Checklist**

- [ ] Prompt executed and verified

```text
Audit the existing PDF writer for Arabic/RTL correctness. If Arabic text
renders incorrectly (missing shaping, reversed letter order, missing font),
fix it inside the EXISTING writer — no second export pipeline.

Implement (as needed):

- Bundle an openly licensed Arabic-capable font (e.g. IBM Plex Sans Arabic,
  already used by the site) into the PDF writer.
- Apply RTL direction + logical paragraph direction for Arabic content.
- Verify column ORDER mirrors RTL expectations for Arabic headers while
  keeping data columns aligned with their headers.

Acceptance criteria:

- A generated Arabic-content PDF from a seeded temp DB shows correctly
  shaped, correctly ordered Arabic text (visual verification recorded in
  the ledger with the exact command).
- Existing CSV/XLSX outputs unchanged.
```

---

# PROMPT 51 — SESSION ENVIRONMENTAL READINGS

**Execution Checklist**

- [ ] Prompt executed and verified

```text
The test form captures Temperature (Measured) once. Extend to a session
readings log WITHOUT changing existing columns' meaning.

Implement:

- Optional per-test environmental readings list (timestamp, temperature,
  optional humidity/notes — only fields the existing form already implies;
  do NOT invent new scientific requirements).
- New table via new sequential migration (lab_test_environment_readings)
  with FK to lab_test_records; snapshot-safe: rows belong to the test and
  never change on approval (immutable after approval).
- UI: on the test form (draft stage) an accessible dynamic list with add/
  remove rows (44px touch targets, labels, keyboard support); on the detail
  and print pages a simple table.
- Do not remove or repurpose the existing single temperature field — it
  remains the headline measured temperature; readings are supplementary.

Acceptance criteria:

- Migration forwards + fresh DB + existing DB all succeed; REQUIRED_TABLES
  updated; three migration-counter scripts updated (test-migrations /
  test-dashboard-reports / test.mjs).
- Unit tests: add/remove in draft only, immutable after approval, audit on
  modification, employee scope respected.
```

---

# PROMPT 52 — LIVE CRITERIA SIDE-BY-SIDE DISPLAY

**Execution Checklist**

- [ ] Prompt executed and verified

```text
While entering results, the employee should see the approved acceptance
criteria next to each input — as a direct deterministic comparison, NOT AI.

Implement:

- On the test form, resolve the applicable approved SOP/WI version and
  template (version-locked resolution already exists via
  resolveLabTemplateVersion and document version locking) and render the
  reference parameter values (e.g. standard parameter, holding time,
  acceptance criterion) in a read-only reference panel beside Section 5/6.
- Reference values are DISPLAY-ONLY: never copied into measured fields,
  never auto-filling results, never overwriting user input.
- If no approved version is linked, show an explicit empty state
  ("No approved reference linked") — never guess.
- The existing AI SOP-comparison panel stays as-is; this is the
  non-AI deterministic counterpart.

Acceptance criteria:

- Unit/e2e test: panel shows exactly the approved version's stored values;
  measured inputs remain untouched; unauthorized/unlinked cases show the
  empty state; no inline styles (CSP).
```

---

# PROMPT 53 — PRODUCT FAIL TREND ANALYTICS

**Execution Checklist**

- [ ] Prompt executed and verified

```text
Add trend visibility over existing data (no new tables).

Implement:

- New read-only module src/lib/lab/trends.ts: FAIL rate per product over
  time (weekly/monthly buckets, reusing the week-alignment convention from
  dashboard.ts), per-lot breakdown, and simple moving comparison vs the
  previous period. Pure SELECT with bound parameters.
- Visualization: extend the existing CSP-safe SVG chart component family
  (same patterns as LabDashboardCharts — SVG attributes, no inline styles,
  client:visible, aria-label + <title> fallback).
- Placement: a "Trends" section on /lab/products/[id] and an optional
  filtered view on /lab/reports linking to the register.
- VOID tests excluded from rates (consistent with all existing aggregates).

Acceptance criteria:

- Unit tests on seeded temp DB: exact rates across known fixtures,
  VOID exclusion, empty product → empty state.
- Charts CSP-safe; drill-down links only to implemented routes.
```

---

# PROMPT 54 — ELECTRONIC SIGNATURE ON APPROVALS

**Execution Checklist**

- [ ] Prompt executed and verified

```text
Approve actions currently require only the button click. Add a re-auth
step for the highest-authority actions, aligned with common QMS
expectations (do not claim regulatory compliance — implement the
mechanism only).

Implement:

- On test APPROVE and document APPROVE (and VOID), the confirm step
  requires the user's current password, verified server-side through the
  existing authentication layer (constant-time comparison via existing
  password verification helper). Session is NOT reissued; no new session
  machinery.
- Failed verification: reject with a clear Arabic message, rate-limited
  (reuse the existing per-user limiter pattern), audited as a failed
  attempt without storing the password anywhere.
- UI: an accessible confirmation dialog (focus trap, Escape, aria) —
  reuse existing modal/dialog components if present.
- Audit note records "approved with e-signature" — no secret material.

Acceptance criteria:

- Unit tests: wrong password rejected + rate-limited + audited; correct
  password proceeds; no password or hash ever appears in logs/audit/DB
  (grep-verified in test).
```

---

# PROMPT 55 — RECORDS RETENTION POLICY

**Execution Checklist**

- [ ] Prompt executed and verified

```text
Implement retention AWARENESS — never automatic deletion.

Implement:

- A central policy constant (src/lib/lab/retention.ts): retention period
  per record family (configurable constant, default 5 years from approval
  date — do not invent regulatory numbers; expose as a documented default
  the business can change).
- A read-only "Retention Status" report: records eligible for archival
  review, per family, with dates and remaining days.
- Surface as a new catalog report type through the EXISTING reporting
  pipeline (same endpoint, same writers, same authorization pattern as the
  15 lab reports) — supervisor+ only, employee denied at the authorization
  layer.
- ABSOLUTELY NO deletion, purging, or automatic action. The report is the
  entire deliverable.

Acceptance criteria:

- Report integration tests mirror test-lab-reports patterns
  (authorization × roles, row accuracy on fixtures, metadata only).
- Grep-verified: no DELETE statement introduced.
```

---

# PROMPT 56 — REPEATED-FAIL ESCALATION RULE

**Execution Checklist**

- [ ] Prompt executed and verified

```text
Detect repeated failure early and connect it to the EXISTING findings/CAPA
hooks (PROMPT 20 of pack 4 — lab_test_findings already links tests to
findings).

Implement:

- Derivation (read-time or as part of the Prompt 46 daily job — reuse
  whichever lands first, do not build two detectors): same product with
  ≥2 FAIL final results within a rolling 7-day window (non-VOID).
- On detection: notify the manager (existing notification system) with a
  direct link to the product's test register filtered to FAIL.
- The notification includes a one-click "Open Finding" link that pre-fills
  the EXISTING finding creation flow with the affected test IDs —
  do not create findings automatically; a human decides.
- Show the detection as a data-quality style flag on /lab/products/[id]
  ("Repeated failures in the last 7 days") linking to the filtered
  register.

Acceptance criteria:

- Unit tests on temp DB: 2 FAILs within 7 days triggers exactly once
  (idempotent), older/dispersed FAILs do not, VOID excluded, notification
  recipient correct, no automatic finding created.
```

---

# PROMPT 57 — FINAL CODE QUALITY PASS (maps to prompt4 PROMPT 38)

**Execution Checklist**

- [ ] Prompt executed and verified

```text
Inspect all Laboratory implementation for:

- duplicate code and duplicate components (Prompt 44 files must already be
  gone)
- dead code, unused imports, unnecessary dependencies
- inconsistent naming, enums, authorization, validation
- unsafe error handling
- missing audit events, tests, indexes
- incomplete loading/error/empty states
- duplicated database logic

Remove only unnecessary code introduced by Laboratory work.
Do not remove unrelated legacy functionality.

Run and record exact results:

- formatter (project standard, if configured)
- linter / pnpm typecheck (target 0 errors / 0 warnings)
- unit + integration suite (pnpm test — full chain, 0 failed)
- e2e suites (all green after Prompt 45)
- NODE_ENV=production pnpm build

Acceptance criteria:

- Every category above inspected with findings listed (even "none found").
- All recorded commands pass. Anything unverifiable is reported as
  UNVERIFIED, never silently skipped.
```

---

# PROMPT 58 — PRODUCTION READINESS AUDIT (maps to prompt4 PROMPT 39)

**Execution Checklist**

- [ ] Prompt executed and verified

```text
Perform final production-readiness verification.

Verify each area: Architecture, Database, Migrations, Authentication, RBAC,
CSRF, Validation, SQL safety, XSS protection, Audit, Notifications
(including scheduled jobs), Dashboard, Search, Reports, Exports, Print
(incl. new layouts + QR), Accessibility, Responsive UI, Performance,
AI guardrails, Document control (incl. full approval workflow), Equipment
history, Calibration, Retesting, Data quality, Trends, E-signature,
Retention awareness, Escalation rule, Testing.

Create:
apps/qc-task-manager/docs/QC-LAB-PRODUCTION-READINESS.md

Classify each area: PASS / PARTIAL / FAIL / UNVERIFIED.
Never mark PASS without real verification (name the command + result).

Also create the missing discovery artifact if still absent:
verify whether QC-LAB-MASTER-DISCOVERY.md content is fully covered by
QC-LAB-ARCHITECTURE.md; if yes, document that mapping in the readiness
report instead of duplicating it.

Provide the 26-item report structure from prompt4 PROMPT 39 (implemented,
reused, DB changes, routes, permissions, audit/notification/dashboard
integrations, risks, manual validation, files, commands, results).

Acceptance criteria:

- Every PASS has a named verification command and its actual output.
- Every remaining risk has an owner decision (accept / fix / defer).
```

---

# PROMPT 59 — FINAL MASTER REGRESSION (maps to prompt4 PROMPT 40)

**Execution Checklist**

- [ ] Prompt executed and verified

```text
Perform the final regression audit of BRIGHTAI.

The QC Laboratory implementation must not break:
authentication, sessions, users, tasks, task updates, evidence, findings,
CAPA, SLA, notifications, dashboard, exports, backup, audit integrity,
existing AI functionality.

Run the complete relevant test suite for the repository.

Verify:

- clean installation (fresh clone → install → build → migrate → seed)
- migration from an existing pre-lab database
- migration from an empty database
- seeded laboratory data (24 equipment records intact)
- all routes (including every route added by prompts 41–56)
- all state transitions (incl. document workflow, VOID, archive)
- all permission boundaries
- all exports
- all audit events
- all critical dashboard metrics

Do NOT deploy. Do NOT push. Do NOT alter CI/CD.
Do NOT claim success unless actual verification succeeds.

Produce the final verification summary and update the mind ledger.

Acceptance criteria:

- Full pnpm test chain exit 0; full e2e set 0 failed; production build
  Complete; fresh + upgrade migration paths both verified.
- Summary lists every command with its actual result.
```

---

# FINAL EXECUTION ORDER

## Phase A — Close the gaps (highest priority)

- [ ] 41 Document Approval Workflow
- [ ] 42 Test VOID Handler
- [ ] 43 Product Archive + Draft Editing
- [ ] 44 Duplicate File Cleanup
- [ ] 45 e2e-lab-nav Failures

## Phase B — Operational improvements

- [ ] 46 Scheduled Notifications
- [ ] 47 A4 Print Layouts
- [ ] 48 Sample QR Codes
- [ ] 49 Smarter Search
- [ ] 50 Arabic PDF

## Phase C — Quality intelligence

- [ ] 51 Environment Readings
- [ ] 52 Live Criteria Panel
- [ ] 53 FAIL Trends
- [ ] 54 E-Signature
- [ ] 55 Retention Awareness
- [ ] 56 Repeated-FAIL Escalation

## Phase D — Ship gate (mandatory before launch)

- [ ] 57 Code Quality Pass
- [ ] 58 Production Readiness Audit
- [ ] 59 Final Master Regression

---

# DEFINITION OF DONE

The QC Laboratory continuation is complete only when all prompts in Phases
A–D are verified, acceptance criteria pass, existing BRIGHTAI functionality
remains intact, and the final regression (59) is green.

---

# AGENT EXECUTION CONTRACT

```text
DO NOT EXECUTE ALL PROMPTS AS ONE BLIND BATCH.

After each prompt:

1. Inspect current state (mind ledger first).
2. Implement only the requested scope.
3. Run relevant tests.
4. Verify acceptance criteria.
5. List changed files, commands executed, actual results.
6. Continue only after the prompt is verified.
7. Append a ledger entry to .agents/mind/01-mind-latest.md.

If something already exists: REUSE IT.
If something partially exists: EXTEND IT.
If something is missing: IMPLEMENT IT.
If something conflicts: STOP THAT SUBTASK, EXPLAIN THE CONFLICT, AND CHOOSE
THE SMALLEST COMPATIBLE CHANGE.

Historical integrity is mandatory.

Human users remain responsible for:
- test measurements
- PASS/FAIL/HOLD
- review and approval (with electronic signature)
- scientific interpretation
- quality decisions (including opening findings and retention decisions)
```

---

# IMPLEMENTATION NOTES — CONTEXT SPECIFIC TO THIS PACK

- Current state at pack start: migrations 00–024, 41 lab pages, 5 lab API
  endpoints, full test chain 30+ suites green, 6 documented e2e-lab-nav
  failures at HEAD.
- Reserved-but-unimplemented audit action names MUST be used when
  implementing their handlers (documented in QC-LAB-AUDIT-COVERAGE-001).
- Employee record scope in the lab is `tested_by OR created_by` — any new
  endpoint inherits it.
- CSP: no inline styles in islands; SVG attributes or classes only.
- Any new migration: new 0NN file + db.ts registration + schema.sql mirror +
  counters in THREE scripts (test-migrations / test-dashboard-reports /
  test.mjs).
- Astro.locals.user exposes user.userId (not user.id).
- Do not run the full e2e acceptance chain until Prompt 45 closes its
  baseline failures.


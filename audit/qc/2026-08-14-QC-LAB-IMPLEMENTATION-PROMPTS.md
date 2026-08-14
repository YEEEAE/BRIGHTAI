# QC Laboratory Extension — DeepSeek Flash v4 Implementation Prompts (v2)

> **Purpose:** Add a QC Laboratory workspace to the existing `apps/qc-task-manager` application.
> **Language:** The prompts in this file are intentionally written in English for DeepSeek Flash v4.
> **Execution:** Run prompts in order, ONE PROMPT PER SESSION. Do not start the next prompt until every acceptance criterion of the previous prompt passes with real command output.
> **Scope:** Internal QC operations only. The feature must reuse the current Astro SSR, SQLite, RBAC, migrations, audit log, notifications, dashboard, export, security, and testing architecture.
> **Companion file:** `audit/qc/2026-08-14-QC-LAB-ADDITIONS-PROMPTS.md` contains the page-level additions with the exact company data (full printed Air/Vacuum form specification and the full 24-row equipment seed). This file builds the foundation; the additions file executes the data-bearing pages and the full system wiring.
> **Design reference:** `audit/qc/2026-08-14-QC-LAB-PAGES-REPORT.md` (page map, permissions matrix, lifecycle, open decisions).

## What changed in v2 (vs v1)

- Added a **DeepSeek Flash v4 execution protocol**: verify-before-claim, grounding rules, session start/end checklists, conflict protocol.
- Added a **verified repository facts block** (migration numbering, RBAC source, audit/notifications modules, verification commands and their baselines) so the agent never guesses.
- Every prompt now has: **Read first → Allowed file changes → Requirements → Explicit non-goals → Verification commands → Acceptance criteria**.
- PROMPT 03 now carries the **complete printed field specification** (sections 1–8) instead of a summary.
- PROMPT 05 points to the canonical 24-row equipment dataset in the additions file.
- Sharpened immutability, self-approval, and status-transition rules into testable statements.

## DeepSeek Flash v4 execution protocol (applies to every prompt)

1. **One prompt per session.** Start each session by pasting the session bootstrap below, then the single prompt. Do not batch prompts.
2. **Verify before you claim.** Never report a criterion as passing unless you ran the exact command and observed the result in the same session. Paste the real exit code or summary line. If you did not run it, write `NOT RUN`.
3. **Ground every helper call.** Before calling an existing helper (`logActivity`, notification creators, `requireApiUser`, migration runner, Zod schemas), open its file and read the real signature. Do not guess parameter names. If a helper does not exist, say so — do not invent a parallel one.
4. **Facts block is authoritative.** The repository facts below were verified on 2026-08-14. If the code on your machine disagrees with a fact, trust the code, adapt, and note the discrepancy in your report.
5. **Conflict protocol.** If a requirement conflicts with existing architecture or data, STOP at that requirement. Explain the conflict and propose options. Never silently build a second system or weaken an existing guarantee.
6. **No scope drift.** Implement exactly what the prompt asks. Improvements, refactors, and renames of existing code are out of scope unless the prompt says otherwise.
7. **Honest failure.** A failing test is information, not an obstacle. Report failures verbatim with the failing assertion. Never delete, skip, or loosen a test to make it pass.
8. **Forbidden always:** `git push`, `git commit`, editing `.env*`, editing `.github/workflows/`, deleting files or data, writing secrets anywhere, adding `unsafe-inline`/`unsafe-eval` to CSP, touching a real (non-temporary) database during tests.

## Session bootstrap (paste at the start of EVERY session)

```text
You are a senior full-stack engineer working inside the existing BRIGHTAI monorepo.

Target application: apps/qc-task-manager/

SESSION START CHECKLIST (do these before writing any code):
1. Read .agents/brain.md (at minimum: the top 10 ledger entries).
2. Read audit/qc/2026-08-14-QC-LAB-PAGES-REPORT.md (the design reference).
3. Read the current prompt completely before touching any file.
4. Read the real source of every existing module you plan to import from.
5. Confirm the current latest migration number in apps/qc-task-manager/db/migrations/.

NON-NEGOTIABLE RULES:
- Do not modify .env or .env.* files. Never write secrets into source, tests, logs,
  docs, prompts, or fixtures.
- Do not modify .github/workflows/.
- Do not commit, do not push, do not create branches. The user commits.
- Do not delete files or existing data.
- Every schema change goes into a NEW sequential SQLite migration. Never edit an
  applied migration.
- Preserve existing tasks, findings, CAPA, workflows, AI guardrails, audit-chain
  behavior, backups, and dashboard behavior.
- Authorization is server-side only. The UI is never the only permission check.
- Validate all input with the existing Zod/server validation conventions.
- Use prepared SQLite statements; never concatenate user input into SQL.
- Treat employee-entered text and document content as untrusted data.
- Tests run against an external temporary database (absolute QC_DATABASE_PATH),
  never a real database.
- Do not claim a feature is verified until the relevant command actually passed
  in this session.

SESSION END REPORT (always finish with this):
1. Files created / modified (exact paths).
2. Commands run + real results (paste summary lines, mark NOT RUN where skipped).
3. Status per requirement: IMPLEMENTED / PARTIAL / BLOCKED (with reason).
4. Any conflict you hit with existing architecture and how you resolved it
   (or why you stopped).
```

## Repository facts (verified 2026-08-14 — anchor, do not guess)

| Fact | Value |
|---|---|
| App package | `@brightai/qc-task-manager` under `apps/qc-task-manager/` |
| Runtime | Astro SSR (`output: 'server'`) + `@astrojs/node` standalone; React islands; Tailwind |
| Database | better-sqlite3, WAL; path from `QC_DATABASE_PATH` (must be ABSOLUTE in tests/servers) |
| Migrations | `db/migrations/001_initial.sql` … `010_ai_evidence_status.sql` — **next migration is `011_*.sql`** |
| Migration runner | `src/lib/migrations.ts` (checksums, rollback guard, `schema_migrations` table) — extend it, never bypass it |
| RBAC single source | `src/lib/permissions.ts` (`PERMISSIONS` map + `can*` functions). Add lab permissions HERE, never as scattered checks |
| Roles | `admin`, `manager`, `supervisor`, `employee` (no new roles) |
| API security | `src/lib/api-security.ts` (`requireApiUser`, CSRF origin checks) — every lab API must use it |
| Validation | `src/lib/validation.ts` + Zod schemas |
| Activity/audit | `src/lib/activity.ts` + `src/lib/audit/` (SHA-256 hash chain on `task_activity_log`); verify with `pnpm test:audit-integrity` |
| Notifications | `src/lib/notifications.ts` (in-app only; never notify inactive users) |
| Dashboard | `src/pages/dashboard.astro` + `src/lib/dashboard.ts` (9 KPI + 6 charts + 5 tables; employee forbidden) |
| Exports | `src/lib/export.ts` / `searchExport.ts` / `pdf.ts` (CSV/XLSX/PDF patterns exist) |
| Layout/nav | `src/layouts/BaseLayout.astro` (skip link, reduced motion), `src/components/Navbar.tsx` (desktop cluster only at `lg`/1024px; mobile menu below) |
| CSP | `script-src 'self'` + hashes; `style-src 'self'` + one fixed sha256 (no inline styles — use classes/SVG attributes) |
| E2E harness | `scripts/e2e-acceptance.mjs` orchestrator; suites: admin-users, auth-lockout, task-shared, delete-request, dashboard, a11y, backup, findings, reports, search, persistence |
| Verification commands | `pnpm --filter @brightai/qc-task-manager typecheck` (baseline: 0 errors / 0 warnings / ~13 hints) · `pnpm --filter @brightai/qc-task-manager test` (all suites chained, baseline all green) · `pnpm --filter @brightai/qc-task-manager e2e:acceptance` · `node scripts/verify-security-hygiene.mjs` · `node scripts/architecture-guard.mjs` · `node scripts/verify-badge-contrast.mjs` |
| Known baseline (2026-08-14) | typecheck 0/0/13 · unit 279 passed / 0 failed · e2e acceptance all suites PASS |

## Global instruction for every prompt

```text
You are a senior full-stack engineer working inside the existing BRIGHTAI monorepo.

Target application:
  apps/qc-task-manager/

Before changing anything:
1. Read .agents/brain.md completely.
2. Read audit/qc/2026-08-14-EVIDENCE-AUDIT.md.
3. Read audit/qc/2026-08-14-IMPLEMENTATION-PROMPTS.md.
4. Inspect the current implementation under apps/qc-task-manager/, especially:
   - src/lib/db.ts and db/migrations/
   - src/lib/auth.ts, permissions.ts, api-security.ts, validation.ts
   - src/lib/task-policy.ts, activity/audit logic, notifications, exports
   - src/layouts/, src/components/, src/pages/, and existing acceptance tests
5. Treat the current code and migrations as the source of truth. Do not recreate
   existing business logic or replace existing architecture without evidence.

Non-negotiable rules:
- Do not modify .env or .env.* files and never write secrets into source, tests,
  logs, documentation, prompts, or database fixtures.
- Do not modify .github/workflows/.
- Do not commit or push.
- Do not delete files or existing data.
- Use a new sequential SQLite migration for every schema change.
- Preserve existing tasks, findings, CAPA, workflows, AI guardrails, audit-chain
  behavior, backups, and dashboard behavior.
- Keep authorization server-side. The UI must never be the only permission check.
- Validate all input with the existing Zod/server validation conventions.
- Use safe prepared SQLite statements; never concatenate user input into SQL.
- Treat employee-entered text and document content as untrusted data.
- Use an external temporary database for tests; never use a real database.
- Do not claim a feature is verified until the relevant command actually passes.

When finished:
1. Show the exact files changed.
2. Show the exact commands run and their results.
3. Report implementation, test, and verification status separately.
4. Stop if a requirement conflicts with the existing architecture and explain the
   conflict instead of silently inventing a second system.
```

## PROMPT 00 — QC Laboratory discovery and implementation plan

```text
Perform a read-only discovery pass for a new QC Laboratory workspace.

The desired user-facing area is a new authenticated route group, preferably:
  /lab
  /lab/tests
  /lab/equipment
  /lab/documents

Do not implement features in this prompt. Read-only + one new report file.

READ FIRST:
- audit/qc/2026-08-14-QC-LAB-PAGES-REPORT.md (design reference: page map,
  permissions matrix, lifecycle, open decisions in section 18).
- src/middleware.ts (route guard conventions, PUBLIC_PATHS).
- src/lib/permissions.ts (how permissions are centralized).
- scripts/e2e-acceptance.mjs (how suites are registered).

Inspect the existing route map, role guards, database migration runner, dashboard
queries, activity/audit conventions, notification conventions, exports, and tests.
Identify which existing components can be reused for:
- navigation and responsive layout;
- employee/manager/supervisor/admin authorization;
- forms and validation;
- audit history and notifications;
- dashboard cards, charts, filters, and exports;
- file/document handling, if already available.

Create a report at:
  apps/qc-task-manager/docs/QC-LAB-DISCOVERY.md

The report must define:
- proposed routes and route guards;
- proposed domain entities and relationships;
- fields that are employee-entered versus system-generated;
- migration order (next migration number is 011);
- reuse points and files that must not be duplicated;
- how lab permissions will be added to src/lib/permissions.ts (names, not scattered checks);
- risks and unresolved assumptions (explicitly carry over section 18 open decisions
  from the pages report — do not answer them yourself);
- the exact implementation order for PROMPT 01 onward.

ALLOWED FILE CHANGES: only apps/qc-task-manager/docs/QC-LAB-DISCOVERY.md.

Acceptance criteria:
- No production source or database file is changed.
- The report distinguishes IMPLEMENTED, PARTIAL, MISSING, and UNVERIFIED.
- Existing P0/P1 blockers from the evidence audit are not incorrectly claimed as fixed.
- The report names the next migration file number explicitly (011).
```

## PROMPT 01 — QC Laboratory database foundation

```text
Implement the database foundation for the QC Laboratory using ONE new sequential
migration: db/migrations/011_qc_laboratory.sql (adjust the number only if 011 is
already taken — never edit an applied migration).

READ FIRST:
- src/lib/migrations.ts (runner, checksums, failure handling) — follow its
  conventions exactly.
- db/schema.sql (reference snapshot — update it consistently after the migration).
- scripts/test-migrations.mjs (how migration tests assert).

Create normalized tables with foreign keys, indexes, timestamps, and safe nullable
fields for backward compatibility:

1. lab_test_records
   - id, test_type CHECK(test_type IN ('AIR','VACUUM')),
     status CHECK(status IN ('DRAFT','SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED','VOID'))
     DEFAULT 'DRAFT',
     product_description, connector_type, samples_tested, lot_number, sampling_area,
     machine_name, medium_used, actual_pressure, torque_in_lb, assembly_time_seconds,
     angle, measured_temperature, standard_parameter, acceptance_criteria,
     holding_time_range, remarks, final_result CHECK(final_result IN ('PASS','FAIL','HOLD') OR NULL),
     tested_by REFERENCES users(id), reviewed_by REFERENCES users(id),
     approved_by REFERENCES users(id), submitted_at, reviewed_at, approved_at,
     created_at, updated_at.
2. lab_test_samples
   - id, test_record_id REFERENCES lab_test_records(id) ON DELETE CASCADE,
     sample_number, part_name, set_pressure_in_hg, actual_pressure, volume_seconds,
     pressure_difference, holding_time_seconds, leakage_rate,
     result CHECK(result IN ('PASS','FAIL','HOLD') OR NULL), remarks.
3. lab_equipment
   - id, equipment_name, equipment_code, location, status (TEXT — exact original
     values are preserved; see PROMPT 05), calibration_status CHECK IN ('yes','no'),
     serial_number (TEXT — accepts '-', 'DOA-P104-AA', phone-like values),
     notes, created_by, updated_by, created_at, updated_at.
4. lab_documents
   - id, document_type CHECK(document_type IN ('SOP','WI')), title, document_code,
     description, related_product, related_equipment_id REFERENCES lab_equipment(id),
     status CHECK(status IN ('DRAFT','IN_REVIEW','APPROVED','SUPERSEDED','ARCHIVED'))
     DEFAULT 'DRAFT', current_version, owner_id REFERENCES users(id),
     reviewer_id REFERENCES users(id), approver_id REFERENCES users(id),
     effective_date, review_due_date, created_at, updated_at.
5. lab_document_versions
   - id, document_id REFERENCES lab_documents(id) ON DELETE CASCADE, version_number,
     content_markdown, rendered_html (sanitized), change_summary, status, created_by,
     reviewed_by, approved_by, created_at, reviewed_at, approved_at.
6. lab_document_links
   - document_id, test_record_id, equipment_id, product_reference.
7. lab_activity_log
   - id, entity_type CHECK(entity_type IN ('test_record','equipment','document')),
     entity_id, action, actor_id REFERENCES users(id), old_value_json, new_value_json,
     created_at — shaped to be compatible with the existing audit-chain conventions
     if the existing architecture supports it (decide and document in the discovery
     report; do not fork a second hash-chain implementation).

Rules:
- Existing tasks and records must continue to work without backfill assumptions.
- Use CHECK constraints where the current project convention supports them.
- Do not store secrets.
- Do not store uploaded binary files in this feature; the initial SOP/WI editor is
  text-based and stores sanitized Markdown plus rendered HTML.
- Add only the migration, the synchronized TypeScript types, and minimal helpers.

ALLOWED FILE CHANGES: db/migrations/011_*.sql, db/schema.sql (snapshot),
src/lib/ types/helpers for lab entities, scripts/test-migrations.mjs (new assertions),
src/lib/db.ts ONLY if startup validation needs the new tables registered.

Verification commands (run and paste results):
- pnpm --filter @brightai/qc-task-manager test:migrations
- pnpm --filter @brightai/qc-task-manager typecheck
- pnpm --filter @brightai/qc-task-manager test

Acceptance criteria:
- Migration applies exactly once, is idempotent, and migration tests pass.
- A fresh temporary database (QC_DATABASE_PATH=/tmp/... node scripts/init-db.mjs)
  contains all lab tables and indexes; PRAGMA foreign_key_check returns no rows.
- Existing database integrity checks pass (existing migration tests stay green).
- Existing unit tests remain green (same suite count or more, zero failures).
```

## PROMPT 02 — Laboratory navigation, RBAC, and shared shell

```text
Add the QC Laboratory route group and navigation without breaking existing routes.

READ FIRST:
- docs/QC-LAB-DISCOVERY.md (from PROMPT 00).
- src/middleware.ts, src/lib/permissions.ts, src/components/Navbar.tsx,
  src/layouts/BaseLayout.astro, one existing page (e.g. src/pages/findings/index.astro)
  for page conventions.

Routes:
- /lab — laboratory overview
- /lab/tests — test records list
- /lab/tests/new?type=air — air test form
- /lab/tests/new?type=vacuum — vacuum test form
- /lab/tests/[id] — test record detail/review page
- /lab/equipment — equipment registry
- /lab/documents — SOP/WI library
- /lab/documents/new — internal SOP/WI editor
- /lab/documents/[id]/edit — edit a draft or create a new version

Authorization (extend src/lib/permissions.ts — no scattered checks):
- employee: create and edit their own test drafts; submit; create/edit document
  drafts if permitted by the existing policy.
- supervisor/manager: review test records, review documents, edit operational
  records within policy, and view laboratory dashboard data.
- admin: full management and approval authority.
- No role may bypass server-side authorization by changing route parameters or
  hidden form fields.
- Do not invent a new role.

Use the existing BaseLayout/Navbar, mobile breakpoints (desktop cluster only at
lg/1024px), skip link, focus handling, reduced-motion rules, CSP-safe styling
(no inline styles), flash messages, and error conventions.

ALLOWED FILE CHANGES: src/pages/lab/** (new), src/lib/permissions.ts (additive),
src/components/Navbar.tsx (add lab links, keep lg breakpoint behavior),
src/middleware.ts (only if route guards need registration).

Verification commands:
- pnpm --filter @brightai/qc-task-manager typecheck
- pnpm --filter @brightai/qc-task-manager test
- NODE_ENV=production pnpm --filter @brightai/qc-task-manager build

Acceptance criteria:
- Unauthorized users receive the existing safe redirect/403 behavior (employee
  visiting a review-only route is redirected with a flash message, matching the
  existing dashboard-for-employee behavior).
- The laboratory appears in the correct role-filtered navigation (employees see
  lab entry; hidden links are also enforced server-side).
- Routes render server-side meaningful HTML (no client-only content).
- No horizontal overflow at 360, 768, 1024, and 1440 pixels (follow the existing
  docWidth check pattern from e2e-dashboard).
- Existing e2e-dashboard suite stays green (navbar change did not regress overflow
  checks).
```

## PROMPT 03 — Air and vacuum test-record form (printed fields only)

```text
Build the shared laboratory test-record form for AIR and VACUUM tests.

IMPORTANT: include ONLY the printed/black fields from the supplied specification
below. Do not add handwritten-only fields. Do not invent additional regulatory
fields. If the user later supplies a form image showing more printed fields,
confirm with the user before adding them.

Use ONE shared component + ONE Zod schema with a test_type-specific configuration.
Never duplicate the form per test type.

COMPLETE FIELD SPECIFICATION (sections mirror the printed form):

Section 1 — Sample Identification (employee-entered)
| Field | Input | Required | Validation |
|---|---|---|---|
| Product Description | text | yes | non-empty, bounded length |
| Connector Type | radio/select — exactly 3 options: (a) Non-locking (Lipid connector); (b) Connector with floating or rotatable collar; (c) Locking connector with fixed threads | yes | enum |
| No. of Samples Tested | integer | yes | >= 1, default 5, max = lab policy cap |
| Lot Number | text | yes | non-empty, bounded length |
| Sampling Area | text | yes | non-empty, bounded length |

Section 2 — Equipment Used (employee-entered)
| Field | Input | Required | Notes |
|---|---|---|---|
| Machine Name | select from lab_equipment (active rows) OR controlled free text | yes | prefer linking to lab_equipment; store both name and (if selected) equipment_id |
| Medium Used | text | yes | non-empty |

Section 3 — Connector Assembly (employee-entered)
| Field | Input | Reference (display-only hint) |
|---|---|---|
| Actual Pressure | decimal | show reference range "-2.5 ~ -4 in./Hg" as a hint; do NOT hard-reject values outside it (no invented regulatory rule) |
| Torque (in.lb) | decimal | — |
| Time (Sec.) | positive number | — |
| Angle | number or controlled text | — |

Section 4 — Differential Conversion (employee-entered)
| Field | Input | Notes |
|---|---|---|
| Temperature (Measured) | decimal | display the unit explicitly only if the company approved one; store the value as entered; no undocumented conversions |

Section 5 — Test Parameters (display-only reference by default)
- Standard Parameter: "Subatmospheric Pressure -40 ~ -80 kPa"
- Acceptance Criteria: "<= 800 Pa"
- Holding Time: "18 ~ 56 Sec."
Render as a read-only reference card. Snapshot these values onto the record when
it is submitted (so historical interpretation is stable). If a later policy makes
them editable, every edit must store who changed them, when, and the old/new values.

Section 6 — Test Results (employee-entered, repeating rows)
Five initial sample rows matching "No. of Samples Tested" (default 5), each row:
| Column | Input | Validation |
|---|---|---|
| Sample No. | sequence (1..N) | system-generated |
| Part Name | text | non-empty |
| Set Pressure (in./Hg) | decimal | numeric |
| Actual Pressure | decimal | numeric |
| Volume (Sec.) | decimal | numeric |
| Pressure Difference | decimal | entered manually; NEVER auto-calculated unless an approved formula exists |
| Holding Time (Sec.) | decimal | numeric |
| Leakage Rate | decimal or controlled text | numeric-or-text per approved unit |
| Result | select PASS / FAIL / HOLD | enum; human decision only |
Plus: "Any Remarks" free text under the table; "Add Sample" control bounded by the
lab policy cap (reject beyond cap with a safe field error).

Section 7 — Authorization (system-managed identities — NEVER from hidden inputs)
- Tested By: auto-filled from the authenticated session user; editable only under
  an explicit admin policy.
- Reviewed By: stamped by the server when a review action happens (PROMPT 04).
- Approved By: Q.C.M.: stamped by the server when approval happens (PROMPT 04).

Section 8 — Final Result (employee-entered on the record; reviewer confirms)
- Exactly one of: PASS / FAIL / HOLD (labeled "HOLD / FURTHER EVALUATION" in UI).
- Never derived automatically; never decided by AI.

Behavior:
- Employee-entered values are editable only while status is DRAFT (or REJECTED
  back to draft); the server enforces this, not just the UI.
- Save Draft does NOT trigger review/approval and does NOT require all fields valid
  (only bounded/typed inputs are stored; keep partial drafts usable).
- Submit for Review runs FULL server-side validation and creates the samples rows
  in the same transaction as the status change.
- Write a lab_activity_log event for create, update, submit (and later review/
  approve/reject/void from PROMPT 04).
- Numeric fields accept negative values where physically meaningful (pressures are
  negative in this form) — do not silently clamp or absolutize.

ALLOWED FILE CHANGES: src/pages/lab/tests/new.astro, src/pages/lab/tests/[id].astro
(edit mode), shared form component (React island or Astro form per house style),
src/lib/ lab validation schema + persistence helpers, scripts/test.mjs or a new
focused test script for lab form validation.

Verification commands:
- pnpm --filter @brightai/qc-task-manager typecheck
- pnpm --filter @brightai/qc-task-manager test
- NODE_ENV=production pnpm --filter @brightai/qc-task-manager build

Acceptance criteria:
- Both /lab/tests/new?type=air and ?type=vacuum work through the SAME tested form
  architecture (one component, one schema, config-driven differences only).
- Invalid values are rejected server-side with safe field-level errors (test:
  non-numeric pressure, samples_tested=0 or beyond cap, missing required fields,
  bad enum values).
- Draft save + reload preserves ALL entered values including 5 sample rows.
- Submit with invalid data changes nothing (transaction rollback verified by test).
- Existing task forms and completion flows are unchanged (e2e-task-shared green).
```

## PROMPT 04 — Test review, approval, and immutable history

```text
Implement the laboratory test-record lifecycle using the existing workflow and
approval conventions where possible.

READ FIRST:
- src/lib/workflows/ (existing engine) — decide reuse vs a lighter lab-specific
  state machine; document the choice in the discovery report conventions.
- src/lib/audit/ + src/lib/activity.ts (audit writer conventions).
- src/lib/notifications.ts.

Lifecycle (enforce server-side as explicit transitions):
  DRAFT -> SUBMITTED -> UNDER_REVIEW -> APPROVED
                                   \-> REJECTED -> DRAFT
  APPROVED -> VOID only for authorized users and only with a reason.

Rules:
- The employee who tested the record (tested_by) cannot review or approve their
  own record. Enforce in the service layer, not the UI.
- APPROVED records are read-only for everyone; corrections require a controlled
  void + recreate flow, never silent mutation. Direct POST/PATCH to an approved
  record must fail (test it).
- Rejection requires a non-empty reason and returns the record to DRAFT (editable
  by the original tester).
- Approval stamps reviewed_by/approved_by identities and timestamps from the
  authenticated session — never from the request body.
- Every transition writes lab_activity_log data and creates existing in-app
  notifications for relevant users (tester on rejection/approval; reviewers on
  submission).
- HOLD final_result keeps the record in its normal flow; it is a result value,
  not a workflow status.

Build:
- detail page /lab/tests/[id] with a clear lifecycle badge, authorization metadata
  (Tested/Reviewed/Approved + timestamps), and the reference parameters next to
  entered values;
- review panel for supervisor/manager/admin (Approve / Request Changes);
- rejection reason dialog (reason mandatory);
- void action (authorized roles only, reason mandatory);
- read-only approved view suitable for printing (print CSS, no chrome);

ALLOWED FILE CHANGES: src/pages/lab/tests/[id].astro, src/pages/api/lab/tests/**
(new), src/lib/ lab lifecycle service, notifications wiring, tests.

Verification commands:
- pnpm --filter @brightai/qc-task-manager typecheck
- pnpm --filter @brightai/qc-task-manager test
- node scripts/verify-security-hygiene.mjs
- node scripts/architecture-guard.mjs

Acceptance criteria:
- Illegal transitions return the existing safe error contract (test: DRAFT ->
  APPROVED directly, APPROVED -> DRAFT, VOID without reason).
- Self-approval is blocked server-side (test: tester POSTs approve -> 403/4xx).
- Approved values cannot be edited through direct API requests (test with fetch).
- Activity history is visible on the page and includes actor, action, timestamps,
  and rejection/void reasons.
- Every lab API requires session + CSRF + role (hygiene script green).
```

## PROMPT 05 — Editable laboratory equipment registry

```text
Build /lab/equipment as an editable server-rendered registry.

Columns (exact labels):
- Equipment | Code | Location | Status | Calibration | Serial Number | Notes
Plus system columns: Updated By / Updated At.

CANONICAL SEED DATA: audit/qc/2026-08-14-QC-LAB-ADDITIONS-PROMPTS.md contains the
authoritative 24-row dataset (equipment names, codes, statuses, calibration
yes/no, serial numbers, notes — including Arabic notes preserved verbatim).
Use it as the single source for the seed. Store the seed in a safe idempotent
migration or seed fixture, NEVER in a page-only array.

Data rules:
- Preserve the provided values EXACTLY as data (including mixed-language status
  strings like "under maintenance / NEW" equivalents and "-" serials).
- Do NOT normalize/translate status meanings before the company approves an
  official status dictionary (open decision in the pages report section 18).
  If filtering/badging needs a key, add a separate derived display column and
  document the mapping — never overwrite the original text.
- Serial numbers are TEXT (accept "-", "DOA-P104-AA", "1-800-5556-3484").
- Calibration is yes/no.

Features:
- search by name, code, serial number, status, or location (server-side,
  parameterized);
- filters for status and calibration;
- accessible edit form (or inline edit) with optimistic-free, verified persistence;
- create new equipment;
- archive equipment instead of delete (archived rows stay visible in history and
  keep their links from test records);
- link equipment to test records and SOP/WI documents (via lab_document_links and
  lab_test_records.machine/equipment reference);
- show updated_by and updated_at;
- record every change in lab_activity_log (old/new values) — calibration and
  status changes are always logged.

Authorization (extend src/lib/permissions.ts):
- employee: view; edit only if the central permission policy allows it;
- supervisor/manager: operational edits;
- admin: full control, create, and archive.

ALLOWED FILE CHANGES: src/pages/lab/equipment.astro (+ edit page), seed/migration
for the 24 rows, src/lib/ lab equipment helpers, tests.

Verification commands:
- pnpm --filter @brightai/qc-task-manager test:migrations
- pnpm --filter @brightai/qc-task-manager test
- pnpm --filter @brightai/qc-task-manager typecheck

Acceptance criteria:
- All 24 initial rows are present in a fresh test database with values matching
  the canonical dataset exactly (write an assertion that counts and spot-checks
  rows: count=24; specific codes NOC-05, DVT-01, LAB-SBC-TMC-03 present with
  exact serials).
- Updates persist after reload; updated_by/updated_at change; activity row written.
- Archived equipment remains visible in historical records (test record page still
  resolves the equipment).
- IDOR, unauthorized edits, invalid IDs, and malformed fields are rejected
  (employee PATCH -> 403; non-integer id -> 400).
```

## PROMPT 06 — Internal SOP/WI editor and document lifecycle

```text
Build the internal SOP/WI authoring system. This is an editor inside the QC
Laboratory, not merely a file-upload library.

Document types:
- SOP: Standard Operating Procedure
- WI: Work Instruction

READ FIRST:
- src/lib/evidence/ and task attachment validation (reuse sanitization lessons);
- any existing Markdown rendering dependency in the workspace — prefer an existing
  controlled renderer; otherwise a controlled textarea + server-side render.

Editor requirements (metadata):
- title, document code, type (SOP/WI), description, product reference, equipment
  links, owner, review due date, effective date, change summary.
Editor requirements (content):
- accessible Markdown editor with a SAFE preview (controlled textarea + preview —
  do not add a large editor package without evidence);
- v1 supports headings, paragraphs, numbered steps, bullet lists, tables,
  warnings/notes, links, and checklists;
- sanitize rendered HTML server-side (allowlist-based sanitizer); never use
  innerHTML with untrusted content; scripts/event handlers/javascript: URLs must
  be stripped (test it);
- preserve the original Markdown for future editing;
- autosave optional; if implemented it must be explicit and auditable.

Versioning and workflow:
- New documents start as DRAFT.
- Editing an APPROVED document creates a NEW version (version_number + 1) and
  never mutates the approved version.
- DRAFT -> IN_REVIEW -> APPROVED -> SUPERSEDED/ARCHIVED; changes requested returns
  IN_REVIEW -> DRAFT with a mandatory reason.
- Review/approval require the existing role policy; the document OWNER cannot
  approve their own document when separation of duties applies (same rule as test
  records: owner cannot self-approve).
- Every version stores author, change summary, timestamps, and approval metadata.
- Approved content has a print-friendly read-only page.
- Show version history (/lab/documents/[id]/versions) and allow authorized users
  to compare two versions side by side (Markdown diff is sufficient for v1).
- Link documents to equipment and test records.

Security and reliability:
- Validate all metadata and content server-side (Zod), with bounded content length.
- CSRF on every state-changing request; requireApiUser everywhere.
- Record create, edit, submit, request-changes, approve, supersede, archive, and
  restore actions in lab_activity_log.

ALLOWED FILE CHANGES: src/pages/lab/documents/** (new), src/lib/ document helpers
+ sanitizer wiring, tests.

Verification commands:
- pnpm --filter @brightai/qc-task-manager typecheck
- pnpm --filter @brightai/qc-task-manager test
- node scripts/verify-security-hygiene.mjs

Acceptance criteria:
- An employee can create and save a draft SOP/WI from inside the system and
  reload it unchanged.
- A reviewer can request changes with a reason; the draft returns editable.
- An approved version is immutable (direct PATCH fails) and remains readable after
  a later revision; the old version shows SUPERSEDED.
- Version history is visible; comparison renders both versions.
- Dangerous HTML/script content entered in the editor is sanitized and never
  executes in the preview or the approved view (automated XSS test).
```

## PROMPT 07 — Laboratory dashboard integration

```text
Integrate laboratory data into the existing QC dashboard without replacing its
current task, finding, CAPA, workflow, or SLA metrics.

READ FIRST:
- src/lib/dashboard.ts and src/pages/dashboard.astro + src/components/DashboardCharts.tsx
  (existing 9 KPI + 6 charts + 5 tables and filter conventions);
- scripts/e2e-dashboard.mjs (how KPI assertions compare against direct SQL).

Add a clearly separated Laboratory section with server-side queries for:
- total tests split by AIR / VACUUM;
- draft, submitted, under-review, approved, rejected, void counts;
- PASS / FAIL / HOLD distribution;
- tests awaiting review (and their oldest age in days);
- overdue document reviews (review_due_date < now AND status = APPROVED);
- equipment counts by status (in use / under maintenance / new / not in use —
  derived display mapping, original text preserved) and calibration yes/no;
- SOP/WI counts by type and lifecycle state;
- recent laboratory activity (from lab_activity_log);
- test trend by date and test type (last 8 weeks, matching the existing weekly
  chart convention).

Rules:
- Respect the viewer's role and department scope (employees never see the
  dashboard — existing rule).
- All metrics are computed from parameterized server-side queries with bounded
  date/filter inputs; no client-side aggregation.
- Keep ALL existing dashboard queries and charts working (existing 45 checks stay
  green).
- Follow current chart/style/accessibility conventions; NO inline styles (CSP);
  use the existing SVG chart patterns.

ALLOWED FILE CHANGES: src/lib/dashboard.ts (additive lab query functions),
src/pages/dashboard.astro (new Laboratory section), DashboardCharts (new lab
widgets), scripts/e2e-dashboard.mjs (new lab assertions).

Verification commands:
- pnpm --filter @brightai/qc-task-manager typecheck
- pnpm --filter @brightai/qc-task-manager test
- pnpm --filter @brightai/qc-task-manager e2e:acceptance

Acceptance criteria:
- Existing dashboard acceptance checks remain green (zero regressions).
- Every new Laboratory KPI matches a direct query against the temp database
  fixture (extend e2e-dashboard with data-attribute assertions like the existing
  KPI cards).
- The dashboard remains usable at mobile and desktop breakpoints (existing
  docWidth checks pass).
```

## PROMPT 08 — Search, filters, exports, and print views

```text
Add laboratory search and reporting using existing search/export patterns.

READ FIRST:
- src/lib/taskSearch.ts + src/pages/search.astro (search conventions);
- src/lib/export.ts / searchExport.ts / pdf.ts (CSV/XLSX/PDF conventions);
- scripts/e2e-search.mjs (search e2e pattern).

Implement:
- test search by product, lot, sampling area, machine, test type, result, status,
  tester, and date range;
- equipment search by name, code, serial number, status, calibration;
- SOP/WI search by title, code, type, product, equipment, status, and version;
- server-side pagination, sorting on whitelisted columns only, bounded filters
  (no SQL built from query strings);
- CSV export for authorized users (/api/lab/exports/tests.csv, equipment.csv,
  documents.csv) following the existing export authorization + escaping;
- print-friendly test report view (approved records) and approved SOP/WI view
  (print CSS, headers include record ID + version + generated-at);
- PDF only if the existing PDF path can be reused safely — otherwise report it
  as out of scope.

Exports must:
- enforce the same authorization as the page/API;
- avoid leaking password hashes, internal tokens, secrets, or unauthorized data;
- escape CSV formula characters where applicable;
- include record IDs, version numbers, and generated-at metadata;
- record export activity if that is already the project convention.

Verification commands:
- pnpm --filter @brightai/qc-task-manager typecheck
- pnpm --filter @brightai/qc-task-manager test
- pnpm --filter @brightai/qc-task-manager e2e:acceptance

Acceptance criteria:
- Search results are stable, paginated, and respect role scope.
- Unauthorized export requests are blocked server-side (employee on management
  export -> 403/redirect).
- CSV content has correct headers and safe escaping (formula-injection test).
- Print views contain only approved/read-only data where approval is required.
```

## PROMPT 09 — Notifications, audit integration, and human review

```text
Connect laboratory events to the existing notification and audit systems.

READ FIRST:
- src/lib/notifications.ts (real signature + "never notify inactive users");
- src/lib/audit/ + scripts/test-audit-integrity.mjs.

Notify relevant users for:
- test record submitted (reviewers);
- test record rejected (tester);
- test record approved (tester);
- test record final result = HOLD (reviewers);
- document submitted for review (reviewers);
- document changes requested (owner);
- SOP/WI approved or superseded (owner);
- equipment calibration status changed or equipment archived (lab stakeholders),
  only if the existing scheduler/policy supports it.

Audit:
- use the existing activity/audit writer conventions;
- store minimized structured metadata (JSON old/new values), never secrets or raw
  authentication data;
- ensure audit events are attributable to an authenticated actor;
- if lab_activity_log participates in the hash chain, chain verification stays green.

AI boundary (hard):
- Do not add AI-generated approval, PASS/FAIL decisions, calibration decisions,
  or document approvals.
- If an existing AI review panel is reused, it stays advisory, server-only,
  schema-validated, redacted, rate-limited, and explicitly human-reviewed.

Verification commands:
- pnpm --filter @brightai/qc-task-manager test:audit-integrity
- pnpm --filter @brightai/qc-task-manager test
- node scripts/verify-security-hygiene.mjs

Acceptance criteria:
- Notifications are created only for authorized active recipients (inactive user
  -> no row; test it).
- Duplicate events are prevented according to existing idempotency conventions.
- Audit-chain verification remains green.
- No secret, raw API key, Authorization header, or sensitive prompt appears in
  logs (grep the test output).
```

## PROMPT 10 — Security, accessibility, and responsive QA

```text
Perform a focused security and UX pass on all new QC Laboratory routes.

Verify (and fix what the lab feature introduced):
- CSRF on every state-changing request;
- authentication and server-side RBAC on every page/API;
- ID parsing (positive integers) and ownership/scope checks;
- Zod validation and safe error messages (no SQL/paths/internal details);
- CSP compatibility: no unsafe-inline additions, no inline style attributes;
- no unsafe HTML rendering in the SOP/WI preview (sanitizer test);
- bounded content sizes and request bodies;
- no sensitive values in logs or HTML;
- approved documents and test records are immutable (direct API attempts fail);
- employee cannot self-approve or change locked fields;
- keyboard navigation, focus-visible states, labels, error association,
  reduced motion, semantic headings, accessible tables (follow the a11y baseline
  from QC-A11Y-BASELINE: skip link, focus traps, escape handling);
- no horizontal overflow at 360px, 768px, 1024px, and 1440px (docWidth check).

Do not hide or weaken existing accessibility failures. Report pre-existing issues
separately from issues introduced by the laboratory extension.

Verification commands:
- node scripts/verify-security-hygiene.mjs
- node scripts/architecture-guard.mjs
- node scripts/verify-badge-contrast.mjs
- pnpm --filter @brightai/qc-task-manager e2e:acceptance (a11y suite included)

Acceptance criteria:
- All guard scripts pass.
- New routes have automated checks for authorization, CSRF, validation, and
  XSS-safe document rendering.
- Keyboard and responsive checks pass for the new pages (extend e2e-a11y or add
  a focused lab a11y script following its pattern).
```

## PROMPT 11 — End-to-end verification and delivery report

```text
Create focused unit, integration, and acceptance coverage for the QC Laboratory,
then produce the delivery report.

Required scenarios:
1. Migration applies to a fresh temporary database and preserves existing schema.
2. Employee creates an AIR draft with five samples, reloads it, and sees the
   same data.
3. Employee creates a VACUUM draft and cannot submit invalid pressure/result
   values.
4. Employee submits a test; reviewer rejects it with a reason; employee edits
   and resubmits.
5. Employee cannot approve their own test; authorized approver can approve it.
6. Approved test is immutable through direct API requests.
7. Equipment rows seed correctly (24 rows), edits persist, archive preserves
   history.
8. Employee writes an SOP/WI draft in the internal editor.
9. Reviewer requests changes; approved version is immutable; a new revision
   creates a separate version and history remains visible.
10. Dangerous HTML/script content is sanitized and never executes.
11. Dashboard laboratory metrics match temporary database fixtures.
12. Search, filters, CSV export, authorization, notifications, and audit events
    work.
13. Existing QC acceptance suites remain green.

Run the smallest relevant checks first, then the full set:
- pnpm --filter @brightai/qc-task-manager typecheck
- pnpm --filter @brightai/qc-task-manager test
- node scripts/verify-security-hygiene.mjs
- node scripts/architecture-guard.mjs
- pnpm --filter @brightai/qc-task-manager e2e:acceptance
- NODE_ENV=production pnpm --filter @brightai/qc-task-manager build
- git diff --check

Create:
  apps/qc-task-manager/docs/QC-LAB-VERIFICATION-REPORT.md

The report must list each scenario as PASS, FAIL, BLOCKED, or NOT RUN, with exact
commands, evidence scope, remaining failures, and next action. Do not label the
feature production-ready if any P0 blocker or required verification is unresolved.
```

## Recommended execution order

| Order | Prompt | Outcome |
|---:|---|---|
| 1 | 00 | Discovery and safe integration plan |
| 2 | 01 | Database foundation and migration 011 |
| 3 | 02 | Routes, navigation, and RBAC |
| 4 | 03 | AIR/VACUUM test records (printed fields only) |
| 5 | 04 | Review and approval lifecycle |
| 6 | 05 | Equipment registry (canonical 24-row seed) |
| 7 | 06 | Internal SOP/WI editor and versioning |
| 8 | 07 | Dashboard integration |
| 9 | 08 | Search, exports, and print views |
| 10 | 09 | Notifications and audit integration |
| 11 | 10 | Security, a11y, and responsive QA |
| 12 | 11 | Full verification and delivery report |

After PROMPT 06: run the additions file (`2026-08-14-QC-LAB-ADDITIONS-PROMPTS.md`)
prompts if the pages need the exact company data applied or deeper system wiring —
the additions file is written to be safe whether or not these foundation prompts ran.

## Important limitation

The supplied test specification contains the printed fields for one shared test
form and references AIR/VACUUM, but it does not define separate formulas or
acceptance rules per test type. The implementation must therefore preserve the
supplied reference values, keep test-type differences configurable, and never
invent scientific calculations or regulatory requirements without an approved
specification. Open decisions from the pages report (section 18) stay open until
the company answers them — implement configurable, never guessed.

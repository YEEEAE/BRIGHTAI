# QC Laboratory Extension — DeepSeek Flash v4 Implementation Prompts

> **Purpose:** Add a QC Laboratory workspace to the existing `apps/qc-task-manager` application.
> **Language:** The prompts in this file are intentionally written in English for DeepSeek Flash v4.
> **Execution:** Run prompts in order. Do not start the next prompt until the acceptance criteria of the previous prompt pass.
> **Scope:** Internal QC operations only. The feature must reuse the current Astro SSR, SQLite, RBAC, migrations, audit log, notifications, dashboard, export, security, and testing architecture.

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

Do not implement features in this prompt.

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
- migration order;
- reuse points and files that must not be duplicated;
- risks and unresolved assumptions;
- the exact implementation order for PROMPT 01 onward.

Acceptance criteria:
- No production source or database file is changed.
- The report distinguishes IMPLEMENTED, PARTIAL, MISSING, and UNVERIFIED.
- Existing P0/P1 blockers from the evidence audit are not incorrectly claimed as fixed.
```

## PROMPT 01 — QC Laboratory database foundation

```text
Implement the database foundation for the QC Laboratory using a new sequential
migration after the current latest migration. Do not edit old migrations.

Create normalized tables with foreign keys, indexes, timestamps, and safe nullable
fields for backward compatibility:

1. lab_test_records
   - id, test_type (AIR or VACUUM), status (DRAFT, SUBMITTED, UNDER_REVIEW,
     APPROVED, REJECTED, VOID), product_description, connector_type,
     samples_tested, lot_number, sampling_area, machine_name, medium_used,
     actual_pressure, torque_in_lb, assembly_time_seconds, angle,
     measured_temperature, standard_parameter, acceptance_criteria,
     holding_time_range, remarks, final_result, tested_by, reviewed_by,
     approved_by, submitted_at, reviewed_at, approved_at, created_at, updated_at.

2. lab_test_samples
   - id, test_record_id, sample_number, part_name, set_pressure_in_hg,
     actual_pressure, volume_seconds, pressure_difference, holding_time_seconds,
     leakage_rate, result, remarks.

3. lab_equipment
   - id, equipment_name, equipment_code, location, status, calibration_status,
     serial_number, notes, created_by, updated_by, created_at, updated_at.

4. lab_documents
   - id, document_type (SOP or WI), title, document_code, description,
     related_product, related_equipment_id, status (DRAFT, IN_REVIEW, APPROVED,
     SUPERSEDED, ARCHIVED), current_version, owner_id, reviewer_id,
     approver_id, effective_date, review_due_date, created_at, updated_at.

5. lab_document_versions
   - id, document_id, version_number, content_markdown, rendered_html,
     change_summary, status, created_by, reviewed_by, approved_by,
     created_at, reviewed_at, approved_at.

6. lab_document_links
   - document_id, test_record_id, equipment_id, product_reference.

7. lab_activity_log
   - id, entity_type, entity_id, action, actor_id, old_value_json,
     new_value_json, created_at, with a hash-chain-compatible shape if the
     existing audit architecture supports it.

Rules:
- Existing tasks and records must continue to work without backfill assumptions.
- Use CHECK constraints where the current project convention supports them.
- Do not store secrets.
- Do not store uploaded binary files in this feature unless the existing approved
  attachment architecture is intentionally reused; the initial SOP/WI editor is
  text-based and stores sanitized Markdown plus rendered HTML.
- Add only the migration and the minimum synchronized TypeScript types/helpers.

Acceptance criteria:
- Migration applies once, is idempotent, and passes the migration tests.
- Existing database integrity checks pass.
- A fresh temporary database contains all lab tables and indexes.
- Existing unit tests remain green.
```

## PROMPT 02 — Laboratory navigation, RBAC, and shared shell

```text
Add the QC Laboratory route group and navigation without breaking existing routes.

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

Authorization:
- employee: create and edit their own test drafts; submit; create/edit document
  drafts if permitted by the existing policy.
- supervisor/manager: review test records, review documents, edit operational
  records within policy, and view laboratory dashboard data.
- admin: full management and approval authority.
- No role may bypass server-side authorization by changing route parameters or
  hidden form fields.
- Do not invent a new role. Reuse existing permissions and extend the central
  permission source only where necessary.

Use the existing BaseLayout/Navbar, mobile breakpoints, skip link, focus handling,
reduced-motion rules, CSP-safe styling, flash messages, and error conventions.

Acceptance criteria:
- Unauthorized users receive the existing safe redirect/403 behavior.
- The laboratory appears in the correct role-filtered navigation.
- Routes render server-side meaningful HTML.
- The layout has no horizontal overflow at 360, 768, 1024, and 1440 pixels.
```

## PROMPT 03 — Air and vacuum test-record form

```text
Build the shared laboratory test-record form for AIR and VACUUM tests.

Important: include only the printed/black fields from the supplied specification.
Do not add handwritten-only fields or invent additional regulatory fields.

Common sections:
1. Sample Identification
   - Product Description
   - Connector Type: Non-locking (Lipid connector), Connector with floating or
     rotatable collar, Locking connector with fixed threads
   - No. of Samples Tested
   - Lot Number
   - Sampling Area
2. Equipment Used
   - Machine Name
   - Medium Used
3. Connector Assembly
   - Actual Pressure (display the reference range -2.5 to -4 in./Hg)
   - Torque (in.lb)
   - Time (Sec.)
   - Angle
4. Differential Conversion
   - Temperature (Measured)
5. Test Parameters
   - Standard Parameter (display the supplied reference text)
   - Acceptance Criteria (display <= 800 Pa)
   - Holding Time (display the supplied range 18 to 56 Sec.)
6. Test Results
   - five initial sample rows, with an allowed controlled extension if the user
     declares more samples in the form
   - Sample No., Part Name, Set Pressure (in./Hg), Actual Pressure, Volume
     (Sec.), Pressure Difference, Holding Time (Sec.), Leakage Rate, Result
   - Any Remarks
7. Authorization
   - Tested By, Reviewed By, Approved By: Q.C.M.
8. Final Result
   - PASS, FAIL, HOLD / FURTHER EVALUATION

Behavior:
- Use one shared component/schema with a test_type-specific configuration.
- Keep employee-entered values editable only while the record is DRAFT or while
  the existing policy allows editing.
- Calculate derived values only when the formula and units are explicit; never
  silently infer a value. Show calculation labels and preserve manually entered
  values separately from calculated values.
- Validate numeric ranges, sample count, required fields, allowed enum values,
  and final-result transitions on the server.
- Save drafts without triggering approval.
- Write a lab activity event for create, update, submit, review, approve, reject,
  and void actions.

Acceptance criteria:
- Both AIR and VACUUM routes work through the same tested form architecture.
- Invalid values are rejected server-side with safe field-level errors.
- Draft save and reload preserve all entered values.
- Existing task forms and completion flows are unchanged.
```

## PROMPT 04 — Test review, approval, and immutable history

```text
Implement the laboratory test-record lifecycle using the existing workflow and
approval conventions where possible.

Lifecycle:
  DRAFT -> SUBMITTED -> UNDER_REVIEW -> APPROVED
                                  \-> REJECTED -> DRAFT
  APPROVED -> VOID only for authorized users and only with a reason.

Rules:
- The employee who tested the record cannot approve their own record.
- Approved records are read-only; corrections require a controlled new revision
  or void/recreate flow, never silent mutation.
- Rejection requires a reason and returns the record to DRAFT.
- Approval requires reviewer/approver identity and timestamps.
- Every transition writes activity/audit data and creates existing notifications
  for relevant users.
- Do not allow browser-only status changes; enforce transitions in a server-side
  service/API.

Build:
- detail page with clear lifecycle badge and authorization metadata;
- review panel for supervisor/manager/admin;
- rejection reason dialog;
- approval confirmation;
- read-only approved view suitable for printing/export.

Acceptance criteria:
- Illegal transitions return the existing safe error contract.
- Self-approval is blocked server-side.
- Approved values cannot be edited through direct POST requests.
- Activity history is visible and includes actor, action, and timestamp.
```

## PROMPT 05 — Editable laboratory equipment registry

```text
Build /lab/equipment as an editable server-rendered registry.

Columns:
- Equipment
- Code
- Location
- Status
- Calibration
- Serial Number
- Notes

Seed the initial 24 equipment rows from the supplied user data. Preserve the
provided values exactly as data, but do not expose any hidden secrets. Store the
seed in a safe idempotent migration or seed fixture, never in a page-only array.

Features:
- search by name, code, serial number, status, or location;
- filters for status and calibration;
- inline edit or an accessible edit form;
- create new equipment;
- archive equipment without deleting historical references;
- link equipment to test records and SOP/WI documents;
- show updated_by and updated_at;
- record every change in lab_activity_log and the existing audit conventions.

Authorization:
- employee: view; edit only if the central permission policy allows it;
- supervisor/manager: operational edits;
- admin: full control and archive.

Acceptance criteria:
- All 24 initial rows are present in a fresh test database.
- Updates persist after reload and are visible in the dashboard queries.
- Archived equipment remains visible in historical records.
- IDOR, unauthorized edits, invalid IDs, and malformed fields are rejected.
```

## PROMPT 06 — Internal SOP/WI editor and document lifecycle

```text
Build the internal SOP/WI authoring system. This is an editor inside the QC
Laboratory, not merely a file-upload library.

Document types:
- SOP: Standard Operating Procedure
- WI: Work Instruction

Editor requirements:
- title, document code, type, description, product reference, equipment links,
  owner, review due date, effective date, change summary;
- accessible Markdown editor with a safe preview; prefer an existing dependency
  or a controlled textarea + preview instead of adding a large editor package;
- headings, paragraphs, numbered steps, bullet lists, tables, warnings, links,
  and checklists are sufficient for v1;
- sanitize rendered HTML and never use unsafe innerHTML with untrusted content;
- preserve the original Markdown for future editing;
- autosave is optional; if implemented, it must be explicit and auditable.

Versioning and workflow:
- New documents start as DRAFT.
- Editing an APPROVED document creates a new version and never mutates the
  approved version.
- DRAFT -> IN_REVIEW -> APPROVED -> SUPERSEDED/ARCHIVED.
- Review and approval require the existing role policy and cannot be performed
  by the document owner when the policy requires separation of duties.
- Every version stores author, change summary, timestamps, and approval metadata.
- Approved content has a print-friendly read-only page.
- Show version history and allow authorized users to compare versions.
- Link documents to equipment and test records.

Security and reliability:
- Validate all metadata and content server-side.
- Limit content length and reject dangerous HTML/script content.
- Do not execute Markdown, HTML, JavaScript, or embedded URLs as code.
- Use CSRF protection for all state-changing requests.
- Record create, edit, submit, approve, supersede, archive, and restore actions.

Acceptance criteria:
- An employee can create and save a draft SOP/WI from inside the system.
- A reviewer can request changes with a reason.
- An approved version is immutable and remains readable after a later revision.
- Version history and audit activity are visible to authorized users.
```

## PROMPT 07 — Laboratory dashboard integration

```text
Integrate laboratory data into the existing QC dashboard without replacing its
current task, finding, CAPA, workflow, or SLA metrics.

Add a clearly separated Laboratory section with server-side queries for:
- total tests by AIR/VACUUM;
- draft, submitted, under-review, approved, rejected, and hold counts;
- PASS/FAIL/HOLD distribution;
- tests awaiting review and overdue document reviews;
- equipment by status and calibration state;
- SOP/WI counts by type and lifecycle state;
- recent laboratory activity;
- test trends by date and test type.

Rules:
- Respect the viewer's role and department scope.
- Do not calculate metrics from incomplete client-side data.
- Use parameterized queries and bounded date/filter inputs.
- Keep existing dashboard queries and charts working.
- Use the current chart/style/accessibility conventions and avoid inline styles
  that conflict with the current CSP.

Acceptance criteria:
- Existing dashboard acceptance tests remain green.
- Laboratory KPIs match direct temporary-database queries.
- Employees do not see management-only metrics unless policy permits it.
- The dashboard remains usable at mobile and desktop breakpoints.
```

## PROMPT 08 — Search, filters, exports, and print views

```text
Add laboratory search and reporting using existing search/export patterns.

Implement:
- test search by product, lot, sampling area, machine, test type, result,
  status, tester, and date range;
- equipment search by name, code, serial number, status, calibration;
- SOP/WI search by title, code, type, product, equipment, status, and version;
- server-side pagination, sorting, and bounded filters;
- CSV export for authorized users;
- print-friendly test report and approved SOP/WI view;
- PDF export only if the existing project PDF path can be reused safely.

Exports must:
- enforce the same authorization as the page/API;
- avoid leaking password hashes, internal tokens, secrets, or unauthorized data;
- escape CSV formula characters where applicable;
- include record IDs, version numbers, and generated-at metadata;
- record export activity if that is already the project convention.

Acceptance criteria:
- Search results are stable and paginated.
- Unauthorized export requests are blocked server-side.
- CSV content has correct headers and safe escaping.
- Print views contain only approved/read-only data where approval is required.
```

## PROMPT 09 — Notifications, audit integration, and human review

```text
Connect laboratory events to the existing notification and audit systems.

Notify relevant users for:
- test record submitted;
- test record rejected;
- test record approved;
- test record placed on HOLD;
- document submitted for review;
- document changes requested;
- SOP/WI approved or superseded;
- equipment calibration due/expired if the existing scheduler supports it.

Audit:
- use the existing activity/audit writer and hash-chain conventions;
- store minimized structured metadata, not secrets or raw authentication data;
- preserve old/new values safely and redact sensitive content where necessary;
- ensure audit events are attributable to an authenticated actor.

AI boundary:
- Do not add AI-generated approval, PASS/FAIL decisions, calibration decisions,
  or document approvals.
- If an existing AI review panel is reused, it must remain advisory, server-only,
  schema-validated, redacted, rate-limited, and explicitly human-reviewed.

Acceptance criteria:
- Notifications are created only for authorized active recipients.
- Duplicate events are prevented according to existing idempotency conventions.
- Audit-chain verification remains green.
- No secret, raw API key, Authorization header, or sensitive prompt appears in logs.
```

## PROMPT 10 — Security, accessibility, and responsive QA

```text
Perform a focused security and UX pass on all new QC Laboratory routes.

Verify:
- CSRF on every state-changing request;
- authentication and server-side RBAC on every page/API;
- ID parsing and ownership/scope checks;
- Zod validation and safe error messages;
- CSP compatibility with no unsafe-inline additions;
- no unsafe HTML rendering in the SOP/WI preview;
- bounded content sizes and request bodies;
- no sensitive values in logs or HTML;
- approved documents and test records are immutable;
- employee cannot self-approve or change locked fields;
- keyboard navigation, focus-visible states, labels, error association,
  reduced motion, semantic headings, and accessible tables;
- RTL-safe layout and logical CSS properties where applicable;
- no horizontal overflow at 360px, 768px, 1024px, and 1440px.

Do not hide or weaken existing accessibility failures. Report pre-existing issues
separately from issues introduced by the laboratory extension.

Acceptance criteria:
- Existing security hygiene and architecture guard pass.
- New routes have automated checks for authorization, CSRF, validation, and XSS-safe
  document rendering.
- Keyboard and responsive checks pass for the new pages.
```

## PROMPT 11 — End-to-end verification and delivery report

```text
Create focused unit, integration, and acceptance coverage for the QC Laboratory.

Required scenarios:
1. Migration applies to a fresh temporary database and preserves existing schema.
2. Employee creates an AIR draft with five samples, reloads it, and sees the same data.
3. Employee creates a VACUUM draft and cannot submit invalid pressure/result values.
4. Employee submits a test; reviewer rejects it with a reason; employee edits and resubmits.
5. Employee cannot approve their own test; authorized approver can approve it.
6. Approved test is immutable through direct API requests.
7. Equipment rows seed correctly, edits persist, archive preserves history.
8. Employee writes an SOP/WI draft in the internal editor.
9. Reviewer requests changes; approved version is immutable; new revision creates a
   separate version and history remains visible.
10. Dangerous HTML/script content is sanitized and never executes.
11. Dashboard laboratory metrics match temporary database fixtures.
12. Search, filters, CSV export, authorization, notifications, and audit events work.
13. Existing QC acceptance suites remain green.

Run the smallest relevant checks first, then the full available verification set:
- typecheck;
- unit tests;
- migration/database rules;
- security hygiene;
- architecture guard;
- focused laboratory E2E;
- full QC acceptance suite;
- production build;
- git diff --check.

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
| 2 | 01 | Database foundation and migration |
| 3 | 02 | Routes, navigation, and RBAC |
| 4 | 03 | AIR/VACUUM test records |
| 5 | 04 | Review and approval lifecycle |
| 6 | 05 | Equipment registry |
| 7 | 06 | Internal SOP/WI editor and versioning |
| 8 | 07 | Dashboard integration |
| 9 | 08 | Search, exports, and print views |
| 10 | 09 | Notifications and audit integration |
| 11 | 10 | Security, a11y, RTL, and responsive QA |
| 12 | 11 | Full verification and delivery report |

## Important limitation

The supplied test specification contains the printed fields for one shared test
form and references AIR/VACUUM, but it does not define separate formulas or
acceptance rules for every test type. The implementation must therefore preserve
the supplied reference values, make test-type differences configurable, and never
invent scientific calculations or regulatory requirements without an approved
specification.

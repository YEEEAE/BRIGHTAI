# QC Laboratory — Architecture Contract

- **Document:** `apps/qc-task-manager/docs/QC-LAB-ARCHITECTURE.md`
- **Version:** 1.1 (2026-08-14)
- **Status:** Binding architecture contract for prompt pack `audit/qc/prompt4-LAB.md` (PROMPT 02–39)
- **Application:** `apps/qc-task-manager/` (pnpm workspace package `@brightai/qc-task-manager`)
- **Primary laboratory route:** `/lab`
- **Language of code identifiers:** English
- **Nature:** Contract / specification. This document contains **no implementation**. Execution begins with PROMPT 02.

---

## 1. Purpose

This document is the final architecture contract for the QC Laboratory workspace inside the existing QC Task Manager application.

It defines, before any code is written:

- the full route tree with route guards;
- the permission model mapped onto the existing RBAC;
- the service/module layout;
- the entities, relationships, and database migration order;
- the workflow state machines;
- the audit events;
- the notification integration;
- the dashboard and export dependencies;
- the security and AI boundaries;
- the testing contract;
- the open business decisions that MUST NOT be invented away.

Every subsequent implementation prompt (PROMPT 02–39 in `audit/qc/prompt4-LAB.md`) MUST comply with this contract. When a later prompt conflicts with this contract, the conflict is resolved in favor of the **actual repository** (see §2 precedence), then this contract, and the decision must be documented.

---

## 2. Source Documents & Precedence

| # | Source | Path | Role |
|---|---|---|---|
| 1 | QC Laboratory Complete Page Reference | `audit/qc/BRIGHTAI-QC-Laboratory-Complete-Page-Reference.md` | Functional reference (master business spec) |
| 2 | Master implementation prompt pack (40 prompts) | `audit/qc/prompt4-LAB.md` | Execution sequence + acceptance criteria |
| 3 | Evidence-First Audit | `audit/qc/before/2026-08-14-EVIDENCE-AUDIT.md` | Current-state audit baseline |
| 4 | Legacy audit report | `audit/qc/REPORT.md` | Historical context only |
| 5 | Project mind (brain) | `.agents/mind/01-mind-latest.md` | Latest verified repository state |
| 6 | Existing app architecture doc | `apps/qc-task-manager/docs/ARCHITECTURE.md` | Current module map |

**Precedence for technical truth:** actual repository code > this contract > page reference > prompt pack > audit reports.

> **Missing-files note (verified 2026-08-14, re-verified same day during v1.1 re-grounding):** the files referenced by the master rules —
> `audit/qc/2026-08-14-QC-LAB-PAGES-REPORT.md` and
> `audit/qc/2026-08-14-QC-LAB-IMPLEMENTATION-PROMPTS.md` —
> do **not exist** in the current working tree of `audit/qc/`. Their content is superseded by
> sources #1 and #2 above, which do exist and were read completely for this contract.
> The PROMPT 00/01 checkboxes in `prompt4-LAB.md` are marked `[✅]`, but neither
> `docs/QC-LAB-MASTER-DISCOVERY.md` nor `docs/QC-LAB-ARCHITECTURE.md` existed in the
> repository at the time this document was authored (this file restores the PROMPT 01
> deliverable).

---

## 3. Verified Repository Facts (Baseline)

These facts were verified against the code on 2026-08-14 and form the baseline this contract extends. Implementers MUST re-verify before relying on them.

| Fact | Value | Verified in |
|---|---|---|
| Runtime | Astro 6 SSR (`output: 'server'`) + `@astrojs/node` standalone, React 19 islands, Tailwind 3 | `astro.config.mjs` |
| Database | Self-contained better-sqlite3; path from `QC_DATABASE_PATH` (alias `QC_DB_PATH`); pragmas WAL / foreign_keys=ON / busy_timeout=5000 / synchronous=NORMAL | `src/lib/db.ts` |
| Latest migration | `010_ai_evidence_status.sql` → **next migration is `011`**; strict `NNN_snake_case.sql`, sequential, SHA-256 checksummed | `db/migrations/`, `src/lib/migrations.ts` |
| Embedded migrations | Production bundle requires each migration also as `?raw` import in the `embeddedMigrations` array inside `src/lib/db.ts` `initialize()` | `src/lib/db.ts` (imports at lines 33–42) |
| Schema validation | `REQUIRED_TABLES` / `REQUIRED_INDEXES` fail-fast lists in `src/lib/db.ts` must be extended with every new table/index | `src/lib/db.ts` |
| RBAC single source | `src/lib/permissions.ts` (`PERMISSIONS` object + `can*` guards; roles: `admin`, `manager`, `supervisor`, `employee`; `ROLE_RANK` 4/3/2/1) | `src/lib/permissions.ts` |
| Route guards | Middleware prefix guards for `/admin`, `/manager`, `/supervisor`, `/dashboard`; `PUBLIC_PATHS = {'/', '/login', '/api/health'}` | `src/middleware.ts` |
| API defense-in-depth | Every API endpoint independently calls `requireApiUser` + `requireCsrf` (+ `requireRequestSecurity`: content-length cap, content-type allowlist, in-memory mutation rate limit 120/min/IP/path) | `src/lib/api-security.ts` |
| Validation convention | All Zod schemas live in `src/lib/validation.ts` (only exception: `src/lib/ai/schemas.ts`); `parseFormData(schema, form)`; `positiveIdSchema`/`parsePositiveId` for route params | `src/lib/validation.ts` |
| Task domain rules | Canonical constants/transitions in `src/lib/task-policy.ts` (never hardcoded in schemas/components) | `src/lib/task-policy.ts` |
| Audit systems | `task_activity_log` (hash chain, migration 008) for tasks; `qc_audit_log` (migration 004) for FINDING/RCA/CAPA/EVIDENCE; `ai_audit_log` (009); report audit in `src/lib/reporting/audit.ts` | `src/lib/activity.ts`, `src/lib/qc-operations.ts` |
| `qc_audit_log` constraint | `entity_type CHECK IN ('FINDING','RCA','CAPA','EVIDENCE')`, `action CHECK IN ('CREATE','UPDATE','STATUS_TRANSITION','APPROVAL','REJECTION','CLOSURE','REOPEN')` — **lab entities do not fit; see §8/§10** | `db/migrations/004_qc_operations.sql:64-75` |
| Notifications | `src/lib/notifications.ts`; persisted rows in `notifications` table + derived kinds; 15 kinds in `NotificationKind`; `createNotification` is the central guard that never notifies inactive users | `src/lib/notifications.ts` |
| Dashboard | `src/lib/dashboard.ts` (9 KPI + 6 charts + 5 tables, one WHERE builder) + `src/lib/reporting/*` (catalog/queries/authorization/scope/reader/writers) | `src/lib/dashboard.ts`, `src/lib/reporting/` |
| Exports | `src/lib/export.ts`, `src/lib/searchExport.ts`, `src/lib/pdf.ts`, `src/lib/reporting/writers/{csv,pdf,xlsx}.ts`; `api/reports/[reportType].[format].ts` | `src/pages/api/export/**`, `src/pages/api/reports/**` |
| Workflow engines (existing) | Task status machine (`task-policy.ts`), approval workflow engine (`src/lib/workflows/`), Finding machine (`src/lib/findings/`), CAPA machine (`src/lib/capa/`), template lifecycle (`src/lib/templates/`), SLA (`src/lib/sla/`) | respective modules |
| Tests | Custom Node scripts `scripts/*.mjs` chained by `pnpm test`; E2E via `e2e:*.mjs` orchestrated by `e2e:acceptance`; NO Vitest in this app | `package.json`, `scripts/` |
| Existing lab code | **None.** No `/lab` routes, no `lab_*` tables. `src/lib/lab/` exists but is **empty** (placeholder directory only — no files; the starting point for PROMPT 02) | repo-wide search (re-verified 2026-08-14) |
| Last verified baseline | typecheck 0 errors / 0 warnings / 13 hints; `pnpm test` 279/0; `pnpm e2e:acceptance` all suites PASS | `.agents/mind/01-mind-latest.md` (QC-SAVED-FILTERS-DOCS-001) |

---

## 4. Integration Contract (Anti-Duplication Map)

The Laboratory is **not a second application**. Every cross-cutting concern MUST reuse the existing unit. Creating any parallel system listed below is a contract violation.

| Concern | Reuse (existing) | Forbidden |
|---|---|---|
| Authentication | `src/lib/auth.ts`, `src/lib/session.ts`, login flow in `src/middleware.ts` | Any new login/session/cookie/token mechanism |
| Sessions | `sessions` table + `qc_session` cookie via existing helpers | New session stores or signed-cookie schemes |
| RBAC | `src/lib/permissions.ts` — add LAB_* entries to the `PERMISSIONS` object + new `can*` guard functions **in this file only** | Second permission matrix, DB-driven roles, client-side role checks |
| Route guarding | `src/middleware.ts` — one new `/lab` prefix guard + per-page/per-API server re-checks | Per-page ad-hoc guard logic duplicating middleware |
| CSRF | `requireCsrf(context)` from `src/lib/api-security.ts` on every state-changing endpoint | Custom origin checks |
| API hardening | `requireApiUser`, `requireRequestSecurity`, `apiJsonError` | New rate limiters/validators bypassing these |
| Validation | Zod schemas in `src/lib/validation.ts` (`*InputSchema`, `parseFormData`, `parsePositiveId`) | Schemas scattered in pages/components; trusting body/hidden fields |
| SQL access | `getDb()` prepared statements with `?` params only | String concatenation, second DB connection layer |
| Migrations | `db/migrations/NNN_*.sql` + `?raw` import in `db.ts` + `REQUIRED_TABLES`/`REQUIRED_INDEXES` + `src/lib/types.ts` mirror | Runtime DDL, editing old migrations |
| Audit | `qc_audit_log` (extended — §10) + existing activity/report audit modules | A parallel `lab_audit_*` system with different guarantees |
| Notifications | `src/lib/notifications.ts` (`createNotification`, `NotificationKind`, `PERSISTED_SEVERITY`, page sections) | Second notification table/engine |
| Dashboard | `src/lib/dashboard.ts` + `DashboardCharts.tsx` patterns — add a Laboratory section | A separate lab dashboard service stack |
| Reports/Exports | `src/lib/reporting/` catalog + authorization + scope + writers + report audit | New export pipeline |
| Workflow | State-machine policy modules following the `findings`/`capa`/`task-policy` pattern (`canTransitionX` + typed status unions) | A second generic workflow engine; reusing `workflow_instances` for lab records is NOT required and NOT desired |
| AI | `src/lib/ai/` (Groq server-only, Zod structured output, redaction, audit) — advisory features only | New AI provider layer; AI-driven PASS/FAIL or approvals |
| UI kit | `BaseLayout.astro`, `StatusBadge.astro`/`QcStatusBadge.astro` patterns, `EmptyState.astro`, `FlashNotice.astro`, Tailwind conventions, islands only where needed (`client:visible`/`client:idle` preferred) | New component library, jQuery-like deps, client-rendered lists |
| Flash/errors | `setFlash`/`consumeFlash` (`src/lib/flash.ts`), existing 404/permission redirect pattern | New messaging channel |

---

## 5. Route Tree, Guards & Permissions

### 5.1 Guard architecture

1. **Middleware** (`src/middleware.ts`): add one prefix rule — any path `/lab` or `/lab/*` requires an authenticated session (same pattern as `/manager`); unauthenticated → redirect `/login`; authenticated but lacking `LAB_VIEW` → flash + redirect to `roleHome(user.role)`. `PUBLIC_PATHS` is NOT extended.
2. **Every page/API re-checks server-side** (defense in depth, mirroring `requireApiUser` usage): page frontmatter checks the specific LAB_* permission for that page; every API endpoint re-validates session + CSRF + entity-level authorization (ownership/role) — never trusting query params or hidden fields.
3. Authorization answers are computed **only** from `src/lib/permissions.ts` + the session user.

### 5.2 Route map

All pages live under `src/pages/lab/`. All APIs under `src/pages/api/lab/`. `[id]` params parsed with `parsePositiveId`.

| Route | File | Logical permission (beyond `LAB_VIEW`) | Notes |
|---|---|---|---|
| `/lab` | `src/pages/lab/index.astro` | `LAB_VIEW` | Command center (PROMPT 04) |
| `/lab/tests` | `src/pages/lab/tests/index.astro` | `LAB_TEST_VIEW` | Register; server-side search/pagination/sorting |
| `/lab/tests/new?type=air` | `src/pages/lab/tests/new.astro` | `LAB_TEST_CREATE` | `type` query param selects variant; **validated server-side** against `air\|vacuum`; not an authorization input |
| `/lab/tests/new?type=vacuum` | same file | `LAB_TEST_CREATE` | Shared form architecture — one form, `test_type` differs |
| `/lab/tests/review` | `src/pages/lab/tests/review.astro` | `LAB_TEST_REVIEW` | Reviewer queue |
| `/lab/tests/[id]` | `src/pages/lab/tests/[id].astro` | `LAB_TEST_VIEW` | Detail; approved → read-only |
| `/lab/tests/[id]/print` | `src/pages/lab/tests/[id]/print.astro` | `LAB_TEST_VIEW` | A4 print; no nav; own minimal layout (no `BaseLayout` Navbar) |
| `/lab/products` | `src/pages/lab/products/index.astro` | `LAB_PRODUCT_VIEW` | |
| `/lab/products/new` | `src/pages/lab/products/new.astro` | `LAB_PRODUCT_CREATE` | |
| `/lab/products/[id]` | `src/pages/lab/products/[id].astro` | `LAB_PRODUCT_VIEW` | Details + history |
| `/lab/products/[id]/edit` | `src/pages/lab/products/[id]/edit.astro` | `LAB_PRODUCT_EDIT` | Archived products not editable |
| `/lab/templates` | `src/pages/lab/templates/index.astro` | `LAB_TEMPLATE_VIEW` | **Lab test templates — distinct entity from `/admin/templates` (task templates). Never share tables, services, or routes.** |
| `/lab/templates/new` | `src/pages/lab/templates/new.astro` | `LAB_TEMPLATE_CREATE` | |
| `/lab/templates/[id]` | `src/pages/lab/templates/[id].astro` | `LAB_TEMPLATE_VIEW` | Details + version list |
| `/lab/templates/[id]/edit` | `src/pages/lab/templates/[id]/edit.astro` | `LAB_TEMPLATE_EDIT` | Edit of approved template ⇒ new version (never in-place mutation of an approved version) |
| `/lab/equipment` | `src/pages/lab/equipment/index.astro` | `LAB_EQUIPMENT_VIEW` | |
| `/lab/equipment/new` | `src/pages/lab/equipment/new.astro` | `LAB_EQUIPMENT_CREATE` | |
| `/lab/equipment/[id]` | `src/pages/lab/equipment/[id].astro` | `LAB_EQUIPMENT_VIEW` | Details + related tests/docs/maintenance/calibration/audit |
| `/lab/equipment/[id]/edit` | `src/pages/lab/equipment/[id]/edit.astro` | `LAB_EQUIPMENT_EDIT` | |
| `/lab/equipment/[id]/maintenance` | `src/pages/lab/equipment/[id]/maintenance.astro` | `LAB_EQUIPMENT_MAINTENANCE` | Log + list maintenance events |
| `/lab/calibration` | `src/pages/lab/calibration/index.astro` | `LAB_CALIBRATION_VIEW` | Register |
| `/lab/calibration/[id]` | `src/pages/lab/calibration/[id].astro` | `LAB_CALIBRATION_VIEW` | Details |
| `/lab/documents` | `src/pages/lab/documents/index.astro` | `LAB_DOCUMENT_VIEW` | SOP/WI library |
| `/lab/documents/new` | `src/pages/lab/documents/new.astro` | `LAB_DOCUMENT_CREATE` | |
| `/lab/documents/[id]` | `src/pages/lab/documents/[id].astro` | `LAB_DOCUMENT_VIEW` | Details incl. current version |
| `/lab/documents/[id]/edit` | `src/pages/lab/documents/[id]/edit.astro` | `LAB_DOCUMENT_EDIT` | Editing an APPROVED document creates a new DRAFT version; the approved version stays immutable |
| `/lab/documents/[id]/versions` | `src/pages/lab/documents/[id]/versions.astro` | `LAB_DOCUMENT_VIEW` | Version history + read-only compare |
| `/lab/retests` | `src/pages/lab/retests/index.astro` | `LAB_RETEST_VIEW` | |
| `/lab/retests/[id]` | `src/pages/lab/retests/[id].astro` | `LAB_RETEST_VIEW` | Retest details; links back to original |
| `/lab/search` | `src/pages/lab/search.astro` | `LAB_VIEW` | **New lab-entity search page**; reuses the server-side search patterns of `src/lib/taskSearch.ts` + saved-view storage conventions (`saved_filters`/`/api/filters` pattern, user-scoped, never arbitrary SQL) |
| `/lab/reports` | `src/pages/lab/reports.astro` | `LAB_REPORT_VIEW` | Report catalog page; exports gated by `LAB_EXPORT`; generation goes through existing reporting authorization/scope/audit pipeline |
| `/lab/data-quality` | `src/pages/lab/data-quality.astro` | `LAB_DATA_QUALITY_VIEW` | Informational only — reports issues, never mutates data |
| `/lab/calendar` | `src/pages/lab/calendar.astro` | `LAB_VIEW` | Events derived from calibration/maintenance/document-review/acknowledgement dates; click-through to source records |
| `/lab/notifications` | `src/pages/lab/notifications.astro` | `LAB_VIEW` | **Lab-filtered view over the SAME `notifications` table** — reuses `listPersistedNotifications`/mark-read endpoints; not a second system. The global bell (`Navbar.tsx`) and `/notifications` continue to show all kinds |

**State-changing API endpoints** (all `requireApiUser` + `requireCsrf` + Zod + audit):

```
POST /api/lab/tests                     create (draft) — LAB_TEST_CREATE
POST /api/lab/tests/[id]                update draft — LAB_TEST_EDIT (DRAFT/REJECTED only)
POST /api/lab/tests/[id]/submit         submit — LAB_TEST_SUBMIT (own draft, complete)
POST /api/lab/tests/[id]/review         start review / request changes — LAB_TEST_REVIEW
POST /api/lab/tests/[id]/reject         reject (reason required) — LAB_TEST_REVIEW
POST /api/lab/tests/[id]/approve        approve — LAB_TEST_APPROVE (never self-approve)
POST /api/lab/tests/[id]/void           void (reason required) — LAB_TEST_VOID (admin/manager)
POST /api/lab/tests/[id]/retests        create retest — LAB_RETEST_CREATE
POST /api/lab/products[/id]             create/edit/archive — LAB_PRODUCT_*
POST /api/lab/templates[/id]            create/edit/new-version/approve — LAB_TEMPLATE_*
POST /api/lab/equipment[/id]            create/edit/archive/restore — LAB_EQUIPMENT_*
POST /api/lab/equipment/[id]/maintenance— add maintenance event — LAB_EQUIPMENT_MAINTENANCE
POST /api/lab/calibration[/id]          create/update — LAB_CALIBRATION_*
POST /api/lab/documents[/id]            create/edit/submit/request-changes/approve/
                                        supersede/archive — LAB_DOCUMENT_*
POST /api/lab/documents/[id]/acknowledge— acknowledge version — LAB_DOCUMENT_ACKNOWLEDGE
GET  /api/reports/[reportType].[format] existing endpoint, extended with lab report types
```

Exact file split may differ (e.g., `api/lab/tests/[id]/[action].ts`); the contract fixes the **authorization + CSRF + validation + audit requirements**, not the file granularity.

### 5.3 Navigation

Extend the existing `Navbar.tsx` role-aware link set with a single "Laboratory" entry (visible with `LAB_VIEW`) pointing to `/lab`; the `/lab` workspace renders its own grouped secondary navigation (Overview / Testing / Master Data / Controlled Documents / Operations) filtered by the same permission helpers. Mobile menu follows the existing `lg:` breakpoint behavior. Existing links are not removed.

---

## 6. Permission Model

### 6.1 Implementation location

All LAB_* permissions are added **only** to `src/lib/permissions.ts` as entries of the `PERMISSIONS` object (e.g., `canViewLab`, `canCreateLabTest`, `canReviewLabTest`, …) plus standalone `can*` predicates where entity context is needed (`canEditLabTest(user, test)`, `canApproveLabTest(user, test)`). `scripts/architecture-guard.mjs` canonical-ownership rules apply: no other module may define role→permission authority.

### 6.2 Role matrix (binding default)

`LAB_VIEW` and read permissions (`*_VIEW`) are granted to all four roles. Write/approve distribution:

| Permission | admin | manager | supervisor | employee |
|---|---|---|---|---|
| LAB_TEST_CREATE | ✅ | ✅ | ✅ | ✅ (tests are the employee's core work) |
| LAB_TEST_EDIT | ✅ | ✅ | own DRAFT/REJECTED tests | own DRAFT/REJECTED tests |
| LAB_TEST_SUBMIT | ✅ | ✅ | own | own |
| LAB_TEST_REVIEW | ✅ | ✅ | ✅ (except own test — no self-review) | ❌ |
| LAB_TEST_APPROVE | ✅ | ✅ (except own test — **no self-approval**) | ❌ (default; see Open Decision D-4) | ❌ |
| LAB_TEST_VOID | ✅ | ✅ | ❌ | ❌ |
| LAB_PRODUCT_CREATE/EDIT/ARCHIVE | ✅ | ✅ | ❌ | ❌ |
| LAB_TEMPLATE_CREATE/EDIT | ✅ | ✅ | ❌ | ❌ |
| LAB_TEMPLATE_APPROVE | ✅ | ✅ (not own edit) | ❌ | ❌ |
| LAB_EQUIPMENT_CREATE/EDIT/ARCHIVE | ✅ | ✅ | ❌ | ❌ |
| LAB_EQUIPMENT_MAINTENANCE | ✅ | ✅ | ✅ | ❌ |
| LAB_CALIBRATION_CREATE/EDIT | ✅ | ✅ | ❌ | ❌ |
| LAB_DOCUMENT_CREATE/EDIT | ✅ | ✅ | ✅ | ❌ |
| LAB_DOCUMENT_REVIEW | ✅ | ✅ | ✅ (not own document) | ❌ |
| LAB_DOCUMENT_APPROVE | ✅ | ✅ (not own edit) | ❌ | ❌ |
| LAB_DOCUMENT_ARCHIVE | ✅ | ✅ | ❌ | ❌ |
| LAB_DOCUMENT_ACKNOWLEDGE | ✅ | ✅ | ✅ | ✅ (the acknowledgement use case) |
| LAB_RETEST_CREATE | ✅ | ✅ | ✅ | ❌ (default; Open Decision D-5) |
| LAB_RETEST_VIEW | ✅ | ✅ | ✅ | ✅ |
| LAB_REPORT_VIEW | ✅ | ✅ | ✅ | ❌ |
| LAB_EXPORT | ✅ | ✅ | ✅ | ❌ |
| LAB_DATA_QUALITY_VIEW | ✅ | ✅ | ✅ | ❌ |
| LAB_MANAGEMENT_DASHBOARD | ✅ | ✅ | ✅ | ❌ (aligned with existing `canViewDashboard`) |
| LAB_AI_ASSIST | ✅ | ✅ | ✅ | ✅ (advisory only; human decides) |

**Hard rules (enforced server-side, per entity):**

1. A tester can never review/approve their own test (`tested_by == actor` → 403).
2. An editor can never approve their own document version (`author_id == actor` → 403).
3. `Reviewed By` / `Approved By` / `Tested By` (Tested = actor of create/submit) are **system-derived from the session** — never accepted from request bodies, hidden fields, or query params.
4. Final Result (PASS/FAIL/HOLD) is entered/confirmed by authorized humans only (§ AI boundaries).
5. Terminal states (`APPROVED`, `VOID`, `SUPERSEDED`, `ARCHIVED`) are immutable; corrections require retest / new version / void — never silent mutation.

---

## 7. Entities & Relationships

Naming: all laboratory tables use the `lab_` prefix. `users(id)` references reuse the existing users table. All tables carry `created_at TEXT NOT NULL DEFAULT (datetime('now'))` and, where mutable, `updated_at`; actor columns reference `users(id)` with `ON DELETE RESTRICT`.

### 7.1 Entity catalog

| Entity (table) | Purpose | Key columns / relationships |
|---|---|---|
| `lab_products` | Product Master | `id`, `name`, `code` (unique), `description`, `connector_type`, `default_test_type` CHECK(`air`,`vacuum`), `default_template_id → lab_test_templates(id)`, `applicable_sop_id/applicable_wi_id → lab_documents(id)` (nullable), `related_equipment_json` or link table (see 7.3-R1), `is_active`, `notes`, audit columns |
| `lab_equipment` | Equipment registry (24 supplied records) | `id`, `name`, `code` (unique), `location`, `status_raw` (**verbatim business value**; display mapping only — Open Decision D-1), `serial_number TEXT`, `notes`, `is_archived`, audit columns |
| `lab_equipment_maintenance` | Maintenance history | `id`, `equipment_id → lab_equipment(id)`, `maintenance_date`, `issue`, `maintenance_type`, `description`, `technician_vendor`, `status`, `completed_date`, `notes` |
| `lab_equipment_calibration` | Calibration records | `id`, `equipment_id → lab_equipment(id)`, `last_calibrated_at`, `calibration_due_at`, `provider`, `certificate_reference`, `result`, `next_due_at`, `notes`; **UI state (Compliant/Due Soon/Due Today/Overdue/Not Compliant/Unknown) is derived at read time** from dates — not a stored enum |
| `lab_test_templates` | Test template identity (AIR/VACUUM) | `id`, `name`, `code`, `test_type` CHECK(`air`,`vacuum`), `current_version_id → lab_test_template_versions(id)` (nullable), `status` (DRAFT/ACTIVE/ARCHIVED per-version), audit columns |
| `lab_test_template_versions` | Versioned template content | `id`, `template_id → lab_test_templates(id)`, `version INTEGER` (unique per template), `default_sample_count`, `parameters_json` (standard parameter / acceptance criteria / holding-time **reference display values**), `connector_choices_json`, `applicable_product_id`, `applicable_equipment_id`, `sop_id`, `wi_id`, `created_by`, `approved_by`, timestamps; approved versions immutable |
| `lab_test_records` | The test record (AIR/VACUUM) | `id`, `test_number TEXT UNIQUE` (e.g. `LAB-TEST-00081`), `test_type` CHECK(`air`,`vacuum`), `product_id → lab_products(id)`, `equipment_id → lab_equipment(id)` (**canonical relationship; never equipment name**), `lot_number`, `sampling_area`, `medium_used`, `connector_type`, `sample_count INTEGER` (drives row grid), connector assembly fields (`actual_pressure`, `torque_in_lb`, `time_sec`, `angle` — TEXT/REAL as business defines; **no invented units/formulas**), `temperature_measured`, `remarks`, `final_result` CHECK(`PASS`,`FAIL`,`HOLD`, NULL until decided), `status` CHECK(`DRAFT`,`SUBMITTED`,`UNDER_REVIEW`,`REJECTED`,`APPROVED`,`VOID`), template/SOP/WI refs (`template_version_id → lab_test_template_versions(id)`, `sop_version_id`, `wi_version_id → lab_document_versions(id)`), authorization (`tested_by`, `reviewed_by`, `approved_by → users(id)` nullable, timestamps `submitted_at/reviewed_at/approved_at`), `rejected_reason`, `void_reason`, snapshot JSON columns (§7.2), audit columns |
| `lab_test_samples` | Sample rows of a test | `id`, `test_id → lab_test_records(id)`, `sample_no INTEGER`, `sample_identifier TEXT` (e.g. `LAB-TEST-00081-S03`), `part_name`, `set_pressure`, `actual_pressure`, `volume_sec`, `pressure_difference`, `holding_time_sec`, `leakage_rate`, `result` CHECK(`PASS`,`FAIL`,`HOLD`); UNIQUE(`test_id`,`sample_no`); rows created only from `sample_count` (bounded, no arbitrary growth) |
| `lab_test_retests` | Controlled retesting | `id`, `retest_number TEXT` (`LAB-RETEST-00081-01`), `original_test_id → lab_test_records(id)` (RESTRICT — original never deleted by cascade), `new_test_id → lab_test_records(id)` (the retest execution record, nullable until performed), `reason` CHECK(`FAIL`,`HOLD`,`SAMPLE_ISSUE`,`EQUIPMENT_ISSUE`,`PROCEDURAL_ISSUE`,`OTHER`) + `reason_note`, `status`, `created_by`, timestamps |
| `lab_documents` | SOP/WI identity | `id`, `code` (unique), `title`, `type` CHECK(`SOP`,`WI`), `description`, `product_id`, `owner_id/reviewer_id/approver_id → users(id)`, `current_version_id → lab_document_versions(id)`, `status` (of current version), `effective_date`, `review_due_date`, audit columns |
| `lab_document_versions` | Immutable versions | `id`, `document_id → lab_documents(id)`, `version INTEGER`, `content_md TEXT` (source of truth), `content_html_sanitized TEXT` (rendered cache, sanitized server-side), `change_summary`, `author_id`, `reviewed_by/reviewed_at`, `approved_by/approved_at`, `status` CHECK(`DRAFT`,`IN_REVIEW`,`APPROVED`,`SUPERSEDED`,`ARCHIVED`), `created_at`; UNIQUE(`document_id`,`version`); approved ⇒ immutable |
| `lab_document_links` | Typed links documents ↔ equipment/products | `id`, `document_id`, `entity_type` CHECK(`EQUIPMENT`,`PRODUCT`,`TEMPLATE`), `entity_id`, `created_by` |
| `lab_document_acknowledgements` | Version-specific acknowledgement | `id`, `document_version_id → lab_document_versions(id)`, `user_id → users(id)`, `assigned_at`, `acknowledged_at`, `status` CHECK(`PENDING`,`ACKNOWLEDGED`); UNIQUE(`document_version_id`,`user_id`) |
| `lab_test_equipment_snapshots` (or JSON columns on `lab_test_records`) | Historical equipment snapshot at approval | name/code/serial/location/calibration state + calibration reference + captured_at; **written once at approval, never updated** |
| `lab_test_document_snapshots` | Historical SOP/WI reference | document code/type/version/title at approval |
| `lab_saved_views` | User-scoped saved filters | Reuse the existing `saved_filters` pattern/user scoping (structure, param allowlist, owner-only delete) — see Open Decision D-3 for extend-vs-new |
| NCR/CAPA linkage | Lab test → existing quality entities | `qc_findings.task_id` is task-scoped; lab linkage via **existing** Finding/CAPA entities using an additive reference (e.g. nullable `lab_test_id` column added in a later migration, or an existing link mechanism) — **never a parallel CAPA system** (Open Decision D-7 fixes the exact mechanism during PROMPT 20) |

### 7.2 Historical traceability (binding)

At approval time the system persists, inside the same transaction, JSON snapshots on/for the test record:

1. **Product snapshot** — name, code, connector type, relevant reference data.
2. **Equipment snapshot** — name, code, serial, status, calibration state + reference.
3. **Document snapshot** — SOP and WI code/type/version/title (version-resolved at test time; never re-resolved dynamically afterwards).
4. **Template snapshot** — template id + version + reference configuration.
5. **Parameter snapshot** — standard parameter / acceptance criteria / holding-time reference values as displayed at test time.

References remain by stable IDs (`equipment_id`, `sop_version_id`, …) **plus** snapshots, so lists stay joinable while history stays correct even after master data changes. `Test A` keeps showing `SOP-QC-001 v3` after `v4` is approved.

### 7.3 Relationship rules

- R1: Relationships are FK-by-id. Using names as keys is forbidden. If multi-valued (product ↔ equipment), prefer a link table over JSON-only storage.
- R2: `lab_test_records.equipment_id → lab_equipment.id` (RESTRICT on equipment delete while referenced; archiving — `is_archived` — is the retirement path, not deletion).
- R3: Retests never overwrite originals; the original test is `RESTRICT`-protected and its row remains the immutable record (Workflow C).
- R4: `ON DELETE CASCADE` only for true children (samples with their test, versions with their document). Master-data and audit references use RESTRICT/SET NULL deliberately — final choice per FK documented in the migration.
- R5: Nullable columns are allowed **only** for genuinely unavailable legacy/business data (e.g. missing serial numbers in the supplied 24-equipment dataset). Missing ≠ fabricated.

---

## 8. Database Migration Order

Four new sequential migrations, each additive, checksummed, FK-checked, and registered in `db.ts` (`?raw` import + `REQUIRED_TABLES`/`REQUIRED_INDEXES`) and mirrored in `src/lib/types.ts`. `db/schema.sql` reference snapshot is updated in the same change.

| Migration | Contents | Notes |
|---|---|---|
| `011_lab_core_master_data.sql` | `lab_products`, `lab_equipment`, `lab_equipment_maintenance`, `lab_equipment_calibration`, `lab_test_templates`, `lab_test_template_versions`, indexes; **`qc_audit_log` CHECK extension** (see below) | Master data first — tests depend on it |
| `012_lab_tests.sql` | `lab_test_records`, `lab_test_samples`, `lab_test_retests`, snapshot tables/columns, indexes (`status`, `test_type`, `product_id`, `equipment_id`, `tested_by`, `created_at`, `final_result`) | FKs reference 011 tables |
| `013_lab_documents.sql` | `lab_documents`, `lab_document_versions`, `lab_document_links`, `lab_document_acknowledgements`, indexes (review_due_date, status, code) | Version/immutability constraints here |
| `014_lab_views.sql` | Saved-view storage (extend `saved_filters` or new `lab_saved_views` per D-3) + any search-supporting indexes discovered during implementation | Kept last; depends on all entities |

**`qc_audit_log` extension (documented decision):** the existing CHECK constraints (`entity_type`, `action`) cannot hold laboratory events, and old migrations must never be edited. Migration 011 therefore rebuilds `qc_audit_log` via the guarded pattern — create new table with extended CHECKs (`entity_type` adds `LAB_TEST`, `LAB_PRODUCT`, `LAB_EQUIPMENT`, `LAB_EQUIPMENT_MAINTENANCE`, `LAB_EQUIPMENT_CALIBRATION`, `LAB_TEMPLATE`, `LAB_DOCUMENT`, `LAB_DOCUMENT_VERSION`, `LAB_RETEST`; `action` adds `SUBMIT`, `REQUEST_CHANGES`, `VOID`, `SUPERSEDE`, `ACKNOWLEDGE`, `LINK`, `UNLINK`, `VERSION`), `INSERT … SELECT` all existing rows verbatim, drop old, rename — carrying the `-- brightai:allow-destructive` marker so the engine performs the automatic pre-migration `VACUUM INTO` backup. Data preservation must be proven by `test-migrations` (existing-count == migrated-count). If implementation proves this riskier than assessed, the fallback is a `lab`-namespaced table with identical shape and service API — decided and documented during PROMPT 02, not silently.

**Seed data:** the 24 supplied equipment records are inserted as **idempotent reference data** (`INSERT OR IGNORE` / guarded seed function following `seed.ts` conventions), values verbatim (including mixed-status strings — stored raw, filtered via display mapping only). No fabricated serials, dates, or statuses.

---

## 9. Workflow States

All state machines live as typed policy modules under `src/lib/lab/` following the existing `findings`/`capa` pattern: exported status unions + `canTransitionX(from, to)` + required-reason predicates. Transition enforcement is server-side, transactional, race-safe (conditional `UPDATE … WHERE status = ?`), and every transition writes audit + notifications.

### 9.1 Lab test lifecycle

```
DRAFT → SUBMITTED → UNDER_REVIEW ─┬→ REJECTED → (back to) DRAFT
                                  └→ APPROVED → VOID (controlled, reason required)

Entry rules:
- DRAFT: created by LAB_TEST_CREATE; savable/editable per §6.2; not a quality record.
- SUBMITTED: requires complete test (all sections, sample rows, final result entered);
  stamps tested_by from session + submitted_at; notifies reviewers.
- UNDER_REVIEW: LAB_TEST_REVIEW (not own test); stamps reviewer + started_at.
- REJECTED: reason required; returns editing control to tester (REJECTED→DRAFT edit path).
- APPROVED: LAB_TEST_APPROVE (not own test); stamps approved_by/approved_at/final_result;
  freezes values + writes all §7.2 snapshots in the same transaction; read-only afterwards.
- VOID: LAB_TEST_VOID (admin/manager) with reason + audit event; read-only afterwards.
```

### 9.2 Document lifecycle

```
DRAFT → IN_REVIEW → APPROVED → SUPERSEDED
                     └→ ARCHIVED
- Editing an APPROVED document creates a NEW DRAFT VERSION; the approved version is immutable.
- Approving version N auto-SUPERSEDES version N-1 (with audit event) if not already.
- SUPERSEDED/ARCHIVED versions remain readable for historical reference.
```

### 9.3 Template lifecycle & versioning

```
DRAFT → ACTIVE → ARCHIVED (per version; template code stable, version increments)
- A test created on v2 stores template_version_id = v2 forever (§7.2).
- Only ACTIVE versions can be selected for new tests.
```

### 9.4 Calibration & maintenance

- Calibration records are historical entries; the register's UI state is **derived** (Compliant/Due Soon ≤30d/Due Today/Overdue/Not Compliant/Unknown) — mirroring how overdue tasks are derived, never stored as a second source of truth.
- Maintenance events are append-only history (no fabricated events).
- Equipment status changes (e.g. under maintenance) do not auto-block test creation unless an approved company policy exists (reference §38) — display warning only, by default.

### 9.5 Retest workflow

`Retest created (reason required) → retest performed (new test record referencing original) → review → approval`. Original immutable; numbering `LAB-RETEST-<orig>-<seq>`.

---

## 10. Audit Events

One audit system: the extended `qc_audit_log` (§8), written inside the same transaction as the mutation, actor always from session. Lab event vocabulary (entity-aware `action` values):

| Entity | Events |
|---|---|
| LAB_TEST | create, update (draft), submit, start-review, request-changes, reject, approve, void |
| LAB_RETEST | create, link, status |
| LAB_PRODUCT | create, update, archive, restore |
| LAB_TEMPLATE | create, update, version, approve, archive |
| LAB_EQUIPMENT | create, update, archive, restore, maintenance, calibration |
| LAB_DOCUMENT / LAB_DOCUMENT_VERSION | create, update, submit, request-changes, approve, supersede, archive, acknowledge, version |
| Relationships | link, unlink |

User-facing audit timeline renders actor/action/timestamp/previous→new value/reason (pattern of `taskDetails.ts` activity categories). The existing SHA-256 chain on `task_activity_log` remains task-scoped and untouched; lab audit integrity relies on the same append-only transactional discipline. Report generation continues through `src/lib/reporting/audit.ts`.

---

## 11. Notifications

All lab notifications go through `createNotification` (central inactive-user guard). New `NotificationKind` values (proposal — final names fixed at PROMPT 26):

```
lab_test_submitted | lab_test_review_requested | lab_test_rejected |
lab_test_changes_requested | lab_test_approved | lab_test_voided |
lab_document_submitted | lab_document_changes_requested | lab_document_approved |
lab_document_review_due | lab_acknowledgement_required |
lab_calibration_due | lab_calibration_overdue | lab_maintenance_event | lab_retest_update
```

**Binding implementation rule** (from project mind): every new kind MUST be added to ALL of: `NotificationKind` union, `PERSISTED_SEVERITY`, and the `KIND_ICON`/`KIND_LABEL`/`SECTIONS` registries in `notifications.astro`. Review-scheduling notifications (30/15/7/0/overdue) reuse the same persisted mechanism — no scheduler cron is introduced; delivery follows the existing request-triggered evaluation pattern documented for SLA escalation.

---

## 12. Dashboard Dependencies

- The **global** `/dashboard` gains a Laboratory section — no existing KPI/chart/table is removed or renamed.
- Implementation: extend `src/lib/dashboard.ts` with lab query functions (same parameterized WHERE-builder discipline, no `SELECT *`, no N+1) + extend `DashboardCharts.tsx` (pure SVG pattern) for: tests over time (day/week/month), AIR vs VACUUM, PASS/FAIL/HOLD distribution, equipment status mix, calibration compliant/attention, document review status. Drill-downs link to filtered `/lab/*` lists.
- `/lab` (command center) has its own lab-scoped KPI set per the page reference §7 — it is NOT the global dashboard and must not rebuild its infrastructure.
- KPIs: testing (total/AIR/VACUUM/DRAFT/Submitted/Under Review/Approved/Rejected/Void + PASS/FAIL/HOLD), equipment (Active/New/Maintenance/Unused/Calibration attention/compliant), documents (by type/status + review due + acknowledgements pending), retests (total/open/completed/by reason), data quality (open issues).

---

## 13. Reports & Export Dependencies

- The 15 lab reports (Test Register, AIR Register, VACUUM Register, PASS/FAIL/HOLD, Retest, Product Test History, Equipment Register, Calibration, Maintenance, SOP Register, WI Register, Review Due, Acknowledgement, Activity, Data Quality) are added as new `ReportType` entries in `src/lib/reporting/catalog.ts` and rendered by the existing `api/reports/[reportType].[format].ts` endpoint with `writers/{csv,pdf,xlsx}` — no new export pipeline.
- Every lab export respects: filters, date ranges, RBAC scope (`authorizeReport`/`resolveReportScope` extended for lab scopes), safe CSV escaping (`csvField`), bounded/streaming queries, no secrets/sessions/tokens, no attachment BLOBs.
- `/lab/tests` register export reuses the export action pattern of `api/export/*`.

---

## 14. Service / Module Layout

```
src/lib/lab/
├── policy.ts          # lab status unions, canTransitionLabTest/Document/Template,
│                      # required-reason predicates, bounded limits (max samples, etc.)
├── permissions        # → lives in src/lib/permissions.ts (LAB_* entries only)
├── products.ts        # Product Master CRUD + archive + history
├── equipment.ts       # equipment + maintenance + calibration + derived calibration state
├── templates.ts       # template + version lifecycle (approve ⇒ immutable version)
├── tests.ts           # create/update draft (sample grid), submit, snapshots
├── testWorkflow.ts    # review/reject/approve/void/retest transitions (transactional)
├── retests.ts         # retest creation + numbering + linkage
├── documents.ts       # SOP/WI + versions + sanitization + acknowledgement
├── search.ts          # lab search (taskSearch.ts patterns; server-side, indexed)
├── views.ts           # saved views (user-scoped; extend saved_filters pattern per D-3)
├── dataQuality.ts     # read-only issue detectors
├── calendar.ts        # derived event queries (no separate calendar table unless proven)
└── audit.ts           # thin wrapper writing qc_audit_log lab events (single audit system)
```

Validation schemas (`labTestInputSchema`, `labProductInputSchema`, `labDocumentInputSchema`, …) live in `src/lib/validation.ts` per the single-location convention. Types mirror in `src/lib/types.ts`. Zod boundaries reject unknown keys (mass-assignment guard) and never accept authorization fields.

---

## 15. Security Contract

1. **Server-side authorization only** — middleware guard + per-page check + per-API `requireApiUser` re-check; hidden fields/query params/client JS are never authority (verified by tests attempting bypass).
2. **CSRF** — `requireCsrf` on every mutating endpoint; form-POST pages short-circuited in middleware where Astro requires it (existing `/login`, `/*/new` pattern).
3. **IDOR** — every `[id]` access checks entity-level permission; lab tests readable by all LAB_VIEW roles, editable only per §6.2 ownership rules.
4. **Mass assignment** — Zod strict schemas; `tested_by/reviewed_by/approved_by` derived from session; `status`/`final_result` changed only through dedicated transition endpoints.
5. **XSS / document content** — SOP/WI Markdown/HTML is untrusted: server-side sanitization (allowlist: headings, paragraphs, lists, tables, warnings, notes, checklists, safe links), URL validation, length limits; CSP already denies inline scripts — keep it that way (no `unsafe-inline`/`unsafe-eval`).
6. **SQLi** — prepared statements only.
7. **Immutability** — approved/void/superseded records reject mutations at service layer AND conditional-update layer; no endpoint performs blanket "update any field".
8. **Self-approval prevention** — §6.2 hard rules 1–2, enforced in `testWorkflow.ts`/`documents.ts`, tested.
9. **Uploads** — if test/document attachments are added later, reuse the existing evidence validation pipeline (extension/MIME/magic-bytes/size/filename sanitization); no new upload path invented.
10. **Print** — print route is server-rendered, session-guarded, no navigation chrome, exact stored values only.

---

## 16. AI Boundaries

Reuse `src/lib/ai/` (Groq server-only, structured Zod output, redaction, `ai_audit_log`, advisory labels). Allowed lab features: summarize test, compare versions, identify missing data, suggest review questions, summarize equipment history, summarize historical trends. **Forbidden:** auto PASS/FAIL/HOLD, auto-approval, any DB mutation, changing measurements/calibration, inventing criteria. Every AI surface displays `AI GENERATED — HUMAN REVIEW REQUIRED`. New features register through the existing `api/ai/[feature].ts` contract and rate limits.

---

## 17. Testing Contract

- **Unit/integration** (Node scripts, chained into `pnpm test`, DB-backed where needed via `QC_DATABASE_PATH` temp DB — `test-db-rules.mjs` pattern): policy transitions, permissions matrix (incl. self-approval & bypass attempts), validation schemas, snapshot creation at approval, sample grid bounds, migration up-grade path (existing DB + fresh DB), audit rows for every event type, notification kinds, dashboard/report queries, export escaping.
- **E2E** (new `e2e-lab-*.mjs` suites added to `e2e:acceptance` orchestrator): AIR workflow, VACUUM incl. reject→edit→resubmit, review/approve, retest immutability, equipment+calibration, SOP versioning + acknowledgement, print correctness, IDOR/CSRF/authorization bypass, responsive 360/768/1024/1440 with zero horizontal overflow on sample/equipment/document tables.
- **Guards stay green:** `architecture-guard.mjs`, `verify-security-hygiene.mjs`, `verify-badge-contrast.mjs`.
- Nothing is "verified" unless the actual command passed and is reported.

---

## 18. Open Decisions (MUST NOT be invented — resolve with the business, document each)

| ID | Decision | Default until resolved |
|---|---|---|
| D-1 | Equipment status dictionary (supplied data has mixed/multilingual values) | Store verbatim; filter via documented display mapping only; no data edits |
| D-2 | Connector `Angle` unit semantics / numeric-vs-text | Text, no invented unit semantics |
| D-3 | Saved views: extend `saved_filters` vs new `lab_saved_views` | Follow PROMPT 24 discovery; user-scoped either way |
| D-4 | Supervisor test-approval rights | Denied by default (matrix §6.2) |
| D-5 | Who may create retests (employee?) | supervisor+ by default |
| D-6 | Auto-block tests on overdue-calibration equipment | Display warning only — no block without approved policy |
| D-7 | Exact mechanism linking lab tests → existing Finding/CAPA | Additive nullable reference during PROMPT 20; never a parallel CAPA system |

Any field ambiguity on the paper form (printed vs handwritten) resolves per page reference §77: inspect the spec, do not invent fields.

---

## 19. Verification Commands (contract-level)

```bash
pnpm --filter @brightai/qc-task-manager typecheck        # 0 errors expected (13 known hints)
pnpm --filter @brightai/qc-task-manager test             # all chains incl. new lab suites
pnpm --filter @brightai/qc-task-manager build            # only when code lands
node apps/qc-task-manager/scripts/architecture-guard.mjs # canonical ownership intact
node apps/qc-task-manager/scripts/verify-security-hygiene.mjs
pnpm --filter @brightai/qc-task-manager e2e:acceptance   # only when pages exist
```

This document itself is docs-only; the commands above apply to the implementation prompts that follow.

---

## 20. Change Log

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-08-14 | Initial contract (PROMPT 01 deliverable restored) |
| 1.1 | 2026-08-14 | Re-grounded against the repository (independent exploration + direct checks); corrected `NotificationKind` count 16 → 15; noted `src/lib/lab/` exists empty as PROMPT 02 starting point. No binding content (routes, permissions, entities, migrations, state machines, open decisions) changed. |

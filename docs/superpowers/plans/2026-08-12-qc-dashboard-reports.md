# QC Dashboard and Reports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the existing QC dashboard into an English-only section-first workspace with preserved KPIs, server-authorized drill-down, scalable reports, and auditable report generation.

**Architecture:** Keep Astro SSR as the page/API boundary and SQLite as the source of truth. Extract one typed filter/scope contract shared by dashboard queries, task drill-down, and report writers; use parameterized aggregate queries and keyset-paginated/chunked readers. Add report permission/scope and append-only report audit storage behind server-side API guards.

**Tech Stack:** Astro 6 SSR, TypeScript, better-sqlite3, SQLite migrations, React islands only where existing dashboard interactions require them, ExcelJS streaming workbook, existing PDF writer, Vitest-style project scripts/Node assertions.

---

### Task 1: Establish the report data model and migration

**Files:**
- Create: `apps/qc-task-manager/db/migrations/007_dashboard_reports.sql`
- Modify: `apps/qc-task-manager/db/schema.sql`
- Modify: `apps/qc-task-manager/src/lib/migrations.ts`
- Modify: `apps/qc-task-manager/src/lib/db.ts` only if schema validation lists are hardcoded
- Test: `apps/qc-task-manager/scripts/test-dashboard-reports.mjs`

- [ ] **Step 1: Write failing migration assertions**

Add tests that initialize a fresh database and assert a `report_audit_log` table contains `report_id`, `report_type`, `generated_by`, `filters_json`, `generated_at`, `format`, `data_scope_json`, `status`, `row_count`, and `failure_reason`; assert indexes for generated time and actor; assert a second migration run is a no-op.

- [ ] **Step 2: Run the focused test and verify the expected failure**

Run: `pnpm --filter @brightai/qc-task-manager test:dashboard-reports`

Expected: FAIL because migration 007/table and the focused script do not exist yet.

- [ ] **Step 3: Implement the additive migration**

Create an additive table with server-generated `report_id` as a unique text key, normalized JSON fields, constrained `format` (`csv`, `xlsx`, `pdf`), constrained `status` (`started`, `completed`, `failed`), and foreign key `generated_by` to `users` with `ON DELETE RESTRICT`. Add indexes on `(generated_by, generated_at)` and `(report_type, generated_at)`.

Mirror the table in `schema.sql` and register the migration through the existing sequential migration runner. Do not rewrite existing tables or delete data.

- [ ] **Step 4: Run the focused migration test**

Run: `pnpm --filter @brightai/qc-task-manager test:dashboard-reports`

Expected: migration and idempotency assertions PASS.

### Task 2: Build the shared typed filters, scope, and query layer

**Files:**
- Create: `apps/qc-task-manager/src/lib/reporting/types.ts`
- Create: `apps/qc-task-manager/src/lib/reporting/filters.ts`
- Create: `apps/qc-task-manager/src/lib/reporting/scope.ts`
- Create: `apps/qc-task-manager/src/lib/reporting/queries.ts`
- Modify: `apps/qc-task-manager/src/lib/dashboard.ts`
- Modify: `apps/qc-task-manager/src/lib/permissions.ts`
- Test: `apps/qc-task-manager/scripts/test-dashboard-reports.mjs`

- [ ] **Step 1: Write failing filter and scope tests**

Cover `date`, `department`, `employee`, `supervisor`, `priority`, `risk`, `finding_classification`, and `sla_status`; assert normalized values; assert invalid IDs/enums/dates are rejected; assert employee scope is `(assigned_to = actor OR created_by = actor)` and never broadens from a client-provided employee id.

- [ ] **Step 2: Run the focused test and verify it fails for missing exports**

Run: `pnpm --filter @brightai/qc-task-manager test:dashboard-reports`

Expected: FAIL on missing reporting filter/scope modules.

- [ ] **Step 3: Implement the shared contract**

Define `ReportFilters`, `ReportType`, `ReportFormat`, `ResolvedDataScope`, and `ReportCursor`. Parse query/form input with the existing validation conventions. Build SQL fragments from fixed server-owned clause fragments and bind every value through `?` parameters. Add centralized helpers for `admin/manager=organization`, `supervisor=department/team`, and `employee=own tasks only`.

Keep old `DashboardFilters` behavior compatible by adapting it into the new filter model rather than removing existing query parameters.

- [ ] **Step 4: Add grouped query functions**

Implement aggregate functions for all nine KPI outputs plus section summaries. Implement bounded drill-down readers with `limit` and keyset cursor. Use joins to `users`, `qc_findings`, `qc_capa`, and evidence tables only when the selected KPI/report requires them. Do not call `.all()` without a limit for drill-down or report readers.

- [ ] **Step 5: Run focused tests and query-plan checks**

Run: `pnpm --filter @brightai/qc-task-manager test:dashboard-reports`

Expected: filter, scope, KPI, and bounded-reader tests PASS. Add an `EXPLAIN QUERY PLAN` assertion for the final production-shaped filters; only then add a composite migration index if SQLite reports a relevant scan.

### Task 3: Add KPI drill-down routes and English section-first dashboard

**Files:**
- Modify: `apps/qc-task-manager/src/pages/dashboard.astro`
- Modify: `apps/qc-task-manager/src/components/DashboardCharts.tsx` if labels/links are rendered there
- Create: `apps/qc-task-manager/src/pages/dashboard/drilldown.astro` or use the existing task list route after confirming its filter contract
- Modify: `apps/qc-task-manager/src/pages/manager/index.astro` and/or shared task list components only where the current dashboard destination requires it
- Test: `apps/qc-task-manager/scripts/test-dashboard-reports.mjs`
- Test: `apps/qc-task-manager/scripts/e2e-dashboard.mjs`

- [ ] **Step 1: Write failing drill-down contract tests**

Assert each KPI produces an accessible link, preserves all active filters, adds the correct KPI predicate, and the destination returns only the expected task/finding/CAPA rows. Include `SLA Breached 8 → 8 tasks` as a fixture assertion.

- [ ] **Step 2: Run the focused test and verify the expected failure**

Run: `pnpm --filter @brightai/qc-task-manager test:dashboard-reports`

Expected: FAIL because current KPI cards are not all link-backed and the new filter dimensions are absent.

- [ ] **Step 3: Implement the section-first dashboard**

Keep every existing KPI card and add the requested labels in English. Put the KPI strip first, then accessible section navigation for `Operations`, `SLA`, `Findings`, `CAPA`, `Workforce`, `Evidence`, and `Audit`. Add the eight filter controls with explicit labels and server-side GET submission. Make each card an `<a>` with visible focus state, filter-preserving query construction, and a descriptive accessible name.

- [ ] **Step 4: Implement bounded destination rendering**

Use the existing authorized task/list patterns where possible. Render a paginated list with a stable cursor and links to task/finding/CAPA details. Do not expose organization-wide rows to an employee even if a drill-down URL is edited manually.

- [ ] **Step 5: Run dashboard regression and responsive checks**

Run: `pnpm --filter @brightai/qc-task-manager test:dashboard-reports`

Then run the existing dashboard E2E script and inspect the rendered page at 360px and 1440px. Expected: existing dashboard scenarios remain green, English labels are present, no horizontal overflow is introduced, and all KPI links are keyboard-focusable.

### Task 4: Implement report readers and streamed CSV/XLSX/PDF writers

**Files:**
- Create: `apps/qc-task-manager/src/lib/reporting/catalog.ts`
- Create: `apps/qc-task-manager/src/lib/reporting/reader.ts`
- Create: `apps/qc-task-manager/src/lib/reporting/writers/csv.ts`
- Create: `apps/qc-task-manager/src/lib/reporting/writers/xlsx.ts`
- Create: `apps/qc-task-manager/src/lib/reporting/writers/pdf.ts`
- Create: `apps/qc-task-manager/src/pages/api/reports/[reportType].[format].ts`
- Modify: `apps/qc-task-manager/package.json` only if a package script is needed
- Test: `apps/qc-task-manager/scripts/test-dashboard-reports.mjs`

- [ ] **Step 1: Write failing writer tests**

Test every catalog key (`monthly-qc`, `sla`, `findings`, `capa`, `employee-performance`, `audit-trail`, `evidence-compliance`, `overdue`) in CSV/XLSX/PDF; test headers/metadata, empty results, quote/newline escaping, and a 1,001-row fixture proving the reader is consumed in chunks rather than returned as one dataset.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `pnpm --filter @brightai/qc-task-manager test:dashboard-reports`

Expected: FAIL because the report catalog, readers, and writers are not present.

- [ ] **Step 3: Implement the catalog and chunked readers**

Define fixed report metadata and column definitions. Build SQL per catalog entry from fixed templates. Expose an async/synchronous chunk iterator with a default chunk size of 500 and keyset pagination. Keep only the current chunk in memory.

- [ ] **Step 4: Implement the writers**

CSV writes UTF-8 BOM, headers, and rows incrementally. XLSX uses ExcelJS streaming workbook mode and commits rows as they are written. PDF uses the existing PDF primitives or a new paginated writer that emits pages from the current chunk only. All formats include `Report ID`, generated timestamp, filters, and data scope in metadata/header content.

- [ ] **Step 5: Verify focused report tests**

Run: `pnpm --filter @brightai/qc-task-manager test:dashboard-reports`

Expected: all report-format, empty-result, chunking, and writer-failure unit tests PASS.

### Task 5: Add RBAC, report audit, and report UI

**Files:**
- Create: `apps/qc-task-manager/src/lib/reporting/authorization.ts`
- Create: `apps/qc-task-manager/src/lib/reporting/audit.ts`
- Create: `apps/qc-task-manager/src/pages/reports.astro`
- Create: `apps/qc-task-manager/src/pages/api/reports/index.ts`
- Create: `apps/qc-task-manager/src/pages/api/reports/audit.ts`
- Modify: `apps/qc-task-manager/src/lib/permissions.ts`
- Modify: `apps/qc-task-manager/src/pages/dashboard.astro`
- Test: `apps/qc-task-manager/scripts/test-dashboard-reports.mjs`
- Test: `apps/qc-task-manager/scripts/e2e-dashboard.mjs`

- [ ] **Step 1: Write failing RBAC/audit tests**

Assert admin/manager can request organization scope; supervisor is forced to department/team scope; employee receives `403` for comprehensive scope and can only request an allowed own-task report. Assert audit rows contain every required field and failed generation updates status without returning a successful file.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `pnpm --filter @brightai/qc-task-manager test:dashboard-reports`

Expected: FAIL because report authorization and audit functions/routes are not present.

- [ ] **Step 3: Implement server-side authorization and audit boundary**

Resolve the actor from `Astro.locals.user` only. Validate report type, format, filters, and resolved scope before creating a `started` audit row. Generate with the server-resolved scope; update to `completed` with row count or `failed` with a safe reason. Never store secrets or passwords in filters/data scope.

- [ ] **Step 4: Implement the English report UI**

Add report type/format selectors, all shared filters, visible effective-scope summary, authorization-aware controls, generation status, and a report audit table. Do not rely on hidden UI controls as authorization. Link the Reports section from the dashboard.

- [ ] **Step 5: Run focused RBAC and audit tests**

Run: `pnpm --filter @brightai/qc-task-manager test:dashboard-reports`

Expected: role/scope/audit assertions PASS.

### Task 6: Full verification and documentation handoff

**Files:**
- Modify: `apps/qc-task-manager/docs/ARCHITECTURE.md`
- Modify: `apps/qc-task-manager/docs/ROLES-AND-PERMISSIONS.md`
- Modify: `apps/qc-task-manager/docs/TESTING.md`
- Modify: `.agents/brain.md`

- [ ] **Step 1: Run focused tests and static checks**

Run:

```bash
pnpm --filter @brightai/qc-task-manager test:dashboard-reports
pnpm --filter @brightai/qc-task-manager typecheck
node apps/qc-task-manager/scripts/verify-security-hygiene.mjs
git -c core.fsmonitor=false diff --check
```

- [ ] **Step 2: Run the full QC test suite**

Run: `pnpm --filter @brightai/qc-task-manager test`

Expected: existing migration, architecture, domain, SLA, workflow, QC operations, templates, and DB-rule suites plus the new report suite pass.

- [ ] **Step 3: Build and run acceptance checks**

Run:

```bash
NODE_ENV=production pnpm --filter @brightai/qc-task-manager build
pnpm --filter @brightai/qc-task-manager e2e:acceptance
```

Record exact counts and any environmental limitation; do not call unrun browser/load tests verified.

- [ ] **Step 4: Update docs and brain evidence**

Document report endpoints, scope rules, chunk size, audit fields, index evidence, and English UI. Add one ledger row to `.agents/brain.md` with changed files, exact verification results, remaining limitations, and no commit/push claim.

- [ ] **Step 5: Final requirement checklist**

Confirm every original KPI remains, all seven sections exist, all eight filters work, every KPI is clickable, all eight reports support CSV/XLSX/PDF, employees cannot generate comprehensive reports, large datasets are chunked, and report audit records contain `Report ID`, `Generated By`, `Filters`, `Timestamp`, `Format`, and `Data Scope`.

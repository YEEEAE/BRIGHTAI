# QC Lab Management UX 012 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Reorder `/lab` around role-specific action queues and implement a Manager/Admin-only `/lab/management` dashboard backed by real filtered Laboratory registers.

**Architecture:** Keep `/lab` role summaries in the existing read-only `overview.ts` authority, add a focused read-only `management.ts` query module for the new page, and keep RBAC in `permissions.ts` with navigation derived from it. Extend change-request filtering in its domain module so every dashboard link is truthful; do not add tables, migrations, analytics libraries, or a second workflow engine.

**Tech Stack:** Astro 6 SSR, TypeScript, better-sqlite3 prepared SELECT queries, Tailwind CSS, existing PageHeader/AppButton/Banner/StatusPill/LabSecondaryNav primitives, Node test scripts, Playwright E2E.

---

## Task 1: Add failing query and RBAC coverage

**Files:**
- Create: `apps/qc-task-manager/scripts/test-lab-management.mjs`
- Modify: `apps/qc-task-manager/scripts/test.mjs`
- Modify: `apps/qc-task-manager/scripts/test-manifest.mjs`
- Modify: `apps/qc-task-manager/package.json`

- [x] **Step 1: Write the RED query fixtures and assertions**

Create a temporary SQLite database using the same loader/seed helpers as `test-lab-overview.mjs`. Insert more owned tests than the existing recent-list limit, pending/rejected/over-24-hour change requests, calibration rows, equipment maintenance, document states, retests, and data-quality gaps. Assert exact counts from the wished-for exports:

```js
const summary = management.getLabRoleActionSummary({ role: 'employee', userId: employeeId });
assert.equal(summary.employee.myTests, 7);
assert.equal(summary.employee.draftTests, 2);
assert.equal(summary.employee.returnedForChanges, 1);

const dashboard = management.getLabManagementDashboard();
assert.equal(dashboard.attention.waitingOver24h, 1);
assert.equal(dashboard.attention.rejectedChanges, 1);
assert.equal(dashboard.risk.overdueCalibration, 1);
assert.equal(dashboard.quality.openRetests, 2);
```

Also assert empty databases return zero-valued groups and source text contains only read-only `SELECT` queries. Add permission assertions:

```js
assert.equal(canViewLabManagementDashboard('admin'), true);
assert.equal(canViewLabManagementDashboard('manager'), true);
assert.equal(canViewLabManagementDashboard('supervisor'), false);
assert.equal(canViewLabManagementDashboard('employee'), false);
```

- [x] **Step 2: Add RED filtering assertions for change requests**

Exercise a parsed filter API and the list function before implementation:

```js
assert.equal(listAllChangeRequests({ status: 'PENDING' }).every((row) => row.status === 'PENDING'), true);
assert.equal(listAllChangeRequests({ status: 'REJECTED' }).every((row) => row.status === 'REJECTED'), true);
assert.equal(listAllChangeRequests({ status: 'PENDING', aging: '24h' }).length, 1);
```

- [x] **Step 3: Run the focused test and confirm the expected RED failure**

Run from `apps/qc-task-manager`:

```bash
pnpm test:lab-management
```

Expected: FAIL because the new query module/exports and filtered list signature do not exist yet. Fix only test setup errors before continuing; do not add production code in this step.

- [x] **Step 4: Register the new focused suite**

Add `test:lab-management` to the package script map and canonical test manifest after the RED run is confirmed, preserving manifest ordering near `test:lab-overview` and `test:lab-change-requests`.

## Task 2: Implement exact role-action summaries

**Files:**
- Modify: `apps/qc-task-manager/src/lib/lab/overview.ts`
- Test: `apps/qc-task-manager/scripts/test-lab-management.mjs`

- [x] **Step 1: Add typed summary contracts and parameterized SELECTs**

Implement `getLabRoleActionSummary(scope)` with prepared statements and the existing local-date/scope conventions. Employee counts must use `(tested_by = ? OR created_by = ?)` and owner-scoped WI/change-request queries. Supervisor and management counts must use existing workflow state semantics, not bounded presentation arrays.

- [x] **Step 2: Run the focused suite and make it GREEN**

```bash
pnpm test:lab-management
```

Expected: the role summary and empty-database assertions pass while management dashboard assertions remain RED.

- [x] **Step 3: Refactor only after GREEN**

Reuse existing SQL constants such as `LATEST_DUE_SQL`, existing data-quality helpers, and shared date functions. Keep the overview prepared-statement count within the existing UX performance guard limit.

## Task 3: Implement real change-request filters

**Files:**
- Modify: `apps/qc-task-manager/src/lib/lab/changeRequests.ts`
- Modify: `apps/qc-task-manager/src/pages/lab/change-requests/index.astro`
- Test: `apps/qc-task-manager/scripts/test-lab-management.mjs`
- Test: `apps/qc-task-manager/scripts/test-lab-change-requests.mjs`

- [x] **Step 1: Add a typed filter parser and parameterized WHERE clauses**

Support only `status=PENDING|APPROVED|REJECTED` and `aging=24h`; `aging=24h` must add `status = 'PENDING' AND created_at < datetime('now', '-1 day')`. Unknown values become unfiltered rather than interpolated into SQL. Preserve contributor ownership scoping.

- [x] **Step 2: Run focused filters and verify GREEN**

```bash
pnpm test:lab-management
pnpm test:lab-change-requests
```

Expected: status and aging results match fixtures, and existing authorization/ownership tests remain green.

- [x] **Step 3: Wire Astro URL parameters to the domain filter**

Parse `Astro.url.searchParams` once in the page and pass the typed filter to `listAllChangeRequests` or `listUserChangeRequests`. Render the active-filter state and reset link without changing existing table/card markup semantics.

## Task 4: Enforce Manager/Admin RBAC and expose the implemented route

**Files:**
- Modify: `apps/qc-task-manager/src/lib/permissions.ts`
- Modify: `apps/qc-task-manager/src/lib/lab/navigation.ts`
- Modify: `apps/qc-task-manager/scripts/test.mjs`
- Modify: `apps/qc-task-manager/scripts/e2e-lab-nav.mjs`
- Test: `apps/qc-task-manager/scripts/test-lab-management.mjs`

- [x] **Step 1: Change the canonical permission and route manifest**

Make the permission exact. Keep the route out of `IMPLEMENTED_LAB_ROUTES` until Task 5 creates the page:

```ts
export function canViewLabManagementDashboard(role: Role): boolean {
  return role === 'manager' || role === 'admin';
}
```

Do not add role checks in `LabSecondaryNav` or page markup.

- [x] **Step 2: Update RED permission/navigation assertions**

Assert Manager/Admin inclusion and Supervisor/Employee exclusion in the unit and navigation tests. Keep the existing query-string elevation checks and add a direct `/lab/management?role=admin` employee denial case.

- [x] **Step 3: Run RBAC tests before adding page markup**

```bash
pnpm test:lab-management
pnpm test:domain
```

Expected: permission tests pass; navigation/page-route assertions remain RED until the page exists.

## Task 5: Build the Manager/Admin management dashboard

**Files:**
- Create: `apps/qc-task-manager/src/lib/lab/management.ts`
- Create: `apps/qc-task-manager/src/pages/lab/management.astro`
- Test: `apps/qc-task-manager/scripts/test-lab-management.mjs`

- [x] **Step 1: Implement read-only management data**

Export typed `LabManagementDashboard` data with four groups: attention, operational risk, quality outcomes, and assurance. Use existing helpers for calibration state, data-quality checks, WI catalog, audit activity, and real test/retest/document counts. Use existing date conventions for FAIL/HOLD trend buckets. Never write to the database or manufacture zero/series rows.

- [x] **Step 2: Render the page with a self-guard and failure banner**

Before any dashboard query, redirect unauthorized users to `/lab`. Wrap reads in the existing page error pattern and show `Banner` while preserving breadcrumbs and navigation. Render sections for Approval Queue, Change Requests, Waiting >24h, Rejected contributor changes, Calibration risk, Equipment attention, Document health, WI completion, FAIL/HOLD trends, Retests, Data Quality, and Audit/System Health.

- [x] **Step 3: Add truthful card destinations**

Use only routes and filters covered by the domain modules: `/lab/tests/review?status=UNDER_REVIEW`, change-request status/aging filters, calibration status/due filters, document review/content filters, test result filters, open retests, data-quality, audit, and admin system health for admins. Split composite values into separate cards where one register cannot represent the exact count.

- [x] **Step 4: Run the focused suite and make it GREEN**

```bash
pnpm test:lab-management
pnpm test:route-manifest
pnpm test:architecture
```

Expected: all query, route, and source-authority checks pass.

- [x] **Step 5: Mark the page as implemented**

Add `/lab/management` to `IMPLEMENTED_LAB_ROUTES` now that `src/pages/lab/management.astro` exists; `labNavForRole` will expose it only through the permission predicate.

## Task 6: Reorder and tighten `/lab` role home

**Files:**
- Modify: `apps/qc-task-manager/src/pages/lab/index.astro`
- Modify: `apps/qc-task-manager/scripts/e2e-lab-nav.mjs`
- Modify: `apps/qc-task-manager/scripts/test-lab-ux-presentation.mjs`

- [x] **Step 1: Replace bounded headline values with exact summary fields**

Keep the existing KPI cards and detailed sections, but use the new role summary for priority cards. Match the approved labels exactly, keep Quick New Test employee-only, and place secondary KPI content after the priority section.

- [x] **Step 2: Add management navigation visibility assertions**

Extend the live navigation matrix: Manager/Admin see the Management Dashboard link and page; Supervisor/Employee do not see the link and are redirected when requesting the URL. Preserve all existing Laboratory route/dead-link and query-elevation checks.

- [x] **Step 3: Run presentation and navigation suites**

```bash
pnpm test:lab-ux-presentation
pnpm test:lab-ux-performance
node scripts/e2e-lab-nav.mjs
```

Expected: role labels, KPI ordering, real links, bounded query count, and no unauthorized exposure pass.

## Task 7: Responsive and accessibility regression coverage

**Files:**
- Modify: `apps/qc-task-manager/scripts/e2e-lab-nav.mjs`
- Modify: `apps/qc-task-manager/scripts/e2e-a11y.mjs` only if the new page must be added to the existing pilot list
- Modify: `apps/qc-task-manager/scripts/test-ui-consistency.mjs`

- [x] **Step 1: Add responsive assertions**

For Manager and Admin, visit `/lab/management` at 390px, 768px, and 1440px. Assert no `document.documentElement.scrollWidth > window.innerWidth`, exactly one visible H1, one active secondary-nav item, and meaningful link text on every management card.

- [x] **Step 2: Add source guards for route/filter truthfulness**

Assert the management page contains no hard-coded business counts, every card href uses an allowed implemented path, and the management module contains no mutation SQL. Add the route to the a11y pilot only if the existing gate’s scan list is designed for this page.

- [x] **Step 3: Run focused UI checks**

```bash
pnpm test:ui-consistency
pnpm test:badge-contrast
```

Expected: no heading, color, focus, route, or raw-status regressions.

## Task 8: Full verification and handoff

**Files:**
- Modify: `/Users/yzydalshmry/Desktop/BRIGHTAI/.agents/mind/01-mind-latest.md`

- [x] **Step 1: Run affected suites**

```bash
pnpm test:lab-management
pnpm test:lab-overview
pnpm test:lab-change-requests
pnpm test:lab-ux-presentation
pnpm test:lab-ux-performance
pnpm test:route-manifest
pnpm test:architecture
```

- [x] **Step 2: Run the complete required checks**

```bash
pnpm typecheck
pnpm test
pnpm e2e:acceptance
NODE_ENV=production pnpm build
git diff --check
```

Record exit codes and actual pass/fail counts. Do not claim E2E or build success from earlier runs.

- [x] **Step 3: Review the diff for scope and safety**

Confirm no schema/migration, dependency, CSP, workflow, `.env*`, commit, push, or deploy changes were introduced. Confirm all pre-existing dirty files remain intact.

- [x] **Step 4: Update the live mind ledger**

Add a structured dated entry at the top of `.agents/mind/01-mind-latest.md` listing implementation, affected files, verification results, final status, and any remaining blockers. Do not modify archived mind files.

- [x] **Step 5: Hand off without commit**

Report the local result in Saudi Arabic, link the changed files, include exact verification counts, state any blockers honestly, and leave commit/push/deploy to the user.

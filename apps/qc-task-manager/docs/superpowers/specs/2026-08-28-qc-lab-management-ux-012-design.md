# QC Lab Management UX 012 Design

**Task:** `QC-LAB-MANAGEMENT-UX-012`

**Date:** 2026-08-28

**Status:** Approved conversational design; written specification awaiting final review

## Goal

Make `/lab` an action-first, role-specific command center without removing useful operational KPIs, and implement the architecture's reserved `/lab/management` route as a real Manager/Admin-only management dashboard backed entirely by existing QC Laboratory data.

## Constraints

- Keep the application UI in English.
- Keep all existing useful laboratory KPIs, but move secondary metrics below role-priority work.
- Use server-rendered Astro and existing design-system components.
- Do not add an analytics or charting dependency.
- Do not seed, synthesize, estimate, or hard-code business data.
- Every actionable card must link to an implemented register with a filter that the target page actually applies.
- Keep `src/lib/permissions.ts` as the only RBAC authority.
- Do not change laboratory workflow semantics, schemas, migrations, CSP, or audit rules.
- Do not commit, push, or deploy.

## Current-State Findings

- `/lab` already has an initial role-priority section, but some values use bounded result arrays such as recent-test rows rather than exact totals.
- The command center currently places many broad KPIs and operational sections around the role-priority content. The useful metrics must remain but become secondary to work requiring action.
- `src/lib/lab/navigation.ts` already declares `/lab/management`, and `src/lib/permissions.ts` already declares `canViewLabManagementDashboard`.
- `/lab/management` is intentionally absent from `IMPLEMENTED_LAB_ROUTES`; tests currently assert that it is unavailable.
- The existing permission is Supervisor+, while this task requires Manager/Admin only.
- `overview.ts` already emits change-request drill-downs such as `?status=PENDING` and `?aging=24h`, but the change-request register does not parse or apply those filters. Those links are currently not genuinely filtered.
- `src/lib/lab/dashboard.ts` supports the global `/dashboard` laboratory section. It provides useful aggregate and trend semantics but is not an action queue and should not become the management-page query authority.

## Architecture

### 1. Role action summary

Add a typed, read-only role-action summary query in `src/lib/lab/overview.ts`. It will return exact counts instead of deriving headline numbers from bounded lists. Employee-scoped queries must use the authenticated user ID; supervisor and management counts must use existing role permissions and workflow states.

The summary will contain only counts needed by `/lab`:

- Employee: own total tests, own draft tests, own returned tests, own WI content, and own change requests.
- Supervisor: actionable test reviews, documents in review, team data-quality issues, open retests, and operational alerts.
- Manager/Admin: tests requiring action, pending master-data changes, overdue calibration, documents requiring action, and data-quality issues.

`getLabKpis`, detailed lists, WI catalog counts, and current operational sections remain available. The page will render the role summary first, then secondary KPI and register sections.

### 2. Management dashboard query boundary

Create `src/lib/lab/management.ts` as the single read-only query boundary for `/lab/management`. It will compose exact database counts and existing trusted helpers without mutating state.

The returned model will have four groups:

1. **Needs attention**
   - Approval queue
   - Pending change requests
   - Pending changes waiting more than 24 hours
   - Rejected contributor changes

2. **Operational risk**
   - Overdue and due-soon calibration
   - Equipment under maintenance or otherwise requiring attention
   - Documents in review, overdue for review, and pending acknowledgements
   - WI content completion

3. **Quality outcomes**
   - FAIL and HOLD counts/trends from real test records
   - Open and completed retests
   - Open data-quality issue count

4. **Assurance**
   - Recent laboratory audit activity and audit-chain status
   - Admin-only link to `/admin/system-health`; managers receive the laboratory audit link only

Trend periods will use existing project date conventions and database timestamps. Empty databases render zero values and empty states, never invented series.

### 3. RBAC and navigation

Change `canViewLabManagementDashboard` to return true only for `manager` and `admin`.

Add `/lab/management` to `IMPLEMENTED_LAB_ROUTES` only after the page exists. `labNavForRole` will then expose the link only to Manager/Admin because it already delegates authorization to the canonical permission function.

The page will self-guard before executing management queries. Middleware behavior and direct navigation will also be tested so Supervisor/Employee cannot retrieve the dashboard by URL or forged query parameters.

### 4. Real filtered registers

Extend the existing change-request register to parse these supported filters:

- `status=PENDING`
- `status=REJECTED`
- `aging=24h`, applying only to pending requests older than 24 hours

Filtering belongs in `src/lib/lab/changeRequests.ts`, not in the Astro template. Manager/Admin continue to see all matching requests; contributors continue to see only their own matching requests.

Management cards will use these real destinations:

- Approval queue → `/lab/tests/review?status=UNDER_REVIEW`
- Pending change requests → `/lab/change-requests?status=PENDING`
- Waiting over 24 hours → `/lab/change-requests?status=PENDING&aging=24h`
- Rejected changes → `/lab/change-requests?status=REJECTED`
- Overdue calibration → `/lab/calibration?status=OVERDUE`
- Equipment attention → existing equipment status/calibration filters
- Document health → existing `status`, `review`, and acknowledgement registers
- WI completion → `/lab/documents?type=WI` plus supported content filters
- FAIL/HOLD → `/lab/tests?result=FAIL` and `/lab/tests?result=HOLD`
- Retests → `/lab/retests?status=OPEN`
- Data quality → `/lab/data-quality`
- Audit → `/lab/audit`

If an exact composite cannot be represented by one existing filter, the UI will split it into individually truthful subcards instead of linking a combined number to an imprecise register.

## Page Design

### `/lab`

Order:

1. Breadcrumbs and `PageHeader`
2. Primary action: Quick New Test for employees; existing allowed actions remain available
3. `LabSecondaryNav`
4. Role-priority section
5. Secondary KPI grid
6. WI catalog and existing operational registers/activity sections

Role labels:

- Employee: `My Tests`, `Draft Tests`, `Returned for Changes`, `My WI Content`, `My Change Requests`, `Quick New Test`
- Supervisor: `Tests Awaiting Review`, `Documents Awaiting Review`, `Team Issues`, `Open Retests`, `Operational Alerts`
- Manager/Admin: heading `Needs Your Attention`, with `Tests Requiring Action`, `Pending Master-Data Changes`, `Overdue Calibration`, `Documents Requiring Action`, and `Data-Quality Issues`

### `/lab/management`

Use `PageHeader`, `LabSecondaryNav`, semantic sections, responsive card grids, text-visible status indicators, and existing color tokens. No client-side island is required for the primary content. Any simple trend presentation will use semantic HTML/CSS or an existing project component; no new chart dependency will be introduced.

The layout must not horizontally overflow at 390px, 768px, or 1440px. Cards remain keyboard-focusable, expose meaningful link text, and do not rely on color alone.

## Failure and Empty States

- Query failures render a `Banner` and preserve navigation.
- Each major section has a zero/empty state that explains that no matching records exist.
- No permission failure reveals management counts.
- No page catches an authorization error and renders partial privileged data.

## Testing Strategy

Use strict red-green-refactor TDD.

### Query tests

- Exact employee ownership counts, including more rows than bounded recent lists.
- Supervisor review/document/team issue/retest/alert counts.
- Manager/Admin attention and management-dashboard counts.
- Waiting-over-24-hours boundary behavior.
- Rejected and pending change-request filtering.
- Calibration, documents, equipment, WI completion, FAIL/HOLD, retest, and data-quality counts.
- Empty database returns zeros without throwing or creating data.
- Read-only source guard prevents mutation statements in overview/management queries.

### RBAC and navigation tests

- Manager/Admin permission true; Supervisor/Employee false.
- Manager/Admin secondary navigation includes `/lab/management`.
- Supervisor/Employee navigation excludes it.
- Direct page access is denied for Supervisor/Employee.
- Query-string or forged role values cannot elevate access.

### UI and responsive tests

- Required role-specific labels and truthful links appear.
- Existing useful KPI cards still render below priority work.
- Every management card points to an implemented, supported filter.
- One visible H1, valid heading order, focus-visible actions, no unnamed controls.
- No horizontal overflow at 390px, 768px, and 1440px.

### Verification

- Run affected query/RBAC/navigation/UI suites first.
- Run `pnpm typecheck`.
- Run the complete `pnpm test` chain.
- Run the complete `pnpm e2e:acceptance` chain.
- Run `NODE_ENV=production pnpm build`.
- Run `git diff --check`.

## Out of Scope

- New schema or migration.
- New workflow state or approval engine.
- New analytics/charting library.
- Changing global `/dashboard` behavior except where a shared, tested helper can be reused without altering output.
- Production deployment or production-data verification.
- Commit or push.

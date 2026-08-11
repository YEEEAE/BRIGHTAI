# QC Dashboard and Reporting Design

**Status:** Proposed for implementation after user review  
**Language:** English-only UI, labels, report headers, validation messages, and audit display

## Goal

Upgrade the existing QC Task Manager dashboard without removing its current KPIs or existing dashboard behavior. Add a section-first workspace, complete filter coverage, clickable KPI drill-down, scalable report generation in CSV/XLSX/PDF, report RBAC, and report-generation audit records.

## Product design

The selected visual direction is **Section-first workspace**:

1. A persistent KPI strip remains at the top of `/dashboard`.
2. The seven operational sections are navigable tabs or anchored sections:
   `Operations`, `SLA`, `Findings`, `CAPA`, `Workforce`, `Evidence`, and `Audit`.
3. All UI text is English.
4. The existing KPI cards remain present. New KPI cards are additive; no existing KPI is deleted or silently renamed.
5. Every KPI card is an accessible link. The link preserves the active filters and adds the KPI predicate. Example: `SLA Breached 8` links to `/tasks?dashboard=1&sla_status=breached...` and returns exactly the eight visible tasks in the same server-authorized scope.
6. Filters are shared across the dashboard and reports:
   `Date`, `Department`, `Employee`, `Supervisor`, `Priority`, `Risk`, `Finding Classification`, and `SLA Status`.
7. Filter parsing is server-side, typed, parameterized, and rejects invalid enum/id/date values without interpolating user input into SQL.

## KPI contract

The dashboard exposes these KPI labels and drill-down predicates:

| KPI | Predicate / calculation | Drill-down |
|---|---|---|
| Total Tasks | Count of scoped tasks | All scoped tasks |
| Completion Rate | Completed tasks / eligible scoped tasks | Completed tasks |
| SLA Compliance | Non-breached SLA tasks / SLA-scoped tasks | SLA-compliant tasks |
| Overdue | Due date in the past and task not terminal | Overdue tasks |
| On Hold | `status = on_hold` | On-hold tasks |
| Critical Findings | Findings with critical severity/classification and non-closed status | Matching finding/task records |
| Open CAPA | CAPA status not `CLOSED` | Matching CAPA/finding/task records |
| Evidence Compliance | Tasks meeting required evidence / eligible tasks | Non-compliant tasks when clicked, with a visible mode for compliant tasks |
| Average Resolution | Average completed duration for scoped completed tasks | Completed task set used for the metric |

The current KPI set, including current SLA metrics already provided by `dashboard.ts`, remains available. Existing `Overdue`, `Critical`, `Breached`, `Average Resolution`, and any existing dashboard cards are mapped into this contract instead of being removed.

## Data architecture and performance

Create a single typed query model for dashboard/report filters and one server-side scope builder. Dashboard widgets use grouped aggregate queries rather than loading all task rows. A KPI request should use one aggregate query where possible; section charts/tables use bounded aggregate/list queries with explicit limits.

Drill-down task lists use keyset pagination (`id < ?` or `created_at/id` cursor) and never load an unbounded dataset. Report writers consume a row iterator or fixed-size chunks (default 500 rows), writing each chunk to the output stream. XLSX uses ExcelJS streaming workbook support; CSV writes rows directly; PDF uses a bounded tabular renderer or a paginated writer without materializing the full dataset.

Add an index only after an `EXPLAIN QUERY PLAN` check demonstrates a scan on a production-shaped query. Candidate indexes are composite indexes matching the final filter predicates, such as task date/status/department and findings severity/status, but they must not be added speculatively.

## Report catalog

The report selector includes:

- Monthly QC
- SLA
- Findings
- CAPA
- Employee Performance
- Audit Trail
- Evidence Compliance
- Overdue

Each report supports CSV, XLSX, and PDF. The report definition controls selected columns, joins, date semantics, row scope, and a stable report key. The UI shows the effective data scope before generation.

## RBAC and scope

Authorization is server-side and centralized in `permissions.ts` plus a report permission/scope helper:

- `admin`: may generate all reports with organization-wide scope.
- `manager`: may generate all reports with organization-wide scope.
- `supervisor`: may generate reports only for their department/team scope.
- `employee`: may generate only non-comprehensive reports for tasks assigned to or created by that employee, if the report type is allowed; the server rejects organization-wide or cross-employee scope.

The UI may hide unsupported options, but every report API re-checks the authenticated session, report type, requested filters, and resolved scope. A client-provided employee, department, or scope value is never trusted.

## Report audit

Every accepted report-generation request writes one audit row before the writer starts, with:

- `report_id`
- `report_type`
- `generated_by` (server-resolved user id)
- `filters` (validated normalized JSON, no secrets)
- `timestamp`
- `format`
- `data_scope` (resolved role/scope summary)
- status and row count when complete, or failure reason when generation fails

The audit trail is append-only from the report path and is visible in the Audit section only to roles allowed to view that scope. Report downloads do not expose another employee's data through a guessed report id.

## Error and large-data behavior

- Invalid filters return an English validation message and no query execution for the invalid field.
- Unauthorized report generation returns `403` without revealing counts or rows.
- Empty reports return a valid file with headers and an explicit empty-state message where the format supports it.
- Long-running generation uses a bounded server-side job/stream contract; it does not hold a full dataset in memory.
- A report writer failure marks the audit row failed and does not return a partial file as a successful report.

## Testing acceptance criteria

1. Existing dashboard KPI tests continue to pass.
2. New tests prove every KPI link preserves filters and resolves the expected predicate.
3. Filter tests cover all eight filter dimensions, invalid values, and scope enforcement.
4. Query tests verify grouped aggregates and bounded drill-down results; `EXPLAIN QUERY PLAN` evidence is recorded before adding any index.
5. Report tests cover every report type in CSV/XLSX/PDF, empty results, escaping, chunking, and writer failure audit behavior.
6. RBAC tests prove admin/manager organization scope, supervisor team scope, and employee rejection of comprehensive reports.
7. Audit tests assert the required fields and normalized filter/data-scope values.
8. Typecheck, QC tests, production build, security hygiene, and a responsive browser check at 360px and 1440px are run before handoff.

## Out of scope

- Removing or replacing the existing task model.
- Adding a new database engine or external reporting service.
- Making employees able to view other employees' data.
- Changing existing task/Finding/CAPA lifecycle rules.
- Adding secrets or modifying deployment workflows.

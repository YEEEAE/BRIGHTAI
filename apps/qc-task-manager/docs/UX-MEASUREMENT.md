# UX Measurement & Privacy Contract

## Purpose

This contract measures operational clarity in QC Task Manager without turning
the product into a tracking system. UX events are separate from
`task_activity_log`, `qc_audit_log`, `ai_audit_log`, and request observability.
They never authorize a mutation, change RBAC, or replace domain truth.

## Baseline-first scorecard

Capture a baseline for at least 14 days before judging a UI change. Report
sample size, role mix, date range, and missing data with every comparison.

| Surface | Metric | Definition | Event evidence | Initial target |
|---|---|---|---|---|
| Lab | Completion rate | successful submit attempts / submit attempts | `lab_form_submit_*` | baseline first |
| Lab | Completion duration | p50/p90 from form focus to submit attempt | `lab_form_submit_attempt.duration_ms` | baseline first |
| Lab | Error rate | error events / submit attempts | `lab_form_submit_error` | baseline first |
| Dashboard | First meaningful action | time from dashboard view to first action link | `dashboard_first_action.duration_ms` | baseline first |
| Dashboard | Urgent-item discovery | urgent/action card interaction rate | `dashboard_urgent_discovery` | baseline first |
| Dashboard | Drilldown usage | action links that open a register | `dashboard_drilldown` | baseline first |
| Search | Zero-result rate | filtered searches with zero results / filtered searches | `search_zero_results` | baseline first |
| Search | Reformulation | a second search after a zero-result search | `search_reformulation` | baseline first |
| Search | Successful interaction | result link opened after a search | `search_result_open` | baseline first |
| Review | Time to decision | decision attempt duration | `review_decision_attempt.duration_ms` | baseline first |
| Review | Rework rate | request-changes/reject decisions / decisions | `review_rework` | baseline first |

## Event contract

Only the allowlisted names in `src/lib/uxTelemetry.ts` are accepted. Stored
fields are: event name, pathname, actor role, coarse outcome, bounded duration,
ephemeral flow id, allowlisted metadata, and timestamp. No IP address, session
token, task/test/finding identifiers, search text, form values, filenames,
comments, passwords, AI prompts, or secrets are recorded.

Retention is 90 days and cleanup runs at database initialization. Access should
be limited to product/QC operations owners; exports are not part of this
workstream. If a metric can be answered from existing aggregate operational
data, prefer that source over adding an event.

## Impact reporting

Every design readout uses: baseline → intervention → current result → sample and
role mix → caveats/confounders → operational implication → next decision. A
change is not called an improvement from anecdote alone.

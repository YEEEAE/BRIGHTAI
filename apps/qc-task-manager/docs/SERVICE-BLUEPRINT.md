# QC Task Manager — Cross-workflow service blueprint

Status: implementation contract · 2026-08-28

This blueprint maps the current delivery system and the target handoff context
for the four connected QC journeys. It is scoped to continuation between
records; it does not replace domain policies, RBAC, audit, or notifications.

## Shared handoff contract

Every record detail page should answer: where is it now, who owns it, which role
acts next, what blocks progress, which existing records continue the work, and
what is the next allowed action. The context is a small summary; the full audit
timeline remains the source for history and is not duplicated.

## Current → target blueprint

| Journey / step | User action | Visible UI response | Server/domain behavior | Database/audit effect | Notification | Next responsible role | Failure/recovery |
|---|---|---|---|---|---|---|---|
| Test: create → submit | Enter samples and send for review | Draft, saved state, completion blockers, then `Submitted` | Completeness and ownership policy validates the test | Test row and audit event are transactional | Review queue notification | Supervisor / reviewer | Keep draft; show missing section or retry without losing input |
| Test: review → finding/retest | Inspect result and evidence | Stage, result, linked Finding/Retest, next action | Review/approve policy controls transitions | Workflow and link audit events | Tester or responsible reviewer | Tester for changes; supervisor+ for decision | Return for changes; original test remains traceable |
| Finding → RCA → CAPA → evidence | Investigate and record corrective action | Finding stage, CAPA owner, closure gates, links | Existing Finding/CAPA/evidence rules remain authoritative | `qc_audit_log` records each mutation | Existing notification rules | CAPA owner / verifier | Missing gate names exact item; reopen keeps history |
| Equipment → calibration → maintenance | Check readiness before use | Calibration state, maintenance count, related tests/documents | Calibration is derived; maintenance is append-only | Equipment/calibration/maintenance audit rows | Existing lab notifications | Maintainer / manager | Warning links to calibration or maintenance; no invented block |
| Document: draft → review → approved | Edit, submit, review, approve | Version, owner/reviewer/approver, change summary | Version immutability and no-self-review rules apply | Version and workflow audit events | Existing document notifications | Reviewer, then manager/admin | Request changes returns author to draft; approved version stays immutable |

## State-machine handoff vocabulary

- Test: `DRAFT → SUBMITTED → UNDER_REVIEW → REJECTED → DRAFT` or
  `UNDER_REVIEW → APPROVED → VOID`.
- Finding/CAPA: existing policy machines remain unchanged; the UI names the
  current gate and points to the related CAPA/evidence record.
- Equipment: calibration is derived (`Compliant`, `Due Soon`, `Due Today`,
  `Overdue`, `Not Compliant`, `Unknown`); maintenance is append-only.
- Document: `DRAFT → IN_REVIEW → APPROVED → SUPERSEDED`, with `ARCHIVED` as a
  terminal readable state.

Impossible transitions stay impossible: presentation code never changes a
status, grants access, creates an audit event, or infers a missing record.

## Target implementation

Detail pages use the SSR `WorkflowContext` panel with minimum continuation
context: stage, owner, next role, blocker, next allowed link, and related
records. It is populated from already-authorized loaders and existing links;
empty relationships are omitted rather than represented by guessed links.

## Validation notes

This blueprint is based on the current source and architecture contracts.
Human tree testing, VoiceOver, and role-based UAT are still required.

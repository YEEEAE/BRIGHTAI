# Electronic Records, Auditability & E-Signature Integrity

**Status:** implemented locally and verified on 2026-09-04  
**Scope:** QC Task Manager records, approvals, void decisions, controlled-document versions, controlled-template versions, audit chains, and SQLite backup/restore.

## 1. Architecture decision

The system has two deliberately separate evidence surfaces:

| Surface | Store | What it proves | What it must never contain |
|---|---|---|---|
| Authentication/security attempt | `login_attempts` | A password re-verification attempt was accepted/rejected/rate-limited for a user | Password, password hash, business approval meaning |
| Business record action | `qc_audit_log` | Who changed which business record, from which state to which state, when, and why | Password or password hash |
| Approval/action snapshot/seal | `lab_test_approvals` | The actor’s approval or VOID meaning plus an immutable, hashed lab-test snapshot | Password or password hash |

`qc_audit_log` remains the single canonical business audit trail. No second audit log was introduced. The `lab_audit_log` view is only a domain-shaped read view over that same table.

The e-signature module is an authentication re-verification mechanism. It does not claim regulatory signature equivalence by itself. The business action is only durable when the subsequent approval/void service succeeds and writes its business evidence in the same transaction.

## 2. Record-integrity matrix

| Entity | Creation/ownership identity | State history and before/after | Approval or evidence snapshot | Immutability/deletion | Lineage and audit linkage |
|---|---|---|---|---|---|
| User | `created_by`, `created_at`, role, department, active state | `USER_*` events in `qc_audit_log` | N/A; authentication attempts are separate | User deletion is constrained by referenced records | User id is the actor foreign key for business events |
| Task | `created_by`, `created_at`, assignee, owner-by-relationship | `task_activity_log` stores actor, field, old/new, note, timestamp, and hash links | Completion evidence/comments are attached to the task | Completed/cancelled are read-only through the canonical state machine; approved deletion retains `task_deletion_history` and task activity evidence | Task activity chain is independently verified; deletion history preserves the deleted task identity |
| Lab test | `created_by`, `tested_by`, `reviewed_by`, `approved_by` plus timestamps | `qc_audit_log` stores `LAB_TEST` actor/action/old/new/note/time | `lab_test_approvals.action` distinguishes `APPROVAL` and `VOID`; both store signature meaning, full serialized dataset, SHA-256 hash, signer, and `signed_at`; product/template/equipment/SOP/WI snapshots are frozen at approval | `APPROVED` and `VOID` updates/deletes are blocked by runtime triggers; samples/readings are already frozen for terminal tests; action-seal rows cannot update/delete | Test references exact source versions and approval/action seal; `verifyLabTestApprovalSealing` detects drift |
| Controlled document | Stable identity in `lab_documents`: code, owner, creator, dates | `LAB_DOCUMENT` events include actor, action, old/new state, reason/note, and time | Approval evidence records the approved version number and e-signature meaning; version content remains the durable snapshot | Content/approval metadata for approved, superseded, and archived versions cannot be changed or deleted after the integrity guard is installed; only canonical status-only supersede/archive transitions are allowed; revision creates a new draft version | Test records store document-version snapshots and exact version references |
| Controlled template | Stable identity in `lab_test_templates`: code, creator, dates | `LAB_TEMPLATE` events include actor, action, old/new state, reason/note, and time | Approval evidence records the approved version and e-signature meaning; version parameters are the durable snapshot | Content/approval metadata for approved and superseded versions cannot be changed or deleted after the integrity guard is installed; only the canonical status-only supersede transition is allowed; revisions create a new version | Tests retain `template_id`, exact `template_version_id`, and approval-time parameter snapshot |
| Business audit event | Actor, entity, optional task, action, timestamp | Canonical `old_value`/`new_value` plus `note` | Hash-chain fields `previous_hash` and `event_hash` | `qc_audit_log` update/delete are blocked after the lab integrity guard is installed | `verifyQcAuditChain` and `verifyAllAuditChains` validate continuity |

## 3. E-signature behavior

`src/lib/lab/esignature.ts` now follows this decision table:

| Input/state | Result | Security evidence | Business evidence |
|---|---|---|---|
| Empty or missing password, not already locked | `invalid` | `login_attempts`, outcome `e-signature:failed`; counts toward the limit | None; caller refuses the action |
| Wrong password, not already locked | `invalid` | `login_attempts`, outcome `e-signature:failed`; counts toward the limit | None; caller refuses the action |
| Any attempt while locked, including a correct password | `rate_limited` | `login_attempts`, outcome `e-signature:rate_limited` | None; caller refuses the action |
| Correct password before lockout | `ok` | No failed-attempt row | Caller may continue to the business service |

The previous ambiguity is removed: an empty/missing password is not itself a rate-limit response. A locked actor still receives `rate_limited`, regardless of input, and the refused attempt is recorded. No password and no password hash is copied into either audit surface.

For a successful high-authority action, the business record carries:

- actor identity from the server session;
- target record and action (`APPROVAL` or `VOID`);
- signature meaning in the durable note/seal reason;
- server-side action timestamp;
- approved version or final action snapshot;
- mandatory void reason where the state machine requires it;
- before/after state in the shared business audit event.

## 4. State-machine enforcement

```text
Lab test: DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED
                                      └──────→ REJECTED
non-terminal lab test ───────────────────────→ VOID
APPROVED / VOID: terminal and immutable

Document version: DRAFT → IN_REVIEW → APPROVED → SUPERSEDED
                                             └──→ ARCHIVED
Approved revision: create a new DRAFT version; never overwrite the approved version

Template version: DRAFT → IN_REVIEW → APPROVED → SUPERSEDED
Approved revision: create a new DRAFT version; never overwrite the approved version

Task: active states → completed/cancelled
completed/cancelled: read-only; completed may leave only through the authorized reopen flow
```

Service authorization remains authoritative for self-approval, role bypass, stale-state checks, double approval, replay, and required reasons. Database guards provide a second line against direct mutation of terminal/historical rows on the active connection.

## 5. Retention, deletion, and restore

- `qc_audit_log`, approval/action seals, document/template history, and task deletion evidence are retained as business records; there is no routine business-audit purge.
- `login_attempts`, sessions, and UX telemetry use the existing bounded 90-day operational retention window. This is security telemetry retention, not approval-record retention.
- Approved/void lab tests and approval seals cannot be deleted. Approved, superseded, and archived document versions cannot be deleted. Approved and superseded template versions cannot be deleted.
- Draft or otherwise non-historical child rows may still follow their declared foreign-key cascade semantics; a cascade cannot remove a protected historical row because the row-level guard aborts it.
- Task deletion is an approved workflow. `task_deletion_history` and the task activity chain preserve the decision and lineage after task removal.
- SQLite backups are validated with integrity/FK checks and restored into a clean path. The integrity gate checks that terminal records, approval seals, triggers, and the QC audit chain survive restore.

## 6. Verification evidence

The focused proof gate is:

```bash
node --import ../../scripts/test-ts-loader.mjs --experimental-strip-types scripts/test-records-integrity-100.mjs
```

It covers 31 checks across empty/missing/wrong/rate-limited/correct credentials, failed audit-write handling, self-approval, role bypass, stale records, double approval, replay, approved/void mutation, approved/superseded document and template version mutation, historical approval metadata, terminal task mutation, both audit chains, and backup/restore integrity.

Supporting gates:

- `test-e-signature-integrity`: 8 checks, including password secrecy, exact SHA-256 sealing, tamper detection, and approval-row immutability.
- `test-lab-esignature`: 16 checks, including empty-password classification, rate-limit accounting, void evidence, and secret scans.
- `test-audit-integrity`: task/QC chain creation and tamper-detection verification.
- `test-lab-documents`: 303 checks.
- `test-lab-templates`: 51 checks.
- `test-lab-review`: 97 checks.

## 7. Known boundary

This document proves the application’s identity, state, snapshot, immutability, lineage, and hash-chain controls. It does not assert that a password re-verification alone satisfies a particular jurisdiction’s regulated electronic-signature standard. Any regulated deployment still needs an approved policy for identity proofing, signature manifestation, access control, retention schedule, and periodic review.

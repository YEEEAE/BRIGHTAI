# Human Gate — bounded local implementation, 2026-11-01

Status: **IMPLEMENTED_NOT_RUNTIME_VERIFIED**. Application source remains local and was not deployed. No tests, build, lint, typecheck, smoke requests or browser tools were run for this change, at the owner's explicit request. Earlier foundation evidence is historical and does not validate this version.

## Enforced operation

`KERNEL_WORKSPACE_RENAME` changes the existing Kernel tenant name. It does not change Auth organizations, user permissions, product availability, Firewall rules or Risk Engine classifications. Only an OWNER/ADMIN can request this operation. A reviewer at the policy level, or an active time-boxed delegate, must decide; separation of duties is enforced when the policy requires it and always for this rename. All members can still request `INTERNAL_DEMO_NOTE`; completion of that operation is explicitly a synthetic note, not an external integration. No additional product purchase is required.

The server captures `subject_ref`, the expected tenant name and `profile_version`, the new name, requester, operation type and current policy version. SHA-256 covers that fixed binding; the browser cannot supply its digest, actor, status, subject or execution payload. SQL guards prohibit changing request content and permit only explicit lifecycle transitions. The service exposes `binding_version` (`human-gate-binding-v3`) and the approved window (`approval_expires_at`) alongside each request. A malformed or legacy payload fails closed as ineligible instead of raising a list-page error. A tenant revision trigger advances `profile_version` on every name change, including changing a name away and back.

The current endpoints are:

| Route | Method | Scope |
|---|---|---|
| `/app/api/human-gate/requests/` | GET | `view=mine/review/completed`, optional `status=PENDING/APPROVED/REJECTED/EXPIRED/CANCELLED/EXECUTED`, `page=1..100`; current membership required |
| `/app/api/human-gate/requests/` | POST | `title`, `description`, `reason`, `operation_type`, `new_name` for rename, and `synthetic_confirmed=true` |
| `/app/api/human-gate/requests/[requestId]/decide/` | POST | Reviewer at the policy level or an active bounded delegate; `decision=APPROVE/REJECT` and mandatory `reason`; self-review denied when SoD applies |
| `/app/api/human-gate/requests/[requestId]/execute/` | POST | Empty JSON; original requester only; requires an unused bound permit and consumes it atomically |
| `/app/api/human-gate/requests/[requestId]/cancel/` | POST | Requester or OWNER/ADMIN before execution; mandatory `reason`; revokes any active permit |
| `/app/api/human-gate/delegations/` | GET/POST | OWNER/ADMIN manage; members see their own delegations; bounded operation, level and minutes |
| `/app/api/human-gate/delegations/[delegationId]/revoke/` | POST | Delegator or OWNER; immediate effect on future decisions |
| `/app/api/human-gate/policy/` | POST | OWNER/ADMIN; prior `version` (null initially), `pending_minutes`, `approval_minutes`, `enabled`, `review_level`, `separation_of_duties`, `delegation_enabled` |

These reuse Kernel Bearer authentication, workspace membership selection and product access. Members see their own requests plus pending tasks delegated to them; OWNER/ADMIN additionally see the tenant review inbox and completed tenant requests. A `workspace` query never grants access. The proposed `/v1` contract remains a future external API and is not implemented by these routes.

## Policy and lifecycle

No duration or enablement policy is seeded. An OWNER/ADMIN chooses the pending deadline and approval lifetime, each an integer from 1 to 1440 minutes as technical bounds, not a universal policy, license or SLA. Approval can shorten but never extend the original request deadline. Every policy save generates a new version and expires active old requests. Disabling the policy stops new work.

`PENDING → APPROVED/REJECTED/EXPIRED/CANCELLED`; `APPROVED → EXECUTED/EXPIRED/CANCELLED`; `REJECTED/EXPIRED/CANCELLED/EXECUTED` are terminal. Expiry is persisted with database time and base audit when the service accesses requests, without a scheduler or silent approval. The UI refreshes at the displayed deadline and on returning to the tab; displayed statuses are DB values. A missing or revoked role, changed policy/target or binding mismatch blocks action. Repeating execution returns an error and causes no second effect.

Approval inserts one `ACTIVE` permit bound to the tenant, requester, operation, subject, payload digest, policy version and expiry. Execution locks that permit, rechecks the operation and both principals, then moves it to `CONSUMED` exactly once in the same transaction as the Kernel effect. Cancellation or policy change revokes an unused permit; an expired, revoked or consumed permit cannot authorize the operation.

Review authority is resolved on the server from the current policy: the required level (`ADMIN` or `OWNER`), separation of duties, and any active delegation. A delegation is constrained to one operation, one tenant, a bounded duration, and a level no higher than the delegator's current role. Any delegation or role change is rechecked at decision and execution time.

Within a transaction the service locks the request, policy, relevant current memberships and Auth identities. It checks both parties again at execution, compares the target version/name and immutable payload digest, performs the name update and writes the linked base audit/timeline. Final consumption checks expiry after audit/evidence waits. Any audit failure or late expiry rolls the side effect back. Decision and timeline rows are append-only under ordinary SQL operations; a privileged database administrator can still change schema/triggers, so no absolute immutability claim is made.

Kernel base audit contains fixed actions and request identifiers, not names, descriptions or sensitive payloads. Request data stays in the protected product tables; it is not sent to Analytics, logs, AI providers or training. Ledger evidence remains optional through the existing internal writer: synthetic notes retain their classification, while the real Kernel operation links metadata-only audit evidence. No content ingestion endpoint or model provider was added.

## Applied schema and remaining setup

The owner explicitly authorized **production / `br-young-bird-b43proeb`**, project `young-frog-60183055`, database `neondb`, on 2026-11-01. Neon MCP first confirmed that Human Gate and administrative grant tables were absent and that the Auth foreign keys use UUID. The following local migration sources were then applied together in one transaction:

- `0004_aigas_human_gate.sql` — initial request and decision tables.
- `0006_aigas_kernel_administration.sql` — existing Kernel administration/access prerequisites.
- `0007_aigas_human_gate_enforcement.sql` — bound request lifecycle, policy, timeline and tenant profile revision.

`0014_aigas_human_gate_cancellation_delegation_and_grant.sql` is a **local, unapplied** migration. It adds the `CANCELLED` state, provider binding v3, `review_level`/`separation_of_duties`/`delegation_enabled`, the delegation table and the single-use permit table with SQL guards. Until it is reviewed and applied to an authorized target, the service reports a schema/setup error and fails closed rather than executing without the new guards.

The initial batch transport rejected multi-command prepared statements before schema changes; catalog reads confirmed no partial application. Sending the same migrations as individual statements in one transaction succeeded. A subsequent catalog read confirmed eleven public tables, RLS and the new ordinary-operation guards. This is schema evidence only. No test data, users, role changes, product grants, product toggles or policy values were inserted. `0002`, `0003` and `0005` remain unapplied on this branch.

`0007` preserves historical requests if used on another authorized target: completed synthetic notes remain completed, rejected requests remain rejected, and unbound old pending/approved requests expire. It does not convert an old note approval into a rename authorization. Migration files are ordered, one-time migrations; do not rerun them on an already migrated target.

Runtime role grants/RLS, approved Human Gate administrative access, operator policy, a second authorized reviewer and deployment remain separate prerequisites. This work does not enable a trial, change origin/DNS/hosting, provision commercial access or claim a verified authenticated journey. Multiple stages, escalation and external notifications remain outside this bounded implementation. Delegation is implemented locally only and remains subject to the separate `0014` approval and runtime verification.

Kernel base protection is intentionally separate: a Kernel policy effect that requires review (`REQUEST_APPROVAL`/Firewall `ESCALATE`) halts at the Kernel boundary even when Human Gate is not licensed or provisioned. Human Gate is the advanced approval add-on: bounded delegation, explicit review levels, cancellation and a single-use execution permit. The base halt must not be removed or made contingent on the product license.

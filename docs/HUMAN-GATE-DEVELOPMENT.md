# Human Gate local foundation — 2026-11-01

Status: **PARTIAL operationally**. No release, commercial trial or production migration is asserted. The full product specifications and proposed `/v1/approvals` contract remain future targets. This batch implements only a single-stage, internal synthetic note operation.

## Changed files

- `src/server/human-gate/core.mjs`, `service.mjs`, `http.mjs`
- `src/pages/app/human-gate/index.astro`
- `src/pages/app/api/human-gate/requests/index.ts`
- `src/pages/app/api/human-gate/requests/[requestId]/decide.ts`, `execute.ts`
- `src/scripts/human-gate.ts`, `src/styles/human-gate.css`
- `src/layouts/AppLayout.astro` (app navigation only)
- `migrations/0004_aigas_human_gate.sql`
- `tests/human-gate.test.mjs`, `tests/human-gate-db.test.mjs`
- `docs/products/human-gate/FEATURE-STATUS.yaml`
- This guide, `Audit/2026-11-01-human-gate-foundation.md`, `.agents/mind/01-mind-latest.md`

## Actual routes and permissions

All routes require the existing Kernel verified Bearer identity and current database membership. `workspace` is a selection from those memberships, not authorization. JSON cannot supply tenant, requester, reviewer, status or completion time. Every service operation locks the caller's membership through commit, so role revocation cannot race a write. The app uses its existing independent layout without marketing analytics.

| Route | Method | Behavior |
|---|---|---|
| `/app/api/human-gate/requests/` | GET | Tenant-scoped list including decision details; `status=PENDING/APPROVED/REJECTED`, `page=1..100`; 25 per page |
| Same | POST | All members create a pending request with `title`, `description`, `reason`, `operation_scope=INTERNAL_DEMO_NOTE` |
| `/app/api/human-gate/requests/{id}/decide/` | POST | OWNER/ADMIN, independent from requester, records `decision=APPROVE/REJECT` and nonempty `reason` |
| `/app/api/human-gate/requests/{id}/execute/` | POST | Requester only, body `{}`; completes this exact internal note only after persisted independent approval |

The request's immutable-by-API content is the synthetic note. Its `completed_at` is the durable internal publication effect; there is no external publication channel or public note feed. No endpoint edits requests or decisions. Rejected requests cannot execute; pending never becomes approved automatically. Decisions are terminal. Row locks plus one decision per request prevent conflicting concurrent decisions. Repeated execute returns the same completion without a new event. Creation retries can create another request; refresh after uncertain network errors before resubmitting.

Each mutation and its basic Kernel audit event commit atomically. Audit actions carry the request ID for correlation, with no free-text request/decision content. Full decision history (one final decision per request) resides in `aigas_hg_decisions`. No Ledger table or license is required. This is not a tamper-proof log against a database administrator.

## Setup still required

Local `.env` already supplies database and Auth settings; it was inspected by key presence only and left unchanged. No storage or Data API is needed by this batch. Never copy credentials into this guide or browser code.

## Current Neon schema and migration gate (read-only check, 2026-11-01)

Neon MCP read-only access succeeded for project `young-frog-60183055`, database `neondb`. Its only branch is `production` (`br-young-bird-b43proeb`), which is the default and is not protected. The inspected schema has the four Kernel tables (`aigas_tenants`, `aigas_memberships`, `aigas_product_access`, `aigas_audit_events`) and the managed `neon_auth.*` tables; `aigas_hg_requests` and `aigas_hg_decisions` are absent. No migration or SQL write was run. `aigas_tenants.id`, `aigas_memberships.tenant_id/user_id`, and `neon_auth.user.id` are all UUIDs, matching the corresponding Human Gate foreign-key types in `0004`.

**Migration status: BLOCKED.** Do not apply `0004` to the current branch. The owner must first approve an isolated development target/branch and its use for this schema change. The local migration plan is:

1. Confirm the approved branch contains Kernel `0001` tables and Neon Auth `neon_auth."user"`; Human Gate `0004` depends on those, not on Firewall `0002`, Ledger `0003`, or Risk Engine `0005`.
2. Review `0004` as one unit: request `requester_id` is tied to the Auth user; its composite `(tenant_id,id,requester_id)` key anchors each decision to the same request and requester; `reviewer_id` is a distinct Auth user and the CHECK forbids self-review. The service additionally verifies current OWNER/ADMIN membership in the selected tenant within the transaction that inserts the decision. The migration does not itself encode dynamic membership roles; review runtime grants/RLS and retain the server authorization check.
3. Only after approval, apply the unchanged reviewed migration through the owner's approved migration process on that isolated branch, compare the resulting schema, and run the disposable synthetic PostgreSQL journey. Do not copy the change to production as part of this task.

RLS is enabled and PUBLIC access revoked; the server membership checks are the current application authorization boundary. A limited runtime role still needs explicitly reviewed grants/policies; do not silently use a browser/Data API role or disable RLS. The local HTTP layer now returns `HUMAN_GATE_SCHEMA_MISSING` for PostgreSQL `42P01` and `HUMAN_GATE_DB_PRIVILEGE` for `42501`, without exposing driver details.

Existing Neon Auth integration is reused. Local Origin approval and a real two-user Neon journey remain unresolved from Kernel. Configure an approved test origin and provision two distinct existing users with appropriate tenant memberships through an authorized process. No roles, users, trusted origins or Auth settings were changed here.

For manual acceptance: requester creates → reload still PENDING → self-decision API returns 403 → execute returns 409 → independent OWNER/ADMIN approves → reload shows reviewer/reason/time → requester executes → reload shows completed. Repeat with REJECT and confirm no completion. Test a second tenant's denial and a concurrent pair of decisions. Never use customer data.

## Verification

- `npm run build`, `tsc --noEmit`, `git diff --check`.
- `node --test tests/kernel.test.mjs tests/firewall.test.mjs tests/ledger.test.mjs tests/human-gate.test.mjs`.
- Disposable localhost PostgreSQL 16 database only: `HUMAN_GATE_TEST_DATABASE_URL=... node --test tests/human-gate-db.test.mjs`. Test does not read `.env`; creates its own synthetic Auth schema and applies only `0001` + `0004`. Use an empty disposable database. The local database test injects identity into the actual HTTP handler and uses real service SQL/transactions; it does **not** prove Neon login.

## Deferred

Multiple approval levels, time-bound delegation, automatic expiry/escalation, SLA, official digital signatures, external notifications, general cross-system execution grants, billing/trial activation, advanced policy administration and evidence export. No claims of completing HG-01..HG-05 in full.

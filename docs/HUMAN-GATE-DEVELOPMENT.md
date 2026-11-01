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

Neon MCP authorization was unavailable. Direct SQL **READ ONLY** found the four Kernel tables and no approval/Human Gate tables. The configured target is production; no HG migration was applied there. Review `0004` against Kernel `0001`, choose an approved isolated development target, apply it through the owner's approved migration process, and review the runtime DB role. RLS is enabled and PUBLIC access revoked; inherited Kernel server membership checks remain the application authorization boundary. A limited runtime role needs explicitly reviewed grants/policies; do not silently use a browser/Data API role or disable RLS.

Existing Neon Auth integration is reused. Local Origin approval and a real two-user Neon journey remain unresolved from Kernel. Configure an approved test origin and provision two distinct existing users with appropriate tenant memberships through an authorized process. No roles, users, trusted origins or Auth settings were changed here.

For manual acceptance: requester creates → reload still PENDING → self-decision API returns 403 → execute returns 409 → independent OWNER/ADMIN approves → reload shows reviewer/reason/time → requester executes → reload shows completed. Repeat with REJECT and confirm no completion. Test a second tenant's denial and a concurrent pair of decisions. Never use customer data.

## Verification

- `npm run build`, `tsc --noEmit`, `git diff --check`.
- `node --test tests/kernel.test.mjs tests/firewall.test.mjs tests/ledger.test.mjs tests/human-gate.test.mjs`.
- Disposable localhost PostgreSQL 16 database only: `HUMAN_GATE_TEST_DATABASE_URL=... node --test tests/human-gate-db.test.mjs`. Test does not read `.env`; creates its own synthetic Auth schema and applies only `0001` + `0004`. Use an empty disposable database. The local database test injects identity into the actual HTTP handler and uses real service SQL/transactions; it does **not** prove Neon login.

## Deferred

Multiple approval levels, time-bound delegation, automatic expiry/escalation, SLA, official digital signatures, external notifications, general cross-system execution grants, billing/trial activation, advanced policy administration and evidence export. No claims of completing HG-01..HG-05 in full.

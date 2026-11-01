# Firewall Starter — local foundation

Status: **PARTIAL operationally**, 2026-11-01. Implemented laboratory source and isolated local Postgres verification; not a released AI gateway or completed FW-01…FW-08 product.

## Implemented scope

- `/app/firewall/` uses Kernel's Neon Auth session, verified server identity and persisted membership. No second login, commercial entitlement changes, trial, analytics, AI calls or storage service.
- `GET /app/api/firewall/rules/` loads tenant memberships, rules, all-time decision counts and the latest 10 decisions. Optional `action=ALLOW|BLOCK|REDACT` filters the recent list, not the counts.
- `POST /app/api/firewall/rules/` accepts only `{template: 'public'|'identifier'|'prohibited'}`. OWNER/ADMIN only. Creation persists one fixed template per tenant; duplicates return 409. MEMBER can view and evaluate.
- `PATCH /app/api/firewall/rules/` accepts `{id,enabled,version}`. OWNER/ADMIN only; stale versions and another tenant's rule return 409. Every change increments the rule version.
- `POST /app/api/firewall/evaluate/` accepts `{text}` (1–4000 characters). Returns action, fixed reason code, rule ID/version, transient output and persisted decision ID. BLOCK never returns the submitted text.
- All endpoints require the existing verified bearer JWT. `workspace` selects only a membership loaded by the server; a body `tenant_id` is rejected. Writes require same Origin and JSON, with a streamed 18000-byte body cap. Responses are private/no-store. No raw request or DB errors are logged by these handlers.
- Each operation rechecks and locks membership in its transaction. A tenant row lock serializes policy updates and evaluation. Mandatory decision insert must commit before a result is returned. Database/commit failure returns 503 without ALLOW; malformed enabled policy or no active rules produces BLOCK.

## Exact laboratory policy

| Template | Literal, case-insensitive match | Action |
|---|---|---|
| public | معلومة عامة | ALLOW |
| identifier | DEMO-ID-1234 | REDACT to `[معرّف منقّح]` |
| prohibited | DEMO-BLOCK | BLOCK |

BLOCK takes priority over REDACT, then ALLOW. With at least one valid enabled policy, unmatched text receives ALLOW / `NO_MATCH_LAB_ONLY`, explicitly **not a safety assessment**. Deactivating the prohibited template changes a new `DEMO-BLOCK` request to unmatched ALLOW if another valid policy remains. No arbitrary client regex, editable customer pattern, automatic production seed or implicit policy activation.

The dedicated decisions table contains only IDs, tenant, time, action, fixed reason and rule version. It has no input/output text or hash. Rule changes add fixed action metadata to Kernel audit. This basic log does not claim Ledger signatures or immutable evidence.

## Setup and approval still required

The existing ignored `.env` has Database/Auth configuration and was not modified. Storage and Data API are unnecessary for this scope. Neon MCP returned an authorization error; a read-only direct query confirmed the four Kernel tables and **no Firewall tables** on the configured database.

`migrations/0002_aigas_firewall.sql` is **review-only and NOT applied to Neon**. The current configured target is production; prior approval for Kernel 0001 does not approve Firewall 0002. Use an approved isolated target first; obtain explicit target approval before any production application. Do not run migrations automatically at startup. The migration adds only two tables, constraints and an index, with RLS enabled and no PUBLIC grants; no managed Auth changes.

Review the runtime DB role and grants before real operation. Server authorization is implemented; tenant RLS policies for a separate non-owner runtime role are not provisioned here. Existing Kernel real-user/local-Origin verification remains incomplete. No trusted-domain settings or auth provider configuration were changed. Until migration and valid session/membership are available, the page shows setup/access errors and never fabricates counters or decisions.

Firewall Starter is a **membership-authorized lab** and does not enable the commercial product-access row. The Kernel commercial cards remain FOUNDATION. The app navigation links to the lab explicitly by name.

## Verification

- `npm run build`, `tsc --noEmit`: PASS.
- `node --test tests/kernel.test.mjs tests/firewall.test.mjs`: 10 PASS (6 Kernel, 4 Firewall).
- `tests/firewall-db.test.mjs`: 1 integration test PASS against disposable local PostgreSQL, applying both migrations with synthetic Auth users and two synthetic tenants. Covers persistence, all three outcomes, rule-version changes, MEMBER denial, tenant isolation, latest-10/filter behavior, absence of raw text and forced mandatory-log failure.
- Integration command: `FIREWALL_TEST_DATABASE_URL=postgres://...@127.0.0.1:PORT/FRESH_DISPOSABLE_DB node --test tests/firewall-db.test.mjs`. The test requires a fresh local disposable database and refuses non-local hosts; it does not read `.env`. Without the variable it is SKIPPED.
- Chrome DevTools unauthenticated page at 360/1440px: no overflow, RTL, private controls hidden, no analytics. Built GET without identity: 401. This does not establish an authenticated browser journey.
- Real Neon sign-in → workspace → Firewall browser journey: NOT RUN; auth Origin/real-user verification and Firewall migration remain pending. No production write, commit, push or deployment.

## Deferred

Provider proxy/egress enforcement, full DLP, semantic attack detection, approval workflows, commercial licensing/trials, distributed quotas, signed Ledger evidence, production retention/operations and complete product acceptance gates. No dependency on purchasing Risk Engine, Ledger or Human Gate for this lab.

## Changed-file inventory

- `src/layouts/AppLayout.astro`
- `src/pages/app/firewall/index.astro`
- `src/pages/app/api/firewall/rules.ts`
- `src/pages/app/api/firewall/evaluate.ts`
- `src/server/firewall/core.mjs`
- `src/server/firewall/service.mjs`
- `src/server/firewall/http.mjs`
- `src/scripts/firewall.ts`
- `src/styles/firewall.css`
- `migrations/0002_aigas_firewall.sql`
- `tests/firewall.test.mjs`
- `tests/firewall-db.test.mjs`
- `docs/FIREWALL-DEVELOPMENT.md`
- `docs/products/firewall/FEATURE-STATUS.yaml`
- `.agents/mind/01-mind-latest.md`

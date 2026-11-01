# Firewall Starter — local policy and decision lab

Status: **PARTIAL operationally**, reviewed 2026-11-01. The page and APIs below exist and are exercised locally against a disposable PostgreSQL 16 instance. Nothing here is a released AI gateway, and `migrations/0002_aigas_firewall.sql` is **not applied to Neon**.

## What runs in this scope

- `/app/firewall/` reuses Kernel's Neon Auth session and the persisted membership check, with RTL layout, keyboard focus and loading/empty/error/unauthorized states. No second login, analytics, AI provider call or commercial entitlement change.
- `GET /app/api/firewall/rules/` returns memberships, rules, all-time decision counts and the latest 12 decisions. Optional `action=ALLOW|BLOCK|REDACT` and `reason=<fixed code>` filter the recent list only, never the counts.
- `POST /app/api/firewall/rules/` accepts either `{template:'public'|'identifier'|'prohibited'}` or a tenant-defined rule `{name, pattern, action, priority?}`. OWNER/ADMIN only; 25 rules per tenant.
- `PATCH /app/api/firewall/rules/` accepts `{id, version, …}` with `enabled`, or — for tenant-defined rules — `name`, `pattern`, `action`, `priority`. Every write checks the row version and increments it; a stale version returns 409 `RULE_CHANGED`. Server templates can be toggled but not redefined (409 `TEMPLATE_IMMUTABLE`).
- `POST /app/api/firewall/evaluate/` accepts `{text}` (1–4000 characters) and returns action, fixed reason code, rule ID/name/version, a transient output and the persisted decision ID. BLOCK never returns the submitted text.
- All endpoints require the verified Kernel bearer JWT; `workspace` only selects a membership loaded by the server, and a body `tenant_id` is rejected. Writes require same Origin and JSON with a streamed 18000-byte body cap. Responses are `private, no-store` and `noindex`.
- Each operation rechecks and locks membership in its transaction, and a tenant row lock serializes policy changes with evaluation. The mandatory decision insert must commit before a result is returned. Database or commit failure returns 503 and never ALLOW.

## Policy model

Rules are plain literal text matched case-insensitively by containment. They are never compiled as client-supplied regular expressions; REDACT substitutes an escaped literal. Control characters are rejected by API, service and database checks. The browser form has an explicit synthetic-data acknowledgement before it will submit an evaluation.

| Item | Behaviour |
|---|---|
| Starter templates | Server-owned: `public` → ALLOW, `identifier` → REDACT to `[معرّف منقّح]`, `prohibited` → BLOCK. Toggle only. |
| Tenant rules | Name (2–60), literal pattern (1–80), action, priority 1–999. Editable; name unique per tenant. |
| Precedence | BLOCK always wins, then REDACT, then ALLOW. Priority orders rules inside the winning action and selects the cited rule. An ALLOW rule can never override BLOCK. |
| No active rule | BLOCK `NO_ACTIVE_POLICY` |
| Malformed stored rule | BLOCK `INVALID_POLICY` |
| No literal match | ALLOW `NO_MATCH_LAB_ONLY` — explicitly not a safety assessment |

The dedicated decisions table stores only ID, tenant, time, action, fixed reason, rule ID and rule version. It has no input/output text or hash. Rule changes add fixed action metadata to the Kernel audit log. This basic log does not claim Ledger signatures or immutable evidence.

## Failure and setup codes

| Condition | Response |
|---|---|
| Missing `aigas_fw_*` tables (`42P01`) | 503 `FIREWALL_SCHEMA_MISSING` |
| Runtime role lacks table privilege (`42501`) | 503 `FIREWALL_DB_PRIVILEGE` |
| Any other database/commit failure | 503 `FIREWALL_UNAVAILABLE` |
| No workspace, or lost membership | 403 `NO_WORKSPACE` / `FORBIDDEN` |
| Stale or foreign rule ID | 409 `RULE_CHANGED` |
| Duplicate template or rule name | 409 `RULE_EXISTS` |
| Invalid literal/action/priority/name | 400 with a specific code |

These codes replace the previous generic 500 for an unprovisioned database; no raw driver text is returned or logged.

## Migration 0002 — review-only, BLOCKED on Neon

The configured target is `young-frog-60183055` / `neondb` on the default `production` branch, which is not protected. A read-only check on 2026-11-01 found only `aigas_tenants`, `aigas_memberships`, `aigas_product_access` and `aigas_audit_events` (all empty) plus `neon_auth.*`; no `aigas_fw_*` tables exist. The Neon MCP server still returns an authorization error, so the read-only check used the configured connection string without printing it.

Local review corrections in `0002`:

- `aigas_fw_rules`: `UNIQUE (tenant_id, name)`, partial `UNIQUE (tenant_id, template) WHERE template IS NOT NULL`, `priority smallint` 1–999, explicit control-character checks, and ordering index on `(tenant_id, priority, created_at)`.
- `aigas_fw_decisions`: unchanged reason/action checks and composite FK, plus `(tenant_id, action, created_at DESC)` for the filtered list.
- Both tables `REVOKE ALL … FROM PUBLIC` and enable RLS; no browser/Data API grants or public policies. Tenant scoping today is enforced in the server service, not by RLS policies for a separate runtime role.

Approval is required before any database write. Recommended sequence, not executed:

1. Owner approves a dedicated dev branch/target and a runtime role.
2. Apply `0001` if absent, then `0002` in one transaction on that branch; verify the two tables, PK/FK/CHECK/unique constraints, both indexes and `relrowsecurity`.
3. Run the disposable integration test against the branch copy, then verify 401 without a session and a synthetic two-account isolation check.
4. Review runtime-role grants and, if a non-owner role is used, add tenant RLS policies.
5. Production application needs a separate explicit approval; no startup migration or automatic seed.

No tenant, user, rule or decision was created on Neon.

## Live `/app/` 404 diagnosis (2026-11-01)

- `astro.config.mjs` uses `output: 'server'` with `@astrojs/node` standalone. All `/app/*` pages set `prerender = false`, so they exist only in `dist/server`; `dist/client` has no `app/` directory. The build log therefore prerenders only public pages.
- The built Node server responds `200` for `/app/firewall/` (verified), so routing and prerender configuration are correct.
- `render.yaml` already declares a Node web service with `node ./dist/server/entry.mjs`, but the live domain is served by Cloudflare: `/` returns 200 with `server: cloudflare`, while `/app/` and `/app/firewall/` return 404 with `cf-cache-status: BYPASS` and no `x-render` header. That is consistent with a static artifact deployment, not the Node entry.
- Recommendation: route the domain to the Node standalone service (or an approved SSR adapter for the actual host), keep `/app/*` uncached and never prerender authenticated tenant pages. This needs an owner decision on hosting; no hosting or DNS configuration was changed here.

## Verification (local, this change)

- `npm run build`: PASS. `tsc --noEmit`: PASS.
- `node --test tests/firewall.test.mjs tests/kernel.test.mjs`: 12 PASS (5 Firewall, 7 Kernel), including literal-pattern safety, precedence/priority, field allowlists, cross-origin rejection, schema-missing mapping and 503-without-ALLOW.
- `tests/firewall-db.test.mjs` against a disposable local PostgreSQL 16 (`initdb`/`pg_ctl`, synthetic users and tenants): 1 PASS. Applies `0001`+`0002`, then covers template creation, custom rule CRUD, priority citation, version conflicts, template immutability, permission denial, tenant isolation, filters, 12-row limit, absence of raw text, decision-insert failure rollback.
- Built server over HTTP: `/app/firewall/` 200 with the rule editor, filters and synthetic acknowledgement present; `GET`/`POST` without identity 401 with `Cache-Control: private, no-store`, `X-Robots-Tag: noindex, nofollow`, `nosniff`. This is not an authenticated journey.
- Real Neon sign-in → workspace → Firewall with two accounts: **NOT RUN**. No approved test account or trusted local origin. No browser session or visual viewport check was performed in this change.

## Deferred

Provider proxy/egress enforcement, real AI request interception, WARN/REQUEST_APPROVAL decisions, semantic detection, full DLP, quotas/rate limits, signed Ledger evidence, retention policy, commercial licensing/trials and production acceptance gates. The Firewall row remains FOUNDATION and does not require buying another product.

## Changed-file inventory

- `src/server/firewall/core.mjs`, `service.mjs`, `http.mjs`
- `src/pages/app/api/firewall/rules.ts`
- `src/pages/app/firewall/index.astro`
- `src/scripts/firewall.ts`
- `src/styles/firewall.css`
- `src/server/kernel/core.mjs` (one audit label)
- `migrations/0002_aigas_firewall.sql`
- `tests/firewall.test.mjs`, `tests/firewall-db.test.mjs`
- `docs/FIREWALL-DEVELOPMENT.md`, `docs/products/firewall/FEATURE-STATUS.yaml`
- `.agents/mind/01-mind-latest.md`, `.agents/mind/02-mind-mid.md`

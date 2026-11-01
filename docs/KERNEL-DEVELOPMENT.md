# Kernel foundation — local development

Status: migration `0001_aigas_kernel.sql` APPLIED on 2026-11-01 to `production` (`br-young-bird-b43proeb`) in `young-frog-60183055`, following the owner's explicit instruction to use the current branch. Four tables, six indexes and RLS are verified; all new tables are empty. Authenticated onboarding and real multi-user isolation remain NOT VERIFIED. No product engine is implemented here. Evidence: `Audit/2026-11-01-kernel-migration.json`.

## Run

Use Node 22.x and the repository lockfile: `npm ci`, then `npm run dev -- --host 127.0.0.1 --port 4321`. Copy missing variable names from `.env.example` into the ignored `.env` without overwriting existing values. Do not send secrets through chat, commit them, or use `PUBLIC_` prefixes. Existing local DATABASE_URL and Neon Auth variables were retained unchanged.

For standalone verification: `npm run build`, then `HOST=127.0.0.1 PORT=4401 node --env-file=.env dist/server/entry.mjs`. Astro's build loads env for tooling; standalone runtime needs explicit environment injection.

Open `/app/` or `/app/kernel/`. The public shell contains no organization data. Neon Auth's SDK restores the managed session and obtains a short-lived token held only in memory. Installed `@neon/auth@0.8.2` exposes it as `getSession().data.session.token` (its response hook substitutes `set-auth-jwt`); the newer `.token()` API is not used. Every data request verifies EdDSA signature, issuer, required timestamps and expiry with JWKS, then checks the actual non-banned user and membership in Postgres. Sign-out clears the private DOM; previously issued JWTs remain valid until expiry (up to 15 minutes). No analytics, token storage, client tenant authority, AI provider or Data API is used.

Required: `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_JWKS_URL`. `NEON_AUTH_URL` and `NEON_JWKS_URL` are optional aliases. JWKS and Auth URLs must use HTTPS and the same origin. Auth issuer follows the official origin-based contract: https://neon.com/docs/compute/functions/authentication . `NEON_PROJECT_ID`, `NEON_BRANCH`, and `DATABASE_URL_UNPOOLED` are operator metadata/migration configuration. Storage/Data API variables are reserved, unused, and not requirements to open Kernel.

## Schema and approval boundary

Pre-migration inspection on 2026-11-01 found Neon-managed Auth tables only; the approved migration subsequently added the four Kernel tables in public. `neon_auth.user.id` is UUID and `banned` is boolean. The managed `organization` / `member` tables also exist. Kernel keeps application authorization in four explicit public entities rather than writing into provider-owned organization/plugin tables: their lifecycle and API privileges have not been verified. Those existing managed memberships are not imported or treated as Kernel grants. Reconcile any existing organizations with the owner before onboarding existing customers; there is no self-join or invitation endpoint.

`migrations/0001_aigas_kernel.sql` is additive and transactional. Its development-first header describes the original plan; the owner explicitly overrode the target and authorized applying the same SQL to the existing production branch. The file was preserved unchanged (SHA-256 `1c80c5abced0503f598e4cbe5b935e877622a57fb1f15a7f7f9e98f373e47ac7`). It was applied through the matched direct connection, with an advisory lock, timeouts and catalog assertions before COMMIT. No migration ledger table was added, preserving the four-entity limit; the local audit artifact records the application. Do not rerun this one-time migration: existing relations cause failure. Migrations are never run automatically by app startup/build.

Tables enable RLS with no browser policies; PUBLIC has no grants. The initial server connection must use the reviewed table-owner role (owner bypasses RLS); server-side membership guards remain mandatory. A separate restricted runtime role and associated RLS policies/grants require review before deployment. Never expose this connection through the browser or Data API.

No new branch, cloud resource, account or test record was created. The existing branch's schema was changed under explicit authorization; no existing rows or Auth settings/origins were changed. `.env` remains unchanged. A separate post-commit connection verified the four tables and RLS. Local Auth origin configuration and full signed-in onboarding remain unverified in this task.

## API and integration contract

- `GET /app/api/kernel/`: Bearer token required; returns only the authenticated user's memberships, selected tenant and five product states. Optional `?workspace=<uuid>` is a selection request checked against actual DB memberships on each request, never authority. No membership returns empty onboarding; non-member selection returns 403.
- `POST /app/api/kernel/`: same-origin JSON `{ "name": "..." }`, Bearer token required. Only users with zero Kernel memberships may create a new workspace. A transaction and user-specific advisory lock prevent duplicate onboarding. It creates the tenant, OWNER membership, five FOUNDATION access rows and minimal audit together. Existing members receive 409. No role or tenant ID input is accepted.
- Errors: 401 identity missing/invalid; 403 selection/origin denied; 400 input invalid; 409 existing membership; 503 Auth/DB configuration or availability failure. Errors contain no secrets. Responses use no-store; app HTML is noindex, and `/app/` routes are excluded from the generated sitemap.
- Reuse `authenticate`, `tenantGuard`, `requireRole` and `audit` in future server handlers. Keep operations scoped by server-verified identity and tenant. Audit is essential security metadata, **not** the Ledger product or a tamper-proof evidence system.

A product's availability combines a DB access state and an explicit server registry of verified implemented routes. The registry is currently empty. Every card stays closed with “قيد التأسيس / لم يجهز بعد”, even if an operator writes ENABLED into the DB. Adding a route alone does not grant access: register it only after its own server-side guard and functionality are verified. No subscription or trial is activated by an access record.

Order for subsequent implementation: Firewall → Ledger → Human Gate (wave 1), then Risk Engine → Secure Chat (wave 2). Paths: `/app/firewall/`, `/app/ledger/`, `/app/human-gate/`, `/app/risk-engine/`, `/app/secure-chat/`. These paths are reserved and are not linked until implemented.

## Verification

`node --test tests/kernel.test.mjs` checks selection, role denial, input bounds, unavailable routes and authentication rejection. Build and local HTTP checks cover no-store, noindex, five cards, no analytics and 401 for unauthenticated/forged requests. Browser checks cover 360px and 1440px only; no full screenshot campaign.

Before claiming operational onboarding: configure a permitted test origin with separate authorization and use two approved test accounts and verify create/reload/sign-out, membership selection, cross-tenant rejection, no self-escalation, concurrent creation, DB failures and audit rollback. This task does not prove production security or release readiness.

Dependencies added: `pg` for the existing Node server's database connection; `jose` as an explicit direct dependency for supported JWT verification (previously present transitively). No framework, Storage SDK or AI dependency added. Existing Neon peer dependency warnings remain.

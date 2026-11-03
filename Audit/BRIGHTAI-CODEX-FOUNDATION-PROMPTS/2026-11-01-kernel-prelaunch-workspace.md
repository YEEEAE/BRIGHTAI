# Kernel pre-launch workspace — local evidence (2026-11-01)

Scope: the four modules requested for the pre-final Kernel phase. Local code and verification only. No GitHub write, commit, push, PR, deployment, DNS change or Neon schema change.

## Implemented locally

- Dashboard `GET /app/api/kernel/` now returns, in addition to memberships/tenant/products: `summary { members, events }`, `activity` (latest eight tenant audit rows with Arabic labels and actor display name) and `canManageMembers`. All aggregates filter by the server-verified `tenant_id`.
- New `GET /app/api/kernel/members/` lists the roster of the selected tenant with role, role label, join date and account status. Co-member email is returned to OWNER/ADMIN only. Read-only; there is no invitation, role mutation or promotion path, so a MEMBER cannot escalate to OWNER and no synthetic users are created.
- New `GET /app/api/kernel/health/` is anonymous liveness only and returns setup-state codes (`AUTH_SETUP_REQUIRED`, `DB_SETUP_REQUIRED`, `SCHEMA_MISSING`, …) with no host, credential, version, row count or SQL text.
- `/app/kernel/` shows a runtime health strip, real product states from `aigas_product_access`, tenant totals, member roster, latest activity, and explicit loading/empty/error/unauthorized/disabled states. Invitation and role-change CTAs are disabled with a stated reason.
- Product state labels follow the DB: `ENABLED` → «مفعّل للمؤسسة», `DISABLED` → «معطّل من المشغّل», `FOUNDATION` → «قيد التأسيس». A product link appears only for allowlisted routes whose state is not `DISABLED`.

## Database facts (read-only)

Direct read-only inspection of `young-frog-60183055` / `neondb` (Neon MCP returned an authorization error, as recorded earlier, so a read-only `pg` client was used; no secrets printed):

- `public.aigas_tenants`, `public.aigas_memberships`, `public.aigas_product_access`, `public.aigas_audit_events` exist; row counts are 0/0/0/0.
- Six public indexes and the four PKs are present. No Firewall/Ledger/Human Gate/Risk Engine/Secure Chat tables exist, confirming `0002`–`0005` are not applied.
- `neon_auth."user"` has `id`, `name`, `email`, `emailVerified`, `image`, timestamps, `role`, `banned`, `banReason`, `banExpires`.

No SQL was executed that changes schema or data, on Neon or elsewhere. No tenant or user was seeded.

## Published `/app/` 404 — diagnosis

Live: `/`, `/products/`, `/kernel/` → 200 (`cf-cache-status: HIT`); `/app/`, `/app/kernel/`, `/app/api/kernel/` → 404 (`cf-cache-status: MISS`, no origin markers). Local standalone build: `/app/` → 302 to `/app/kernel/`, `/app/kernel/` → 200, `/app/api/kernel/` → 401.

Cause: the 29 public pages are `prerender = true` (HTML in `dist/client`), while every `/app/*` page/API is `prerender = false` (only in `dist/server`). `dist/client` contains zero `/app/` HTML, so a host that publishes only the static output serves the marketing pages and 404s all workspace routes. Not a routing defect in the repository.

Recommendation (owner action): serve the Node standalone artifact (`node ./dist/server/entry.mjs`, as in `render.yaml`) behind the live domain and deploy fresh; or, if the domain must stay static/edge, approve a Cloudflare adapter migration as a dependency and hosting change. Do not prerender `/app/*`. Do not cache `/app/*` at the edge; responses already send `private, no-store` and `noindex, nofollow`.

## Verification

- `npm run build`: PASS.
- `node --test tests/kernel.test.mjs`: 7 PASS (selection, role denial, name bounds, product-state contract, label fallback, forged/missing auth, JWT verification).
- `node --test tests/kernel-db.test.mjs` against a disposable localhost PostgreSQL 16 with synthetic rows only: 1 PASS. Covers real access states and links, tenant-scoped member/event totals, audit isolation between two tenants, no-workspace state, 403 for foreign tenant selection, banned-user 401, member roster ordering/roles, email visibility by role, and health `SCHEMA_MISSING` after dropping a table.
- Local HTTP on the built server: `/app/` 302; `/app/kernel/` 200 with `private, no-store`, `noindex, nofollow`, `no-referrer`; zero analytics markers; `/app/api/kernel/`, `/app/api/kernel/members/` 401 without or with a forged token; `/app/api/kernel/health/` 200.
- Browser (Chromium, signed out) at 360px and 1440px: health strip renders three READY states, login form appears, private sections stay hidden, five product cards, invite button disabled with reason, no console errors, no horizontal overflow.

## Not verified / open blockers

- Signed-in Kernel journey and real Neon Auth login: NOT RUN. The trusted Auth origin is `https://brightai.live` only and no approved test account exists; creating one was previously blocked by `INVALID_ORIGIN`.
- Two-account isolation against Neon: NOT VERIFIED beyond the isolated PostgreSQL harness.
- `0002`–`0005` remain unapplied; any Neon schema change requires owner approval and an approved development branch.
- Live `/app/*` remains 404 until the hosting/domain decision above is executed by the owner.
- Invitations, role changes, subscriptions, 48h trial, SSO/MFA: not implemented and not claimed.

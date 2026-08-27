# @brightai/dashboard

**Next.js 15 SaaS dashboard for BrightAI** — multi-tenant, server-side rendered, fully type-safe.

## Phase 0 status

This is the **foundation** (Phase 0) of the dashboard. It contains:

- ✅ Monorepo integration (`@brightai/config` + `@brightai/db` workspace deps)
- ✅ Next.js 15 App Router with TypeScript strict
- ✅ Clerk auth (`clerkMiddleware`) + subdomain-based tenant routing
- ✅ Tenant resolver (subdomain + custom domain) via middleware + server helpers
- ✅ Session context (Clerk user → local User → Membership → role)
- ✅ RBAC enforcement (`requirePermission` / `requireRoleAtLeast`) at server-component level
- ✅ Row-Level Security (RLS) via Prisma `withTenant()` transaction wrapper
- ✅ Route groups: `(auth)` / `(onboarding)` / `(app)` / `(settings)` + API
- ✅ `/api/health` (db-aware) + `/api/webhooks/clerk` (signature-verified)
- ✅ CSS Modules + design tokens (no Tailwind, consistent with marketing site)
- ✅ Accessible (skip link, focus-visible, `dir="rtl"`, `prefers-reduced-motion`)

What's **not** in Phase 0 (intentionally — coming in later phases):

- ❌ Custom sign-up form (Company + Owner in one step) — Phase 1
- ❌ Password reset UI — Phase 1
- ❌ 2FA management UI (Clerk `UserProfile` is used as placeholder) — Phase 1
- ❌ Tenant switcher (multi-org user) — Phase 2
- ❌ Team management UI (invite/bulk/role change) — Phase 2
- ❌ 5-step onboarding wizard — Phase 3
- ❌ Custom domain CNAME flow — Phase 4
- ❌ API key management UI — Phase 4

## Quick Start

### 1. Install

```bash
# from repo root
pnpm install
```

### 2. Start local services (Postgres + Redis + MailHog)

```bash
# Docker
docker compose up -d

# or macOS Homebrew (alternative)
brew services start postgresql@16
brew services start redis
```

### 3. Set up env

```bash
cp apps/dashboard/.env.example apps/dashboard/.env
# fill in CLERK_SECRET_KEY, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_WEBHOOK_SECRET
```

### 4. Bootstrap the database

```bash
# Create the brightai_app / brightai_service roles
pnpm --filter @brightai/db db:setup

# Apply Prisma migration (initial) + generate client
pnpm --filter @brightai/db db:generate
pnpm --filter @brightai/db db:migrate:dev --name init

# Seed dev data (1 org + 5 users + 3 policies + 5 requests + 1 API key)
pnpm --filter @brightai/db db:seed

# Run the RLS isolation test (verifies tenants can't see each other)
pnpm --filter @brightai/db db:rls:test
```

### 5. Run the dashboard

```bash
# Marketing site (Astro, root)
pnpm dev

# Dashboard (Next.js, port 3000)
pnpm --filter @brightai/dashboard dev
```

Then visit:

- **Root domain** (marketing, no auth): `http://localhost:3000`
- **Tenant subdomain** (dashboard, needs auth): `http://acme.localhost:3000`
  (We added `acme.brightai.live` to /etc/hosts in the seed — it works at `acme.localhost:3000` in dev.)
- **MailHog** (dev email catcher): `http://localhost:8025`
- **Prisma Studio** (DB inspector): `http://localhost:5555` (run `pnpm --filter @brightai/db db:studio`)

### 6. Sign in to the seed org

The seed creates 5 Clerk users with these `clerkUserId`s (you'll need to create them in the Clerk dashboard with matching IDs, or use the Clerk test mode):

| clerkUserId             | Role               | Email                       |
|-------------------------|--------------------|-----------------------------|
| `user_seed_owner`       | OWNER              | [email protected]   |
| `user_seed_admin`       | ADMIN              | [email protected]   |
| `user_seed_compliance`  | COMPLIANCE_OFFICER | [email protected] |
| `user_seed_reviewer`    | REVIEWER           | [email protected]    |
| `user_seed_member`      | MEMBER             | [email protected]     |

For dev without Clerk, you can also disable the auth gate by setting `ENABLE_SIGNUP="false"` and skipping `requireSessionPermission` (workaround — full e2e test requires real Clerk keys).

## Architecture

```
apps/dashboard/
├── app/
│   ├── (auth)/                  ← sign-in, sign-up, unauthorized (no auth required)
│   ├── (onboarding)/            ← 5-step wizard (Phase 3)
│   ├── (app)/                   ← main authenticated area
│   │   ├── dashboard/           ← tenant home (counts + roadmap)
│   │   ├── requests/            ← AI request list (RLS-scoped)
│   │   ├── policies/            ← policy list
│   │   └── team/                ← member list
│   ├── (settings)/              ← user + org settings
│   │   └── settings/
│   │       ├── profile/         ← Clerk UserProfile
│   │       ├── security/        ← 2FA + passkeys + sessions
│   │       ├── billing/         ← OWNER+ only
│   │       └── tenant/          ← ADMIN+ only
│   ├── invitation/[token]/      ← public invitation accept
│   ├── api/
│   │   ├── health/              ← GET /api/health
│   │   └── webhooks/clerk/      ← POST /api/webhooks/clerk
│   ├── layout.tsx               ← ClerkProvider + RTL + skip link
│   ├── page.tsx                 ← root domain landing
│   └── not-found.tsx
├── components/
│   └── dashboard/
│       ├── Sidebar.tsx          ← nav (filters by role)
│       └── Sidebar.module.css
├── lib/
│   ├── tenant.ts                ← getTenantFromHeaders, requireTenant
│   ├── session.ts               ← getSessionContext, requireSessionPermission
│   ├── types.ts                 ← re-exports
│   └── index.ts
├── styles/
│   ├── tokens.css               ← design tokens (mirrors marketing site)
│   └── globals.css
├── middleware.ts                ← Clerk + subdomain routing
├── next.config.mjs
├── tsconfig.json
├── package.json
└── .env.example
```

## How multi-tenancy works

1. Request comes in. Middleware extracts the host (`acme.brightai.live` or `client.com`).
2. Middleware sets `x-tenant-slug` (and `x-tenant-custom-domain` if it's not a subdomain).
3. Middleware runs `clerkMiddleware.protect()` on every non-public route.
4. Server components / route handlers call `getTenantFromHeaders()` → resolves the slug to an Organization.
5. `getSessionContext()` resolves the Clerk user → local User → Membership → role.
6. Any DB query goes through `withTenant(orgId, userId, fn)` which sets `app.current_org_id` + `app.current_user_id` via `SET LOCAL` inside a transaction.
7. RLS policies in `packages/db/prisma/policies/rls.sql` enforce isolation at the database level.

If a route handler forgets to call `withTenant`, the DB returns zero rows — the policies refuse to leak. Even if the application code is wrong, the data is safe.

## Security

- **HttpOnly + Secure + SameSite=Lax** session cookies (Clerk default).
- **CSRF protection** on all Clerk-managed routes + server actions.
- **CSP** headers in `next.config.mjs` (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).
- **Password policy** defined in `packages/config/src/constants.ts` (min 12 chars, complexity rules).
- **Rate limits** defined in same file (5 login attempts / 15 min, etc.).
- **Audit log** for `user.created/updated/deleted`, membership changes, role changes (Phase 1 expands coverage).
- **PDPL**: `DataExportRequest` + `DataDeletionRequest` models already in schema. UI endpoints ship Phase 4.

## Testing

- **Unit**: `pnpm --filter @brightai/dashboard test` (Vitest — placeholder, tests added per feature in Phase 1+).
- **E2E**: Playwright e2e suite planned for Phase 5 (`signup → invite → policy → request → approval`).
- **RLS**: `pnpm --filter @brightai/db db:rls:test` runs the isolation test that proves tenants can't see each other.

## Common tasks

```bash
# Add a new env var
# 1. Edit packages/config/src/env.ts (Zod schema)
# 2. Edit apps/dashboard/.env.example
# 3. Restart `pnpm dev`

# Add a new Prisma model
# 1. Edit packages/db/prisma/schema.prisma
# 2. pnpm --filter @brightai/db db:migrate:dev --name <name>
# 3. If it's tenant-scoped, add an RLS policy in packages/db/prisma/policies/rls.sql
# 4. Re-run db:setup to re-apply policies + db:rls:test to verify

# Add a new permission
# 1. Add to PERMISSIONS array in packages/config/src/constants.ts
# 2. Add to ROLE_PERMISSIONS matrix
# 3. Use in route: await requireSessionPermission('my:permission')
# 4. Update sidebar nav to gate by it

# Reset the database
docker compose down -v
docker compose up -d
pnpm --filter @brightai/db db:setup
pnpm --filter @brightai/db db:migrate:deploy
pnpm --filter @brightai/db db:seed
```

## What's next

Phase 1 (next sprint) ships the actual sign-up + sign-in flows, password reset, email verification, and 2FA. See `report/2026-07-08-phase-0-foundation.md` for the full Phase 0 report + Phase 1 plan.

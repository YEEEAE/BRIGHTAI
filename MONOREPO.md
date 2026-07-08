# BrightAI Monorepo

Monorepo for **BrightAI — Saudi AI Safety OS**.

## Structure

```
brightai/
├── apps/
│   ├── marketing/      (planned — Astro static site, currently at root)
│   └── dashboard/      (Next.js 15 SaaS dashboard — multi-tenant)
├── packages/
│   ├── config/         Shared env validation, constants, RBAC types
│   ├── db/             Prisma schema, RLS policies, seed data
│   └── ui/             (planned) Shared design system
├── src/                Astro static site (will move to apps/marketing/ in v2)
├── public/
├── astro.config.mjs
├── package.json
├── docker-compose.yml  Local Postgres + Redis + MailHog (for teammates on Docker)
└── README.md
```

## Quick Start

```bash
# 1. Install
pnpm install

# 2. Set up env
cp .env.example .env
# Fill in DATABASE_URL, REDIS_URL, CLERK keys, etc.

# 3. Start local services (Postgres + Redis)
#    Option A — Docker (if installed):
docker compose up -d
#    Option B — Homebrew (macOS, what we use in dev):
brew services start postgresql@16
brew services start redis

# 4. Create database + run migrations
./scripts/db/setup-local.sh

# 5. Generate Prisma client + seed
pnpm --filter @brightai/db db:generate
pnpm --filter @brightai/db db:migrate:dev
pnpm --filter @brightai/db db:seed

# 6. Run apps
pnpm dev                       # Astro (root)
pnpm --filter @brightai/dashboard dev   # Next.js dashboard
```

## Workspaces

- **`@brightai/config`** — env validation (Zod), shared constants, RBAC matrix
- **`@brightai/db`** — Prisma client, schema, RLS policies, seed data
- **`@brightai/dashboard`** — Next.js 15 SaaS dashboard (Phase 1+)

The Astro marketing site stays at the repo root until we complete the
`apps/marketing/` refactor (tracked separately, not blocking Phase 0).
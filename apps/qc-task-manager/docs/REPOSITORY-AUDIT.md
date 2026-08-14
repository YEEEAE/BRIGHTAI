# QC Task Manager — Repository Audit

> Short reference for how `@brightai/qc-task-manager` plugs into the BRIGHTAI
> monorepo: workspace wiring, Astro/deployment surface, and the files that must
> never be modified. Derived from `docs/ARCHITECTURE.md` and the project brain
> (`.agents/brain.md`).

## Workspace wiring

- The app lives at `apps/qc-task-manager/` and is a **pnpm workspace package**
  named `@brightai/qc-task-manager` (`pnpm-workspace.yaml` includes `apps/*`).
- One lockfile at the repository root; all dependencies come from the root
  workspace install (`pnpm install` from the repo root). The root `engines`
  pin **Node 22 LTS** and **pnpm >= 10`.
- Run commands with the filter from the repo root, e.g.
  `pnpm --filter @brightai/qc-task-manager dev`, `build`, `test`, `typecheck`.
- Shared packages (`packages/*`) are available to the app via the same
  workspace resolution; the app is otherwise self-contained (SQLite via
  `better-sqlite3`, no external runtime services).

## Astro configuration

- `astro.config.mjs`: `output: 'server'` + the `@astrojs/node` **standalone**
  adapter → `node dist/server/entry.mjs` runs the whole app (pages, API routes,
  auth, SQLite, backup scheduler). The app is **not** a static site and cannot
  be deployed as one.
- `build.inlineStylesheets: 'never'` keeps global CSS as same-origin files so
  the strict CSP (`style-src 'self' + hash`) stays valid.
- Local dev serves on port 4321 (`PORT`/`HOST` override it in production).

## Deployment surface

- `render.yaml` defines a second web service, `qc-task-manager` (`type: web`,
  `runtime: node`), next to the unchanged `brightai-site` service:
  - Build: `pnpm install && pnpm --filter @brightai/qc-task-manager build`
  - Start: `pnpm --filter @brightai/qc-task-manager start`
  - Health check: `GET /api/health` (public readiness probe — `200` when the
    database is migrated, `503` otherwise; never creates the database).
  - Persistent disk `qc-data` mounted at `/var/data` (SQLite + backups).
  - Env var **names only** (no values/secrets in the file): `QC_DATABASE_PATH`,
    `QC_BACKUP_DIR`, `NODE_ENV`, `GROQ_API_KEY`, `ADMIN_DEFAULT_PASSWORD`.
  - `autoDeploy: false` — deployment is owned by the user via the Render
    dashboard. Full runbook: `docs/DEPLOYMENT.md`.
- Environment contract (values, defaults, and which are read at runtime) is
  documented in `docs/DEPLOYMENT.md` and the app `README.md`. `SESSION_SECRET`
  is **reserved but not implemented** — the app does not read it.

## Files that must never be modified

- `.github/workflows/*` — read-only; CI/CD is out of scope for agent changes.
- `.env*` (root and app) — secrets live here or in the Render dashboard, never
  in tracked files, comments, or the brain.
- The `brightai-site` service block in `render.yaml` — QC edits are additive
  only (the QC block is separate).
- `db/*.db*` and `db/backups/*` — runtime state (gitignored); the schema is
  `db/schema.sql` + `db/migrations/` + `src/lib/db.ts`.
- Anything touching Git history (`git push`, force-push, history rewrites) —
  the project rule is **no push, ever**; the user commits and deploys.

## Guards

- `scripts/architecture-guard.mjs` — source-of-truth/trust-boundary static
  guard (part of `pnpm test`).
- `scripts/verify-security-hygiene.mjs` — secrets/header hygiene scan.
- Structure compliance for the whole app tree is asserted by `pnpm test`
  (`scripts/test.mjs`).

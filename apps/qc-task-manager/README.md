# QC Task Manager

Internal task-tracking web app for the QC department. Astro (SSR) + React islands + Tailwind, backed by SQLite (`better-sqlite3`) with bcrypt password hashing. Runs locally on port 4321.

## Quick start

From the monorepo root:

```bash
pnpm install
pnpm --filter qc-task-manager db:init   # create db/qc_tasks.db + seed users
pnpm --filter qc-task-manager dev        # http://localhost:4321
```

### Seeded accounts

Password for all: `password123`

| Username      | Role       | Notes                          |
| ------------- | ---------- | ------------------------------ |
| `admin`       | admin      | Full control                   |
| `manager`     | manager    | Tasks + delete requests        |
| `supervisor`  | supervisor | Tasks + assignment             |
| `employee`    | employee   | No dashboard, no task creation |
| `emp_creator` | employee   | `can_create_tasks = 1`         |

## Tech stack

- **Astro** `output: 'server'` with `@astrojs/node` (standalone)
- **React** islands (interactive components) + **Tailwind CSS**
- **better-sqlite3** (WAL mode) — DB at `db/qc_tasks.db`
- **bcryptjs** for password hashing

## Project layout

```
apps/qc-task-manager/
├── db/
│   ├── schema.sql          # all 7 tables
│   ├── seed.sql            # reference seed (authoritative seed is in scripts/init-db.mjs)
│   └── qc_tasks.db         # generated at runtime (gitignored)
├── scripts/
│   └── init-db.mjs         # applies schema + seeds real bcrypt hashes
├── src/
│   ├── layouts/BaseLayout.astro
│   ├── components/Navbar.tsx
│   ├── lib/
│   │   ├── db.ts           # SQLite singleton (WAL)
│   │   ├── auth.ts         # bcrypt + sessions
│   │   ├── session.ts      # cookie helpers for Astro endpoints
│   │   ├── permissions.ts  # role checks (single source of truth)
│   │   ├── activity.ts     # task_activity_log helper
│   │   └── types.ts
│   ├── middleware.ts       # auth guard + role-scoped route protection
│   └── pages/
│       ├── index.astro     # redirects by role
│       ├── login.astro
│       ├── logout.ts       # POST
│       ├── dashboard.astro # manager/supervisor/admin
│       ├── api/login.ts    # POST credentials
│       ├── employee/       # employee-only views
│       ├── manager/        # manager + admin
│       ├── supervisor/     # supervisor + manager + admin
│       └── admin/          # admin-only user management
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
└── package.json
```

## Environment

- Node 20+
- Override the DB path with `QC_DB_PATH=/abs/path.db`.
- Override the seed password with `QC_SEED_PASSWORD=...`.

## Notes

- The DB file (`*.db`, `*.db-wal`, `*.db-shm`) is gitignored and never committed.
- This scaffold establishes routing, auth, and the data model. Task CRUD, the closure flow, attachments UI, and delete-request workflows are the next build phase.

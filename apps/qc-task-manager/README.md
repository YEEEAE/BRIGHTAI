# QC Task Manager

Internal task-tracking web app for the QC department. Astro (SSR) + React islands + Tailwind, backed by SQLite (`better-sqlite3`) with bcrypt password hashing. Runs locally on port 4321.

## Quick start

From the monorepo root:

```bash
pnpm install
pnpm --filter qc-task-manager db:init   # create db/qc_tasks.db + seed all roles
pnpm --filter qc-task-manager dev        # http://localhost:4321
```

Open http://localhost:4321/login and sign in.

### Seeded accounts

The DB seeds **one account per role** on first boot (only when the `users` table is empty). Every account uses the same password (`ADMIN_DEFAULT_PASSWORD`, default `admin123`), so the role-based home router can be tested end-to-end.

| Username     | Role       | Password                                   | can_create_tasks | Home after login |
| ------------ | ---------- | ------------------------------------------ | ---------------- | ---------------- |
| `admin`      | admin      | `ADMIN_DEFAULT_PASSWORD` (default `admin123`) | yes              | `/admin/users`   |
| `manager`    | manager    | same                                        | yes              | `/manager`       |
| `supervisor` | supervisor | same                                        | yes              | `/supervisor`    |
| `employee`   | employee   | same                                        | no               | `/employee`      |

> ⚠️ Changing `ADMIN_DEFAULT_PASSWORD` in `.env` does **not** update existing accounts — the seed is an `INSERT` that only runs when `users` is empty. To rotate passwords either run `pnpm db:reset` (wipes data) after setting the new value, or change them from the admin UI / directly in the DB.

## Auth & sessions

- Session tokens are opaque `randomUUID()` values stored server-side in the `sessions` table; the browser only holds the token in an `HttpOnly` cookie (`qc_session`).
- Session TTL is **12 hours** (`SESSION_TTL_MS` in `src/lib/auth.ts`). Expired rows are purged on every login and on server startup (`cleanupExpiredSessions` in `src/lib/db.ts`).
- `src/middleware.ts` is the single auth guard: it resolves `locals.user` for every request, protects role-scoped routes (`/dashboard`, `/admin`, `/manager`, `/supervisor`), and handles the self-submitting `POST /login` form (redirects to the safe target on success, `/login?error=1` on bad credentials — open-redirect blocked).
- One-shot flash messages (`qc_flash` cookie + `src/components/FlashNotice.astro`) are shown after login/logout and on access-denied redirects.
- Astro 6 has a built-in same-origin CSRF check for form POSTs — cross-site POST forms are rejected with 403.

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
│   └── init-db.mjs         # applies schema + seeds admin with a real bcrypt hash
├── src/
│   ├── layouts/BaseLayout.astro
│   ├── components/
│   │   ├── Navbar.tsx
│   │   └── FlashNotice.astro
│   ├── lib/
│   │   ├── db.ts           # SQLite singleton (WAL) + cleanupExpiredSessions
│   │   ├── auth.ts         # bcrypt + sessions (12h TTL, randomUUID tokens)
│   │   ├── session.ts      # cookie helpers for endpoints + handleLoginPost
│   │   ├── flash.ts        # one-shot flash messages via qc_flash cookie
│   │   ├── permissions.ts  # role checks + roleHome (single source of truth)
│   │   ├── activity.ts     # task_activity_log helper
│   │   ├── tasks.ts        # createTask + assignment validation + POST handler
│   │   └── types.ts
│   ├── middleware.ts       # auth guard + role-scoped route protection + POST /login + task-create POSTs
│   └── pages/
│       ├── index.astro     # redirects by role (roleHome)
│       ├── login.astro     # self-submitting login form
│       ├── logout.ts       # POST
│       ├── dashboard.astro # manager/supervisor/admin
│       ├── employee/       # employee-only views (index + new)
│       ├── manager/        # manager + admin (index + new)
│       ├── supervisor/     # supervisor + manager + admin (index + new)
│       └── admin/          # admin-only user management
├── astro.config.mjs
├── tailwind.config.mjs
├── tsconfig.json
└── package.json
```

## Environment

- Node 20+
- `ADMIN_DEFAULT_PASSWORD` — seed password for the initial admin (default `admin123`, warns if unset). Only applies to a fresh seed.
- Override the DB path with `QC_DB_PATH=/abs/path.db`.

## Task creation

- `/manager/new`, `/supervisor/new`, `/employee/new` render the new-task form (GET). The POST is short-circuited in `src/middleware.ts` (Astro 6 pages have no named request handlers — same pattern as login) and handled by `handleCreateTaskPost` in `src/lib/tasks.ts`.
- Manager/admin/supervisor may assign the task to **any active user**; employees may assign it **only to themselves or leave it unassigned** (`validateAssignee` in `src/lib/tasks.ts`, per product decision).
- `/employee/new` is gated by `can_create_tasks` on both GET and POST (CORE BUSINESS RULE #1) — an employee without the flag is bounced, and a crafted POST cannot bypass the gate.
- Every created task records a `task_created` row in `task_activity_log` (CORE BUSINESS RULE #6).

## Notes

- The DB file (`*.db`, `*.db-wal`, `*.db-shm`) is gitignored and never committed.
- This scaffold establishes routing, auth, the data model, and task creation. Task editing/closure, attachments UI, and delete-request workflows are the next build phase.

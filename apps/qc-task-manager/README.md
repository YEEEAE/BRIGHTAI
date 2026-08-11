# QC Task Manager

Internal task-tracking web app for the **QC department**. It covers the full
workflow: user management → task creation → employee progress updates →
closure flow (completion comment + evidence) → analytics dashboard.

Built with **Astro (SSR)** + **React islands** + **Tailwind CSS**, backed by
**SQLite** (`better-sqlite3`) with **bcryptjs** password hashing. Runs locally
on port 4321.

---

## What the app does

- **Role-based access**: `admin`, `manager`, `supervisor`, `employee` — each
  lands on their own home page after login.
- **Task lifecycle**: create → progress (status / % / blocker notes) →
  complete via the **closure flow** (mandatory completion comment + optional
  evidence, or a recorded skip) → archived read-only.
- **Field locking** (CORE RULE #2): employees may only change
  status / progress / comments / attachments / blocker notes. Title,
  description, assignee, due date, and priority are locked for employees and
  editable by supervisor/manager/admin only.
- **Comments + attachments**: threads per task; files are stored **inside the
  database as BLOBs** (CORE RULE #5) with extension + MIME + 10 MB validation.
- **Delete requests** (CORE RULE #4): employees cannot delete — they request,
  a manager/admin approves or rejects.
- **Dashboard**: KPI cards, donut/bar/line SVG charts, overdue + recently
  completed tables, and date/assignee/priority filters.
- **Activity log** (CORE RULE #6): every mutation is recorded with who/what/
  old/new/timestamp.

## Roles & permissions

| Capability                 | admin | manager | supervisor | employee |
| -------------------------- | :---: | :-----: | :--------: | :------: |
| View dashboard            | ✅ | ✅ | ✅ | ❌ |
| Manage users (`/admin/users`) | ✅ | ❌ | ❌ | ❌ |
| Create / edit / delete tasks | ✅ | ✅ | create/edit (no direct delete) | only if `can_create_tasks = 1` |
| Assign tasks              | ✅ | ✅ | ✅ | self / unassigned only |
| Edit locked fields (title, description, assignee, due date, priority) | ✅ | ✅ | ✅ | ❌ |
| Edit status / progress / blocker / comments / attachments | ✅ | ✅ | ✅ | ✅ (own/created tasks) |
| Complete a task (closure flow) | ✅ | ✅ | ✅ | ✅ (own/created tasks) |
| Submit deletion requests  | ❌ | ❌ | ❌ | ✅ |
| Approve / reject deletion requests | ✅ | ✅ | ❌ | ❌ |
| View any task             | ✅ | ✅ | ✅ | assigned/created only |
| View task details page    | ✅ | ✅ | ✅ | ✅ (own/created) |

Completed tasks are **read-only for everyone** (CORE RULE #3).

All checks live in one place: `src/lib/permissions.ts`.

## Quick start

From the **monorepo root**:

```bash
pnpm install                                   # install (better-sqlite3 needs build tools)
pnpm --filter qc-task-manager db:init          # create db/qc_tasks.db + seed roles
pnpm --filter qc-task-manager dev              # http://localhost:4321
```

Open <http://localhost:4321/login> and sign in.

### Production build & start

```bash
pnpm --filter qc-task-manager build
# then, from the app directory:
cd apps/qc-task-manager && node dist/server/entry.mjs     # serves on PORT (default 4321)
```

The standalone server respects `PORT` / `HOST` env vars (default `4321` /
`0.0.0.0`). Set `QC_DB_PATH` to point at a different database file.

### Demo data (for showing the boss)

Seed a demo team (2 extra employees) + **12 tasks in mixed statuses**
(overdue, in progress, on hold, completed with closure comments) on a fresh DB:

```bash
SEED_DEMO=1 pnpm --filter qc-task-manager db:init --reset
SEED_DEMO=1 pnpm --filter qc-task-manager dev
```

Demo logins (all roles use the same password, see below):

| Username     | Role       | can_create_tasks |
| ------------ | ---------- | ---------------- |
| `admin`      | admin      | yes              |
| `manager`    | manager    | yes              |
| `supervisor` | supervisor | yes              |
| `employee`   | employee   | no               |
| `emp_sara`   | employee   | yes              |
| `emp_omar`   | employee   | no               |

`SEED_DEMO` only touches an **empty** database — existing data is never
modified.

## Seeded accounts & how to change passwords

The DB seeds **one account per role** on first boot (only when the `users`
table is empty). Every account uses the same password from
`ADMIN_DEFAULT_PASSWORD`, default **`admin123`**:

| Username     | Role       | Home after login |
| ------------ | ---------- | ---------------- |
| `admin`      | admin      | `/admin/users`   |
| `manager`    | manager    | `/manager`       |
| `supervisor` | supervisor | `/supervisor`    |
| `employee`   | employee   | `/employee`      |

**To change the default password** (do this before exposing the app beyond
localhost):

```bash
ADMIN_DEFAULT_PASSWORD='a-strong-password' SEED_DEMO=1 pnpm --filter qc-task-manager db:init --reset
```

> ⚠️ Changing `ADMIN_DEFAULT_PASSWORD` does **not** update existing accounts —
> the seed only runs when `users` is empty. Use `db:init --reset` on a fresh DB,
> or change individual passwords from `/admin/users` (reset password action).

The server logs a warning when the default `admin123` is in use.

## Database

- **Location**: `apps/qc-task-manager/db/qc_tasks.db` (created on first boot;
  WAL mode + `foreign_keys = ON`).
- The file (`*.db`, `*.db-wal`, `*.db-shm`) is gitignored and never committed.
- Override the path with `QC_DB_PATH=/absolute/path.db`.
- Schema: `db/schema.sql` (idempotent — applied on every boot).
- Seed: `src/lib/seed.ts` (runtime) + `scripts/init-db.mjs` (CLI).

### Inspect it with SQLTools (VS Code)

1. Install the extensions: **SQLTools** (`mtxr.sqltools`) and the SQLite driver
   (**`mtxr.sqltools-driver-sqlite`**).
2. Add this connection. You can paste the snippet into your workspace
   `.vscode/settings.json` (relative to the repo root), or create the
   connection from the SQLTools sidebar with these values:

   - Connection name: **`QC Tasks DB`**
   - Driver: **SQLite**
   - Database file: **`./db/qc_tasks.db`** (relative to `apps/qc-task-manager`)

   ```jsonc
   // .vscode/settings.json (monorepo root)
   {
     "sqltools.connections": [
       {
         "name": "QC Tasks DB",
         "driver": "SQLite",
         "database": "${workspaceFolder}/apps/qc-task-manager/db/qc_tasks.db",
         "group": "QC"
       }
     ]
   }
   ```

   Note: the SQLite driver field is named `database` (it stores the `.db` file
   path); older driver versions may show it as `databaseFile`.

## Auth & sessions

- Opaque `randomUUID()` tokens stored server-side in the `sessions` table; the
  browser only holds the token in an `HttpOnly` cookie (`qc_session`).
- Session TTL: **12 hours**. Expired rows are purged on login and at startup.
- `src/middleware.ts` is the single auth guard: resolves `locals.user` for
  every request, protects role-scoped routes, and handles the self-submitting
  `POST /login` (open-redirect blocked).
- **Security headers** are added to **every** response in the middleware:
  `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`.
- One-shot flash messages (`qc_flash` cookie) after login/logout/denials.
- Astro 6's built-in same-origin CSRF check protects all form POSTs.

## Project layout

```
apps/qc-task-manager/
├── db/
│   ├── schema.sql          # all 7 tables (idempotent)
│   ├── seed.sql            # reference seed (authoritative seed is in src/lib/seed.ts)
│   └── qc_tasks.db         # generated at runtime (gitignored)
├── scripts/
│   ├── init-db.mjs         # CLI: schema + seed (+ SEED_DEMO support)
│   ├── e2e-delete-request.mjs
│   └── e2e-dashboard.mjs
├── src/
│   ├── middleware.ts       # auth + role guards + security headers + login/new-task POSTs
│   ├── layouts/BaseLayout.astro
│   ├── components/
│   │   ├── Navbar.tsx, FlashNotice.astro, StatusBadge.astro, EmptyState.astro
│   │   ├── CommentBox.tsx, DeleteRequestDialog.tsx
│   │   ├── TaskUpdatePanel.tsx, AttachmentUploader.tsx
│   │   └── DashboardCharts.tsx
│   ├── lib/
│   │   ├── db.ts           # SQLite singleton (WAL) + migrations + cleanup
│   │   ├── auth.ts         # bcrypt + sessions (12h TTL, randomUUID)
│   │   ├── session.ts      # cookie helpers + handleLoginPost
│   │   ├── flash.ts, format.ts, permissions.ts, types.ts
│   │   ├── activity.ts     # task_activity_log helper
│   │   ├── tasks.ts        # task creation + assignment validation
│   │   ├── taskUpdates.ts  # update + closure flow + upload validation
│   │   ├── taskDetails.ts  # read queries + access rule + activity text
│   │   ├── users.ts        # admin user management
│   │   ├── deleteRequests.ts
│   │   ├── dashboard.ts    # KPI / charts / tables queries
│   │   └── seed.ts         # role seed + SEED_DEMO data
│   └── pages/
│       ├── index.astro, login.astro, logout.ts, dashboard.astro
│       ├── tasks/[id].astro
│       ├── api/tasks/[id]/{comment.ts, update.ts, close.ts, delete-request.ts}
│       ├── api/tasks/[id]/attachments/{index.ts, [attachmentId].ts}
│       ├── employee/ manager/ supervisor/ admin/
│       └── manager/requests/
├── astro.config.mjs        # SSR + @astrojs/node standalone, port 4321
├── tailwind.config.mjs
└── package.json
```

## Pages & flows

### Admin — user management (`/admin/users`)

Create users (username unique, password ≥ 8 chars, role, `can_create_tasks`),
activate/deactivate, reset passwords, and toggle `can_create_tasks` for
employees. An admin can never deactivate their own account. Deactivated
accounts get a dedicated "This account has been disabled." login message.
Actions are console-audited (`[users] …`), never written to the task log.

### Task creation (`/manager/new`, `/supervisor/new`, `/employee/new`)

- Manager/supervisor/admin assign to **any active user**; employees assign
  **only to themselves** or leave unassigned.
- `/employee/new` is gated by `can_create_tasks` on GET **and** POST.
- Every creation logs `task_created`.

### Task details + editing (`/tasks/[id]`)

Server-rendered sections: header (status/priority badges, progress, due date,
assignee, creator), blocker note, comments thread, attachments, activity
timeline, and closure info. Two React islands provide editing:

- **`TaskUpdatePanel`** — update progress (status / % / blocker) for any
  editor; edit locked fields (title/description/assignee/due date/priority)
  for supervisor/manager/admin; and the **complete task** closure form.
- **`AttachmentUploader`** — upload a file with client-side + server-side
  validation, loading state, and inline errors.

**Closure flow** (CORE RULE #3, atomic server-side). Any editor may complete a
task — an employee on their own/assigned tasks, or supervisor/manager/admin
on any task:

1. status → `completed`
2. evidence step — upload a file, or press **Skip** (the skip is **recorded**
   in the activity log)
3. completion comment (**mandatory**)
4. the system auto-fills `completed_at` + `completed_by`

After completion the task is read-only for everyone.

### API endpoints

All endpoints re-check the session **and** the role/permission server-side
(never client-only), and all SQL is `?`-parameterized.

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/tasks/[id]/comment` | POST | Add a comment (JSON) |
| `/api/tasks/[id]/update` | POST | Progress / blocker / locked-field update (JSON) |
| `/api/tasks/[id]/close` | POST | Closure flow: comment + evidence/skip (multipart) |
| `/api/tasks/[id]/delete-request` | POST | Employee requests deletion (JSON) |
| `/api/tasks/[id]/attachments` | POST | Upload attachment (multipart, ext+MIME+10 MB) |
| `/api/tasks/[id]/attachments/[attachmentId]` | GET | Stream attachment BLOB (RFC 5987 name) |
| `/admin/users/api` | POST | User management actions (admin) |
| `/manager/requests/api` | POST | Approve/reject delete requests (manager+) |

### Upload validation

`src/lib/taskUpdates.ts` — a file passes only when **all** hold:

- **Extension** is in the allowlist (pdf, png, jpg, jpeg, gif, webp, txt, md,
  csv, json, log, xml, sql, xlsx, xls, docx, doc, pptx, ppt, zip).
- **MIME type** matches the extension's accepted set (no renamed executables).
- **Size** ≤ **10 MB** (`MAX_UPLOAD_BYTES`).

File names are sanitized (basename only, control characters stripped).

### Dashboard (`/dashboard`)

Manager/supervisor/admin only (employees are redirected with a flash).
Read-only parameterized queries in `src/lib/dashboard.ts`:

- **KPIs**: Total, 🔴 Not started, 🟡 In progress, 🟠 On hold, 🟢 Completed,
  ⚠️ Overdue (`due_date < today AND status != 'completed'`).
- **Charts** (pure SVG, no library): donut by status, stacked bar per
  employee, line of completions per week (last 8 weeks, Monday-aligned).
- **Tables**: overdue tasks + recently completed.
- **Filters**: created-date range, assignee, priority — every widget shares the
  same WHERE clause; invalid values are dropped with a flash.

### Delete requests (`/manager/requests`)

Employees submit requests (`DeleteRequestDialog`), managers/admins approve
(hard delete) or reject (task untouched). Requests survive the task deletion
as the audit record. E2E: `scripts/e2e-delete-request.mjs`.

## Status colors

The whole app uses one consistent scheme (`src/lib/format.ts` +
`src/components/StatusBadge.astro` + `src/lib/dashboard.ts`):

| Status | Color | Emoji |
| --- | --- | --- |
| Not started | 🔴 red | 🔴 |
| In progress | 🟡 amber | 🟡 |
| On hold | 🟠 orange | 🟠 |
| Completed | 🟢 green | 🟢 |

Overdue tasks show their due date in **red** (lists, details, dashboard).

## Environment

- Node **20+**
- `ADMIN_DEFAULT_PASSWORD` — seed password (default `admin123`, warns if unset)
- `QC_DB_PATH` — absolute path to an alternate SQLite database
- `SEED_DEMO=1` — seed demo team + 12 tasks on an empty DB

## Scripts (`pnpm --filter qc-task-manager …`)

| Script | What it does |
| --- | --- |
| `dev` | Astro dev server on port 4321 |
| `build` | Production SSR build (`dist/server/entry.mjs`) |
| `start` | `node ./dist/server/entry.mjs` |
| `typecheck` | `astro check` |
| `db:init` | Apply schema + seed roles |
| `db:reset` | Wipe + re-init (`--reset`) |

### E2E scripts

```bash
# delete-request workflow (33 assertions) — run from the app directory:
QC_DB_PATH=$(pwd)/db/e2e_test.db node scripts/init-db.mjs
QC_DB_PATH=$(pwd)/db/e2e_test.db PORT=4322 node dist/server/entry.mjs &
QC_DB_PATH=$(pwd)/db/e2e_test.db BASE_URL=http://localhost:4322 node scripts/e2e-delete-request.mjs
# …then kill the server and remove db/e2e_test.db*

# dashboard (29 assertions): same pattern, scripts/e2e-dashboard.mjs
```

## Notes

- The DB file is gitignored and never committed.
- Status colors, overdue logic, and field-locking rules are centralized
  (`format.ts`, `permissions.ts`, `taskUpdates.ts`) so pages can't drift.
- Security headers are applied by the middleware to every response, including
  redirects and API JSON.

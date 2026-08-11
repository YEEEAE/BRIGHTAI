# QC Task Manager

Internal task-tracking web app for the **QC department**. It covers the full
workflow: user management → task creation → employee progress updates →
status lifecycle (strict transitions + blocker notes + started tracking) →
completion wizard (evidence + mandatory comment, one transaction) →
analytics dashboard.

Built with **Astro (SSR)** + **React islands** + **Tailwind CSS**, backed by
**SQLite** (`better-sqlite3`) with **bcryptjs** password hashing and **Zod**
server-side validation. Runs locally on port 4321.

---

## What the app does

- **Role-based access**: `admin`, `manager`, `supervisor`, `employee` — each
  lands on their own home page after login.
- **Status lifecycle**: `not_started` → `in_progress` → `on_hold` →
  `completed` (or `cancelled`). Strict transitions: entering `on_hold`
  **requires a blocker note**; `completed` and `cancelled` are read-only;
  `completed` can be reopened only by admin/manager; `cancelled` requires
  manager/admin approval. The first `in_progress` stamps `started_at` and
  logs `task_started`.
- **Completion wizard** (3 steps, one server transaction): evidence upload
  (PDF/PNG/JPG/JPEG/XLSX/DOCX, ≤ 10 MB, extension + MIME + magic-byte
  validation, skippable with a logged `evidence_skipped`) → mandatory
  completion comment (flagged `is_completion_comment = 1`) → confirmation.
  On success the task becomes read-only and the creator/manager/supervisor
  are notified. Cancelling the wizard saves nothing.
- **Full task model** (shared create + edit): title, description, department,
  priority (**low / medium / high / urgent**), assignee, due date,
  **recurrence** (daily / weekly / monthly + end date), **checklist items**,
  and **dependencies** — with recurring series that spawn the next occurrence
  on completion (never up front) and a dependency gate that blocks
  In Progress until every dependency is complete.
- **Field locking** (CORE RULE #2): employees may only change
  status / progress / comments / attachments / blocker notes. Title,
  description, department, assignee, due date, priority, recurrence, and
  checklist/dependency management are locked for employees and editable by
  supervisor/manager/admin only.
- **Urgent tasks are visually prominent**: solid-red priority pill plus a
  highlighted row in every task list.
- **Comments + attachments**: threads per task; files are stored **inside the
  database as BLOBs** (CORE RULE #5) with extension + MIME + 10 MB validation.
- **Delete requests** (CORE RULE #4): employees cannot delete — they request,
  a manager/admin approves or rejects.
- **Dashboard**: 9 KPI cards, 6 pure-SVG charts (status donut, priority bars,
  per-employee stacked bars, overdue-by-employee bars, completed-per-week line,
  completion-rate-vs-previous-period card), 5 tables (most overdue, current
  blockers, recently completed, completed without evidence, latest activity),
  and 8 filters (range preset / custom range / assignee / priority / status /
  overdue-only) with loading + error states.
- **Notifications** (`/notifications` + navbar bell dropdown): persisted
  alerts for assignment, due-date / priority changes, comments, blockers,
  completions, deletion requests, reopens, and recurring tasks — with
  read/unread state (mark one or all), task links, and a live badge; inactive
  users are never notified.
- **CSV export**: `/api/export/tasks.csv` (role-scoped, Excel-friendly).
- **Activity log** (CORE RULE #6): every mutation is recorded with who/what/
  old/new/timestamp.

## Roles & permissions

| Capability                 | admin | manager | supervisor | employee |
| -------------------------- | :---: | :-----: | :--------: | :------: |
| View dashboard            | ✅ | ✅ | ✅ | ❌ |
| Manage users (`/admin/users`) | ✅ | ❌ | ❌ | ❌ |
| Create / edit / delete tasks | ✅ | ✅ | create/edit (no direct delete) | only if `can_create_tasks = 1` |
| Assign tasks              | ✅ | ✅ | only active **QC employees** | self / unassigned only |
| Edit locked fields (title, description, department, assignee, due date, priority, recurrence, checklist, dependencies) | ✅ | ✅ | ✅ | ❌ |
| Edit status / progress / blocker / comments / attachments | ✅ | ✅ | ✅ | ✅ (own/created tasks) |
| Complete a task (closure flow) | ✅ | ✅ | ✅ | ✅ (own/created tasks) |
| Submit deletion requests  | ❌ | ❌ | ❌ | ✅ |
| Approve / reject deletion requests | ✅ | ✅ | ❌ | ❌ |
| View any task             | ✅ | ✅ | ✅ | assigned/created only |
| View task details page    | ✅ | ✅ | ✅ | ✅ (own/created) |

Completed **and cancelled** tasks are **read-only for everyone** (CORE RULE
#3). `completed` may be reopened to `in_progress` by admin/manager only;
`cancelled` is terminal (cleanup via the approved deletion workflow).

All checks live in one place: `src/lib/permissions.ts`.

## Quick start

From the **monorepo root** (the package is `@brightai/qc-task-manager`):

```bash
pnpm install                                   # install (better-sqlite3 needs build tools)
pnpm --filter @brightai/qc-task-manager db:seed   # create db/qc_tasks.db + seed roles
pnpm --filter @brightai/qc-task-manager dev   # http://localhost:4321
```

Open <http://localhost:4321/login> and sign in.

### Production build & start

```bash
NODE_ENV=production pnpm --filter @brightai/qc-task-manager build
# then, from the app directory:
cd apps/qc-task-manager && node dist/server/entry.mjs     # serves on PORT (default 4321)
```

> ⚠️ **Build with `NODE_ENV=production`.** Astro compiles
> `import.meta.env.PROD` at build time from the shell's `NODE_ENV`. If the
> shell exports `NODE_ENV=development` (some local setups do), a plain
> `pnpm build` produces `PROD: false` and the session cookie **loses the
> `Secure` flag**. CI/CD sets `NODE_ENV=production` automatically; locally,
> prefix the build command above.

The standalone server respects `PORT` / `HOST` env vars (default `4321` /
`0.0.0.0`). Set `QC_DATABASE_PATH` to point at a different database file.

### Demo data (for showing the boss)

Seed a demo team (2 extra employees) + **12 tasks in mixed statuses**
(overdue, in progress, on hold, completed with closure comments) on a fresh DB:

```bash
SEED_DEMO=1 pnpm --filter @brightai/qc-task-manager db:init --reset
SEED_DEMO=1 pnpm --filter @brightai/qc-task-manager dev
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
ADMIN_DEFAULT_PASSWORD='a-strong-password' SEED_DEMO=1 pnpm --filter @brightai/qc-task-manager db:init --reset
```

> ⚠️ Changing `ADMIN_DEFAULT_PASSWORD` does **not** update existing accounts —
> the seed only runs when `users` is empty. Use `db:init --reset` on a fresh DB,
> or change individual passwords from `/admin/users` (reset password action).

The server logs a warning when the default `admin123` is in use.

## Database

- **Location**: `apps/qc-task-manager/db/qc_tasks.db` (created on first boot;
  WAL mode + `foreign_keys = ON`).
- The file (`*.db`, `*.db-wal`, `*.db-shm`) is gitignored and never committed.
- Override the path with `QC_DATABASE_PATH=/absolute/path.db` (the legacy
  `QC_DB_PATH` alias is still accepted).
- **Automatic backups**: the server creates a consistent SQLite backup at
  02:00 `Asia/Riyadh` every day, and runs a catch-up backup after startup when
  the current Riyadh day has no successful backup. Manual backups are available
  to admins from `/admin/settings` or `pnpm --filter @brightai/qc-task-manager db:backup`.
  Files are written to `db/backups/qc_tasks-YYYY-MM-DD-HHmmss.db`; only the
  latest 14 are retained. The implementation uses SQLite's Online Backup API,
  never copies a WAL or SHM file, and stores backup status beside the files.
  Backup directories are outside `public/`, ignored by Git, and must be on a
  protected persistent volume in production. Never set `QC_DATABASE_PATH` to a
  static/public directory.

  The live HTTP checks are available as `scripts/e2e-backup.mjs`; run them
  against a built server and the same absolute `QC_DATABASE_PATH`.
- Schema: `db/schema.sql` — **12 tables** (users, tasks, task_comments,
  task_attachments, task_activity_log, task_delete_requests, task_checklists,
  task_dependencies, notifications, sessions, login_attempts, saved_filters),
  idempotent (`CREATE TABLE IF NOT EXISTS`), applied on every boot with
  `PRAGMA journal_mode = WAL` + `PRAGMA foreign_keys = ON`.
- **Referential-integrity policy** in the schema: `ON DELETE CASCADE` only for
  child records (comments/attachments/activity/checklists/dependencies of a
  task; sessions/notifications/saved filters of a user); `RESTRICT` for
  audit-critical user references (task creator, commenter, uploader, actor);
  `SET NULL` for optional references (assignee, completer, reviewer, …).
- **Migrations**: `src/lib/db.ts` upgrades existing databases to the 12-table
  shape on boot (new columns via `ALTER TABLE` + a rebuild of
  `task_delete_requests` into the CASCADE shape) before `schema.sql` runs.
  `scripts/init-db.mjs` runs the **same migrations** before applying
  `schema.sql`, so `pnpm db:init` also upgrades existing databases instead of
  failing on the new indexes.
  > ⚠️ **Never run `db/schema.sql` directly against an existing database**
  > (e.g. pasting it into SQLTools): `CREATE TABLE IF NOT EXISTS` keeps old
  > table shapes, so the new `CREATE INDEX` statements fail with
  > `SQLITE_ERROR: no such column: <name>` (e.g. `recurrence`). To upgrade an
  > old DB, run `pnpm db:init` once (non-destructive `ADD COLUMN`s — data is
  > kept) or simply boot the app.
  Note: `ALTER TABLE ADD COLUMN` cannot change CHECK constraints or make
  columns NOT NULL, so migrated databases keep the legacy `tasks.status` /
  `tasks.priority` CHECKs (no `'cancelled'`/`'urgent'`) and nullable
  `task_attachments.mime_type`/`file_size` — fresh databases get the full
  spec shape. The DB also accepts `'cancelled'`/`'urgent'` while
  `src/lib/task-policy.ts` now validates all **5 statuses** (incl.
  `cancelled`) and all 4 priorities — the legacy CHECK constraints simply
  can't be altered, so migrated DBs stay looser than the app layer.
- Seed: `src/lib/seed.ts` (runtime) + `scripts/init-db.mjs` (CLI).

### Inspect it with SQLTools (VS Code)

Walkthrough for browsing `qc_tasks.db` directly from VS Code:

1. **Install SQLTools** — open the Extensions panel (`⇧⌘X`) and search for
   **SQLTools** (`mtxr.sqltools`), then click **Install**.
2. **Install the SQLite driver** — search for **SQLTools SQLite**
   (**`mtxr.sqltools-driver-sqlite`**) and install it too. SQLTools needs a
   per-database driver; without it the connection below won't list.
3. **Open the repository root in VS Code** — the connection is relative to
   the workspace folder (`${workspaceFolder}/apps/qc-task-manager/db/...`),
   so the monorepo root must be the open folder.
4. **Start the app once** so the database file is generated:

   ```bash
   pnpm --filter @brightai/qc-task-manager db:init
   # or: pnpm --filter @brightai/qc-task-manager dev  → then open /login and log in once
   ```

   This creates `apps/qc-task-manager/db/qc_tasks.db` (plus `-wal`/`-shm`
   sidecar files while the server is running) and seeds the initial accounts.
   Note the dev server only opens the database on its first real request —
   an anonymous visit to `/login` alone isn't enough; log in once (any
   seeded account) or use `db:init` above.
5. **Connect using SQLTools** — a ready-made connection is generated locally
   at `apps/qc-task-manager/.vscode/settings.json` (the `.vscode/` folder is
   gitignored, so on a fresh clone paste the snippet below manually):

   ```jsonc
   {
     "sqltools.connections": [
       {
         "name": "QC Tasks DB",
         "driver": "SQLite",
         "database": "${workspaceFolder}/apps/qc-task-manager/db/qc_tasks.db",
         "previewLimit": 100
       }
     ]
   }
   ```

   Open the **SQLTools** icon in the sidebar and click the **QC Tasks DB**
   connection (or `Database: Connect` from the command palette). If you'd
   rather not use the workspace file, create the connection manually with
   those same values — connection name **`QC Tasks DB`**, driver **SQLite**,*
   database file **`${workspaceFolder}/apps/qc-task-manager/db/qc_tasks.db`**.
6. **Browse the tables** — click the connected database to expand the table
   list (users, tasks, task_comments, …). Right-click a table and pick
   **Show Table Data** to inspect rows, or use the **New Query** button to
   open a SQL scratchpad.
7. **Run sample queries** — paste one of these into a query tab and press
   `⌘⏎` / `Ctrl+Enter`:

   ```sql
   -- Every user-facing table
   SELECT name FROM sqlite_master
   WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name;

   -- Seeded accounts
   SELECT username, full_name, role, department, is_active, created_at
   FROM users ORDER BY role;

   -- Task status breakdown
   SELECT status, COUNT(*) AS n FROM tasks GROUP BY status ORDER BY n DESC;

   -- Open tasks that are overdue
   SELECT id, title, status, due_date, assigned_to
   FROM tasks
   WHERE status NOT IN ('completed', 'cancelled') AND due_date < date('now')
   ORDER BY due_date;
   ```

   > Note: the SQLite driver field is named `database` (it stores the `.db`
   > file path); older driver versions may show it as `databaseFile`.
   > SQLTools reads the live database — run queries while the app is stopped
   > if you want a clean view without the WAL sidecar.

## Auth & sessions

- Opaque `randomUUID()` tokens stored server-side in the `sessions` table; the
  browser only holds the token in an `HttpOnly` cookie (`qc_session`).
- Session TTL: **12 hours**. Expired rows are purged on login and at startup.
- Cookie flags: `HttpOnly` + `SameSite=Lax` + `Secure` (production) + `Path=/`.
- **Account lockout** (brute-force protection): after **5 consecutive failed
  login attempts** the account is **locked for 10 minutes** (`users.locked_until`)
  and even the correct password is rejected until the lock expires. A
  successful login (or lock expiry) resets the counter. Every attempt is
  audited in the `login_attempts` table (username + IP + outcome, never the
  password). Admin can unblock a locked account by **resetting the password**
  or **reactivating** it from `/admin/users`.
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
│   ├── schema.sql          # 12 tables (idempotent, WAL + FK guards)
│   ├── seed.sql            # reference seed (authoritative seed is in src/lib/seed.ts)
│   ├── backups/            # `pnpm db:backup` output (gitignored, .gitkeep kept)
│   └── qc_tasks.db         # generated at runtime (gitignored)
├── docs/ARCHITECTURE.md    # architecture + operations reference
├── public/                 # static assets (favicons, images, …)
├── scripts/
│   ├── init-db.mjs         # CLI: schema + seed (+ SEED_DEMO support)
│   ├── backup-db.mjs       # CLI: `db:backup` (mirrors src/lib/backup.ts)
│   ├── test.mjs            # `pnpm test`: structure + unit smoke
│   ├── e2e-delete-request.mjs
│   ├── e2e-dashboard.mjs
│   ├── e2e-auth-lockout.mjs
│   ├── e2e-admin-users.mjs # /admin/users: CRUD, guards, Zod, last login
│   ├── e2e-acceptance.mjs  # isolated runner for the complete E2E acceptance surface
│   ├── e2e-task-shared.mjs # full task model: fields, roles, deps, recurring + status lifecycle + notifications (193)
│   ├── test-db-rules.mjs   # DB-backed lockout + notification unit checks
│   └── test.mjs            # domain/unit smoke suite
├── src/
│   ├── middleware.ts       # auth + role guards + security headers + login/new-task POSTs
│   ├── layouts/BaseLayout.astro
│   ├── components/
│   │   ├── Navbar.tsx, FlashNotice.astro, StatusBadge.astro, EmptyState.astro
│   │   ├── CommentBox.tsx, DeleteRequestDialog.tsx
│   │   ├── NewTaskForm.astro, TaskChecklistInput.tsx, TaskDependencyInput.tsx
│   │   ├── TaskUpdatePanel.tsx, AttachmentUploader.tsx
│   │   ├── MarkAllReadButton.tsx, MarkReadButton.tsx  # mark all / mark one as read
│   │   ├── TaskLifecycle.tsx   # 3-step completion wizard + cancel dialog + reopen
│   │   └── DashboardCharts.tsx
│   ├── lib/
│   │   ├── db.ts           # SQLite singleton (WAL) + migrations + cleanup
│   │   ├── auth.ts         # bcrypt + sessions (12h TTL, randomUUID)
│   │   ├── session.ts      # cookie helpers + handleLoginPost
│   │   ├── permissions.ts  # single source of truth for role checks
│   │   ├── task-policy.ts  # canonical domain rules (statuses, limits, locks, uploads)
│   │   ├── validation.ts   # Zod schemas for every server input
│   │   ├── recurrence.ts   # next-due-date + occurrence gating (pure)
│   │   ├── notifications.ts# persisted + derived in-app alerts (bell, page, read state)
│   │   ├── backup.ts       # programmatic SQLite backup (createBackup)
│   │   ├── export.ts       # CSV export (tasksToCsv + exportTasksForRole)
│   │   ├── flash.ts, format.ts, types.ts
│   │   ├── activity.ts     # task_activity_log helper
│   │   ├── tasks.ts        # task creation (all fields) + assignment validation
│   │   ├── taskUpdates.ts  # update + closure + recurring + dependencies + upload
│   │   ├── taskDetails.ts  # read queries + access rule + activity text
│   │   ├── users.ts        # admin user management
│   │   ├── deleteRequests.ts
│   │   ├── dashboard.ts    # KPI / charts / tables queries
│   │   └── seed.ts         # role seed + SEED_DEMO data
│   ├── types/              # re-export shim for the shared types
│   └── pages/
│       ├── index.astro, login.astro, logout.ts, dashboard.astro
│       ├── notifications.astro
│       ├── tasks/[id].astro
│       ├── api/tasks/[id]/{comment.ts, update.ts, close.ts, cancel.ts, reopen.ts, delete-request.ts}
│       ├── api/tasks/[id]/attachments/{index.ts, [attachmentId].ts}
│       ├── api/export/tasks.csv.ts
│       ├── api/notifications/read-all.ts
│       ├── api/notifications/[id]/read.ts
│       ├── employee/ manager/ supervisor/ admin/
│       └── manager/requests/
├── astro.config.mjs        # SSR + @astrojs/node standalone, port 4321
├── tailwind.config.mjs
└── package.json            # name: @brightai/qc-task-manager
```

## Pages & flows

### Admin — user management (`/admin/users`)

Admin-only user management, fully server-side validated (Zod):

- **List** every user: username, full name, role badge, department,
  `can_create_tasks`, active status, created date, and **last login**.
- **Create** users (username unique, password ≥ 8 chars, role, department
  defaulting to **QC**, `can_create_tasks`). New accounts are inserted
  directly into SQLite as **active**, so they can sign in immediately.
- **Edit** a user: full name, role, department, `can_create_tasks`, active
  status. Username is **immutable** — there is no update path for it.
- **Reset password** (also clears any brute-force lock — the sanctioned
  unblock).
- **Activate / deactivate** (quick toggle) and **toggle `can_create_tasks`**
  for employees.
- An admin can **never deactivate or demote their own account** (enforced in
  the UI and in `src/lib/users.ts`; benign self-edits like changing one's own
  full name still work). Reactivation — via the toggle or the edit form —
  clears the brute-force lock so the account is usable immediately.
- Deactivated accounts get a dedicated "This account has been disabled."
  login message.
- Password hashes are never selected, rendered, or logged. Actions are
  console-audited (`[users] …` with actor + target + changed fields), never
  written to the task log. Duplicate usernames and validation failures return
  safe, user-friendly flash messages.

E2E: `scripts/e2e-admin-users.mjs` (49 assertions).

### Task creation (`/manager/new`, `/supervisor/new`, `/employee/new`)

One shared form (`src/components/NewTaskForm.astro`) powers all three pages:

- **Fields**: title, description, department (default `QC`), assignee,
  priority (**incl. urgent**), due date, recurrence (+ end date), checklist
  items (dynamic add/remove), and dependencies (supervisor/manager/admin
  only).
- Manager/admin assign to **any active user**; **supervisors assign only to
  active QC employees** (role `employee`, enforced server-side); employees
  assign **only to themselves** or leave unassigned.
- `/employee/new` is gated by `can_create_tasks` on GET **and** POST.
- A task with an assignee immediately creates an **in-app notification** for
  that assignee.
- Every creation logs `task_created` (+ `checklist_item_added` /
  `dependency_added` entries) — all inside one transaction.

### Recurring tasks

A task with `recurrence ≠ none` never spawns work up front — the **next
occurrence is created only when the current task is completed** (in
`closeTask`, same transaction):

- Created only if `next due date <= recurrence_end_date` (or the end date is
  null). The end date is **inclusive**, so a series can never run past it —
  no endless tasks.
- The next task is linked via `parent_recurring_task_id` and copies title,
  description, department, priority, assignee, recurrence, and the checklist
  **template** (titles + order, all unchecked).
- Comments, evidence/attachments, activity logs, and completion metadata are
  **not** copied.
- The creation is recorded in the activity log on both sides of the series,
  and the assignee gets an in-app notification.

### Dependencies

- A task **cannot move to In Progress while any dependency is incomplete**
  (a dependency is blocking unless it is `completed`/`cancelled`).
- Blocking dependencies are shown clearly on the task page (red callout with
  links) and in the update panel.
- **Admin/manager may override** a block only with an explicit reason; the
  override (blocked tasks + reason) is logged as `dependency_override`.
  Supervisors cannot override.
- Dependency cycles are rejected at creation/editing (depth-limited check).

### Task details + editing (`/tasks/[id]`)

Every task can carry an optional QC checklist. The details editor shows live
`completed / total` and percentage progress, lets permitted employees toggle
items, and lets managers/admins reorder or change the structure. Supervisors
can change structure only for tasks they created or supervise (assigned to
them). Every add/remove/toggle/reorder and completion override is written to
`task_activity_log`. Completion is blocked while checklist items are open;
managers/admins may supply a bounded reason to override the gate.

The following nullable QC metadata is available without migrating existing
task data: inspection type, finding classification, risk level, corrective
action required, reference number, and audit batch/work-order number.

Server-rendered sections: header (status/priority badges, progress, due date,
assignee, department, recurrence + series parent, creator), blocker note,
blocking-dependencies callout, checklist, dependencies, comments thread,
attachments, activity timeline, and closure info. Two React islands provide
editing:

- **`TaskLifecycle`** — the **3-step completion wizard** (evidence →
  comment → confirmation), the **cancel dialog** (manager/admin, with a
  reason) and the **reopen button** (admin/manager, on completed tasks).
  Cancelling the wizard before confirmation saves nothing.
- **`TaskUpdatePanel`** — update progress (status / % / blocker) for any
  editor; edit locked fields (title/description/department/assignee/due
  date/priority/recurrence) for supervisor/manager/admin; manage the
  checklist (any editor toggles items, supervisor+ adds/removes) and
  dependencies (supervisor+); show the dependency-override reason box for
  admin/manager. Moving a task to **On hold** surfaces the mandatory
  blocker-note hint.
- **`AttachmentUploader`** — upload a file with client-side + server-side
  validation, loading state, and inline errors.

Editing a task also **notifies the relevant people**: an assignment
notification on assign/reassign (to the new assignee), a notification when the
due date changes or the priority **escalates to high/urgent** (downgrades stay
silent), and a **blocker-added** notification to the assignee + creator
(excluding whoever typed it). All of these go to the NEW assignee if the same
request also reassigns the task.

**Status lifecycle** (server-enforced in `src/lib/task-policy.ts` +
`src/lib/taskUpdates.ts`):

- `not_started → in_progress` — the first entry stamps `started_at` and logs
  `task_started` (never re-stamped on resume).
- `→ on_hold` — **requires a blocker note** (both from `not_started` and
  `in_progress`); `on_hold → in_progress` resumes work.
- `→ completed` — only through the **completion wizard**; `status=cancelled`
  via the update form is rejected.
- `→ cancelled` — manager/admin approval with a reason (dedicated
  `/cancel` endpoint, logged `task_cancelled` + `cancelled_at`/`cancelled_by`).

**Completion wizard** (CORE RULE #3, atomic server-side — one transaction).
Any editor may complete a task — an employee on their own/assigned tasks, or
supervisor/manager/admin on any task:

1. **Evidence step** — upload one or more files (PDF/PNG/JPG/JPEG/XLSX/DOCX,
   ≤ 10 MB each, extension + MIME + **magic-byte signature** validation), or
   press **Skip** (recorded as `evidence_skipped`).
2. **Completion comment** — **mandatory**, stored flagged
   `is_completion_comment = 1` (pinned at the top of the thread).
3. **Confirmation summary** — then the single transaction writes evidence
   BLOBs, the comment, `status = 'completed'`, `progress = 100`,
   `completed_at`, `completed_by`, activity entries, and notifies the task
   creator + all managers/supervisors (completer excluded).

After completion the task is **read-only**; admin/manager can **reopen** it to
`in_progress` (completion metadata cleared, comment unflagged, `task_reopened`
logged). After cancellation it is read-only and terminal.

### API endpoints

All endpoints re-check the session **and** the role/permission server-side
(never client-only), and all SQL is `?`-parameterized.

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/tasks/[id]/comment` | POST | Add a comment (JSON) |
| `/api/tasks/[id]/update` | POST | Progress / blocker / locked-field update (JSON) |
| `/api/tasks/[id]/close` | POST | Completion wizard: comment + evidence/skip (multipart) |
| `/api/tasks/[id]/cancel` | POST | Cancel a task (manager/admin, reason required) |
| `/api/tasks/[id]/reopen` | POST | Reopen a completed task (admin/manager only) |
| `/api/tasks/[id]/delete-request` | POST | Employee requests deletion (JSON) |
| `/api/tasks/[id]/attachments` | POST | Upload attachment (multipart, ext+MIME+10 MB) |
| `/api/tasks/[id]/attachments/[attachmentId]` | GET | Stream attachment BLOB (RFC 5987 name) |
| `/api/notifications/read-all` | POST | Mark all persisted notifications as read |
| `/api/notifications/[id]/read` | POST | Mark ONE persisted notification as read (owner only) |
| `/admin/users/api` | POST | User management actions (admin) |
| `/manager/requests/api` | POST | Approve (confirmed) / reject (optional reason) a delete request (manager+) |
| `/api/export/tasks.csv` | GET | Download tasks as CSV (role-scoped, attachment) |

### Upload validation

`src/lib/taskUpdates.ts` — a file passes only when **all** hold:

- **Extension** is in the allowlist (pdf, png, jpg, jpeg, gif, webp, txt, md,
  csv, json, log, xml, sql, xlsx, xls, docx, doc, pptx, ppt, zip).
- **MIME type** matches the extension's accepted set (no renamed executables).
- **Size** ≤ **10 MB** (`MAX_UPLOAD_BYTES`).

File names are sanitized (basename only, control characters stripped).

**Evidence files** (completion wizard) are stricter: a smaller allowlist
(**pdf, png, jpg, jpeg, xlsx, docx**), the same 10 MB cap, **and** a magic-byte
signature check (`%PDF-`, PNG header, JPEG SOI, ZIP PK for xlsx/docx) — a
renamed file with the right extension and MIME is still rejected.

### Dashboard (`/dashboard`)

Task rows and the dashboard include QC checklist progress. The dashboard's
`QC checklist completion` card is scoped by the active filters and reports
completed versus total checklist items; tasks with no checklist contribute zero
items and do not force legacy tasks to adopt metadata.

Manager/supervisor/admin only (employees are redirected to `/employee` with a
flash — CORE BUSINESS RULE #1). Read-only, fully parameterized queries in
`src/lib/dashboard.ts`; filters scope every widget through the same WHERE clause.

- **KPIs (9)**: 📋 Total, 🔴 Not started, 🟡 In progress, 🟠 On hold, 🟢
  Completed, ⚠️ Overdue (`due_date < today AND status NOT IN ('completed',
  'cancelled')`), 🚨 Urgent open (`priority = 'urgent'` AND not
  completed/cancelled), 📎 Completed without evidence (no `is_evidence = 1`
  attachment), ⏱️ Average completion time (AVG of `completed_at − started_at`).
- **Charts (6, pure SVG/HTML — no library)**: donut by status, horizontal bars
  by priority, stacked bars per employee (with an Unassigned bucket), red
  horizontal bars for overdue-by-employee, line of completions per week (last 8
  weeks, Monday-aligned), and a completion-rate-vs-previous-period card (current
  %, delta in percentage points, progress bar).
- **Tables (5)**: most overdue tasks, current blockers (status = on_hold),
  recently completed, completed without evidence, latest activity feed (20 most
  recent events from `task_activity_log`).
- **Filters (8)**: range preset (Today / This week / This month / Custom
  range…), custom created-from / created-to dates, assignee, priority, status,
  and an Overdue-only switch. Range presets resolve to local-calendar windows;
  custom date fields appear only when "Custom range…" is selected.
- **States**: every widget has an empty state; a full-screen loading overlay
  appears on filter submit (CSP-safe Astro `<script>`); a top-level try/catch
  renders a friendly error banner instead of a 500 if any query fails.

E2E: `scripts/e2e-dashboard.mjs` (45 assertions).

### Delete requests (`/manager/requests`)

Employees submit requests (`DeleteRequestDialog`), managers/admins approve
(hard delete) or reject (task untouched). Per the production schema the
request row is a child of its task (`task_id … ON DELETE CASCADE`): approving
hard-deletes the task **and** the request row together, and rejecting keeps the
task with the rejected request visible in history (titles are joined live from
`tasks`).

Review is guarded (`ReviewDeleteRequestDialog` island):

- **Approval requires confirmation** — the reviewer clicks Approve, a dialog
  spells out that the task, its comments, attachments and activity history
  will be **permanently deleted**, and nothing is sent to the server until
  they confirm.
- **Rejection may include a reason** — the reviewer can type an optional note
  in the dialog. It is persisted on the request row (`review_note`), shown in
  the history list, carried by the `delete_rejected` activity entry, and
  included in the requester's notification message.

E2E: `scripts/e2e-delete-request.mjs`.

### Notifications (bell + `/notifications`)

Every role gets a **bell icon** in the navbar with a live unread badge. Clicking
it opens a **dropdown** of the latest persisted notifications (unread first,
with dots; clicking an item marks it read and opens it); it closes on outside
click / `Escape`. The full **Notifications** page (`/notifications`) groups the
same alerts and adds per-item **Mark as read** buttons. Two sources are merged
(`src/lib/notifications.ts`):

- **Persisted** (the `notifications` table, `is_read` flag) — explicit alerts
  written when the app must notify someone:
  - **task assigned / reassigned** → the (new) assignee;
  - **due date changed** → the assignee;
  - **priority escalated to high/urgent** → the assignee (downgrades silent);
  - **comment added** → assignee + creator (commenter excluded);
  - **blocker note added** → assignee + creator (author excluded);
  - **task completed** → creator + every active manager/supervisor (completer
    excluded);
  - **deletion request submitted** → every active manager/admin;
  - **deletion request approved / rejected** → the requester (an approved
    task is deleted, so its link falls back to the notifications page);
  - **task reopened** → assignee + creator (the admin/manager who reopened it
    is excluded);
  - **next recurring task created** → the assignee.
  Each carries a `task_id` link when the task still exists. **Inactive users
  are never notified** (checked centrally in `createNotification`). Mark one
  as read (`/api/notifications/[id]/read`) or all as read
  (`/api/notifications/read-all`).
- **Derived** — computed from existing data: **🚨 Overdue**, **📅 Due soon**,
  **⏳ Not started** (stale > 2 days). These have no read state.

Employees only see their own/created tasks; supervisors+ see the whole team.
Alerts sort by severity (danger → warning → info → success) and link straight
to the task. The bell badge counts unread persisted alerts + the derived ones.

### CSV export (`/api/export/tasks.csv`)

Any authenticated role can download the task list as CSV (`src/lib/export.ts`):
employees get their own/created tasks, supervisors+ get everything. The file
has a UTF-8 BOM (Excel-friendly) and RFC-4180-style escaping.

### Server-side validation (Zod)

All server input is validated with **Zod** in `src/lib/validation.ts` (login,
task creation, comments, delete-request reasons, user creation, password
reset). Endpoints call `parseFormData(schema, form)` and return the first
user-facing message; limits and enums come from `src/lib/task-policy.ts` so the
schemas can never drift from the business rules.

## Status colors

The whole app uses one consistent scheme (`src/lib/format.ts` +
`src/components/StatusBadge.astro` + `src/lib/dashboard.ts`):

| Status | Color | Emoji |
| --- | --- | --- |
| Not started | 🔴 red | 🔴 |
| In progress | 🟡 amber | 🟡 |
| On hold | 🟠 orange | 🟠 |
| Completed | 🟢 green | 🟢 |
| Cancelled | ⚪ slate | ✖️ |

Overdue tasks show their due date in **red** (lists, details, dashboard).

## Environment

- Node **20+**
- `ADMIN_DEFAULT_PASSWORD` — seed password (default `admin123`, warns if unset)
- `QC_DATABASE_PATH` — absolute path to an alternate SQLite database
  (`QC_DB_PATH` accepted as a legacy alias)
- `QC_BACKUP_DIR` — backup output directory for `db:backup` (default `<app>/db/backups`)
- `SEED_DEMO=1` — seed demo team + 12 tasks on an empty DB

## Scripts (`pnpm --filter @brightai/qc-task-manager …`)

| Script | What it does |
| --- | --- |
| `dev` | Astro dev server on port 4321 |
| `build` | Production SSR build (`dist/server/entry.mjs`) |
| `start` | `node ./dist/server/entry.mjs` |
| `preview` | `astro preview` |
| `typecheck` | `astro check` |
| `test` | Domain and DB-backed unit checks: structure, validation, policy, permissions, overdue, recurrence, dependencies, uploads, lockout, notifications, CSV, backup, and migrations |
| `e2e:acceptance` | Build QC and run every live acceptance suite against isolated temporary SQLite DBs and ports |
| `db:init` | Apply schema + seed roles |
| `db:reset` | Wipe + re-init (`--reset`) |
| `db:seed` | Same as `db:init` (alias for the spec name) |
| `db:backup` | Snapshot the DB into `db/backups/` (keeps last 14, `--keep=N` to override) |

### Backups

```bash
pnpm --filter @brightai/qc-task-manager db:backup
# → db/backups/qc_tasks-<YYYYMMDD-HHMMSS>.db (better-sqlite3 online backup, WAL-safe)
```

Backups land in `db/backups/` (gitignored — the folder is kept via `.gitkeep`).
Retention defaults to 14 (`--keep=30` to change). `QC_BACKUP_DIR` overrides the
output directory. The same routine is exposed programmatically in
`src/lib/backup.ts` (`createBackup`).

### E2E scripts

For the complete release gate, run the isolated orchestrator:

```bash
pnpm --filter @brightai/qc-task-manager e2e:acceptance
```

It runs admin users, authentication/logout + lockout, the shared task model,
deletion requests, dashboard access/data, and backup integrity. The full
manual sign-off matrix is in
[`docs/ACCEPTANCE-CHECKLIST.md`](./docs/ACCEPTANCE-CHECKLIST.md).

```bash
# delete-request workflow (39 assertions) — run from the app directory:
QC_DB_PATH=$(pwd)/db/e2e_test.db node scripts/init-db.mjs
QC_DB_PATH=$(pwd)/db/e2e_test.db PORT=4322 node dist/server/entry.mjs &
QC_DB_PATH=$(pwd)/db/e2e_test.db BASE_URL=http://localhost:4322 node scripts/e2e-delete-request.mjs
# …then kill the server and remove db/e2e_test.db*

# dashboard (45 assertions): same pattern, scripts/e2e-dashboard.mjs
#   (covers the cancelled KPI/donut slice + cancelled-never-overdue rule)
# auth lockout (secure auth hardening): scripts/e2e-auth-lockout.mjs
#   (PORT=4323 — build first so the Secure cookie flag is asserted)
# admin users (49 assertions): scripts/e2e-admin-users.mjs
#   (PORT=4398 — covers last login, department, edit, self-demotion guard,
#    duplicate usernames, Zod errors, reset password, immediate login)
# shared task model (193 assertions): scripts/e2e-task-shared.mjs
#   (PORT=4390 — covers every field on create, supervisor assign scope,
#    employee gating + locked fields, dependency blocking + logged override,
#    assignment/due/priority notifications, recurring series incl. the stop
#    rule, urgent prominence, the status lifecycle: strict transitions
#    + started_at stamping, blocker-required on_hold, the 3-step completion
#    wizard (evidence signatures, multi-file, cancel-saves-nothing), reopen,
#    cancel with reason, read-only completed/cancelled, AND the full
#    notification event set: comment_added / blocker_added / priority
#    escalation-only / delete_requested + reject + approve (task link drops)
#    / task_reopened / mark-one-as-read ownership / bell dropdown open -
#    Escape-close)
#
# Note: GET /login never touches the DB (the schema seeds on the first
# session-bearing request), so E2E scripts that read SQLite directly fire a
# warm-up login POST before opening the DB file.
```

## Notes

- The DB file is gitignored and never committed.
- Status colors, overdue logic, and field-locking rules are centralized
  (`format.ts`, `permissions.ts`, `taskUpdates.ts`) so pages can't drift.
- Security headers are applied by the middleware to every response, including
  redirects and API JSON.

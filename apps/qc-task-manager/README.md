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

## Admin — user management (/admin/users)

Admin-only (middleware guards `/admin/*`); it's also the admin's landing page after login.

- **Create user** (inline form on the page): username (unique), full name, password (min 8),
  role dropdown, and a `can_create_tasks` checkbox (only meaningful for employees). On submit
  the account is inserted with a real bcrypt hash and `is_active = 1`, so it can sign in
  immediately — no activation step needed.
- **Per-user actions**: activate/deactivate, reset password (admin sets the new one), and toggle
  `can_create_tasks` (rendered for employees only — the flag is ignored for other roles).
- **Safety rules** (enforced in `src/lib/users.ts` AND the UI):
  - an admin can never deactivate their own account;
  - a username can never be changed after creation (no update path exists);
  - password hashes are never selected, rendered, or logged.
- **Audit**: user-management actions are NOT task-related, so they are logged to the console as
  `[users] <ISO> actor=<actor>(id=<n>) …` lines — never to `task_activity_log`
  (CORE BUSINESS RULE #6 covers task mutations only).
- **Disabled accounts**: a deactivated user can no longer sign in — the login handler detects the
  state and redirects to `/login?disabled=1`, which shows "This account has been disabled."
  instead of the generic bad-credentials message.

POSTs go to `/admin/users/api` (`src/pages/admin/users/api.ts`), which dispatches on the
`action` form field and redirects back to `/admin/users` with a one-shot flash message.

## Task creation

- `/manager/new`, `/supervisor/new`, `/employee/new` render the new-task form (GET). The POST is short-circuited in `src/middleware.ts` (Astro 6 pages have no named request handlers — same pattern as login) and handled by `handleCreateTaskPost` in `src/lib/tasks.ts`.
- Manager/admin/supervisor may assign the task to **any active user**; employees may assign it **only to themselves or leave it unassigned** (`validateAssignee` in `src/lib/tasks.ts`, per product decision).
- `/employee/new` is gated by `can_create_tasks` on both GET and POST (CORE BUSINESS RULE #1) — an employee without the flag is bounced, and a crafted POST cannot bypass the gate.
- Every created task records a `task_created` row in `task_activity_log` (CORE BUSINESS RULE #6).

## Task details (/tasks/[id])

Read-only task detail page (`src/pages/tasks/[id].astro`), reachable from the task
rows in every role's list view. Server-rendered with a single React island.

- **Access rule** (CORE): employees may view only tasks **assigned to them or created
  by them**; every other role sees any task. A missing id → `404`, an unauthorized
  employee → `403` (both with a styled body, not a bare status).
- **Sections**: header (status/priority badges, progress bar, due date, assignee,
  creator, completion info), blocker-note callout, comments thread (completion
  comment pinned on top), attachments list, activity timeline, and a closure panel
  (evidence + completion details, only when the task is completed).
- Completed tasks are **read-only for everyone** (CORE BUSINESS RULE #3) — the
  comment box is disabled and the POST endpoint returns 403.
- Comments render via `src/components/CommentBox.tsx` (React island, `client:visible`),
  which POSTs to the comment API and appends the returned comment in place.
- Presentation helpers live in `src/lib/format.ts` (dates, file sizes, labels) and
  `src/lib/taskDetails.ts` (view check + all read queries + activity text).

### POST /api/tasks/[id]/comment

JSON API used by CommentBox. Body: `comment` (form-encoded, 1–2000 chars).

| Case | Status |
|---|---|
| Not authenticated | 401 |
| Task not found / invalid id | 404 |
| Cannot view task / task completed | 403 |
| Empty or over-limit comment | 400 |
| Success | 200 `{ ok, comment }` |

On success it inserts a `task_comments` row and logs `comment_added` in
`task_activity_log` (CORE BUSINESS RULE #6).

### GET /api/tasks/[id]/attachments/[attachmentId]

Streams a stored attachment BLOB (CORE BUSINESS RULE #5: files live in SQLite).
Same view rule as the page. Returns `Content-Type` (or `application/octet-stream`),
`Content-Length`, an RFC 5987 `Content-Disposition` (`filename*=UTF-8''…`) for
non-ASCII names, and `Cache-Control: private, no-store`.

## Delete requests (/manager/requests)

CORE BUSINESS RULE #4 — employees cannot delete tasks; they submit a request that a
manager/admin approves or rejects.

- **Employee side** (`DeleteRequestDialog.tsx` on `/tasks/[id]`): a "🗑️ Request
  Deletion" button opens a dialog asking for an optional reason. POST
  `/api/tasks/[id]/delete-request` inserts a `pending` row in
  `task_delete_requests`; the task then shows a "🗑️ Deletion requested" badge
  (also visible in the `/employee` list and as a marker on `/manager`).
  Duplicate pending requests are blocked (400). Only `not_started` /
  `in_progress` tasks assigned to or created by the employee are requestable;
  completed tasks never are (CORE BUSINESS RULE #3).
- **Manager/admin side** (`/manager/requests`, linked in the Navbar and on
  `/manager`): pending list shows task title, requester, reason, and date with
  Approve / Reject buttons, plus a history of reviewed requests. Approve
  hard-deletes the task (cascades comments/attachments/activity) and marks the
  request `approved`; Reject marks it `rejected` and the badge clears.
- Every transition is written to `task_activity_log` (`delete_requested`,
  `delete_approved`, `delete_rejected`) — "where possible": the approval log is
  written just before the task is deleted, so that row is cascade-removed with
  the task, while the request row survives as the audit record (it deliberately
  has no `ON DELETE CASCADE` and snapshots `task_title`).
- **DB note**: databases created before this workflow had `task_id ... ON DELETE
  CASCADE` on `task_delete_requests`; `src/lib/db.ts` migrates them to the
  snapshot shape on boot (idempotent, logged to console).
- **E2E**: `scripts/e2e-delete-request.mjs` covers approve, reject, completed
  blocked, duplicate blocked, supervisor-cannot-review, and role surface.
  Run it against a live server on port 4322 with a fresh DB:

  ```bash
  QC_DB_PATH=<app>/db/e2e_test.db node scripts/init-db.mjs
  QC_DB_PATH=<app>/db/e2e_test.db node_modules/.bin/astro dev --port 4322 &   # or: pnpm build, then PORT=4322 node dist/server/entry.mjs
  QC_DB_PATH=<app>/db/e2e_test.db BASE_URL=http://localhost:4322 node scripts/e2e-delete-request.mjs
  ```

## Notes

- The DB file (`*.db`, `*.db-wal`, `*.db-shm`) is gitignored and never committed.
- This scaffold establishes routing, auth, the data model, task creation, the
  read-only task details page (comments + attachment downloads), and the
  delete-request workflow. Task editing/closure flows and the attachments upload
  UI are the next build phase.

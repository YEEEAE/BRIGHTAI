# 🤖 حزمة البرومبتات التنفيذية — بناء نظام QC Task Manager

> **طريقة الاستخدام:** نفّذ البرومبتات **بالترتيب** (من 00 إلى 12) مع وكيل ذكي (Tasklet / Cursor / أي وكيل كود).
> كل برومبت يبني مرحلة كاملة قابلة للاختبار. لا تنتقل للبرومبت التالي قبل أن تنجح معايير القبول في الحالي.
> البرومبتات مكتوبة بالإنجليزية لأنها موجهة لوكيل البناء، والواجهة النهائية إنجليزية.

---

## 📌 القرارات النهائية المعتمدة (مرجع لكل البرومبتات)

| القرار | المعتمد |
|---|---|
| إغلاق المهمة | يتم من **الموظف** مباشرة (بدون اعتماد المدير) |
| صفحة Dashboard | متاحة لـ **admin + manager + supervisor** — ممنوعة على employee |
| لغة الواجهة | **English** |
| الأقسام | **QC** فقط |
| بيئة التشغيل | جهاز شخصي محلي — SQLite — بدون بريد إلكتروني |
| المسار | `apps/qc-task-manager` داخل monorepo (YEEEAE/BRIGHTAI) |

---

## 🧩 PROMPT 00 — السياق العام (يُلصق في بداية كل جلسة عمل)

```
You are building "QC Task Manager" — an internal task-tracking web app for the QC department.

LOCATION: apps/qc-task-manager inside an existing pnpm monorepo (packages live under apps/* and packages/*).

TECH STACK (fixed — do not change):
- Astro (SSR mode: output 'server') with @astrojs/node adapter (standalone)
- React islands for interactive components, Tailwind CSS for styling
- better-sqlite3 for the database, bcryptjs for password hashing
- SQLite database file at: db/qc_tasks.db (WAL mode enabled)
- UI language: English. Runs locally on a personal machine, port 4321.

ROLES: admin, manager, supervisor, employee.

CORE BUSINESS RULES (never violate):
1. Permissions:
   - admin: full control (users, tasks, pages, everything).
   - manager: create/edit/delete tasks, view dashboard, manage delete requests.
   - supervisor: create/edit tasks, assign tasks, view dashboard.
   - employee: NO dashboard. Can change status/progress, comment, upload evidence,
     add blocker notes. Can create tasks ONLY if can_create_tasks = 1 on their account.
2. FIELD LOCKING: after a task is created, an employee can ONLY modify:
   status, progress_percent, comments, attachments, blocker_note.
   Locked for employees: title, description, assigned_to, due_date, priority.
   Manager/admin can edit everything. Once a task is Completed it is READ-ONLY for everyone.
3. CLOSURE FLOW (done by the employee, strict order):
   Set status = Completed → Evidence upload step (SKIPPABLE via "Skip" button, but the
   skip must be recorded in the activity log) → Completion comment (MANDATORY) →
   system auto-fills completed_at and completed_by.
4. Employees CANNOT delete tasks. They submit a delete request; manager/admin approves or rejects.
5. Attachments are stored INSIDE the database as BLOBs (task_attachments table).
6. EVERY action is recorded in task_activity_log (who, what, old value, new value, timestamp).

DATABASE TABLES (already defined — see db/schema.sql):
users, tasks, task_comments, task_attachments, task_activity_log, task_delete_requests, sessions.
```

---

## 🧩 PROMPT 01 — تأسيس المشروع (Scaffolding)

```
Create the Astro project scaffold at apps/qc-task-manager inside this pnpm monorepo.

Requirements:
1. Initialize Astro with SSR: output 'server', adapter @astrojs/node in standalone mode.
2. Add integrations: @astrojs/react, Tailwind CSS (via @astrojs/tailwind).
3. Add dependencies: better-sqlite3, bcryptjs (and their types).
4. Register the app in pnpm-workspace.yaml if needed (apps/* should already be covered).
5. Create this folder structure:
   apps/qc-task-manager/
   ├── db/                  # schema.sql, seed.sql, qc_tasks.db (generated at runtime)
   ├── src/
   │   ├── layouts/         # BaseLayout.astro
   │   ├── pages/           # login, index, manager/, supervisor/, employee/, admin/, dashboard
   │   ├── components/      # React islands
   │   ├── lib/             # db.ts, auth.ts, permissions.ts, activity.ts
   │   └── middleware.ts    # auth guard
   └── package.json (name: qc-task-manager)
6. Add a root .gitignore entry: apps/qc-task-manager/db/*.db and *.db-wal / *.db-shm
   (the database file must NOT be committed to git).
7. BaseLayout.astro: English UI, RTL not needed, top navbar placeholder, page title prop.

Acceptance criteria:
- `pnpm install` works from the monorepo root.
- `pnpm --filter qc-task-manager dev` starts on port 4321 and renders a placeholder home page.
```

---

## 🧩 PROMPT 02 — طبقة قاعدة البيانات

```
Build the database layer for QC Task Manager.

1. Create db/schema.sql with EXACTLY these tables:

users(id INTEGER PK AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
full_name TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('admin','manager','supervisor','employee')),
department TEXT NOT NULL DEFAULT 'QC', can_create_tasks INTEGER NOT NULL DEFAULT 0,
is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT (datetime('now')));

tasks(id INTEGER PK AUTOINCREMENT, title TEXT NOT NULL, description TEXT,
status TEXT NOT NULL DEFAULT 'not_started' CHECK(status IN ('not_started','in_progress','on_hold','completed')),
priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low','medium','high')),
progress_percent INTEGER NOT NULL DEFAULT 0 CHECK(progress_percent BETWEEN 0 AND 100),
created_by INTEGER NOT NULL REFERENCES users(id), assigned_to INTEGER REFERENCES users(id),
due_date TEXT, blocker_note TEXT, completed_at TEXT, completed_by INTEGER REFERENCES users(id),
created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')));

task_comments(id INTEGER PK AUTOINCREMENT, task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
user_id INTEGER NOT NULL REFERENCES users(id), comment TEXT NOT NULL,
created_at TEXT NOT NULL DEFAULT (datetime('now')));

task_attachments(id INTEGER PK AUTOINCREMENT, task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
uploaded_by INTEGER NOT NULL REFERENCES users(id), file_name TEXT NOT NULL, mime_type TEXT,
file_data BLOB NOT NULL, file_size INTEGER, uploaded_at TEXT NOT NULL DEFAULT (datetime('now')));

task_activity_log(id INTEGER PK AUTOINCREMENT, task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
user_id INTEGER NOT NULL REFERENCES users(id), action TEXT NOT NULL, old_value TEXT, new_value TEXT,
created_at TEXT NOT NULL DEFAULT (datetime('now')));

task_delete_requests(id INTEGER PK AUTOINCREMENT, task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
requested_by INTEGER NOT NULL REFERENCES users(id), reason TEXT,
status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
reviewed_by INTEGER REFERENCES users(id), reviewed_at TEXT,
created_at TEXT NOT NULL DEFAULT (datetime('now')));

sessions(token TEXT PK, user_id INTEGER NOT NULL REFERENCES users(id),
created_at TEXT NOT NULL DEFAULT (datetime('now')), expires_at TEXT NOT NULL);

2. Create src/lib/db.ts:
   - Opens db/qc_tasks.db with better-sqlite3, enables WAL mode and foreign keys.
   - Runs schema.sql automatically on first start (idempotent: CREATE TABLE IF NOT EXISTS).
   - Exports a typed query helper.
3. Create db/seed.sql + a seed script (src/lib/seed.ts run at startup if users table is empty):
   - Seeds ONE admin account: username 'admin', role 'admin', department 'QC', can_create_tasks = 1.
   - Password: bcrypt hash of a configurable default (env ADMIN_DEFAULT_PASSWORD, fallback 'admin123').
   - Print a console warning if the default password is still in use.
4. Add indexes: tasks(assigned_to), tasks(status), task_activity_log(task_id), sessions(expires_at).

Acceptance criteria:
- Starting the dev server creates db/qc_tasks.db with all 7 tables and the admin user.
- I can open qc_tasks.db with the SQLTools VS Code extension (SQLite driver) and browse all tables.
```

---

## 🧩 PROMPT 03 — المصادقة وتسجيل الدخول

```
Build authentication for QC Task Manager.

1. Login page (src/pages/login.astro): English UI — username, password, submit.
   On POST: verify against users table using bcryptjs compare. On success create a session:
   random token (crypto.randomUUID), expires_at = now + 12 hours, store in sessions table,
   set httpOnly cookie 'qc_session'. Redirect to '/'.
2. src/lib/auth.ts:
   - getSessionUser(request): reads cookie, validates token + expiry, joins users row,
     returns null if invalid/expired or user is_active = 0.
   - requireRole(user, [...roles]) helper.
   - logout: deletes session row + clears cookie.
3. src/middleware.ts (Astro middleware):
   - Public paths: /login and static assets. Everything else requires a valid session.
   - Attach user to Astro.locals. Redirect unauthenticated users to /login.
   - Route guards: /dashboard and /admin/* → admin/manager/supervisor only for dashboard,
     admin only for /admin/*. Employees hitting these get redirected to their home with a flash message.
4. Periodic session cleanup: delete expired sessions on app start and on each login.
5. Logout button in the navbar.

Acceptance criteria:
- Seeded admin can log in and log out.
- Wrong password shows a generic English error (no user enumeration).
- Visiting any page while logged out redirects to /login.
- Session survives server restart (it is in SQLite).
```

---

## 🧩 PROMPT 04 — التوجيه حسب الدور + الهيكل المشترك

```
Build the role-based home router and shared layout.

1. src/pages/index.astro: redirects by role:
   - admin → /admin/users
   - manager → /manager
   - supervisor → /supervisor
   - employee → /employee
2. BaseLayout.astro final version:
   - Navbar shows: app name "QC Task Manager", current user full name + role badge,
     nav links filtered by role (Dashboard link hidden for employees),
     logout button.
   - Flash message support (success/error) via cookie or query param.
3. src/lib/permissions.ts — single source of truth:
   export const PERMISSIONS = {
     canViewDashboard: (role) => ['admin','manager','supervisor'].includes(role),
     canCreateTask: (user) => ['admin','manager','supervisor'].includes(user.role) || user.can_create_tasks === 1,
     canEditTaskFields: (role) => ['admin','manager'].includes(role),
     canDeleteTask: (role) => ['admin','manager'].includes(role),
     canManageUsers: (role) => role === 'admin',
     employeeEditableFields: ['status','progress_percent','blocker_note'],
   };
   Every page and API endpoint MUST import from here — no scattered role checks.
4. Create placeholder pages for /manager, /supervisor, /employee, /dashboard, /admin/users
   (each renders its name + the logged-in user, protected by the correct guard).

Acceptance criteria:
- Logging in as each seeded role lands on the correct home page.
- An employee manually visiting /dashboard is redirected away.
```

---

## 🧩 PROMPT 05 — إدارة المستخدمين (Admin)

```
Build the admin user-management page at /admin/users (admin only).

1. Users table view: username, full name, role badge, department, can_create_tasks toggle,
   active status, created date.
2. "Create User" form: username (unique), full name, password (min 8 chars), role dropdown
   (admin/manager/supervisor/employee), can_create_tasks checkbox (only relevant for employees).
   On submit: bcrypt hash, insert into users — the new account works immediately (direct DB link).
3. Actions per user: deactivate/activate toggle, reset password (admin sets a new one),
   toggle can_create_tasks.
4. Safety rules:
   - Admin cannot deactivate or demote their own account.
   - Username cannot be changed after creation.
   - Never display password hashes anywhere.
5. All actions logged to console (and to task_activity_log only if task-related — user actions
   are not task-related, so console is enough).

Acceptance criteria:
- Admin creates a new employee account and can immediately log in with it in a private window.
- Deactivated user cannot log in ("account disabled" message).
```

---

## 🧩 PROMPT 06 — إنشاء وإسناد المهام (Manager / Supervisor)

```
Build task creation and management pages.

1. /manager page: task table (all tasks) with columns: ID, title, status badge
   (🔴 Not Started / 🟡 In Progress / 🟠 On Hold / 🟢 Completed), priority, assigned to,
   due date, progress bar. Filters: status, assignee, priority. "New Task" button.
2. /supervisor page: same table but scoped to tasks they created or their team; can also
   create and assign tasks.
3. New Task form (shared component, also reachable by employees with can_create_tasks = 1):
   title (required), description, priority (low/medium/high), assigned_to (dropdown of active
   employees), due_date (date picker). created_by = current user automatically.
4. Edit task (manager/admin only): all fields editable EXCEPT when status = 'completed'
   (completed tasks are read-only for everyone — show a lock banner).
5. Delete task (manager/admin only): hard delete with a confirmation dialog; log the deletion.
6. Every create/edit/delete writes rows to task_activity_log
   (action: 'created' / 'field_updated' with old_value/new_value / 'deleted').
7. src/lib/activity.ts helper: logActivity(taskId, userId, action, oldValue, newValue).

Acceptance criteria:
- Manager creates a task assigned to an employee; it appears in the employee's list (next prompt).
- Editing a task's title shows a 'field_updated' row with old and new values in task_activity_log.
- Completed tasks show a lock banner and their edit form is disabled.
```

---

## 🧩 PROMPT 07 — صفحة الموظف وقفل الحقول

```
Build the employee pages with strict field locking.

1. /employee page with two tabs:
   - "Assigned to me": tasks where assigned_to = current user (not completed first, then completed).
   - "Created by me": tasks where created_by = current user.
   Columns: title, status badge, priority, due date (red if overdue), progress bar.
   If can_create_tasks = 1, show a "New Task" button (same shared form).
2. Task edit for employees — ONLY these controls are enabled:
   - Status dropdown: Not Started / In Progress / On Hold / Completed.
   - Progress slider 0–100%.
   - Blocker note textarea (label: "Blocker / Obstacle note").
   - Comments and attachments (next prompts).
   EVERYTHING ELSE (title, description, assigned_to, due_date, priority) renders as
   read-only text with a 🔒 icon. Do not even submit these fields — the server must reject
   any attempt to change them (defense in depth: strip them server-side too).
3. Server-side enforcement (src/lib/taskUpdate.ts):
   - If user.role === 'employee': whitelist only status, progress_percent, blocker_note.
   - If task.status === 'completed': reject ALL updates (read-only for everyone).
   - Status transitions: any → any is allowed EXCEPT completed → anything (reopening is
     manager/admin only, logged as 'reopened').
4. Selecting "Completed" does NOT save immediately — it opens the closure flow (next prompt).
5. Every change logged to task_activity_log with old/new values.

Acceptance criteria:
- Employee changes status to In Progress and progress to 40% — saved and logged.
- Employee tampers with the request to change the title — server ignores/rejects it.
- Completed task: employee sees everything read-only.
```

---

## 🧩 PROMPT 08 — صفحة تفاصيل المهمة (تعليقات + سجل النشاط)

```
Build the task details page at /tasks/[id].astro (accessible to all roles, employees only
for tasks assigned to them or created by them — others get 403).

Sections (top to bottom):
1. Header: title, status badge, priority badge, progress bar, due date, assignee, creator,
   created date. Lock banner if completed.
2. Blocker note (if any) in a warning callout.
3. Comments thread: chronological list (author, timestamp, text) + add-comment box
   (React island, posts to /api/tasks/[id]/comment). Commenting is allowed for all roles
   on non-completed tasks.
4. Attachments list: file name, size, uploader, date, download button
   (GET /api/tasks/[id]/attachments/[attachmentId] streams the BLOB with correct
   Content-Type and Content-Disposition).
5. Activity History timeline: rendered from task_activity_log — icon per action type,
   "who did what, from what to what, when" in plain English
   (e.g. "Sara changed status: In Progress → Completed").
6. Closure info panel (only when completed): ✅ Completed by {name} on {date},
   evidence file (or "Evidence skipped"), completion comment pinned at top of comments.

Acceptance criteria:
- Adding a comment appears instantly and is logged.
- Downloading an attachment returns the exact uploaded file.
- The timeline shows every historical action in order.
```

---

## 🧩 PROMPT 09 — تدفق إغلاق المهمة (الأهم)

```
Build the task closure flow — a 3-step modal wizard (React island) triggered when an
employee (or any role) sets status to Completed. Strict order, done by the employee:

STEP 1 — Evidence upload:
  - File input (PDF, images, Excel — max 10 MB).
  - "Skip for now ⏭️" button — allowed, but MUST log action='evidence_skipped' to
    task_activity_log. Uploaded files log action='evidence_uploaded'.
  - Files stored as BLOB in task_attachments.

STEP 2 — Completion comment (MANDATORY):
  - Textarea, cannot proceed while empty. Saved to task_comments with a marker
    (prefix or a dedicated fetch) so it can be pinned as the completion comment.

STEP 3 — Confirm & Close:
  - Summary: evidence file name (or "skipped"), comment preview.
  - "Confirm Completion" button executes ONE transaction:
    UPDATE tasks SET status='completed', progress_percent=100,
    completed_at=datetime('now'), completed_by=<current user> WHERE id=?;
    + activity log row action='completed'.
  - On success: redirect to task page showing the closure info panel.

Rules:
- If the user cancels mid-wizard, nothing is saved (status stays as it was).
- Completed tasks become read-only for everyone (enforce again here).
- Reopening (manager/admin only) clears completed_at/completed_by and logs 'reopened'.

Acceptance criteria:
- Full flow: In Progress → Completed with evidence + comment → task shows
  "Completed by X on Y", progress 100%, everything locked.
- Skip path: closing without evidence works and the timeline shows "Evidence skipped".
- Closing without a comment is impossible (button disabled).
```

---

## 🧩 PROMPT 10 — طلبات الحذف

```
Build the delete-request workflow (employees cannot delete directly).

1. Employee side: on their tasks (not started or in progress), a "Request Deletion" button
   opens a dialog asking for a reason (optional). Inserts into task_delete_requests
   (status 'pending'). The task shows a "🗑️ Deletion requested" badge; duplicate pending
   requests are blocked.
2. Manager/admin side: a "Delete Requests" section on /manager (and admin nav):
   pending requests list — task title, requester, reason, date — with Approve / Reject.
   - Approve: delete the task (cascade), set request status 'approved', reviewed_by/at.
   - Reject: set status 'rejected', reviewed_by/at; badge disappears from the task.
3. Log outcomes to task_activity_log where possible (request submitted / approved / rejected).
4. Completed tasks cannot be deletion-requested by employees (manager/admin delete directly).

Acceptance criteria:
- Employee requests deletion → manager sees it pending → approves → task gone, request approved.
- Reject path: badge clears, request shows rejected.
```

---

## 🧩 PROMPT 11 — لوحة التحكم Dashboard

```
Build /dashboard (admin, manager, supervisor ONLY — employees are redirected away).

KPI cards (top row):
- Total tasks, 🔴 Not Started, 🟡 In Progress, 🟠 On Hold, 🟢 Completed,
  ⚠️ Overdue (due_date < today AND status != 'completed').

Charts (use a lightweight lib like Chart.js via a React island, or pure SVG):
- Donut: tasks by status.
- Bar: tasks per employee (assigned count, split by status).
- Line: tasks completed per week (last 8 weeks, from completed_at).

Tables:
- "Overdue tasks": title, assignee, due date, days overdue — sorted by most overdue.
- "Recently completed": last 10 with completed_by and completed_at.

Filters: date range, assignee, priority. All queries read-only, parameterized.

Acceptance criteria:
- Numbers match the actual database (verify with SQLTools queries).
- Employee role cannot access the page (redirect + flash).
```

---

## 🧩 PROMPT 12 — التشطيبات النهائية والتسليم

```
Final hardening and delivery for QC Task Manager.

1. Security pass:
   - Verify EVERY /api/* endpoint re-checks session + role server-side (no client-only checks).
   - All SQL queries parameterized (no string concatenation).
   - File upload validation: extension + MIME + 10 MB limit.
   - Security headers via Astro middleware (X-Frame-Options DENY, X-Content-Type-Options nosniff).
2. UX polish: empty states ("No tasks yet"), loading states on islands, consistent status
   colors everywhere (🔴🟡🟠🟢), overdue dates in red, responsive layout.
3. Seed extra demo data (optional flag SEED_DEMO=1): 1 manager, 1 supervisor, 3 employees,
   12 tasks in mixed statuses — for demoing to the boss.
4. README.md inside apps/qc-task-manager:
   - What the app is, roles & permissions table, how to run (pnpm install / dev / build / start),
     default admin credentials + how to change them, where the DB file lives,
     how to connect SQLTools (install mtxr.sqltools + mtxr.sqltools-driver-sqlite,
     connection name "QC Tasks DB", SQLite driver, path ./db/qc_tasks.db).
   - .vscode/settings.json snippet for the SQLTools connection.
5. Production check: `pnpm --filter qc-task-manager build` succeeds;
   `node apps/qc-task-manager/dist/server/entry.mjs` serves the app on port 4321.

Acceptance criteria:
- Fresh clone → pnpm install → dev → login as admin → full workflow works end to end:
  create users → create task → employee progresses it → closure flow → dashboard updates.
```

---

## ✅ خريطة التنفيذ السريعة

| # | البرومبت | الناتج |
|---|---|---|
| 00 | السياق العام | يُلصق مع كل برومبت |
| 01 | التأسيس | مشروع Astro يعمل على المنفذ 4321 |
| 02 | قاعدة البيانات | 7 جداول + حساب الأدمن |
| 03 | المصادقة | تسجيل دخول بجلسات SQLite |
| 04 | التوجيه والصلاحيات | كل دور لصفحته + permissions.ts |
| 05 | إدارة المستخدمين | إنشاء حسابات من الويب مباشرة |
| 06 | إنشاء المهام | صفحتا المدير والسوبرفايزر |
| 07 | صفحة الموظف | قفل الحقول 🔒 |
| 08 | تفاصيل المهمة | تعليقات + مرفقات + سجل |
| 09 | تدفق الإغلاق | المعالج الثلاثي مع التخطي ⏭️ |
| 10 | طلبات الحذف | موافقة المدير |
| 11 | Dashboard | مؤشرات ورسوم (بدون موظفين) |
| 12 | التسليم | أمان + README + فحص الإنتاج |

> 💡 **نصيحة:** بعد كل برومبت، افتح `qc_tasks.db` عبر SQLTools وتأكد أن البيانات تُكتب كما هو متوقع — هذا أسرع فحص جودة (QC 😉) أثناء البناء.

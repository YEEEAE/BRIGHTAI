حللت المتاح من مستودع [YEEEAE/BRIGHTAI](https://github.com/YEEEAE/BRIGHTAI): المشروع Astro ومُعد حالياً كـ **Static Site على Render**، وهذا لا يناسب SQLite والجلسات ورفع الملفات؛ لذلك يجب تشغيل QC Task Manager كتطبيق **Astro SSR على Node** داخل `apps/qc-task-manager`، وعدم وضع قاعدة SQLite داخل Git.

هذه النسخة التنفيذية المصححة، وتلغي التعارضات الموجودة في الملفات القديمة: الـ Dashboard متاح لـ **admin + manager + supervisor**، الموظف يغلق المهمة مباشرة، والمهمة المكتملة تصبح Read-only مع إمكانية إعادة فتحها فقط للـ admin/manager.
* * *

# PROMPT 00: Repository Audit Before Coding

```text
You are modifying the existing public repository:
https://github.com/YEEEAE/BRIGHTAI

Before writing any code:

1. Inspect the repository tree, package.json files, pnpm-workspace.yaml, astro.config files,
   existing routes, deployment files, and current database integrations.
2. Identify whether the repository is a monorepo. Do not assume apps/* exists.
3. Detect the current Astro version and package manager.
4. Check whether the current Render deployment is static or SSR.
5. Do not delete or rewrite existing BRIGHTAI pages.
6. Create a short implementation report at:
   apps/qc-task-manager/docs/REPOSITORY-AUDIT.md

The report must include:
- Existing project structure
- Existing Astro configuration
- Existing deployment configuration
- Whether pnpm or npm is currently used
- Safe integration strategy
- Files that must not be modified
- Any conflicts with adding an SSR SQLite application

Important:
The QC Task Manager requires a Node SSR runtime because it uses SQLite, sessions,
server-side authentication, API endpoints, and database-backed file uploads.
A static Render deployment cannot run this application.

Do not implement features in this prompt. Only inspect, document, and propose the safest
integration plan. Finish with exact commands that will be used in later prompts.
```

* * *

# PROMPT 01: Create the QC Application Safely

```text
Create a separate application inside the existing repository at:

apps/qc-task-manager/

Do not modify or delete the existing BRIGHTAI application.

Use the repository's existing package manager and Astro version whenever possible.
Do not upgrade unrelated dependencies.

Required stack:
- Astro SSR
- @astrojs/node adapter in standalone mode
- React islands only where interactivity is needed
- Tailwind CSS
- better-sqlite3
- bcryptjs
- Zod for server-side input validation
- TypeScript strict mode
- Chart.js or pure SVG for dashboard charts

Application name:
@brightai/qc-task-manager

Required structure:

apps/qc-task-manager/
├── db/
│   ├── schema.sql
│   ├── seed.sql
│   ├── backups/
│   └── .gitkeep
├── docs/
├── public/
├── src/
│   ├── components/
│   ├── layouts/
│   ├── lib/
│   │   ├── db.ts
│   │   ├── auth.ts
│   │   ├── permissions.ts
│   │   ├── activity.ts
│   │   ├── notifications.ts
│   │   ├── task-policy.ts
│   │   ├── validation.ts
│   │   ├── backup.ts
│   │   └── export.ts
│   ├── middleware.ts
│   ├── pages/
│   │   ├── login.astro
│   │   ├── index.astro
│   │   ├── dashboard.astro
│   │   ├── manager/
│   │   ├── supervisor/
│   │   ├── employee/
│   │   ├── admin/
│   │   ├── tasks/
│   │   ├── notifications.astro
│   │   └── api/
│   └── types/
├── astro.config.mjs
├── package.json
├── tsconfig.json
└── README.md

Add the database files to .gitignore:

apps/qc-task-manager/db/*.db
apps/qc-task-manager/db/*.db-wal
apps/qc-task-manager/db/*.db-shm
apps/qc-task-manager/db/backups/*
!apps/qc-task-manager/db/backups/.gitkeep

Add scripts:
- dev
- build
- preview
- db:backup
- db:seed
- typecheck
- test

The app must run independently without breaking the existing BRIGHTAI app.
```

* * *

# PROMPT 02: Complete SQL Database Design

```text
Create a production-ready SQLite schema at:

apps/qc-task-manager/db/schema.sql

Use:
- PRAGMA journal_mode = WAL;
- PRAGMA foreign_keys = ON;
- CREATE TABLE IF NOT EXISTS
- indexes for all foreign keys and dashboard filters
- CHECK constraints for role, status, priority, and percentages
- ON DELETE CASCADE only for child records
- ON DELETE RESTRICT or SET NULL for audit-critical user references

Create these tables.

1. users
Columns:
- id INTEGER PRIMARY KEY AUTOINCREMENT
- username TEXT NOT NULL UNIQUE
- password_hash TEXT NOT NULL
- full_name TEXT NOT NULL
- role TEXT NOT NULL CHECK(role IN ('admin','manager','supervisor','employee'))
- department TEXT NOT NULL DEFAULT 'QC'
- can_create_tasks INTEGER NOT NULL DEFAULT 0 CHECK(can_create_tasks IN (0,1))
- is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1))
- failed_login_attempts INTEGER NOT NULL DEFAULT 0
- locked_until TEXT
- last_login_at TEXT
- created_by INTEGER REFERENCES users(id)
- created_at TEXT NOT NULL DEFAULT (datetime('now'))
- updated_at TEXT NOT NULL DEFAULT (datetime('now'))

2. tasks
Columns:
- id INTEGER PRIMARY KEY AUTOINCREMENT
- title TEXT NOT NULL
- description TEXT
- department TEXT NOT NULL DEFAULT 'QC'
- status TEXT NOT NULL DEFAULT 'not_started'
  CHECK(status IN ('not_started','in_progress','on_hold','completed','cancelled'))
- priority TEXT NOT NULL DEFAULT 'medium'
  CHECK(priority IN ('low','medium','high','urgent'))
- progress_percent INTEGER NOT NULL DEFAULT 0
  CHECK(progress_percent BETWEEN 0 AND 100)
- created_by INTEGER NOT NULL REFERENCES users(id)
- assigned_to INTEGER REFERENCES users(id)
- due_date TEXT
- blocker_note TEXT
- recurrence TEXT NOT NULL DEFAULT 'none'
  CHECK(recurrence IN ('none','daily','weekly','monthly'))
- recurrence_end_date TEXT
- parent_recurring_task_id INTEGER REFERENCES tasks(id)
- started_at TEXT
- completed_at TEXT
- completed_by INTEGER REFERENCES users(id)
- completion_comment_id INTEGER
- cancelled_at TEXT
- cancelled_by INTEGER REFERENCES users(id)
- created_at TEXT NOT NULL DEFAULT (datetime('now'))
- updated_at TEXT NOT NULL DEFAULT (datetime('now'))

3. task_comments
- id INTEGER PRIMARY KEY AUTOINCREMENT
- task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE
- user_id INTEGER NOT NULL REFERENCES users(id)
- comment TEXT NOT NULL
- is_completion_comment INTEGER NOT NULL DEFAULT 0 CHECK(is_completion_comment IN (0,1))
- created_at TEXT NOT NULL DEFAULT (datetime('now'))

4. task_attachments
- id INTEGER PRIMARY KEY AUTOINCREMENT
- task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE
- uploaded_by INTEGER NOT NULL REFERENCES users(id)
- file_name TEXT NOT NULL
- mime_type TEXT NOT NULL
- file_size INTEGER NOT NULL
- file_hash TEXT
- file_data BLOB NOT NULL
- is_evidence INTEGER NOT NULL DEFAULT 0 CHECK(is_evidence IN (0,1))
- uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))

5. task_activity_log
- id INTEGER PRIMARY KEY AUTOINCREMENT
- task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE
- user_id INTEGER NOT NULL REFERENCES users(id)
- action TEXT NOT NULL
- field TEXT
- old_value TEXT
- new_value TEXT
- note TEXT
- ip_address TEXT
- created_at TEXT NOT NULL DEFAULT (datetime('now'))

6. task_delete_requests
- id INTEGER PRIMARY KEY AUTOINCREMENT
- task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE
- requested_by INTEGER NOT NULL REFERENCES users(id)
- reason TEXT
- status TEXT NOT NULL DEFAULT 'pending'
  CHECK(status IN ('pending','approved','rejected'))
- reviewed_by INTEGER REFERENCES users(id)
- reviewed_at TEXT
- created_at TEXT NOT NULL DEFAULT (datetime('now'))

7. task_checklists
- id INTEGER PRIMARY KEY AUTOINCREMENT
- task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE
- title TEXT NOT NULL
- sort_order INTEGER NOT NULL DEFAULT 0
- is_completed INTEGER NOT NULL DEFAULT 0 CHECK(is_completed IN (0,1))
- completed_by INTEGER REFERENCES users(id)
- completed_at TEXT
- created_at TEXT NOT NULL DEFAULT (datetime('now'))

8. task_dependencies
- task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE
- depends_on_task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE
- PRIMARY KEY(task_id, depends_on_task_id)
- CHECK(task_id != depends_on_task_id)

9. notifications
- id INTEGER PRIMARY KEY AUTOINCREMENT
- user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
- task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL
- type TEXT NOT NULL
- title TEXT NOT NULL
- message TEXT NOT NULL
- is_read INTEGER NOT NULL DEFAULT 0 CHECK(is_read IN (0,1))
- created_at TEXT NOT NULL DEFAULT (datetime('now'))

10. sessions
- token TEXT PRIMARY KEY
- user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
- created_at TEXT NOT NULL DEFAULT (datetime('now'))
- expires_at TEXT NOT NULL

11. login_attempts
- id INTEGER PRIMARY KEY AUTOINCREMENT
- username TEXT
- ip_address TEXT
- succeeded INTEGER NOT NULL CHECK(succeeded IN (0,1))
- created_at TEXT NOT NULL DEFAULT (datetime('now'))

12. saved_filters
- id INTEGER PRIMARY KEY AUTOINCREMENT
- user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
- name TEXT NOT NULL
- filter_json TEXT NOT NULL
- created_at TEXT NOT NULL DEFAULT (datetime('now'))

Add indexes for:
- tasks(status)
- tasks(priority)
- tasks(assigned_to)
- tasks(created_by)
- tasks(due_date)
- tasks(completed_at)
- tasks(recurrence)
- task_comments(task_id)
- task_attachments(task_id)
- task_activity_log(task_id, created_at)
- notifications(user_id, is_read, created_at)
- sessions(expires_at)
- login_attempts(username, created_at)

Do not store passwords in plaintext.
Do not store uploaded files on disk. Store file content as BLOB.
```

* * *

# PROMPT 03: Database Connection and SQLTools

```text
Implement the SQLite database layer.

Create src/lib/db.ts with:

1. Database path:
   process.env.QC_DATABASE_PATH
   fallback:
   apps/qc-task-manager/db/qc_tasks.db

2. Open the database using better-sqlite3.

3. Enable:
   - WAL mode
   - foreign_keys
   - busy_timeout = 5000
   - synchronous = NORMAL

4. Read and execute schema.sql automatically at startup.
5. Make initialization idempotent.
6. Export:
   - db
   - query helper
   - transaction helper
   - closeDatabase helper for tests

7. All SQL queries must use prepared statements.
8. Never concatenate user input into SQL.
9. Add startup validation that all required tables and indexes exist.
10. Create a seed runner that inserts the initial admin account only when users is empty.

Create:
apps/qc-task-manager/.vscode/settings.json

With:

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

Create README documentation explaining:

- Install SQLTools
- Install SQLTools SQLite driver
- Open the repository root in VSCode
- Start the app once so qc_tasks.db is generated
- Connect using SQLTools
- Browse the tables
- Run sample queries

Never commit qc_tasks.db.
```

* * *

# PROMPT 04: Authentication and Role Permissions

```text
Build secure authentication.

Roles:
- admin
- manager
- supervisor
- employee

Permissions:

admin:
- Full access to users, tasks, dashboard, settings, backups, exports, and audit logs.

manager:
- Create, edit, assign, and delete tasks.
- Approve or reject employee deletion requests.
- View dashboard.
- View all QC tasks.
- Cannot manage users.

supervisor:
- Create and assign tasks to employees in the QC department.
- Edit tasks created by the supervisor or belonging to their team.
- View dashboard.
- Cannot manage users.
- Cannot directly delete tasks unless explicitly granted later.

employee:
- View assigned tasks and tasks created by the employee.
- Change status, progress, and blocker note on permitted tasks.
- Add comments.
- Upload attachments and evidence.
- View activity history for accessible tasks.
- Create tasks only if can_create_tasks = 1.
- Request deletion instead of deleting.
- Cannot view dashboard.
- Cannot edit title, description, assignee, due date, priority, department, or creator.

Implement:
- Login page
- Logout
- bcrypt password verification
- 12-hour session stored in sessions table
- httpOnly cookie named qc_session
- SameSite=Lax or Strict
- Secure cookie in production
- generic invalid credentials message
- account deactivation check
- lock account for 10 minutes after 5 consecutive failed attempts
- session cleanup on startup and login
- middleware route protection
- server-side role checks in every page and API endpoint

Never rely only on frontend hiding.
```

* * *

# PROMPT 05: Admin User Management

```text
Create /admin/users, accessible only to admin.

Features:
1. List all users:
   - username
   - full name
   - role
   - department
   - active status
   - can_create_tasks
   - created date
   - last login

2. Create user:
   - username
   - full name
   - password with minimum 8 characters
   - role
   - department, default QC
   - can_create_tasks
   - active status

3. Edit user:
   - full name
   - role
   - department
   - can_create_tasks
   - active status

4. Reset password.
5. Activate/deactivate account.
6. Prevent admin from deactivating or demoting their own account.
7. Username cannot be changed.
8. Never expose password hashes.
9. Log user-management actions to a separate application audit log or console.
10. All forms require server-side Zod validation.
11. Duplicate usernames must show a safe user-friendly error.
12. New users must be able to log in immediately because they are inserted directly into SQLite.
```

* * *

# PROMPT 06: Task Creation, Assignment, Priority, and Recurrence

```text
Build shared task creation and editing.

Task fields:
- title
- description
- department
- priority: low, medium, high, urgent
- assigned_to
- due_date
- recurrence: none, daily, weekly, monthly
- recurrence_end_date
- checklist items
- dependencies

Rules:
- admin and manager can create and edit all task fields.
- supervisor can create tasks and assign them to active QC employees.
- employee can create tasks only when can_create_tasks = 1.
- employee-created tasks still have locked business fields after creation.
- every task has created_by and created_at.
- every create and update writes to task_activity_log.
- assigning a task creates an in-app notification.
- changing due date or priority creates an in-app notification for the assignee.
- urgent tasks must be visually prominent.

Recurring task behavior:
- Do not create endless tasks.
- When a recurring task is completed, create the next task only if:
  recurrence != none and next due date <= recurrence_end_date or recurrence_end_date is null.
- Link the next task using parent_recurring_task_id.
- Copy title, description, department, priority, assignee, checklist template, and recurrence.
- Do not copy comments, evidence, activity logs, or completion metadata.
- Record recurring task creation in the activity log.

Dependency behavior:
- A task cannot move to In Progress while any dependency is incomplete.
- Show the blocking dependencies clearly.
- Admin and manager can override only with an explicit reason, and the override is logged.
```

* * *

# PROMPT 07: Employee Page and Strict Field Locking

```text
Build /employee.

Create tabs:
- Assigned to me
- Created by me
- Completed
- Deletion requests

Each task row must show:
- title
- status
- priority
- due date
- overdue indicator
- progress
- assigned user
- quick action to open details

Employee editable fields only:
- status
- progress_percent
- blocker_note
- comments
- attachments

Locked employee fields:
- title
- description
- department
- priority
- assigned_to
- due_date
- created_by
- recurrence

Render locked fields with a lock icon and read-only styling.

Server-side rules:
- Ignore or reject unauthorized fields sent by the browser.
- Never trust disabled HTML controls.
- Never accept title, priority, due_date, assigned_to, or description from employee updates.
- Employees can update only tasks assigned to them or created by them.
- Employees cannot update completed tasks.
- Employees cannot delete tasks.
- Employees can submit one pending deletion request per task.
- On Hold requires a non-empty blocker_note.
- Progress must be an integer between 0 and 100.
- Completed always forces progress_percent = 100.
```

* * *

# PROMPT 08: Status Lifecycle and Completion Flow

```text
Implement statuses:

not_started
in_progress
on_hold
completed
cancelled

Status rules:
- not_started -> in_progress
- not_started -> on_hold only with blocker note
- in_progress -> on_hold only with blocker note
- on_hold -> in_progress when work resumes
- any active status -> completed through the completion wizard
- completed -> read-only
- completed -> reopened only by admin or manager
- cancelled requires manager/admin approval or approved deletion workflow

When the task first enters in_progress:
- set started_at if it is null
- log the change

Completion flow:
1. Employee selects Completed.
2. Open a modal wizard instead of saving immediately.
3. Step 1: upload evidence.
   - allowed: PDF, PNG, JPG, JPEG, XLSX, DOCX
   - maximum size: 10 MB per file
   - validate extension, MIME type, and file signature where possible
   - allow Skip
   - log evidence_skipped when skipped
4. Step 2: completion comment.
   - mandatory
   - save as task_comments.is_completion_comment = 1
5. Step 3: confirmation summary.
6. Execute one database transaction:
   - upload evidence BLOBs
   - insert completion comment
   - update task status to completed
   - set progress to 100
   - set completed_at
   - set completed_by
   - write activity records
   - create notification for task creator, manager, and supervisor
7. On success, task becomes read-only.

If the user cancels before confirmation:
- do not change task status
- do not save temporary evidence
- do not save the completion comment

Completed task display:
- Completed by
- Completed date
- Completion comment
- Evidence files or Evidence skipped
- full activity history
```

* * *

# PROMPT 09: Comments, Attachments, Activity History, and Audit

```text
Build /tasks/[id].

Accessible users:
- admin, manager, supervisor: according to department/task visibility
- employee: only if assigned_to = current user or created_by = current user

Page sections:
1. Task header
2. Locked field summary
3. Status and progress
4. Due date and overdue warning
5. Blocker note
6. Checklist
7. Dependencies
8. Comments
9. Attachments
10. Activity history
11. Completion panel
12. Deletion request panel

Comments:
- add comment on active tasks
- prevent comments on completed tasks unless admin or manager reopens
- log comment_added
- show author and timestamp

Attachments:
- store BLOB inside task_attachments
- never expose raw database paths
- stream downloads through an authenticated endpoint
- set correct Content-Type
- set safe Content-Disposition filename
- verify authorization before download
- reject files over 10 MB
- calculate SHA-256 hash
- prevent path traversal in filenames

Activity log:
Every important action must be recorded:
- created
- field_updated
- status_changed
- progress_updated
- blocker_updated
- comment_added
- evidence_uploaded
- evidence_skipped
- completed
- reopened
- delete_requested
- delete_approved
- delete_rejected
- checklist_updated
- dependency_added
- dependency_removed
- recurring_task_created
- notification_created

Display human-readable messages such as:
"Sara changed status from In Progress to Completed."
"Ahmed uploaded evidence file report.xlsx."
```

* * *

# PROMPT 10: Notifications

```text
Build an in-app notification system.

Show a bell icon in the navbar with an unread count.

Create notifications when:
- a task is assigned
- a task is reassigned
- priority changes to high or urgent
- due date changes
- a comment is added to a task
- a blocker note is added
- a task is completed
- a deletion request is submitted
- a deletion request is approved or rejected
- a task is reopened
- a recurring task is created

Notification requirements:
- stored in notifications table
- linked to task when applicable
- unread/read state
- mark one as read
- mark all as read
- notification dropdown
- full notifications page
- link to the task
- no email integration for the first release
- do not notify inactive users
```

* * *

# PROMPT 11: Deletion Requests

```text
Implement employee deletion requests.

Employee:
- sees Request Deletion on active tasks
- enters optional reason
- cannot submit duplicate pending requests
- cannot request deletion for completed tasks
- cannot directly delete anything
- submitting the request creates an activity log and notification

Manager/admin:
- see pending deletion requests
- view task title, requester, reason, and date
- approve or reject
- approval requires confirmation
- rejection may include a reason
- approval deletes the task and cascades child records
- rejection keeps the task
- update the request with reviewer and reviewed_at
- notify requester
- log the result

Important:
Before hard deletion, create a final deletion activity record if possible.
Do not delete users because user references are needed for audit history.
```

* * *

# PROMPT 12: Dashboard

```text
Build /dashboard.

Access:
- admin: allowed
- manager: allowed
- supervisor: allowed
- employee: forbidden and redirected to /employee

Dashboard filters:
- today
- this week
- this month
- custom date range
- assignee
- priority
- status
- overdue only

KPI cards:
- total tasks
- not started
- in progress
- on hold
- completed
- overdue
- urgent open tasks
- completed without evidence
- average completion time

Overdue definition:
due_date < current date AND status NOT IN ('completed','cancelled')

Charts:
- tasks by status
- tasks by priority
- tasks per employee
- overdue tasks by employee
- completed tasks per week for the last 8 weeks
- completion rate compared to previous period

Tables:
- most overdue tasks
- recently completed tasks
- tasks completed without evidence
- current blockers
- latest activity feed

Dashboard rules:
- all numbers must come from parameterized SQL queries
- filters must apply consistently to cards, charts, and tables
- include empty states
- show loading/error states
- use responsive layout
- no dashboard data visible to employees
```

* * *

# PROMPT 13: Search, Filters, Saved Views, and Export

```text
Implement advanced task search.

Search across:
- title
- description
- blocker_note
- comments

Filters:
- status
- priority
- department
- assigned user
- creator
- due date range
- created date range
- completed date range
- overdue only
- has evidence
- evidence skipped
- recurrence
- deletion requested

Requirements:
- server-side filtering
- parameterized SQL only
- pagination
- sorting
- saved filters per user
- reset filters button
- URL query parameters must preserve filter state

Exports:
1. CSV export for filtered task results.
2. XLSX export if a safe existing library is available.
3. PDF report for one task.

Task PDF must include:
- task metadata
- status
- priority
- assignee
- creator
- due date
- completion details
- completion comment
- evidence filenames
- comments
- activity history
- generated date

Do not expose attachment BLOB content inside CSV.
```

* * *

# PROMPT 14: Checklist and QC-Specific Enhancements

```text
Build QC checklist support inside every task.

Features:
- add checklist items
- reorder items
- mark item complete
- show completion percentage
- prevent completion if configured checklist items are incomplete
- allow manager/admin override with reason
- record every checklist change
- show checklist progress in task rows and dashboard

Add optional QC metadata:
- inspection type
- finding classification
- risk level
- corrective action required
- reference number
- audit batch or work order number

Do not force these fields on existing tasks without a migration.
Add them through a safe migration or make them nullable.

Use the existing roles and field-locking rules:
- employees may update checklist progress only if permitted
- managers/admins may edit checklist structure
- supervisors may edit checklist structure for tasks they own or supervise
```

* * *

# PROMPT 15: Security Hardening

```text
Perform a complete security pass.

Requirements:
- every protected page checks the session server-side
- every API endpoint checks the session server-side
- every API endpoint checks task ownership/visibility
- use prepared SQL statements only
- validate all input with Zod
- sanitize displayed filenames
- prevent path traversal
- enforce upload size limits before inserting BLOBs
- restrict MIME types and extensions
- use CSRF protection for state-changing requests
- use secure cookie settings in production
- generic login errors
- login rate limiting
- account lockout after repeated failures
- session expiration
- logout invalidates the server session
- no password hashes in responses
- no secrets committed to Git
- no database files committed to Git
- set security headers:
  Content-Security-Policy where compatible
  X-Content-Type-Options
  Referrer-Policy
  X-Frame-Options or frame-ancestors
- do not log passwords, cookies, tokens, or file contents

Create a SECURITY.md explaining the threat model and deployment requirements.
```

* * *

# PROMPT 16: Backup and Restore

```text
Implement automatic SQLite backup.

Requirements:
- backup qc_tasks.db once per day
- use SQLite backup API or a safe consistent-copy method
- never copy only the WAL file
- create:
  db/backups/qc_tasks-YYYY-MM-DD-HHmmss.db
- keep the latest 14 backups
- expose manual backup to admin only
- show backup status in admin settings
- log backup creation and failure
- never expose backup files over HTTP
- never commit backups to Git

Add restore documentation:
1. Stop the server.
2. Backup the current database.
3. Replace qc_tasks.db with the selected backup.
4. Remove stale WAL and SHM files.
5. Restart the server.
6. Verify table integrity with PRAGMA integrity_check.
```

* * *

# PROMPT 17: Testing and Acceptance

```text
Add automated tests and an end-to-end acceptance checklist.

Unit tests:
- permission checks
- employee field whitelist
- status transitions
- overdue calculation
- recurrence calculation
- dependency blocking
- upload validation
- login lockout
- notification creation

Integration tests:
- login/logout
- create user
- create task
- assign task
- employee updates progress
- employee cannot change title
- employee cannot delete
- deletion request workflow
- completion with evidence
- completion with skipped evidence
- completion without comment is rejected
- completed task is read-only
- manager reopens completed task
- dashboard blocked for employee
- attachment download authorization

Acceptance criteria:
- pnpm install works from repository root
- existing BRIGHTAI app still works
- QC app starts independently
- database is generated automatically
- SQLTools can browse the database
- all roles can log in
- dashboard is inaccessible to employees
- uploaded evidence survives server restart
- activity history records all critical actions
- no unauthorized employee field update succeeds
- recurring task creates the next task correctly
- overdue tasks appear correctly
- backup command creates a valid SQLite backup
```

* * *

# PROMPT 18: Deployment and Documentation

```text
Complete deployment documentation.

The QC app must run as Astro SSR on Node, not as a static site.

Document local setup:

1. Install dependencies.
2. Set environment variables:
   QC_DATABASE_PATH
   ADMIN_DEFAULT_PASSWORD
   SESSION_SECRET
   NODE_ENV
3. Start the app.
4. Open http://localhost:4321/login.
5. Change the default admin password immediately.
6. Connect SQLTools to:
   apps/qc-task-manager/db/qc_tasks.db

Document Render deployment:
- use a Node web service, not Static Site
- Node version 22 LTS
- build command matching the repository package manager
- start command for Astro Node standalone server
- persistent disk required for SQLite
- HTTPS required
- configure environment variables
- schedule database backups
- do not use ephemeral storage for qc_tasks.db

Create:
- apps/qc-task-manager/README.md
- apps/qc-task-manager/docs/SQLTOOLS.md
- apps/qc-task-manager/docs/ROLES-AND-PERMISSIONS.md
- apps/qc-task-manager/docs/DEPLOYMENT.md
- apps/qc-task-manager/docs/DATABASE.md
- apps/qc-task-manager/docs/TESTING.md

End with a final report containing:
- files created
- files modified
- commands executed
- tests passed
- known limitations
- deployment warning if Render is still configured as static
```

## القرار الأهم

لا تجعل الوكيل ينفذ كل البرومبتات دفعة واحدة. نفّذها بالتسلسل، وابدأ بـ **PROMPT 00**؛ لأن أكبر خطر حالياً هو تركيب تطبيق SSR داخل مشروع Render Static ثم اكتشاف أن تسجيل الدخول وSQLite والمرفقات لا تعمل.
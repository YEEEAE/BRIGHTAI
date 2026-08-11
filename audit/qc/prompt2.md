حللت المتاح من مستودع [YEEEAE/BRIGHTAI](https://github.com/YEEEAE/BRIGHTAI): المشروع Astro ومُعد حالياً كـ **Static Site على Render**، وهذا لا يناسب SQLite والجلسات ورفع الملفات؛ لذلك يجب تشغيل QC Task Manager كتطبيق **Astro SSR على Node** داخل `apps/qc-task-manager`، وعدم وضع قاعدة SQLite داخل Git.

هذه النسخة التنفيذية المصححة، وتلغي التعارضات الموجودة في الملفات القديمة: الـ Dashboard متاح لـ **admin + manager + supervisor**، الموظف يغلق المهمة مباشرة، والمهمة المكتملة تصبح Read-only مع إمكانية إعادة فتحها فقط للـ admin/manager.
* * *

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
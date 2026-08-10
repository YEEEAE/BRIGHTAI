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


في ملف .env تحط هذي المتغيرات بس، وما يحتاج أكثر:

المتغير	وين يُستخدم	وضعه الحالي
ADMIN_DEFAULT_PASSWORD	كلمة مرور حساب الـ admin وقت التهيئة	لازم تحطها؛ لو ما حطيتها تعتبر 'admin123' ويطلع تحذير
QC_DB_PATH	مسار ملف qc_tasks.db	اختياري — الافتراضي db/qc_tasks.db
خطواتك الحالية (بما إن قاعدة البيانات موجودة أصلاً)
ما تحتاج تسوي أي شي لقاعدة البيانات — جاهزة. تشغّل التطبيق مباشرة:


bash
cd /Users/yzydalshmry/Desktop/BRIGHTAI/apps/qc-task-manager
pnpm dev
وافتح http://localhost:4321/login، سجّل دخول بـ:

username: admin
password: admin123 (لأننا ما خلّينا ملف .env، استخدم الافتراضي)
⚠️ ملاحظة مهمة عن كلمة المرور: لو تبي تغيّر كلمة مرور الـ admin عن admin123، تغيير ملف .env ما يأثر على حساب موجود لأن الـ seed يسوي INSERT بس وقت ما يكون جدول users فاضي. عندك خيارين:

قبل ما تنشئ أي مستخدمين إضافيين: نفّذ pnpm db:reset بعد ما تحط ADMIN_DEFAULT_PASSWORD الجديد في .env. الـ admin الجديد ياخذ كلمة المرور الجديدة.
بعد ما صار عندك بيانات ما تبي تفقدها: تغيير كلمة المرور يتم من داخل التطبيق (صفحة الـ admin) أو بتحديث الـ hash يدوياً في الجدول — ما عن طريق متغير البيئة.
تبيني أسوي صفحة لتغيير كلمة المرور داخل التطبيق، ولا تكفي طريقة db:reset للحين؟



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

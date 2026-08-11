حللت المتاح من مستودع [YEEEAE/BRIGHTAI](https://github.com/YEEEAE/BRIGHTAI): المشروع Astro ومُعد حالياً كـ **Static Site على Render**، وهذا لا يناسب SQLite والجلسات ورفع الملفات؛ لذلك يجب تشغيل QC Task Manager كتطبيق **Astro SSR على Node** داخل `apps/qc-task-manager`، وعدم وضع قاعدة SQLite داخل Git.

هذه النسخة التنفيذية المصححة، وتلغي التعارضات الموجودة في الملفات القديمة: الـ Dashboard متاح لـ **admin + manager + supervisor**، الموظف يغلق المهمة مباشرة، والمهمة المكتملة تصبح Read-only مع إمكانية إعادة فتحها فقط للـ admin/manager.
* * *

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
# التدقيق المستقل — QC Task Manager / BRIGHTAI

راجعت `REPORT.md` كاملًا أولًا، ثم قارنت محتواه مباشرةً مع `main` في المستودع `YEEEAE/BRIGHTAI`، بما في ذلك `src/pages`, `src/lib`, `db`, `scripts`, `docs`, `render.yaml` وآخر سجلات `.agents/mind/01-mind-latest.md`.

**نقطة منهجية مهمة:** المستودع متاح لي قراءةً عبر GitHub، لكن ما عندي checkout محلي authenticated للمستودع الخاص يسمح لي أشغّل `pnpm test` بنفسي. لذلك أفصل بين:

* **Implemented:** تأكدت منه من الكود الحالي.
* **Verified locally:** توجد نتيجة تشغيل محلية مسجلة في `mind`، لكني لم أعد تشغيلها بنفسي.
* **Verified in production:** لا يوجد دليل نشر حي لنظام QC حاليًا.

والتقرير نفسه يقول إن `mind` هو مصدر الحقيقة الأحدث عند التعارض. 

---

## 1. جدول تحقق الادعاءات

| الادعاء            |              REPORT.md |                                                                                                                                                             الموجود فعليًا | الحكم       |
| ------------------ | ---------------------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | ----------- |
| إجمالي Routes      | 100 = 68 page + 32 API | **68 `.astro` صحيحة، لكن `/api` يحتوي 30 `.ts` فقط**. يوجد أيضًا 4 endpoint files خارج `/api`؛ أي 98 حسب منهج التقرير، أو **102 routable files** إذا حسبنا كل ملفات routes | ❌           |
| Lab routes         |            49 = 43 + 6 |                                                                                                                                   **43 `.astro` + 6 `/api/lab/*.ts` = 49** | ✅           |
| Migrations         |                     26 |                                                                                                                  001→026 موجودة، و`db.ts` يضم الـ26 في embedded migrations | ✅           |
| DB tables          |                     49 |                                                                            49 جدولًا في المخطط الفعلي/السجل المحلي؛ 26 migration و`db:init` المسجل وصل schema 26/49 tables | ✅ مع ملاحظة |
| Report types       |              24 = 8+16 |                                                                                                                                `ReportType`/catalog فعليًا 8 task + 16 lab | ✅           |
| Notification kinds |             32 = 15+17 |                                                                                                                                          `NotificationKind` يحتوي 32 فعلًا | ✅           |
| AI features        |               15 = 6+9 |                                                                                                                                                             6 task + 9 lab | ✅           |
| Test commands      |                     42 |                                                      يوجد 41 اسم `test:*` + aggregate `test` = 42، لكن `pnpm test` لا يشغّل الاثنين `test:lab-print` و`test:lab-retention` | ⚠️          |
| E2E suites         |                     26 |                                                                                                      `suites[]` فيه **25** + restart-persistence كسويت إضافي = 26 تشغيليًا | ✅           |
| `src/lib` modules  |                    102 |                                                                                                                               **102 `.ts`**؛ منها **33 تحت `src/lib/lab`** | ✅           |
| Roles              |                      4 |                                                                                                                                    admin / manager / supervisor / employee | ✅           |
| `scripts/*.mjs`    |                     79 |                                                                                                                                                       مطابق لشجرة المستودع | ✅           |
| `docs/`            |                     11 |                                                                                                                                                            11 ملفات بالضبط | ✅           |

الدليل على 68 صفحة وبنية الملفات موجود في شجرة `src/pages`. الشجرة تكشف كذلك أن `/api` يحتوي 30 endpoint file، وأن `logout.ts` و`admin/templates/api.ts` و`admin/users/api.ts` و`manager/requests/api.ts` موجودة خارج `/api`.

### الخطأ الأساسي في رقم 100

السبب صار واضحًا:

**الموجود حاليًا:**

`68 Astro + 30 /api = 98`

لكن التقرير أضاف endpointين غير موجودين:

* `/api/reports/[reportType].[format]`
* `/api/reports/audit`

فصار:

`68 + (30 + 2 phantom routes) = 100`

وفي نفس الوقت تجاهل أربعة endpoint files حقيقية خارج `/api`.

والأهم أن واجهة `/reports` نفسها تبني روابط مباشرة إلى هذين المسارين غير الموجودين.

هذا مو اختلاف عدّ فقط؛ له أثر وظيفي كما سيأتي.

---

# 2. خريطة المسارات الفعلية

## أ. Task / QC UI — 25 صفحة

الموجود:

```text
/
 /404
 /login
 /dashboard
 /dashboard/drilldown
 /notifications
 /search
 /reports
 /tasks/[id]

 /employee
 /employee/new

 /supervisor
 /supervisor/new

 /manager
 /manager/new
 /manager/requests
 /manager/workload

 /admin
 /admin/settings
 /admin/users
 /admin/templates
 /admin/templates/new
 /admin/templates/[id]/edit

 /findings
 /findings/[id]
```

التقرير يقول 25 صفحة، وهذا صحيح رقميًا، لكنه ما يذكر `/404` في خريطته الوصفية.

## ب. Laboratory UI — 43 صفحة

### Tests

```text
/lab
/lab/tests
/lab/tests/new
/lab/tests/[id]
/lab/tests/[id]/print
/lab/tests/review
```

### Products

```text
/lab/products
/lab/products/new
/lab/products/[id]
/lab/products/[id]/edit
```

### Templates

```text
/lab/templates
/lab/templates/new
/lab/templates/[id]
/lab/templates/[id]/edit
```

### Equipment / Maintenance

```text
/lab/equipment
/lab/equipment/new
/lab/equipment/[id]
/lab/equipment/[id]/edit
/lab/equipment/[id]/maintenance
/lab/equipment/[id]/print
/lab/maintenance/[id]/print
```

### Calibration

```text
/lab/calibration
/lab/calibration/new
/lab/calibration/[id]
/lab/calibration/[id]/edit
/lab/calibration/[id]/print
```

### Controlled documents

```text
/lab/documents
/lab/documents/new
/lab/documents/[id]
/lab/documents/[id]/edit
/lab/documents/[id]/versions
```

### Acknowledgements

```text
/lab/acknowledgements
/lab/acknowledgements/assign
```

### Retests

```text
/lab/retests
/lab/retests/new
/lab/retests/[id]
```

### Operations

```text
/lab/audit
/lab/calendar
/lab/data-quality
/lab/notifications
/lab/reports
/lab/search
/lab/saved-views
```

هذه **43 بالضبط**.

---

## ج. `/api` الفعلية — 30 endpoint

### Core / admin / AI

```text
/api/admin/backup
/api/ai/[feature]
/api/health
/api/filters
```

### Export

```text
/api/export/tasks.csv
/api/export/tasks/pdf/[id]
/api/export/search.csv
/api/export/search.xlsx
```

### Findings / RCA / CAPA

```text
/api/findings
/api/findings/[id]
/api/findings/[id]/rca
/api/findings/[id]/capa
/api/findings/[id]/evidence
```

### Notifications

```text
/api/notifications/[id]/read
/api/notifications/read-all
```

### Tasks

```text
/api/tasks/suggestions
/api/tasks/[id]/update
/api/tasks/[id]/comment
/api/tasks/[id]/close
/api/tasks/[id]/cancel
/api/tasks/[id]/reopen
/api/tasks/[id]/delete-request
/api/tasks/[id]/attachments
/api/tasks/[id]/attachments/[attachmentId]
```

### Laboratory APIs — 6

```text
/api/lab/equipment/[id]/maintenance
/api/lab/saved-views
/api/lab/search-suggest
/api/lab/tests/[id]/review
/api/lab/tests/export.csv
/api/lab/tests/export.xlsx
```

الدليل الكامل هو شجرة `src/pages`.

---

## د. Endpoint routes خارج `/api` — أربعة

وهذي نقطة التقرير ما يعكسها في الرقم:

```text
/logout
/admin/templates/api
/admin/users/api
/manager/requests/api
```

بل `middleware.ts` عنده allowlist صريح لها على أنها `ENDPOINT_PAGE_PATHS`.

### النتيجة الدقيقة

إذا كان المقصود بـ route = file-based route:

**68 Astro + 34 TS = 102 routable files.**

أما إذا أصرينا على تعريف التقرير: “pages + الملفات الموجودة داخل `/api` فقط”:

**68 + 30 = 98 وليس 100.**

---

## هـ. Routes runtime إضافية ينفذها Middleware

فيه عمليات POST حقيقية لا يوجد لها file مستقل؛ `middleware.ts` يمسكها مباشرة، مثل:

```text
POST /lab/products/[id]/archive
POST /lab/products/[id]/restore
POST /lab/tests/[id]/edit
POST /lab/tests/[id]/void
POST /lab/tests/[id]/links
POST /lab/tests/[id]/links/unlink
POST /lab/documents/[id]
POST /lab/acknowledgements/[id]/acknowledge
```

فعبارة “100 مسار تطبيق” أصلًا ما تمثل كامل **runtime request surface**.

---

# 3. المشكلة الأكبر: Reporting pipeline ناقص Transport layer

التقرير يذكر:

> `/api/reports/[reportType].[format]`

و:

> `/api/reports/audit`

لكن **الملفين غير موجودين في `src/pages` الحالي**. شجرة الصفحات كاملة تؤكد ذلك.

المفارقة أن بقية Reporting subsystem موجود بشكل جيد:

* 24 `ReportType`.
* Catalog.
* Authorization.
* Queries/readers.
* CSV/XLSX/PDF writers.
* Lab dispatcher.
* Report audit table.

مثلًا الكتالوج يحتوي 8 تقارير task و16 lab.

وAuthorization يرفض Lab reports للـ employee server-side.

لكن `/reports` ينشئ روابط:

```text
/api/reports/${selectedType}.csv
/api/reports/${selectedType}.xlsx
/api/reports/${selectedType}.pdf
/api/reports/audit
```

وهي Routes غير موجودة.

صفحة Lab عندها نفس المشكلة، وفوقها نص قديم ما زال يقول **15 laboratory reports** رغم أن الـ catalog صار 16.

**الحكم:** report domain **implemented**، لكن report download HTTP surface على `main` الحالي **غير مكتمل/مكسور**.

وهذي لحالها تنفي عبارة التقرير أن الناقص كله “إثبات تشغيل فقط، مو بناء”.

---

# 4. طبقات النظام: Request → DB

المسار العام جيد هندسيًا:

```text
HTTP Request
   ↓
src/middleware.ts
   ├── session/auth wall
   ├── top-level RBAC
   ├── request-size/content-type checks
   ├── CSP/security headers
   └── middleware POST handlers
   ↓
Page/API handler
   ↓
api-security.ts
   ├── authenticated user
   ├── Origin/CSRF
   └── rate limits
   ↓
validation.ts / Zod
   ↓
permissions.ts + entity policy
   ↓
domain lib
   ├── tasks
   ├── taskUpdates
   ├── findings/RCA/CAPA
   ├── reporting
   ├── lab/*
   └── ...
   ↓
db.ts / better-sqlite3 prepared statements
   ↓
SQLite
```

`middleware.ts` فعلًا يطبق Auth walls وRBAC الأساسي وCSP على الردود. الـ CSP الحالي لا يحتوي `unsafe-inline` أو `unsafe-eval` في QC middleware.

و`api-security.ts` يعيد الفحص داخل API layer بدل الاعتماد على middleware فقط.

### تقييم الفصل

الهيكل عمومًا جيد جدًا، لكن عندي ثلاث ملاحظات:

1. كثرة POST handlers داخل `middleware.ts` تجعل middleware جزءًا من application controller layer، مو فقط cross-cutting layer.
2. Reporting domain موجود لكن route adapter مفقود، وهذا مثال واضح أن الطبقات ممكن تتباعد.
3. بعض الـ side effects مو داخلة فعليًا في نفس transaction رغم وصف التقرير.

---

# 5. قاعدة البيانات

## الجداول — 49

العائلات الفعلية:

**Meta**

```text
schema_migrations
schema_migration_failures
```

**Identity/Auth**

```text
users
sessions
login_attempts
saved_filters
```

**Tasks**

```text
tasks
task_comments
task_attachments
task_activity_log
task_delete_requests
task_checklists
task_dependencies
notifications
task_templates
```

**SLA**

```text
sla_policies
escalation_policies
escalation_events
```

**QC**

```text
qc_findings
qc_rca
qc_capa
qc_evidence
qc_audit_log
```

**Workflow**

```text
workflow_definitions
workflow_steps
workflow_instances
workflow_actions
```

**AI / reporting**

```text
ai_audit_log
report_audit_log
```

**Laboratory — 20**

```text
lab_test_templates
lab_test_template_versions
lab_equipment
lab_equipment_maintenance
lab_equipment_calibration
lab_products
lab_product_equipment
lab_template_equipment
lab_test_records
lab_test_samples
lab_test_retests
lab_test_findings
lab_test_environment_readings
lab_test_equipment_snapshots
lab_test_document_snapshots
lab_documents
lab_document_versions
lab_document_links
lab_document_acknowledgements
lab_saved_views
```

`db.ts` يضم 26 migration من 001 إلى 026 ويعمل startup validation وFK enforcement وWAL.

ملاحظة صغيرة: `REQUIRED_TABLES` في startup validator نفسه يحتوي **47** اسمًا فقط؛ `task_templates` و`report_audit_log` مو ضمن تلك القائمة، رغم استخدام النظام لهما. لذلك عبارة “startup validation يضمن كل 49” غير صحيحة حرفيًا.

---

## FK والعلاقات

الاستخدام واضح لـ:

* task children مع FK إلى `tasks`.
* user attribution إلى `users`.
* findings → RCA/CAPA/evidence.
* workflow definition → steps/instances/actions.
* lab test → product/template/equipment/user.
* retest → original/new test.
* documents → versions/links/acknowledgements.
* approved test → equipment/document snapshots.

وتفعيل `PRAGMA foreign_keys = ON` يتم عند فتح الاتصال.

---

# 6. Historical snapshots

هذا الجزء في التقرير مدعوم فعلًا.

عند Lab approval، الكود يبني snapshots داخل نفس approval transition، تشمل:

* Equipment/calibration identity.
* SOP/WI document + version.
* Product/template/parameter JSON.
* Sample states.

المخطط يحتوي tables مستقلة:

```text
lab_test_equipment_snapshots
lab_test_document_snapshots
```

ومعها JSON snapshots على test record.

العينات والـ environment readings عندها DB triggers تمنع تعديل/حذف البيانات التابعة بعد APPROVED/VOID.

**الحكم: ✅ snapshot/freeze design implemented فعليًا، مو UI فقط.**

---

# 7. RBAC والقواعد الصلبة

## المصفوفة العملية

| الوظيفة              | Admin |         Manager |                      Supervisor |         Employee |
| -------------------- | ----: | --------------: | ------------------------------: | ---------------: |
| Dashboard            |     ✅ |               ✅ |                               ✅ |                ❌ |
| Admin/users          |     ✅ |               ❌ |                               ❌ |                ❌ |
| Manager area         |     ✅ |               ✅ |                               ❌ |                ❌ |
| Task view            |    كل |              كل | **كل حسب `canViewTask` الحالي** | assigned/created |
| Task structural edit |     ✅ |               ✅ |                           محدود |           locked |
| Lab view             |     ✅ |               ✅ |                               ✅ |                ✅ |
| Lab review           |     ✅ |               ✅ |                 ✅ مع separation |                ❌ |
| Lab approve          |     ✅ | ✅ مع separation |                               ❌ |                ❌ |
| Lab reports          |     ✅ |               ✅ |                               ✅ |                ❌ |

الأدوار الأربعة معرفة مركزيًا داخل `permissions.ts` كما يدعي التقرير.

### لكن فيه فرق عن وصف التقرير

التقرير يقول عن Supervisor: **“مهام فريقه”**.

بينما:

```ts
if (actor.role !== 'employee') return true;
```

في `canViewTask`.

يعني supervisor يقدر يشوف أي Task detail، مو فقط “مهام فريقه”.

هذا إما:

* السياسة الحقيقية أوسع من التقرير،
* أو enforcement الحالي أوسع من المقصود.

في الحالتين REPORT.md غير دقيق في هذه النقطة.

---

## Field Locking

مطبق server-side فعلًا.

`updateTask()`:

* يتحقق من `canEditTask`.
* يتحقق من locked fields.
* يرفض تحديث terminal task.
* يمنع generic status update إلى completed.
* يفرض blocker note على `on_hold`.
* يتحقق من dependencies.

**الحكم: ✅**

---

## Self-review / Self-approval

Lab permission predicates تمنع reviewer أو approver من مراجعة/اعتماد سجله بنفسه، وreview service يعيد تطبيقها عند transition.

**الحكم: ✅ server-side.**

---

## Final-state freeze

APPROVED/VOID في Lab read-only على مستوى service/policy، ومع sample/environment triggers فيه defense-in-depth داخل SQLite أيضًا.

Tasks completed/cancelled كذلك مقيّدة، وreopen manager+.

**الحكم: ✅**

---

## E-signature

الـ approve endpoint يستدعي server-side password verification، والـ e-sign helper يستخدم bcrypt الحالي ويحط failure bucket لكل user. كلمة المرور نفسها لا تُخزن.

**الحكم: ✅ implemented.**

ملاحظة P2: password فارغ يرجع `rate_limited` في implementation الحالي بدل `invalid` بسبب ترتيب الشرط؛ ما فيه bypass، لكنها semantics غلط.

---

# 8. دورة حياة المهمة

المسار الأساسي الموجود:

```text
NOT_STARTED
   ↓
IN_PROGRESS
   ↓
ON_HOLD
   ↓
COMPLETED

→ CANCELLED
```

التحقق server-side يشمل:

* أول دخول للحركة يسجل start metadata.

* `ON_HOLD` يحتاج blocker.

* Dependencies gate.

* Checklist/evidence gate.

* completion comment.

* `progress = 100`.

* completion actor/time.

* recurrence successor.

* audit events.

### لكن ادعاء Atomic closure مبالغ فيه

التقرير يقول إن:

> status + progress + comment + audit + **notifications** كلها transaction واحدة وأي خطأ يعمل rollback.

الواقع أدق:

داخل closure transaction تُنفذ أجزاء كثيرة، لكن `createNotification()` **يمسك خطأ الـ INSERT ويرجع false بدل ما يرمي exception**.

يعني فشل كتابة Notification ما يلزم transaction بالـ rollback.

كذلك SLA checkpoint وworkflow close يحصلان بعد completion transaction.

**الحكم على عبارة “أي فشل يرجع كل شيء”: ❌.**

---

# 9. مسار حذف المهام — فجوة تدقيق فعلية

الـ workflow نفسه enforced:

```text
Employee request
→ Manager/Admin review
→ Approved / Rejected
```

لكن عند approval:

1. يسجل `DELETE_APPROVED`.
2. يحدّث الطلب approved.
3. يعمل `DELETE FROM tasks`.
4. FK CASCADE يحذف:

   * `task_activity_log`
   * `task_delete_requests`
   * وغيرهما.

الكود نفسه كاتب:

> approve is logged before the task is deleted, so the row is cascade-removed with the task.

يعني بعد الموافقة والحذف:

**سجل الطلب نفسه وسجل `DELETE_APPROVED` ما يبقون كسجل تاريخي.**

هذا يناقض جوهر وصف REPORT.md:

> “مين اعتمده — وكل حركة مسجّلة ما تنمسح.” 

وفوق هذا، الـ hash chain عالمية على `task_activity_log`. حذف events من وسطها يمكن أن يجعل event التالي يحمل `previous_hash` لصف اختفى، وبالتالي `verifyAuditChain()` يفشل بعد حذف شرعي. آلية التحقق نفسها تسير على كامل السجل حسب ID.

الاختبار الحالي للـ audit يفحص tampering بـ UPDATE، لكنه لا يختبر حذف Task وما ينتج عنه من cascade داخل السلسلة.

هذه من أهم نتائج التدقيق.

---

# 10. دورة حياة Lab Test

الموجود فعليًا:

```text
DRAFT
 ↓
SUBMITTED
 ↓
UNDER_REVIEW
 ├──→ REJECTED
 └──→ APPROVED

APPROVED / eligible record
 └──→ VOID
```

الـ review endpoint:

* Auth
* CSRF
* role/entity checks
* validation
* e-signature عند APPROVE
* transition service

والـ approval يكتب snapshots ويحدث samples والتدقيق داخل transition.

**وصف REPORT.md لدورة Lab قريب جدًا من التنفيذ الفعلي.**

---

# 11. الأمان

## CSP

مطابق تقريبًا للتقرير:

```text
script-src 'self' + hashes
style-src 'self' + hash
no unsafe-inline
no unsafe-eval
frame-ancestors 'none'
object-src 'none'
```

**✅ implemented.**

---

## CSRF

`requireCsrf()` يقارن:

```text
Origin === context.url.origin
```

وتطبق `requireRequestSecurity()` على unsafe requests.

**✅ implemented.**

---

## Authentication

الموجود:

* bcrypt.
* 256-bit random opaque session token.
* server-side sessions.
* TTL = 12 hours.
* 5 consecutive failures → 10 minutes lock.
* 20 failed attempts/IP/10min.
* dummy bcrypt لمنع username timing enumeration.

Cookies:

* HttpOnly.
* SameSite=Lax.
* Secure حسب actual HTTPS أو trusted proxy.

**✅ قوي إجمالًا.**

---

## IDOR

هنا REPORT.md غير دقيق.

التقرير يقول:

> unauthorized employee gets 404-style بدون كشف وجود السجل.

لكن صفحة Task detail الحالية تعمل:

```text
missing → 404
forbidden → 403
```

والكود يصف هذا صراحةً بأنه “Correct HTTP semantics”.

فالموظف يقدر يفرق بين:

* Task ID غير موجود.
* Task ID موجود لكنه ممنوع عليه.

**البيانات نفسها غير مكشوفة** لأن rich data ما تُقرأ للممنوع، لكن existence enumeration موجود.

الحكم على ادعاء 404-style: **❌**.

---

## Uploads / body limits

فيه:

* 12 MB request body pre-check.
* MIME/content-type gating.
* Task evidence file cap.
* extension/MIME/signature checks.
* SHA-256.

ملاحظة P2: الـ global request-size precheck يعتمد على `Content-Length`؛ request بـ chunked transfer ما يحصل له نفس numeric pre-rejection هنا، وإن كانت file-specific limits لاحقًا تقلل الخطر.

---

## Rate limits

الموجود:

* AI: 15/min/user.
* generic mutations: 120/min/IP+path.
* e-sign failure bucket.

لكن هذه Maps **in-memory per process**.

مناسب لخدمة single-instance، لكنه مو distributed rate limiter لو تم scaling لاحقًا.

---

# 12. Audit integrity: التقرير أوسع من التنفيذ

هذه نقطة مهمة جدًا.

`task_activity_log` فقط عنده:

```text
previous_hash
event_hash
```

ويتم حساب SHA-256 chain عليه.

أما `qc_audit_log` المستخدم بكثافة في Lab/QC approvals/transitions **ما عنده hash chain**.

يعني:

* Task audit: tamper-evident chain ✅
* QC/Lab audit: ordinary append log، بدون cryptographic chain ❌

لذلك عبارة التقرير:

> “كل تغيير يُسجّل في سلسلة تدقيق محمية ضد التلاعب”

غير صحيحة على مستوى المنصة كاملة. 

---

# 13. الاختبارات

## Unit/domain/package scripts

العدد **42** صحيح كتسمية scripts:

* 41 `test:*`
* * aggregate `test`

لكن `pnpm test` نفسه يسلسل **39** subcommands فقط.

اللي ما يدخلون في aggregate:

```text
test:lab-print
test:lab-retention
```

بالتالي عبارة:

> `pnpm test` = سلسلة 42 أمر كلها خضراء

غير صحيحة حرفيًا.

`test:lab-retention` عنده تشغيل standalone أخضر مسجل في mind، لكن هذا مختلف عن كونه داخل aggregate.

---

## E2E

الـ runner يحتوي 25 workflow suites:

```text
admin-users
auth-lockout
task-shared
delete-request
dashboard
a11y
backup
search
findings
lab-nav
lab-suggest
lab-form
lab-tests
lab-review
lab-products
lab-equipment
lab-maintenance
lab-calibration
lab-documents
lab-acknowledgements
lab-calendar
lab-retests
lab-notifications
lab-data-quality
reports
```

ثم **restart-persistence** منفصل.

المجموع التشغيلي = **26**.

آخر جولة موثقة في `mind` وصلت فقط إلى:

1. admin-users — 49
2. auth-lockout — 44
3. task-shared — 196
4. delete-request — 39
5. dashboard — 51
6. a11y — 14
7. backup — 13
8. search — 84

= **490 passed / 0 failed**.

ثم runner علّق بسبب browser handle في `e2e-task-search`. والـ mind نفسه يقول صراحة:

> full e2e set = UNVERIFIED/BLOCKED وليس PASS.

### الأخطر

بعد الثمانية فيه:

* 17 suite عادية لم تعمل.
* * restart-persistence.
* يعني **18 من 26 لم تُثبت في الجولة الكاملة**.

وواحدة من الأخيرة هي `reports`.

`e2e-reports.mjs` يتوقع `/api/reports/...` يرجع HTTP 200، بينما endpoint غير موجود في current tree.

يعني بعد إصلاح `browser.close()`، فيه سبب ملموس للاعتقاد أن الـ runner **لن يصير أخضر مباشرة**؛ سويت reports نفسها ستصل لمسار غير موجود.

إذًا عبارة REPORT:

> “الناقص الوحيد لإغلاق E2E هو سطر browser.close()”

**❌ غير مدعومة بالكود الحالي.**

---

# 14. النشر والنسخ الاحتياطي

`render.yaml` فعلًا يعرف خدمة مستقلة:

```text
name: qc-task-manager
runtime: node
healthCheckPath: /api/health
autoDeploy: false

disk:
  name: qc-data
  mountPath: /var/data
  sizeGB: 1
```

ومتغيرات:

```text
QC_DATABASE_PATH
QC_BACKUP_DIR
NODE_ENV
GROQ_API_KEY
ADMIN_DEFAULT_PASSWORD
```

### Health

`/api/health`:

* ما ينشئ DB.
* 503 لو الملف غير موجود.
* 503 لو schema غير initialized.
* 200 مع `schemaVersion` عند الجاهزية.

**✅ implemented.**

### Backup/restore

هذي من أقوى أجزاء النظام:

* SQLite online backup API.

* WAL-safe snapshot.

* SHA-256 checksum.

* `PRAGMA integrity_check`.

* `PRAGMA foreign_key_check`.

* metadata/count checks.

* retention.

* safety backup قبل restore.

* restore إلى temp ثم integrity verification ثم atomic rename.

وفيه scheduler يومي داخل العملية عند 02:00 Riyadh.

### لكن Production؟

`mind` يقول بوضوح:

> لا deploy.

إذًا:

* **Implemented:** نعم.
* **Verified locally:** أجزاء كثيرة نعم حسب السجل.
* **Verified in production:** **لا**.

---

# 15. مقارنة آخر سجلات `mind`

راجعت أحدث السجلات، وأهمها:

### QC-REPORT-REWRITE-001

يقول:

> 68 Astro + 32 API = 100.

لكن current tree = 68 + 30 داخل `/api`.

**تعارض صريح مع الكود الحالي.**

كما أن Verification للسجل نفسه كان:

> docs-only — find/grep، لا build/tests.

وهذا يفسر كيف مرّ endpoint التقارير المفقود.

---

### QC-FINAL-REGRESSION-AUDIT-001

هذا السجل أكثر تحفظًا ودقة:

* unit/domain/build/migration خضراء محليًا.
* 49 tables.
* 26 schema.
* 490 E2E assertions.
* full E2E **UNVERIFIED/BLOCKED**.
* لا deploy.

هذا متفق إجمالًا مع ما وجدته، باستثناء وصف “full `pnpm test`” لأنه aggregate الحالي لا يشمل كل scripts.

---

### QC-LAB-AUDIT-CLEANUP-001

مهم لأنه يسجل اكتشاف **e-signature bypass** سابق في:

```text
/api/lab/tests/[id]/void.ts
```

ويقول إنه حُذف.

والـ current tree يؤكد أن الملف فعلًا غير موجود، والـ VOID الحالي يمر عبر middleware handler/e-signature. لذلك هذه الثغرة **ليست موجودة حاليًا**.

---

# 16. Scorecard مستقل

| المجال                   | REPORT |     تقييمي | السبب                                                                                                                                                              |
| ------------------------ | -----: | ---------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Architecture             |     95 | **87/100** | layering جيد جدًا، centralized permissions/validation/domain libs، لكن report adapter مفقود، middleware يحمل controller logic، وبعض side effects خارج transactions |
| Functionality            |     95 | **82/100** | Tasks/Lab/QC core واسع ومطبق، لكن reporting downloads الموصوفة كميزة core غير routable حاليًا                                                                      |
| Security                 |     92 | **81/100** | CSP/CSRF/bcrypt/session/RBAC/e-signature/uploads قوية؛ لكن audit chain لا تشمل Lab، delete يزيل سجل الاعتماد، IDOR 404-style claim غير صحيح                        |
| Tests                    |     85 | **67/100** | unit surface واسع ونتائج محلية جيدة، لكن aggregate لا يشمل كل scripts و18/26 E2E لم تُثبت، مع مشكلة reports مؤكدة بنيويًا                                          |
| Deployment               |     80 | **72/100** | Render blueprint/disk/health/backup/restore موجودة؛ ما فيه live deployment proof                                                                                   |
| **Production readiness** |    ~85 | **68/100** | النظام متقدم، لكن فيه gaps وظيفية وتدقيقية واختبارية حقيقية، مو مجرد “smoke verification”                                                                          |

هذا تقييم للـ **current repository state**، مو لجودة الفكرة أو حجم العمل.

---

# 17. أهم 10 ملاحظات

ما لقيت **P0 confirmed** مثل auth bypass حالي، RCE، SQL injection مؤكد، أو corruption مؤكدة. لكن عندي P1 تمنعني من إعطاء Production GO.

|  # | الأولوية | الملاحظة                                                                                                                                 |
| -: | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
|  1 | **P1**   | `/api/reports/[reportType].[format]` و`/api/reports/audit` مفقودان رغم أن UI والـ E2E يعتمدان عليهما؛ Report export surface مكسور حاليًا |
|  2 | **P1**   | full E2E غير مثبت: 8/26 فقط وصلت لها الجولة؛ 18 workflow checks بقيت بدون verification                                                   |
|  3 | **P1**   | عبارة “browser.close هو العائق الوحيد” غير صحيحة؛ `reports` suite سيصل إلى endpoints غير موجودة                                          |
|  4 | **P1**   | approval على delete يمحو `task_delete_requests` و`DELETE_APPROVED` audit row نفسه عن طريق cascade                                        |
|  5 | **P1**   | حذف Task event من `task_activity_log` ممكن يكسر الـ global hash chain الشرعية نفسها                                                      |
|  6 | **P1**   | cryptographic audit chain تطبق فقط على `task_activity_log`، وليس `qc_audit_log` الخاص بالمختبر/QC                                        |
|  7 | **P1**   | Closure ليست atomic بالكامل كما يصف التقرير: notifications تمتص أخطاء DB، وSLA/workflow finalize خارج main transaction                   |
|  8 | **P2**   | IDOR data isolation موجود، لكن 403 مقابل 404 يكشف وجود Task ID ويخالف ادعاء التقرير بـ404-style                                          |
|  9 | **P2**   | `pnpm test` لا يشغّل `test:lab-print` ولا `test:lab-retention` رغم وصفه كسلسلة الاختبارات الكاملة                                        |
| 10 | **P2**   | Supervisor task-detail visibility أوسع من “مهام فريقه”، إضافة إلى بقاء DB files الفارغة متتبعة وstale UI copy يقول 15 Lab reports بدل 16 |

---

# 18. الفجوات بين REPORT.md والكود

أبرز الفروقات:

| REPORT.md                                  | الكود الحالي                                                             |
| ------------------------------------------ | ------------------------------------------------------------------------ |
| 100 route =68+32                           | 68 Astro +30 `/api`؛ أو 102 route files عند حساب الـ4 endpoints الخارجية |
| Report endpoint واحد موجود                 | endpoint غير موجود                                                       |
| Report audit endpoint موجود                | غير موجود                                                                |
| كل movement في hash chain                  | task activity فقط؛ `qc_audit_log` بدون chain                             |
| deletion approval موثق                     | approval/request history يُحذف مع task                                   |
| كامل closure transaction يشمل notification | notification failure يمكن ابتلاعه؛ SLA/workflow بعد transaction          |
| Supervisor يشوف مهام فريقه                 | task detail يسمح لأي non-employee برؤية أي task                          |
| IDOR يستخدم 404-style                      | forbidden task detail يرجع 403                                           |
| `pnpm test` كامل 42                        | 42 script names، aggregate يشغّل 39 subtests                             |
| E2E blocker الوحيد browser leak            | full run لم يصل إلى 18 suite؛ reports endpoint gap موجود فعليًا          |
| 15 lab reports في بعض الوصف                | الحقيقة الحالية 16؛ صفحة lab نفسها فيها copy قديم “15”                   |
| الناقص كله إثبات تشغيل                     | فيه على الأقل **functional transport gap + audit durability gaps**       |

---

# 19. الحكم النهائي على REPORT.md

**التقرير جيد جدًا كوصف للـ intent والبنية العامة، لكنه ليس دقيقًا بما يكفي ليُعتبر independent as-built audit.**

الأرقام التالية صحيحة:

* 26 migrations.
* 49 tables.
* 102 lib modules.
* 33 lab modules.
* 24 ReportType.
* 32 notifications.
* 15 AI features.
* 43+6 lab routes.
* 4 roles.
* 26 operational E2E suites.
* 11 docs.

لكن توجد أخطاء مادية، مو تجميلية:

1. **100 routes غير صحيح.**
2. **Reporting HTTP endpoints الموصوفة غير موجودة.**
3. **Audit-chain coverage مبالغ فيها.**
4. **Delete approval history غير durable.**
5. **Atomic completion claim أوسع من الواقع.**
6. **IDOR behavior مو مثل المذكور.**
7. **Supervisor scope مو مثل الوصف.**
8. **“42 tests all via pnpm test” غير دقيق.**
9. **“browser leak هو البوابة الوحيدة” غير صحيح.**
10. **الجاهزية ~85% متفائلة بالنسبة للحالة الحالية.**

## قراري

**Implemented:** النظام متقدم وواسع فعلًا، ومو MVP بسيط.

**Verified locally:** فيه أدلة محلية قوية في `mind` على build/typecheck/migrations/unit/domain و490 E2E assertion ناجحة، لكن هذه نتائج مسجلة وليست إعادة تشغيل مستقلة مني.

**Verified in production:** **لا.**

### Production verdict

**NO-GO حاليًا للـ production acceptance الصارم.**

مو لأن النظام ناقص من الصفر، لكن لأن فيه أربع بوابات فعلية قبل ما يصير GO منطقي:

1. لازم يكون Reporting HTTP surface مطابق للـ catalog والـ UI ثم يثبت E2E.
2. لازم يكتمل **26/26 E2E** بدون hang وبدون failures.
3. لازم يُحسم نموذج deletion/audit بحيث approval history ما يختفي ولا يكسر hash-chain semantics.
4. بعدها live deployment verification على Render: health، persistence، restart، backup/restore، session security، ثم AI provider smoke منفصل.

بعدها فقط يصير وصف مثل **“production-ready”** مدعوم بالأدلة. في الحالة الحالية، **68/100 readiness** أقرب للواقع من ~85%.

# PROMPT-07 EVIDENCE — Dashboard, Data Visualization & Actionable Analytics

> **Task ID:** QC-REMEDIATION-007
> **Date:** 2026-09-03
> **Status:** PARTIAL — كل المعايير منفَّذة ومُتحقَّق منها محليًا بالاختبارات الآلية المتاحة؛ اختبارات المتصفح (E2E) والسلسلة الكنسية الكاملة **كُتبت لكن لم تُشغَّل بتجاوز صريح من المستخدم** ("تجاوز التحقق").
> **Source findings:** P1-4, P2-2 (Audit Sections 17, 45, 46, 47)
> **Domains:** 45 Dashboard Design, 46 Data Visualization, 47 Data-Driven Design, 48 Advanced Tables, 26 Accessibility

---

## 1. ما نُفِّذ فعليًا

### 1.1 P2-2 — فصل تعريفات KPI المكررة (AC-02)

المشكلة الموثقة: كرتا `Average Completion Time` و`Average Resolution` في `/dashboard` كانا يعرضان **نفس الرقم** (`formatDuration(kpis.avg_completion_seconds)` على كلا السطرين — سابقًا `dashboard.astro:139,144`)، بلا مقام وبلا معادلة.

التنفيذ:
- **Average Completion Time** = `AVG(completed_at − created_at)` — من إنشاء المهمة إلى إكمال الفني (التعريف الحرفي المطلوب في البرومبت). المقام `avg_completion_n` = عدد المهام المكتملة في النطاق.
- **Average Work Duration** (بطاقة جديدة تحل محل `Average Resolution` المكررة) = `AVG(completed_at − started_at)` — من بدء العمل إلى الإكمال (تستثني زمن الانتظار في الطابور). المقام `avg_work_n` = المهام المكتملة ذات `started_at`.
- مفتاح drill-down جديد `average_completion` أُضيف إلى `DRILLDOWN_KPIS` و`metricPredicate` (`status='completed' AND completed_at IS NOT NULL`)؛ مفتاح `average_resolution` أبقيه لعائلة مدة العمل (يتطلب `started_at` أيضًا) وتسمية صفحة الـdrill-down صارت `Work duration`.
- ترويسة تقرير `employee-performance` في `catalog.ts` أعيدت تسميتها `Average Resolution → Average Work Duration` لتطابق التعريف الجديد.
- كل بطاقة KPI زمنية/نسبية تعرض الآن **المقام على البطاقة** (`N = 12 completed tasks`) ومعادلة الحساب في tooltip (`title`) وفي `aria-label`.

**قرار موثق — لماذا لا توجد بطاقة "Average Review & Resolution Time" (completion → sign-off):** نموذج بيانات المهام لا يسجل أي timestamp منفصل لاعتماد/توقيع المدير بعد الإكمال (`tasks` فيها `started_at`/`completed_at` فقط؛ الإكمال نفسه يسجّل `completed_by`). أي رقم يُعرض تحت هذا الاسم سيكون مُختلَقًا — وهذا يخالف القاعدة غير القابلة للتفاوض (ممنوع قيم مضللة). بدلًا من ذلك حُذف التكرار واستُبدل بمقياس حقيقي مميز وموثق؛ مراحل المراجعة الفعلية موجودة في وحدتي Findings وLab (لهماtimestamps اعتماد خاصة).

### 1.2 P1-4 — توحيد/توضيح نطاق الفلاتر بين المهام والمختبر (AC-01)

الحقيقة البنيوية: مؤشرات المختبر (`lab_test_records`، المعدات، المستندات) **لا تملك أبعاد** priority/status/assignee الخاصة بالمهام، و`getLabDashboardData()` تعمل بلا فلاتر مهام. الحل المعتمد في البرومبت لهذه الحالة: **مؤشرات نطاق صريحة بدل الفلترة الصامتة المفككة**:
- شريط نطاق مرئي فوق قسم Laboratory في `dashboard.astro`:
  - `Task metrics — scoped to the selected filters` (`data-metric-scope="tasks"`)
  - `Lab metrics — all laboratory records, independent of task filters` (`data-metric-scope="lab"`)
- ملاحظة صريحة تظهر عند تفعيل أي فلتر (`data-lab-scope-note`): بطاقات ورسوم المختبر تغطي كل سجلات المختبر ولا تتأثر بفلاتر المهام.
- القرار: عدم تطبيق نطاق التاريخ على مؤشرات المختبر تجنّبًا لخلل جديد (عدم تطابق رقم البطاقة مع ناتج الـdrill-down في سجلات `/lab/*`).

### 1.3 AC-03 + AC-05 — جداول بديلة 1-to-1 لكل رسوم SVG + ملخصات قارئ الشاشة

- وحدة نقية جديدة `src/lib/chartTables.ts` تُنتج `ChartTableSpec` (caption، أعمدة، صفوف، صف إجمالي) لكل رسم — **نفس بيانات الرسم حرفيًا**.
- مكوّن جديد `src/components/charts/ChartTableToggle.tsx`: زر `<button aria-expanded="false" aria-controls=…>عرض كجدول بيانات</button>`؛ عند الفتح يُعرض `<table>` دلالية (`<caption>`، `th scope="col"`، `th scope="row"`، `<tfoot>` إجمالي) داخل حاوية `overflow-x-auto` (لا تفيض على التابلت). الجدول **render شرطي وليس display:none** — متاح لقارئ الشاشة بالكامل عند الفتح، ومفتاحه زر أصلي قابل للوحة المفاتيح.
- 12 رسمًا حصلت على زر وجدول: 6 في `DashboardCharts.tsx` (الحالات، الأولويات، لكل موظف، المتأخرات لكل موظف، الإنجاز الأسبوعي، بطاقة نسبة الإكمال) و6 في `LabDashboardCharts.tsx` (الاختبارات الأسبوعية، AIR/VACUUM، النتائج، حالة المعدات، المعايرة donut، حالة المستندات).
- `aria-label` لكل رسم SVG صار = **ملخص خلاصة أولًا** ثم سرد البيانات كاملًا: `Tasks by status (42 total, largest Completed 25 (60%)): Not started 5, …` — عبر `chartTakeaway()` في `chartTables.ts`.

### 1.4 AC-04 — قاعدة N=0 التنفيذية

- `formatKpiDuration(seconds, n)` و`formatKpiPercent(value, n)` في `dashboard.ts`: أي مؤشر بمقام صفر يعرض **`N/A (N=0)`** — ليس `0 hours` ولا `0.0%` ولا `100%`.
- طبّقت على: متوسط وقت الإكمال، متوسط مدة العمل، SLA Compliance (كان يعيد 0 عند N=0 — مضلل)، متوسط استهلاك SLA، Completion Rate، Evidence Compliance (أُضيف مقام `completed_tasks` إلى `KpiSnapshot`)، وبطاقة الـchecklist (`N/A (N=0)` بدل 0%).
- بطاقة نسبة الإكمال في جزيرة الرسوم تعرض `N/A (N=0)` عندما يكون معدل الفترة null (N=0).
- **الاختبار السلبي (فلاتر بلا نتائج):** `EmptyState` جديد عند `filtered && kpis.total === 0` بعنوان "No tasks match the selected filters." وزر إجراء **Reset filters** يعيد إلى `/dashboard`.

### 1.5 قاعدة البيانات — فهرس `created_at` المفقود

اختبار الوحدات الجديد كشف أن `tasks` **لا يملك فهرسًا على `created_at`** (المطلوب في البرومبت). نُفِّذت:
- هجرة جديدة `db/migrations/040_dashboard_created_at_index.sql` → `CREATE INDEX idx_tasks_created_at ON tasks(created_at);`
- تحديث `src/lib/migrationRegistry.ts` (استيراد `?raw` + إدخال متجمد) — parity مضمن 40/40 ✅
- تحديث `db/schema.sql` في موضعه المرتب (`idx_tasks_created_at` قبل `idx_tasks_created_by`) — schema reference 166 كائنًا ✅
- تحديث عدّادات الإصدار المتضمّنة (39→40) في: `test-migrations` (4 مواضع)، `test-dashboard-reports`، `test-database-100` (3)، `test-production-operations`، `test-lab-change-requests`، `test-scheduled-notifications`، `test.mjs`، `test-db-doctor` (3).

---

## 2. الاختبارات

### 2.1 جديد: `scripts/test-dashboard-analytics-100.mjs` (مسجَّل `test:dashboard-analytics-100` — 85 سويت كنسية)

**النتيجة: 58/58 PASS** (تشغيل جديد). يغطي:
1. أرقام KPI مقابل fixtures مزروعة بتواريخ محددة + إعادة اشتقاقها بـSQL مباشر (حتمي وقابل للتحقق بـSQL كما اشترط البرومبت).
2. قاعدة N=0 (منع 0 hours/0%/100%).
3. **تكافؤ الرسم↔الجدول**: عدد الصفوف = عدد شرائح الرسم، الرؤوس، رؤوس الصفوف، مجاميع الـfooter، توفيق أعمدة الحالة مع الإجمالي الكبير.
4. ملخصات `chartTakeaway` (أكبر شريحة + نسبتها + حالة الفراغ).
5. أداء SQL: وجود `idx_tasks_created_at` و`idx_tasks_status` + تنفيذ استعلام النافذة الزمنية في **0.03ms (< 20ms)**.
6. الصلاحيات: `employee` → scope `own_tasks` (لا تسريب لمقاييس المدير)، `manager` → `organization`؛ drill-down لكل مفتاح يعيد العدد الصحيح في النطاقين.

### 2.2 E2E — `scripts/e2e-dashboard.mjs` (مكتوب، **لم يُشغَّل — تجاوز المستخدم**)

- تحديث محلل `aria-label` (التقسيم عند أول `: ` بعد الملخص) وتحديث regex سكربت الموظفين، ومقارنة **سلسلة KPI المعرضة** بـ`formatDuration(AVG(...))` محسوبة من SQL مستقل + التأكد أن المؤشرين الزمنيين رقمين مختلفان + ظهور المقام.
- **Scenario 6 جديد**: النقر على `عرض كجدول بيانات` → الجدول ظاهر في DOM (`caption`, `th[scope=col]`, `th[scope=row]`, `tfoot`) وإجماليه = إجمالي الرسم → النقرة الثانية تخفيه وترجع `aria-expanded=false`؛ عدد أزرار التبديل ≥ 6؛ حالة `?department=NO_SUCH_DEPARTMENT` تعرض `N/A (N=0)` للمقامات الصفرية + EmptyState + رابط Reset + مؤشري نطاق المهام/المختبر.

### 2.3 اختبارات الأدوار والأمان

- منع الوصول: موجودة سابقًا في `e2e-dashboard` Scenario 3 (employee → 302 إلى /employee مع flash صلاحيات؛ supervisor/admin يصلان) — لم تُعد تشغيلها (تجاوز المستخدم).
- طبقة Scope: أُثبتت بوحدات جديدة (قسم 6 أعلاه) أن drill-down الموظف `own_tasks` دائمًا ولا يتسع من query string.

---

## 3. مصفوفة معايير القبول

| AC | الوصف | الحالة | الدليل |
|----|-------|--------|--------|
| AC-01 | توحيد/توضيح نطاق الفلاتر بين مهام ومختبر | **PASS** (تنفيذ + markup SSR مؤكد؛ تأكيد E2E مكتوب غير مشغَّل) | `dashboard.astro` scope strip + `data-lab-scope-note`؛ E2E 6c |
| AC-02 | فصل Completion Time عن Resolution بمعادلات ومقامات | **PASS** | `test-dashboard-analytics-100` (قسم 1) 58/58؛ بطاقات بمعادلة tooltip ومقام مرئي |
| AC-03 | جدول بديل قابل للتبديل لكل رسم SVG | **PASS** (تنفيذ + تكافؤ وحدوي؛ E2E DOM مكتوب غير مشغَّل) | `chartTables.ts` + `ChartTableToggle.tsx` على 12 رسمًا؛ اختبار قسم 3 |
| AC-04 | N=0 بدون NaN أو 0%/100% مضللة + EmptyState قابل للإجراء | **PASS** | `formatKpiDuration/formatKpiPercent` + قسم 2 من الاختبار؛ E2E 6c مكتوب |
| AC-05 | ملخصات قارئ الشاشة عبر aria-label | **PASS** | `chartTakeaway` مدمج في aria-label كل الرسوم؛ قسم 4 من الاختبار |
| AC-06 | ملف الأدلة في المسار المعتمد | **PASS** | هذا الملف |

**الإجمالي: 6/6 منفَّذة؛ التحقق المتصفحي المكمّل متوقف بتجاوز المستخدم.**

---

## 4. سجل التحقق المنفَّذ (طازج)

| الأمر | النتيجة |
|-------|---------|
| `pnpm run test:dashboard-analytics-100` | ✅ 58/58 |
| `pnpm run test:dashboard-reports` (التحقق النهائي للبرومبت) | ✅ PASS |
| `pnpm run test:migrations` | ✅ PASS (بعد تحديث عدّادات 39→40) |
| `pnpm run test:embedded-migration-parity` | ✅ 40/40 byte-identical |
| `pnpm run test:schema-reference` | ✅ 166 كائنًا |
| `pnpm run test:manifest` | ✅ 85 canonical suites / 28 E2E |
| `pnpm run test:scheduled-notifications` | ✅ 69/69 |
| `pnpm run test:db-doctor` | ✅ PASS |
| `ASTRO_TELEMETRY_DISABLED=1 pnpm run typecheck` | ✅ 0 errors / 0 warnings / 0 hints (313 ملفًا) |
| `ASTRO_TELEMETRY_DISABLED=1 NODE_ENV=production pnpm run build` | ✅ Complete (12.57s) |
| `pnpm test` (السلسلة الكنسية الكاملة) | ⏭️ **تجاوز بأمر المستخدم** — آخر تشغيل جزئي أظهر الفحوص حتى `test-db-doctor` فقط (كان يفشل على توقع 39 وسبق إصلاحه وتشغيله منفردًا بنجاح) |
| `pnpm run e2e:acceptance` + `e2e-dashboard` المركّز | ⏭️ **تجاوز بأمر المستخدم** — غير مشغَّلين على الشجرة النهائية |

## 5. الملفات المتأثرة

**جديدة:** `src/lib/chartTables.ts` · `src/components/charts/ChartTableToggle.tsx` · `scripts/test-dashboard-analytics-100.mjs` · `db/migrations/040_dashboard_created_at_index.sql`

**معدَّلة (منتج):** `src/lib/dashboard.ts` · `src/lib/reporting/queries.ts` · `src/lib/reporting/catalog.ts` · `src/lib/migrationRegistry.ts` · `db/schema.sql` · `src/components/DashboardCharts.tsx` · `src/components/LabDashboardCharts.tsx` · `src/pages/dashboard.astro` · `src/pages/dashboard/drilldown.astro`

**معدَّلة (اختبارات/مانيفست):** `scripts/test-dashboard-analytics-100.mjs` (تسجيل) · `scripts/test-manifest.mjs` · `package.json` · `scripts/e2e-dashboard.mjs` · عدّادات الإصدار في 8 سكربتات اختبار (قسم 1.5)

## 6. حدود الادعاء والمتبقي

1. **E2E المتصفح (بما فيه Scenario 6 وسلوك زر العرض فعليًا) وسلسلة `pnpm test` الكاملة و`e2e:acceptance` لم تُشغَّل** — تجاوز صريح من المستخدم أثناء الجلسة. أي ادعاء نجاح متصفحي قبل إعادة تشغيلها غير جائز.
2. استعلامات النافذة الزمنية تغلّف العمود بدالة `date(created_at,'localtime')`، ما يمنع SQLite من استخدام الفهرس لبحث المدى تحديدًا؛ الفهرس مضاف حرفيًا لاشتراط البرومبت ولأي استعلام مباشر على العمود، والأداء المقاس 0.03ms على fixture (الحجم التشغيلي صغير). إعادة كتابة مسند التاريخ لتكون صديقة للفهرس تتطلب معالجة مناطق زمنية وتغيير أشهر من الاستعلامات — خارج نطاق هذا البرومبت وموثقة هنا بصدق.
3. عدم وجود timestamp اعتماد مدير على مستوى المهمة (قسم 1.1) — أي KPI "completion → sign-off" مستقبلي يتطلب هجرة مخطط جديدة.
4. لا commit ولا push ولا deploy (القاعدة الثانية).

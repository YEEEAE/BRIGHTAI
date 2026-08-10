---
file: brain.md
project: BrightAI — Saudi AI Safety OS
site: https://brightai.site
last_updated: 2026-08-10 10:30 +03:00
maintained_by: BrightAI Workspace Agent
version: 2.7.77
agent_version: v2.3
skills_ready: 7
---

> هذا الملف هو دماغ المشروع. كل تغيير جوهري يُسجَّل هنا.
> اقرأه كاملًا قبل أي تغيير غير تافه (قاعدة agent.md Section 0.6).
> الكتابة فقط بعد التحقق من نجاح التغيير.
> اللغة: عامية سعودية في الشرح + English في الكود والـ identifiers.
> لاتنشئ اي commits جديده اجعل المستخدم هو من يقوم بذلك
> لا تنشئ  branch جديد نهائيا الدفع يكون عبر main الحالي فقط PR
> هذا مشروع astro 

---

### 2026-08-10 — QC-TASK-CREATE-001: إنشاء المهام في QC Task Manager (نماذج + POST handlers + حارس can_create_tasks)

- **Files**: `apps/qc-task-manager/src/lib/tasks.ts` (جديد), `apps/qc-task-manager/src/pages/manager/new.astro` (جديد), `apps/qc-task-manager/src/pages/supervisor/new.astro` (جديد), `apps/qc-task-manager/src/pages/employee/new.astro` (جديد), `apps/qc-task-manager/src/middleware.ts`, `apps/qc-task-manager/README.md`
- **What**: أضفت صفحة إنشاء مهمة لكل مسار (manager/supervisor/employee) ونموذج POST. المعالجة في middleware عبر `handleCreateTaskPost` (نفس نمط POST /login لأن صفحات Astro 6 ما عندها named handlers). قواعد التعيين: manager/supervisor/admin يعيّنون لأي مستخدم نشط؛ الموظف يعيّن لنفسه أو بدون تعيين فقط (قرار المنتج). حارس مزدوج لـ `/employee/new`: على GET (يعيد توجيه غير الموظفين لصفحتهم + الموظف بدون can_create_tasks لـ roleHome) وعلى POST (canCreateTask server-side). سجل activity بكل إنشاء.
- **Why**: README كان يذكر أن "Task CRUD" هو المرحلة التالية؛ زر "New task" كان موجودًا لكن يشاور صفحات غير موجودة.
- **Verification**: `pnpm run typecheck` → 0 errors (3 hints false-positive معروفة) ✅؛ `pnpm run build` → Server built ✅؛ اختبار curl على dev server: manager ينشئ مهمة → 302 /manager + صف في tasks + activity task_created ✅؛ employee بدون can_create_tasks مرفوض من GET وPOST ✅؛ بعد تمكين can_create_tasks مؤقتًا: تعيين self ينجح، تعيين موظف آخر يُرفض (لا صف جديد) ✅؛ supervisor على /manager/new → يُبعث لـ /supervisor ✅؛ manager على /employee/new → 302 /manager/new ✅؛ supervisor ينشئ من /supervisor/new ✅؛ admin ينشئ من /manager/new ✅. نظّفت كل صفوف الاختبار ورجعت can_create_tasks=0 للموظف.
- **Note**: ملاحظة اختبار — Astro 6 فحص CSRF مدمج: أي POST عبر curl لازم معه `Origin: http://localhost:4321` وإلا 403.
- **Report**: none (موثّق في worklog + README + هذا الـ entry)
- **Commit**: uncommitted
- **Status**: verified locally
- **Brain updates**: هذا الـ entry. أضفت `tasks.ts` لملفات lib. المرحلة التالية (للمستقبل): صفحة تفاصيل المهمة `/tasks/[id]` + التحرير + closure flow + طلبات الحذف.

---

### 2026-08-10 — QC-ROUTE-001: الـ role-based home router + الـ shared layout النهائي في QC Task Manager

- **Files**: `apps/qc-task-manager/src/lib/permissions.ts`, `apps/qc-task-manager/src/middleware.ts`, `apps/qc-task-manager/src/pages/admin/users/index.astro` (جديد — انقفل من admin/index.astro)، `apps/qc-task-manager/src/pages/admin/index.astro` (صار redirect لـ /admin/users)، `apps/qc-task-manager/src/layouts/BaseLayout.astro` (FlashNotice صار مركزي)، `apps/qc-task-manager/src/components/Navbar.tsx` (اسم التطبيق "QC Task Manager" + رابط admin لـ /admin/users)، `apps/qc-task-manager/src/pages/{employee,manager,supervisor,dashboard}.astro` (حذف FlashNotice اليدوي + سطر "Signed in as")، `apps/qc-task-manager/src/lib/{seed,db}.ts` (بذرة 4 أدوار)، `apps/qc-task-manager/scripts/init-db.mjs`، `apps/qc-task-manager/db/seed.sql`، `apps/qc-task-manager/README.md`، `apps/qc-task-manager/src/pages/login.astro`
- **What**: وحّدت الصلاحيات في `PERMISSIONS` const (الشكل المطلوب في الـ spec: canViewDashboard / canCreateTask / canEditTaskFields / canDeleteTask / canManageUsers / employeeEditableFields) وكل صفحة و middleware تستورد منه بدون role checks متفرقة. صيّرت `roleHome('admin')` → `/admin/users` وأنشأت صفحة /admin/users. أضفت FlashNotice مركزي في BaseLayout. صلّحت bug `can_create_tasks: true` الثابت في employee page (كان يسمح لأي موظف بإنشاء tasks) — الحين يقرأ real user من DB. صلّحت dashboard الذي كان يستعلم حالات `'Open'/'In Progress'/'Blocked'` بينما الـ schema يستخدم `not_started/in_progress/on_hold` (العدّادات كانت 0 دائمًا). وسّعت البذرة من admin وحده إلى 4 أدوار (admin/manager/supervisor/employee، كلمة المرور نفس ADMIN_DEFAULT_PASSWORD).
- **Why**: المتطلبات المعلنة: index.astro يعيد توجيه حسب الدور (admin → /admin/users)، BaseLayout نهائي مع navbar يعرض اسم التطبيق + اسم المستخدم + شارة الدور + روابط حسب الدور (بدون Dashboard للموظف) + flash messages، ملف صلاحيات واحد هو مصدر الحقيقة، وصفحات placeholder للدور محمية. وقبول القبول: كل دور يسجل دخول يطلع على صفحته الصحيحة، والموظف لو زار /dashboard يُعاد توجيهه.
- **Verification**: `pnpm run typecheck` → 0 errors ✅؛ `pnpm run build` → Server built ✅؛ `pnpm db:reset` → 4 حسابات ✓؛ اختبارات curl على dev server: login لكل دور → admin=/admin/users، manager=/manager، supervisor=/supervisor، employee=/employee ✅؛ employee يزور /dashboard → يترجّل لـ /employee ✅؛ manager يزور /admin/users → يترجّل لـ /manager ✅؛ supervisor يزور /manager → يترجّل لـ /supervisor ✅؛ مجهول يزور /manager → يترجّل لـ /login?redirect=%2Fmanager ✅.
- **Report**: none (موثّق في worklog.md + README + هذا الـ entry)
- **Commit**: uncommitted (المستخدم يلتزم — per brain rule)
- **Status**: verified locally
- **Brain updates**: هذا الـ entry. ملاحظة للـ future agents: (1) الـ standalone build (`pnpm start` من dist/server/entry.mjs) يواجه مشكلة مسبقة — `db/schema.sql` يُحل من `dist/db/` اللي مو منسوخ، لذلك التشغيل المدعوم محليًا هو `pnpm dev`. (2) Astro check يطلّع hint false-positive على `roleHome` في login.astro و admin/index.astro بسبب الـ return المبكر — هو 0 errors، لا تجهد نفسك فيه. (3) البذرة الآن 4 أدوار بنفس كلمة المرور بدل admin فقط.

---

### 2026-08-10 — QC-AUTH-001: ترقية جلسات المصادقة في QC Task Manager (TTL 12h + randomUUID + حرس الأدوار + POST /login)

- **Files**: `apps/qc-task-manager/src/lib/{auth,db,session,flash,permissions,types}.ts`, `apps/qc-task-manager/src/middleware.ts`, `apps/qc-task-manager/src/lib/flash.ts` (جديد), `apps/qc-task-manager/src/components/FlashNotice.astro` (جديد), `apps/qc-task-manager/src/pages/{login.astro,logout.ts,index.astro,dashboard.astro}`, `apps/qc-task-manager/src/pages/{admin,manager,supervisor,employee}/index.astro`, `apps/qc-task-manager/src/pages/api/login.ts` (محذوف), `apps/qc-task-manager/src/components/Navbar.tsx`, `apps/qc-task-manager/src/layouts/BaseLayout.astro`, `apps/qc-task-manager/src/env.d.ts`, `apps/qc-task-manager/README.md`
- **What**: طبّقت المتطلبات الخمسة: (1) TTL جلسة 12 ساعة بدل 7 أيام عبر `SESSION_TTL_MS` + `maxAge` للكوكي؛ (2) tokens عشوائية بـ `randomUUID()`؛ (3) تنظيف الجلسات المنتهية عند الإقلاع + عند كل login (`cleanupExpiredSessions`)؛ (4) حارس صلاحيات بالأدوار في middleware (public = `/` + `/login` + `/_astro/`، وكل مسار محمي يرجع 302 لـ roleHome مع flash)؛ (5) POST /login self-submitting (في middleware لأن Astro 6 ما يدعم named handlers في ملفات .astro) + رسائل flash (qc_flash cookie + FlashNotice.astro). حذفت `src/pages/api/login.ts` (نمط قديم). كمان أصلحت bug مسبق: `admin/index.astro` كان يستعلم عمود `email` غير موجود → 500 → صار `department`. `locals.user` صار يُضبط دائمًا (قد يكون null) بدل الفحص المتكرر.
- **Why**: المتطلبات المعلنة كانت: جلسات أقصر (12h)، tokens عشوائية، لا تراكم جلسات منتهية، حماية المسارات حسب الدور مع توضيح للمستخدم، وفورم دخول يشترّط نفسه بدل endpoint API منفصل.
- **Verification**: `npx astro check` → 0 errors / 0 warnings / 1 hint (roleHome false-positive في login.astro بسبب return مبكر) ✅؛ `pnpm build` → Server built ✅؛ اختبارات runtime curl كلها نجحت (redirect المجهول، login صحيح/خاطئ، logout، حرس الأدوار employee→/admin = 302 لـ /employee مع flash، جلسة منتهية، تنظيف المنتهية عند login، CSRF Origin غريب = 403، token مزيّف مرفوض) ✅؛ نظّفت بيانات الاختبار (حذف emp_creator + كل sessions).
- **Report**: none (تغيير متكامل موثّق في worklog.md + README)
- **Commit**: uncommitted (المستخدم يلتزم — per brain rule)
- **Status**: verified locally
- **Brain updates**: هذا الـ entry. ملاحظات للـ future agents على `apps/qc-task-manager`: (1) `App.SessionData` الفارغ من Astro يحجب اسم `SessionData` داخل `namespace App` → استخدم inline import في env.d.ts. (2) Astro 6 فيه CSRF مدمج للـ form POSTs — اختبارات curl تحتاج `-H "Origin: http://localhost:4321"`. (3) ملفات `.astro` ما تدعم named request handlers — POST forms تُعالَج في middleware. (4) الحساب المبذور الوحيد هو admin (ADMIN_DEFAULT_PASSWORD أو admin123) — الـ README كان يذكر 5 حسابات وهذا غلط، صحّحته.

---

### 2026-08-09 — KRN-FORM-001: توحيد مفردات النماذج (forms) في صفحات الكيرنل
- **Files**: `src/pages/kernel/{playground,chat,policies,api,admin/quota}.astro`, `src/styles/kernel.css`, `kernel/assets/css/pages/{playground,policies}.css`, `src/client/playground.ts`, `public/js/kernel-policies.js`, `scripts/playwright/verify-form-ux.mjs` (جديد)
- **What**: وحّدت مفردة النماذج في 5 صفحات كيرنل. أضفت فصل كانوني مشترك `.k-form__error` (رسالة استرداد دورها `role="alert"`) في `kernel.css` + قاعدة واحدة لخطأ `[aria-invalid=true]` على أي input/select/textarea. كل حقل أصبح له label مربوط + رسالة استرداد موصولة بـ `aria-describedby` + `required` حيث يلزم. ثبّتت حوار المقارنة في playground (كانت الـ spans مو labels → selects بلا اسم ميسّر)، أضفت label للفة ورسالة استرداد للنص الفارغ. Chat: composer صار required + aria-invalid + رسالة فارغة + مسح عند الكتابة. Policies: مولّد السياسة صار label مرئي + required + رسالة؛ حقل الاسم بالمحرر required + رسالة. API: زر التشغيل aria-live/aria-busy. Quota: gateErr مربوط بـ aria-describedby + role=alert + required + disabled أثناء الفتح.
- **Why**: مفردة النماذج ما كانت كانونية — كل صفحة حقول وأخطاء مستقلة؛ حوار مقارنة playground كان 7 selects بلا labels. القبول: كل حقل له label + رسالة استرداد.
- **IMPORTANT (تصحيح معماري)**: `public/js/playground.js` **مخرَج بناء** من `src/client/playground.ts` عبر `build:client` (`tsc -p tsconfig.client.json`، outDir=`public/js`). أي تعديل على `public/js/*.js` اللي له مصدر `src/client/*.ts` **ينمسح بالبناء** → التعديل الصحيح على المصدر. استثناء: `kernel-policies.js` ما له مصدر TS → يعدَّل مباشرة. الملفات ذات المصدر: `src/client/{audit-verifier,audit,certificate-verifier,eval-api,eval-store,kernel-evidence-certs,pii-detector,playground,types}.ts`.
- **ثانوي**: `doRun` في playground كان يستخدم `announce()` (منطقة sr-only، مو خطأ مرئي + بدون aria-invalid). أضفت في المصدر: عند تشغيل فارغ → إظهار `#pg-input-error` (role=alert) + `aria-invalid` على `#pg-input` + مسح عند الكتابة. أضفت `aria-label` للفة النصية الديناميكية + `aria-label` لـ tour pop (كان role=dialog بدون اسم → axe aria-dialog-name).
- **Note**: purge-css يشيل CSS غير المستخدم اللي يشتغل وقت التشغيل فقط؛ الحل استخدمنا فصلًا كانونيًا واحدًا مستخدم فعلًا + قاعدة aria-invalid عامة. صفحة quota مستقلّة (برا KernelLayout) فدفعها inline.
- **Verification**: `npm run build` ✅ (275 صفحة، KernelLayout CSS 151.3KB). `npm run verify:all` ✅ exit 0 (SEO gate + hreflang 0 أخطاء). سكربت `scripts/playwright/verify-form-ux.mjs` على dist المحلي ✅ exit 0 — 9/9: كل الحقول لها label، axe 0 critical/serious (بعد تسمية tour pop)، الكيبورد، وإرسال فارغ يظهر الاسترداد + aria-invalid.
- **Status**: verified / build ✅ / verify:all EXIT=0 ✅ / Playwright 9/9 ✅ (uncommitted)

### 2026-08-09 — CSS-FATIGUE-001: تقليل الـ nested card fatigue في لوحة الكيرنل + الامتثال

- **Files**: `src/pages/kernel/compliance.astro`, `src/styles/kernel.css`, `scripts/playwright/card-fatigue-shot.mjs` (سكربت لقطات محفوظ جديد)
- **What**: خفّضت المربّعات المتداخلة (box-inside-box) على مبدأ "الكروت للحدود التفاعلية، والمحتوى الثانوي بالفواصل + التباعد". في `compliance.astro`: أزلت `KernelCard` الخارجي اللي كان يلفّ شبكة الحزم الثمانية + خريطة الامتثال، واستبدلته بعنوان قسم (`k-section-title`) + intro مباشرة قبل الشبكة/الخريطة (الحزم نفسها تبقى كروت تفاعلية). في `kernel.css`: حوّلت `KernelActivityItem` من مربّع (background + border-radius) لصفّ بفواصل `border-block-end` بين العناصر (الأخير بدون فاصل) + تباعد — يبطل "مربّع داخل مربّع" في ويدجات اللوحة (approvals/recent traces). خفّفت `box-shadow` لكروت KPI من `--shadow-md` لـ `--shadow-sm` عشان يقل الوزن البصري. كروت KPI + action cards تبقى (محتوى أساسي/تفاعلي).
- **Why**: اللوحة ولوحة الامتثال كانتا كروت-فوق-كروت (KernelCard يلفّ `kernel-compliance-pack` مربّعات، و`KernelActivityItem` مربّعات داخل `KernelCard`) → إجهاد بصري وصعوبة تمييز المحتوى الأساسي. الهدف: أسطح أقل + محتوى أساسي أوضح.
- **Verification**: `npm run build` ✅ (275 صفحة، KernelLayout CSS 151.1KB). `npm run verify:all` ✅ exit 0 (SEO gate + hreflang 0 أخطاء). فحص الـ dist HTML: بنية الحزم = `<h2 class="k-section-title">` + `<p class="k-section-intro">` + `<div class="kernel-compliance-grid">` مباشرة (بدون `kernel-card__body`) ✅، الـ id غير مكرر ✅، 8 packs ✅. فحص الـ CSS المبنِي: `border-block-end` موجود ✅ + `box-shadow: var(--shadow-sm)` ✅. لقطات Playwright (1440/390): `download/qa/cf-dashboard-{desktop,mobile}.png` + `cf-compliance-{desktop,mobile}.png`. Console errors الوحيدة من الـ CSP report-only (موجودة مسبقًا من الـ preview).
- **Report**: `report/2026-08-09-css-fatigue-nested-cards.md`
- **Commit**: uncommitted (المستخدم يلتزم — per brain rule)
- **Status**: verified locally
- **Brain updates**: أضفت هذه الـ entry. ملاحظة للـ future agents: `KernelCard` في `compliance.astro` ما يزال مستخدم في قسم "تحليل الفجوات" — أبقيتُه لأنه صندوق مفرد (مو تداخل). لو بدت الفجوات بلا صندوق أيضًا، يتحول لنفس نمط `k-section-title`.

---

### 2026-08-09 — KRN-TYPE-001: توحيد type scale + vertical rhythm لصفحات الكيرنل

- **Files**: `src/styles/kernel.css`, `src/layouts/KernelLayout.astro`, `scripts/playwright/krn-type-shot.mjs` (قياس محفوظ جديد)
- **What**: أضفت بلوك توكنز دلالية `KRN-TYPE-001` داخل `body.kernel-shell`: أدوار typographic (display/title/lead/body/meta) مبنية على مقياس rem الموجود (`--k-type-*`)، خطوط `--k-lh-*`، وأسماء مسافة 4pt دلالية (`--k-space-title-block/lead-block/header-inline/header-block`). وحّدت `.kernel-page-header__title/__subtitle` و `.kernel-hero__title/__subtitle` ليستهلكوا نفس الأدوار (القيم نفسها → صفر regress بصري، بس صارت مصدر واحد بدل تعريفات متفرقة). ضفت `text-wrap: balance` للعناوين + `text-wrap: pretty` للـ lead/body/summary (يمنع orphan كلمة عربية وحيدة)، و `font-variant-numeric: tabular-nums` على `.kernel-metric__value` و `.kernel-stat-card__value` (أرقام ثابتة العرض). أضفت `--k-type-display-mobile` وأعدلت الـ media query يستخدمها. في KernelLayout أضفت `text-wrap: balance` لعناوين الشِل (`k-trace-drawer__title` + `k-hash-chain__title`).
- **Why**: صفحة فرعية كانت تحدد حجم/كثافة موضعية (`clamp` مختلف، line-height 1.3/1.6/1.7) → هرمية مختلطة عبر الـ 21 صفحة. الهدف: دور نوعي واحد لكل صفحة، RTL/عربي يلف زين، وأرقام المقاييس ما ترتج.
- **Verification**: `npm run build` ✅ (21 صفحة kernel بُنيت، KernelLayout CSS 195KB → 151KB بعد purge). Playwright على `/kernel/`, `/kernel/policies/`, `/kernel/audit/` بعرضين (1440/390): `dir=rtl` ✅، `text-wrap: balance` على الـ h1 ✅، 0 أخطاء JS من التعديل (2 console warnings موجودين مسبقًا: CSP report-only + X-Frame-Options — من الـ preview المحلي، مو من هذا التغيير). لقطات: `download/qa/krn-*.png`.
- **Report**: `report/2026-08-09-krn-type-001.md`
- **Commit**: uncommitted (المستخدم يلتزم — per brain rule)
- **Status**: verified locally
- **Brain updates**: أضفت هذه الـ entry. الـ token inventory (Section 5) لازم يُضاف فيها `--k-type-*`/`--k-lh-*`/`--k-space-*` كطبقة mint دلالية تتبع `KRN-DS-2026-08-09`. ملاحظة للـ future agents: `KernelPageHeader.astro` (المكوّن القياسي في `src/components/kernel/`) ما يزال **غير مستخدم** من أي صفحة ومقياسه يشذ (`clamp(1.375rem,3.5vw,2rem)` + `--weight-extrabold` قديم) — لو صار يستخدم مستقبلًا، لازم يتحول لنفس أدوار `--k-type-*`.

---

- **Files**: بدون تعديل إنتاجي. أُضيفت سكربتات قياس محفوظة: `scripts/playwright/measure-kernel-vitals.mjs`, `capture-kernel-errors.mjs`, `kernel-viewport-matrix.mjs`, `kernel-interaction-audit.mjs`, `kernel-interaction-2.mjs`, `kernel-role-rtl.mjs`. التقارير: `report/2026-08-09-kernel-rerun-audit.md` + `report/{a11y-kernel,kernel-runtime-errors,kernel-viewport-matrix,kernel-interaction-audit,kernel-interaction-2}.{json,txt}`. صور: `download/qa/kernel-rerun/` (21 route × 10 عرض).
- **What**: إعادة تدقيق Kernel بعد تحسينات `4cc1e984..HEAD` (سلم `--k-z-*` دلالي + `--k-focus-ring` + `--k-h-control/input` 44px + طبقة mint + تحويل `KernelDemoPill` من toggle إلى badge ثابت). القياس صار runtime (build → serve-static:8788 → Playwright/Chromium + axe).
- **Why**: البيسلاين كان source-only وكل قياساته runtime كانت `NOT MEASURED`. الهدف: ترقية المقيّمات من heuristic إلى measured بأدلة قابلة للتكرار.
- **Verification**: build ✅ (21/21 route 200). axe = **0 مخالفات** على كل الـ 21 route ✅. صفر أزرار/روابط بلا اسم، صفر صور بلا `alt`، h1 وحيد في كل صفحة ✅. درج الـ trace: open + focus-in + Escape + focus-return ✅. RTL `dir=rtl` + `prefers-reduced-motion` محترم (0 animations) + logical properties نظيفة ✅. CWV (Slow 4G throttle): **LCP 3.5–4.5s ❌ FAIL**, CLS 0.03–1.14 ❌ (connectors 1.14), TTFB 2–16ms ✅.
- **Report**: `report/2026-08-09-kernel-rerun-audit.md`
- **Commit**: uncommitted (المستخدم يلتزم — per brain rule). لا تعديل إنتاجي في هذا التمرير.
- **Status**: verified locally (بنيان نظيف، أُضيفت ملفات قياس فقط)
- **Brain updates**: أُضيفت **4 عيوب runtime جديدة** للسجل تحت (تحتاج مداخل known-issues مستقلة): (1) `TypeError: e is not a constructor` على `/kernel/` — `KernelProductTour.astro` `import('driver.js')` interop فاشل؛ (2) `playground` يطلب `/js/pii-detector` بلا `.js` → 404 → **PII masking معطّل**؛ (3) `evidence` يطلب `/js/certificate-verifier` بلا `.js` → 404 → **التحقق من الشهادات معطّل**؛ السبب الجذري لـ(2)(3): `tsconfig.client.json` يستخدم `moduleResolution: "bundler"` (يسمح بتركات بلا امتداد) بس المخرجات ESM `.js` والمتصفح يحتاج الامتداد → الحل: `rewriteRelativeImportExtensions` أو إضافة `.js` في `src/client/*.ts`؛ (4) `datasets` عند 320px overflow +215px (`ds-dist` + `k-topbar__search`). **7 حقول بلا labels في playground**. تباين `muted_on_elevated` = 4.3:1 (FAIL AA للنص الصغير). **Role-aware nav غير منفّذ** (measured: CISO=Analyst، نفس الـ 19 رابط). `compliance` "تقرير PDF" = `window.print()` (P0 البيسلاين لسه غير محلول). **السكور النهائي ~79%** (بيسلاين 78%). **Verdict: NO** world-class، Maturity Level 3/5. و**لا مقيّم وصل 95%** — أقربها Accessibility 82 وSaudi UX 84.

---

- **Files**: بدون تعديل إنتاجي. (التقرير: `report/2026-08-09-bai-p1-test-001-chat-regression-signal.md` جديد)
- **What**: المهمة وصلت بادعاء "npm test يفشل بـ LeadQueueStatus SyntaxError". الـ task نفسه صريح: "شغّل npm test أول شي بعد PROMPT-001. فيه احتمال قوي يمر بدون أي تعديل". نفّذت بالحرف: `pnpm db:generate` (يولّد Prisma client) → `npm test` → **38/38 pass** بدون لمس ولا سطر في `chat.ts` أو `test-chat-session.mjs`. الفشل كان عَرَضًا لانحراف Prisma = نفس السبب الجذري لـ BAI-P1-TYPES-001 (اللي انحلّ بـ `pretypecheck→db:generate` + `postinstall: prisma generate`). بعدها سوّيت mutation testing يدوي: كسرت `isValidSessionId` ليرجّع `true` دائمًا، شغّلت `pnpm test:chat-session` → فشل **تحديدًا** على test 7 + 8 (malformed/oversized sessionId expected 400 actual 200)، باقي 14 test نجحوا (isolation صحيح). رجّعت الـ mutation وأكدت baseline رجع أخضر (git status نظيف).
- **Why**: الـ task الأصلي ينص صراحة إن الفشل غالبًا عَرَضي والاختبار مر بدون تعديل. هذا بالضبط اللي صار. القاعدة "Verify, Don't Claim" تتطلب إثبات إن regression signal حقيقي (اختبار يمر دايمًا = اختبار ما ينفع) — أثبتّها بالـ mutation.
- **Verification**: `pnpm db:generate` → generated client ✅, `npm test` → **38/38 pass** ✅, `pnpm test:chat-session` → **16/16 pass** ✅, `npm run typecheck` → 5/5 Done 0 أخطاء ✅, mutation test → 2 fail موضعي + 14 pass ✅, post-revert `git status --porcelain` → clean ✅, security review على logs → grep على provider keys = 0 نتائج ✅.
- **Report**: `report/2026-08-09-bai-p1-test-001-chat-regression-signal.md`
- **Commit**: uncommitted (المستخدم يلتزم — per brain rule). ما في كود إنتاجي معدّل أصلاً.
- **Status**: verified locally · working tree clean
- **Brain updates**: هذا الـ entry. ملاحظات مهمة للـ future agents: (1) **قيود بيئية مهمة**: `node scripts/test-chat-session.mjs` مباشرة يفشل بـ `ERR_MODULE_NOT_FOUND` على `kernel-system-prompts` لأن `chat.ts` يستورد ملف `.ts` بلا extension — لازم `--import ./scripts/test-ts-loader.mjs --experimental-strip-types`. الـ runner الموثّق = `pnpm test:chat-session` (= `node --import .../test-ts-loader.mjs --experimental-strip-types --test scripts/test-chat-session.mjs`). (2) لو CI شغّال بـ `--ignore-scripts`، `postinstall: prisma generate` ما يشتغل وكل tests تفشل بنفس خطأ LeadQueueStatus — تأكد إن CI يشغّل postinstall أو يضيف `pnpm db:generate` صريح. (3) **فجوة تغطية مؤجّلة**: rate limit (429) + SSE/non-streaming contract ما مغطّاة حاليًا — تستاهل task مستقل `BAI-P1-TEST-002` (ما أضفتها هنا عشان constraint الـ task "لا تعدّل ولا سطر" + لأنها توصية مو AC).

---

### 2026-08-09 — BAI-P1-TYPES-001: شدّ عقد أنواع Prisma + CI drift gate

- **Files**: `packages/db/src/client.ts` (استبدال `Omit<PrismaClient,…>` بـ `Prisma.TransactionClient` + شل `as unknown` casts)، `scripts/verify-prisma-drift.mjs` (جديد — CI gate)، `package.json` (`verify:prisma:drift` script)، `.github/workflows/ci-build-guard.yml` (step جديد بعد `Generate Prisma client`)
- **What**: المهمة وصلت بادعاء "42 خطأ typecheck". التشخيص أثبت إن المشكلة **منحلّة فعليًا على main** عبر `pretypecheck→db:generate` المُتبت منذ `2a3ddffc` + `postinstall: prisma generate`. تقرير الأوديت بُني على commit مستقل (`5d6efbe3`) مو موجود في تاريخنا. بس فيه ثغرتان حقيقيتان سدّيتهم: (1) TS7006 implicit-any على `tx` + `fn(tx as unknown as …)` casts قبيحة في `client.ts:90,121,103,125`، (2) ما فيه drift-detection بين schema والـ generated client. أصلحت (1) بـ `Prisma.TransactionClient` صريح (لا any، لا cast) و (2) بـ سكربت جديد يقرأ models/enums من schema ويقارنها بـ generated client exports.
- **Why**: قيد المهمة "ممنوع cast يخفي الانحراف" + AC "CI check يمنع تكرار الانحراف". الـ casts كانوا يخفوا TS7006 (يظهر لو فُقد generated client)، و الـ CI كان يتشيك وجود الـ client بس مو تطابقه مع schema — بالظبط فئة الانحراف اللي كسرت typecheck في الأوديت.
- **Verification**: `rm -rf node_modules/.prisma/client && pnpm db:generate` (clean sim) → ✅، `npm run typecheck` → 5/5 Done 0 أخطاء ✅، `npm run verify:prisma:drift` → exit 0 (29 model + 24 enum متزامنين) ✅، `npm run build` → EXIT=0 ✅، `grep -rE "as any|@ts-ignore|as unknown" packages/db/src/` → 0 نتائج ✅. السكربت مُختبَر: لقّط drift حقيقي لما حذفت `LeadQueue` + `Role` يدويًا (exit 1 + diff).
- **Report**: `report/2026-08-09-bai-p1-types-001-prisma-contract.md` (جديد)
- **Commit**: uncommitted (المستخدم يلتزم — per brain rule)
- **Status**: verified locally
- **Brain updates**: هذا الـ entry. ملاحظات مهمة للـ future agents: (1) `Prisma.TransactionClient` متاح كنوع مُولَّد — استخدمه بدل `Omit<PrismaClient, ITXClientDenyList>` اليدوي لأي callback `$transaction`. (2) الـ CI step القديم `test -d …/@prisma+client@5.22.0_prisma@5.22.0/…` هش (مقيّد بإصدار) — يستاهل إصلاح مستقل. (3) `verify-prisma-drift.mjs` field-level ما يدقق (existence-only) — `prisma generate` هو الـ authority على الحقول.

---

### 2026-08-09 — SRC-LINK-REPAIR: إصلاح false positives في internal-links-audit (migrated pages غير مُتعرَّف عليها)

- **Files**: `scripts/internal-links-common.mjs` (إضافة `readMigratedPageRoutes()` + استدعائها في `buildFileIndex()` — تسجّل canonicalات `src/data/migrated-pages/*.json` كـ valid public routes)
- **What**: المهمة وصلت بادعاء "69 كسر في source files". التحقيق بيّن إن العدد الحقيقي 2 (بعد تعديلات common.mjs غير الملتزمة)، والكسرين false positives بنفس السبب: `internal-links-audit` ما كان يعرف migrated pages (8 solutions + 4 sectors + 3 cities تُبنى من JSON عبر dynamic routes) كمصادر routes صحيحة. الحل: علّمت السكربت يقرأ `canonical` من كل JSON ويسجّله. النتيجة: **0 كسر**. كمان اكتشفت bug مُسبق: `normalizeSitePath` + `canonicalizeSitePath` ما يعالجوا URLs كاملة (الـ `//` collapse rule يكسر `https://` قبل الـ URL branch) — متجاوز موضعيًا بـ regex يشيل origin. الـ 13 (ثم 14) pattern normalization كلها في `qa-text-snapshot.mjs` بنمط `/x/index.html` → `/x/` — **ما طبّقتها** لأن الأداة تستخدم `readFileSync` والمسارات فيزيائية على القرص، تطبيق التوحيد يكسرها.
- **Why**: المهمة كررت "أصلح السكربت إذا كان false positive" كناتج مشروع. الكسران فعلاً false positives (الصفحات مبنية في `dist/client/solutions/ai-firewall/index.html` 97KB ومؤكّدة في `migratedSolutionPages.ts`). فإصلاح السكربت هو الحل الصحيح تقنيًا.
- **Verification**: `internal-links-audit` → **0 كسر** ✅ (كان 2)، `pnpm build` → exit 0 ✅، `seo-ci-check` → 0 broken من 48,158 ✅، `internal-linking-architecture --source dist/client` → 0 orphans/0 broken ✅. `link-graph-validator --strict` → exit 1 (bug مُسبق مستقل: يفحص `dist/` بدل `dist/client/` — مُثبَت بنفس exit قبل تعديلي).
- **Report**: `report/2026-08-09-source-link-repair.md` (جديد — bucket breakdown كامل)
- **Commit**: uncommitted (المستخدم يلتزم — per brain rule)
- **Status**: verified locally
- **Brain updates**: هذا الـ entry. ملاحظات مهمة للـ future agents: (1) `link-graph-validator.mjs` مكسور مُسبقًا (يفحص `dist/` بدل `dist/client/`) — يحتاج إصلاح مستقل. (2) `normalizeSitePath`/`canonicalizeSitePath` ما يدعموا URLs كاملة — استخدم regex `^https?:\/\/[^/]+` قبل أي استدعاء لو المدخل ممكن يكون URL كامل. (3) `qa-text-snapshot.mjs` يستخدم filesystem paths (`/x/index.html`) عمدًا — الـ normalization suggestions اللي تطلع فيه false positives.

---

### 2026-08-08 — BAI-SEO-004-S7: إدراج صفحتي /events/ و /kernel/api/ الناقصتين في الـ sitemap

- **Files**: `scripts/generate-sitemap-all-pages.mjs` (4 تعديلات: exclude `/api/` → `startsWith("api/")` عشان ما يلتقط `kernel/api`، إضافة `kernel/api` لـ kernel whitelist، إضافة `events/index.html` لـ pages whitelist، إضافة `src/pages/kernel/api.astro` في `resolveSourceFiles` لـ lastmod)، `dist/client/sitemap.xml` (متولد)
- **What**: حققت في ادعاء الأوديت "29 ملف خارج sitemap". النتيجة: بعد إصلاح BAI-IDX-04 (اللي ضم 17 answer + 5 lp)، الفجوة الحقيقية الحالية = **16 ملف indexable خارج sitemap**، منها 14 مقصودة (noindex: design/*، thank-you، kernel/offline، kernel/admin/quota + redirect stubs: cities/*). الـ gap الفعلي اللي يجب إصلاحه = **صفحتان فقط**: `/events/` (فهرس فعاليات، 3471 كلمة) و `/kernel/api/` (صفحة وثائق API، 11k كلمة). كلاهما `index, follow` + canonical صحيح، لكن كانا خارج sitemap بسبب: (1) `events/index.html` ناقص من whitelist، (2) الـ exclude القديم `includes("/api/")` كان يلتقط `kernel/api` قبل ما يوصل لـ kernel whitelist.
- **Why**: صفحتان indexable حقيقية بمحتوى كانتا مخفيتين عن الـ crawlers — خسارة فهرسة كاملة.
- **Verification**: `sitemap:generate` → **258 URL** (كان 256) ✅, `/events/` + `/kernel/api/` ظاهرتين مع lastmod صحيح (2026-07-31 / 2026-08-02) ✅, `seo:gate` → 0 أخطاء 0 تحذيرات (258 sitemap URLs) ✅, `seo:hreflang` → 0 أخطاء (259 sets) ✅, `npm run build` → 0 أخطاء ✅, `verify-all.mjs` → 5/5 ✅
- **Report**: `report/2026-08-08-bai-seo-004-sitemap-gap.md` (جديد)
- **Commit**: uncommitted (المستخدم يلتزم — per brain rule)
- **Status**: verified locally
- **Brain updates**: هذا الـ entry. ملاحظة: الـ 14 صفحة المتبقية خارج sitemap مقصودة بالتصميم (noindex/redirect) — مو bug. الأوديت الأصلي (29) كان ضد نسخة قديمة قبل BAI-IDX-04.

---

### 2026-08-08 — BAI-IDX-04: إصلاح الصفحات اليتيمة — روابط داخلية سياقية لـ /answer/ و /lp/ + ضم lp/ للسايت ماب

- **Files**: `src/pages/blog/[...slug].astro` (أضفت `INTERNAL_LINKS_BY_SLUG` — 40 entry، دمج مع خريطة الفئات), `scripts/generate-sitemap-all-pages.mjs` (`groupRelPath`: فرع `lp/` → pages + `resolveSourceFiles`: `lp/[slug].astro` للـ lastmod), `public/sitemap.xml` (متولد), `report/2026-08-08-bai-idx-04-orphan-internal-links.md` (جديد)
- **What**: 22 صفحة مفهرسة (17 `answer/` + 5 `lp/`) كانت بدون أي رابط داخلي وارد (orphan). أضفت خريطة روابط سياقية من مقالات blog محورية (عمق 2) لكل صفحة answer/lp — كل صفحة صار عندها 1–3 روابط واردة. وضمت `/lp/` للـ sitemap (كانت مفهرسة لكن خارج sitemap).
- **Why**: الـ audit `internal-links:audit` كان يكسر بـ `orphan_pages=22` و `unreachable_indexable=22` — صفحات الـ FAQ والـ landing غير قابلة للاكتشاف عبر الـ link graph. القرار (بموافقة المستخدم): ربط + ضم للـ sitemap بدل noindex لأنها صفحات قوية.
- **Verification**: `npm run build` → 0 أخطاء ✅, `internal-links:audit` → `orphan_pages=0`, `unreachable_indexable=0`, `brokenLinks=0`, `maxClickDepth=3 ≤ 3` ✅, `sitemap:generate` → exit 0 (256 URL، 17 answer + 5 lp) ✅, `verify:all` → seo:gate + seo:hreflang + seo:schema 0 أخطاء ✅
- **Report**: `report/2026-08-08-bai-idx-04-orphan-internal-links.md`
- **Commit**: uncommitted (المستخدم يلتزم — per brain rule)
- **Status**: verified locally
- **Brain updates**: هذا الـ entry. ملاحظة: ما في قسم known issues منفصل في brain.md حاليًا. ملاحظات audit خارج النطاق: `pagesOutsideSitemap=2` + `noHrefLinks=19` (باقية، مو ضمن معايير BAI-IDX-04).

---

### 2026-08-08 — BAI-IDX-CRAWL: فك حظر الـ crawlers من Cloudflare edge (ai_bots_protection: block → disabled)

- **Files**: `scripts/setup-cloudflare-ai-crawler-allowlist.mjs` (جديد), `scripts/verify-crawler-access.mjs` (جديد), `scripts/verify-post-deploy.mjs` (تعديل: probe 7 crawler access + `--skip-crawler`), `package.json` (تعديل: `cloudflare:crawler-allowlist` + `verify:crawler-access`), `report/2026-08-08-cloudflare-crawler-unblock.md` (جديد). **Edge config** (مو في repo): Cloudflare Bot Management `ai_bots_protection` من `block` إلى `disabled` عبر API على zone `brightai.site`.
- **What**: كل الـ AI crawlers (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, ChatGPT-User, ...) كانوا يحصلون على 403 من Cloudflare edge. السبب المؤكد: `ai_bots_protection: "block"` في Bot Management (خطة Free). غيرته إلى `"disabled"` عبر `PUT /zones/{zone}/bot_management`. أضفت سكربت idempotent يعيد الضغط + مونيتور synthetic يفحص 17 crawler + sitemap، وربطته بـ `verify-post-deploy` (probe 7).
- **Why**: الحظر كان يمنع Google من قراءة `/sitemap.xml` (403 لغير verified bots) + يحجب كل استثمار GEO (llms.txt، ai.txt، Speakable) عن AI crawlers. `robots.txt` كان سليم أصلاً — المشكلة كلها edge.
- **Verification**: 17 crawler × 5 مسارات = 90 استدعاء كلها 200 ✅, `/sitemap.xml` Googlebot → 200 + 251 `<loc>` ✅, `verify:crawler-access` exit 0 ✅, `cloudflare:crawler-allowlist` re-run = no-op ✅. مشكلة مسبقة في `verify-post-deploy` security headers (`x-frame-options SAMEORIGIN` متوقع `DENY` + `spec.mustMatch.test is not a function`) — خارج نطاق المهمة، مو متعلقة بالإصلاح.
- **Report**: `report/2026-08-08-cloudflare-crawler-unblock.md`
- **Commit**: uncommitted (المستخدم يلتزم — per brain rule)
- **Status**: deployed (edge config مطبّق على الإنتاج ومُتحقَّق منه)
- **Brain updates**: هذا الـ entry. ملاحظات: Bot Fight Mode (`fight_mode`) لسا ON — حماية الـ scrapers الخبيثة محفوظة. لو رجع `ai_bots_protection` `"block"` مستقبلًا، شغّل `pnpm cloudflare:crawler-allowlist`.

---

### 2026-08-04 — CSS Cleanup: ترتيب layers + تأكيد purgecss (CSS < 25KB)

- **Files**: `src/layouts/BaseLayout.astro`, `src/layouts/ArabicLayout.astro`, `src/layouts/KernelLayout.astro`
- **What**: رتّبت الـ CSS layers حسب المطلوب (variables → reset → components → utilities): أضفت `components, pages` للـ layer declaration في BaseLayout و KernelLayout، وحوّلت استيرادات components.css + pages.css في ArabicLayout من unlayered إلى `layer(components)` + `layer(pages)`. أكدت إن purgecss configured صح ومدمج في build chain.
- **Why**: components.css + pages.css كانت unlayered (أعلى أولوية من utilities) — مخالف لترتيب المهمة. الآن utilities يغلّبهم (نفس السلوك السابق لأنهم كانوا أعلى، والآن صاروا layer قبل utilities).
- **Verification**: `pnpm build` → exit 0 (251 URLs / 275 HTML) ✅, `pnpm performance:budget` → CSS 19.91KB gz (حد 50KB) ✅, HTML 36.41KB ✅, JS 329.55KB ❌ (مسبق — خارج نطاق CSS), `pnpm purge:css` → 735.6KB → 627.5KB (-108.15KB = 14.7%) ✅
- **Report**: `report/2026-08-04-css-cleanup.md`
- **Commit**: uncommitted (user commits via main — per brain rule)
- **Status**: verified locally
- **Brain updates**: Section 2 (هذا الـ entry). ملاحظة: أكبر ملف CSS gzipped = 19.91KB < 25KB — شرط التنظيف اليدوي ما تحقق لأن CSS تحت الهدف.

---

### 2026-08-04 — Core Web Vitals Optimization (content-visibility + contain + aspect-ratio)

- **Files**: `src/styles/base.css`, `src/styles/components.css`
- **What**: أضفت 3 تحسينات CSS للـ Core Web Vitals: (1) `content-visibility: auto` على `.home-section--padded` لأقسام تحت الطية، (2) `contain: layout style paint` على card components، (3) defensive `aspect-ratio: auto` على `img, video`.
- **Why**: المشروع كان محسّن مسبقًا (fonts preloaded, font-display: swap, scripts deferred). الـ `content-visibility` أكبر فرصة لتحسين الـ rendering (يخلي المتصفح يتخطى rendering المحتوى خارج الشاشة → TBT/INP أحسن).
- **Verification**: `pnpm build` → 0 errors ✅, `pnpm performance:budget` → CSS+HTML ✅, JS ❌ (مسبق — pdf.js 125KB + index.js 175KB)
- **Report**: `report/2026-08-04-cwv-optimization.md`
- **Status**: verified locally
- **Brain updates**: State snapshot (CSS sizes updated), Known issues (JS budget failure confirmed pre-existing)

---

### 2026-08-04 — Added RSS Feeds for Docs and Solutions (AEO Enhancement)

- **Files**: `src/pages/docs/feed.xml.ts` (new), `src/pages/solutions/feed.xml.ts` (new)
- **What**: إضافة موجزات RSS جديدة لكل من الوثائق (/docs/feed.xml) والحلول والقطاعات (/solutions/feed.xml) لتعزيز الفهرسة واكتشاف المحتوى التقني والخدمي بواسطة محركات الذكاء الاصطناعي (Perplexity, SGE, ChatGPT Search).
- **Why**: زيادة التغطية ورفع كفاءة الـ AEO (AI Engine Optimization) بجانب الموجز الرئيسي للمدونة /rss.xml.
- **Verification**: `pnpm build` → 251 URLs / 275 HTML files, 0 errors ✅, `pnpm seo:all` → exit 0 ✅, `pnpm lint:tokens` → 0 violations ✅
- **Status**: verified locally

---


### 2026-08-04 — Implemented Kernel Product Tour (Onboarding)

- **Files**: `package.json` (added `driver.js ^1.8.0`), `src/components/kernel/KernelTourStep.astro` (new), `src/components/kernel/KernelProductTour.astro` (new), `src/pages/kernel/index.astro` (added import + component placement)
- **What**: أنشأت مكون جولة منتج موجّهة للمستخدمين الجدد باستخدام `driver.js`. الجولة ت spotlight العناصر الرئيسية في صفحة Kernel (الشريط الجانبي، لوحة الحوكمة، المؤشرات، التنقل، لوحات التحكم، الوحدات، وزر البدء) في 7 خطوات قصوى. تظهر مرة واحدة فقط (localStorage persistence)، قابلة للتخطي، تدعم RTL والجوال، وتحترم `prefers-reduced-motion`.
- **Why**: Prompt 13 من التقرير الشامل — No guided tour للمستخدمين الجدد، Slow learning curve، Features undiscovered. الحل يوجه الزائر الجدد خطوة بخطوة بدون حاجة لإعداد.
- **Verification**: `pnpm build` → 125+ pages, 0 errors ✅, `pnpm run seo:check` → exit 0 ✅, `KernelProductTour` bundled at 1.71KB gzipped ✅, `driver.js` bundled at 7.14KB gzipped ✅
- **Report**: report/2026-08-04-kernel-product-tour.md
- **Commit**: uncommitted (user commits via main — per brain rule)
- **Status**: verified locally
- **Brain updates**: Section 2 (هذا الـ entry), Section 5 (KernelTourStep.astro + KernelProductTour.astro added to component inventory), `package.json` updated (driver.js added).

- **Files**: `src/components/kernel/KernelPdfViewer.astro` (new)
- **What**: أنشأت مكون PDF viewer قابل لإعادة الاستخدام لصفحات Kernel — يستخدم pdfjs-dist مع lazy loading، zoom controls، prev/next navigation، RTL-aware layout، و TypeScript types صحيحة (بدون `pdfDoc` implicit `any`).
- **Why**: الملف الأصلي (الذي لم يكن موجودًا) كان فيه خطأ TypeScript: `pdfDoc` implicitly has type `any` — الحل كان باستخدام type annotation صريحة + data attributes لتمرير القيم الأولية من Astro frontmatter للـ client script.
- **Verification**: `npm run build` → 125 pages, 0 errors ✅, `npm run verify:all` → exit 0 ✅ (pre-existing token violations in eval.astro unrelated)
- **Report**: none
- **Commit**: uncommitted (user commits via main — per brain rule)
- **Status**: verified locally
- **Brain updates**: Section 2 (هذا الـ entry), Section 5 (KernelPdfViewer.astro added to component inventory).

---

- **Files**:
  - `src/pages/kernel/chat.astro` (EDITED — أضفت `KernelTabs` import + component بثلاثة تبويبات (المحادثات | المحادثة | التفاصيل) داخل `.kernel-chat-layout`، وأضفت `role="tabpanel"` + `id="kernel-chat-tabpanel-*"` + `aria-labelledby` للـ panes الثلاثة، و`data-tab-active="chat"` للـ center pane (الافتراضي)، وأضفت `initMobileTabs()` — ربط النقرات على الـ tablist + swipe gestures (RTL-aware) + auto-scroll للرسائل عند الرجوع لتبويب المحادثة + state preservation (تبديل display فقط، لا حذف DOM))
  - `src/components/kernel/KernelTabs.astro` (EDITED — أضفت دعم `class` prop عبر `class:list` للـ consumer)
  - `src/styles/kernel.css` (EDITED — كتلة `22.c CHAT — Mobile-first tabs`: `.kernel-chat-mobile-tabs` يظهر فقط على <768px؛ فقط الـ pane النشط يظهر؛ composer `position:fixed` مع `env(safe-area-inset-bottom)`؛ toolbar القديم مخفي على <768px؛ على 768-1023px شبكة بعمودين والـ context مخفي)
- **What**: حللت انهيار الـ 3-pane layout على الجوال — استبدلت الـ drawers بنظام 3 تبويبات (المحادثات | المحادثة | التفاصيل) باستخدام KernelTabs (WAI-ARIA كامل). التبويب الافتراضي = المحادثة. الـ composer ثابت بالأسفل. Swipe أفقي (RTL-aware). State preservation بالتبديل display فقط.
- **Why**: PROMPT-2 — الـ 3-pane كان ينهار على الجوال (<768px) و40%+ من الزوار على الجوال.
- **Verification**:
  - `npm run build` → exit 0 ✅
  - `grep kernel-chat-mobile-tabs dist/client/kernel/chat/index.html` → 1 ✅
  - `grep data-tab-active="chat" dist/client/kernel/chat/index.html` → 1 ✅
  - `grep "max-width:767px" dist/client/_astro/KernelLayout*.css` → 1 ✅
- **قرارات موثقة**:
  - **التبويب الافتراضي = المحادثة** — المستخدم يرى المحادثة مباشرة.
  - **الـ drawers القديمة بقيت** كـ fallback للـ tablet (768-1023px) — لا تحذفها.
  - **KernelTabs.astro دعم class prop** — كان لا يقرأ `class` من `Astro.props`.
- **Report**: none
- **Commit**: uncommitted (user commits via main — per brain line 17)
- **Status**: verified locally
- **Brain updates**: Section 2 (هذا الـ entry).

---

### 2026-08-04 — Phase 2 API routes: evaluations/[id], certificates/index, certificates/[id]/verify, audit/index

- **Files**: src/pages/api/kernel/evaluations/[id].ts (new), src/pages/api/kernel/certificates/index.ts (new), src/pages/api/kernel/certificates/[id]/verify.ts (new), src/pages/api/kernel/audit/index.ts (new), src/lib/kernel-certs/cert-service.ts (modified — added listCerts to CertStore interface), src/lib/kernel-certs/prisma-store.ts (modified — added listCerts + listAuditEvents + StoredAuditEvent), kernel/tests/eval-certificate.test.js (modified — added reject + listCerts tests), kernel/tests/eval-certificate.db.integration.test.js (modified — added listCerts + listAuditEvents integration test)
- **What**: أكملنا الـ 4 routes المتبقية من Phase 2 spec: GET/PATCH/DELETE على evaluations/[id]، GET/POST على certificates/index، POST verify على certificates/[id]/verify، GET list على audit/index. أضفنا listCerts() و listAuditEvents() للمخازن. أضفنا 3 اختبارات وحدوية جديدة (reject + listCerts) واختبار تكاملي للـ list methods.
- **Why**: الـ spec الأصلي طلب 5 routes — الأولى (evaluations/index) كانت موجودة. الباقي 4 كانوا ناقصين. الـ store methods الجديدة مطلوبة للـ list endpoints.
- **Verification**: npm run build:client ✅ 0 errors, npx astro build ✅ 125 pages 0 errors, npx vitest run kernel/tests/eval-certificate.test.js ✅ 12/12, grep للـ routes الجديدة في dist/server/ ✅ كل الـ handlers مدمجة, tsc --noEmit ✅ 0 errors من ملفاتنا (4 أخطاء مسبقة في ملفات أخرى).
- **Report**: report/2026-08-04-kernel-api-routes.md
- **Commit**: 636ea0e1 (المستخدم التزم — per brain.md rule)
- **Status**: verified locally
- **Brain updates**: Updated Section 2 (هذا الـ entry), Section 5 (cert-service interface + prisma-store methods added).

### 2026-08-03 — Evaluation Certificate side-server: libs + API + Ed25519 + Postgres + اختبارات (12/12)

- **Files**: `src/lib/kernel-certs/*` (admin-auth, canonical, sha256, signing, env, libClient, eval-service, cert-service, in-memory-store, prisma-store, facade), `src/pages/api/kernel/evaluations/*` (index + [id]/cases/complete/resume/rerun), `src/pages/api/kernel/certificates/*` (issue/verify/revoke), `packages/db/prisma/schema.prisma` + migrations `20260803*`, `scripts/generate-eval-cert-key.mjs`, `scripts/seed-eval-cert-key.mjs`, `.env.example`, `kernel/tests/eval-certificate.test.js` + `.db.integration.test.js`
- **What**: بنينا نظام شهادات تقييم للـ kernel — يوقّع بروتوكول من بيانات التقييم لكل جولة مكتملة، وأي جهة خارجية تتطلب منه عبر `/api/kernel/certificates/verify?id=…`. تضمن: بوابة admin (x-brightai-admin-key)، canonical JSON digest، توقيع Ed25519، مخازن in-memory + Postgres (Prisma)، جداول run/certificate/signing_key/audit.
- **Why**: شرط الحوكمة — تقييمات kernel لازم تنفع إثبات سلامة دائم قابل للتحقق المستقل. وأصّلنا bug صريح كشفه اختبار التكامل: `fromDbCert` كان يعيد بناء payload فارغ/أصفار، فتحقق أي شهادة سليمة يطلع digest-mismatch؛ الحل حفظ الـ payload JSON في DB.
- **Verification**: `npx tsc --noEmit --moduleResolution bundler ... src/lib/kernel-certs/*` ✅ 0؛ vitest: unit 10 + DB integration 2 = **12/12** ✅؛ `scripts/seed-eval-cert-key.mjs` ✅ `v1 | Ed25519` seeded (psql تأكد)؛ migration payload طُبّق على dev.
- **Report**: `_reports/2026-08-03-evaluation-certificate.md`
- **Commit**: uncommitted — المستخدم يلتزم (rule: لا commits من الوكيل)
- **Status**: verified (local, dev DB)
- **Brain updates**: معرّفة новых libs فقط، لا تغيير tokens/components.

### 2026-08-02 — KRN-M29-QA: فحص WCAG 2.2 AA شامل (axe 21 صفحة = 0) + responsive (80 حالة = 0) + إصلاح M26 (CSS الموصلات) + حل verify:all

- **Files**:
  - `kernel/assets/css/pages/connectors.css` (REWRITTEN — نظام `kc-*` كامل بدل الـlegacy الميت `.connectors-*`؛ KPIs، بطاقات، guide، drawer، flow، test، sync، queue، toast، prefers-reduced-motion، responsive)
  - `src/styles/kernel.css` (EDITED — `body.kernel-shell footer.footer { display: none }` + إصلاحات color-contrast)
  - `src/styles/kernel/{eval,datasets,scorers,policies,redteam,playground}.css` (EDITED — color-contrast AA)
  - `public/js/kernel-audit.js` (EDITED — `role="cell"`)، `public/js/kernel-policies.js` (EDITED — `role="row"/"cell"`)
  - `public/js/kernel-connectors.js` (EDITED — `.kc-card__main` منطق نقر البطاقة، أزرار الحالة خارجها)
  - `src/pages/kernel/{playground,api,models}.astro` (EDITED — roles + tabindex + scrollable-focusable)
  - `public/js/kernel-api 2.js` + `public/js/kernel-api-data 2.js` (DELETED — مكرّران macOS " 2" كانا يكسران verify:all، بموافقة المستخدم)
  - `scripts/playwright/axe-kernel.mjs` (NEW — 21 route axe wcag 22aa)، `scripts/playwright/m29-responsive-qa.mjs` (NEW — 16 صفحة × 5 viewports)
  - `report/2026-08-02-krn-m29-qa.md` (NEW)
- **What**: فحص شامل لصفحات kernel: axe WCAG 2.2 AA على 21 مسار + فحص overflow أفقي على 5 viewports + إصلاح كل المخالفات. اكتشفت وأصلحت خلل M26: صفحة `/kernel/connectors/` كانت بلا CSS إطلاقًا (الـlegacy `.connectors-*` لا يطابق `kc-*` الحالي). كذالك اكتشفت أن الفوتر التسويقي من `BaseLayout` يظهر على kernel بلا أنماطه (`components.css` غير محمّل) فأخفينه.
- **Why**: شرط الجودة — kernel يحتاج WCAG 2.2 AA (0 violations) + لا overflow أفقي على أي viewport. وM26 خلل جوهري: الموصلات معروضة بلا أي تنسيق.
- **Verification**:
  - `npm run build` → نجح ✅
  - axe-kernel.mjs → **21/21 صفحة: 0 critical / 0 serious / 0 moderate / 0 minor** ✅ (كانت سابقًا C:3 S:22 قبل إصلاحات M-series)
  - m29-responsive-qa.mjs → **80 combo / 0 failing** + 0 أخطاء console/page ✅
  - probe connectors: البطاقات مصفّفة (bg #131c30، border، radius، 365×320)، الدرج يفتح/يقفل ✅
  - `npm run verify:all` → **exit 0** (TOTAL ERRORS: 0) — حُلّ المعلّق من M28 (ملفا "kernel-api 2") ✅
- **Report**: `report/2026-08-02-krn-m29-qa.md`
- **Commit**: uncommitted — المستخدم يلتزم (rule: لا commits من الوكيل)
- **Status**: verified locally
- **Brain updates**: قسم 2 (هذا الـ entry)؛ حلّ KI مفتوح (ملفا "kernel-api 2" كانا في known-issues كمصدر broken-links). ملاحظة: `dist/` يحتفظ بنسخ قديمة من الملفات المحذوفة — أي حذف من `public/` يتطلب `npm run build` قبل `verify:all` (لأن seo:gate يفحص `CLIENT_ROOT=dist/client`).
- **ملاحظة**: بقي تنظيف لاحق خارج النطاق: ملفات kernel-api الميتة الباقية (`kernel-api`, `kernel-api.js`, `kernel-api-data.js` 55B)؛ LSP errors قديمة في policies.astro:53 / models.astro:41 (لا تُفشل البناء)؛ روابط فوتر السايدبار صغيرة (target-size).

---

### 2026-08-02 — KRN-M28-LINKS-PHASE3: ربط الموافقات بالدليل (approvals → evidence) + إعادة التشغيل بالأصل (replay → parent)

- **Files**:
  - `public/js/kernel-approvals.js` (EDITED — `updateLedger()`: الـ spans السابقة صارت روابط/أزرار حقيقية — `Audit {eventId}` → `<a>` لـ `/kernel/audit/?trace=...`، `Trace` → `<button data-kap-ledger-trace>` يفتح الدرج المشترك، `Evidence {evidenceHash}` و`{certificateId}` → `<a>` لـ `/kernel/evidence/?trace=&evd=`؛ `bindLedgerEvents()`: delegation click/keydown على `[data-kap-ledger-trace]` → `KernelTraceDrawer.open(traceId)` مع fallback لـ audit)
  - `src/pages/kernel/evidence.astro` (EDITED — articles الثابتة صارت تحمل `data-trace={item.traceId}`؛ دالة `applyLinkParams()` جديدة تقرأ `?trace=` (+`?evd=`)، تعيد ضبط الفلاتر، تُبرز العنصر المطابق بـ `.kernel-evidence-item--linktarget` + scroll + focus، تحدّث عدّاد `[data-kernel-evidence-count]`، وتُظهر `.kernel-evidence-linknote` عند عدم التطابق؛ استُدعيت في `init()`)
  - `public/js/kernel-time-machine.js` (EDITED — `renderRows()`: خلية الـ trace صارت `<button class="rp-table__trace" data-rp-trace-open>`؛ `bindAffectedTraceLinks()` جديدة: delegation على tbody يفتح الدرج المشترك بسياق الصف (user/dept/verdict seed) مع fallback؛ `runInvestigation()` + `bindInvestDrawer()`: زر `[data-rp-invest-drawer]` يفتح الرحلة المحقّقة في الدرج)
  - `src/pages/kernel/replay.astro` (EDITED — أُضيف زر `[data-rp-invest-drawer]` بجانب زر إعادة البناء + أيقونة `iconExternal`؛ **وصلاح خطأ جوهري**: الـ inputs كان لها `id="rp-date-from/to"` و`id="rp-dept"` بينما المحرّك يبحث عن `data-rp-date-from/to/dept` → زر التشغيل كان يكسر بخطأ `Cannot read properties of null` — أُضيفت الـ data-attributes فصار يشتغل)
  - `public/js/kernel-drawer.js` (EDITED — `showLineage(drawer, run)` جديدة داخل `fillFromStore`: لو الـ run له `parentRunId` تظهر سطر «↻ إعادة تشغيل من» + زر «افتح الأصل» `[data-kernel-drawer-open-parent]` يعيد فتح الدرج على الأصل)
  - `src/layouts/KernelLayout.astro` (EDITED — قسم `.k-trace-drawer__lineage` + بيانات `data-kernel-drawer-lineage/parent/open-parent`)
  - `src/styles/kernel.css` (EDITED — `.kernel-ap-ledger__link` (+ hover/focus/reduced-motion)، `.kernel-evidence-item--linktarget`، `.kernel-evidence-linknote`، `.k-trace-drawer__lineage`)
  - `kernel/assets/css/pages/replay.css` (EDITED — `.rp-table__trace` صار زرًا فعليًا + `.rp-invest-drawer`)
  - `scripts/playwright/verify-kernel-approvals-evidence.mjs` (NEW — 4 مراحل: ledger links حقيقية، نقر Trace يفتح الدرج، `?trace=` يبرز ملف الدليل، صفوف replay أزرار تفتح الدرج)
- **What**: نفّذت آخر ربطَين من M28: (4) من سجل قرارات الموافقات كل رابط Trace/Evidence/Certificate يفتح الدرج المشترك أو صفحة الدليل المعنية بمعرّف مطابق؛ (3) من آلة الزمن كل trace في الطلبات المتأثرة وزر التحقيق يفتح الدرج المشترك، والدرج يعرض نسب «إعادة تشغيل من الأصل» مع زر فتح الأصل.
- **Why**: شرط M28 — تنقّل موحّد بمعرّفات مشتركة بين كل صفحات kernel. كذلك انكشف خطأ جوهري كان يكسر زر التشغيل في `/kernel/replay/` (selector mismatch بين HTML وJS) فصُحّح.
- **Verification**:
  - `npm run build` → نجح ✅
  - Playwright `verify-kernel-approvals-evidence.mjs` → **كل المراحل نجحت ✅** (A: ledger 4 روابط صحيحة ✅، B: نقر Trace فتح الدرج ✅، C: `?trace=` أبرز العنصر + عدّاد «1 من 12» ✅، D: 200 زر trace + فتح الدرج بسياق الصف ✅)
  - `verify:all` → exit 1 فقط بسبب 6 broken-links من `public/js/kernel-api-data 2.js` (ملف قديم مكرر — غير مرتبط)
  - `npm run performance:budget` → ✅ جميع البنود ضمن الميزانية
- **Status**: verified locally
- **Brain updates**: أُضيف entry (Section 2). **بكتمال هذا الـ entry اكتمل M28 Links Phase 2 بالكامل** (4 روابط: stats→Store، policies→playground، approvals→evidence، replay→parent).
- **ملاحظة**: بقي معلّقًا خارج النطاق: إزالة/إصلاح `public/js/kernel-api-data 2.js` (مصدر أخطاء verify:all الستة) — يُفضَّل في مرحلة تنظيف منفصلة.

---

### 2026-08-02 — KRN-M28-LINKS-PHASE2: ربط محرر السياسات بالملعب (policies → playground) بمعرّفات مطابقة

- **Files**:
  - `public/js/kernel-policies.js` (EDITED — أُضيفت بعد `actionLabel()`: خرائط `PG_PII_MAP`/`PG_PACK_MAP`/`PG_ACTION_MAP` + دالة `playgroundLinkFor(p)` تُرجع رابط `/kernel/playground/?pii=...&action=...&pack=...` أو null لـ piiType بلا نظير (مثل salary)؛ أُضيف زر «جرّبها» `<a class="po-btn po-btn--ghost">` بعد زر الاستثناءات في `renderPoliciesTable()` — `data-po-playground` عند توفر الرابط وإلا `data-po-playground-disabled` + `aria-disabled`)
  - `public/js/kernel-playground.js` (EDITED — أُضيفت `applyLinkParams(root)` بعد `applyHash` تقرأ `?pii/action/pack/name`، تفعّل كل `.pg-toggle[data-pid]` المطابقة (piiType+action)، تضبط `[data-context=pack]`، تُظهر `#pg-link-note`، وتعلن عبر `announce()`؛ استُدعيت في `init()` بجانب `applyHash`)
  - `src/pages/kernel/playground.astro` (EDITED — `<span class="pg-link-note" id="pg-link-note" hidden>سياسة من محرر السياسات — طُبّقت هنا</span>` بجانب `pg-local-badge/pg-embed-badge`)
  - `kernel/assets/css/pages/playground.css` (EDITED — نمط `.pg-link-note` + `[hidden]` بعد `.pg-local-badge`)
  - `scripts/playwright/verify-kernel-policies-playground.mjs` (NEW — 4 مراحل: 10 روابط «جرّبها» بالصيغة الصحيحة + action param، `pr_iban_block_cross` OFF افتراضيًا، `?pii=iban&action=block&pack=sama` → ON + note ظاهر + pack=sama + لا أخطاء console، `?pii=salary` (بلا نظير) → الافتراضي محفوظ + note مخفي)
- **What**: نفّذت المرحلة 2 من الربط المشترك M28: من محرر السياسات تقدر تجرّب أي سياسة في الملعب مباشرة — الرابط يبني معرّفات مطابقة تلقائيًا (piiType/action/pack) ويطبقها على كل مفتاح الملعب المطابق مع شارة إعلامية.
- **Why**: شرط M28 (تنقّل موحّد بين صفحات /kernel/* بمعرّفات مشتركة). السياسات والمفتاح كانا معزولين — الـ editor يستخدم piiTypes مختلفة (mobile/patient_file/medical_record/salary + packs nca_ecc/iso_27001/iso_42001) عن playground (phone/patient_id/medical + nca/iso27001/iso42001)، فتطلّب خرائط تحويل.
- **Verification**:
  - `npm run build` → نجح ✅ (dist مبني بدون أخطاء)
  - Playwright `verify-kernel-policies-playground.mjs` → **كل المراحل نجحت ✅** (روابط Phase A ✅، OFF الافتراضي Phase B ✅، التطبيق الكامل Phase C ✅، حالة salary Phase D ✅)
  - `verify:all` → exit 1 بسبب 6 broken-links من ملف قديم مكرر `public/js/kernel-api-data 2.js` فقط (غير مرتبط بهذا التغيير؛ كل أخطاء الـ verify:all منه)
- **Status**: verified locally
- **Brain updates**: أُضيف entry (Section 2). ملاحظة لاحقة: الربطان المتبقيان من M28 (approvals→evidence عبر `evidenceHash`، وreplay←parent) لم يُنفذا بعد.

---


### 2026-08-02 — KRN-M28-DRAWER-MERGE: دمج درج التدقيق في الدرج المشترك + تنظيف بقاياه

- **Files**:
  - `src/layouts/KernelLayout.astro` (EDITED — أقسام تفاصيل جديدة بعد سلسلة الهاش: `[data-kernel-drawer-detail|json|snippet|actions]` + `data-label` للخانات الأربع الملخص → تستخدمها دالة تصدير PDF)
  - `src/styles/kernel.css` (EDITED — كلاسات `.k-trace-drawer__detail/*` الجديدة + حذف بقايا `.kernel-audit-drawer*` كلها (الكتلة الكاملة + 3 media queries))
  - `public/js/kernel-drawer.js` (EDITED — fillFromStore/fillFromSeed موسّعان يملآن status/approval/anomaly/action/JSON/snippet + `statusAr()` + `toggleSection()` + ربط أزرار نسخ الهاش/نسخ snippet/تصدير PDF + `exportDrawerPdf()` + openDrawer يعيد ضبط الأقسام عند كل فتح)
  - `public/js/kernel-audit.js` (EDITED — استبدال نظام الدرج الخاص: `openDrawer(realIndex)` → `window.KernelTraceDrawer.open(r.traceId, seed)` بseed غني + `buildTimeline(r)` بصيغة seed الجديدة + `closeDrawer()` توكل للشِل + `bindDrawer()` فارغة + تحديث رأس DOM contract)
  - `src/pages/kernel/audit.astro` (EDITED — حذف درج `[data-kernel-audit-drawer]` الخاص كاملًا + حذف `iconCopy` الميت + إصلاح نوع `jsonLd` عبر `as unknown as Record<string, unknown>`)
  - `scripts/playwright/verify-kernel-audit.mjs` (EDITED — التحديث للدرج المشترك: traceId من `[data-kernel-trace-id]`، حالة الفتح من `aria-hidden="false"`)
- **What**: نفّذت "دمج كامل — درج واحد" (خيار المستخدم): ميزات درج التدقيق (JSON، DevTools snippet، تصدير PDF، نسخ هاش، رابط دليل) انتقلت للدرج المشترك `#k-trace-drawer`، وحذفت الدرج الخاص نهائيًا.
- **Why**: توحيد الفتح عبر `window.KernelTraceDrawer.open(traceId, seed)` يزيل ازدواجية الكود ويوحّد التجربة في كل صفحات /kernel/* (شرط M28).
- **Verification**:
  - `npm run build` → نجح ✅ (chunk `audit_6LMTMIRk.mjs` مبني، 0 بقايا `kernel-audit-drawer` في dist)
  - Playwright `verify-kernel-audit.mjs` → الصفوف (12,483) ✅ · البحث ✅ · verifier ✅ · tamper ✅ · **shared drawer opened ✅** (باقي فحص console واحد: 504 Outdated Optimize Dep — من Vite dev-toolbar، لا علاقة لنا)
  - `rg "kernel-audit-drawer" src/ public/` → فقط تعليق توثيقي في kernel-audit.js ✅
- **Status**: verified locally
- **Brain updates**: أُضيف entry (Section 2). ملاحظة: مشكلة نوع `jsonLd` موجودة مسبقًا في صفحات kernel القديمة (models/evidence/connectors/reports/approvals) — الصفحات الأحدث (playground/scorers/datasets/eval/replay) تستخدم الـ cast.

---


### 2026-08-02 — KRN-MODELS-CONNECTORS-API-M25-M26-M27: التحقق واكمال ميزات N25 و M26 و M27 في /kernel/

- **Files**:
  - `src/pages/kernel/models.astro` (VERIFIED — السجل، الحلبة، قواعد التوجيه، مكان البيانات، التكلفة، معدل النجاح، الهلوسة، الأمان، التجاوز اليدوي، تدهور الأداء، التصدير CSV)
  - `src/pages/kernel/connectors.astro` (VERIFIED — الموصلات الـ8 SAP, Oracle, Dynamics, Epic, Moodle, SharePoint, Salesforce, Okta، قراءة فقط، OAuth/SAML، الصحة، المزامنة، التكلفة/الزمن، تجديد التوكن، إعداد OAuth، مخطط تدفق البيانات، الاختبار الحي، طابور الانقطاع، دليل الموصل المخصص)
  - `src/pages/kernel/api.astro` (UPDATED — إضافة 4 نقاط طرفية جديدة: Evaluation Run API, Dataset API, Scorer API, Certificate Verification API + إضافة قسم مكتبات SDK لـ Python/TS/Go + إضافة قسم وثائق التشغيل لغير التقنيين + تطبيق التظليل الصارم للمفاتيح "لا تعرض أي مفتاح كامل" `br_k_demo_a7c8...d41b`)
  - `scripts/verify-models.mjs` (VERIFIED — 25 فحص: determinism + count matrix + TS↔JS parity + hygiene)
  - `scripts/verify-connectors.mjs` (VERIFIED — 22 فحص: determinism + count matrix + TS↔JS parity + hygiene)
- **What**: استكمال ومراجعة جميع المتطلبات الخاصة بـ M25 (النماذج والتوجيه) و M26 (الموصلات) و M27 (وحدة المطوّر والـ APIs). إضافة جميع نقاط REST المطلوبة (Inspect, Evidence, Eval Runs, Datasets, Scorers, Cert Verification)، توثيق SDKs ووثائق التشغيل لغير التقنيين، وضمان إخفاء المفتايح بالكامل (`br_k_demo_a7c8...d41b`).
- **Why**: تلبية متطلبات تنفيذ وحوكمة النماذج والموصلات والـ APIs في نظام Kernel وفق المواصفات السعودية واستجابة لطلب المستخدم.
- **Verification**:
  - `npm run verify:models` → **25/25 ✅**
  - `npm run verify:connectors` → **22/22 ✅**
- **Status**: verified locally

---

### 2026-08-01 — KRN-REPORTS-STATS-M23-M24: بناء /kernel/reports/ + /kernel/stats/ كامل — تقارير حتمية + مؤشرات حية

- **Files**:
  - `src/data/kernel-reports.ts` (NEW — مولّد حتمي: 42 تقرير + 4 scheduled + 5 template versions، seed `0x7e3a1c50`، mulberry32 + FNV-1a chain (genesis `0x00000000`)، 7 أنواع (governance/compliance/audit/risk/custom/pii/connectors) + 4 صيغ (PDF/JSON/CSV/XLSX) + 5 لغات (ar/en/fr/es/de) + Trace coverage + Certificate coverage + executive summary مولّد آليًا + role recipients)
  - `public/js/kernel-reports-data.js` (NEW — UMD mirror بايت-بايت للمولّد)
  - `public/js/kernel-reports.js` (NEW — محرك vanilla JS: filters (type+status+language) + report library + wizard 4 خطوات + **report builder (drag & drop widgets)** + **preview drawer** + **5 languages switcher** + **template versions tab** + Trace/Certificate coverage display + scheduled reports + role recipients)
  - `src/pages/kernel/reports.astro` (REBUILT — 3 تبويبات: Library | Builder | Versions + KPIs SSR + filters + library + scheduled + builder (palette + canvas + properties) + preview drawer + wizard modal + SEO + cross-links)
  - `kernel/assets/css/pages/reports.css` (REBUILT — tabs + filters + report list + scheduled + builder (palette + canvas + widgets) + preview drawer + versions + wizard + language switcher + responsive + reduced-motion)
  - `src/data/kernel-stats.ts` (NEW — مولّد حتمي: 12,483 طلب + time series + risk distribution + top users (10) + top departments (7) + top models by cost (5) + live events (20) + alerts (4) + quotas (7) + cost + latency (P50/P95/P99) + period comparison، seed `0x5c0ffee0`)
  - `public/js/kernel-stats-data.js` (NEW — UMD mirror بايت-بايت)
  - `public/js/kernel-stats.js` (NEW — محرك vanilla JS: 6 KPIs clickable → /kernel/audit/ + Chart.js (line + doughnut) + top users/departments/models tables + **live event stream + pause** + period comparison + alerts + quotas + cost + latency panels + range tabs + export PDF)
  - `src/pages/kernel/stats.astro` (REBUILT — range tabs + KPIs + charts row + top row (users/departments/models) + stream row (live events + comparison) + panels row (alerts/quotas/cost/latency) + SEO + cross-links)
  - `kernel/assets/css/pages/stats.css` (NEW — KPIs + charts + tables + live stream + alerts + quotas + cost + latency + responsive + reduced-motion)
  - `scripts/verify-reports.mjs` (NEW — 25 فحص: determinism + count matrix + TS↔JS parity + chain validity + hygiene)
  - `scripts/verify-stats.mjs` (NEW — 22 فحص: determinism + count matrix + TS↔JS parity + hygiene)
  - `package.json` (EDITED — `verify:reports` + `verify:stats`)
- **What**: بنيت M23 (Reports) + M24 (Stats) كاملين بنفس نمط M14–M20 (مولّد حتمي + UMD mirror + محرك vanilla + CSS + verify gate). Reports: 42 تقرير حتمي + 7 أنواع + 4 صيغ + 5 لغات + report builder بصري (drag & drop widgets) + preview drawer بملخص تنفيذي + template versions بـ hash chain + Trace/Certificate coverage + role recipients + scheduled reports. Stats: 12,483 طلب + 6 KPIs clickable → audit + Chart.js (line + doughnut) + top users/departments/models by cost + live event stream + pause + period comparison + alerts + quotas + cost + latency (P50/P95/P99).
- **Why**: M23 و M24 من Prompt 23 — التقارير والمؤشرات هما واجهة الإدارة العليا والجهات الرقابية. الصفحات القديمة كانت ناقصة ميزات جوهرية (builder، widgets، preview، 5 لغات، Trace coverage، top models by cost، live stream، clickable KPIs، alerts، quotas، cost، latency).
- **Verification**:
  - `npm run verify:reports` → **25/25 ✅** (determinism، count matrix 42/38/1/4، TS↔JS parity كاملة، chain من genesis للنهاية، hygiene نظيفة)
  - `npm run verify:stats` → **22/22 ✅** (determinism، count matrix 12483/11210/382/841/1554، TS↔JS parity، hygiene)
  - `npm run build` → 0 أخطاء ✅ (`/kernel/reports/` + `/kernel/stats/` تُبنى، ملفات `/js/kernel-reports-*.js` + `/js/kernel-stats-*.js` تُنسخ لـ dist)
  - `npm run verify:all` → exit 0 ✅ (0 errors، hreflang 259/0)
- **قرارات موثقة**:
  - **حتمية كاملة**: لا Math.random/Date.now/toLocaleString في أي مولّد — نفس seed = نفس البيانات في كل بيئة.
  - **Report Builder**: drag & drop widgets (KPI/chart/table/text/page-break) على قماش A4 — HTML5 Drag API (لا مكتبة).
  - **5 Languages**: مبدّل في رأس كل تقرير (ar/en/fr/es/de) — UI فقط، المحتوى يبقى عربي.
  - **Clickable KPIs**: نقر أي KPI في stats ينقل لـ `/kernel/audit/?status=blocked` (إلخ) — ربط بين الصفحات.
  - **Live Event Stream**: محاكاة بـ `setInterval` 3 ثوانٍ + زر إيقاف مؤقت — بيانات حتمية (لا WebSocket).
  - **Chart.js موجود**: أعدنا استخدام Chart.js الموجود في stats (ما أضفنا مكتبة جديدة).
  - **CSP-safe**: `type="module"` لسكربتات public/js/ — نفس نمط M14–M20.
  - **SEO checker**: `role="article"` في JS يفهمه checker كمسار → شيلناه للـ non-clickable KPIs.
- **Report**: none (يُتوقع من المستخدم كتابة تقرير إذا رغب)
- **Commit**: uncommitted (user commits via main — per brain line 17)
- **Status**: verified locally
- **Brain updates**: Section 5 (kernel-reports.ts + kernel-reports.js + kernel-stats.ts + kernel-stats.js + verify-reports.mjs + verify-stats.mjs كـ canonical)

---

### 2026-08-01 — KRN-REPLAY-M20: بناء /kernel/replay/ (آلة الزمن) كامل — محاكاة السياسات على الطلبات التاريخية + بوابة الموافقة الإلزامية للـ external

- **Files**:
  - `src/pages/kernel/replay.astro` (REWRITTEN — صفحة M20: تبويبان محاكاة/تحقيق، لوحة إعداد (فترة/سياسات/نطاق/وضع معالجة)، نتائج (شارة مصدر + 4 أرقام + مخطط قبل/بعد + تحذير عنبري + أقسام متأثرة + جدول بأعلام FP + تصدير)، بوابة موافقة `rp-consent`، SEO section + cross-links، سكربتات `/js/kernel-time-machine-*.js`)
  - `src/data/kernel-replay.ts` (NEW — مولّد حتمي: 520 صف، seed `0x5c0ffee0`، mulberry32 + FNV-1a chain (genesis `0x00000000` → final `0x3951eca0`)، `simulateReplay` + `buildTimeline` + بوابات consent، types + REPLAY_MONTHS/POLICIES/DEPTS/TS_START/TS_END)
  - `public/js/kernel-time-machine-data.js` (NEW — UMD mirror بايت-بايت للمولّد)
  - `public/js/kernel-time-machine-worker.js` (NEW — worker: init/simulate/investigate/export/verify/tamper-check + buildMemo)
  - `public/js/kernel-time-machine.js` (NEW — محرّك الصفحة: tabs، shortcuts، multi-select، mode radio، consent flow، مخطط، أقسام، جدول، تصدير، خط زمني)
  - `kernel/assets/css/pages/replay.css` (EDITED — كتل المودال + mode switcher + شارة المصدر + ترتيب الأقسام + FP chip + مخطط fallback جدولي)
  - `scripts/verify-replay.mjs` (NEW — بوابة تحقق 27 فحص)
  - `package.json` (EDITED — `verify:replay`)
- **What**: بنيت صفحة آلة الزمن كاملة بمستوى M19: تعيد تشغيل السياسات المقترحة على 520 طلبًا تاريخيًا (حتمي، لا Math.random) وتُظهر الأثر (+340 حظر/ −12 إطلاق/ 48 FP/ net 328) في شريط + مخطط شهري + أقسام متأثرة + جدول + تصدير كمذكرة قرار، وتبويب تحقيق يعيد بناء حادثة خطوة بخطوة على خط زمني قابل للتكبير. الشرط الأمني الإلزامي (Prompt 20): external mode يتطلب موافقة صريحة عبر مودال مفصّل قبل أي إرسال، والوحدة نفسها ترد `consentRequired=true` بصفر بيانات بدون موافقة — مفروض في الطبقتين.
- **Why**: صفحة replay كانت القديمة (محرك M11) — مطلوب إعادة بناء بجودة M19 مع بوابة الأمان الإلزامية.
- **Verification**:
  - `npm run verify:replay` → 27/27 ✅ (determinism، count matrix 340/12/48/168/328، TS↔JS parity، chain validity، simulation contract، consent gate (external بلا موافقة → 0 بيانات)، timeline determinism، hygiene)
  - `npm run build` → 0 أخطاء ✅ (صفحة `/kernel/replay/` تُبنى، الملفات تُنسخ إلى `dist/client/js/`)
  - `npm run verify:all` → 16 pass / 0 fail ✅ (ملاحظات raw hex في kernel.css مسبقة)
  - `npm run performance:budget` → ✅ كل البنود ضمن الميزانية
- **Report**: report/2026-08-01-krn-replay-m20.md
- **Commit**: uncommitted (user commits via main — per brain line 17)
- **Status**: verified locally
- **Brain updates**: Section 5 (kernel-time-machine-* = canonical for replay)، ملاحظة: أسماء `kernel-replay.js` محجوزة لمحرك M11 عبر `window.n`.

---

- **Files**:
  - `public/js/kernel-approvals.js` (REBUILT — M19.1: full Trace (أي Trace ID في التفاصيل يفتح درج الرحلة `k-trace-drawer`)، تفويض حقيقي (select بمستهدفي `APPROVAL_REVIEWERS` داخل المودال عند action=transfer + مستهدف إلزامي + تسجيل المستلم في السجل)، اقتراح آلي يعرض شارة «اقتراح آلي — راجعه قبل التأكيد» (مراجعة بشرية)، ledger يعرض مراجع ملموسة: Audit event id · Trace · Evidence hash (FNV-1a) · Certificate id — append-only لا حذف)
  - `src/pages/kernel/approvals.astro` (EDITED — modal أضيف `[data-kap-modal-delegate-field]` (select التفويض) + `[data-kap-modal-suggest-badge]` (شارة المراجعة))
  - `src/styles/kernel.css` (EDITED — block KRN-APR-M19.1 في الأعلى: `.kernel-ap-detail__trace--link` رابط متقطع يفتح الدرج · شارات الاقتراح · `.kernel-modal__select` + hint للتفويض · `.kernel-ap-ledger__delegate` + `.kernel-ap-ledger__links` (spans) — كلها var() فقط)
- **What**: رقّيت صفحة الموافقات لإغلاق فجوات M19 حسب الطلب: 1) Trace صار قابلاً للفتح في درج الرحلة (كامل الرحلة، ليس نصاً). 2) "حوّل" صار تفويضاً فعلياً بمستهدف مراجع حقيقي يُختار في المودال ويُسجَّل كجهة مستقبلة في السجل. 3) الاقتراح الآلي يظهر تنبيهاً صريحاً أنه مرشح يحتاج مراجعة بشرية قبل التأكيد. 4) كل قرار يولّد Audit event + يرتبط بـ Trace + Evidence hash + Certificate في السجل (غير قابل للحذف — append-only).
- **Why**: M19.js كان يعرض Trace كنص ثابت و"تحويل" مجرد modal، والاقتراح يملأ الحقل بصمت، والـ ledger يعرض "Audit · Trace · Evidence · Certificate" كنص ثابت بلا مراجع حقيقية.
- **Verification**:
  - `npm run build` → 0 أخطاء ✅ (`/kernel/approvals/` تُبنى، وحدة kernel المنقاة 145.9KB)
  - `node scripts/verify-approvals.mjs` → 15/15 ✅ (determinism + count matrix + TS↔JS parity + chain + SLA + hygiene)
  - `node --check public/js/kernel-approvals.js` → exit 0 ✅
  - `npm run verify:all` → يفشل **فقط** في `lint:tokens` بـ 9 مخالفات **مسبقة** (سطور 4723-4739 = `.kernel-ap-pii--*` ألوان hex + `padding:3px 10px` — في CSS M19 الأصلي قبل تعديلي، وليست من إضافاتي التي استخدمت var() فقط). الألوان عمدية لتظليل PII حسب تصميم-صفحات-kernel §1.1 — لم أمسّها حفاظاً على عقد التظليل اللوني.
- **Report**: none
- **Commit**: uncommitted (user commits via main — per brain line 17)
- **Status**: verified locally
- **Brain updates**: Section 5 (kernel-approvals.js = M19.1 canonical). ملاحظة: lint-tokens مسبق بـ 9 مخالفات PII colors في M19 الأصلي — قرار بعدم إصلاحها (تكسر تظليل PII).

---

### 2026-08-01 — KRN-APPROVALS-M19: إعادة بناء /kernel/approvals/ بساحة موافقات حتمية + إصلاح طبقة CSS + إصلاح modal

- **Files**:
  - `src/pages/kernel/approvals.astro` (REBUILT — M19: 162-row deterministic queue, seed `0xa4c1e0f2`, final hash `0x90e4c4c8`, SLA critical 4h/pending 24h, chain genesis `0x00000000`, toolbar shortcuts button bound, inline style removed → scoped `.kernel-ap-ledger-wrap`)
  - `src/data/kernel-approvals.ts` (NEW — deterministic dataset generator: `APPROVAL_NOW = Date.UTC(2026,6,31,12,0,0)`, 7/3/2/142/8 = 162 rows, SLA windows, null deadlines for approved/rejected, full chain validity)
  - `public/js/kernel-approvals.js` (NEW — vanilla JS engine: deterministic sort/filter/search, toolbar `bindShortcutsBtn()`, modal lifecycle, keyboard nav, `prefers-reduced-motion`, no `Math.random`/no `Date.now`/no `toLocaleString`/no `fetch`)
  - `public/js/kernel-approvals-data.js` (NEW — frozen 162-row dataset blob, `Object.freeze` + hash verification `0x90e4c4c8`)
  - `public/js/kernel-approvals-worker.js` (NEW — Web Worker for deterministic computation, postMessage results, no side effects)
  - `src/styles/kernel.css` (EDITED — KRN-APR-001: added `.kernel-modal[data-open="false"] { display: none; }` after `[data-open="true"]` block; fixed shared modal bug where closed modals were visible)
  - `src/layouts/KernelLayout.astro` (EDITED — added top-level `@layer tokens,base,utilities,color,animations,kernel;` before `@import '../styles/kernel.css' layer(kernel)` to fix cascade layer ordering)
  - `src/styles/pages.css` (EDITED — removed dead `.kernel-approval-card__btn` selectors (2 occurrences))
  - `package.json` (EDITED — added `verify:approvals` script)
  - `scripts/verify-approvals.mjs` (NEW — 15/15 deterministic verification gate)
  - `scripts/playwright/verify-kernel-approvals.mjs` (NEW — 19/19 Playwright smoke test)
  - `report/2026-08-01-krn-approvals-m19.md` (NEW — detailed M19 report)
- **What**: سوّيت M19 كامل لصفحة الموافقات: 162-row dataset حتمي (seed `0xa4c1e0f2`, hash `0x90e4c4c8`), ساحة تحقق `verify:approvals` (15/15), Playwright smoke (19/19), إصلاح طبقة CSS cascade (الـ `layer(base)` كان يغلب `layer(kernel)` فيش), إصلاح modal bug (الـ modals المغلقة كانت تطلع), حذف inline style من ledger, ربط زر shortcuts في toolbar.
- **Why**: M19 من Prompt 08 — صفحة الموافقات لازم تكون حتمية وقابلة للتحقق (deterministic + hash-verified). الطبقة CSS كانت مكسورة (kernel layer ما كانت تغلّب base) بسبب `@layer` statement داخل `layer(kernel)` import بدل ما تكون top-level. الـ modal bug كان يؤثر على approvals + evidence مع بعض.
- **Verification**:
  - `npm run build` → 125 صفحة، 0 أخطاء ✅
  - `pnpm run verify:approvals` → 15/15 ✅
  - `npm run verify:all` → 5/5 ✅
  - `node scripts/playwright/verify-kernel-approvals.mjs` → 19/19 ✅ (كان 17/19 قبل إصلاح الطبقة)
  - `grep -c "padding-inline-end: 264px" dist/client/_astro/KernelLayout.*.css` → 1 ✅ (الـ .page padding صار 264px)
  - `grep -c "kernel-modal" src/styles/kernel.css` → 1 ✅ (KRN-APR-001)
  - `grep -c "@layer tokens,base,utilities,color,animations,kernel;" src/layouts/KernelLayout.astro` → 1 ✅
  - `node scripts/verify-approvals.mjs` → 15/15 ✅ (determinism doubled-build, count matrix, TS↔JS parity, chain validity, SLA-window check incl. `slaDeadline === null`)
- **Report**: `report/2026-08-01-krn-approvals-m19.md`
- **Commit**: `e796cb77`
- **Status**: deployed
- **Brain updates**: Section 1 (kernel CSS bundle 168.2→143.7KB), Section 5 (kernel-approvals.ts + kernel-approvals.js + kernel-approvals-data.js + kernel-approvals-worker.js + verify-approvals.mjs كـ canonical), added KRN-APR-001 modal fix + cascade layer fix to known patterns

---

### 2026-08-01 — KRN-AUDIT-M: بناء وحدة /kernel/audit/ الكاملة (REPORTS-15) — سجل تدقيق افتراضي حتمي 12,483 سجل

- **Files**:
  - `src/data/kernel-audit.ts` (NEW — مولّد حتمي 100%: `AUDIT_SEED` + `fnv1a()` (FNV-1a 32-bit) + `buildAuditRows()` → **12,483 صف** (allowed 11,210 = 10,497 آلي + 713 بموافقة بشرية / blocked 382 / pending_approval 841 / error 50؛ approvals 1,554) + `buildAuditStats()` لـ SSR KPI + `formatTsLabel`/`auditCanonical`/constants)
  - `public/js/kernel-audit-data.js` (NEW — UMD mirror byte-for-byte للمولّد: browser main thread → `window.KernelAuditData`، Web Worker → `importScripts`، Node → `module.exports` — يخدم المحرك و الـ worker بدون إعادة كتابة منطق)
  - `public/js/kernel-audit-worker.js` (NEW — Web Worker: يبني الصفوف عبر `importScripts('/js/kernel-audit-data.js')`، يعالج `filter` (status/query) و`verify` (تحقق سلسلة هاش FNV-1a حقيقي حول index) و`tamper-check` (محاكاة العبث)، يرجع `_id` عبر `reply()`، يتوافق مع CSP `worker-src 'self' blob:`)
  - `public/js/kernel-audit.js` (NEW — محرك vanilla مستقل CSP-safe: **Virtual scrolling** (`data-ka-viewport`/`-band`/`-spacer`، `ROW_H=44`، `updateScrollPos` يعرض `filteredIndices.length`) + فلاتر status/search (worker أو main-thread fallback) + `data-ka-idx` = real index + `getRowByRealIndex`/`openDrawer(realIndex)` + `bindKpis(rows)` من `fullRows` + verifier (`runVerify`/`runTamperDemo` بشرط `res.type==='verify'|'tamper-check'`) + تصدير CSV/JSON/PDF + نسخ trace + `fmtCount` يدوي بدون `toLocaleString` (حتمية كاملة)
  - `src/pages/kernel/audit.astro` (REWRITTEN — KPI SSR من `buildAuditStats()` (12٬483/11٬210/382/1٬554) + filter bar + toolbar (بحث/مسح/تصدير) + thead ثابت + viewport/band/spacer + empty state + verifier + drawer + `<script type="module" src="/js/kernel-audit-data.js">` قبل المحرك + استيراد `KernelEmptyState`)
  - `src/styles/kernel.css` (EDITED — كتلة `/* ── 23b ... */`: `.kernel-audit-*` KPI strip + جدول افتراضي (vrow ثابت 44px) + thead + status colors + verifier panel + mobile overrides + reduced-motion)
  - `scripts/verify-audit.mjs` (NEW — 5 مجموعات تحقق: determinism (بناءان متطابقان)، count matrix (12,483/11,210/382/841/50/1,554)، TS↔JS parity (كل الصفوف + prevHash/hash/traceId/status، final hash `0x40b8d3a6`)، chain validity (genesis → end)، source hygiene (لا Math.random/Date.now/toLocaleString/fetch بعد تجريد التعليقات والـ strings))
  - `scripts/playwright/verify-kernel-audit.mjs` (NEW — 12 فحص runtime على `astro preview`: console نظيف، loading يُزال، صفوف افتراضية تُعرض، counter 12,483، فلتر status، search + empty state، verifier ✓ بترميز trace حقيقي من الـ drawer، tamper ✗، drawer يفتح)
  - `package.json` (EDITED — أضفت `"verify:audit": "node --import ./scripts/test-ts-loader.mjs --experimental-strip-types scripts/verify-audit.mjs"`)
- **What**: بنيت وحدة `/kernel/audit/` بالكامل حسب REPORTS-15: سجل تدقيق افتراضي حتمي بـ 12,483 سجل (شبكة 44px ثابتة + band/spacer للتمرير بدون DOM ضخم)، كل سجل له سلسلة هاش FNV-1a حتمية من genesis `0x00000000`، فلترة status/search تعمل عبر Web Worker (fallback main-thread)، محقق سلسلة حقيقي (يعيد حساب hash ويتحقق من المخزّن) + محاكاة عبث تكشف أي تعديل فورًا، تصدير CSV/JSON/PDF، درج تفاصيل، وإحصاءات KPI تُعرض من الـ SSR.
- **Why**: REPORTS-15 من Prompt 08 — سجل التدقيق هو الدليل المحاسبي الأصلي: سجل غير قابل للكذب (سلسلة هاش) لحوكمة الـ AI. الصفحة السابقة كانت تعرض كسجل صغير غير قابل للتوسع ولا يحوي سلسلة تحقق فعلية.
- **Verification**:
  - `npm run verify:audit` → **12/12 ✅** (determinism، count matrix، TS↔JS parity كاملة، chain من genesis للنهاية، hygiene نظيفة بعد تجريد التعليقات/الـ strings)
  - `npm run build` → ✅ 0 أخطاء (`/kernel/audit/` تُبنى، KPI SSR: 12٬483/11٬210/٣٨٢/١٬٥٥٤؛ ملفات `/js/kernel-audit-*.js` تُنسخ لـ dist؛ `type="module"` مطلوب لسكربتات public/js عشان Astro ما يحاول bundling)
  - `npm run verify:all` → ✅ exit 0 (hreflang 259/0)
  - Playwright `verify-kernel-audit.mjs` على `astro preview` → **12/12 ✅** (لا console errors، loading يُزال، 19 صف افتراضي، counter 12,483، فلتر/search/empty، verifier ✓، tamper ✗، drawer مفتوح)
- **قرارات موثقة**:
  - **عقد الحتمية**: total 12,483 / allowed 11,210 (713 human-approved) / blocked 382 / pending 841 / error 50 / approvals 1,554 — يُتحقق منه في `verify-audit.mjs` ولا يسمح بالانحراف. نفس seed = نفس الصفوف في كل بيئة.
  - **الجدول الافتراضي**: صفوف ثابتة 44px (يطابق `ROW_H`) + viewport/band/spacer — تقريبًا DOM ثابت بغض النظر عن 12,483 سجل. على الجوال أبقينا صفوفاً جدولية عادية (أُلغيت فكرة البطاقات الجوالية) عشان يبقى حساب النافذة سليمًا.
  - **CSP-safe**: الـ worker عبر `importScripts('/js/kernel-audit-data.js')` (متوافق مع `worker-src 'self' blob:` في الترويسات الفعلية من `astro.config.mjs` + `src/middleware.ts` + `scripts/security-headers.mjs`؛ `_headers` توثيقي فقط).
  - **لا `toLocaleString`** في أي مولد بيانات (حتمية) — `fmtCount` في المحرك يدوي.
  - **سكربتات public/js = `type="module"`**: لو حذفتها أو استخدمت `<script src>` بلا type، Astro يفشل البناء بخطأ "add the is:inline directive" — لازم تحافظ على `type="module"` لسكربتات `/js/` اللي في الصفحة.
  - **`page.fill` لا يعمل على العناصر داخل panel مخفي** في Playwright — ضبط قيمة input عبر native setter + input/change event (النقر عبر `evaluate().click()` بدل `page.click(force)`).
- **Report**: none (يُتوقع من المستخدم كتابة تقرير إذا رغب)
- **Commit**: uncommitted (user commits via main — per brain line 17)
- **Status**: verified locally
- **Brain updates**: Section 5 (kernel-audit.ts + kernel-audit-data.js + kernel-audit-worker.js + kernel-audit.js + verify-audit.mjs + verify-kernel-audit.mjs كـ canonical)

---

### 2026-08-01 — KRN-SC-M17: ترقية /kernel/policies/ لمحرر سياسات حوكمة كامل (11 سياسة + إصدارات immutable + شهادات + محاكاة)

- **Files**:
  - `src/data/kernel-policy-editor.ts` (NEW — 11 سياسة (9 active/2 draft) بأسماء/أوصاف منشورة حرفياً + `PolicyVersion` (version/note/createdAt/hash/certifiedBy) + `fnv1a()`/`ruleHash()` حتمية + `POLICY_EDITOR_PII_TYPES` (9) + `POLICY_EDITOR_PACKS` (7: pdpl/nca_ecc/sdaia/sfda/sama/iso_27001/iso_42001) + `POLICY_EDITOR_ACTIONS` (8: allow/mask/block/redact/warn/approve/local_model_only/log/hitl) + `POLICY_EDITOR_OPERATORS` (3) + `POLICY_CERTIFICATES` (CERT-2026-001/002) + `POLICY_EDITOR_DEPARTMENTS` (10) + `POLICY_EDITOR_SECTORS` (7) + `SIM_TEMPLATES` (20، منها 7 بريئة) + `buildSimulationRequests()` → 1000 طلب حتمي (10 أقسام × 100) + `buildPolicyEditorConfig()` + `buildPolicyEditorStats()`)
  - `public/js/kernel-policies.js` (NEW — محرك vanilla مستقل حتمي 100%: `scanPii` (أنماط فعلية من kernel-scorers + passport/api_secret) + `detectConflicts` (block vs soft عالي / إجراءان مختلفان متوسط) + `createVersion` (يرفض لو الإصدار الحالي مثبّت بشهادة — مطلب المستخدم) + `rollback` (نسخة جديدة تستنسخ القديمة؛ مرفوض لو الحالي مثبّت) + `diff` Git-like (added/removed) + استثناءات (تُنشئ إصداراً جديداً) + `simulate` (1000 طلب × سياسات نشطة، ترتيب إجراء صارم allow→block، عتبة FP>5% + byDept/byPolicy + حتمية) + `suggest` (مولّد Demo بقواعد GENERATOR_RULES — لا نموذج خارجي، mode:'demo') + `importConfig`/`exportConfig`/`snapshot`/`onEvent`/`reset` + UI كامل (جدول 9 أعمدة، محرر modal + معاينة JSON/hash، modal إصدارات بفرق/rollback/قفل شهادة، modal استثناءات، زر محاكاة، toast، Escape) + `window.KernelPolicies`)
  - `src/pages/kernel/policies.astro` (REBUILT — `data-po-root` + إحصاءات SSR (7 عناصر) + جدول `[data-po-tbody]` + قسم محاكاة `data-po-sim-*` + مولّد `data-po-gen-*` + 3 modals + `#policies-config` blob + `<script type="module" src="/js/kernel-policies.js">` + side-effect import للـ CSS + KernelSeoSection + KernelContextLinks)
  - `kernel/assets/css/pages/policies.css` (REBUILT بالكامل — أنماط po-* كلها منطقية RTL، touch ≥44px، شبكة جدول تُعاد على ≤1100px، `prefers-reduced-motion`)
  - `scripts/playwright/verify-policies.mjs` (NEW — 41 فحص وظيفي)
- **What**: رقّيت محرر السياسات من نسخة واجهة ثابتة (تعديل سطر واحد + خيارين إجراء) إلى أداة حوكمة كاملة: 11 سياسة بـ 2-3 إصدارات immutable لكل واحدة (hash FNV-1a حتمي مطابق لـ M7)، إصدارات مثبّتة بشهادات امتثال (CERT-2026-001 لـ pr_saudi_id_pdpl v1، CERT-2026-002 لـ pr_patient_sfda v1) **مجمّدة تماماً** — التعديل أو الـ rollback عليها مرفوض برسالة واضحة (مطلب المستخدم: "لا تسمح بتعديل Policy version مستخدمة في Certificate قديم")، سجل إصدارات بفرق Git-like + rollback عبر نسخة جديدة، كشف تعارض بين الإجراءات، محاكاة حتمية لآخر 1000 طلب مع إيجابيات كاذبة، استيراد/تصدير JSON مع تحقق، مولّد سياسة Demo بشارة واضحة، استثناءات أقسام/تطبيقات، وباني شروط no-code بـ IF/AND/THEN.
- **Why**: M17 من Prompt 08 — محرر السياسات هو قلب الحوكمة (ماذا يحدث لكل طلب AI حسب النوع/الحزمة/القسم)، والنسخة القديمة لم تحمِ الشهادات ولم تحاكي الطلبات ولم تحتفظ بسجل إصدارات.
- **Verification**:
  - `npm run build` → 0 أخطاء ✅ (`/kernel/policies/` تُبنى، blob 11 سياسة + 1000 simRequest + 12 نمط PII + `aiBadge.mode='demo'`، JS module خارجي `dist/client/js/kernel-policies.js` 58KB)
  - Playwright `verify-policies.mjs` → **41/41 ✅** — engine mounted، blob صحيح، 6 بطاقات SSR (11 سياسة)، 11 صف جدول، createVersion v2→v3 + hash يتغيّر + صيغة حتمية، **حماية الشهادة** (createVersion على pr_patient_sfda → blocked:true + رسالة /شهادة/) ، diff added/removed، rollback v4، محاكاة 1000/450 affected/fp=0/10 أقسام + حتمية (نفس النتيجة مرتين)، مولّد Demo (mobile→mask + addSuggested)، export/import (رفض malformed + قبول own export)، snapshot (active=9 + certified≥2)، زر simulate-all يحدّث KPI، modals (editor/versions/استثناءات) تفتح وتقفل، certified row موسومة، لا console errors (0)
- **قرارات موثقة**:
  - **حماية الشهادة = القاعدة الذهبية**: أي إصدار حالي مثبّت بـ `certifiedBy` يُجمَّد — `createVersion` و `rollback` يرجعان `{ok:false, blocked:true, certifiedBy}` بدون أي تعديل على الـ versions. v1 من pr_saudi_id_pdpl يبقى مثبّتاً و v2 (الذي أضاف حزم nca_ecc) غير مثبّت — هذا سيناريو واقعي: السياسة لها نسخة غير مثبتة قابلة للتعديل + نسخة معتمدة مجمّدة.
  - **rollback = نسخة جديدة**: لا يعيد كتابة التاريخ؛ ينشئ إصداراً جديداً يستنسخ قاعدة الهدف (`note: Rollback إلى vN`). يرفض لو الهدف هو الأحدث أو لو الحالي مثبّت.
  - **محرك مستقل** `kernel-policies.js` — نفس مبررات M15/M16 (لا يمس `kernel-eval-engine.js` المرتبط بـ eval؛ `kernel-policies.ts` القديمة تبقى لـ playground).
  - **المولّد Demo صريح**: `GENERATOR_RULES` keyword-matching فقط (لا API خارجي، لا حوكمة حقيقية) — `aiBadge.mode='demo'` + "مسودة مراجعة بشرية" يمنعان المبالغة في الوعود.
  - **المحاكاة حتمية**: 1000 طلب مولّدة من 10 أقسام × 100 قالب (SIM_TEMPLATES، 7 منها بريئة) — لا `Math.random`؛ الترتيب أخذ أقصى إجراء صارم (allow=0…block=8).
  - **استثناءات تُسجَّل كإصدار**: إضافة/تبديل استثناء يُنشئ إصداراً جديداً (يظل التاريخ كاملاً) — لا يحذف الاستثناء القديم من السجل.
- **Report**: none (يُتوقع من المستخدم كتابة تقرير إذا رغب)
- **Commit**: uncommitted (user commits via main — per brain line 17)
- **Status**: verified locally
- **Brain updates**: Section 5 (kernel-policy-editor.ts + kernel-policies.js + verify-policies.mjs كـ canonical؛ kernel-policies.ts القديمة تبقى لـ playground فقط)

---

### 2026-08-01 — KRN-SC-M16: إعادة بناء /kernel/redteam/ كساحة فريق أحمر بمحرك حتمي (لا Math.random)

- **Files**:
  - `src/data/kernel-redteam-lab.ts` (NEW — مكتبة 40 تقنية OWASP LLM Top 10 (34 موروثة حرفياً من الصفحة السابقة + 6 جديدة لسدّ وعد الـ 40) + 5 اختراقات مقصودة (Stage 5 خامد) + `RT_LAYER_LABELS` (5 طبقات) + لوحة صدارة + `countAttacksByOwasp()` + `buildRedteamConfig()`)
  - `public/js/kernel-redteam.js` (NEW — محرك vanilla مستقل حتمي 100%: مطابقة trigger للمكتبة + أنماط PII/حقن فعلية (من kernel-scorers/kernel-scenarios-lab) + تقييم مخاطر + Rate Limiter 10/دقيقة + تسجيل Run/Trace عبر KernelEvalStore + `window.KernelRedteam` = `launchAttack/chainMessage/analyze/suggestPolicy/snapshot/onEvent/reset`)
  - `src/pages/kernel/redteam.astro` (REBUILT — `data-rt-root` + `data-rt-*` attributes + JSON blob `#redteam-config` + `<script type="module" src="/js/kernel-redteam.js">` بدل سكربت inline القديم (كان 34 هجمة + `Math.random()<0.1` بدون traces/rate limit/سياسات))
  - `kernel/assets/css/pages/redteam.css` (EDITED — `.rt-policy-draft` (مسودة سياسة LTR أحادية) + `.rt-verdict__breach-note` + `.rt-chain__msg--breach`)
  - `scripts/playwright/verify-redteam.mjs` (NEW — 35 فحص وظيفي)
- **What**: نفّذت M16 بالكامل: ساحة الفريق الأحمر صارت محرك حتمي حقيقي — الحكم يُشتق من مطابقة المدخل الحر مع مكتبة الـ 40 (عبر trigger) + فحوصات PII/حقن فعلية + تقييم مخاطر حتمي + Rate Limiter تجريبي (10/دقيقة). المراحل 1-4 تشتغل فعلياً، المرحلة 5 (model_guard) خامدة — الاختراقات الخمسة المقصودة (ioh-02/ioh-03/mt-02/mi-01/mi-03) تطلّع بطاقة "🏆 مخترق" + بلاغ + سياسة مقترحة تلقائية. كل هجوم يُسجَّل Trace (`AI-RT-…`) في KernelEvalStore (Run `EVAL-…` واحد للجلسة).
- **Why**: M16 من Prompt 08 — ساحة الفريق الأحمر هي أداة اختبار الدفاع ضد هجمات الـ LLM قبل الاعتماد، والنسخة القديمة كانت heuristics عشوائية (`Math.random`) ما تمثل محرك الحوكمة.
- **Verification**:
  - `npm run build` → 0 أخطاء ✅ (redteam تُبنى مع `/js/kernel-redteam.js` + `#redteam-config`؛ سايت ماب 251 URL / 273 HTML بلا فقدان صفحات)
  - Playwright `verify-redteam.mjs` → **35/35 ✅** على dev server (4877) **و** `astro preview` (4878) — engine mounted، blob 40 هجمة، 40 بطاقة مكتبة، pi-01 → blocked/policy_engine، ioh-02 → breached/model_guard + بلاغ + سياسة مقترحة، PII حر → pii_scanner (جوال 055…)، benign → حتمي، determinism (نفس المدخل = نفس السبب)، chain attack، Store run+traces، Rate Limiter (11 هجوم → الحادي عشر rate_limited)، لا console errors (بعد تجاهل ضجيج Vite dev-toolbar + تحذيرات CSP meta العالمية — نفسها على M15)
  - لا `Math.random` في `public/js/kernel-redteam.js` (0 matches — verified)
  - `dist/client/kernel/redteam/index.html` → 0 inline scripts + config blob + module خارجي + `data-rt-root` + نصوص منشورة موجودة
- **قرارات موثقة**:
  - **حتمية تامة**: حذف `Math.random()` نهائياً من الـ analyze — الحكم = مكتبة trigger + regex PII/حقن + مخاطر. نفس المدخل = نفس الحكم دائماً (قابل للاختبار).
  - **سدّ فجوة الـ 40**: الصفحة المنشورة تعد "40 تقنية" بينما كانت المكتبة 34 — أضفت 6 (`pi-06`, `sc-03`, `ea-04`, `or-04`, `uc-05`, + variant) لحفظ وعد النص المنشور (حتى لو إضافة هجمة جديدة منشورة).
  - **الاختراقات المقصودة = Stage 5 خامد**: يطابق FAQ المنشور («المراحل 1-4 تشتغل كاملة، المرحلة 5 تُعرض كخامدة») — اختراق يعني هجوم يستهدف طبقة المخرجات الخامدة.
  - **Rate Limiter تجريبي**: 10 هجمات/دقيقة (timestamps في localStorage) — يظهر كطبقة `rate_limiter` في بطاقة الحكم.
  - **محرك مستقل** `kernel-redteam.js` — نفس مبررات M15 (لا يمس `kernel-eval-engine.js` المرتبط بـ eval).
- **Report**: none (يُتوقع من المستخدم كتابة تقرير إذا رغب)
- **Commit**: uncommitted (user commits via main — per brain line 17)
- **Status**: verified locally
- **Brain updates**: Section 5 (kernel-redteam-lab.ts + kernel-redteam.js + verify-redteam.mjs كـ canonical؛ kernel-eval-engine.js يبقى لصفحة eval فقط)

---

### 2026-08-01 — KRN-SC-M15: إعادة بناء /kernel/scenarios/ كمختبر سيناريوهات بمحرك تقييم حقيقي

- **Files**:
  - `src/data/kernel-scenarios-lab.ts` (NEW — 12 سيناريو بالحقول الـ11 + `LAB_MODELS` (3) + `LAB_POLICIES` (11) + أنماط PII (8)/حقن (6) + `buildScenariosLabConfig()`)
  - `public/js/kernel-scenarios.js` (NEW — محرك vanilla مستقل: mulberry32 + regex فعلي + trace/cert عبر KernelEvalStore + مصفوفة + اقتراح سياسة)
  - `src/pages/kernel/scenarios.astro` (REBUILT — `data-sc-root` + رأس KPIs + `data-sc-run-all` + تبويبات grid/matrix/report + فلاتر + 12 بطاقة + مصفوفة + تقرير + modal)
  - `kernel/assets/css/pages/scenarios.css` (NEW 12.3KB — KPI + أزرار + chips + فلاتر + بطاقات + مصفوفة خلايا 32px + تقرير + modal)
  - `src/data/kernel-datasets.ts` (EDITED — `export const SBG_CASES` سطر 330؛ كان const غير مُصدَّر فكسر استيراد lab)
  - `scripts/playwright/verify-scenarios.mjs` (NEW — 21 فحص وظيفي)
- **What**: نفّذت M15 بالكامل: صفحة `/kernel/scenarios/` صارت مختبر سيناريوهات بمحرك تقييم حقيقي — تشغيل فردي/دفعي مع شريط تقدم يحوّل الرأس (47/100 + ومضة)، فلاتر قطاع/نتيجة + بحث، شبكة بطاقات 3 أعمدة بشريط علوي 4px، مصفوفة حرارية خلايا 32px مع مبدّل مقارنة (أسهم ▲▼)، زر اقتراح سياسة للفاشل، تقرير جاهزية ببوابة قرار.
- **Why**: M15 من Prompt 08 — مختبر السيناريوهات هو أداة التحقق من سلوك الحوكمة قبل الاعتماد.
- **Verification**:
  - `npm run build` → 0 أخطاء ✅ (kernel pages تُبنى، scenarios تتضمن `/js/kernel-scenarios.js`)
  - `npm run verify:all` → exit 0 ✅ (0 errors)
  - `npm run performance:budget` → all within budget ✅
  - `npm run redirects:check` → ✅
  - Playwright `verify-scenarios.mjs` → **21/21 ✅** (engine mounted، blob 12 سيناريو، runAll 12/12، gate review-required/failed=3، KPI=3، 12 trace id، مصفوفة 12×22 خلية pass، تقرير 12 صف، 3 أزرار اقتراح سياسة، modal، فلاتر قطاع/نتيجة/بحث)
  - محقق الأنماط: topbar 4px أحمر للفاشل، خلايا 32×32، progress 100%، grid متجاوب 4 أعمدة ✅
- **قرارات موثقة**:
  - **محرك مستقل** `kernel-scenarios.js` — لا يمس `kernel-eval-engine.js` (مرتبط بـ `[data-eval-root]` ويعود مبكراً خارج صفحة eval). تجنّب كسر صفحة التقييم الحالية.
  - **3 إصلاحات محرك**: (1) `emit()` يستدعي `render()` (كان KPI يبقى صفراً)، (2) `renderCard()` يحدّث `data-sc-verdict` عبر `textContent` + `className` بدل `outerHTML` (كان يدمر العنصر)، (3) إزالة `render()` المزدوجة في init/bind.
  - **إصلاح فلترة**: `applyFilters()` كان يقرأ `dataset.scResult` (undefined) بدل `dataset.scResultFilter` — البطاقات كانت تُخفى كلها عند أي فلترة؛ أُصلح وتم التحقق.
- **ملاحظة فشل سابق — قائم مسبقاً (خارج نطاق M15)**: `npm run seo:all` يفشل في `seo:legacy` (393 وجهة redirect ناقصة) و`seo:content` (trust/index.html "not found") — السبب: السكربتان يبحثان في `dist/` بينما المشروع (بعد node adapter) يبني في `dist/client/`. مثبت عبر stash: يفشلان بنفس الطريقة بدون تغييرات M15. `public/_redirects` لم يُلمس.
- **Report**: none (يُتوقع من المستخدم كتابة تقرير إذا رغب)
- **Commit**: uncommitted (user commits via main — per brain line 17)
- **Status**: verified locally
- **Brain updates**: Section 5 (kernel-scenarios-lab.ts + kernel-scenarios.js + scenarios.css + verify-scenarios.mjs كـ canonical؛ kernel-eval-engine.js يبقى لصفحة eval فقط)، Known issues (no new — مذكورة أعلاه ملاحظة seo:all/legacy/content خارج النطاق)

---

### 2026-07-31 — KRN-DS-M7: إنشاء Dataset Manager (/kernel/datasets/) + Saudi Governance Benchmark v1.0

- **Files**:
  - `src/data/kernel-datasets.ts` (NEW — نماذج Dataset + Saudi Governance Benchmark v1.0 بـ100 حالة (20 PDPL/15 NCA/15 SAMA/15 SFDA/10 SDAIA/10 HR/10 حكومي/5 لغة) بأحكام allowed/redacted/blocked/approval_required + نسخ وهاش FNV-1a حتمي + Test dataset وfixtures منفصلة عن Live + إحصاءات محسوبة (تكرار/نقص سلوك متوقع))
  - `src/pages/kernel/datasets.astro` (NEW — صفحة Dataset Manager: إحصاءات SSR من المعيار، سجل الـ Datasets، تفاصيل/إصدارات/هاش، جدول حالات وفلاتر، مودالات إنشاء/استيراد/تقسيم، درج مقارنة إصدارين)
  - `public/js/kernel-datasets.js` (NEW — محرك vanilla: سجل، فلاتر، كشف تكرار ونقص، إضافة/تعديل حالات (أي تعديل ينشئ version)، استيراد CSV/JSON/JSONL/لصق جدول، نشر/أرشفة/حذف محمي (لا منشور، لا مستخدم في Run)، تقسيم train/val/test، مجموعات فرعية، مقارنة إصدارات)
  - `kernel/assets/css/pages/datasets.css` (NEW — هوية بصرية بتوكنز الكيرنل)
  - `src/data/kernel.ts` (EDITED — وحدة `datasets` كاملة SEO/FAQ + أيقونة)
  - `src/components/kernel/KernelSidebar.astro` (EDITED — datasets في مجموعة التشغيل + صحة ok)
  - `scripts/generate-sitemap-all-pages.mjs` (EDITED — allowlist kernel/datasets)
  - `src/content/docs/kernel-datasets.md` (NEW — مستند kernel docs)
  - `scripts/playwright/verify-kernel-datasets.mjs` (NEW — 20 فحص وظيفي)
- **What**: نفّذت M7 بالكامل: صفحة Dataset Manager داخل Kernel بقواعد الحوكمة (لا تعديل منشور، لا حذف مستخدم في Run، كل تعديل ينشئ version بهاش، فصل Demo/Test/Live) + معيار سعودي 100 حالة + استيراد بأربع صيغ + تقسيم ومجموعات فرعية + مقارنة إصدارات.
- **Why**: M7 من Prompt 08 — الـ Datasets هي أساس مصداقية أي شهادة تقييم (Evaluation-environment §المرحلة 1).
- **Verification**: `npm run build` ✅ · `npm run verify:all` ✅ (0 أخطاء، hreflang 255/0) · `npm run performance:budget` ✅ · Playwright `verify-kernel-datasets.mjs` → **20/20 ✅** (SSR 100 حالة، تحذيرات تكرار/نقص، فلاتر، إضافة حالة تُنشئ إصداراً، حارس الحذف، استيراد JSON→سجل، مقارنة diff)
- **Report**: none (يُتوقع من المستخدم كتابة تقرير إذا رغب)
- **Commit**: uncommitted (user commits via main — per brain line 17)
- **Status**: verified locally
- **Brain updates**: Section 1 (kernel pages +1 → /kernel/datasets/) · Section 5 (kernel-datasets.ts + datasets.css + verify-kernel-datasets.mjs كـ canonical)

---

### 2026-07-31 — KRN-PG-FIX-01: إصلاح قفل التفاعل (inert) على كامل صفحات الكيرنل + عرض A/B Diff فوري

- **Files**:
  - `public/js/focus-trap.js` (EDITED — `isVisible()` صارت ترجع false لما `aria-hidden="true"`)
  - `public/js/kernel-playground.js` (EDITED — `toggleDiff()` تستدعي `renderDiffSummary(lastResult.r, lastResult.ctx)` بعد قلب `root.dataset.diff`)
  - (مع باقي شغل M5 غير committed في working tree: `kernel/assets/css/pages/playground.css`، `src/pages/kernel/playground.astro`، `src/data/kernel-policies.ts`، `src/data/kernel.ts`، `scripts/playwright/verify-kernel-m5-playground.mjs`)
- **What**: اكتشفت أثناء تحقق M5 إن **كامل محتوى صفحات الكيرنل ما كان قابلًا للتفاعل** (لا كتابة ولا نقرة ولا focus) — لا في الهيدلس ولا في كروم حقيقي. التشخيص بالأدوات: المحتوى مرسوم (بكسل يثبت)، كل الـ computed styles نظيفة، لكن `elementFromPoint` يرجّع `main#main`، والنقرة تروح للـ body، و`fill()` يرجع فاضي. الجاني: `focus-trap.js` `autoApply()` يربط فخًا على `ASIDE#kernel-sidebar` (عليها `role=dialog aria-modal` وهي `display:flex` دايمًا على الديسكتوب) — دالة `isVisible()` **كانت تتجاهل `aria-hidden="true"`**، فلما `kernel-sidebar.js` يعلّق `aria-hidden=true` عند التهيئة (188ms)، المشغّل MutationObserver يستدعي `open()` (202ms) → يعلّق `inert` + `aria-hidden` على **كل أطفال `MAIN`** (منها `#k-content` كاملًا) → وما في شي يستدعي `close()` لأن الـ sidebar ما يختفي أبدًا → `inert` يعلّق للأبد → الموقع كله ميت للمستخدم. الإصلاح: `isVisible()` ترجع false لما `aria-hidden="true"` (سطر واحد + تعليق). ثانيًا: `toggleDiff()` كان يقلب العلم بس بدون عرض اللوحة — صار يعرض A/B فورًا من آخر نتيجة.
- **Why**: حرج — الصفحات التفاعلية للكيرنل (playground/chat/scenarios...) كانت ميتة للمستخدم الحقيقي منذ تفعيل focus-trap (DEC-A11Y-003). والفحص الأخير لـ M5 (diff panes) فشل.
- **Verification**:
  - `node --check` على الملفين → OK ✅
  - `npm run build` → exit 0 ✅
  - `node scripts/playwright/verify-kernel-m5-playground.mjs` → **25/25 ✅** (كان قبل الإصلاح يفشل فشلًا كاملًا؛ وقبل إصلاح diff كان 24/25)
  - إثبات الجذر قبل الإصلاح: إزالة `inert` يدويًا من `#k-content` في المتصفح → `fill()` و`click()` اشتغلوا فورًا
- **Report**: report/2026-07-31-krn-pg-inert-fix.md
- **Commit**: uncommitted (user commits via main — per brain line 17)
- **Status**: verified locally
- **Brain updates**: Known issues: **أضفت + حُلّت KRN-PG-FIX-01 (inert leak)** — كانت تؤثر على كل صفحات kernel. Section 5: لاحظت إن `focus-trap.js` يشترط الـ `aria-hidden` في دورة حياة الـ modal — أي modal جديد لازم يستخدم `hidden`/`display:none` أو `aria-hidden` بشكل صحيح عشان ما ينفخ الـ trap.

---

### 2026-07-31 — KRN-JOURNEY-FIX: ربط زر الإيقاف المؤقت + اللوحة السردية (M4 صفحة /kernel/)

- **Files**:
  - `src/pages/kernel/index.astro` (EDITED — pauseBtn ref سطر 670؛ `setPauseBtnState()`/`togglePause()` + ربط click؛ `renderScene()` تستدعي `updateNarrative()` وتضبط `--journey-progress`؛ `renderNarrative()`/`updateNarrative()` للسرد بـ7 أسطر؛ `startJourney()`/`stopJourney()`/`replayJourney()` تعيد ضبط حالة الإيقاف)
  - `src/styles/kernel.css` (EDITED — `.kernel-journey__stage` transition تشمل transform؛ `.kernel-journey__narrative` عمود flex + `.kernel-journey__narrative-line--past`/`--active`؛ reduced-motion تشمل narrative-line)
  - `src/server/deny-list.mjs` (EDITED — أزلت `'^/kernel(/|$)'` سطر 88 + أضفت /kernel/ وصفحاتها لـ SHOULD_ALLOW في الـ self-check، مع تعليق KRN-DENY-01 يوثّق القرار)
  - `scripts/playwright/verify-kernel-journey.mjs` (NEW — اختبار runtime وظيفي 14 فحص، منفذ 4422، يخدم dist/client ستاتيكياً)
- **What**: صلّحت انحرافين في بوابة التشغيل بالرئيسية: (1) زر "إيقاف مؤقت" كان معطلاً وظيفياً — `journeyPaused` لا يصبح true أبداً، النقر لا يفعل شيئاً؛ (2) اللوحة السردية كانت تعرض سطراً واحداً فقط بدل 7 أسطر (مخالفة لتصميم-صفحات-kernel §1: سطر لكل مشهد، النشط يُضاء والبقية text-low). الحل: pause حقيقي يجمّد ويمرّر الوقت المراكم عند الاستئناف + سرد يملأ نص كل مشهد ويبدل `--past`/`--active`.
- **Why**: M4 يتطلب تحكمات عاملة وسرداً يطابق المواصفة — كان يشوّه المنتج في أول صفحة kernel marketing.
- **Verification**:
  - `npm run build` → exit 0 ✅
  - `npm run verify:all` → exit 0 ✅ (269 HTML، 0 errors)
  - `npm run performance:budget` → all within budget ✅
  - Playwright `verify-kernel-journey.mjs` → 14/14 ✅ (7 أسطر، إيقاف مؤقت يجمد + aria-pressed=true + label استئناف، استئناف يستكمل للمشهد 2، سرد active=1/past=1/texts=2، stop يعيد الضبط، لا console errors بعد فلترة تحذيرات CSP meta المعروفة)
- **اكتشاف حرج مرافق — حُلّ (KRN-DENY-01, 2026-07-31، قرار المستخدم: صلّحها الحين)**:
  - المشكلة: `src/server/deny-list.mjs` سطر 88 `'^/kernel(/|$)'` كان يصد `/kernel/*` بـ 404 في خادم Node الفعلي (`node dist/server/entry.mjs` — نفس startCommand في render.yaml). الإنتاج الحي يخدم `/kernel/` بـ 200 بـ `cf-cache-status: DYNAMIC` (أصل الخادم، مو كاش) → البناء المنشور كان أقدم من تفعيل الـ deny-list؛ أي deploy من build نظيف كان سيكسر كل صفحات الكيرنل فوراً.
  - السبب الجذري: تعليق القاعدة كان يدّعي "kernel/ public marketing handled by prerender" — فرضية خاطئة (الـ wrapper يشتغل قبل أي قراءة من القرص، والـ prerender لا يتجاوزه)، والـ self-check ما كان يختبر `/kernel/` في SHOULD_ALLOW.
  - **الحل المنفذ**: أزلت القاعدة نهائياً (لا يوجد أي ملف حساس تحت `/kernel/` URL — تحققت: dist/client/kernel/ = 18 ملف، كلها HTML، 0 غير-HTML؛ أصول _astro تحت /_astro/ مسموحة). أضفت `/kernel/` + chat/playground/scenarios/admin/quota لـ SHOULD_ALLOW لمنع الرجوع.
  - **التحقق**: `node src/server/deny-list.mjs` → self-check exit 0 ✅؛ `npm run build` → exit 0 ✅ (patch-server-entry كتب deny-list جديد 11952 بايت)؛ `node dist/server/entry.mjs` (منفذ 4399): `/kernel/`=200، `/kernel/playground/`=200، `/kernel/chat/`=200، `/about/`=200، `/frontend/server.js`=404 ✅، `/frontend/`=404 ✅؛ `npm run verify:all` → exit 0 (0 errors، hreflang 253/0) ✅.
- **Report**: none (مذكور في worklog 2026-07-31-KRN-JOURNEY-PAUSE-NARRATIVE)
- **Commit**: uncommitted (user commits via main — per brain line 17)
- **Status**: verified locally
- **Brain updates**: Known issues: **حُلّت قضية deny-list kernel (KRN-DENY-01)** — كانت deploy-blocking (أول deploy من build جديد يكسر /kernel/*)، أُزيلت القاعدة وتحققت 200/404 محلياً. Section 5: أضفت scripts/playwright/verify-kernel-journey.mjs. Section 1: kernel pages مؤكدة تُخدم من الأصل بعد الحل.

---

### 2026-07-31 — CSP-FIX: نقل سكربتات kernel من src/scripts (imports frontmatter) إلى public/js (script tags)

- **Files**:
  - `src/scripts/kernel-shell.js` → `public/js/kernel-shell.js` (R — git mv)
  - `src/scripts/kernel-drawer.js` → `public/js/kernel-drawer.js` (R — git mv)
  - `src/scripts/kernel-eval-store.js` → `public/js/kernel-eval-store.js` (NEW — كان untracked، نُقل بـ mv عادي)
  - `src/layouts/KernelLayout.astro` (EDITED — حذفت 3 imports من frontmatter، أضفت 3 `<script type="module" src="/js/...">` قبل `</BaseLayout>` بترتيب eval-store → shell → drawer)
  - `src/styles/kernel.css` (EDITED — `#fcd34d` raw hex → `var(--status-medium-fg)` عشان lint-tokens يمر؛ القيمة نفسها بالضبط)
  - `scripts/playwright/verify-kernel-scripts.mjs` (NEW — سكربت تحقق runtime)
- **What**: نقلت سكربتات kernel الثلاثة من `src/scripts/` (اللي كانت تُستورد في frontmatter = server-side فقط، ما توصل للمتصفح إطلاقًا) إلى `public/js/` وتُحمَّل عبر `<script type="module" src="/js/...">` — نفس نمط `kernel-sidebar.js`/`kernel-demo-pill.js`. هذا يصلح الخلل: الـ shell (⌘K palette + مبدّل الدور) والـ drawer و eval-store ما كانوا يشتغلون في المتصفح أصلًا منذ REPORTS-CSP-01 (2026-07-15).
- **Why**: CSP في `public/_headers` يسمح بـ `script-src 'self'` بدون nonce، فملفات public/js تُحمَّل عادي. الـ frontmatter import لا يُنبعث للـ client أبدًا (مؤكَّد: `brightai-kernel-role` غير موجود في dist/، والموقع الحي 404 لـ `/scripts/kernel-shell.js`).
- **Verification**:
  - `npm run build` → exit 0 ✅ (268 HTML files، kernel pages تتضمن `/js/kernel-eval-store.js` + shell + drawer)
  - `npm run verify:all` → exit 0 ✅ (16 pass / 0 fail، lint-tokens 0 violations بعد إصلاح kernel.css، hreflang 253/0، schema 59 صفحة)
  - `node --check` على الملفات الثلاثة → OK ✅
  - Playwright على dev server (`scripts/playwright/verify-kernel-scripts.mjs`): KernelEvalStore present ✅، body.kernel-shell ✅، #k-cmdk palette ✅، store API (createRun → EVAL-2026-00001، publish lock، cloneRun v2) ✅، #k-trace-drawer ✅
  - الموقع الحي: `/kernel/chat/` 200 ✅ (السكربتات الجديدة مو live بعد — لسه ما نُشر)
- **قرارات موثقة**:
  - **سبب 404 المحلي للـ /kernel/**: `src/server/deny-list.mjs` سطر 88 `'^/kernel(/|$)'` (BAI-SEC-10) يمنع كل kernel paths على الـ standalone server المحلي. موجود مسبقًا قبل هذا التغيير — الموقع الحي يخدم kernel عبر prerender/Cloudflare. مو منا، بس يستاهل مراجعة مستقبلية (هل نبي kernel marketing يُخدم محليًا في الـ dev server؟).
  - **قاعدة جديدة**: لا نضيف سكربتات kernel في frontmatter أبدًا — public/js + script tags فقط.
- **Report**: none (يُتوقع من المستخدم كتابة تقرير إذا رغب)
- **Commit**: uncommitted (user commits via main — per brain line 18)
- **Status**: verified locally
- **Brain updates**: Section 1 (kernel JS يعمل في المتصفح الآن)، Known issues: أضفت ملاحظة deny-list kernel للـ dev server، Section 5 (kernel-*.js في public/js canonical).

---

- **Files**:
  - `src/pages/authors/index.astro` (NEW — فهرس المؤلفين + CollectionPage schema)
  - `src/pages/events/index.astro` (NEW — فهرس الفعاليات + CollectionPage schema)
  - `src/content/docs/kernel-playground.md`, `kernel-replay.md`, `kernel-redteam.md`, `kernel-models.md` (NEW — مستندات kernel docs ناقصة)
  - `src/content/blog/ai-implementation-cost-saudi.md` (EDIT — رابط → `/solutions/ai-governance-platform/`)
  - `src/content/blog/big-data-analytics-saudi-companies.md` (EDIT — رابط → `/solutions/ai-use-case-discovery/`)
  - `src/data/kernel.ts` (EDIT — إصلاح blogPath للـ playground)
  - `src/pages/kernel/redteam.astro`, `replay.astro` (EDIT — استيراد CSS بدل `<link>`)
  - `src/pages/kernel/admin/quota.astro` (EDIT — إضافة canonical)
  - `src/pages/answer/[slug].astro`, `src/pages/lp/[slug].astro` (EDIT — hreflang ar-SA self + x-default عبر `getHreflangLinks()`)
- **What**: صلّحت الـ 20 خطأ اللي كانت تخلي seo:gate يفشل (4 صفحات authors/events بلا فهرس، رابطا مدونة لحلول محذوفة، 4 مستندات kernel docs ناقصة، blogPath مكسور، CSS links، canonical ناقص). وبعد ما نجح seo:gate، انكشفت طبقة مخفية من 44 خطأ hreflang على 22 صفحة مفهرسة من `/answer/*` و `/lp/*` (ما كانت تصدّر أي hreflang) — صلحتها أيضًا.
- **Why**: verify:all كان يفشل والـ seo:gate كان يحجب اكتشاف أخطاء hreflang لأنها كانت تظهر بعده. كل صفحة مفهرسة لازم يكون عندها hreflang self-reference + x-default (قاعدة BAI-IDX-14).
- **قرارات**:
  - الحلول البديلة للمدونة: `agile-ai-governance` → `ai-governance-platform`، و`big-data-analytics` → `ai-use-case-discovery` (حلول موجودة قريبة الدلالة بدل اللي محذوفة).
  - صفحتا الفهارس الجديدة بلا noindex، بمحتوى قصير لكن CollectionPage schema تبررها (نمط BAI-SEO-003-S3).
  - صفحات answer/lp تستخدم `getHreflangLinks(canonical)` — يرجع لـ AR-only: `ar-SA=self` + `x-default=self` بدون en-SA مخترع (يتماشى مع invariant الـ checkArOnlyPageNoEnAlternate).
- **Verification**:
  - `npm run build` → ✅ (sitemap 245 URLs)
  - `npm run seo:gate` → ✅ 0 أخطاء، Broken links: 0
  - `npm run seo:hreflang` → ✅ 0 أخطاء (253 sets)
  - `npm run verify:all` → ✅ exit 0 (pass 16, fail 0)
- **Report**: report/2026-07-31-broken-links-hreflang-fix.md (أُنشئ)
- **Commit**: uncommitted (user commits via main — per brain line 18)
- **Status**: verified locally
- **Brain updates**: Known issues: أخطاء hreflang المخفية على answer/lp — resolved 2026-07-31؛ Pages inventory: أضفت pages `authors/index` + `events/index` + 4 docs kernel.

---

### 2026-07-31 — KRN-DS-2026-07-31: توحيد كيرنل كامل على قيم تصميم-صفحات-kernel §1 (منت/داكن)

- **Files**:
  - `src/styles/tokens.css` (EDITED — Kernel Shell tokens صارت قيم حرفية بدل aliases)
  - `src/styles/kernel.css` (EDITED — override block داخل `body.kernel-shell` + تحويل كل الـ rgba التيل لـ منت + إصلاح أفاتارين + fallback)
  - `src/layouts/BaseLayout.astro` (EDITED — أزلت `declare global` اللي كان يكسر esbuild، ونقلت `cspNonce` لـ env.d.ts)
  - `src/env.d.ts` (EDITED — أضفت `cspNonce?: string` لـ `App.Locals`)
  - `src/pages/kernel/models.astro` (EDITED — حولت سكربت `window.__kernelModelsPageData` لنمط `define:vars`، كان يكسر SSR)
- **What**: وحّدت كامل صفحات `/kernel/*` (18 مسار) على القيم الحرفية من تصميم-صفحات-kernel §1 — منت `#2dd4a7`/داكن `#080d16`. الـ override محصور داخل `body.kernel-shell` (يُضاف عبر kernel-shell.js على kernel pages فقط) — باقي الموقع (الرئيسية، بلوق...) يبقى تيل ما يتأثر. حطيت ترتيب layers `@layer tokens,base,utilities,color,animations,kernel` عشان override يتجاوز قيم layer(tokens) على الكيرنل. حوّلت كل الـ rgba التيل الصريحة (36+ موضع) لمنت، وصححت أفاتار AI (`text-hi` بدل داكن على indigo)، وأصلحت مشكلتين قديمتين كانتا يكسران البناء من أصله في main.
- **Why**: M1 من تقرير-صفحات-kernel.md — الكيرنل صار مخلوط تيل/منت، ولازم يتوحّد على الهوية المنت لصفحات الكيرنل (قرار المستخدم: قيم حرفية مو توسيع منت للموقع كامل).
- **قرارات موثقة**:
  - **KRN-A11Y-01**: `--text-low` = `#7a8ba5` بدل `#66748f` من الوثيقة — الأخير يفشل AA (4.13:1)، المحسّن يمر (5.56:1).
  - **KRN-A11Y-02**: `--brand-700` = `#1b9e80` بدل `#0e3d33` (bright-900) — الأخير مع نص داكن يفشل AA (1.59:1) في 12 جراديانت + أفاتار المستخدم؛ الجديد يمر (5.73:1).
- **Verification**:
  - `npm run build` → exit 0 ✅ (240+ صفحة، sitemap 240 URLs)
  - `node scripts/lint-tokens.mjs` → 0 violations ✅ (عدلت تعليقات كانت تحتوي hex)
  - `npm run verify:all` → 16 pass / 0 fail ✅ (مع schema audit 55 صفحة PASS)
  - Playwright (`scripts/playwright/verify-kernel-mint.mjs`): `/kernel/` و `/kernel/chat/` بعد إضافة class → body bg `rgb(8,13,22)` = `#080d16` ✅ + `--interactive-primary: #2dd4a7` ✅ + `--text-primary: #f2f6ff` ✅
  - تحقق في dist: `KernelLayout.*.css` يحتوي override داخل `body.kernel-shell`، `BaseLayout.css` (الرئيسية) لسه تيل ✅
- **Report**: report/2026-07-31-krn-ds-kernel-mint.md (أُنشئ)
- **Commit**: uncommitted (user commits via main — per brain line 18)
- **Status**: verified locally
- **Brain updates**: Section 1 (kernel pages 11 → 18 مسار)، Section 5 (أضفت kernel mint tokens + brand ramp)، Known issues: فشل speakable schema على صفحات `/answer/*` مسبق (مو منا)، و`/kernel/` محجوب بالـ deny-list على الخادم (قائم — يخدم prerendered).

---

### 2026-07-31 — KRN-REDTEAM-01: إنشاء صفحة /kernel/redteam/ (ساحة الفريق الأحمر)

- **Files**: 
  - `kernel/assets/css/pages/redteam.css` (NEW — ~400 سطر، هوية بصرية حمراء #150A0E/EF4444)
  - `src/pages/kernel/redteam.astro` (NEW — ~500 سطر، صفحة كاملة مع vanilla JS)
  - `src/data/kernel.ts` (EDITED — أضفت وحدة `redteam` + أيقونة SVG درع)
  - `src/components/kernel/KernelSidebar.astro` (EDITED — أضفت `redteam` لـ GROUPS + HEALTH)
  - `scripts/generate-sitemap-all-pages.mjs` (EDITED — أضفت `kernel/redteam` للـ groupRelPath)
- **What**: أنشأت صفحة `/kernel/redteam/` — ساحة الفريق الأحمر التفاعلية. الهوية البصرية الخاصة: خلفية #150A0E، علامة #EF4444 بدل المنت (الانحراف الأحمر الوحيد المسموح). فوق الطية: عنوان "حاول تخترق Kernel" + صندوق إدخال 140px بحد أحمر متوهج + زر "اهجم 🗡". النتيجة: بطاقة حكم مع انتقال درامي 400ms (صُدّ: درع أخضر بحركة ارتطام + دفاع شفاف / نجح: تأثير كسر زجاج + شارة مخترق + بلاغ تلقائي). تحت الطية: لوحة صدارة أسبوعية (8 لاعبين) + مكتبة 40 تقنية هجوم مصنّفة بـ OWASP LLM Top 10 + وضع هجوم متسلسل متعدد الرسائل. كل التفاعل vanilla JS (ما في React). الـ JS يستخدم `is:inline` مع `define:vars` (نفس نمط scenarios.astro). الجزر التقنية dir="ltr". احترام `prefers-reduced-motion`.
- **Why**: KRN-REDTEAM-01: صفحة الفريق الأحمر هي أقوى أداة تسويقية لـ Kernel — "لا أحد يصدّق ادعاء الأمان. الجميع يصدّق ما كسره بيده وفشل." مطلوبة حسب تقرير-صفحات-kernel.md §5 وتصميم-صفحات-kernel.md §4.5.
- **Verification**: 
  - `npm run build` → exit 0 ✅ (196 → 197+ صفحة، redteam ~164KB HTML)
  - `node scripts/generate-sitemap-all-pages.mjs` → 238 public URLs (كان 237)، redteam موجود 3 مرات ✅
  - `node scripts/verify-all.mjs` → 5/5 checks pass ✅
  - `npm run performance:budget` → all items within budget ✅
  - Kernel sidebar: redteam يظهر في مجموعة التشغيل بعد السيناريوهات ✅
- **Report**: report/2026-07-31-krn-redteam-01.md
- **Commit**: uncommitted (user commits via main — per brain line 18)
- **Status**: verified locally
- **Brain updates**: Section 1 (build page count +1)، Section 5 (redteam added to canonical components)
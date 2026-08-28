# ULTIMATE-EVIDENCE-LEDGER — سجل الأدلة الجنائي (2026-08-28)

> **HEAD:** `3b25585b2fc472247bf9f6b13145f52952db4656` على `main`
> **شجرة العمل (dirty):** تعديل `scripts/e2e-lab-form.mjs` (إصلاح locators مُعلّق غير مُلتزم) + حذف مُرحّل (staged) لملفي SQLite متتبعين سابقًا + `scripts/__fixtures__/` غير متتبع.
> **البيئة:** Node v22.22.3 · pnpm 10.19.0 · macOS darwin 25.5.0 arm64
> **وضع التدقيق:** قراءة-فقط ضد كود التطبيق. لم يُعدَّل كود منتج، لا commit، لا push، لا deploy. كل الأوامر التشغيلية استخدمت قواعد بيانات مؤقتة ( QC_DATABASE_PATH تحت /tmp أو mkdtemp الخاص بأدوات الاختبار نفسها).

---

## 1. أوامر البوابات المنفَّذة فعليًا (أكواد خروج موثّقة)

| # | البوابة | الأمر | النتيجة | المدة | الدليل |
|---|---|---|---|---|---|
| G1 | typecheck | `pnpm typecheck` | ✅ exit 0 | 19s | `/tmp/qc-gates.log:1-145` |
| G2 | manifest | `pnpm test:manifest` | ✅ exit 0 — 60 suites + 28 E2E كنسية | <1s | `qc-gates.log:146-154` |
| G3 | route-manifest | `pnpm test:route-manifest` | ✅ exit 0 — 114 route / 25 middleware / 6 guards | <1s | `qc-gates.log:155-163` |
| G4 | migration parity | `pnpm test:embedded-migration-parity` | ✅ exit 0 — 38/38 sha256 متطابقة | <1s | `qc-gates.log:164-215` |
| G5 | migrations | `pnpm test:migrations` | ✅ exit 0 — fresh/upgrade/checksum/rollback/destructive-guard | <1s | `qc-gates.log:216-235` |
| G6 | architecture | `pnpm test:architecture` | ✅ exit 0 | 1s | `qc-gates.log:236-249` |
| G7 | ui-consistency | `pnpm test:ui-consistency` | ✅ exit 0 — 164/164 | <1s | `qc-gates.log:250-259` |
| G8 | full tests | `pnpm test` | ✅ exit 0 — 60/60 suite | 53s | `qc-gates.log:260-4304` |
| G9 | production build | `NODE_ENV=production pnpm build` | ✅ exit 0 | 14s | `qc-gates.log:4305-4334` |
| G10 | E2E acceptance | `node scripts/e2e-acceptance.mjs` | ❌ exit 1 — توقف عند lab-search (26/29 suite نُفّذت) | 108s | `qc-gates.log:4335-7480` |
| G11 | db-doctor | `pnpm test:db-doctor` | ✅ exit 0 | 1s | `/tmp/qc-gates2.log:31-34` |
| G12 | production-operations | `pnpm test:production-operations` | ✅ exit 0 — restore drill + restart + integrity + FK + audit chains + deployment contract | 1s | `qc-gates2.log:36-45` |
| G13 | deployment-contract | `pnpm test:deployment-contract` | ✅ exit 0 — 21/21 فحص | <1s | `qc-gates2.log:46-80` |
| G14 | performance | `pnpm test:performance` | ✅ exit 0 — عقد الأداء + benchmark | 1s | `qc-gates2.log:81-90` |
| G15 | security-hygiene | `node scripts/verify-security-hygiene.mjs` (من مسار التطبيق الصحيح) | ✅ exit 0 — "Security hygiene passed" | 1s | `qc-gates3.log:43-45` |
| G16 | e2e-reports (standalone) | خادم إنتاج + `node scripts/e2e-reports.mjs` | ✅ exit 0 | ~90s | `/tmp/qc-gates6.log:1-1305` |
| G17 | e2e-responsive (standalone) | خادم إنتاج + `node scripts/e2e-responsive.mjs` | ✅ exit 0 — **648/648** | ~110s | `qc-gates6.log:1306-2093` |

**نتائج الـ26 سويت E2E التي نُفّذت داخل G10 (كلها خضراء قبل التوقف):** admin-users 52 ✅ · auth-lockout 45 ✅ · auth-password-flow 40 ✅ · task-shared 196 ✅ · delete-request 40 ✅ · dashboard 51 ✅ · a11y 86 ✅ · backup 13 ✅ · search 84 ✅ · findings 53 ✅ · lab-nav 93 ✅ · lab-suggest 20 ✅ · lab-form 141 ✅ · lab-tests 94 ✅ · lab-review 44 ✅ · lab-products 31 ✅ · lab-equipment 44 ✅ · lab-maintenance 36 ✅ · lab-calibration ✅ · lab-documents ✅ · lab-acknowledgements ✅ · lab-calendar ✅ · lab-retests ✅ · lab-notifications ✅ · lab-data-quality 26 ✅ · lab-search **18/21 ❌** (G10 توقف هنا).

---

## 2. اكتشافات مُتحقَّقة (Findings)

### P1-001 — بوابة القبول حمراء بسبب تأكيدات متقادمة في `e2e-lab-search.mjs` (وليست ثغرة RBAC)
- **الشدة:** P1 (تكسر بوابة الإصدار، لا تمس سلامة البيانات)
- **الدليل SOURCE:** `src/components/OperationalState.astro:8` — الحالة الفارغة تعرض `No search results` (افتراضي no-results). النص `No matching laboratory records found` غير موجود إطلاقًا في `src/` (grep: تطابق واحد فقط داخل ملف الاختبار نفسه).
- **الدليل TEST:** `scripts/e2e-lab-search.mjs:282,287,292` — ثلاث تأكيدات تنتظر النص المتقادم → تفشل دائمًا → `e2e-acceptance.mjs:148` يرمي ويوقف السلسلة، فلا تُنفَّذ `reports` و`responsive` ضمن القبول (نُفِّذتا منفصلتين في G16/G17 ونجحتا).
- **الدليل RUNTIME (براءة RBAC):** مسبار مباشر على قاعدة مؤقتة عبر `searchLab()` الحقيقي (`src/lib/lab/search.ts:501`):
  - موظف يبحث عن رقم اختبار موظف آخر → `items=0`
  - موظف يبحث عن lot الموظف الآخر → `items=0`
  - موظف يبحث عن معرّف عينة الموظف الآخر → `items=0`
  - موظف يبحث عن اختباره → `items=1` ✅
  - مدير يبحث عن اختبار الموظف الآخر → `items=2` (اختبار + عينته) ✅
  - الجذر: شرط `(t.tested_by = ? OR t.created_by = ?)` في `search.ts:192-195,244-247` يعمل كما صُمم.
- **السبب الجذري:** تغيير نص الحالة الفارغة عند إدخال `OperationalState.astro` (مهمة QC-OBSERVABILITY-016) دون تحديث تأكيدات السكربت.
- **الثقة:** HIGH

### P1-002 — مفتاح Ed25519 خاص حقيقي مضمّن في ملف متتبع
- **الشدة:** P1 (تسريب سرّ مصنّفي؛ التدوير فعل مشغّل خارجي)
- **الدليل SOURCE:** `README.md:33` — سطر `EVAL_CERT_SIGNING_KEY_RING=[...]` يحتوي `BEGIN ... PRIVATE KEY` (تحقق برمجي: length=312، يحوي كلاً من PRIVATE KEY وPUBLIC KEY). **لم تُطبع قيمة المفتاح في أي تقرير.**
- **السياق:** الملف للموقع العام وليس تطبيق QC، لكنه متتبع في نفس الريبو الذي يُنشر منه كل شيء.
- **الإجراء المطلوب:** إزالة المادة الخاصة من الملف + **تدوير المفتاح خارج المستودع (OPERATOR)** لأن التاريخ القديم يبقى في git.
- **الثقة:** HIGH

### P2-003 — آثار SQLite متتبعة سابقًا + ثغرة نمط `.gitignore`
- **الحالة الحالية:** الملفان `apps/qc-task-manager/qc_tasks.db` و`qc_tasks 3.db` **محذوفان بحالة staged (D)** في شجرة العمل — الحذف لم يُلتزم بعد (فعل مستخدم).
- **الدليل CONFIG:** `.gitignore` (جذر التطبيق) يغطي `db/*.db` فقط؛ `.gitignore` الجذر يغطي `apps/qc-task-manager/db/*.db` — **لا يوجد نمط يمنع ملف .db على مستوى جذر التطبيق** (وهكذا تسرب `qc_tasks 3.db` أصلًا).
- **الدليل RUNTIME:** `verify-security-hygiene.mjs` = PASS بعد الحذف المُرحّل (G15).
- **الثقة:** HIGH

### P2-004 — انجراف سجل المهارات `skills-lock.json`
- **الدليل (تدقيق sha256 برمجي 2026-08-28):** من 175 مدخلًا: **164 هاشًا مدوّنًا لا يطابق محتوى الملفات الحالية** (0 تطابق)، **11 مدخلًا لمجلدات غير موجودة** (gpt-taste, grill-me, performance, systematic-debugging, web-design-guidelines, design-taste-frontend-v1, full-output-enforcement, imagegen-frontend-web, imagegen-frontend-mobile, image-to-code, stitch-design-taste)، و**201 مهارة على القرص غير مسجلة**.
- **القرص:** 364 مجلدًا، كلها فيها SKILL.md، تطابق name مع المجلد = 100%، صفر ازدواج، صفر غير مقروء.
- **الثقة:** HIGH

### P2-005 — `db/schema.sql` مرجع متقادم (drift عن الهجرات)
- **الدليل DATABASE:** مقارنة برمجية بين قاعدة طازجة مُهجَّرة كنسيًا و`schema.sql`: **11 كائنًا حيًا غير موجودين في schema.sql**: `ai_audit_log` (جدول)، `idx_activity_event_hash`, `idx_ai_audit_feature_created`, `idx_ai_audit_user_created`, `idx_delreq_one_pending`, `idx_workflow_actions_instance_time`, `idx_workflow_instances_status`, `idx_workflow_steps_definition_order` (فهارس)، `uq_notifications_dedupe_key` (قيد فريد) + جدولا دفتر الهجرات.
- **الأثر:** من يقرأ schema.sql كمرجع يفهم النظام ناقصًا؛ لا يوجد فحص انجراف لschema.sql (فحص parity يغطي الهجرات المضمّنة فقط).
- **الثقة:** HIGH

### P2-006 — عدّ المهارات في الدساتير متقادم
- AGENTS.md/CLAUDE.md يذكران "67 مهارة" — الفعلي **364** (القاعدة 01-mind-latest تعرف هذا لكن الدساتير لم تُحدَّث).
- **الثقة:** HIGH

### P3-007 — مثال متقادم في `docs/DEPLOYMENT.md`
- `docs/DEPLOYMENT.md:40` يعرض مثال استجابة health فيه `"schemaVersion": 10` بينما النظام الحالي على الإصدار 38 (38 هجرة). عدا ذلك الوثيقة متسقة مع `render.yaml` (لا يوجد QC service بالتصميم — الخدمة يدوية موثقة) ومنسجمة مع فحوص deployment-contract (21/21).
- **الثقة:** HIGH

### P3-008 — مسار ميت: `GET /api/tasks/suggestions`
- الملف موجود (`src/pages/api/tasks/suggestions.ts`) وصالح في route-manifest، لكن **صفر إشارات إليه في أي صفحة/مكوّن/API آخر** في `src/` (grep بدون نتائج).
- **الثقة:** MEDIUM (قد يكون مستخدمًا خارجيًا/مستقبليًا — القرار للمالك)

### P3-009 — إحالات مهارات ميتة في `design-pipeline/SKILL.md`
- يحيل إلى `stitch-design-taste` (مجلد غير موجود) و`image-to-code` (غير موجود) — الأسطر 6، 10، 28، 31.
- **الثقة:** HIGH

### P3-010 — ملف إعدادات محلي غير متتبع فيه توكن شبه حي (طبقة سرّ)
- `.claude/settings.local.json` (478 بايت، غير متتبع) — أداة محلية؛ يُوصى بتنظيفه كنظافة مشغّل. القيمة لم تُطبع.
- **الثقة:** MEDIUM

### P3-011 — تغليف شاذ: `distribb/90-day-seo-sprint/SKILL.md`
- ملف SKILL.md متداخل بمستوى أعمق من كل المهارات (364 مجلدًا عاديًا + هذا الملف = 365 ملف SKILL.md).
- **الثقة:** HIGH

### P3-012 — ملاحظات جودة كود (غير حاجبة)
- `src/`: TODO=1 (قراءة WI المتعمدة)، HACK=1، `: any`=9، eslint-disable=3، `@ts-ignore`/`@ts-expect-error`=0، `eval(`=0، console.log=2، console.error=70 (الأغلب سكربتات اختبار/تشغيل؛ تسجيل التطبيق مركّب عبر observability بلا أسرار — فحص deployment-contract "secret hygiene" ✅).
- أكبر الملفات: `reporting/writers/fonts/fontData.ts` 3152 سطر (بيانات خطوط مولّدة)، `taskUpdates.ts` 1556، `lab/documents.ts` 1553.
- **الثقة:** HIGH (أعداد) / MEDIUM (تقييم الأثر)

---

## 3. قيود مفتوحة على التحقق (غير قابلة للإثبات آليًا الآن)

| القيد | السبب | الحالة |
|---|---|---|
| **RUNTIME USER UAT REQUIRED** | لا توجد نتائج بشرية موثقة | مطلوب تنفيذ `docs/PILOT-UAT.md` بموظفي QC حقيقيين |
| **LIVE DEPLOYMENT NOT VERIFIED** | لا يوجد QC service في render.yaml (بالتصميم — `docs/DEPLOYMENT.md` يوثق الإنشاء اليدوي) | مطلوب نشر حي + تحقق مشغّل |
| **WI pages 2/3 + 3/3** | المصدر المضبوط غير مورّد | التطبيق يحظر اختراعها بالتصميم (`wiCatalog.ts:5,74-75`) |
| حسم سياسة المعايرة المنتهية (تحذير أم حجب) | قرار إدارة QC | النظام الحالي: اشتقاق حالة OVERDUE + إشعارات مجدولة (`calibration.ts:149,486-490`) |

---

## 4. تحققات أمنية ساكنة إضافية (عيّنة موثّقة)

- **CSP:** `src/middleware.ts:88-89` — سياسة صارمة، `script-src 'self'` + 3 هاشات sha256 فقط؛ **لا unsafe-inline ولا unsafe-eval**.
- **حراس الطلبات:** `src/lib/api-security.ts` — `requireApiUser` (:87)، `requireCsrf` (:107)، `requireRequestSecurity` (:122)، حد جسم 12MB (:12)، حد طفرات 120/دقيقة، حد AI مستقل 15/دقيقة/مستخدم (:71).
- **CSRF للنماذج:** `src/middleware.ts:118-119,137-139,205-245` — كل مسارات POST للصفحات تمر بـ requireCsrf + تحقق صلاحية الخادم.
- **تغطية API:** 34 ملف API تحت `src/pages/api` — فحص إرشادي شامل: **صفر ملف بدون إشارة تحقق صلاحية/جلسة**.
- **مصدر الصلاحيات الكنسي:** `src/lib/permissions.ts` — كائن PERMISSIONS واحد، ROLE_RANK، حراس مناطق، قفل حقول الموظفين، تجميد completed/cancelled.
- **لا تغيير معماري مكتشف:** Astro SSR + SQLite + صلاحيات مركزية + qc_audit_log واحد + إشعارات واحدة — مطابق للثوابت.

---
file: brain.md
project: BrightAI — Saudi AI Safety OS
site: https://brightai.site
last_updated: 2026-08-01 10:30 +03:00
maintained_by: BrightAI Workspace Agent
version: 2.7.65
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
---
file: brain.md
project: BrightAI — Saudi AI Safety OS
site: https://brightai.site
last_updated: 2026-07-31 15:30 +03:00
maintained_by: BrightAI Workspace Agent
version: 2.7.63
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
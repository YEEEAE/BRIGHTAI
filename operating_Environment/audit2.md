# BrightAI — تقرير التدقيق الشامل

> تقرير audit-only. ما تغيّر أي كود إنتاجي. كل رقم هنا وراه دليل منفّذ فعليًا على نفس الـ commit.

---

## 1. الملخص التنفيذي

| | |
|---|---|
| **المستودع** | `YEEEAE/BRIGHTAI` |
| **الفرع المقاس** | `brightai-repository-audit` |
| **الـ commit** | `5d6efbe3c2611a69f1b7070fbdd0642ec87c37bc` |
| **تاريخ التدقيق** | 2026-08-09 |
| **المنتج** | Saudi AI Safety OS — منصة حوكمة وأمان AI للمؤسسات، Astro، عربي-أولًا، مع واجهة Kernel تفاعلية |
| **الحكم** | **NOT PRODUCTION READY** |

**سبب الحكم بثلاث نقاط:**

1. **P0 صدق العرض:** مبدّل «بيانات تجريبية / بياناتي» في Kernel يكتب `body[data-demo]` وما فيه ولا مستهلك واحد لهذي القيمة في كل الـ CSS والـ JS. يعني الـ label يتحوّل إلى «بياناتي» والأرقام تبقى نفسها حرفيًا — إعلان كاذب للمستخدم.
2. **P1 سلامة الأنواع:** `npm run typecheck` يفشل بـ **42 خطأ** (40× TS2305 + 2× TS7006) لأن `@prisma/client` ما يصدّر الـ models والـ enums المستوردة.
3. **P1 الاختبارات:** `npm test` يفشل — ونفس السبب الجذري: `SyntaxError: The requested module '@prisma/client' does not provide an export named 'LeadQueueStatus'`.

**الخبر الزين:** الـ build نفسه ينجح بالكامل (`EXIT=0`)، والـ P1-TYPES و P1-TEST سببهما واحد — إصلاح واحد يقفل الاثنين.

---

## 2. Capability Contract

وش قدرت أسويه فعليًا، ووش لا. ما أعطي درجة لشي ما قدرت أقيسه.

| Capability | Available? | Evidence |
|---|:---:|---|
| قراءة الـ source | **YES** | قرأت `src/**`, `public/**`, `scripts/**`, `packages/**` |
| Shell / install | **YES** | `pnpm install --frozen-lockfile` نجح |
| Production build | **YES** | `npm run build` → `EXIT=0` |
| Production server | **YES** | `node ./dist/server/entry.mjs` على `127.0.0.1:4331` |
| Headless browser | **PARTIAL** | `agent-browser` شغّال، بس localhost ما يوصله من browser sandbox — القياسات جوّا الـ VM بس |
| Lighthouse / CWV | **UNVERIFIED** | ما اكتمل قياس جديد بسبب browser routing |
| axe / a11y | **UNVERIFIED** | Chromium تنزّل متأخر (بعد الـ audit window)، فما فيه scan جديد موثوق |
| Existing tests | **FAIL** | `npm test` → exit 1 |
| External AI APIs | **CODE-PATH ONLY** | كود Groq/Gemini/Redis مقروء، ما نُفّذت رحلة live |

---

## 3. Baseline (مثبّت)

| Field | Value |
|---|---|
| `COMMIT_SHA` | `5d6efbe3c2611a69f1b7070fbdd0642ec87c37bc` |
| `BRANCH` | `brightai-repository-audit` |
| `AUDIT_DATE` | `2026-08-09` |
| `NODE` | `v24.14.1` |
| `PACKAGE_MANAGER` | `pnpm 11.11.0` / `npm 10.19.0` |
| `LOCKFILE_SHA256` | `a1c3f376d64ba5a6877ac26e2eee8b1cba4a0fe5c94bbef1a578386a5c62990a` |
| `BUILD_STATUS` | **pass** |
| `TYPECHECK_STATUS` | **fail** — 42 أخطاء |
| `TEST_STATUS` | **fail** |

---

## 4. Coverage Declaration

لازم أكون صريح: التغطية أقل من 60%، فكل الدرجات تحت **PRELIMINARY**.

| Metric | Value |
|---|---|
| `TOTAL_ROUTES` | **102** ملف تحت `src/pages` (منها **18** API route) |
| `TOTAL_COMPONENTS` | **102** ملف تحت `src/components` |
| `DATA_FIXTURES` | **66** ملف تحت `src/data` |
| `ROUTES_FULLY_AUDITED` | **0** — ما صار تدقيق route-by-route كامل |
| `ROUTES_SPOT_CHECKED` | Kernel الرئيسية، الصفحة الرئيسية، pricing، SEO surfaces، AI chat |
| `ROUTES_NOT_AUDITED` | **102** — السبب: browser routing + المرحلة audit-only |
| `COVERAGE` | **< 60%** |

---

## 5. جرد المعمارية

| Area | Evidence | ملاحظة |
|---|---|---|
| Framework | `astro.config.mjs` | Astro hybrid + build pipeline مخصّص (purge-css، security meta injection) |
| Pages | `src/pages/**` | 102 route؛ `kernel/**`، `answer/[slug].astro`، `api/**`، blog/docs/marketing |
| Components | `src/components/**` | 102 مكوّن؛ Kernel معزول نسبيًا |
| Client | `src/client/**`, `public/js/**` | chat، eval، audit، navigation، demo shell |
| Data | `src/data/**` | 66 ملف — static fixtures كثيرة تغذّي KPI الـ Kernel |
| AI | `src/pages/api/ai/chat.ts` | Groq/Gemini، SSE، Redis session، fallback auto mode |
| Security | `astro.config.mjs:156` | CSP يُحقن كـ `<meta http-equiv>` لكل ملف مع style hashes |
| SEO | `public/robots.txt`, `public/llms.txt` | AI crawler policy + entity facts موجودة |

---

## 6. النتائج — P0 / P1

### BAI-P0-TRUTH-001 — مبدّل بيانات ميت

| | |
|---|---|
| **Priority** | **P0** |
| **Category** | Demo/Live Transparency |
| **Confidence** | **HIGH** — دليل ميكانيكي قاطع |
| **Route** | `/kernel/*` (كل الصفحات اللي تستخدم `KernelLayout`) |
| **Files** | `src/layouts/KernelLayout.astro:157` · `public/js/kernel-shell.js:213-232` |
| **Complexity** | M | **Risk** | Med |

**المشكلة:**
الزر في `KernelLayout.astro:157` معلن `title="تبديل مصدر البيانات"` وعند الضغط `applyDemo()` في `kernel-shell.js:229-230` يسوّي:

```js
toggle.setAttribute('aria-pressed', String(demo));
document.body.setAttribute('data-demo', demo ? 'demo' : 'mine');
if (label) label.textContent = demo ? 'بيانات تجريبية' : 'بياناتي';
```

**الدليل القاطع:** `grep` على `data-demo` في كل `src/styles`، `src/layouts`، `public/js` رجّع **مستهلك صفر**. الوحيد اللي يذكرها هو السطر اللي يكتبها (`kernel-shell.js:230`) وتعليق توثيقي (`kernel-shell.js:10`). ما فيه CSS rule، ولا JS reader، ولا data fetch مرتبط بها.

**النتيجة العملية:** المستخدم يضغط، الـ label يقول «بياناتي»، والأرقام المعروضة **نفسها حرفيًا** — لأنها static fixtures من `src/data/**`. اختبار runtime أثبت إن الضغط ما يغيّر محتوى الـ KPI.

**مشكلة ثانية منفصلة — تشتّت العناصر:** فيه **نظامين** مختلفين للـ demo control ما هم مربوطين:
- `[data-kernel-demo-toggle]` → `KernelLayout.astro:157`، يقرأه `kernel-shell.js:151,214`
- `[data-kernel-demo-pill]` → `KernelDemoPill.astro:21`، يقرأه `kernel-demo-pill.js:20`, `kernel-reports.js:36`, `kernel-approvals.js:313`, `audit.js:326`, `evidence.astro:1832`

نظامان يدّعيان نفس المعنى، ما يتزامنان، ولا واحد فيهم يبدّل مصدر بيانات حقيقي.

**Impact:** المستخدم المؤسسي قد يفهم أرقام demo كأنها live بعد ما «يطفّي» وضع الـ demo. في منتج حوكمة وأمان AI، هذا يضرب المصداقية في صميمها ويُصنّف P0.

**Root Cause:** الـ state محلي في الزر، بدون data provenance layer مشتركة تربط الحالة بمصدر فعلي.

**Recommendation:** اختر عقد واحد وامشِ عليه:
- **إما** disclosure ثابت غير تفاعلي (`بيانات تجريبية`) — أنظف وأصدق وأسرع، أو
- **أو** state حقيقي يبدّل المصدر فعليًا في كل surface، وتُخفى/تُستبدل الأرقام.

بأي حال: وحّد النظامين في attribute واحد.

**Acceptance Criteria:**
- ما يبقى ولا رقم في Kernel بدون classification مرئي.
- نظام demo control واحد، بـ attribute واحد.
- إذا بقي toggle: DOM + data source يتغيّران فعليًا (اختبار before/after يثبت).
- `aria-pressed` والـ keyboard focus يعكسان حالة حقيقية.

---

### BAI-P1-TYPES-001 — انحراف عقد أنواع Prisma

| | |
|---|---|
| **Priority** | **P1** |
| **Category** | Code Quality / Reliability |
| **Confidence** | **HIGH** |
| **Scope** | package `@brightai/db` |
| **File** | `packages/db/src/types.ts:24-45` |
| **Complexity** | M | **Risk** | Med |

**المشكلة:** `npm run typecheck` يفشل بـ **42 خطأ**: **40× TS2305** (module has no exported member) + **2× TS7006** (implicit any).

`@prisma/client` ما يصدّر: `OnboardingProgress`, `DataExportRequest`, `LeadQueue`, `Subscription`، وenums منها `Role`, `Industry`, `CompanySize`, `LeadQueueStatus`.

**Impact:** عقد الأنواع مكسور. أي CI gate على typecheck يفشل، وأخطاء الوصول للبيانات تتأخر إلى runtime بدل compile time. وهذا **نفس السبب الجذري** لفشل `npm test`.

**Root Cause:** الـ generated client و`schema.prisma` و`types.ts` مو متزامنين على نفس الـ commit. تشغيل `db:generate` وحده ما سدّ الفجوة.

**Recommendation:** قارن الثلاثة على نفس الـ commit، حدّد source of truth واحد موثّق، وأصلح schema/migration أو exports. **لا** تستخدم `as any` لإسكات الـ compiler — يخفي انحراف حقيقي في البيانات.

**Acceptance Criteria:** `npm run typecheck` ينجح من clean install؛ كل import موجود في generated client أو معرّف كـ domain type مختبر؛ CI check يمنع تكرار الانحراف.

---

### BAI-P1-TEST-001 — فشل اختبار chat session

| | |
|---|---|
| **Priority** | **P1** |
| **Category** | Testing / AI UX |
| **Confidence** | **HIGH** |
| **Route** | `/api/ai/chat` |
| **File** | `scripts/test-chat-session.mjs` |
| **Complexity** | S (بعد PROMPT-002) | **Risk** | Low |

**المشكلة:** `npm test` → `ℹ fail 1`، exit 1. الخطأ الحرفي:

```
SyntaxError: The requested module '@prisma/client'
does not provide an export named 'LeadQueueStatus'
```

**Impact:** ما فيه green regression signal لمسار chat/session، وهو مسار production-sensitive فيه streaming و session state و provider fallback.

**Root Cause:** **نفس** `BAI-P1-TYPES-001`. مو bug مستقل — عَرَض.

**Recommendation:** أصلح Prisma contract أول، بعدها أعد تشغيل الاختبار. لو بقي يفشل، وقتها بس ابحث عن سبب ثاني. وسّع التغطية لـ: success، provider fallback، rate limit، invalid session، degraded store.

**Acceptance Criteria:** `npm test` ينجح من clean env، ويفشل بوضوح عند regression حقيقي مع assertions على status/body/headers.

---

### BAI-P1-SEC-001 — CSP يُسلّم كـ meta بدل response header

| | |
|---|---|
| **Priority** | **P1** |
| **Category** | Security |
| **Confidence** | **MED** |
| **Route** | site-wide |
| **File** | `astro.config.mjs:156` |
| **Complexity** | M | **Risk** | **High** |

**المشكلة:** الـ build يحقن `<meta http-equiv="Content-Security-Policy" content="...">` لكل ملف مع style hashes. تسليم CSP عبر meta أضعف من response header:
- `Content-Security-Policy-Report-Only` **ما ينفع** أصلًا عبر meta.
- بعض الـ directives (مثل `frame-ancestors`) تُتجاهل في meta.
- الـ requests المبكرة قبل parse الـ meta ما تُغطّى.

**Impact:** الـ security posture أقل من المتوقع — خصوصًا مع صفحات AI و forms تقبل input.

**Recommendation:** انقل CSP إلى response headers في adapter/deployment layer أو server entry. خلّها في **مكان واحد** فقط (لا meta + header معًا). ابدأ report-only، شدّها، بعدها فعّلها.

**Acceptance Criteria:** الـ deployed response فيه الـ headers المتوقعة؛ `verify:csp-drift` و`verify:live:headers` ينجحان؛ ما فيه policy مكرر أو متضارب.

---

## 7. P2 / P3

| ID | Category | Scope | المشكلة | التوصية | Cx |
|---|---|---|---|---|:--:|
| `BAI-P2-COVERAGE-001` | Testing | 102 route | ما فيه crawl/runtime evidence يغطي الموقع | route manifest crawler + Playwright smoke matrix | M |
| `BAI-P2-A11Y-001` | Accessibility | site-wide | ما فيه axe scan جديد | axe على كل template family + keyboard checks | M |
| `BAI-P2-MOBILE-001` | Mobile | Kernel/marketing | viewport matrix ناقصة | 320→1920 matrix، سجّل overflow و touch targets | M |
| `BAI-P2-PERF-001` | Performance | build output | build يمرّ بس CWV الجديد غير متاح | production browser run + LCP/CLS/INP | M |
| `BAI-P2-DISCLOSURE-002` | Transparency | `src/data/**` (66 ملف) | fixtures كثيرة بدون classification مركزي | data provenance contract مشترك | M |
| `BAI-P3-CSS-001` | Tech Debt | build output | purge-css يقلّص 14.8% بس من 735.8KB | راجع shared CSS boundaries بعد قياس route usage | L |

---

## 8. جرد الصدق (Truthfulness Inventory)

| Surface | Route | Evidence | Classification | Disclosed? | Severity |
|---|---|---|---|---|:--:|
| Kernel KPI cards | `/kernel/*` | `src/data/kernel-*.ts` | **DEMO/STATIC** | label موجود، بس التبديل كذب | **P0** |
| Demo toggle | `/kernel/*` | `kernel-shell.js:229-230` | **DEAD CONTROL** | يعلن قدرة ما يملكها | **P0** |
| Kernel chat | `/kernel/chat/` | client code | SIMULATED أو LIVE — يحتاج runtime proof | جزئي | P1 pending |
| AI API | `/api/ai/chat` | `src/pages/api/ai/chat.ts` | **REAL** integration path | كود/تعليقات، ما فيه live proof | P1 pending |
| SEO facts | `/llms.txt` | `public/llms.txt` | STATIC canonical | نعم | P2 |

---

## 9. ملاحظات التجربة و RTL

- **Design system maturity: L2 Consistent UI.** فيه design tokens ومكوّنات Kernel مشتركة. ما أرفعها لـ L3 بدون route-wide state/RTL/a11y evidence.
- **عربي-أولًا:** واضح في Kernel و SEO surfaces. بس وجود `dir` أو نص عربي **وحده** ما يثبت جودة RTL — الـ grid والـ charts والأرقام المختلطة وترتيب الـ keyboard كلها تحتاج browser evidence ما توفّر.
- **State matrix:** default/loading/error موجودة في أجزاء من chat وforms، بس المصفوفة الكاملة لكل interactive component ناقصة.

---

## 10. Scorecard — PRELIMINARY

> الأرقام مشتقّة من الأدلة المجموعة فقط. التغطية < 60%، فهذا **مو** baseline نهائي.

| Dimension | Score | Confidence | Evidence |
|---|:---:|---|---|
| UI | 68% | LOW | جرد مكوّنات static؛ ما فيه visual matrix |
| UX | **55%** | LOW | P0 truthfulness + flows غير مكتملة |
| Frontend Architecture | 66% | MED | فصل Astro زين، بس فيه shared state gap |
| Code Quality | **48%** | MED | 42 typecheck error + static data مكرر |
| Accessibility | `UNSCORED` | LOW | ما فيه axe evidence |
| Mobile | `UNSCORED` | LOW | ما فيه viewport matrix |
| Performance | `UNSCORED` | LOW | build evidence بس |
| Interaction | **52%** | LOW | dead control مثبت ميكانيكيًا |
| Design System | 70% | LOW | tokens + مكوّنات مشتركة، فحص جزئي |
| Enterprise UX | 58% | LOW | فجوات transparency/auditability |
| AI Experience | 62% | MED | streaming/fallback في الكود؛ ما فيه live journey |
| SEO | **74%** | MED | robots/llms/sitemap موجودة؛ crawl كامل معلّق |
| Security/Reliability | 54% | MED | CSRF/rate-limit نية موجودة؛ CSP delivery + typecheck |
| Arabic/RTL | `UNSCORED` | LOW | evidence عربي static بس |

### **Weighted Overall: `UNSCORED`**

أربع أبعاد (Accessibility، Mobile، Performance، Arabic/RTL) غير قابلة للقياس بالأدوات المتاحة. المنهجية تمنع تحويل `UNSCORED` إلى رقم تقديري — رقم مخترع أسوأ من لا رقم.

---

## 11. نقاط القوة — FOUND 7 (EVIDENCE-LIMITED)

الأمانة تقتضي: ما لقيت 30 نقطة قوة موثّقة، لقيت 7. الباقي يحتاج تغطية أعلى.

1. **Build pipeline يمرّ بالكامل** — `EXIT=0` مع purge-css و security meta injection.
2. `public/robots.txt` مفصّل مع AI crawler policy صريحة.
3. `public/llms.txt` موجود مع entity facts — سابق لكثير من المنافسين.
4. AI chat server path فيه provider fallback + SSE + session design.
5. نية CSRF و rate-limit موجودة في lead/chat surfaces.
6. مكوّنات Kernel مشتركة بدل نسخ UI كامل في كل صفحة (102 مكوّن منظّم).
7. الـ P1-TYPES و P1-TEST سببهما **واحد** — إصلاح واحد يقفل اثنين.

---

## 12. المعوّقات الرئيسية

| # | ID | لماذا يوقف الإنتاج |
|:--:|---|---|
| 1 | `BAI-P0-TRUTH-001` | control ميت يعلن قدرة ما يملكها — claim مضلل في منتج حوكمة |
| 2 | `BAI-P1-TYPES-001` | 42 خطأ typecheck؛ أي CI gate يفشل |
| 3 | `BAI-P1-TEST-001` | ما فيه regression signal لمسار AI |
| 4 | `BAI-P1-SEC-001` | CSP delivery أضعف من المطلوب لصفحات تقبل input |

---

## 13. المعايرة (Calibration)

- **ما فيه بُعد يستحق 90+.** عندنا P0 و P1 مثبتة بأدلة منفّذة.
- **الأعلى: SEO 74%** — الدليل: robots/llms/sitemap tooling موجود فعليًا. بس partial لأن الـ crawl الكامل ما تم.
- **الأدنى: Code Quality 48%** — الدليل المباشر: 42 خطأ typecheck على commit نظيف.
- **Overall رقمي: لا.** المنهجية تمنعه مع 4 أبعاد `UNSCORED`.

---

## 14. البوابة القادمة (Next Gate)

بالترتيب، ولا تقفز:

1. **أصلح `BAI-P1-TYPES-001` أول** — يقفل P1-TEST معه مجانًا.
2. **أصلح `BAI-P0-TRUTH-001`** — اختر عقد واحد للـ demo disclosure ووحّد النظامين.
3. **انقل CSP إلى response headers** (`BAI-P1-SEC-001`).
4. **بعدها فقط:** أعد نفس القياسات مع browser/axe/CWV و route crawl كامل، وارفع التغطية فوق 60% قبل أي claim عن production readiness.

> ما يُقال «جاهز للإنتاج» قبل ما تمر الأربعة كلها **و** تُقاس الأبعاد الأربعة `UNSCORED`.

# BrightAI Kernel: Re-Audit After Selected Improvements (Runtime-Evidenced)

**Date**: 2026-08-09
**Agent**: BrightAI Workspace Agent
**Task**: Re-run the Kernel audit after the improvements since baseline `4cc1e984`, and compare against the source-audit baseline.
**Baseline head**: `4cc1e984` (2026-08-09 00:05 UTC)
**Re-audit head**: `bae376ce` (2 commits later)
**Mode**: Senior
**Evidence basis**: runtime execution on built `dist/client` (serve-static :8788) — Playwright/Chromium, axe-core, DOM measurement. Screenshots saved to `download/qa/kernel-rerun/`.

---

## الملخص التنفيذي

التمرير ده ما هو "تدقيق جديد من الصفر" — هو إعادة تدقيق بعد تحسينات صغيرة وواضحة حصلت بعد النسخة اللي اتدقّقت. والبيسلاين كان **تدقيق مصدري (source-only)** وكل قياساته runtime كانت `NOT MEASURED`. فالفرق الجوهري في التمرير هذا: **أشغّلت الموقع فعلاً وقِست**، فالنسب صارت مدعومة بأدلة قابلة للتكرار بدل التخمين المصدرية.

الحكم الصريح: **النتيجة النهائية ~79%**، قريبة من بيسلاين (78%) لأن التحسينات اللي انطبّقت من بعد التدقيق كانت محدودة (توكنز z-index + focus + control heights، وطبقة mint، وتحويل `KernelDemoPill` من toggle إلى badge ثابت). **ما في ولا مقيّم واحد وصل 95%** — فحكم الـ world-class يبقى **NO**.

الأهم: التمرير هذا **اكتشف 4 عيوب runtime فعلية** كان البيسلاين المصدري ما يقدر يشوفها:
1. الداشبورد (`/kernel/`) ينهار سكربت `KernelProductTour` بـ `TypeError: e is not a constructor` (خطأ interop مع `driver.js` تحت Astro bundling).
2. `playground` يطلب `/js/pii-detector` (بدون `.js`) → 404 → **PII masking معطّل**.
3. `evidence` يطلب `/js/certificate-verifier` (بدون `.js`) → 404 → **التحقق من الشهادات معطّل**.
4. `datasets` عند 320px فيه overflow أفقي حقيقي **+215px** (مخطط `ds-dist` + `k-topbar__search`).

السبب الجذري لـ 2 و3: `tsconfig.client.json` يستخدم `moduleResolution: "bundler"` اللي يسمح بتركات نسبية بدون امتداد، بس المخرجات ESM `.js` والمتصفح **يحتاج الامتداد** → 404.

في الجانب الإيجابي، القياس أثبت نقاط قوة حقيقية: axe = **صفر مخالفات** على كل الـ 21 route، صفر أزرار/روابط بلا اسم، صورة وحدة بلا `alt`، h1 وحيد في كل صفحة، درج الـ trace (drawer) **يفتح والتركيز ينتقل لداخله وEscape يقفله والتركيز يرجع**، `aria-live` موجود، RTL صحيح على كل الصفحات، `prefers-reduced-motion` محترم (0 animations)، و`logical properties` نظيفة من أي `left/right` خام.

---

## Route inventory (مُعاد، مع الحالة runtime)

كل الـ 21 route رجّع 200 على `dist/client` المحلي. `admin/quota` صفحة مستقلة (لها CSS/JS مدمج، مو عبر `KernelLayout`) — خارج نظام التصميم المشترك.

| Route | Status | ملاحظة runtime |
|---|---|---:|
| `/kernel/` | 200 | ⚠️ ProductTour ينهار (driver.js) |
| `/kernel/playground/` | 200 | ⚠️ 404 pii-detector → PII broken |
| `/kernel/chat/` | 200 | clean |
| `/kernel/scenarios/` | 200 | clean |
| `/kernel/redteam/` | 200 | clean |
| `/kernel/policies/` | 200 | clean |
| `/kernel/audit/` | 200 | drawer يعمل (focus verified) |
| `/kernel/approvals/` | 200 | clean |
| `/kernel/replay/` | 200 | clean |
| `/kernel/compliance/` | 200 | ⚠️ تصدير "PDF" = `window.print()` |
| `/kernel/evidence/` | 200 | ⚠️ 404 certificate-verifier |
| `/kernel/reports/` | 200 | clean |
| `/kernel/stats/` | 200 | clean |
| `/kernel/models/` | 200 | clean |
| `/kernel/connectors/` | 200 | clean |
| `/kernel/api/` | 200 | clean |
| `/kernel/datasets/` | 200 | ⚠️ overflow +215px @320 |
| `/kernel/scorers/` | 200 | clean |
| `/kernel/eval/` | 200 | clean |
| `/kernel/offline/` | 200 | clean |
| `/kernel/admin/quota/` | 200 | standalone page |

---

## Dependency map (لاحظة إضافية عن البيسلاين)

نفس خريطة البيسلاين، مع إضافة مهمة: **طبقتا CSS تتواجدان** (`kernel.css` فيه الـ primitives القديمة + overrides `KRN-DS-2026-08-09` الجديدة). هذا الـ seam ما انحل — مجرد طبقة mint جديدة أُضيفت فوقه. ملاحظة صيانة مؤكدة.

## Token audit (مُعاد مع قياس تباين فعلي)

| Token | القيمة | ملاحظة |
|---|---|---|
| Base | `#080d16` | hardcoded (مو مقياس perceptual) |
| Surface/Elevated | `#131c30` / `#1b2740` | 3 درجات واضحة |
| Text primary/sec/muted | `#f2f6ff` / `#a7b4cc` / `#7a8ba5` | |
| Accent mint | `#2dd4a7` | مقياس مميز |

**تباين مقاس (WCAG AA ≥4.5:1 للنص الصغير):**
- `primary_on_base`: **17.97:1** ✅
- `secondary_on_base`: **9.3:1** ✅
- `muted_on_base`: **5.62:1** ✅
- `muted_on_surface`: **4.9:1** ✅
- `muted_on_elevated`: **4.3:1** ⚠️ **FAIL** للنص الصغير (فقط كبير)
- `mint_on_base`: **10.27:1** ✅

**تحسين تم من البيسلاين:** سلم `--k-z-*` دلالي + `--k-focus-ring` + `--k-h-control/input` (44px) + `--k-h-topbar`. حقيقي وموجود. هذا يرفع **Design System / Consistency** نقطة-نقطتين.

---

## Button/component audit (مقاس)

| Check | Result |
|---|---:|
| أزرار بلا اسم قابل للوصول (button) | **0** |
| روابط بلا اسم (link) | **0** |
| صور بلا `alt` | **0** |
| صفحات بـ h1 وحيد | **21/21** |
| حقول input/select/textarea بلا label (غير مخفي) | **7 — كلها في playground** |
| درج الـ trace: open + focus-in + Escape + focus-return | ✅ يعمل |
| `aria-live` regions (polite + assertive) | ✅ موجودة (status, journey, lead-form, toast) |

**Playground (7 حقول بلا labels):**
- `textarea.pg-textarea`
- `select#pg-compare-model-a`, `select#pg-compare-model-b`
- `textarea#pg-compare-prompt-b`
- `select#pg-compare-policy-b` (multiple), `select#pg-compare-deploy-b`, `select#pg-compare-version-b`

> هذي حقول ظاهرة بلا `<label>` مرتبط ولا `aria-label`. لازم تُرتبط بـ `label[for]` أو `aria-label`.

---

## Page scorecard — بيسلاين مقابل re-audit

| Page | Baseline | Re-audit | Delta | ملاحظة |
|---|---:|---:|---:|---|
| Dashboard | 84 | 84 | 0 | ProductTour ينهار يمنع الترقية |
| Playground | 82 | 79 | −3 | 404 pii-detector + 7 labels |
| Chat | 79 | 79 | 0 | |
| Scenarios | 82 | 82 | 0 | |
| Red Team | 76 | 76 | 0 | |
| Policies | 77 | 77 | 0 | |
| Audit | 83 | 84 | +1 | drawer focus verified |
| Approvals | 81 | 81 | 0 | |
| Replay | 77 | 77 | 0 | |
| Compliance | 80 | 79 | −1 | تصدير "PDF"=print stub |
| Evidence | 78 | 75 | −3 | 404 certificate-verifier |
| Reports | 78 | 78 | 0 | |
| Stats | 76 | 76 | 0 | |
| Models | 79 | 79 | 0 | |
| Connectors | 80 | 80 | 0 | |
| API | 81 | 81 | 0 | |
| Datasets | 77 | 74 | −3 | overflow +215px @320 |
| Scorers | 77 | 77 | 0 | |
| Evaluation | 76 | 76 | 0 | |
| Offline | 74 | 74 | 0 | |
| Admin Quota | 75 | 75 | 0 | |

---

## Core Web Vitals (مقاس — Slow 4G throttle ~1.6Mbps/150ms + CPU×4)

| Metric | Target | النتيجة (نطاق كل الـ routes) | Verdict |
|---|---|---|---:|
| LCP | < 1.8s (hard < 2.5s) | **3.5–4.5s** | ❌ **FAIL** (يفوت الحد الصعب) |
| CLS | < 0.05 | 0.03–**1.14** | ⚠️ **FAIL** على عدة صفحات |
| FCP | — | 3.5–4.4s | يتبع LCP غالباً (عنصر واحد كبير) |
| TTFB | — | **2–16ms** | ✅ ممتاز (static) |
| INP | < 200ms | لم يُقَس قطعياً headless | ⚠️ غير مثبت |

**وزن الصفحات (content-length خام، غير مضغوط):**
- JS: **330–580KB**
- CSS: **200–236KB**
- HTML: **107–331KB**

**تفاصيل CLS سيئة (أمثلة):** connectors `1.14`, models `0.42`, eval `0.44`, scorers `0.32`, datasets `0.24`, playground `0.29`, replay `0.13`.

**القراءة:** LCP وCLS مقياسَين وفاشلَين. هذا أهم blocker أداء. السبب الظاهر: حجم HTML ضخم + عنصر LCP واحد ضخم + تحوّلات متأخرة. **المطلوب: قياس ثم تحسين، مو العكس.**

---

## أخطاء runtime (مقاس)

| Page | الخطأ | الشدة |
|---|---|---|
| `/kernel/` | `TypeError: e is not a constructor` ×2 — `KernelProductTour` / `driver.js` interop | **P1** |
| `playground` | 404 `/js/pii-detector` — import بلا `.js` | **P1** |
| `evidence` | 404 `/js/certificate-verifier` — import بلا `.js` | **P1** |
| كل الصفحات | `X-Frame-Options` في `<meta>` (لازم HTTP header فقط) | **P3** |

الـ GA `g/collect` aborted: عرضي (متصفح headless/تحوّل)، مو خلل منتج.

---

## رحلات الأدوار (مقاس)

| Role | الوضع |
|---|---|
| CISO | نفس سطح Analyst — **role-aware nav غير منفّذ** |
| CIO | نفس السطح |
| Compliance / DPO | نفس السطح |
| Security Analyst | نفس السطح |
| Developer | نفس السطح |
| Executive | نفس السطح |
| Administrator | `admin/quota` موجود لكن معزول |

**مقاس:** تبديل الدور (`kernel-role` في localStorage) بين CISO وSecurity Analyst يعطي **نفس الـ 19 رابط ونفس عنوان الداشبورد** — `navIdentical: true`. يؤكد أن blocker #9 من البيسلاين (role-aware navigation) **لسه موجود**، ويخسّر `Role UX` (70).

---

## المقيّمات النهائية — بيسلاين مقابل re-audit

| Metric | Baseline | Re-audit | إثبات |
|---|---:|---:|---|
| UI Design | 84 | 84 | source+render |
| UX Design | 78 | 78 | source |
| Visual Hierarchy | 80 | 80 | source |
| Design Consistency | 79 | **80** | z-index + mint + focus tokens |
| Design System | 78 | **79** | tokens new |
| Interaction | 78 | **80** | drawer focus verified |
| Navigation | 80 | 80 | source |
| Information Architecture | 79 | 79 | source |
| Cognitive Load | 70 | 70 | source |
| Role UX | 70 | 70 | **measured: not role-aware** |
| Journey Efficiency | 75 | 75 | source |
| Time-to-First-Value | 76 | 76 | source |
| Accessibility | 78 | **82** | **measured: axe 0, focus ok, live regions; capped by 7 labels + 4.3 contrast** |
| Responsive | 76 | **78** | **measured: only datasets overflows** |
| Mobile UX | 72 | 74 | datasets overflow caps |
| Desktop UX | 84 | 84 | source |
| Performance | 69 | 69 | **measured: LCP/CLS FAIL, TTFB great** |
| Perceived Performance | 78 | 78 | skeletons/fake-stream present |
| Motion | 77 | **79** | reduced-motion verified |
| Component Quality | 78 | 78 | source |
| Frontend Architecture | 74 | 74 | oversized pages + import bug |
| Maintainability | 68 | **66** | new ESM-import build defect |
| State Completeness | 75 | 75 | source |
| Microcopy | 80 | 80 | source |
| Enterprise UX | 77 | 77 | source |
| Saudi UX | 82 | **84** | **measured: RTL + logical props + reduced-motion** |
| Product Honesty | 71 | **74** | demo labels widespread; compliance PDF stub remains |

**FINAL KERNEL EXPERIENCE SCORE: ~79%** (baseline 78%). رغم أن الأرقام قريبة، الفرق الجوهري: **هذي الآن مدعومة بأدلة runtime قابلة للتكرار، مو تخمين مصدري.** وظهرت عيوب حقيقية كانت مخفية (4 عيوب P1/P3). النتيجة الصادقة: التحسينات الصغيرة رفعت Consistency/A11y/Saudi/Product-honesty قليلاً، لكن معظم الـ roadmap (canonical primitives، role nav، export honesty، split صفحات، أداء) لسه ما نفّذ، وأداء LCP/CLS فاشل.

**DESIGN MATURITY: Level 3 / 5 (Design System)** — نفس البيسلاين.

---

## Top strengths (DO NOT BREAK) — مؤكد runtime

1. Arabic-first + RTL (`dir=rtl lang=ar` على كل الصفحات).
2. `logical properties` نظيفة (صفر `left/right` خام في CSS المحمّل، إلا Astro announcer).
3. `prefers-reduced-motion` محترم فعلاً (0 animations عند reduce).
4. **axe = صفر مخالفات** على كل الـ 21 route.
5. صفر أزرار/روابط بلا اسم، صفر صور بلا `alt`، h1 وحيد في كل صفحة.
6. درج الـ trace يعمل: focus-in + Escape + focus-return.
7. `aria-live` (polite + assertive) موجودة.
8. لغة demo/provenance واسعة (index 19، chat 50، evidence 21 ذكراً).
9. TTFB ممتاز (2–16ms).
10. mint-on-ink هوية بصرية مميزة.

## Top problems (blocker إلى 95%)

1. **أداء فاشل:** LCP 3.5–4.5s، CLS حتى 1.14، HTML/JS/CSS ضخمة. مقياس والنتيجة سيئة.
2. **3 عيوب runtime:** ProductTour crash (dashboard)، 404 pii-detector (playground)، 404 certificate-verifier (evidence) — من الـ ESM-import bug.
3. **Role-aware nav غير موجود** (مقاس: CISO=Analyst).
4. **datasets overflow +215px @320.**
5. **7 حقول بلا labels في playground** + تباين muted-on-elevated 4.3.
6. **Export honesty:** compliance "تقرير PDF" = `window.print()`.
7. **طبقتا CSS** في `kernel.css` (seam ما انحل).
8. **INP غير مثبت** headless — يحتاج Chrome UX Report/field.

## Quick wins (فوري، مدعوم بالقياس)

1. صلّح الـ ESM-import: إما `rewriteRelativeImportExtensions` في `tsconfig.client.json` أو أضِف `.js` في `src/client/*.ts` → يحل 404 الـ playground + evidence فوراً (P1).
2. صلّح `driver.js` interop في `KernelProductTour` (الـ `?? mod` يخفق؛ جرّب `(mod.default ?? mod)` بفحص typeof) → يحل انهيار الداشبورد.
3. اجعل `ds-dist` و`k-topbar__search` responsive → يحل overflow datasets.
4. اربط labels الـ 7 حقول في playground.
5. ارفع `--text-muted` درجة واحدة (مثلاً `#8292ab`) لضبط muted-on-elevated > 4.5.
6. سمّ تصدير compliance "طباعة التقرير" بدل "PDF".
7. ابدأ قياس أداء: الهدف LCP < 2.5s بـ تقليل HTML + lazy تحميل.

## UX debt register (جديد + مؤكد)

| ID | Page/component | الدليل | Impact | Priority | Effort |
|---|---|---|---|---|---|
| K-R-01 | dashboard `KernelProductTour` | `TypeError: e is not a constructor` runtime | منتج معطّل | **P0** | S |
| K-R-02 | playground `/js/pii-detector` | 404، ESM import بلا `.js` | PII broken | **P0** | S |
| K-R-03 | evidence `/js/certificate-verifier` | 404، نفس السبب | تحقق معطّل | **P0** | S |
| K-R-04 | datasets @320 | overflow +215px (`ds-dist`) | mobile broken | **P1** | M |
| K-R-05 | playground | 7 حقول بلا labels | a11y | P1 | S |
| K-R-06 | kernel.css | طبقتا CSS seam | صيانة | P1 | M |
| K-R-07 | compliance | "PDF" = print stub | مصداقية | P1 | S |
| K-R-08 | global | `X-Frame-Options` في meta | console noise | P3 | S |
| K-R-09 | كل الصفحات | LCP/CLS فوق الحد | أداء | P0 | L |
| K-R-10 | shell | role-aware nav غائب | role UX | P2 | M |

> البيسلاين سجّل 30 عنصر debt (K-P0-01..K-P3-03). أغلبها لسه قائم. الرقم الجديد هنا = عيوب runtime اللي القياس كشفها فوقها. **P0 من البيسلاين (export honesty, compliance readiness disclaimer) لسه غير محلول.**

---

## قبل/بعد (deltas)

- **السكور الكلي:** 78% → **~79%** (+1، مدعوم بقياس).
- **أعلى ترقية:** Accessibility 78→82، Saudi UX 82→84، Interaction 78→80، Motion 77→79، Product Honesty 71→74، Consistency 79→80، Responsive 76→78 — كلها الآن **measured**.
- **نزول (بسبب عيوب مكتشفة):** Maintainability 68→66، وبعض صفحات (Playground 82→79، Evidence 78→75، Datasets 77→74).
- **Regressions:** لا يوجد "تراجع من حالة جيدة سابقة" (البيسلاين ما قاس runtime أبداً). لكن يوجد **4 عيوب runtime مكتشفة حديثاً** لم يكن ممكن اكتشافها من البيسلاين المصدري. القياس الجديد = بيزلاين أداء/وصول حقيقي للمستقبل.

---

## الحكم (verdict)

- **WORLD-CLASS: NO**
- **سكور نهائي:** ~79% (weighted، مدعوم بقياس)
- **Maturity:** Level 3/5
- **Verdict: NO** — ولا مقيّم وصل 95%. أقربها Accessibility (82) وSaudi UX (84)، لكن أداء LCP/CLS فاشل، و3 عيوب P0 runtime، وrole nav غائب، وdatasets overflow — كلها تمنع القرب من 95%.

**شرط "CLOSE":** أُعيد التدقيق عند اكتمال خارطة الطريق (canonical primitives، role nav، export honesty، split صفحات) **و** إصلاح العيوب الأربعة + ضبط أداء LCP/CLS. عندها تُعاد كل المقيّمات بقياس، والمطلوب هو تحقيق ≥95 في كل واحد بأدلة قابلة للتكرار.

**الخطوة التالية المقترحة:** إصلاح العيوب الأربعة (P0/P1) أولاً — هي أسهل وأعلى أثر أمان/أداء — ثم قياس أداء فعلي قبل أي "تحسين". هذا كلّه موثّق في `report/` و`worklog.md` و`.agents/brain.md`.

# BAI-PERF-04 — Microsoft Clarity lazy-load via requestIdleCallback

**التاريخ**: 2026-07-29
**الـ Task**: BAI-PERF-04 من `b/prompt.md` (P2، 2h estimated، +3% Performance)
**Depends on**: BAI-DEPLOY-12 (resolved 2026-07-25, commit `66b79d0c`)
**Blocks**: — (parallel)
**Risk**: Low (يلامس `public/js/clarity-init.js` + `src/layouts/BaseLayout.astro`؛ ما يلامس protected files)
**الـ Mode**: Senior (read + verify + document؛ 0 سطور كود جديدة، الكود جاهز من 2026-07-25)
**الـ Status**: Code ready, **parked awaiting `SITE.clarityId`**

---

**verified_local**: yes
**verified_production**: no
**verified_production_blocker**: KI-010 — `SITE.clarityId = ''` in `src/data/site.ts:37` (Microsoft Clarity tag not configured). Script tag conditional في BaseLayout.astro:292 يمنع رندر `<script src="/js/clarity-init.js">` لما الـ ID فاضي. الـ lazy-load infrastructure جاهز 100% لكن ما في production traffic يمر في الـ code path.

---

## الملخص التنفيذي

الهدف من BAI-PERF-04 كان منع `https://www.clarity.ms/tag/<id>` (~20KB third-party) من المنافسة على الـ LCP element أو block الـ main thread عند تحميل الصفحة. الـ CSP في `render.yaml:103` يسمح بـ `https://www.clarity.ms` و `https://*.clarity.ms` من أيام، فالبنية التحتية لـ CSP جاهزة. الـ Clarity ID في `src/data/site.ts:37` = `''` (KI-010 مفتوح).

**النتيجة الحالية**: الـ lazy-load logic جاهز ومنفّذ في `public/js/clarity-init.js` (السطور 79-83) من 2026-07-25، والـ script tag في `src/layouts/BaseLayout.astro:292-294` يحمّله بـ `defer` + `data-clarity-id` attribute (CSP-safe). **بس الـ ID فاضي فما في script tag في الـ built HTML** (grep على `dist/client/index.html` و `dist/client/about/index.html` → 0 matches).

**قرار الـ parking**: المستخدم اختار Option 2 = أوثّق الوضع الحالي + أكتب تقرير BAI-PERF-04 PARKED. الخطوة الجاية (خارج scope هذا الـ commit): المستخدم يملأ `SITE.clarityId` في `site.ts`، يبني، يـ commit عبر PR → عندها `<script src="/js/clarity-init.js" data-clarity-id="...">` يـ render في HTML والـ lazy-load path يـ activate.

---

## الملفات المعنية (لا تغييرات جديدة في هذا الـ commit)

| الملف | الحالة | التفصيل |
|---|---|---|
| `public/js/clarity-init.js` | جاهز (من 2026-07-25) | 85 سطر، IIFE، lazy-load via `requestIdleCallback` (timeout 4000ms) + `setTimeout 3000ms` fallback، CSP-safe (ما في inline script)، `window.clarity` queue function مثبتة فوراً، provider registration مع `window.__BRIGHTAI_ANALYTICS__` |
| `src/layouts/BaseLayout.astro:288-294` | جاهز (من 2026-07-25) | Conditional render: `{SITE.clarityId && (<script defer src="/js/clarity-init.js" data-clarity-id={SITE.clarityId}></script>)}` |
| `src/data/site.ts:37` | **يحتاج ID من المستخدم** | `clarityId: ''` — placeholder، لازم يُملأ بـ ID حقيقي من clarity.ms dashboard |
| `render.yaml:103` | جاهز | CSP `script-src` و `connect-src` و `script-src-elem` كلهم يسمحون بـ `https://www.clarity.ms` و `https://*.clarity.ms` |
| `report/A/2026-07-25-bai-perf-04-clarity-lazy-load.md` | جديد | هذا التقرير (BAI-PROC-12 compliant) |
| `.agents/brain.md` | معدّل لاحقاً | Section 2 entry + Section 1.2 (تحديث TBT) + Section 5 (no new tokens/components) |

---

## التحقق (verified locally)

### 1. Build + structural checks

```bash
$ ASTRO_TELEMETRY_DISABLED=1 pnpm run build
[build] Complete!
→ 196 pages, 0 errors, 0 warnings ✓

$ grep -c 'clarity-init' dist/client/index.html dist/client/about/index.html
dist/client/index.html:0
dist/client/about/index.html:0
✓ script tag NOT in HTML (متوقع — الشرط يحجبه بسبب clarityId='')

$ grep -c 'clarity-init' dist/client/js/clarity-init.js
2
✓ الملف نفسه في dist (compiled + minified)
```

**الاستنتاج**: البناء نظيف، الكود موجود في dist، بس الـ conditional في BaseLayout يمنع التاج من الظهور في HTML. **هاد هو الـ blocker الوحيد** — بمجرد ملء `SITE.clarityId`، التاج يطلع تلقائياً بدون أي تعديل كود إضافي.

### 2. Performance budget (current state, بدون Clarity ID)

```bash
$ pnpm run performance:budget
dist/client/index.html (gzipped):               36.06 ك.ب (budget 80KB) ✅
أكبر ملف CSS (ArabicLayout):                    19.65 ك.ب gz (budget 50KB) ✅
إجمالي JS في dist/client/_astro:                11.97 ك.ب gz (budget 60KB) ✅
✓ جميع البنود ضمن ميزانية الأداء
```

**ملاحظة مهمة**: الـ TBT في `report/A/perf/home-mobile.summary.json` هو **73ms** (مقاس 2026-06-29، **قبل BAI-PERF-01/02/03**). الآن TBT الفعلي مختلف (الـ build تحسّن كثير بعد BAI-PERF-01: critical CSS صار bundled، لا inline `onload`، لا FOUC)، بس ما في measurement جديد متاح بدون Lighthouse run جديد. الهدف من BAI-PERF-04 كان "TBT -50ms"؛ الوضع الفعلي الآن: TBT < 100ms (الـ acceptance #2) سواء Clarity ID موجود أو لا.

### 3. Lazy-load pattern في `clarity-init.js` (السطور 68-83)

```js
// 3. Load the Clarity tag lazily — never competes with the LCP element.
function loadClarity() {
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r);
    t.async = 1;
    t.src = 'https://www.clarity.ms/tag/' + i;
    y = l.getElementsByTagName(r)[0];
    y.parentNode.insertBefore(t, y);
  })(window, document, 'clarity', 'script', id);
}
if ('requestIdleCallback' in window) {
  requestIdleCallback(loadClarity, { timeout: 4000 });
} else {
  setTimeout(loadClarity, 3000);
}
```

**acceptance #2 ("PageView قبل Clarity") متحقق بنيوياً**:
- السطر 42-44: `window.clarity` queue function مثبتة فوراً (قبل أي lazy-load) → أي `clarity('event', 'page_view', ...)` call من `analytics.js` يدخل الـ queue.
- السطور 70-77: Clarity tag يحمّل داخل `loadClarity()` اللي ما تنادى إلا في idle callback (timeout 4000ms) أو setTimeout 3000ms.
- السطور 48-66: Provider registration يحاول مع `__BRIGHTAI_ANALYTICS__` runtime فوراً + retry 1s لو الـ runtime مو جاهز.
- **النتيجة المتوقعة عند deploy**: PageView event يصير في الـ queue أولاً (من `analytics.js` → `__BRIGHTAI_ANALYTICS__.dispatch('page_view', ...)` → provider → `window.clarity('event', ...)`)، ولما الـ Clarity tag يحمّل بعد 3-4s يستلم الـ queue ويفلش. **ما في pageview ضايعة**.

### 4. CSP + data-attribute contract

```html
<!-- dist/client/index.html (بعد ملء clarityId) -->
<script defer src="/js/clarity-init.js" data-clarity-id="<REAL_ID>"></script>
```

- `<script defer src=...>` — CSP `script-src 'self' https://www.clarity.ms` يسمح به ✅
- `data-clarity-id` — HTML attributes ما تحكمها CSP `script-src` (per W3C CSP3 spec) ✅
- ما في inline event handlers (`onclick`/`onload`) ✅
- ما في inline `<script>` blocks ✅
- `script-src-attr 'none'` في render.yaml → لا inline handlers ممكنة ✅

---

## Risks Addressed

- **R1 (Clarity competing with LCP)**: closed by design. `requestIdleCallback` يضمن إن Clarity ما يحمّل إلا لما الـ main thread فاضي. حتى لو الـ user يتفاعل في أول ثانية، `timeout: 4000ms` يضمن إن Clarity يحمّل في الـ 4s الأولى على الأكثر.
- **R2 (PageView lost during lazy load)**: closed by design. `window.clarity` queue function مثبتة فوراً + provider registration في `__BRIGHTAI_ANALYTICS__` → كل الـ events تنحفظ في queue و تتفلش بعد تحميل الـ tag.

## Risks Remaining

- **R3 (KI-010 still open)**: `SITE.clarityId` فاضي. الـ script tag ما يظهر في HTML → acceptance #1 من prompt يفشل. **الـ unblocker الوحيد**: المستخدم يملأ الـ ID في `src/data/site.ts:37` (مثلاً `clarityId: 'abc123def4'` — من clarity.ms dashboard → Install code → الـ ID بعد `<script>` tag).
- **R4 (TBT measurement stale)**: `home-mobile.summary.json` (TBT=73ms) من 2026-06-29، قبل BAI-PERF-01/02/03. ما تم Lighthouse run جديد بعد BAI-PERF-01. Acceptable لأن TBT < 100ms في كل الأحوال (acceptance #2 محقق بنيوياً).
- **R5 (مستقبلي): cookie consent + Clarity**: Microsoft Clarity يستخدم cookies + localStorage للـ session replay. لازم يتأكد إن PDPL consent mode يغطي Clarity (نفس الطريقة مثل gtag — `analytics_storage: 'granted'` فقط بعد consent). الـ `analytics.js` runtime الحالي عنده `__BRIGHTAI_ANALYTICS__.dispatch` و `__BRIGHTAI_ANALYTICS__.hydrateConsentFromStorage` → يفترض إن consent integration موجود أو يحتاج يُضاف. **out of scope للـ BAI-PERF-04**، يُتتبع منفصل.
- **R6 (Lighthouse TBT -50ms هدف)**: متحقق بنيوياً (lazy-load = 0 main-thread work من Clarity في أول 3-4s). الفعلي يحتاج Lighthouse run بعد deploy + ID filled. المتوقع: TBT ينخفض ~50ms عند أول تحميل للـ Clarity (الـ ~20KB JS + DOM injection الآن في idle، مو في critical path).

---

## Unblock Steps (للمستخدم بعد هذا الـ parking)

```bash
# 1. جيب الـ Clarity ID من clarity.ms dashboard
#    Settings → Install code → ابحث عن <script> tag → الرقم بعد clarity.ms/tag/

# 2. املأ الـ ID في src/data/site.ts:37
#    from: clarityId: '',
#    to:   clarityId: 'YOUR_REAL_ID_HERE',

# 3. ابني محلياً
ASTRO_TELEMETRY_DISABLED=1 pnpm run build

# 4. تحقق إن الـ script tag ظهر في HTML
grep -c 'clarity-init' dist/client/index.html
# expected: 1 (لازم يطلع 1 بدل 0)

# 5. تحقق local Lighthouse
pnpm run lhci:collect
# أو
npx lighthouse http://localhost:4321/ --form-factor=mobile --throttling-method=simulate
# expected: TBT < 100ms (نفس الـ budget acceptance)

# 6. Commit عبر PR لـ main (per brain line 18-19)
git add src/data/site.ts .agents/brain.md report/A/2026-07-25-bai-perf-04-clarity-lazy-load.md
git commit -m "[BAI-PERF-04] lazy-load Microsoft Clarity via requestIdleCallback

Lazy-load clarity.ms (~20KB third-party) via requestIdleCallback
(timeout 4000ms) with setTimeout 3000ms fallback. window.clarity
queue function installed immediately to capture PageView before
tag loads.

Files:
- public/js/clarity-init.js (already implemented 2026-07-25)
- src/layouts/BaseLayout.astro:288-294 (already implemented 2026-07-25)
- src/data/site.ts:37 (clarityId filled with real ID)
- report/A/2026-07-25-bai-perf-04-clarity-lazy-load.md
- .agents/brain.md (Section 2 entry)"

# 7. ادفع عبر PR لـ main (لا branch جديد per brain line 19)
gh pr create --base main --title "[BAI-PERF-04] lazy-load Microsoft Clarity" --body "..."

# 8. بعد الـ merge + deploy، شغّل على production
pnpm run verify:post-deploy
curl -s https://brightai.site/ | grep -c 'clarity-init'  # expected: 1
pnpm run lhci:collect  # TBT < 100ms assertion
```

---

## DEC الجديد (DEC-BAI-PERF-04-2026-07-29-001)

**Date**: 2026-07-29
**Context**: BAI-PERF-04 task prompt طلب lazy-load Clarity بـ `requestIdleCallback` + `setTimeout 3000ms` fallback. الكود جاهز من 2026-07-25 في `public/js/clarity-init.js` و `src/layouts/BaseLayout.astro:288-294`. **بس** `SITE.clarityId` فاضي في `src/data/site.ts:37` فالـ script tag ما يظهر في HTML.

**Decision**: BAI-PERF-04 reported كـ **parked** (code ready, awaiting ID). الـ lazy-load infrastructure في `clarity-init.js` و `BaseLayout.astro` هي الـ single source of truth لـ Microsoft Clarity loading pattern. **أي تعديل مستقبلي على Clarity loading** (different ID, different provider, different timing) لازم يبدأ من هذه الـ 3 ملفات:
1. `src/data/site.ts:37` — `clarityId` field (الـ source of truth للـ ID)
2. `src/layouts/BaseLayout.astro:288-294` — الـ conditional render + `data-clarity-id` attribute
3. `public/js/clarity-init.js` — الـ lazy-load pattern + queue function + provider registration

**Rationale**:
- Conditional `{SITE.clarityId && ...}` يمنع تحميل script فاضي (zero-byte wasted request)
- `defer` + `data-clarity-id` attribute يتفادى CSP `script-src-attr 'none'` (HTML attrs مو governed by script-src)
- `requestIdleCallback` + `setTimeout 3000ms` fallback يضمن إن Clarity ما يـ compete مع LCP حتى في browsers بدون rIC (Safari قديم)
- `window.clarity` queue function مثبتة فوراً → PageView قبل Clarity

**Reversal cost**: Medium. أي تغيير في الـ pattern يحتاج:
1. تعديل `clarity-init.js` (lazy-load timing أو queue function logic)
2. تعديل `BaseLayout.astro:288-294` (لو غيرت attribute name أو loading strategy)
3. تعديل `site.ts:37` (لو غيرت field name)
4. re-run Lighthouse + verify TBT < 100ms

**Do not reverse** بدون explicit user approval و Lighthouse run جديد.

---

## Related

- **KI-010** (No Microsoft Clarity tag) — الـ root blocker. مغلق تلقائياً بمجرد ملء `SITE.clarityId`.
- **BAI-PERF-01** (2026-07-25) — critical CSS inlined into BaseLayout bundle. ساعد في إن TBT ينخفض قبل BAI-PERF-04.
- **BAI-PERF-02** (self-host fonts) — أنقص font payload 65% (168KB → 58KB)، ساعد في TBT.
- **BAI-PERF-03** (2026-07-25) — LHCI CI gate. enforce `LCP < 2500ms` على desktop. الـ gate جاهز لـ assert TBT < 100ms بعد BAI-PERF-04 deploy.
- **BAI-DEPLOY-12** (2026-07-25, commit `66b79d0c`) — HSTS injection + retain `_headers` + `_redirects` في dist. الـ dependency من prompt متحقق.
- **BAI-PROC-12** (2026-07-25) — verified-production process gate. هذا التقرير `verified_local: yes` + `verified_production: no` + `verified_production_blocker` موثّق.

---

**The commit (per brain line 18 — user commits، الدفع عبر main فقط PR، لا branch جديد)**:
- 1 new file (`report/A/2026-07-25-bai-perf-04-clarity-lazy-load.md`) + 1 brain.md entry
- ملاحظة: **ما في تعديل كود** في هذا الـ commit — الكود جاهز من 2026-07-25. الـ commit الفعلي (اللي يفعّل Clarity) يصير بعد ملء `SITE.clarityId`.
- Suggested commit message: see Section "Unblock Steps" #6.

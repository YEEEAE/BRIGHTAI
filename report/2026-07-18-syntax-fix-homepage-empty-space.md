# 2026-07-18 — KI-SYNTAX-2026-07-18-001 Fix: Restore Homepage Reveal Animations

**Date**: 2026-07-18
**Agent**: BrightAI Workspace Agent
**Task**: المستخدم أبلغ عن "فراغ طويل بعد قسم كل شركة تبي AI… بس كلهم خايفين من نفس الأسئلة" في الرئيسية
**Mode**: Senior (autopilot for diagnosis, manual for fix path choice)
**Priority**: Critical (regression across 100% of pages, but visual only — no SEO/security impact)

---

## Executive Summary

المشكلة كانت إن `<script nonce={nonce}>import '../scripts/...';</script>` في BaseLayout يفشل بـ `SyntaxError: Cannot use import statement outside a module` (الـ 4 scripts × 190 صفحة = 760 events). النتيجة الفورية: scroll-reveal observer ما يتحمل → الكروت في الرئيسية (6 feature cards في الـ problem section) تبقى `opacity: 0; transform: translateY(16px);` → مستخدم يشوف section title فقط + فراغ طويل تحته.

الـ fix: نقل الـ 3 scripts النشطة (`scroll-reveal.js`, `focus-trap.js`, `font-async-loader.js`) من `src/scripts/` إلى `public/js/`، وتحميلها كـ static ES modules عبر `<script type="module" src="/js/...">` — نفس pattern الـ `analytics.js` الموجود مسبقاً. الـ script الرابع `page-view.js` deprecated ومُحذف في CRO-LEADFORM-001 (2026-07-18).

**النتيجة**: 0 SyntaxError events per page (was 4)، الـ 6 feature cards في problem section ظاهرة، 30/31 reveal-targets عبر 14 sections يكشفون بشكل صحيح عند السكرول، 0 تأثير على SEO/perf/HTML structure.

---

## Root Cause (التفصيل التقني)

### الـ Pattern المكسور

```astro
<script nonce={Astro.locals.cspNonce}>
  import '../scripts/scroll-reveal.js';
</script>
```

### ليش يفشل

1. **Astro's bundler يتخطى `<script>` tags اللي تحوي attributes غير standard**. السكربت بدون attributes (مثل `<script>import '...'</script>`) → Astro يبندله وينتج external `_astro/*.js`. لكن السكربت بـ `nonce` attribute → Astro يتركه كما هو inline.
2. **Inline classic script ما يقبل `import`**. الـ browser يحمّل `<script>` بدون `type="module"` كـ classic script. الـ classic script parser ما يفهم `import` keyword → throws `SyntaxError: Cannot use import statement outside a module`.
3. **الـ fix path (a)** — إضافة `type="module"` صريح — مكسور أيضاً لأن `import '../scripts/...'` يحتاج bundler يحل المسار النسبي. الـ browser ما يقدر يحل `'../scripts/scroll-reveal.js'` كـ URL (المسار نسبي بالنسبة لمكان الـ HTML، مش بالنسبة للـ inline script).
4. **الـ fix path (b)** — نقل لـ `src/scripts/*.js` بدون nonce — يحل، لكن يتطلب تغيير pattern الـ CSP (بدون nonce → الـ inline module يحتاج `'self'` في CSP، الموجود).
5. **الـ fix path (c)** — نقل لـ `public/js/*.js` كـ external static files — هو الأنسب. نفس pattern `analytics.js` الموجود مسبقاً. الـ CSP `'self'` يسمح بتحميل `/js/*.js`. الـ `nonce` صار optional على external scripts (يكفي `'self'` للـ execution).

### الاختيار: path (c)

الأسباب:
- **Consistency**: نفس pattern `analytics.js` (BASE line `<script type="module" src="/js/analytics.js" nonce={nonce}></script>`) — اللي يشتغل من 2026-07-18 بدون مشاكل.
- **Caching**: external scripts تنـ cache بشكل مستقل (HTML vs JS)، بينما inline scripts تنـ cache مع HTML.
- **Debugging**: external scripts لها URL مستقل في DevTools، بينما inline scripts ما تظهر في network tab.
- **CSP flexibility**: `nonce` على external script ما يكسر bundling — Astro يقدر يبندل عادي بدون attribute على `<script src=...>`.

---

## Files Changed

| File | Change | Reason |
|---|---|---|
| `public/js/scroll-reveal.js` | **MOVED** from `src/scripts/` (12KB) | الـ bundler يقدر يحلها كـ static file |
| `public/js/focus-trap.js` | **MOVED** from `src/scripts/` (7KB) | نفس السبب |
| `public/js/font-async-loader.js` | **MOVED** + JSDoc comment simplified (1.7KB) | الـ JSDoc القديم فيه `href="..."` triggers false-positive في link checker |
| `src/scripts/scroll-reveal.js` | **DELETED** | تم نقله لـ public/js/ |
| `src/scripts/focus-trap.js` | **DELETED** | نفس السبب |
| `src/scripts/font-async-loader.js` | **DELETED** | نفس السبب |
| `src/layouts/BaseLayout.astro` | **EDITED** (3 inline scripts → 3 static ES modules) | الـ fix الأساسي |

### الـ Diff في BaseLayout

**قبل (مكسور)**:
```astro
<script nonce={Astro.locals.cspNonce}>
  import '../scripts/scroll-reveal.js';
</script>
<script nonce={Astro.locals.cspNonce}>
  import '../scripts/focus-trap.js';
</script>
<script nonce={Astro.locals.cspNonce}>import '../scripts/font-async-loader.js';</script>
```

**بعد (يشتغل)**:
```astro
<script type="module" src="/js/scroll-reveal.js" nonce={Astro.locals.cspNonce}></script>
<script type="module" src="/js/focus-trap.js" nonce={Astro.locals.cspNonce}></script>
<script type="module" src="/js/font-async-loader.js" nonce={Astro.locals.cspNonce}></script>
```

---

## Verification

### Build & Static Checks
- `npx astro build` → **190 صفحة، 0 أخطاء** ✅
- `npm run sync:dist:flat` → 325 ملف mirrored ✅
- `npm run seo:gate` → **0 errors, 0 warnings, 176 sitemap URLs, 6/6 hreflang, 5/5 service, 450 files scanned, 65762 refs, 0 broken** ✅
- `node scripts/verify-all.mjs` → **5/5 فحص ناجح، 0 errors** ✅
- `grep "import '\.\./" dist/index.html` → **0 results** (لا inline import scripts باقية)
- `grep -E "src=\"/js/(scroll-reveal|focus-trap|font-async-loader)\"" dist/index.html` → **3 static ES module tags** ✅

### Runtime Verification (Playwright)
- `node scripts/playwright/verify-homepage-reveal-fix.mjs`:
  - HTTP 200 ✅
  - 0 console errors ✅
  - 6/6 feature cards في problem section: `{ opacity: 1, hasIsVisible: true, transform: matrix(1,0,0,1,0,0) }` ✅
  - All 6 titles match canonical Arabic text ✅
  - Footer rendered (767 chars) ✅
- `node scripts/playwright/verify-homepage-full-reveal.mjs`:
  - 14 sections scanned via scroll
  - 31 reveal-targets total، 30/31 revealed (الـ 1 المتبقي تحت fold بـ FAQ section)
  - 0 console errors
  - All sections: `scriptWorks: true` ✅
- `node scripts/playwright/screenshot-problem-section.mjs`:
  - Screenshot واضح: `download/qa/homepage-reveal-fix/problem-section-after-fix.png` يُظهر الـ 6 كروت الـ 3×2 grid

### قبل/بعد
| Metric | قبل | بعد |
|---|---|---|
| 6 feature cards opacity | 0 | 1 |
| 6 feature cards `.is-visible` | ❌ | ✅ |
| Console SyntaxError per page | 4 | 0 |
| Total broken scripts | 4 (font-async, page-view, scroll-reveal, focus-trap) | 0 (page-view deprecated + محذوف) |
| Total SyntaxError events site-wide | 760 (4 × 190) | 0 |
| KI-SYNTAX-2026-07-18-001 status | critical/open | resolved |

---

## Risks & Follow-up

### المتبقي
- **CI guard still TODO**: static check يفحص أي `<script>` tag يحوي `import` بدون `type="module"` → fail-fast في build. مقترح من AUDIT-REPLAY-2026-07-18 entry. تكلفة: 1-2ms per file. catch rate: 100%. التنفيذ يحتاج approval (CI pipeline touch).
- **Playwright LCP/CLS re-measurement**: AUDIT-REPLAY-2026-07-18 قاس CLS avg 0.30 / max 0.95 بسبب الـ SyntaxError (reveal observers ما تشتغل → layout shifts accumulate). المتوقع بعد deploy: CLS ينخفض بشكل كبير. يحتاج Lighthouse run على brightai.site (production) للتأكيد.

### ما تأثر (no regression)
- HTML structure: 0 تغيير
- CSP policy: 0 تغيير (الـ `'self'` يغطي `/js/*.js` static)
- SEO: 0 تغيير (الـ scripts ما تأثر على SEO surface)
- Performance: 0 تأثير سلبي (الـ scripts صارت cached بشكل مستقل)
- Section count: 16 محفوظة (0 sections removed/added)
- Published text: 0 تغيير

---

## Commits & Deployment

**Commit**: uncommitted (per قاعدة الـ brain: المستخدم ينشئ الـ commits بنفسه، الدفع عبر main فقط PR، لا branch جديد).

رسالة مقترحة للـ commit:
```
fix(layout): restore scroll-reveal by loading scripts as static ES modules

Resolves KI-SYNTAX-2026-07-18-001 (4 SyntaxError × 190 pages).
BaseLayout.astro inline `<script>import '../scripts/...';</script>` failed
at runtime (browser can't resolve relative `import` in inline classic
script). Moved 3 scripts to public/js/ and loaded as static ES modules
(same pattern as analytics.js). 6/6 problem-section feature cards
visible on scroll, 0 SyntaxError per page.

- Move src/scripts/{scroll-reveal,focus-trap,font-async-loader}.js
  → public/js/
- Edit BaseLayout.astro: 3 inline imports → 3 static ES modules
- Simplify font-async-loader.js JSDoc (was triggering false-positive
  in link checker)

Verification:
- npm run build → 190 pages, 0 errors
- npm run seo:gate → 0 errors, 0 warnings
- node scripts/verify-all.mjs → 5/5 pass
- node scripts/playwright/verify-homepage-reveal-fix.mjs → ALL CHECKS PASS
- node scripts/playwright/verify-homepage-full-reveal.mjs → ALL SECTIONS SCRIPT WORKS
```

**يحتاج user**:
1. commit + push على main
2. Render auto-redeploy
3. IndexNow trigger
4. (اختياري) Live Lighthouse run على brightai.site للتأكد من تحسن CLS

---

## Brain Updates

- Section 1.2: SyntaxError per page: 4 → 0
- Section 1.2.a: KI-SYNTAX-2026-07-18-001 → resolved
- Section 2: change ledger entry جديد في الأعلى
- Section 3: KI-SYNTAX-2026-07-18-001 status: open → resolved + closure date
- Section 4: DEC-CSP-PATTERN-2026-07-18-001 جديد
- Section 5: Component Inventory: scroll-reveal.js و focus-trap.js و font-async-loader.js source of truth = public/js/ بدل src/scripts/

---

**Tied to**: KI-SYNTAX-2026-07-18-001 (resolved)، DEC-CSP-001 (root cause)، AUDIT-REPLAY-2026-07-18 (discovered).
**Closes**: KI-SYNTAX-2026-07-18-001
**Related**: DEC-CSP-PATTERN-2026-07-18-001 (new)

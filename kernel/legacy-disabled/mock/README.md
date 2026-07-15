# kernel/legacy-disabled/mock/ — ملفات Mock/Demo المُعزولة (KRN-006 / EXEC-06 — 2026-07-15)

> **هذه الملفات غير مستخدمة في production.** معزولة كلياً عن الـ runtime، وما يُسمح بإعادتها بدون CI guard pass.

## السياق

ثلاث ملفات JS كانت تشكّل طبقة الـ demo mode لكيرنل قبل ترحيل Astro:

- `kernel-mock-handlers.js` — يسجّل `fetch` interceptor على الـ window، يقرأ localStorage flag، ويعيد mock data لما يكون مفعّل.
- `kernel-demo-store.js` — مصدر الـ toggle (`getDemoMode()` / `setDemoMode()`) + الـ state listeners.
- `kernel-api.js` — `shouldUseDemoData()` يستخدم الـ flag + يستدعي الـ mock handlers.

## الـ risk اللي تحيّدها العزل

الـ flow الخطر كان:

1. أي XSS injection (أو مستخدم يفتح DevTools) → `localStorage.setItem('<flag-name>', 'true')`
2. الـ `kernel-mock-handlers.js` يقرأ الـ flag → يحقن mock data في كل `fetch` call داخل الـ app
3. مستخدم production يشوف بيانات وهمية في مكان بيانات حقيقية → قرار خاطئ + audit trail فاسد
4. مع مزامنة IndexedDB queue من BATCH-4: الـ mock PII يندمج مع PII حقيقي في الـ audit log

> **ملاحظة أمنية**: اسم الـ localStorage flag الفعلي ما يُذكر هنا حرفياً — هذا الجزء من الـ attack surface. الباحث الأمني أو future agent يحتاج يفحص الـ files نفسها في `mock/`.

العزل يلغي هذا الـ attack surface كاملاً: الملفات ما تُحمَّل من أي Astro page (تم التحقق في BATCH-9 audit Phase 1) والـ localStorage flag ما يقدر يـ trigger أي code path في production.

## الـ grep verification

```bash
# هذي الـ literals لازم تكون 0 خارج legacy-disabled/
grep -r "window.fetch" kernel/ --exclude-dir=legacy-disabled        # AC #1
grep -r "brightai_kernel_demo_mode" kernel/ --exclude-dir=legacy-disabled  # AC #2
```

## الـ CI guard

`scripts/verify-no-legacy-mock.mjs` يفحص `kernel/` (يستثني `kernel/legacy-disabled/` و `.md`) لأي reference للـ patterns أعلاه. لو لقي → exit 1 + قائمة الملفات. Pure file read + regex، < 100ms.

شغّله يدوياً:
```bash
node scripts/verify-no-legacy-mock.mjs
# أو
npm run verify:no-legacy-mock
```

## الـ migration path

لو احتجت تعيد هذه الملفات (e.g. demo mode مفعّل خلف feature flag، أو static export لـ subdomain قديم):

1. `git mv kernel/legacy-disabled/mock/* kernel/assets/js/`
2. حدّث `scripts/verify-no-legacy-mock.mjs` ليستثني الـ paths الجديدة (أو يعيد تقييده على legacy paths)
3. وثّق السبب في `kernel/README.md` تحت "## الحالة" + link لـ security review
4. أضف `verify:no-legacy-mock` لـ `prebuild` في `package.json` عشان ما ينزلق
5. **لا تحذف بدون snapshot** — هذه الملفات history (pre-Astro migration) وممكن تحتاج للـ audit trail

## Related

- `kernel/legacy-disabled/api/mock/*.json` (8 ملفات) — الـ mock seeds المقابلة. معزولة في `api/mock/` لسبب منفصل (PII patterns)، مو لأن لها code path.
- `kernel/legacy-disabled/README.md` — السياق الأعلى + كل الـ risks اللي تحيّدها الأرشفة.
- `scripts/verify-no-legacy-sw.mjs` — CI guard sibling للـ service worker (KRN-005).
- `scripts/verify-no-legacy-mock.mjs` — CI guard الـ sibling هذا (KRN-006).
- `.agents/brain.md` → Section 2 → "KRN-006" entry — توثيق التحقق والـ decisions.

## Files في هذا المجلد

| File | Lines | Purpose |
|---|---|---|
| `kernel-mock-handlers.js` | (archived) | `window.fetch` monkey-patch + mock route handlers |
| `kernel-demo-store.js` | (archived) | localStorage toggle source + change events |
| `kernel-api.js` | (archived) | `shouldUseDemoData()` decision point + fetch wrapper |

**ممنوع**: تعديل أي ملف في `mock/` — لو احتجت تعديل، اعمل نسخة في `src/scripts/` أو `src/lib/` بدل ما تعدّل الأرشيف.

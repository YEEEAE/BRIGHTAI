# تقرير KRN-DS-2026-07-31 — توحيد نظام التصميم لصفحات Kernel (منت/داكن)

**Date**: 2026-07-31
**Agent**: BrightAI Workspace Agent
**Task**: M1 — توحيد كامل صفحات `/kernel/*` على القيم الحرفية من `تصميم-صفحات-kernel.md` §1
**Mode**: Senior

## الملخص التنفيذي

الكيرنل كان مخلوط بين هويتين بصريتين: قيم التيل (`#06b6d4`/`#20a597`) القديمة في `tokens.css`،
والهوية المنت/الداكن الجديدة في وثيقة تصميم-صفحات-kernel §1. هذي الخلطة صارت تطلع بصرياً
غير متسق: بعض المكونات تيل وبعضها منت، والجراديانت والتفعيلات (hover/active) مو ثابتة.

الحل المعتمد مع المستخدم: **توحيد كامل الكيرنل** عبر override block داخل `body.kernel-shell`
يحوّل كل التوكنز V3 القديمة إلى القيم الحرفية الجديدة (منت/داكن). النطاق محصور في
`body.kernel-shell` — اللي يُضاف على صفحات kernel بس عبر `kernel-shell.js`. باقي الموقع
(الرئيسية، البلوق، الحلول...) يبقى على هوية التيل بدون أي مساس.

## القرارات الموثقة

| ID | القرار | السبب |
|---|---|---|
| KRN-DS-2026-07-31 | قيم حرفية (مو aliases) داخل override في kernel.css | قرار المستخدم: الكيرنل يتوحّد كامل، ما نوسّع المنت للموقع |
| KRN-A11Y-01 | `--text-low` = `#7a8ba5` بدل `#66748f` | `#66748f` يفشل AA (4.13:1)، `#7a8ba5` يمر (5.56:1) |
| KRN-A11Y-02 | `--brand-700` = `#1b9e80` بدل `#0e3d33` | `#0e3d33` (bright-900) مع نص داكن يفشل AA (1.59:1) في 12 جراديانت + أفاتار المستخدم؛ الجديد يمر (5.73:1) |

## Files Changed

| File | Change Type | Description |
|---|---|---|
| `src/styles/tokens.css` | Edited | Kernel Shell tokens: aliases → قيم حرفية |
| `src/styles/kernel.css` | Edited | override block في `body.kernel-shell` (قسم "0.") + ترتيب layers + تحويل rgba تيل → منت (36+ موضع) + إصلاح أفاتارين + fallback |
| `src/layouts/BaseLayout.astro` | Edited | إزالة `declare global` المكسور + نقل `cspNonce` |
| `src/env.d.ts` | Edited | `cspNonce?: string` في `App.Locals` |
| `src/pages/kernel/models.astro` | Edited | سكربت `window.__kernelModelsPageData` → نمط `define:vars` |

## القيم المطبقة (داخل body.kernel-shell)

- الخلفيات: `--bg-base #080d16` (ink-950)، `--bg-surface #131c30` (surface-800)، `--bg-elevated #1b2740` (surface-700)
- النص: `--text-primary #f2f6ff` (text-hi)، `--text-secondary #a7b4cc` (text-mid)، `--text-muted #7a8ba5` (text-low — KRN-A11Y-01)
- العلامة: `--interactive-primary #2dd4a7` (bright-500)، hover `#5be8c0`، active `#0e3d33`
- brand ramp: `--brand-300/400 #5be8c0`، `--brand-500 #2dd4a7`، `--brand-600 #22b593`، `--brand-700 #1b9e80` (KRN-A11Y-02)

## Verification Results

| Check | Result |
|---|---|
| `npm run build` | ✅ exit 0 (sitemap 240 URLs) |
| `node scripts/lint-tokens.mjs` | ✅ 0 violations |
| `npm run verify:all` | ✅ 16 pass / 0 fail (schema audit 55 صفحة PASS) |
| Playwright `/kernel/` (بعد إضافة class) | ✅ body bg `rgb(8,13,22)`, `--interactive-primary #2dd4a7`, `--text-primary #f2f6ff` |
| Playwright `/kernel/chat/` | ✅ نفس القيم |
| `dist` تحقق | ✅ KernelLayout.css يحتوي override؛ BaseLayout.css (الرئيسية) لسه تيل |

## مشاكل مكتشفة أثناء الشغل (مو من عملنا — كانت تكسر البناء من أصله)

1. `src/layouts/BaseLayout.astro` كان فيه `declare global { namespace App {...} }` في frontmatter
   يكسر esbuild (`Expected ";" but found "App"`) — من commit سابق. أُزيل ونُقل `cspNonce` لـ env.d.ts.
2. `src/pages/kernel/models.astro` كان `window.__kernelModelsPageData` في التوب ليفل من inline script
   يكسر SSR — حوّلته لنمط `define:vars` (نفس نمط redteam/scenarios).

## Risks Remaining

- فشل فحص speakable schema على صفحات `/answer/*` — **مسبق** (آخر تعديل لها `a4c79988` قبل عملنا)، مو من تعديلاتنا.
- `/kernel/` يُحجب بالـ deny-list (`src/server/deny-list.mjs:88`) على الخادم — قائم، الكيرنل مفترض يُخدم prerendered. التحقق البصري تم عبر خادم static عادي بدون deny-list.

## Follow-up Suggestions

- فحص بصري بشري للصفحات التفاعلية (chat, redteam, models) للتأكد من اتساق المنت على العناصر الديناميكية.
- حل فحص speakable على `/answer/*` (مهمة مستقلة).
- تنظيف `BaseLayout.astro.noapp` (أصبح حلولاً مطبقة في الملفات الفعلية).

## Rollback Plan

```bash
git checkout -- src/styles/tokens.css src/styles/kernel.css src/layouts/BaseLayout.astro src/env.d.ts src/pages/kernel/models.astro
npm run build
```

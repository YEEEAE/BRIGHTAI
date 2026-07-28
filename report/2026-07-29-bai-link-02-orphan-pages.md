# BAI-LINK-02 — تدقيق الصفحات اليتيمة

**Date**: 2026-07-29
**Agent**: BrightAI Workspace Agent
**Task**: إنهاء الصفحات اليتيمة بربطها من Footer أو حذفها
**Mode**: Mid

## الملخص التنفيذي

فحصت graph الحالي قبل أي تعديل على الصفحات أو الـ Footer. ما لقيت صفحات يتيمة فعلية؛ `FOOTER_NAV` الموجود يغطي الصفحات اللي كانت ناقصة روابط، والـ graph الرسمي يطلع 0 orphan pages. عشان acceptance criterion يكون قابل للتشغيل، أضفت `scripts/qa/orphan-pages-audit.mjs` في المسار المطلوب.

السكربت يفحص `dist/client/` فقط، ويتجاهل الملفات المكررة الناتجة من بقايا builds مثل `* 2.html`. ويطلع عدد الصفحات اليتيمة وعدد الصفحات اللي عندها أقل من رابطين داخليين.

## الملفات المتأثرة

| File | Change |
|---|---|
| `scripts/qa/orphan-pages-audit.mjs` | أُنشئ سكربت التدقيق بالمسار المطلوب |
| `report/2026-07-29-bai-link-02-orphan-pages.md` | هذا التقرير |
| `.agents/brain.md` | إضافة قيد في change ledger |

ما لمست `src/components/Footer.astro` ولا حذفت أي صفحة، عشان ما فيه orphan pages تحتاج هالشي.

## التحقق

| Check | Result |
|---|---|
| `node scripts/qa/orphan-pages-audit.mjs` | ✅ 211 صفحة، 0 orphan، 0 صفحات بأقل من رابطين |
| `npm run internal-links:audit` architecture graph | ✅ 0 orphan، 0 broken، max click depth 3 |
| `npm run internal-links:audit` broad reference scan | ⚠️ 1490 مراجع مكسورة في نطاق الملفات المولّدة/التاريخية، لكن graph production يطلع 0 broken |
| `npm run build` | ❌ فشل عند `sync-dist-flat.mjs`: `dist/client/ is missing` أثناء خطوة المزامنة |

## المخاطر المتبقية

- أمر `npm run build` ما نجح في هالجولة بسبب `sync-dist-flat.mjs`، وهذا blocker مستقل عن سكربت اليتامى. ما أعدّل `render.yaml` أو build pipeline ضمن هالتكت.
- نتائج broad internal-links scan فيها مراجع تاريخية/مولّدة مكسورة؛ graph production الرسمي ما يعتبرها روابط صفحات منشورة مكسورة.

## قرار التنفيذ

ما فيه سبب آمن لحذف صفحات منشورة أو إضافة روابط مكررة للـ Footer. الحالة المقبولة للـ indexable graph متحققة، والسكربت صار موجود في المسار اللي يعتمد عليه التكت.

## Rollback

حذف الملف الجديد `scripts/qa/orphan-pages-audit.mjs` والـ report وإزالة entry من brain.md يرجّع تغييرات هالتكت.

**verified_production**: no
**verified_production_blocker**: Build blocker في `sync-dist-flat.mjs` + ما فيه production deploy verification.

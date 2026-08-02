# ربط محرر السياسات بالملعب — المرحلة 2 من الربط المشترك M28

**Date**: 2026-08-02
**Agent**: BrightAI Workspace Agent
**Task**: ربط صفحة `/kernel/policies/` بصفحة `/kernel/playground/` بمعرّفات مطابقة تلقائية (M28 — تنقّل موحّد بين صفحات الكيرنل بمعرّفات مشتركة)
**Mode**: Senior

## الملخص التنفيذي

المرحلة 2 من الربط المشترك: قبل هذا التغيير، محرر السياسات (`/kernel/policies/`) والملعب (`/kernel/playground/`)
كانا معزولين — السياسة والكيفية اللي تشتغل فيها محفوظتين في مكانين بدون أي اتصال. الحين من أي صف سياسة
في المحرر فيه زر «جرّبها» يفتح الملعب **مطبّقًا نفس السياسة تلقائيًا** (نوع البيانات + الإجراء + حزمة الامتثال)،
مع شارة إعلامية تقول إن السياسة طُبّقت من المحرر.

أهم تفصيل تقني: الـ editor يستخدم piiTypes مختلفة عن الملعب (`mobile`/`patient_file`/`medical_record`/`salary`
بدل `phone`/`patient_id`/`medical`) وحزم امتثال مختلفة (`nca_ecc`/`iso_27001`/`iso_42001` بدل `nca`/`iso27001`/`iso42001`)،
فتطلّب خرائط تحويل في `kernel-policies.js` عشان الرابط يبني معرّفات صحيحة. السياسات اللي ما لها نظير في الملعب
(مثل `salary`) تاخذ زر معطّل (مو محذوف).

## Files Changed

| File | Change Type | Description |
|---|---|---|
| `public/js/kernel-policies.js` | Edited | خرائط `PG_PII_MAP`/`PG_PACK_MAP`/`PG_ACTION_MAP` + دالة `playgroundLinkFor(p)` + زر «جرّبها» في `renderPoliciesTable()` (`data-po-playground` / `data-po-playground-disabled`) |
| `public/js/kernel-playground.js` | Edited | دالة `applyLinkParams(root)` (بعد `applyHash`) — تقرأ `?pii/action/pack/name`، تفعّل `.pg-toggle[data-pid]` المطابقة، تضبط `[data-context=pack]`، تُظهر `#pg-link-note`، تستدعي `announce()` |
| `src/pages/kernel/playground.astro` | Edited | `<span id="pg-link-note" class="pg-link-note" hidden>` بجانب شارات البادج |
| `kernel/assets/css/pages/playground.css` | Edited | نمط `.pg-link-note` (لون مميز + `[hidden]`) |
| `scripts/playwright/verify-kernel-policies-playground.mjs` | Created | سكربت تحقق Playwright من 4 مراحل |

## معرّفات الربط (الرابط المُنتج)

```
/kernel/playground/?pii=<piiType>&action=<action>&pack=<pack>&name=<urlencoded>
```

- **PG_PII_MAP**: mobile→phone، patient_file→patient_id، medical_record→medical + المطابقة المباشرة (saudi_id/iban/email/credit_card/passport)
- **PG_PACK_MAP**: nca_ecc→nca، iso_27001→iso27001، iso_42001→iso42001
- **PG_ACTION_MAP**: warn→log، local_model_only→block (باقي الأسماء تتطابق مباشرة)

## Verification Results

| Check | Result |
|---|---|
| `npm run build` | ✅ نجح بدون أخطاء |
| Phase A — 10 روابط «جرّبها» بالصيغة الصحيحة + action param | ✅ |
| Phase B — `pr_iban_block_cross` OFF افتراضيًا (بدون params) | ✅ |
| Phase C — `?pii=iban&action=block&pack=sama` → السياسة ON + note ظاهر + pack=sama | ✅ |
| Phase D — `?pii=salary` (بلا نظير) → الافتراضي محفوظ + note مخفي | ✅ |
| Console/page errors أثناء التحقق | ✅ لا شيء |
| `verify:all` | ❌ exit 1 — **كل** الأخطاء الـ6 من ملف قديم مكرر `public/js/kernel-api-data 2.js` (broken-links لـ /v1/*)، غير مرتبط بهذا التغيير |

## Risks Remaining

- **ملاحظة القياس**: القياس الأساسي تم على `pr_iban_block_cross` لأنه OFF افتراضيًا (قياس on=9 غير حاسم لأن 9 مفعّلات افتراضيًا). منطق التفعيل نفسه معمّم، بس المعيار الأوضح كُتب حول سياسة OFF.
- `salary` في الـ editor ما له نظير في الملعب → زر «جرّبها» معطّل عمدًا (`aria-disabled`). لو صار في الملعب سياسة رواتب لاحقًا، نضيفها لـ `PG_PII_MAP`.
- ملف `public/js/kernel-api-data 2.js` القديم يكسر `verify:all` — يستاهل حذف/تصليح في مهمة منفصلة (النسخة الصحيحة `kernel-api-data.js` موجودة).

## Follow-up Suggestions

1. الربطان المتبقيان من M28: **approvals→evidence** (عبر `evidenceHash = hash8(traceId + '|' + action + '|' + (delegateId || '') + '|' + ledgerSeq)` في `kernel-approvals.js` سطر 707) و **replay←parent** (في `public/js/kernel-time-machine.js`).
2. حذف أو تصليح `public/js/kernel-api-data 2.js` (نسخة مكررة قديمة من commit `d0a94eb0`) عشان يرجع `verify:all` أخضر.

## Rollback Plan

```
git checkout -- public/js/kernel-policies.js public/js/kernel-playground.js
git checkout -- src/pages/kernel/playground.astro kernel/assets/css/pages/playground.css
rm scripts/playwright/verify-kernel-policies-playground.mjs
npm run build
```

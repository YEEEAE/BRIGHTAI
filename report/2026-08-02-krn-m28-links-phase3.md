# ربط الموافقات بالدليل + إعادة التشغيل بالأصل — المرحلة 3 والأخيرة من الربط المشترك M28

**Date**: 2026-08-02
**Agent**: BrightAI Workspace Agent
**Task**: إغلاق آخر ربطَين من M28 — (4) من سجل الموافقات كل رابط يفتح الدليل/الدرج بمعرّف مطابق، و(3) آلة الزمن تفتح الدرج المشترك وتعرض نسب إعادة التشغيل بالأصل
**Mode**: Senior

## الملخص التنفيذي

اكتمل **M28 Links Phase 2 بالكامل** بهذه المرحلة (الربطان 3 و4). قبل التغيير، سجل قرارات الموافقات
(`/kernel/approvals/`) كان يعرض `Trace` و`Evidence` و`Certificate` كنص ثابت ما يفتح شيء، وصفوف آلة الزمن
(`/kernel/replay/`) كانت trace مجرد نص، والدرج المشترك ما كان يعرف من وين صارت الرحلة.

الحين:

- **الربط 4 (approvals → evidence)**: من أي صف في سجل القرارات، `Audit {eventId}` رابط حقيقي يفتح سجل التدقيق
  مفلترًا على نفس الـ trace، `Trace` زر يفتح الدرج المشترك، و`Evidence`/`Certificate` روابط تفتح صفحة الدليل
  (`/kernel/evidence/?trace=&evd=`) **وتُبرز ملف الدليل المعني تلقائيًا** (خلفية مميزة + scroll + العدّاد يتحدث إلى «1 من N»).
- **الربط 3 (replay → parent)**: كل trace في جدول «الطلبات المتأثرة» صار زر يفتح الدرج المشترك بسياق الصف نفسه
  (المستخدم/القسم/الحكم)، وزر «افتح الرحلة المحقّقة في الدرج المشترك» يفتح نتيجة التحقيق كاملة. والدرج المشترك
  يعرض شريط نسب: لو الرحلة إعادة تشغيل من أصل، يطلع «↻ إعادة تشغيل من» + زر «افتح الأصل» يرجع يفتح الرحلة الأم.

في الطريق، انكشف **خطأ جوهري كان يكسر زر التشغيل في `/kernel/replay/`** (قائم قبل تعديلاتنا — تأكدنا عبر git stash):
الـ inputs في `replay.astro` كان لها `id="rp-date-from/to"` و`id="rp-dept"` بينما المحرّك (`kernel-time-machine.js`)
يقرأ `data-rp-date-from/to/dept` → الـ selector يرجع `null` وينكسر بخطأ `Cannot read properties of null`.
أُصلح بإضافة الـ data-attributes للـ HTML فصار زر التشغيل يشتغل.

## Files Changed

| File | Change Type | Description |
|---|---|---|
| `public/js/kernel-approvals.js` | Edited | `updateLedger()` — الـ spans صارت روابط/أزرار حقيقية (`Audit` → `<a href="/kernel/audit/?trace=...">`، `Trace` → `<button data-kap-ledger-trace>`، `Evidence`/`Certificate` → `<a href="/kernel/evidence/?trace=&evd=">`) + `bindLedgerEvents()` — delegation يفتح `KernelTraceDrawer.open(traceId)` مع fallback لصفحة التدقيق |
| `src/pages/kernel/evidence.astro` | Edited | `data-trace={item.traceId}` على ملفات الدليل الثابتة + `applyLinkParams()` (بعد `init`) — تقرأ `?trace`/`?evd`، تعيد ضبط الفلاتر، تُبرز `.kernel-evidence-item--linktarget` + scroll + focus، تحدّث العدّاد `[data-kernel-evidence-count]`، تُظهر `.kernel-evidence-linknote` عند عدم تطابق |
| `public/js/kernel-time-machine.js` | Edited | `renderRows()` — خلية الـ trace صارت `<button class="rp-table__trace" data-rp-trace-open>`؛ `bindAffectedTraceLinks()` — delegation على tbody يفتح الدرج بسياق الصف؛ `bindInvestDrawer()` — زر `[data-rp-invest-drawer]` يفتح الرحلة المحقّقة |
| `src/pages/kernel/replay.astro` | Edited | زر «افتح الرحلة المحقّقة في الدرج المشترك» `[data-rp-invest-drawer]` + أيقونة `iconExternal` + **إصلاح البيانات**: `data-rp-date-from/to/dept` على inputs (كانت `id` فقط) |
| `public/js/kernel-drawer.js` | Edited | `showLineage(drawer, run)` داخل `fillFromStore` — لو `run.parentRunId` موجود يظهر شريط «↻ إعادة تشغيل من» + زر `[data-kernel-drawer-open-parent]` يعيد فتح الدرج على الأصل |
| `src/layouts/KernelLayout.astro` | Edited | قسم `.k-trace-drawer__lineage` + بيانات `data-kernel-drawer-lineage/parent/open-parent` |
| `src/styles/kernel.css` | Edited | `.kernel-ap-ledger__link` (+ hover/focus + `prefers-reduced-motion`)، `.kernel-evidence-item--linktarget`، `.kernel-evidence-linknote`، `.k-trace-drawer__lineage` |
| `kernel/assets/css/pages/replay.css` | Edited | `.rp-table__trace` صار زرًا فعليًا (hover/focus) + `.rp-invest-drawer` (رابط بخط متقطع) |
| `scripts/playwright/verify-kernel-approvals-evidence.mjs` | Created | سكربت تحقق Playwright من 4 مراحل (A/B ledger → evidence، C highlight عبر `?trace=`، D replay trace buttons) |

## معرّفات الربط

- **المعرّف المشترك للربط 4**: `traceId` (موجود في بيانات الموافقات والدليل) — تمرير عبر `?trace=` و`?evd=`.
- **المعرّف المشترك للربط 3**: `parentRunId` في `window.KernelEvalStore`؛ الدرج يطابق عبر `findRunTrace(store, traceId)` (بحث في `run.traces`).

## Verification Results

| Check | Result |
|---|---|
| `npm run build` | ✅ نجح بدون أخطاء |
| Playwright Phase A — سجل القرارات: روابط ledger حقيقية (Audit/Trace/Evidence/Cert) + href صحيحة | ✅ |
| Playwright Phase B — نقر زر Trace في ledger يفتح الدرج المشترك | ✅ |
| Playwright Phase C — `/kernel/evidence/?trace=` يُبرز العنصر + العدّاد «1 من 12» + scroll | ✅ |
| Playwright Phase D — replay: 200 زر trace (بنفس رقم صفوف المحاكاة) + النقر يفتح الدرج بسياق الصف | ✅ |
| Console/page errors أثناء التحقق | ✅ لا شيء |
| `npm run performance:budget` | ✅ كل البنود ضمن الميزانية |
| `verify:all` | ❌ exit 1 — **كل** الأخطاء الـ6 من ملف قديم مكرر `public/js/kernel-api-data 2.js` (broken-links لـ /v1/*)، غير مرتبط بهذا التغيير |

## Risks Remaining

- **خطأ جوهري أُصلح**: `data-rp-*` على inputs صفحة replay — هذا كسر موجود كان يمنع تشغيل المحاكاة قبل تعديلاتنا. تأكدنا عبر git stash أنه قائم في main. الإصلاح ثنائي الملفات (HTML + البيانات) — لو رجع بالـ revert لا تنسى إنه ما كان واصل من الأساس.
- ملاحظة: ملف أنماط صفحة replay هو `kernel/assets/css/pages/replay.css` (مستورد بـ `import '../../../kernel/assets/css/pages/replay.css'`) — مو `src/styles/kernel.css`. بعض أنماط kernel تعيش في مسار `kernel/assets/` وليست في `src/styles/`.
- `public/js/kernel-api-data 2.js` (نسخة مكررة قديمة من commit `d0a94eb0`) يكسر `verify:all` — يستاهل حذف/تصليح في مهمة تنظيف منفصلة.

## Follow-up Suggestions

1. **إغلاق M28**: كل الروابط الأربعة صارت شغالة (stats→Store، policies→playground، approvals→evidence، replay→parent). مراجعة يدوية على `astro preview` موصى بها قبل الدفع.
2. حذف أو تصليح `public/js/kernel-api-data 2.js` عشان يرجع `verify:all` أخضر.
3. أخطاء LSP موجودة مسبقًا وغير مرتبطة (لاحظناها أثناء العمل وما لمسناها): `kernel-policy-editor.ts` (PiiTypeId type-only import)، `index.astro` (dataset)، `policies.astro`/`approvals.astro` (jsonLd)، `evidence.astro:441` — ما كانت ضمن نطاق M28.

## Rollback Plan

```
git checkout -- public/js/kernel-approvals.js public/js/kernel-time-machine.js public/js/kernel-drawer.js
git checkout -- src/pages/kernel/evidence.astro src/pages/kernel/replay.astro src/layouts/KernelLayout.astro
git checkout -- src/styles/kernel.css kernel/assets/css/pages/replay.css
rm scripts/playwright/verify-kernel-approvals-evidence.mjs
npm run build
```

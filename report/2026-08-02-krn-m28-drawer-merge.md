# KRN-M28 — دمج درج التدقيق في الدرج المشترك (Drawer Merge)

**Date**: 2026-08-02
**Agent**: BrightAI Workspace Agent
**Task**: توحيد درج الرحلة في /kernel/* — درج واحد بدل درجين
**Mode**: Senior

## الملخص التنفيذي

المشكلة: كانت صفحة `/kernel/audit/` عندها درج تفاصيل خاص بها (`[data-kernel-audit-drawer]` في audit.astro + نظام عرض كامل في kernel-audit.js)، بينما باقي صفحات `/kernel/*` تفتح درج الرحلة المشترك `#k-trace-drawer` (في KernelLayout) عبر `window.KernelTraceDrawer.open()`. النتيجة: كود مكرر، تجربة مختلفة بين الصفحات، وصيانة مزدوجة.

المطلوب مني كان دمج الدرجين حسب خيار "دمج كامل — درج واحد" (اللي اخترته). نقلت كل ميزات درج التدقيق (Trace JSON، DevTools snippet مع زر نسخ، تصدير PDF، نسخ الهاش، رابط ملف الدليل) إلى الدرج المشترك، وحذفت الدرج الخاص نهائيًا — DOM، JS، وCSS.

## ما تغيّر

| File | نوع التغيير | الوصف |
|---|---|---|
| `src/layouts/KernelLayout.astro` | Edited | 4 أقسام تفاصيل جديدة بعد سلسلة الهاش: `[data-kernel-drawer-detail]` (الحالة/الموافقة/الشذوذ/الإجراء) · `[data-kernel-drawer-json]` (Trace JSON مع `json-body`) · `[data-kernel-drawer-snippet]` (مع زر نسخ) · `[data-kernel-drawer-actions]` (نسخ هاش/تصدير PDF/رابط دليل). كلها `hidden` افتراضيًا. خانات الملخص الأربع أخذت `data-label` عشان دالة التصدير. |
| `src/styles/kernel.css` | Edited | كلاسات `.k-trace-drawer__detail` / `__kv` / `__action` / `__trace` / `__action-row` / `__action-btn` الجديدة. وحذفت كل بقايا `.kernel-audit-drawer*` (الكتلة كاملة + 3 مراجع في media queries). |
| `public/js/kernel-drawer.js` | Edited | `fillFromStore` و`fillFromSeed` موسّعان يملآن status/approval/anomaly/action + JSON pretty-printed + snippet، مع `statusAr()` و`toggleSection()`. ربط أزرار: نسخ الهاش، نسخ snippet، تصدير PDF (`exportDrawerPdf()` تفتح نافذة طباعة RTL بالملخص + الحكم + المراحل + سلسلة الهاش). `openDrawer` يعيد ضبط الأقسام عند كل فتح (الدرج مشترك — لا تسريب بين سياقات). |
| `public/js/kernel-audit.js` | Edited | حذف نظام الدرج الخاص. `openDrawer(realIndex)` صارت تبني seed غني وتستدعي `window.KernelTraceDrawer.open(r.traceId, seed)`. `buildTimeline(r)` ترجع المراحل الست بصيغة seed (توافق كامل مع buildStages). `closeDrawer()` توكل للشِل. `bindDrawer()` فارغة. |
| `src/pages/kernel/audit.astro` | Edited | حذف درج `[data-kernel-audit-drawer]` كامل (حوالي 67 سطر DOM ميت). حذف `iconCopy` اللي ما عاد مستخدم. |
| `scripts/playwright/verify-kernel-audit.mjs` | Edited | التحديث للدرج المشترك: traceId من `#k-trace-drawer [data-kernel-trace-id]`، وحالة الفتح من `aria-hidden="false"`. |

## نقاط تصميمية

1. **seed مرن**: الدرج المشترك يقبل seed بقيّم اختيارية. صفحة التدقيق تبعت كل شي متوفر (user, dept, model 'NVIDIA NIM', time, verdict, hashes, status, approval, anomaly, action, json, snippet, stages).
2. **مصدر الحقيقة Store أولًا**: `openDrawer` تجرب `fillFromStore` أول (لو الـ trace مسجّل في KernelEvalStore تشوف آخر البيانات)، وإلا `fillFromSeed` من المتصل، وإلا القيم الافتراضية.
3. **إعادة الضبط عند كل فتح**: `toggleSection(..., false)` للأقسام الأربعة + `delete drawer.dataset.currentHash` — لأن الدرج واحد لكنه يعرض بيانات سياقات مختلفة، وما يصير تسريب.
4. **RTL للتصدير**: `exportDrawerPdf` تبني HTML كامل بـ `dir="rtl"` و`lang="ar"` — الطباعة تطلع صح بالعربي.

## التحقق

| Check | Result |
|---|---|
| `npm run build` | ✅ نجح (chunk `audit_6LMTMIRk.mjs` مبني، 0 بقايا `kernel-audit-drawer` في dist) |
| Playwright `verify-kernel-audit.mjs` | ✅ الصفوف (12,483 سجل) · ✅ البحث · ✅ الفلترة · ✅ verifier (تحقق الهاش ناجح) · ✅ tamper (كشف العبث) · ✅ **shared drawer opened** |
| `rg "kernel-audit-drawer" src/ public/` | ✅ بس تعليق توثيقي واحد في kernel-audit.js |
| `rg "data-kernel-drawer-detail" dist/` | ✅ موجود في KernelLayout chunk |

ملاحظة على فحص console في Playwright: تبقى رسالة `504 (Outdated Optimize Dep)` واحدة — مصدرها Vite dev-toolbar (`@id/astro/runtime/client/dev-toolbar/entrypoint.js`)، مو من سكربتاتنا، وما تظهر في الإنتاج.

## المخاطر المتبقية

- **مشكلة نوع `jsonLd` في صفحات kernel القديمة** (models, evidence, connectors, reports, approvals): موجودة مسبقًا (تمرر مصفوفة بينما `SEOProps.jsonLd` يتوقع كائن). الصفحات الأحدث تستخدم `as unknown as Record<string, unknown>`. أصلحت audit.astro فقط؛ الباقي يحتاج تمريرة تنظيف لاحقة.
- **ترتيب تحميل السكربتات**: `kernel-audit.js` يعتمد على `window.KernelTraceDrawer` (من kernel-drawer.js المحمّل في KernelLayout). الترتيب سليم لأن KernelLayout يلف كل الصفحات، بس لو يوم حذفنا الدرج من الـ layout لازم نتأكد.

## الخطوة التالية المقترحة

- المرحلة 2 من M28: ربط `kernel-stats.js` بقراءة `listRuns()` من KernelEvalStore، ثم ربط policies→playground + approvals↔evidence + replay←parent بنفس نمط الدرج الموحّد.
- تنظيف نوع `jsonLd` في صفحات kernel القديمة الخمس.

## خطة الرجوع

```
git revert <commit-sha>
npm run build
```

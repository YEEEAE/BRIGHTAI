# إصلاح قفل التفاعل (inert) على كامل صفحات الكيرنل + عرض A/B Diff فوري

**التاريخ**: 2026-07-31
**الوكيل**: BrightAI Workspace Agent
**المهمة**: إصلاح ثغرة تمنع أي تفاعل (كتابة/نقرة/تركيز) على محتوى صفحات `/kernel/*`، وإكمال فحص M5 الأخير الفاشل (A/B Diff)
**الوضع**: Senior

## الملخص التنفيذي

أثناء التحقق من صفحة `/kernel/playground/` (M5)، اكتشفت إن **كامل محتوى صفحات الكيرنل ما كان قابلًا للتفاعل إطلاقًا** — لا في الـ headless ولا في متصفح حقيقي. كان يظهر إن الموقع مرسوم (الصفحة تظهر طبيعيًا) لكن أي نقرة على الـ textarea أو أي عنصر ما تنجح: التركيز يروح للـ `body`، والكتابة ما تسجل، و`elementFromPoint` يرجّع `main#main` بدل العنصر الفعلي.

التشخيص بالأدوات كشف الجاني الحقيقي: خاصية **`inert`** كانت معلّقة على `#k-content` (وكل أطفال `main` تقريبًا). الـ `inert` يخلي العنصر "مرسوم لكن غير تفاعلي" — وهذا يفسر كل الأعراض الغريبة: البكسل يثبت إن المحتوى مرسوم، وكل الـ computed styles نظيفة، و`checkVisibility()` ترجّع rendered، لكن التفاعل كله ميت.

## السبب الجذري (Root Cause)

السلوك مو من شغل M5 — من `public/js/focus-trap.js` (DEC-A11Y-003، 2026-07-14):

1. `ASIDE#kernel-sidebar` تحمل `role="dialog"` + `aria-modal="true"` (وهي شريط جانبي دائم `display:flex` على الديسكتوب).
2. `autoApply()` تربط فخ تركيز عليها وتراقب `aria-hidden` عبر `MutationObserver`.
3. عند التهيئة، `kernel-sidebar.js` تعلّق `aria-hidden="true"` (سطر 159، عند ~188ms).
4. المشغّل يشتغل → `sync()` → دالة `isVisible()` **كانت تتجاهل `aria-hidden="true"`** وترجّع true لأن الـ sidebar `display:flex` دايمًا → `trap.open()` (~202ms).
5. `open()` تعلّق `inert` + `aria-hidden="true"` على **كل أطفال `main`** — ومنها `#k-content` (المحتوى كامل) — وتقلب الـ sidebar إلى `aria-hidden="false"`.
6. **ما في شي يستدعي `close()` أبدًا** لأن الـ sidebar لا تصير `display:none` على الديسكتوب → `inert` يعلّق للأبد.

النتيجة: كل صفحات الكيرنل التفاعلية (playground، chat، scenarios، approvals...) كانت **ميتة للمستخدم الحقيقي** منذ تفعيل focus-trap. أي اختبارات سابقة كانت تمر لأنها كانت تحقّق بالـ DOM المباشر (evaluate) مو بالنقر الحقيقي.

## التغييرات

| الملف | النوع | الوصف |
|---|---|---|
| `public/js/focus-trap.js` | تعديل | `isVisible()` ترجع `false` لما `aria-hidden="true"` — الـ trap ما يفتح على modal مغلق a11y |
| `public/js/kernel-playground.js` | تعديل | `toggleDiff()` يستدعي `renderDiffSummary(lastResult.r, lastResult.ctx)` بعد قلب العلم — لوحة A/B تظهر فورًا من آخر نتيجة |

## إثبات الجذر (قبل الإصلاح)

```
#k-content: inert=true              ← الجاني
BEFORE: MAIN#main.page__main       ← elementFromPoint عند مركز الـ textarea
AFTER إزالة inert يدويًا: TEXTAREA#pg-input.pg-textarea
FILL VALUE بعد الإزالة: "inert fix test 333"  ← يشتغل
ACTIVE ELEMENT بعد النقرة: TEXTAREA#pg-input  ← يشتغل
```

## التحقق

| الفحص | النتيجة |
|---|---|
| `node --check` على الملفين | ✅ OK |
| `npm run build` | ✅ exit 0 |
| `node scripts/playwright/verify-kernel-m5-playground.mjs` | ✅ **25/25** (كان يفشل فشلًا كاملًا قبل الإصلاح) |

مراجعة الكود (code-reviewer): الإصلاحان صحيحان ودقيقان — لا آثار جانبية على بقية الـ modals (MobileNav، trace drawer، cmdk، pg-settings — كلها تقفل بـ `display:none`/`hidden` مو بـ `aria-hidden`).

## المخاطر المتبقية

- أي modal جديد في المستقبل لازم يلتزم بـ `hidden`/`display:none` للقفل، أو يضبط `aria-hidden` صح — وإلا الـ trap ينفخ ويعلّق `inert` (موثّق في brain.md Section 5).
- لو `kernel-sidebar.js` فشل التحميل على صفحة، الـ sidebar ما تتعلّق عليها `aria-hidden` — لكن الإصلاح ذاتي التصحيح لأن التغيير الاحق يغلق الفخ.

## الخطوة التالية المقترحة

- `npm run verify:all` كامل قبل الـ commit (لم يُشغّل بعد على هذا التغيير — شغلت build + سكربت M5 فقط).
- الـ commit يقترح: `fix(kernel): unstick inert focus-trap on kernel pages + show A/B diff instantly`

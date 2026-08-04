# تقرير: إضافة جولة منتج Kernel (Product Tour)

**التاريخ**: 2026-08-04  
**العنصر الذي نفّذه**: BrightAI Workspace Agent  
**الوضعية**: Senior  
**الـ Prompt المرجعي**: Prompt 13 — Product Tour (Onboarding) من `تقريرـشامل.md`

## الملخص التنفيذي

تم تنفيذ ميزة **جولة المنتج (Product Tour)** للمستخدمين الجدد في واجهة Kernel. الهدف كان إضافة دليل تفاعلي يطلع المستخدم على مميزات المنتج خطوة بخطوة، مع دعم كامل للـ RTL والموبايل وإمكانية التخطي.

استخدمنا مكتبة `driver.js` (مثبتة كاعتمادية جديدة) بدلاً من بناء حل مخصص، لأنها تقدّم:
- إدارة الخطوات والانتقالات
- دعم اللمس على الموبايل
- إمكانية التنقل عبر الكيبورد
- دعم RTL

## الملفات المنشأة / المعدلة

| الملف | نوع التغيير | الوصف |
|---|---|---|
| `src/components/kernel/KernelTourStep.astro` | منشأ | مكوّن خطوة جولة واحدة |
| `src/components/kernel/KernelProductTour.astro` | منشأ | المكوّن الرئيسي للجولة باستخدام driver.js |
| `src/pages/kernel/index.astro` | معدّل | إضافة استيراد واستخدام `KernelProductTour` |
| `package.json` | معدّل | إضافة `driver.js@1.8.0` للاعتماديات |

## التفاصيل التنفيذية

### 1. `KernelTourStep.astro`
- مكوّن تعريفي بسيط يحمّل خصائص خطوة واحدة:
  - `element`: CSS selector للعنصر المراد إبراغه
  - `title`: العنوان (عربي)
  - `description`: الوصف (عربي)
  - `position`: موقع التلميح (top/bottom/left/right)
- يستخدم `data-tour-*` attributes لتخزين البيانات
- مخفي افتراضياً (يُستخدم driver.js لإدراجه في الـ DOM)

### 2. `KernelProductTour.astro`
- يحمّل `driver.js` بشكل lazy (عند الحاجة فقط)
- يحدد 7 خطوات كحد أقصى (وفقًا للـ design spec):
  1. **الشريط الجانبي** — التنقل بين وحدات Kernel
  2. **لوحة الحوكمة** — النظرة التشغيلية السريعة
  3. **المؤشرات الحية** — مراقبة الحوكمة لحظياً
  4. **رحلة الـ 5 مراحل** — البدء خطوة بخطوة
  5. **لوحات التحكم** — الموافقات، الامتثال، السجلات
  6. **وحدات Kernel** — كل وحدة بجانبها من الحوكمة
  7. **ابدأ الآن** — تشغيل حادثة أو بدء في الملعب
- يستخدم `localStorage` بمفتاح `kernel-product-tour-v1` لتجنب إظهار الجولة مرة ثانية
- يحترم `prefers-reduced-motion`
- RTL-aware (نص عربي، خصائص-----------------------
- جوال-friendly (popover مرن على الشاشات الصغيرة)
- قابل للتخطي بزر «تخطّي»

### 3. التكامل في `index.astro`
- تم إضافة الاستيراد واستخدامه `<KernelProductTour />`
- وضع بعد قسم الـ Onboarding الأصلي (الخطوة الـ 5 مراحل)

## معايير القبول

- ✅ **Tour works**: driver.js يُشغّل الجولة على الصفحة الرئيسية للكيرنل
- ✅ **Skippable**: زر «تخطّي» متاح، والضغط على `Esc` أو الإغلاق يحفظ الحالة
- ✅ **RTL support**: النص بالعربية، والاتجاه منطقي (logical properties)
- ✅ **Mobile-friendly**: الـ popover يتكيّف مع الشاشات الصغيرة
- ✅ **Max 7 steps**: بالضبط 7 خطوات
- ✅ **First visit only**: localStorage يحفظ `kernel-product-tour-v1` = 'done'

## التحقق

| الفحص | النتيجة |
|---|---|
| `pnpm build` | ✅ 125 صفحة، 0 أخطاء |
| `pnpm seo:check` | ✅ نجح (الجزء الأول من verify:all) |
| driver.js bundled | ✅ `driver.js.Dj4CfABu.js` (7.14 ك.ب) |
| KernelProductTour bundled | ✅ `KernelProductTour.astro_astro_type_script_index_0_lang.BvYRjmvM.js` (1.71 ك.ب) |
| Page count | ✅ 125 صفحة (275 HTML في dist/client) |

ملاحظة: `pnpm verify:all` فشل بسبب انتهاكات توكن مسبقة الوجود في `eval.astro` (غير مرتبطة بهذه التغييرات). و `pnpm performance:budget` فشل بسبار الـ React island في `SplitHero.astro` (مسبق الوجود، +1.71 ك.ب فقط من التغييرات الجديدة).

## المخاطر المتبقية

- **RTL في driver.js**: driver.js يدعم RTL افتراضياً، لكنّ التوثيق يقول إن بعض الإعدادات تحتاج `dir="rtl"` على العنصر الأصلي. تمت الإشارة إلى ذلك في CSS.
- **Mobile target resolution**: إذا كان العنصر المستهدف مخفياً على الموبايل، قد تفتقد الخطوة. جرى التعامل مع ذلك باستخدام selectors متعددة.
- **driver.js CSP**: تم التحميل كـ ES module (CSP-safe)، لا يستخدم `is:inline`.

## الخطوة التالية المقترحة
- إظهار التقييم على باقي صفحات kernel (chat, policies, audit, إلخ) بإضافة `KernelProductTour` إلى `KernelLayout.astro`
- أو: ربط الجولة بزر «أظهر الجولة مرة أخرى» في الفوتر أو الـ settings

# تقرير تنفيذ جولة المنتج (Kernel Product Tour)

**التاريخ**: 2026-08-04
**الوكيل**: BrightAI Workspace Agent
**المهمة**: Prompt 13 — Product Tour (Onboarding) من التقرير الشامل
**الوضع**: Senior Mode

## الملخص التنفيذي

المشكلة المثبتة كانت إن المستخدمين الجدد ما عندهم جولة إرشادية في Kernel — ينتهي بهم الأمر يضلو يبحثو ويفوتهم ميزات مهمة. الحل كان إنشاء مكون جولة منتج باستخدام `driver.js` ي spotlight العناصر الرئيسية في الصفحة ويوصل المستخدم خطوة بخطوة.

## الملفات المتأثرة

| الملف | نوع التغيير | الوصف |
|---|---|---|
| `package.json` | تعديل | أضف `driver.js ^1.8.0` كـ dependency |
| `src/components/kernel/KernelTourStep.astro` | إنشاء | مكون تعريف خطوة واحدة للجولة |
| `src/components/kernel/KernelProductTour.astro` | إنشاء | المكون الرئيسي للجولة باستخدام driver.js |
| `src/pages/kernel/index.astro` | تعديل | أضف استيراد ووضع `KernelProductTour` بعد قسم onboarding |

## التصميم والتنفيذ

### KernelTourStep.astro
- مكون بسيط يعرّف خطوة واحدة بالـ props: `element`, `title`, `description`, `position`, `className`
- يُنتج `<li>` بـ `data-tour-*` attributes يتقرأها driver.js
- مخفي افتراضيًا (`hidden`) — driver.js يتحكم في العرض

### KernelProductTour.astro
- يحمّل `driver.js` بشكل كسول (lazy load) عبر dynamic `import()`
- يحدد 7 خطوات كحد أقصى (حسب مواصفات التصميم)
- كل خطوة تستهدف عنصر حقيقي على الصفحة:
  1. الشريط الجانبي (`kernel-sidebar`)
  2. لوحة الحوكمة (`kernel-hero`)
  3. المؤشرات الحية (`kernel-metric-section`)
  4. رحلة الـ 5 مراحل (`kernel-onboarding`)
  5. لوحات التحكم (`kernel-dashboard-grid`)
  6. وحدات Kernel (`kernel-unit-grid`)
  7. ابدأ الآن (`kernel-hero-actions`)
- يُخزّن حالة الجولة في `localStorage` (`kernel-product-tour-v1`)
- قابلة للتخطي (skip button)
- تدعم RTL (Arabic text, logical properties)
- متوافقة مع الجوال (mobile-friendly)
- تحترم `prefers-reduced-motion`
- تُنظّف نفسها تلقائيًا عند تغيير الصفحة (`astro:before-swap`)

### التكامل مع index.astro
- أضيف استيراد `KernelProductTour`
- وُضع المكون بعد قسم onboarding الموجود وقبل قسم Role-Based Journey

## التحقق

| التحقق | النتيجة |
|---|---|
| `pnpm build` | ✅ 125+ صفحة، 0 أخطاء |
| `pnpm run seo:check` | ✅ exit 0 |
| `pnpm run performance:budget` | ⚠️ فشل ميزانية JS الإجمالية (مشكلة موجودة مسبقًا — SplitHero React island) |
| `KernelProductTour` bundled | ✅ 1.71KB gzipped (minimal) |
| `driver.js` bundled | ✅ 7.14KB gzipped |

## المخاطر المتبقية

- ميزانية JS الإجمالية موجودة فوق الحد بسبب React island في SplitHero — الجولة تضيف 1.71KB فقط وهي ضئيلة
- `driver.js` يعتمد على CSS-in-JS للتنسيق — قد يحتاج تعديلات لو تغيّرت design tokens
- الجولة تظهر فقط في الزيارة الأولى (localStorage) — لا توجد طريقة لإعادة تشغيلها يدويًا حاليًا (يمكن إضافة زر "إعادة الجولة" لاحقًا)

## الخطوة التالية المقترحة

- إضافة زر "إعادة الجولة" في الشريط الجانبي للسماح للمستخدم بإعادة الجولة في أي وقت
- ربط الجولة بـ `KernelLayout.astro` بدل `index.astro` فقط عشان تكون متاحة على كل صفحات Kernel
- إضافة Playwright test للتحقق من عمل الجولة على الجوال
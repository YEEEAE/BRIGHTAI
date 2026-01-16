# إصلاح أخطاء Console الشاملة - قائمة المهام

## المرحلة 1: إصلاح الأخطاء الحرجة (JavaScript)

- [x] 1. إصلاح أخطاء Service Worker
  - [x] 1.1 إصلاح خطأ Partial Response (206) في `service-worker.js`
    - تعديل دالة `updateCacheInBackground` لتجاهل status 206
    - تعديل أي مكان آخر يستخدم `cache.put` للتحقق من status
  - [x] 1.2 إصلاح خطأ Headers غير صالحة في `service-worker.js`
    - تعديل دالة `addSEOHeaders` لاستخدام أحرف ASCII فقط
    - استبدال أسماء المدن العربية بالإنجليزية

- [x] 2. إصلاح أخطاء JavaScript
  - [x] 2.1 إصلاح تكرار تعريف debounce في `script.js`
    - إزالة تعريف `debounce` و `throttle` المكرر
    - التأكد من تحميل `js/utils.js` قبل `script.js`
  - [x] 2.2 إصلاح خطأ null addEventListener
    - البحث عن `CustomerServiceChat` في `script.js` الرئيسي
    - إضافة فحص وجود العناصر قبل إنشاء الـ class

## المرحلة 2: إصلاح مسارات الموارد

- [x] 3. تنظيف `Customer/index.html`
  - [x] 3.1 إصلاح DOCTYPE وإزالة السطر الفارغ في البداية
  - [x] 3.2 إزالة أو إصلاح مسارات CSS المفقودة
    - إزالة: `css/design-tokens.css`
    - إزالة أو إصلاح: `background.css`, `css/unified-nav.css`
    - إزالة أو إصلاح: `chatbot.css`, `smart-search.css`
    - إزالة أو إصلاح: `urgency-elements.css`, `cta-buttons.css`
  - [x] 3.3 إزالة أو إصلاح مسارات JavaScript المفقودة
    - إزالة جميع الإشارات لملفات JS غير موجودة
  - [x] 3.4 إصلاح المسار المكرر `Customer/Customer/index.html`
    - البحث عن مصدر هذا المسار وإصلاحه

## المرحلة 3: إصلاح Preloads و PWA

- [x] 4. إصلاح Preloads في `index.html`
  - [x] 4.1 إضافة `crossorigin="anonymous"` لـ preload الخطوط
  - [x] 4.2 إزالة preload لـ `critical-fonts.woff2`
  - [x] 4.3 إزالة preload لـ `Customer/critical-fonts.woff2`
  - [x] 4.4 إزالة preload لـ `Customer/css/design-tokens.css`

- [x] 5. إصلاح Preloads في `our-products.html`
  - [x] 5.1 إضافة `crossorigin="anonymous"` لـ preload الخطوط
  - [x] 5.2 إزالة preload لـ `critical-fonts.woff2`

- [x] 6. إصلاح Preloads في `ai-bots.html`
  - [x] 6.1 إضافة `crossorigin="anonymous"` لـ preload الخطوط
  - [x] 6.2 إزالة preload لـ `critical-fonts.woff2`

- [x] 7. إصلاح `manifest.json`
  - [x] 7.1 استبدال أيقونات الـ URL الخارجية بصور محلية
  - [x] 7.2 التأكد من وجود أحجام متعددة للأيقونات

## المرحلة 4: التحسينات والتنظيف

- [x] 8. معالجة تحذيرات Analytics
  - [x] 8.1 تعديل `advanced-analytics.js` لإزالة تحذير Clarity
    - إما إضافة site ID أو إزالة التحذير

- [x] 9. التعامل مع الموارد الخارجية
  - [x] 9.1 إضافة fallback fonts في CSS
  - [x] 9.2 إضافة onerror للصور الخارجية

- [ ]* 10. معالجة CSP (اختياري)
  - [ ]* 10.1 تحديد مصدر استخدام eval
  - [ ]* 10.2 تحديث CSP headers أو استبدال المكتبة

## التحقق النهائي

- [x] 11. اختبار الإصلاحات
  - [x] 11.1 فتح `ai-bots.html` والتحقق من Console
  - [x] 11.2 فتح `index.html` والتحقق من Console
  - [x] 11.3 فتح `our-products.html` والتحقق من Console
  - [x] 11.4 فتح `Customer/index.html` والتحقق من Console
  - [x] 11.5 التحقق من عمل PWA بشكل صحيح

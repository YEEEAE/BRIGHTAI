# Unminified Assets Fix Report
**Date:** 2026-03-07
**Issue:** `issues with unminified JavaScript and CSS files`

## Root Cause
- سكربت النشر [`scripts/prepare-netlify-publish.mjs`](/Users/yzydalshmry/Desktop/BRIGHTAI/scripts/prepare-netlify-publish.mjs) كان ينسخ الملفات إلى `.netlify-publish` فقط، بدون توليد نسخ `.min` أو إعادة كتابة مراجع HTML.
- تقرير Semrush أظهر في الصفحات **38-41** أن المورد الأكثر تكراراً هو [`assets/css/extracted-inline-styles.css`](/Users/yzydalshmry/Desktop/BRIGHTAI/assets/css/extracted-inline-styles.css)، مع تكرار واسع أيضاً لملفات مثل `main.bundle.css`, `bundle-critical.css`, `navigation.js`, و`main.bundle.js`.

## Changes Applied
- إضافة مرحلة minification داخل [`scripts/prepare-netlify-publish.mjs`](/Users/yzydalshmry/Desktop/BRIGHTAI/scripts/prepare-netlify-publish.mjs).
- توليد نسخ `.min` للأصول التالية داخل `.netlify-publish`:
  - `assets/css/extracted-inline-styles.min.css`
  - `frontend/css/bundle-critical.min.css`
  - `frontend/css/bundle-pages.min.css`
  - `frontend/css/docs.min.css`
  - `frontend/css/main.bundle.min.css`
  - `frontend/css/index-theme.min.css`
  - `frontend/css/unified-nav-search.min.css`
  - `frontend/js/article-ux-enhancements.min.js`
  - `frontend/js/clarity-events.min.js`
  - `frontend/js/docs-scripts.min.js`
  - `frontend/js/index-theme.min.js`
  - `frontend/js/main.bundle.min.js`
  - `frontend/js/navigation.min.js`
  - `frontend/js/sentry-init.min.js`
- إعادة كتابة مراجع HTML داخل artifact النهائي تلقائياً مع الحفاظ على query strings مثل `?v=20260206`.

## Verification
- `node scripts/prepare-netlify-publish.mjs` ✅
- `npm run deploy:source-of-truth:check` ✅
- التحقق داخل `.netlify-publish` أكد عدم بقاء أي مرجع مستهدف إلى النسخ غير المصغّرة ✅

## Expected Post-Deploy Outcome
- اختفاء warning الخاص بـ `issues with unminified JavaScript and CSS files` في recrawl القادم من Semrush.
- تقليل حجم الأصول المنقولة للمستخدم النهائي بدون تعديل منطق الصفحات أو تجربة RTL.

## Note
- هذا الإصلاح يعالج **minification**.
- إذا بقيت ملاحظة `uncompressed JavaScript and CSS files` في Semrush، فهذه تحتاج إعداد ضغط HTTP على مستوى الخادم/CDN وليست نفس المشكلة.

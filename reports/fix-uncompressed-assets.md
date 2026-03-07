# Uncompressed Asset Warning Reduction Report
**Date:** 2026-03-07
**Issue:** `uncompressed JavaScript and CSS files`

## Root Cause
- تقرير Semrush بتاريخ **March 6, 2026** أظهر دليلاً محلياً على الصفحة 56 مرتبطاً بصفحة `about/`.
- داخل المشروع، صفحة [`about/index.html`](/Users/yzydalshmry/Desktop/BRIGHTAI/about/index.html) كانت تتضمن سكربت AdSense خارجي.
- كذلك artifact النهائي كان يحتفظ بمراجع CDN خارجية لـ Sentry على عدد كبير من الصفحات.

## Changes Applied
- تحديث [`scripts/prepare-netlify-publish.mjs`](/Users/yzydalshmry/Desktop/BRIGHTAI/scripts/prepare-netlify-publish.mjs) ليزيل من `.netlify-publish`:
  - وسوم `js.sentry-cdn.com`
  - وسوم `pagead2.googlesyndication.com`
- الإبقاء على [`frontend/js/sentry-init.js`](/Users/yzydalshmry/Desktop/BRIGHTAI/frontend/js/sentry-init.js) داخل artifact النهائي كـ no-op safe إذا لم يوجد `window.Sentry`.
- إعادة بناء `.netlify-publish` بعد التنظيف.

## Verification
- `node scripts/prepare-netlify-publish.mjs` ✅
- `npm run deploy:source-of-truth:check` ✅
- فحص `.netlify-publish` أكد أن عدد الصفحات التي تحتوي `js.sentry-cdn.com` أو `pagead2.googlesyndication.com` أصبح `0` ✅

## Expected Post-Deploy Outcome
- اختفاء الإشارة المحلية الأوضح من تحذير `uncompressed JavaScript and CSS files`.
- تحسن ثبات artifact النهائي وتقليل الاعتماد على موارد خارجية غير ضرورية.

## Note
- إذا بقي التحذير بعد النشر وrecrawl، فالمتبقي سيكون غالباً متعلقاً باستجابات ضغط HTTP على الإنتاج أو بموارد خارجية أخرى خارج سيطرة HTML المحلي.

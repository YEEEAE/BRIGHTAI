# ربط الإنتاج مع Vercel و Netlify و GitHub

## ١) متغيرات الإنتاج المطلوبة

أضف هذه المتغيرات في بيئة الإنتاج:

- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`
- `REACT_APP_DEFAULT_LOCALE=ar-SA`
- `REACT_APP_TIMEZONE=Asia/Riyadh`
- `REACT_APP_ANALYTICS_PROVIDER=ga4` أو `none`
- `REACT_APP_ANALYTICS_KEY` (عند تفعيل `ga4`)
- `REACT_APP_SENTRY_DSN`
- `REACT_APP_SENTRY_TRACES_SAMPLE_RATE=0.15`
- `REACT_APP_RELEASE`

## ٢) أسرار GitHub Actions

أضف الأسرار التالية داخل المستودع في GitHub:

### بيئة المرحلة
- `STAGING_SUPABASE_URL`
- `STAGING_SUPABASE_ANON_KEY`
- `STAGING_ANALYTICS_PROVIDER`
- `STAGING_ANALYTICS_KEY`
- `STAGING_SENTRY_DSN`
- `STAGING_SENTRY_TRACES_SAMPLE_RATE`

### بيئة الإنتاج
- `PROD_SUPABASE_URL`
- `PROD_SUPABASE_ANON_KEY`
- `PROD_ANALYTICS_PROVIDER`
- `PROD_ANALYTICS_KEY`
- `PROD_SENTRY_DSN`
- `PROD_SENTRY_TRACES_SAMPLE_RATE`

### النشر
- `VERCEL_TOKEN`
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`
- `SLACK_WEBHOOK_URL` (اختياري)

## ٣) تفعيل Vercel

1. اربط المشروع بالمستودع.
2. اجعل أمر البناء:
   - `npm run build:prod`
3. اجعل مجلد الإخراج:
   - `build`
4. أضف نفس متغيرات الإنتاج داخل إعدادات Vercel.

## ٤) تفعيل Netlify

1. اربط المشروع بالمستودع.
2. أمر البناء:
   - `npm run build:prod`
3. مجلد النشر:
   - `build`
4. أضف متغيرات الإنتاج نفسها داخل Netlify.

## ٥) فحص قبل النشر

نفّذ محليًا:

1. `npm run verify:prod`
2. `SMOKE_ADMIN_EMAIL=... SMOKE_ADMIN_PASSWORD=... npm run smoke:flow`
3. `npm run build:prod`

عند نجاحها، ادفع التغييرات:

- فرع `develop` => نشر مرحلة
- فرع `main` => نشر إنتاج

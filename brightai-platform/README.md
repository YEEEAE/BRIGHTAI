# BrightAI Platform — دليل التشغيل الفعلي

هذا الملف هو مرجع تشغيل `brightai-platform` في التطوير والإنتاج.  
الهدف منه: تجهيز كل وحدة بشكل عملي، توحيد متغيرات البيئة، وتحديد آلية release/rollback واضحة.

## 1) نظرة تقنية سريعة

| الوحدة | المسار الرئيسي | الوظيفة |
| --- | --- | --- |
| واجهة التطبيق (SPA) | `src/pages` + `src/components` | واجهات المستخدم والتنقل |
| البيانات والمصادقة | `src/lib/supabase.ts` + `supabase/migrations` | Auth + DB + RLS |
| تنفيذ الوكلاء و AI | `src/services/agent-executor` + `src/services/groq.service.ts` | تشغيل الوكلاء وربط نماذج الذكاء |
| الأدوات الخارجية | `src/services/agent.tools.ts` | ربط web search / scrape / email / calendar |
| القياس والمراقبة | `src/lib/analytics.ts` | GA4 + Sentry |
| النشر والبنية | `Dockerfile` + `docker-compose.yml` + `netlify.toml` | بناء وتشغيل الإنتاج |

## 2) المتطلبات

- `Node.js 20.x` (مطابق لإعداد `netlify.toml`)
- `npm 10+`
- مشروع Supabase جاهز (URL + anon key)
- حسابات الخدمات الاختيارية: GA4 / Sentry / Groq

## 3) تشغيل سريع (Local)

```bash
cd brightai-platform
npm ci
cp .env.example .env.local
# عدّل القيم المطلوبة داخل .env.local
npm start
```

التطبيق يعمل افتراضيًا على: `http://localhost:3000`.

## 4) Setup لكل وحدة

### 4.1 وحدة واجهة التطبيق (Frontend)

1. ثبّت الحزم:
   ```bash
   npm ci
   ```
2. أنشئ ملف بيئة تطوير:
   ```bash
   cp .env.example .env.local
   ```
3. عيّن الحد الأدنى المطلوب:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
   - `REACT_APP_DEFAULT_LOCALE=ar-SA`
   - `REACT_APP_TIMEZONE=Asia/Riyadh`
4. شغّل التطبيق:
   ```bash
   npm start
   ```

### 4.2 وحدة البيانات والمصادقة (Supabase)

1. اربط المشروع بـ Supabase (Hosted أو Self-hosted).
2. طبّق الهجرات SQL بترتيبها من `supabase/migrations`:
   - `00001_init_schema.sql`
   - `00002_security_audit.sql`
   - `00003_cleanup_storage_and_admin.sql`
   - `00004_fix_org_users_rls_recursion.sql`
3. تأكد أن مستخدم الاختبار مرتبط بمنظمة داخل جدول `organization_users`.
4. فعّل المتغيرات:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`

### 4.3 وحدة الذكاء وتنفيذ الوكلاء (AI Runtime)

1. التكامل يعمل عبر endpoint داخلي:
   - الواجهة تستدعي `/api/ai/*`
   - Netlify Function تتصل بـ Gemini
2. احفظ المفتاح كسِرّ في Netlify (ولا تضعه في `REACT_APP_*`):
   - `GROQ_API_KEY` (حسب سياسة المشروع الحالية)
   - أو `GEMINI_API_KEY` كبديل
3. عيّن نموذج Gemini الافتراضي على مستوى الخادم:
   - `GEMINI_MODEL=gemini-flash-latest`
4. لتسعير النماذج داخل الواجهة (اختياري):
   - `REACT_APP_GROQ_PRICE_405B`
   - `REACT_APP_GROQ_PRICE_70B`
   - `REACT_APP_GROQ_PRICE_8B`
   - `REACT_APP_GROQ_PRICE_MIXTRAL`
   - `REACT_APP_GROQ_PRICE_GEMMA2`
5. لو بتستخدم الأدوات الخارجية من `AgentTools` فعّل endpoints:
   - `REACT_APP_TOOL_WEBSEARCH_URL`
   - `REACT_APP_TOOL_SCRAPE_URL`
   - `REACT_APP_TOOL_EMAIL_URL`
   - `REACT_APP_TOOL_CALENDAR_URL`

مهم: أي متغير يبدأ بـ `REACT_APP_` يتم تضمينه في حزمة المتصفح. لا تضع مفاتيح سرية عالية الحساسية.

### 4.4 وحدة القياس والمراقبة (Analytics/Observability)

1. فعّل GA4:
   - `REACT_APP_ANALYTICS_PROVIDER=ga4`
   - `REACT_APP_ANALYTICS_KEY=G-XXXXXXX`
2. أو عطّل القياس:
   - `REACT_APP_ANALYTICS_PROVIDER=none`
3. فعّل Sentry (اختياري):
   - `REACT_APP_SENTRY_DSN`
   - `REACT_APP_SENTRY_TRACES_SAMPLE_RATE=0.15`
   - `REACT_APP_RELEASE=brightai-platform@x.y.z`

### 4.5 وحدة النشر (Netlify / Docker)

#### Netlify (موصى به للتطبيق الحالي)

إعدادات البناء الفعلية موجودة في `netlify.toml`:
- Build command: `npm run build:prod`
- Publish directory: `build`
- Functions directory: `netlify/functions`
- Node version: `20`
- Redirect: `/api/ai/*` → `/.netlify/functions/ai/:splat`

متغيرات Netlify المطلوبة لخدمة الذكاء:
- `GROQ_API_KEY` أو `GEMINI_API_KEY`
- `GEMINI_MODEL` (اختياري)
- `AI_RATE_LIMIT_PER_MINUTE` (اختياري)
- `AI_RATE_LIMIT_WINDOW_MS` (اختياري)
- `AI_PROXY_ALLOW_UNAUTHENTICATED=false` للإنتاج

#### Docker + Nginx

```bash
docker build -t brightai-platform:local .
docker compose up -d --build
```

ملفات التشغيل:
- `Dockerfile` يبني عبر Node ثم يخدم عبر Nginx.
- `nginx.conf` يحتوي `/health` endpoint + headers أمنية.
- `docker-compose.yml` يتضمن `frontend` + `nginx-proxy` + `letsencrypt`.

## 5) متغيرات البيئة المطلوبة

القالب الرسمي موجود في:
- `.env.example` (قالب شامل)

التوزيع التشغيلي:
- تطوير محلي: `.env.local`
- إنتاج: `.env.production`
- أسرار Netlify Functions: من لوحة Netlify (Environment variables)

أقل متغيرات إلزامية للتشغيل:
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`
- `REACT_APP_DEFAULT_LOCALE=ar-SA`
- `REACT_APP_TIMEZONE=Asia/Riyadh`

## 6) أوامر الاختبار والبناء

| الأمر | الاستخدام | الملاحظات |
| --- | --- | --- |
| `npm start` | تشغيل التطوير | يعتمد على `.env.local` |
| `CI=true npm run test` | اختبار وحدات بدون watch | مناسب لـ CI |
| `npm run test:coverage` | اختبار + coverage | أبطأ من الاختبار العادي |
| `npm run build` | بناء إنتاج قياسي | يولّد sourcemaps |
| `npm run build:prod` | بناء إنتاج بدون sourcemaps | الأمر المستخدم في Netlify |
| `npm run verify:prod` | فحص اتساق `.env.production` | يفشل إذا القيم الأساسية ناقصة |
| `npm run smoke:flow` | اختبار Supabase (Login/Create/Update/Delete) | يتطلب `SMOKE_ADMIN_EMAIL` و `SMOKE_ADMIN_PASSWORD` |
| `npm run analyze` | تحليل أحجام الحِزم | يعتمد على build سابق |
| `npm run format` | تنسيق ملفات `src` | لا يستهدف كل ملفات المشروع |

ملاحظة تشغيلية: سكربت `npm run lint` مع الإعداد الحالي (`react-scripts`) غير مدعوم فعليًا.

## 7) سياسة Release

### 7.1 قبل الإطلاق (Pre-flight)

نفّذ بالترتيب داخل `brightai-platform`:

```bash
npm ci
CI=true npm run test
npm run build:prod
npm run verify:prod
npm run smoke:flow
```

شروط مرور البوابة:
- جميع الاختبارات تمر.
- `verify:prod` يمر بدون أخطاء.
- smoke test يمر على مستخدم مرتبط بمنظمة.

### 7.2 إصدار النسخة

1. ثبّت رقم الإصدار (Git tag + `REACT_APP_RELEASE`).
2. انشر عبر Netlify (أو Docker بحسب البيئة).
3. نفّذ فحص بعد الإطلاق:
   - تسجيل الدخول
   - فتح Dashboard
   - إنشاء وكيل
   - تعديل وحذف وكيل تجريبي

### 7.3 حوكمة الإطلاق

- أي release بدون `verify:prod` مرفوض.
- أي release بدون smoke test على الإنتاج/المرحلة شبه الإنتاج مرفوض.
- لا يتم تدوير مفاتيح الإنتاج داخل Git؛ فقط عبر Secret Manager للمنصة.

## 8) سياسة Rollback

### 8.1 متى نعمل rollback

- فشل تسجيل الدخول أو إنشاء الوكيل بعد الإطلاق.
- ارتفاع أخطاء الواجهة بشكل واضح عبر Sentry.
- خلل تكامل Supabase يمنع تدفق الأعمال الأساسي.

### 8.2 rollback على Netlify

1. من Netlify Deploys: اختر آخر deploy ناجح.
2. نفّذ "Publish deploy" للنسخة السابقة.
3. أعد فحوصات smoke الأساسية مباشرة بعد الرجوع.

### 8.3 rollback على Docker

1. ارجع إلى tag/commit السابق المستقر.
2. أعد البناء والتشغيل:
   ```bash
   docker compose up -d --build
   ```
3. تحقق من endpoint الصحة:
   - `GET /health` يجب يرجع `ok`.

### 8.4 rollback للبيانات

- هجرات Supabase الحالية لا تحتوي down migrations داخل المشروع.
- عند خطأ migration على الإنتاج:
  1. أوقف نشر التطبيق.
  2. ارجع التطبيق لنسخة سابقة.
  3. نفّذ استعادة قاعدة البيانات من backup/restore point في Supabase.

## 9) مراجع سريعة

- دليل النشر التفصيلي الحالي: `docs/دليل-تثبيت-الإنتاج-والإطلاق.md`
- فحص بيئة الإنتاج: `scripts/verify-production.mjs`
- اختبار smoke: `scripts/smoke-supabase-flow.mjs`

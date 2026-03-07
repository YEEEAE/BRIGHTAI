# BrightAI Platform

مرجع تشغيل مختصر لـ `brightai-platform`.

## المتطلبات

- `Node.js 20+`
- `npm 10+`
- مشروع Supabase جاهز إذا كنت تحتاج المصادقة والبيانات
- Runtime خادمي منفصل لأي أسرار أو API proxy

## التشغيل المحلي

```bash
cd brightai-platform
npm ci
cp .env.example .env.local
npm start
```

## متغيرات البيئة الأساسية

- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`
- `REACT_APP_DEFAULT_LOCALE=ar-SA`
- `REACT_APP_TIMEZONE=Asia/Riyadh`
- `REACT_APP_AI_PROXY_BASE_URL=/api/ai`
- `REACT_APP_AUDIT_ENDPOINT=/api/audit`

## تنبيه أمني

- لا تضع مفاتيح `Gemini` أو `Groq` أو `SUPABASE_SERVICE_ROLE_KEY` داخل أي متغير يبدأ بـ `REACT_APP_`.
- الأسرار يجب أن تبقى في الخادم أو الـ runtime المسؤول عن مسارات `/api/*`.

## النشر

- الواجهة يمكن نشرها على أي استضافة static أو عبر Docker/Nginx.
- طبقة الذكاء والتدقيق يجب أن تعمل على runtime خادمي مستقل.
- إذا كان عندك proxy خارجي، اجعل الواجهة تضرب نفس عقود `/api/ai/*` و `/api/audit`.

## أوامر مهمة

```bash
npm start
CI=true npm run test
npm run build
```

لا يوجد خطوات أخرى داخل هذا الملف، وتم توضيح التشغيل الأساسي بالكامل.

# BrightAI Monorepo

مستودع BrightAI الآن يعمل على فصل واضح بين الواجهة الثابتة وواجهة الـ API الخادمية.

## الوحدات

- `frontend/`: ملفات الواجهة والصفحات الثابتة.
- `backend/`: خادم Node المسؤول عن `Gemini/Groq` وبقية مسارات `/api`.
- `brightai-platform/`: منصة React الداخلية.

## التشغيل المحلي

### الواجهة

```bash
npm run dev:frontend
```

### الـ backend

```bash
npm run dev:backend
```

### المنصة

```bash
npm run dev:platform
```

## الاختبارات

```bash
npm test
```

أوامر منفصلة:

- `npm run test:frontend`
- `npm run test:backend`
- `npm run test:platform`

## النشر الحالي

-  GitHub هو مصدر الحقيقة للكود.
- `backend` يُنشر على Render.
- الرابط الحالي للـ API:
  `https://brightai-92px.onrender.com`

## فحص صحة الـ API

```bash
npm run smoke-test:prod
```

أو مباشرة:

```bash
node scripts/smoke-test-api.mjs https://brightai-92px.onrender.com
```

## أسرار البيئة

- لا تضع أي مفاتيح سرية داخل `frontend` أو أي متغير يبدأ بـ `REACT_APP_`.
- استخدم ملفات `.env.local` غير المتتبعة محلياً.
- للتشفير المحلي قبل حفظ النسخ المشفرة، استخدم:

```bash
node scripts/local-secrets.mjs encrypt --in backend/.env.local --out secrets/backend.env.enc
```

## دفع التغييرات إلى GitHub

```bash
git switch main
git pull --ff-only origin main
git switch -c codex/my-change
git add .
git commit -m "feat: describe change"
git push -u origin codex/my-change
gh pr create --base main --head codex/my-change --fill
```

لا يوجد خطوات أخرى داخل هذا الملف، وتم توضيح الأساسيات بالكامل.

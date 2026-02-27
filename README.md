# BrightAI Monorepo

هذا المستودع الآن مُدار كـ `npm workspaces` بثلاث وحدات مستقلة:

- `frontend` (واجهات static)
- `backend` (Node API + functional tests)
- `brightai-platform` (React platform)

## هيكل الوحدات

| الوحدة | المسار | التشغيل | الاختبار |
|---|---|---|---|
| Frontend | `frontend/` | `npm run dev:frontend` | `npm run test:frontend` |
| Backend | `backend/` | `npm run dev:backend` | `npm run test:backend` |
| BrightAI Platform | `brightai-platform/` | `npm run dev:platform` | `npm run test:platform` |

## استراتيجية التشغيل (بعزل)

- كل وحدة لها `package.json` خاص فيها.
- التشغيل يتم من الجذر عبر workspace محدد، بدون مشاركة runtime command بين الوحدات.
- أوامر الجذر:
  - `npm run dev:frontend`
  - `npm run dev:backend`
  - `npm run dev:platform`

## استراتيجية الاختبار (بعزل)

- `frontend`: اختبارات smoke عبر Node test runner داخل `frontend/tests` فقط.
- `backend`: اختبارات Vitest عبر `backend/vitest.config.mjs` وبنطاق `*.functional.test.js` داخل الوحدة فقط.
- `brightai-platform`: اختبارات `react-scripts test` داخل الوحدة فقط.

## منع تداخل الاختبارات

- لا يوجد أمر عام يعتمد على glob شامل لكل المشروع.
- كل وحدة تُختبر بأمرها المحلي عبر workspace.
- أمر `npm test` في الجذر يشغّل `scripts/run-monorepo-tests.mjs`، وينفّذ الاختبارات للوحدات الثلاث بالتسلسل مع ملخص نهائي منفصل لكل وحدة.

## أمر الاختبار الواحد

```bash
npm test
```

النتيجة المتوقعة:
- إذا نجحت كل الوحدات: يخرج بنجاح.
- إذا فشلت وحدة: يعرض سبب الفشل الخاص بها (مثال: نقص dependencies أو فشل اختبارات)، ثم ينهي بخروج غير صفري.

## تثبيت الحزم

من الجذر:

```bash
npm install
```

أو تثبيت لوحدة محددة:

```bash
npm install --workspace frontend
npm install --workspace backend
npm install --workspace brightai-platform
```

## أوامر إضافية في الجذر

- `npm run sitemap:all`
- `npm run seo:check`
- `npm run performance:budget`
- `npm run deploy:source-of-truth:check`

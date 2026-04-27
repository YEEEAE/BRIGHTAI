# Render Backend Proxy

هذا المجلد صار wrapper خفيف يشغّل الـ backend الرئيسي الموجود في [backend/server.js](/Users/yzydalshmry/Desktop/BRIGHTAI/backend/server.js)، بدل إنشاء proxy منفصل خارج المنظومة.

## الملفات

- `server.js`: wrapper يشغّل الخادم الرئيسي المشترك.
- `package.json`: تعريف تشغيل بسيط لهذا الغرض.

## Environment Variables

- `NVIDIA_API_KEY`
- `DEEPSEEK_API_KEY`
- `DEEPSEEKAI_MODEL`
- `NVIDIA_MODEL` اختياري
- `PORT` اختياري، ويُدار تلقائياً في `Render`

## التشغيل المحلي

```bash
npm install
npm start
```

## المسارات المستخدمة من ContractAI

- `POST /api/ai/chat/completions`
- `POST /api/ai/openai-chat`
- `GET /api/health`

## ملاحظة مهمة

لم يعد هناك `proxyUrl` ثابت داخل الواجهة.  
الواجهة تستخدم الآن `/api` من نفس الدومين عبر [api-config.js](../api-config.js)، وRender يتكفل بإعادة التوجيه إلى خدمة `brightai-api`.

وسيتم أخذ نموذج DeepSeek من `DEEPSEEKAI_MODEL` على مستوى الخادم مباشرة، مع استخدام `NVIDIA_API_KEY` عندما يكون المزود المطلوب هو `nvidia`.

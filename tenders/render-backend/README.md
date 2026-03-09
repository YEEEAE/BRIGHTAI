# Render Backend Proxy

هذا المجلد يحتوي مثال Backend Proxy لحماية مفاتيح `NVIDIA` و`DeepSeek` وعدم كشفها في الـ Frontend.

## الملفات

- `server.js`: خادم `Express` يمرر طلبات المحادثة إلى مزودي الذكاء الاصطناعي.
- `package.json`: تبعيات التشغيل على `Render`.

## Environment Variables

- `NVIDIA_API_KEY`
- `DEEPSEEK_API_KEY`
- `PORT` اختياري، ويُدار تلقائياً في `Render`

## التشغيل المحلي

```bash
npm install
npm start
```

## المسارات

- `POST /api/nvidia/chat`
- `POST /api/deepseek/chat`
- `GET /api/health`

## ملاحظة مهمة

قبل الإنتاج، استبدل قيمة `proxyUrl` داخل [api-config.js](/Users/yzydalshmry/Desktop/BRIGHTAI/tenders/api-config.js) بعنوان خدمة `Render` الفعلي.

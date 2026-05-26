# Local Setup

خطوات التشغيل المحلي تبدأ من نسخ `.env.example` إلى `.env` وضبط مسار Excel والأسرار.

## أوامر أساسية
```bash
npm install
npm start
```

## تحقق سريع
- افتح `http://localhost:3000/pages/index.html`.
- تحقق من `GET /api/health`.
- تحقق من اتصال Excel عبر `/api/data/live-status`.
- تحقق من Gemini إذا `GEMINI_API_KEY` موجود في Backend.
- تحقق من Socket.io عبر تحديث Excel أو مراقبة events.

## ملاحظة
التشغيل الفعلي يحتاج مراجعة واعتماد داخلي قبل الاستخدام الإنتاجي.

## Related Docs
- [Environment Variables](./environment-variables.md)
- [Production Readiness](./production-readiness.md)
- [Troubleshooting](./troubleshooting.md)
- [Security Overview](../05-security/security-overview.md)


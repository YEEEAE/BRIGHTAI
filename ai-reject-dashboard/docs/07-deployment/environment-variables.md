# Environment Variables

المتغيرات المهمة: PORT، NODE_ENV، JWT_SECRET، SESSION_SECRET، GEMINI_API_KEY، GEMINI_MODEL، EXCEL_FILE_PATH، ALLOWED_ORIGINS، DASHBOARD_PASSWORD_HASH، SMTP، وFOCUS_API_TOKEN عند الحاجة.

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


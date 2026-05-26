# Reports API

## Purpose
توثيق endpoints الخاصة بـ Reports API حتى فريق التقنية والاختبار يعرف وش المطلوب وكيف يتحقق منه.

## Base path
`/api/reports`

## Authentication required or not
Required ما عدا download حالياً غير محمي في الكود ويحتاج مراجعة أمنية.

## Permissions required
مستخدم مسجل؛ صلاحيات التقارير تحتاج تأكيد داخلي.

## Request example
```http
POST /api/reports/generate
Content-Type: application/json

{"template":"executive","format":"pdf","sections":["summary"],"filters":{"dateRange":"all","department":"all"},"security":{"watermark":"INTERNAL"},"user":"يزيد"}
```

## Response example
```json
{"success":true,"source":"reports","data":{"id":"rep_...","fileName":"report.pdf"}}
```

## Error responses
- 400 request غير مطابق لـ Joi.
- 401 Unauthorized.
- 404 download غير موجود.
- 410 document expired.

## Related frontend pages
- [Reports Page](../01-pages/reports-page.md)

## Related backend files
- backend/routes/reports.js
- backend/services/reportService.js

## Related docs links
- [Security Overview](../05-security/security-overview.md)
- [Testing Strategy](../06-testing/testing-strategy.md)


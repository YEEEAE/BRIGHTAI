# Health API

## Purpose
توثيق endpoints الخاصة بـ Health API حتى فريق التقنية والاختبار يعرف وش المطلوب وكيف يتحقق منه.

## Base path
`/api/health`

## Authentication required or not
Not required حسب الكود الحالي.

## Permissions required
لا يوجد.

## Request example
```http
GET /api/health
```

## Response example
```json
{"success":true,"data":{"status":"ok","gemini_configured":false,"excel_exists":true}}
```

## Error responses
- 500 فشل داخلي غير متوقع.

## Related frontend pages
- [Technical Page](../01-pages/technical-page.md)
- [Local Setup](../07-deployment/local-setup.md)

## Related backend files
- backend/routes/health.js
- backend/services/dataService.js

## Related docs links
- [Security Overview](../05-security/security-overview.md)
- [Testing Strategy](../06-testing/testing-strategy.md)


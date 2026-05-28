# Rejects API

## Purpose
توثيق endpoints الخاصة بـ Rejects API حتى فريق التقنية والاختبار يعرف وش المطلوب وكيف يتحقق منه.

## Base path
`/api/rejects`

## Authentication required or not
Required.

## Permissions required
مستخدم مسجل حسب صفحة الوصول.

## Request example
```http
GET /api/rejects?source=excel&search=item
```

## Response example
```json
{"success":true,"data":{"count":1,"rejects":[]}}
```

## Error responses
- 400 query غير صالح.
- 401 Unauthorized.
- 500 فشل قراءة البيانات.

## Related frontend pages
- [Index Page](../01-pages/index-page.md)
- [Quality Page](../01-pages/quality-page.md)
- [Production Page](../01-pages/production-page.md)

## Related backend files
- backend/routes/rejects.js
- backend/services/dataService.js

## Related docs links
- [Security Overview](../05-security/security-overview.md)
- [Testing Strategy](../06-testing/testing-strategy.md)


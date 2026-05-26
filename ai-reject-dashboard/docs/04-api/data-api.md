# Data API

## Purpose
توثيق endpoints الخاصة بـ Data API حتى فريق التقنية والاختبار يعرف وش المطلوب وكيف يتحقق منه.

## Base path
`/api/data`

## Authentication required or not
Required.

## Permissions required
مستخدم مسجل؛ بعض الاستخدامات التقنية قد تحتاج دور Technical/Admin حسب السياسة النهائية.

## Request example
```http
GET /api/data/live-status
```

## Response example
```json
{"success":true,"source":"excel","data":{"excel_exists":true,"record_count":120}}
```

## Error responses
- 401 Unauthorized.
- 404 endpoint غير موجود.
- Excel unavailable يرجع warnings أو fallback.

## Related frontend pages
- [Index Page](../01-pages/index-page.md)
- [Technical Page](../01-pages/technical-page.md)

## Related backend files
- backend/routes/data.js
- backend/services/excelService.js
- backend/services/dataService.js

## Related docs links
- [Security Overview](../05-security/security-overview.md)
- [Testing Strategy](../06-testing/testing-strategy.md)


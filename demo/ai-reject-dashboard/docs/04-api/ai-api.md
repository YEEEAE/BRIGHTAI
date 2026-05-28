# AI API

## Purpose
توثيق endpoints الخاصة بـ AI API حتى فريق التقنية والاختبار يعرف وش المطلوب وكيف يتحقق منه.

## Base path
`/api/ai`

## Authentication required or not
Required.

## Permissions required
مستخدم مسجل، والقيود التفصيلية حسب دور الصفحة.

## Request example
```http
POST /api/ai/chat
Content-Type: application/json

{"message":"وش أعلى المخاطر؟","conversation_id":"conv_1","context":{"page":"quality"}}
```

## Response example
```json
{"success":true,"source":"gemini","answer":"...","conversation_id":"conv_1"}
```

## Error responses
- 400 سؤال قصير/طويل أو payload غير صالح.
- 401 Unauthorized.
- AI unavailable عند غياب Gemini أو فشل الاتصال مع fallback حسب الخدمة.

## Related frontend pages
- [Index Page](../01-pages/index-page.md)
- [Quality Page](../01-pages/quality-page.md)
- [Executive Page](../01-pages/executive-page.md)

## Related backend files
- backend/routes/ai.js
- backend/services/aiService.js
- backend/services/conversationMemoryService.js

## Related docs links
- [Security Overview](../05-security/security-overview.md)
- [Testing Strategy](../06-testing/testing-strategy.md)


# Session Memory

## الحالة
Status: Implemented.

## Frontend
`frontend/assets/js/ai-assistant.js` يستخدم sessionStorage لحفظ conversation id وسجل عرض المحادثة محلياً في جلسة المتصفح.

## Backend
`conversationMemoryService.js` يستخدم Memory Map فقط. لا يوجد تخزين دائم في SQLite للمحادثات.

## الحدود
- TTL: 30 دقيقة للجلسات غير النشطة.
- Max messages: 20 رسالة لكل conversation.
- Cleanup: كل 10 دقائق.
- No permanent storage: مطبق حالياً.

## Related Docs
- [صقر AI Overview](./saqr-ai-overview.md)
- [AI API](../04-api/ai-api.md)
- [Environment Secrets](../05-security/environment-secrets.md)
- [AI Test Cases](../06-testing/ai-test-cases.md)


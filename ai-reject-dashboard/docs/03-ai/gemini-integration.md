# Gemini Integration

## الحالة
Status: Implemented. التكامل موجود في `backend/services/aiService.js` باستخدام `@google/generative-ai`.

## النموذج
Gemini AI Model Flash 2.5، والقيمة الافتراضية في env هي `gemini-2.5-flash`.

## الأمان
- `GEMINI_API_KEY` يحفظ في `.env` على السيرفر فقط.
- Frontend لا يستدعي Gemini مباشرة.
- عند عدم وجود المفتاح، يستخدم النظام تحليل محلي أو fallback حسب endpoint.

## تقليل البيانات
لا نرسل كل Excel للنموذج بشكل افتراضي. المطلوب إرسال ملخصات وسجلات مختارة وسياق الصفحة والسؤال فقط.


## Related Docs
- [AI API](../04-api/ai-api.md)
- [Security Overview](../05-security/security-overview.md)
- [Prompt Injection Protection](./prompt-injection-protection.md)
- [AI Test Cases](../06-testing/ai-test-cases.md)


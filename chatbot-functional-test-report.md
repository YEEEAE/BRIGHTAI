# Chatbot Functional Test Report
**Date:** 2026-02-23
**Scope:** `/api/groq/stream` production integration for chatbot pages
**Test Command:** `npm run test -- backend/groq-stream.functional.test.js`
**Result:** ✅ PASS (4/4)

## Scenarios Covered
| Scenario | Expected Behavior | Actual Result | Status |
|---------|-------------------|---------------|--------|
| Success | SSE returns `sessionId`, streams tokens, closes with `[DONE]` | تم استلام `sessionId` + tokens + `[DONE]` | ✅ |
| Upstream Error | Endpoint emits structured stream error payload | رجع `errorCode=GROQ_STREAM_ERROR` مع إنهاء البث | ✅ |
| Timeout | Upstream delay triggers timeout classification | رجع `errorCode=STREAM_TIMEOUT` مع إنهاء البث | ✅ |
| Rate Limit | Upstream 429 is mapped for frontend retry handling | رجع `errorCode=RATE_LIMIT_EXCEEDED` مع إنهاء البث | ✅ |

## Notes
- الاختبارات وظيفية على مستوى `handleRequest` بمحاكاة upstream (mocked fetch) لضمان ثبات النتائج داخل بيئة التنفيذ الحالية.
- تم التحقق من مسارات الخطأ التي تحتاجها الواجهة: عرض خطأ، وإتاحة إعادة المحاولة، وتصنيف واضح للسبب.

## Recommendation
- تشغيل نفس الاختبارات ضمن CI قبل كل نشر، مع إضافة اختبار staging E2E لاحقاً ضد Groq proxy فعلي.

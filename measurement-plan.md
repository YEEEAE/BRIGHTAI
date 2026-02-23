# Measurement Plan — Production Chatbot via Groq Gateway
**Deploy Date:** 2026-02-23

## KPI Target
- KPI: `chatbot_stream_success_rate`
- Baseline: غير موثّق حالياً (يُجمع خلال أول 7 أيام تشغيل)
- Goal: >= 98% إكمال جلسات البث بدون خطأ

## Tracking Event
- Event Name: `chatbot_stream_completed`
- Trigger: اكتمال SSE مع `[DONE]` بدون `errorCode`
- Payload: `sessionId`, `botProfile`, `outputType`, `latencyMs`, `tokenCountApprox`, `retryUsed`

## Success Criteria
- Minimum Improvement: خفض معدل فشل الطلبات >= 60% مقابل الإصدار السابق (الذي كان يعتمد مفاتيح مكشوفة/اتصال مباشر)
- Evaluation Window: 14 يوم
- Rollback Trigger: انخفاض `chatbot_stream_success_rate` أقل من 95% لمدة 24 ساعة أو ارتفاع `STREAM_TIMEOUT` فوق 8%

## Additional Events
- `chatbot_stream_failed`: عند ظهور `errorCode` (مثل `STREAM_TIMEOUT` أو `RATE_LIMIT_EXCEEDED`)
- `chatbot_retry_clicked`: عند ضغط المستخدم على زر إعادة المحاولة
- `chatbot_request_started`: بداية طلب جديد مع profile ونوع المخرجات

## Validation Method
- المنصة: GA4 أو endpoint analytics داخلي
- تحقق البيانات: مقارنة daily event totals مع server logs على نفس الفترة
- جودة البيانات: مطابقة `sessionId` المجهول (بدون محتوى محادثة) للتحقق من الاتساق فقط

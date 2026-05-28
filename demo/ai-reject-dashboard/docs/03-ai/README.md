# AI Section Guide

أنا يزيد، QC Compliance في شركة ميس. هذا القسم يشرح `صقر AI` وحدود استخدامه داخل المشروع. كتبته عشان يكون واضح أن الذكاء الاصطناعي هنا مساعد استشاري، وليس جهة اعتماد جودة أو بديل عن QCM/QAM.

## وش فايدة هذا القسم؟
- يثبت اسم النموذج: `صقر AI` بدون ترجمة أو تغيير.
- يشرح تكامل Gemini من Backend فقط.
- يوضح البيانات المسموح إرسالها للنموذج.
- يوثق Session Memory وحدودها.
- يحدد قواعد الرفض، خصوصاً الخروج عن نطاق شركة ميس أو كشف الأسرار.

## متى تستخدمه؟
- عند اختبار أسئلة `صقر AI`.
- عند مراجعة مخاطر AI مع دكتور اسلام QCM.
- عند التأكد أن Gemini key غير موجود في Frontend.
- عند تحديث system prompts أو حماية prompt injection.

## ملفات القسم
- [صقر AI Overview](./saqr-ai-overview.md): تعريف الدور والقيود.
- [Gemini Integration](./gemini-integration.md): كيف يتم الاتصال بـ Gemini.
- [System Prompts](./system-prompts.md): التعليمات العامة وتعليمات الصفحات.
- [Session Memory](./session-memory.md): ذاكرة الجلسة في Frontend وBackend.
- [AI Safety Rules](./ai-safety-rules.md): قواعد السلامة والرفض.
- [Prompt Injection Protection](./prompt-injection-protection.md): حماية من محاولات كسر التعليمات.

## حدود لا نتجاوزها
- `صقر AI` لا يعتمد CAPA نهائياً.
- `صقر AI` لا يكشف أسرار أو مفاتيح.
- `صقر AI` لا يخرج عن نطاق شركة ميس والعمل المكلف له.
- قرارات الجودة النهائية ترجع إلى QCM/QAM حسب الإجراء الداخلي.

## Related Docs
- [AI API](../04-api/ai-api.md)
- [Security Overview](../05-security/security-overview.md)
- [AI Test Cases](../06-testing/ai-test-cases.md)

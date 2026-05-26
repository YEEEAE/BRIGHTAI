# Security Section Guide

أنا يزيد، QC Compliance في شركة ميس. هذا القسم مخصص لضوابط الأمان اللي لازم ننتبه لها قبل أي تجربة موسعة أو تشغيل فعلي. كتبته بصيغة عملية عشان ما تضيع النقاط المهمة بين الكود والاجتماعات.

## وش فايدة هذا القسم؟
- يحدد وين تحفظ الأسرار.
- يوضح أن `GEMINI_API_KEY` ممنوع يكون في Frontend.
- يشرح Auth/RBAC وجلسات المستخدم.
- يوثق audit logging وما يحتاج مراجعة.
- يربط أمن AI بـ prompt injection وdata minimization.

## متى تستخدمه؟
- قبل مشاركة النظام مع مستخدمين جدد.
- عند ضبط `.env` أو إعداد بيئة جديدة.
- عند مراجعة صلاحيات المستخدمين مع دكتور اسلام QCM.
- قبل أي قرار جاهزية إنتاجية يطلع للإدارة.

## ملفات القسم
- [Security Overview](./security-overview.md): ملخص الضوابط.
- [Environment Secrets](./environment-secrets.md): الأسرار والمتغيرات الحساسة.
- [Auth & RBAC](./auth-rbac.md): المصادقة والصلاحيات.
- [Audit Logging](./audit-logging.md): السجلات والتتبع.
- [Deployment Security](./deployment-security.md): checklist أمان قبل النشر.

## قواعد ثابتة
- لا أسرار في HTML أو CSS أو browser-side JS.
- لا اعتماد جودة من `صقر AI`.
- أي ضعف أمني واضح يصنف `Needs Verification` أو `Not Implemented` حسب الواقع.

## Related Docs
- [Prompt Injection Protection](../03-ai/prompt-injection-protection.md)
- [Production Readiness](../07-deployment/production-readiness.md)
- [Known Limitations](../08-decisions/known-limitations.md)

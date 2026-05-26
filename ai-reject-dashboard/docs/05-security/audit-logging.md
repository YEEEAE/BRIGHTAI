# Audit Logging

يوجد audit في routes مهمة مثل AI، reports، rejects، auth/admin. السجلات تستخدم logs وSQLite لبعض عمليات المستخدمين. retention والسياسة النهائية Needs Verification.

## قواعد ثابتة
- الأسرار تحفظ في `.env` أو بيئة السيرفر فقط.
- ممنوع وضع GEMINI_API_KEY في Frontend.
- صقر AI لا يملك قرار جودة نهائي.
- مخرجات "صقر AI" استشارية فقط، ولا تعتبر قرار جودة نهائي. قرارات الجودة النهائية ترجع إلى QCM/QAM حسب الإجراء الداخلي.

## Related Docs
- [Environment Secrets](./environment-secrets.md)
- [Auth & RBAC](./auth-rbac.md)
- [AI Safety Rules](../03-ai/ai-safety-rules.md)
- [Production Readiness](../07-deployment/production-readiness.md)


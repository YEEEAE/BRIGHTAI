# Deployment Security

قبل الإنتاج لازم تفعيل secrets قوية، allowed origins دقيقة، HTTPS، secure cookies، حماية download reports، ومراجعة عدم ظهور أي أسرار في HTML/JS.

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


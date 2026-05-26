# Deployment Section Guide

أنا يزيد، QC Compliance في شركة ميس. هذا القسم يشرح التشغيل المحلي والاستعداد للإنتاج من زاوية عملية: كيف نشغل، وش نضبط، وش نفحص إذا صار خطأ. مو الهدف هنا إعطاء اعتماد إنتاجي، بل ترتيب متطلبات التشغيل قبل المراجعة.

## وش فايدة هذا القسم؟
- يعطي خطوات تشغيل محلي واضحة.
- يوضح متغيرات البيئة المطلوبة.
- يشرح فحص Excel وGemini وSocket.io.
- يحدد checklist الإنتاج قبل أي استخدام فعلي.
- يجمع مشاكل التشغيل الشائعة وحلولها.

## متى تستخدمه؟
- عند تشغيل المشروع على جهاز جديد.
- عند تغيير `.env`.
- عند فشل اتصال Excel أو Gemini.
- قبل عرض جاهزية النظام على QCM أو Factory Director.

## ملفات القسم
- [Local Setup](./local-setup.md): تشغيل محلي خطوة بخطوة.
- [Production Readiness](./production-readiness.md): checklist قبل الإنتاج.
- [Environment Variables](./environment-variables.md): المتغيرات المطلوبة والحساسة.
- [Troubleshooting](./troubleshooting.md): حلول المشاكل الشائعة.

## تنبيه
أي تشغيل فعلي يحتاج مراجعة واعتماد داخلي. وجود النظام يعمل محلياً لا يعني أنه Production-ready.

## Related Docs
- [Security Overview](../05-security/security-overview.md)
- [UAT Checklist](../06-testing/uat-checklist.md)
- [Pending Decisions](../08-decisions/pending-decisions.md)

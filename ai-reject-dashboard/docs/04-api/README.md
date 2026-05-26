# API Section Guide

أنا يزيد، QC Compliance في شركة ميس. هذا القسم يوثق واجهات Backend API اللي تعتمد عليها الصفحات. الفائدة هنا إن فريق التقنية والاختبار يقدرون يعرفون كل endpoint وش يرجع، وهل يحتاج تسجيل دخول، وأي صفحة تستخدمه.

## وش فايدة هذا القسم؟
- يربط الصفحات بالـ API endpoints الفعلية.
- يوضح المصادقة والصلاحيات بشكل عملي.
- يعطي أمثلة request/response قابلة للاختبار.
- يوضح حالات الخطأ المتوقعة.
- يساعدنا نعرف هل المشكلة من الواجهة أو من Backend.

## متى تستخدمه؟
- عند اختبار API عبر المتصفح أو Postman.
- عند ظهور 401 أو 400 أو 500.
- عند مراجعة صلاحيات endpoint مع QCM/QAM.
- عند تعديل Frontend يعتمد على API.

## ملفات القسم
- [API Overview](./api-overview.md): خريطة عامة لكل API.
- [Auth API](./auth-api.md): login، profile، sessions، 2FA.
- [Data API](./data-api.md): حالة Excel، schema، refresh، live-status.
- [Rejects API](./rejects-api.md): سجلات المرفوضات والفلاتر.
- [Reports API](./reports-api.md): القوالب، الإنشاء، التحميل، الجدولة.
- [AI API](./ai-api.md): صقر AI، Gemini، chat، CAPA، anomalies.
- [Health API](./health-api.md): حالة النظام والاتصال.

## ملاحظة مراجعة
أي endpoint يرجع بيانات حساسة أو يسمح بتحميل ملفات يحتاج مراجعة أمنية قبل الإنتاج، خصوصاً تحميل التقارير.

## Related Docs
- [Security Overview](../05-security/security-overview.md)
- [Testing Strategy](../06-testing/testing-strategy.md)
- [Pages Documentation](../01-pages/README.md)

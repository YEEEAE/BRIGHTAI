# Pages Section Guide

أنا يزيد، QC Compliance في شركة ميس. هذا القسم يوثق صفحات `ai-reject-dashboard` صفحة صفحة، عشان ما يصير فهم النظام معتمد على الواجهة فقط أو على كلام شفهي. كل صفحة لها ملف يشرح وش تسوي، من يستخدمها، وش مصدر بياناتها، وش endpoints اللي تعتمد عليها.

## وش فايدة هذا القسم؟
- يساعد فريق الجودة والإنتاج والمالية يعرفون وظيفة كل شاشة.
- يساعد فريق التقنية يعرف علاقة الصفحة بالـ Backend API.
- يساعد فريق الاختبار يراجع حالات Loading وEmpty وError وUnauthorized.
- يوضح وين يدخل `صقر AI` في كل صفحة، وش الأسئلة المسموحة والمرفوضة.

## متى تستخدمه؟
- عند اختبار صفحة محددة في UAT.
- عند وجود خطأ في صفحة وتحتاج تعرف مصدر البيانات.
- عند مراجعة صلاحيات صفحة مع دكتور اسلام QCM.
- عند تجهيز عرض مختصر للإدارة عن شاشات النظام.

## ملفات الصفحات
- [Index Page](./index-page.md): الصفحة العامة ومؤشرات البداية.
- [Executive Page](./executive-page.md): ملخص تنفيذي ومخاطر عالية المستوى.
- [Finance Page](./finance-page.md): الأثر المالي والهدر والتنبيهات.
- [Quality Page](./quality-page.md): الجودة، CAPA، Root Cause، ومخاطر QMS.
- [Production Page](./production-page.md): التشغيل، الدفعات، والماكينات.
- [Workflow Page](./workflow-page.md): حوكمة سير العمل وحدود read-only.
- [Technical Page](./technical-page.md): التكاملات والأمان وAPI.
- [Reports Page](./reports-page.md): بناء التقارير وسجلها وجدولتها.
- [Profile Page](./profile-page.md): الملف الشخصي والأمان والجلسات.
- [Admin Users Page](./admin-users-page.md): إدارة المستخدمين والصلاحيات.

## معيار المراجعة
كل وثيقة صفحة لازم تجاوب على سؤال بسيط: لو فتحها موظف جديد، هل يعرف وش تسوي الصفحة، وش يختبر، ومتى يصعد الموضوع لـ QCM/QAM؟

## Related Docs
- [Data API](../04-api/data-api.md)
- [صقر AI Overview](../03-ai/saqr-ai-overview.md)
- [Testing Strategy](../06-testing/testing-strategy.md)

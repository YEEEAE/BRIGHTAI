# Testing Section Guide

أنا يزيد، QC Compliance في شركة ميس. هذا القسم هو دفتر الاختبار العملي للمشروع. الهدف منه إن UAT ما يكون عشوائي، وكل فريق يعرف وش يختبر وكيف يسجل الملاحظات.

## وش فايدة هذا القسم؟
- يعطي خطة اختبار شاملة للصفحات والـ API وExcel و`صقر AI`.
- يوثق اختبار تحديث Excel الأسبوعي.
- يراجع رفض الأسئلة خارج نطاق شركة ميس.
- يتأكد أن اسم `صقر AI` ثابت.
- يراجع أن الوثائق ما تدعي ميزات غير موجودة.

## متى تستخدمه؟
- قبل جلسة UAT مع فريق الجودة أو الإنتاج.
- بعد أي تعديل على Excel mapping.
- بعد أي تعديل على AI prompts أو API.
- قبل إبلاغ دكتور اسلام QCM بحالة التجربة.

## ملفات القسم
- [Testing Strategy](./testing-strategy.md): الخطة العامة.
- [UAT Checklist](./uat-checklist.md): قائمة اختبار قبول المستخدم.
- [Excel Update Test](./excel-update-test.md): اختبار التحديث الأسبوعي.
- [AI Test Cases](./ai-test-cases.md): اختبارات `صقر AI` وGemini.
- [Regression Checklist](./regression-checklist.md): اختبار عدم كسر شيء بعد التعديل.

## طريقة تسجيل النتيجة
استخدم الحالات التالية بوضوح: `Pass`, `Fail`, `Blocked`, `Needs Verification`. وإذا كانت الملاحظة تخص اعتماد جودة، ترفع لـ QCM/QAM حسب الإجراء الداخلي.

## Related Docs
- [Pages Documentation](../01-pages/README.md)
- [Data Section Guide](../02-data/README.md)
- [AI Section Guide](../03-ai/README.md)

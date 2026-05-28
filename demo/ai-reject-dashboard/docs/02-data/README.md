# Data Section Guide

أنا يزيد، QC Compliance في شركة ميس. هذا القسم يركز على البيانات، وخصوصاً ملف Excel اللي يعتبر مصدر التجربة الحالي. الهدف إننا نعرف بالضبط من وين تجي البيانات، كيف تنقرأ، وش يصير إذا الملف ناقص أو الأعمدة تغيرت.

## وش فايدة هذا القسم؟
- يوثق مسار Excel الأساسي: `/BRIGHTAI/reports/internal-links/ALL_ITEMS_MAIS_with_life_years.xlsx`.
- يحدد الأعمدة المتوقعة قبل الاختبار.
- يشرح أن القراءة لازم تكون من Backend فقط.
- يعطي قواعد التعامل مع البيانات الناقصة أو Grand Total أو التواريخ غير الصحيحة.
- يساعد فريق الجودة يفرق بين مشكلة بيانات ومشكلة نظام.

## متى تستخدمه؟
- عند تحديث Excel الأسبوعي.
- عند ظهور سجلات ناقصة أو أرقام غير منطقية.
- عند مراجعة mapping الأعمدة مع فريق التقنية.
- قبل اختبار UAT الخاص بالبيانات.

## ملفات القسم
- [Excel Data Source](./excel-data-source.md): المسار، التحديث الأسبوعي، وحالات الملف.
- [Excel Schema](./excel-schema.md): الأعمدة المتوقعة وتغيرات الأسماء.
- [Data Processing](./data-processing.md): كيف يحول Backend الصفوف إلى سجلات قابلة للعرض.
- [Realtime Updates](./realtime-updates.md): مراقبة Excel وSocket.io.
- [Data Quality Rules](./data-quality-rules.md): قواعد جودة البيانات قبل الاعتماد على النتائج.

## ملاحظة مهمة
إذا البيانات نفسها غير مكتملة، `صقر AI` والصفحات راح يطلعون نتائج استشارية مبنية على مدخلات ناقصة. هنا لازم نرفعها كـ `Needs Verification` بدل ما نعتبرها خلل نهائي.

## Related Docs
- [Data API](../04-api/data-api.md)
- [Excel Update Test](../06-testing/excel-update-test.md)
- [Troubleshooting](../07-deployment/troubleshooting.md)

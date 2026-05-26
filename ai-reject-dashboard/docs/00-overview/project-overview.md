# Project Overview

هذه الوثائق تم إعدادها بصياغة داخلية بواسطة يزيد، QC Compliance في شركة ميس، لدعم تجربة واختبار مشروع ai-reject-dashboard قبل الاستخدام الفعلي، وتحت مراجعة QCM دكتور اسلام والإدارة العامة للمصنع بقيادة Factory Director المهندس عبدالرحمن.

## وش هو المشروع
ai-reject-dashboard هو Prototype داخلي لتحليل بيانات المرفوضات والمخزون والعمر الافتراضي في شركة ميس. النظام يعرض مؤشرات تشغيلية ومالية وجودة، ويربط صقر AI كطبقة استشارية فقط.

## الحالة الحالية
Status: Pilot-ready من ناحية الفكرة والتجربة، وليس Production-ready قبل اعتماد داخلي، اختبار UAT، ومراجعة أمنية.

## مصدر البيانات
المصدر الأساسي هو Excel:

`/BRIGHTAI/reports/internal-links/ALL_ITEMS_MAIS_with_life_years.xlsx`

القراءة لازم تكون من Backend فقط. Frontend ما يقرأ Excel مباشرة.

## صقر AI
اسم النموذج ثابت: "صقر AI". لا يترجم ولا يتغير. مخرجات "صقر AI" استشارية فقط، ولا تعتبر قرار جودة نهائي. قرارات الجودة النهائية ترجع إلى QCM/QAM حسب الإجراء الداخلي.

## روابط مهمة
- [Architecture Overview](./architecture-overview.md)
- [Excel Data Source](../02-data/excel-data-source.md)
- [صقر AI Overview](../03-ai/saqr-ai-overview.md)
- [API Overview](../04-api/api-overview.md)
- [UAT Checklist](../06-testing/uat-checklist.md)


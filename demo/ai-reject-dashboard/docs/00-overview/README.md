# Overview Section Guide

أنا يزيد، QC Compliance في شركة ميس. هذا القسم هو نقطة البداية لفهم مشروع `ai-reject-dashboard` قبل الدخول في تفاصيل الصفحات والـ API. كتبته كمرجع سريع لي ولفريق الجودة والتقنية، وتحت مراجعة دكتور اسلام QCM، مع قابلية عرضه على المهندس عبدالرحمن Factory Director عند مناقشة جاهزية التجربة.

## وش فايدة هذا القسم؟
- يعطي صورة واضحة عن هدف المشروع وحدوده.
- يشرح كيف يمشي تدفق البيانات من Excel إلى Backend ثم الواجهة و`صقر AI`.
- يوضح بنية المجلدات عشان أي مطور يعرف وين يلقى الملفات.
- يحدد حالة Pilot readiness وما الذي يحتاج مراجعة قبل التشغيل الفعلي.

## متى تستخدمه؟
- عند انضمام مطور جديد للمشروع.
- عند شرح المشروع لفريق الجودة أو الإنتاج أو المالية.
- قبل أي اجتماع مراجعة مع QCM دكتور اسلام.
- قبل رفع نقاط مختصرة للإدارة العامة للمصنع بقيادة Factory Director المهندس عبدالرحمن.

## ملفات القسم
- [Project Overview](./project-overview.md): تعريف المشروع، الحالة الحالية، مصدر البيانات، ودور `صقر AI`.
- [Architecture Overview](./architecture-overview.md): تدفق النظام والمكونات الرئيسية.
- [Folder Structure](./folder-structure.md): خريطة المجلدات المهمة.
- [Pilot Readiness](./pilot-readiness.md): ما الجاهز وما يحتاج تحقق قبل Pilot أو Production.

## قواعد مهمة
- المشروع حالياً Pilot-ready جزئياً وليس Production-ready كاعتماد نهائي.
- `صقر AI` استشاري فقط، ولا يعتمد قرارات جودة.
- أي استخدام فعلي يحتاج مراجعة QCM/QAM حسب الإجراء الداخلي.

## Related Docs
- [Documentation Hub](../README.md)
- [UAT Checklist](../06-testing/uat-checklist.md)
- [Known Limitations](../08-decisions/known-limitations.md)

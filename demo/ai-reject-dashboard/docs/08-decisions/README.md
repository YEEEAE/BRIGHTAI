# Decisions Section Guide

أنا يزيد، QC Compliance في شركة ميس. هذا القسم يجمع القرارات الفنية والملاحظات المفتوحة، عشان نعرف وش تم الاتفاق عليه، وش باقي يحتاج اعتماد، ووش القيود اللي لازم تكون واضحة قبل ما نكبر نطاق المشروع.

## وش فايدة هذا القسم؟
- يوثق سبب اعتماد Excel كمصدر بيانات حالي.
- يوضح سبب تشغيل Gemini من Backend فقط.
- يثبت سبب جعل ذاكرة المحادثة مؤقتة.
- يوضح لماذا اسم النموذج ثابت `صقر AI`.
- يحصر القرارات التي تحتاج QCM دكتور اسلام أو اطلاع Factory Director المهندس عبدالرحمن.

## متى تستخدمه؟
- عند اجتماع مراجعة Pilot.
- عند وجود اختلاف على صلاحيات أو مسؤوليات.
- عند تجهيز نقاط للإدارة.
- قبل اتخاذ قرار تشغيل أوسع.

## ملفات القسم
- [Technical Decisions](./technical-decisions.md): القرارات الفنية المعتمدة كتصميم حالي.
- [Pending Decisions](./pending-decisions.md): قرارات تحتاج مراجعة أو اعتماد.
- [Known Limitations](./known-limitations.md): قيود ومخاطر معروفة.

## حدود دوري
أنا أوثق وأتابع كـ QC Compliance، لكن لا أعتمد قرار جودة نهائي ولا قرار تشغيل إنتاجي. الاعتماد النهائي يرجع إلى QCM/QAM حسب الإجراء الداخلي، وما يحتاج رفع إداري يتم عرضه على Factory Director المهندس عبدالرحمن حسب سياق القرار.

## Related Docs
- [Pilot Readiness](../00-overview/pilot-readiness.md)
- [Security Overview](../05-security/security-overview.md)
- [Production Readiness](../07-deployment/production-readiness.md)

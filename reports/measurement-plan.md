# Measurement Plan — Services Page Redesign
**Deploy Date:** 2026-03-08

## KPI Target
- KPI: Click-through rate من هيرو صفحة الخدمات إلى قسم الكتالوج
- Baseline: غير متوفر حالياً
- Goal: رفع التفاعل الأولي على زر `ابدأ من الكتالوج التنفيذي`

- KPI: Click-through rate من الكروت إلى modal أو الإجراء المباشر
- Baseline: غير متوفر حالياً
- Goal: رفع التفاعل على بطاقات الخدمات بعد تحسين الهرمية والوضوح

- KPI: WhatsApp consultation intent
- Baseline: غير متوفر حالياً
- Goal: زيادة النقرات على `احجز جلسة تشخيص`

## Tracking Event
- Event Name: `services_page_engagement`
- Trigger: النقر على CTA في الهيرو، تغيير الفئة، فتح بطاقة خدمة، أو النقر على زر واتساب
- Payload: `section`, `category`, `product_name`, `cta_type`, `page_variant`

## Success Criteria
- Minimum Improvement: تحسن ملحوظ في نقرات CTA الأساسية مقارنة بخط الأساس بعد أول أسبوع
- Evaluation Window: 7 أيام بعد النشر
- Rollback Trigger: ظهور تراجع واضح في التفاعل أو شكوى من وضوح الصفحة على الجوال

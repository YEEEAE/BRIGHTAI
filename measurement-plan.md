# Measurement Plan — GA4 Conversion & Behavior Tracking
**Deploy Date:** 2026-02-23

## KPI Target
- KPI: `lead_conversion_rate`
- Baseline: يُقاس من GA4 آخر 28 يوم قبل الإطلاق
- Goal: رفع المعدل بنسبة +20% خلال 45 يوم

## Tracking Event
- Event Name: `generate_lead`
- Trigger: عند `lead_form_submit` أو `chat_start` أو `whatsapp_click`
- Payload: `lead_channel`, `interaction_type`, `form_type`, `chat_profile`, `page_path`

## Success Criteria
- Minimum Improvement: +15% في `generate_lead` مع ثبات جودة الجلسة
- Evaluation Window: 45 يوم
- Rollback Trigger: هبوط `generate_lead` أكثر من 20% لمدة 7 أيام متصلة

## Supporting Events
- `lead_form_submit`: قياس إرسال النماذج
- `chat_start`: قياس أول تفاعل شات فعلي
- `chat_widget_open`: قياس فتح الودجت
- `technical_performance`: قياس `LCP/FCP/CLS/TTFB`

## Validation Method
- Platforms: GA4 + Google Ads + Looker Studio
- Validation: مطابقة أعداد `generate_lead` بين Realtime وReports ثم مع لوحة Looker خلال 24 ساعة
- Data Quality: استبعاد traffic الداخلي وتأكيد عدم إرسال أي PII

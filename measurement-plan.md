# Measurement Plan — Service SEO Local Market Upgrade
**Deploy Date:** 2026-02-23

## KPI Target
- KPI: `service_pages_organic_click_through_rate`
- Baseline: يُسحب من Google Search Console لآخر 28 يوم قبل النشر
- Goal: +15% خلال 30 يوم على الصفحات الخدمية المستهدفة

## Tracking Event
- Event Name: `service_page_engagement`
- Trigger: عند وصول المستخدم إلى 75% Scroll أو الضغط على CTA أساسي (طلب استشارة/تواصل)
- Payload: `page_path`, `page_locale`, `source_medium`, `cta_type`, `scroll_depth`, `session_id_hash`

## Success Criteria
- Minimum Improvement: +10% Organic Clicks و +8% Leads من الصفحات الخدمية
- Evaluation Window: 30 يوم
- Rollback Trigger: هبوط Organic Clicks أكثر من 12% على صفحتين خدميتين رئيسيتين لمدة 14 يوم متواصل

## Additional Measurement
- `service_page_contact_submit`: قياس تحويل الزيارات العضوية إلى طلبات تواصل
- `service_page_schema_valid`: نتيجة فحص صلاحية schema بعد كل نشر
- `sitemap_indexed_urls_delta`: نسبة فهرسة روابط sitemap المستهدفة أسبوعيًا

## Validation Method
- Platforms: Google Search Console + GA4
- Validation: مطابقة اتجاهات `page_path` بين GSC وGA4 أسبوعيًا
- Data Quality: استبعاد traffic الداخلي وقياس القيم على قناة `organic` فقط

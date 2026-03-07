# Measurement Plan — Semrush Structured Data & Broken Links Fix
**Deploy Date:** 2026-03-08

## KPI Target
- KPI: عدد أخطاء Structured Data في Semrush
- Baseline: 18 خطأ على الصفحات المحددة في تقرير 7 مارس 2026
- Goal: الوصول إلى 0 في المجموعة الحالية بعد إعادة الزحف

- KPI: عدد الروابط الداخلية المكسورة في Semrush
- Baseline: 14 رابطاً مكسوراً في التقرير الحالي
- Goal: الوصول إلى 0 في المجموعة الحالية بعد إعادة الزحف

- KPI: نسبة نجاح الوصول إلى مسارات demo/try/interview القديمة
- Baseline: 404 على المسارات المرصودة
- Goal: 200/redirect صالح على جميع المسارات المرصودة

## Tracking Event
- Event Name: `seo_semrush_remediation`
- Trigger: بعد النشر وإعادة فحص Semrush وروابط الصحة اليدوية
- Payload: `issue_type`, `page_url`, `status_before`, `status_after`, `crawl_date`

## Success Criteria
- Minimum Improvement: اختفاء أخطاء المجموعتين المحددتين بالكامل من إعادة فحص Semrush
- Evaluation Window: من 3 إلى 7 أيام بعد النشر وإعادة الزحف
- Rollback Trigger: استمرار 404 على أي رابط من الروابط المستهدفة أو بقاء خطأ schema على أكثر من صفحتين بعد إعادة الزحف

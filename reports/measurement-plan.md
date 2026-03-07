# Measurement Plan — Semrush 4XX, Sitemap Redirects, and About Title Fix
**Deploy Date:** 2026-03-08

## KPI Target
- KPI: عدد صفحات 4XX في Semrush
- Baseline: 9 صفحات في التقرير الحالي
- Goal: الوصول إلى 0 بعد إعادة الزحف

- KPI: عدد الصفحات غير الصحيحة في `sitemap.xml`
- Baseline: 3 صفحات Redirect في التقرير الحالي
- Goal: الوصول إلى 0 بعد إعادة توليد sitemap وإعادة الزحف

- KPI: عدد الصفحات التي تفتقد `title`
- Baseline: 1 صفحة (`/about/`) في التقرير الحالي
- Goal: الوصول إلى 0 بعد إعادة الزحف

## Tracking Event
- Event Name: `seo_semrush_remediation`
- Trigger: بعد النشر وإعادة فحص Semrush وفحص الروابط اليدوي
- Payload: `issue_type`, `page_url`, `status_before`, `status_after`, `crawl_date`

## Success Criteria
- Minimum Improvement: اختفاء أخطاء 4XX وRedirect وTitle بالكامل من إعادة فحص Semrush
- Evaluation Window: من 3 إلى 7 أيام بعد النشر وإعادة الزحف
- Rollback Trigger: استمرار 404 على أي مسار alias أو بقاء أي رابط sitemap يعمل Redirect أو استمرار غياب title في `/about/` بعد إعادة الزحف

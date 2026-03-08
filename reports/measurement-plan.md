# Measurement Plan — Semrush Broken Internal Links Remediation
**Deploy Date:** 2026-03-08

## KPI Target
- KPI: عدد `Broken internal links` في Semrush Site Audit
- Baseline: `434` سجل مكسور عبر `87` target فريد في snapshot بتاريخ 2026-03-08
- Goal: الوصول إلى `0` بعد النشر وإعادة الزحف

- KPI: عدد `Broken Link URL` الفريدة
- Baseline: `87`
- Goal: الوصول إلى `0`

- KPI: عدد الصفحات المتأثرة (`Page URL`)
- Baseline: `62`
- Goal: الوصول إلى أقل قيمة ممكنة وصولاً إلى `0`

## Tracking Event
- Event Name: `seo_broken_internal_links_remediation`
- Trigger: بعد النشر، ثم بعد أول إعادة زحف من Semrush، ثم بعد تحقق يدوي من أهم الروابط
- Payload: `issue_id`, `page_url`, `broken_link_url`, `status_before`, `status_after`, `snapshot_id`

## Success Criteria
- Minimum Improvement: انخفاض issue `Broken internal links` من `434` إلى `0`
- Evaluation Window: من 3 إلى 7 أيام بعد النشر وإعادة زحف Semrush
- Rollback Trigger: بقاء أي target من قائمة Semrush الحالية يرجع `404` بعد النشر أو ظهور aliases مكسورة جديدة في نفس العائلة

# Measurement Plan — HTML Canonical + Hreflang Remediation
**Deploy Date:** 2026-03-05

## KPI Target
- KPI: نسبة الصفحات السليمة في (Canonical + Hreflang)
- Baseline: 13 صفحات متأثرة من 195 صفحة مؤهلة (6.67%)
- Goal: 0 صفحات متأثرة (100% امتثال)

## Tracking Event
- Event Name: `seo_html_governor_fix_completed`
- Trigger: بعد تشغيل `npm run seo:html:fix` وانتهاء الفحص اللاحق `npm run seo:html:check`
- Payload: `scanned_pages`, `eligible_pages`, `affected_before`, `affected_after`, `fixed_files`, `timestamp`

## Success Criteria
- Minimum Improvement: 100% خفض في الصفحات المتأثرة (13 → 0)
- Evaluation Window: 14 يوم
- Rollback Trigger: ظهور أي نقص Canonical/Hreflang أكبر من 0 في فحص HTML الدوري

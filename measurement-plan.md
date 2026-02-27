# Measurement Plan — HTML SEO Governor
**Deploy Date:** 2026-02-27

## KPI Target
- KPI: نسبة صفحات HTML المكتملة في وسوم SEO الأساسية (Title + Description + Canonical + H1 + Hreflang)
- Baseline: 38/195 صفحة مكتملة (19.49%)
- Goal: 195/195 صفحة مكتملة (100%)

## Tracking Event
- Event Name: `seo_html_governor_audit_completed`
- Trigger: بعد كل تشغيل لسكربت `html-seo-governor.mjs` في وضع `check` أو `fix`
- Payload: `scanned_files`, `eligible_pages`, `pages_with_issues_before`, `pages_with_issues_after`, `files_updated`

## Success Criteria
- Minimum Improvement: +70% تحسن في اكتمال الوسوم
- Evaluation Window: 7 أيام
- Rollback Trigger: أي عودة لنقص الوسوم الأساسية فوق 0 في `npm run seo:html:check`

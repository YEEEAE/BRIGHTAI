# Measurement Plan — Structured Data Remediation
**Deploy Date:** 2026-03-07

## KPI Target
- KPI: Semrush structured data errors
- Baseline: 14 invalid items in Site Audit dated 2026-03-06
- Goal: 0 invalid items after recrawl

## Tracking Event
- Event Name: `seo_structured_data_audit_pass`
- Trigger: اكتمال إعادة نشر الموقع ثم انتهاء زحف Semrush الجديد بدون أخطاء `invalid structured data`
- Payload: `page_url`, `schema_type`, `audit_date`, `status`, `error_count`

## Success Criteria
- Minimum Improvement: 100% reduction in invalid structured data items
- Evaluation Window: 3 days after deployment and recrawl
- Rollback Trigger: ظهور أي انخفاض في `seo:check` أو عودة أخطاء schema نفسها على الصفحات الأساسية

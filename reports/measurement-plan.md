# Measurement Plan — Hreflang Conflicts
**Deploy Date:** 2026-03-07

## KPI Target
- KPI: Semrush `hreflang conflicts within page source code` + `incorrect hreflang links`
- Baseline: 14 hreflang redirect rows on الصفحات الجذرية و190 conflict signals في Site Audit dated 2026-03-06
- Goal: 0 hreflang URLs تشير إلى redirecting root pages، وانخفاض conflict count إلى الصفر بعد recrawl

## Tracking Event
- Event Name: `seo_hreflang_audit_pass`
- Trigger: اكتمال إعادة نشر الموقع ثم انتهاء زحف Semrush الجديد بدون أخطاء `hreflang conflicts within page source code` و`incorrect hreflang links`
- Payload: `page_url`, `canonical_url`, `hreflang_code`, `hreflang_url`, `audit_date`, `status`

## Success Criteria
- Minimum Improvement: 100% reduction in hreflang redirects/conflicts على الصفحات الجذرية
- Evaluation Window: 3 days after deployment and recrawl
- Rollback Trigger: بقاء أي `hreflang` يشير إلى نسخة non-200 أو عودة أي mismatch بين `canonical` و`hreflang` في فحوصات CI أو تقرير Semrush التالي

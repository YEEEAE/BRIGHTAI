# Measurement Plan — Redirect Chains And Loops
**Deploy Date:** 2026-03-07

## KPI Target
- KPI: Semrush `redirect chains and loops` errors
- Baseline: 5 affected issue buckets in Site Audit dated 2026-03-06, with repeated loops on `docs/*`
- Goal: 0 self-redirect loops on public `docs/*` URLs after recrawl

## Tracking Event
- Event Name: `seo_redirect_loop_audit_pass`
- Trigger: اكتمال إعادة نشر الموقع ثم انتهاء زحف Semrush الجديد بدون أخطاء `redirect chains and loops` على مسارات `docs/*`
- Payload: `page_url`, `initial_url`, `final_url`, `audit_date`, `status`, `redirect_count`

## Success Criteria
- Minimum Improvement: 100% reduction in self-redirect loops
- Evaluation Window: 3 days after deployment and recrawl
- Rollback Trigger: بقاء أي مسار `docs/*` يعيد `301` إلى نفسه أو عودة نفس الخطأ في تقرير Semrush التالي

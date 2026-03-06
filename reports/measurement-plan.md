# Measurement Plan — Phase 4 Closure
**Deploy Date:** 2026-03-06

## KPI Target
- KPI: نسبة سلامة إشارات الفهرسة الأساسية والسايت ماب
- Baseline: قبل الإقفال النهائي كان لدينا placeholders تحقق في الصفحة الرئيسية وسياسة سايت ماب أوسع من المطلوب
- Goal: 0 Placeholder verification tags + 0 أخطاء في `seo:check` + 0 أخطاء في `seo:html:check`

## Tracking Event
- Event Name: `seo_phase4_closure_verified`
- Trigger: بعد تشغيل `npm run sitemap:all` و`npm run seo:check` و`npm run seo:html:check` و`npm run deploy:source-of-truth:check`
- Payload: `sitemap_url_count`, `seo_ci_errors`, `html_governor_affected_pages`, `verification_placeholder_count`, `timestamp`

## Success Criteria
- Minimum Improvement: بقاء جميع الفحوصات عند `0` أخطاء واستمرار السايت ماب على نطاق `high-confidence`
- Evaluation Window: 14 يوم
- Rollback Trigger: رجوع أي Placeholder verification tag أو زيادة أخطاء `seo:check` أو `seo:html:check` فوق `0`

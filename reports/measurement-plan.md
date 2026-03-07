# Measurement Plan — Semrush Remediation Cycle
**Deploy Date:** 2026-03-07

## KPI Target
- KPI: عدد `Errors` و`Warnings` في Semrush Site Audit
- Baseline: وجود أخطاء وتحذيرات متعددة في تقرير **March 7, 2026**
- Goal: تصفير العناصر المحلية المسببة داخل artifact النهائي وتجهيز الموقع لنتيجة recrawl نظيفة

## Tracking Event
- Event Name: `semrush_remediation_artifact_verified`
- Trigger: اكتمال `prepare-netlify-publish` مع تحقق محلي من:
  `seo:check = 0 errors / 0 warnings`
  وعدم وجود الروابط الخارجية المكسورة داخل `.netlify-publish`
  وارتفاع الصفحات الأساسية فوق الحد التشغيلي لنسبة text-to-HTML
- Payload: `sitemap_urls`, `seo_errors`, `seo_warnings`, `services_ratio`, `machine_learning_ratio`, `contact_ratio`, `artifact_broken_link_refs`

## Success Criteria
- Minimum Improvement: اختفاء المسببات المحلية بالكامل من artifact النهائي
- Evaluation Window: 7 days
- Rollback Trigger: رجوع أي مسار مفهرس إلى noindex خاطئ، أو ظهور broken external refs، أو هبوط `seo:check` عن الصفر

# Measurement Plan — Uncompressed Asset Warning Reduction
**Deploy Date:** 2026-03-07

## KPI Target
- KPI: Semrush `uncompressed JavaScript and CSS files`
- Baseline: issue present in the Site Audit generated on **March 6, 2026**, with local evidence on `about/`
- Goal: remove the local artifact references most likely causing the warning and reduce the next Semrush warning count

## Tracking Event
- Event Name: `publish_artifact_external_script_cleanup`
- Trigger: اكتمال `prepare-netlify-publish` بدون أي مرجع إلى `js.sentry-cdn.com` أو `pagead2.googlesyndication.com` داخل `.netlify-publish`
- Payload: `artifact_html_files_scanned`, `sentry_cdn_refs`, `adsense_refs`, `report_date`

## Success Criteria
- Minimum Improvement: اختفاء المرجعين الخارجيين من artifact النهائي بالكامل
- Evaluation Window: 7 days
- Rollback Trigger: ظهور أي مرجع جديد داخل `.netlify-publish` إلى `js.sentry-cdn.com` أو `pagead2.googlesyndication.com`

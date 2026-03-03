# Measurement Plan — Legacy URL Redirect & Canonical Cleanup
**Deploy Date:** 2026-03-03

## KPI Target
- KPI: Redirected URLs indexed in Google Search Console (Page with redirect / Moved page count)
- Baseline: 11 affected URLs in current issue batch
- Goal: Reduce affected legacy URLs by >= 80% within 14 days after recrawl

## Tracking Event
- Event Name: `seo_legacy_url_cleanup_v1`
- Trigger: Successful production deploy containing updated `netlify.toml`, normalized blog metadata, and regenerated `sitemap.xml`
- Payload: `{"release":"seo-cleanup-2026-03-03","legacy_urls_cleaned":11,"sitemap_urls_total":150,"env":"production"}`

## Success Criteria
- Minimum Improvement: 80%
- Evaluation Window: 14 days
- Rollback Trigger: Any new indexable moved URL reappears in sitemap or canonical loop detected on monitored URLs

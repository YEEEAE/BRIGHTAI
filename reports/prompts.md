11. أقوى برومبتات Codex
 
 
 
 
 Run final launch audit.

Commands:
node scripts/seo-health-check.mjs
node scripts/seo-ci-check.mjs
node scripts/internal-links-audit.mjs
npm run build

Validate:
- 0 CI errors
- 0 broken internal links
- sitemap-priority only contains final canonical 200 URLs
- /ai-bots/ is indexable
- /health/ decision is consistent
- all commercial pages have CTA
- GA4 events are documented
- GSC manual indexing list is produced

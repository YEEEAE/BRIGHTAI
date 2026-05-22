11. أقوى برومبتات Codex
Prompt 1 — Elite SEO Operating System
You are the lead technical SEO architect for Bright AI.

Use only the current codebase as code truth, and use GSC/GA4 as performance truth.

Goal:
Transform Bright AI into a top Saudi/Middle East AI SEO competitor.

Tasks:
1. Run current audit scripts.
2. Identify redirect/canonical/sitemap conflicts.
3. Create a prioritized implementation backlog with severity and impact.
4. Do not remove public demo pages. Treat all demos as intentional customer-facing assets.
5. Separate pages into:
   - public-indexable
   - public-noindex
   - public-demo
   - commercial-money
   - support/docs
6. Output exact files to change and validation commands.
Prompt 2 — Redirect and Canonical Domination
Fix all redirect/canonical/sitemap conflicts.

Known issues:
- /ai-bots/ must remain an indexable commercial page and must not redirect to /docs/ai-bots/.
- /health/ and /en/health/ exist as pages and must not redirect to demo if they remain in sitemap.

Tasks:
1. Remove conflicting redirects.
2. Ensure every URL in sitemap returns final 200 and self-canonical.
3. Keep legacy /frontend/pages/* redirects directly to final canonical URLs.
4. No redirect chains.
5. Run seo-health-check and seo-ci-check.
Prompt 3 — SEO CI Zero Failure
Make node scripts/seo-ci-check.mjs pass with 0 errors.

Tasks:
1. Fix hreflang extra/missing issues.
2. Fix OG/Twitter image mismatch or update the rule consistently.
3. Add og:image:alt and twitter:image:alt where required.
4. Decide whether /en/interview/ is allowed in sitemap; if not, remove it.
5. Output before/after errors.
Prompt 4 — Priority Sitemap
Create sitemap-priority.xml with 25-40 pages only.

Include:
/
 /services/
 /consultation/
 /contact/
 /ai-bots/
 /ai-agent/
 /ai-workflows/
 /data-analysis/
 /smart-automation/
 /demo/
 /demo/brightsales/
 /demo/smart-hiring-system/
 /demo/data-analyzer/
 /demo/ocr-demo/
 /blog/
 /blog/choose-ai-company-saudi/
 /blog/ai-guide-saudi-business/
 /blog/ai-implementation-cost-guide/
 /blog/top-ai-tools-saudi-2025/
 /locations/riyadh/
 /locations/jeddah/
 /locations/dammam/

Tasks:
1. Create sitemap-priority.xml.
2. Add to robots.txt.
3. Validate no redirected or noindex URL is included.
4. Create a validation script for this sitemap.
Prompt 5 — Demo SEO Engine
Treat all demo pages as intentional customer-facing assets.

Tasks:
1. Create demo taxonomy:
   sales, hiring, support, data, OCR, healthcare, education, tenders.
2. For each priority demo page, add:
   - SEO title
   - meta description
   - one H1
   - 800+ words of useful copy
   - use cases in Saudi market
   - FAQ
   - CTA to /consultation/
   - SoftwareApplication + Service + FAQ schema
3. Build /demo/ as a strong hub linking to all demos.
4. Do not delete demos.
Prompt 6 — Saudi Money Pages
Create or improve high-intent Saudi B2B AI money pages.

Pages:
/services/ai-consulting-saudi/
/services/ai-chatbot-arabic/
/services/business-automation-saudi/
/services/enterprise-ai-agents-saudi/
/pricing/

Each page must include:
- H1
- problem statement
- solution details
- deliverables
- integration notes
- timeline/pilot approach
- FAQ
- CTA
- Service schema
- Breadcrumb schema
- internal links to demos and consultation
Prompt 7 — Local SEO Expansion
Build Saudi local SEO architecture.

Pages:
/locations/
/locations/riyadh/
/locations/jeddah/
/locations/dammam/
/locations/khobar/
/locations/makkah/
/locations/madinah/
/locations/neom/
/locations/eastern-province/

Rules:
- Unique localized copy.
- Do not claim a physical office unless true.
- Use “نخدم الشركات في...” when remote/service coverage.
- Add LocalBusiness/Service schema with areaServed.
- Link from footer and services.
Prompt 8 — Content Authority Clusters
Build topical authority clusters for Bright AI.

Clusters:
1. AI company in Saudi Arabia
2. AI automation Saudi Arabia
3. AI agents for enterprises
4. Arabic chatbot for business
5. AI data analytics
6. AI governance/compliance Saudi
7. AI by sector
8. AI by city

Tasks:
- Create hub pages.
- Map existing blog posts to hubs.
- Add contextual internal links.
- Update 10 priority articles with stronger examples, tables, FAQ, and CTAs.
Prompt 9 — English Middle East SEO Cleanup
Clean English SEO pages.

Tasks:
1. Scan /en/ pages for Arabic text.
2. Keep Arabic only when intentional brand/example.
3. Rewrite English pages targeting:
   AI company in Saudi Arabia
   AI automation Saudi Arabia
   Enterprise AI Saudi Arabia
   AI agents Middle East
4. Fix English schema and metadata.
5. Add hreflang reciprocal links.
Prompt 10 — CRO and CTA System
Build a sitewide conversion system.

Tasks:
1. Primary CTA: احجز جلسة تشخيص AI
2. Secondary CTA: جرّب نماذج Bright AI
3. WhatsApp CTA on commercial pages.
4. Add CTAs to homepage, services, demo pages, blog, city pages, footer.
5. Add data-analytics-event attributes.
6. Ensure /consultation/ explains outputs clearly.
Prompt 11 — GA4 Measurement System
Implement GA4 event taxonomy.

Events:
consultation_request
request_demo
whatsapp_click
phone_click
email_click
contact_form_submit
lead_magnet_submit
pricing_view

Tasks:
1. Add data attributes to CTAs.
2. Create JS event listener if not present.
3. Document which events to mark as Key Events in GA4.
4. Add UTM guidance for LinkedIn/X campaigns.
Prompt 12 — Final Launch Gate
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

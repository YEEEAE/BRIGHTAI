# BRIGHTAI SEO RECOVERY & ORGANIC GROWTH PROGRAM

Repository:

```text
YEEEAE/BRIGHTAI
```

Production domain:

```text
https://brightai.live
```

Keyword source of truth:

```text
BRIGHTAI-KEYWORDS-MERGED-2026-09-08(1).csv
```

Locate the file by basename if its exact path differs.

Current verified baseline:

```text
Technical site health: ~93/100
Successful crawl: 320/320
Broken crawled pages: 0
GSC audited indexability sample: 25/25 indexable
Sitemap URLs: 274
Sitemap URLs with GSC impressions in measured period: 39
Organic clicks: 0
Organic CTR: 0%
Domain Authority / Domain InLink Rank: ~1/100
Known backlinks: 38
Known dofollow backlinks: 0
Known nofollow backlinks: 38
GA4 acquisition is dominated by Direct traffic
Conversion/key-event measurement is incomplete
```

The fundamental problem is NOT lack of pages.

The fundamental problem is:

```text
Authority << Content footprint
+
weak keyword ownership
+
possible cannibalization
+
excess indexable surface area
+
poor organic acquisition
+
weak measurement
```

Do not respond with generic recommendations.

Execute the requested work.

Do not push, merge, publish, or deploy unless explicitly instructed.

Never fabricate SEO metrics.

When an SEO provider is unavailable, record:

```text
DATA_UNAVAILABLE
```

instead of estimating a metric.

Never create fake backlinks, fake testimonials, fake customers, fake certifications, fake regulatory relationships, or invented claims.

Preserve product truth.

BrightAI must not be repositioned into a generic AI agency, automation consultancy, cybersecurity consultancy, or digital-transformation company merely because those keywords have search volume.






---



---


---

# PROMPT #7 — FIX GA4 SEO MEASUREMENT AND CONVERSION ATTRIBUTION

The current GA4 snapshot is dominated by Direct traffic and does not provide a useful conversion picture.

Audit the repository's analytics implementation.

Do not expose or print secrets.

## Implement or verify measurement for

```text
demo_submit
contact_submit
lead_created
pricing_cta_click
whatsapp_click
assessment_started
assessment_completed
newsletter_signup
resource_download
outbound_partner_click
```

Use consistent event naming.

Prevent duplicate event firing.

Do not count page refreshes as conversions.

## Enrich relevant events with safe context such as

```text
page_path
cta_location
form_type
content_group
language
```

Do NOT send:

```text
email
phone
full name
free-form sensitive input
personal data
```

to GA4 event parameters.

## Attribution audit

Investigate why acquisition is heavily:

```text
Direct
Unassigned
```

Verify:

```text
UTM handling
cross-domain behavior
referrer preservation
redirect tracking
www/non-www consistency
HTTP→HTTPS
client-side redirects
WhatsApp redirect flow
SPA/history behavior if applicable
consent implementation
```

## Internal/testing traffic

Create a documented method to distinguish or exclude:

```text
developer traffic
CI/browser automation
Playwright
Lighthouse
monitoring
internal team visits
automated QA
```

Do not silently implement unreliable user-agent filtering that could remove real users.

For GA4 settings that cannot be configured in code, create explicit manual configuration instructions.

## Funnel

Define:

```text
Organic Landing
→ Engaged Session
→ Commercial Page
→ CTA
→ Lead
```

and:

```text
Informational Article
→ Solution
→ Pricing/Demo
→ Lead
```

Create:

```text
13-ANALYTICS-MEASUREMENT-PLAN.md
14-GA4-MANUAL-CONFIGURATION.md
```

and automated tests for event firing where practical.

---

# PROMPT #8 — AUTHORITY BUILDING AND LINK EARNING, NOT LINK SPAM

BrightAI currently has extremely weak external authority relative to its content footprint.

Known external-tool observations have indicated approximately:

```text
Authority ≈ 1/100
38 backlinks
0 dofollow
```

Re-check current data if tools are available.

Do not fabricate unavailable metrics.

This task has TWO parts.

## Part A — Make the site link-worthy

Identify 3–5 assets BrightAI can credibly own, preferably based on its strongest topics.

Examples:

```text
Saudi AI Governance Controls Map
PDPL + AI Compliance Checklist
AI Risk Register Template
SDAIA/NCA/PDPL regulatory map
ISO 42001 readiness checklist
AI Usage Policy template
Human Approval Decision Matrix
```

Before creating anything, check for overlapping existing BrightAI assets.

Prefer improving existing resources instead of creating duplicates.

Create assets only if they provide unique value.

Every asset needs:

```text
canonical HTML owner
clear authorship
last reviewed date
primary-source citations
useful downloadable form only when warranted
natural internal links
commercial pathway without making the asset an advertisement
```

## Part B — Build a legitimate backlink acquisition plan

Using live web/SEO tools where available, identify relevant prospects in Saudi Arabia and the region.

Focus on:

```text
AI ecosystem organizations
technology companies
compliance communities
cybersecurity publications
data-governance communities
universities/research organizations where genuinely relevant
conference/event ecosystems
startup directories
enterprise SaaS directories
professional associations
partners
industry publications
podcasts/interviews
expert roundups
```

Evaluate prospects by:

```text
relevance
authority
Saudi relevance
editorial legitimacy
real traffic signals if available
link type
contact route
asset match
```

Reject:

```text
PBNs
paid link farms
irrelevant directories
sitewide links
spam guest-post networks
automated backlink packages
```

Do not automatically contact anyone.

Create:

```text
15-LINKABLE-ASSET-PLAN.md
16-BACKLINK-PROSPECTS.csv
17-DIGITAL-PR-PLAN.md
```

Target the first milestone:

```text
10 genuinely relevant referring domains
with editorially earned links
```

Quality is more important than raw backlink count.

---

# PROMPT #9 — FINAL SEO VERIFICATION AND 90-DAY EXECUTION GATES

Perform a complete post-remediation audit.

Do not claim success based only on a green build.

Compare BEFORE vs AFTER.

## Re-run

```text
build
tests
crawl
indexability validation
sitemap audit
robots validation
canonical checks
hreflang checks
structured data checks
internal links
redirect checks
metadata duplicate checks
image alt checks
analytics event tests
```

If integrations are available, also retrieve the newest:

```text
GSC
Ubersuggest
SE Ranking
Semrush
Ahrefs
```

Do not fail the audit merely because an external subscription has insufficient API credits.

Record that limitation.

## Verify these structural outcomes

Target:

```text
0 broken internal links
0 redirect loops
0 unintended noindex owner pages
0 duplicate PRIMARY_OWNER assignments for the same intent
0 important redirected URLs left in sitemap
0 known malformed Organization schema
0 known missing Article.image where Article schema requires it
0 keyword stuffing introduced
0 fake compliance or certification claims
```

## Establish 30 / 60 / 90 day KPIs

Do not promise rankings.

Use measurable targets.

### 30 days

Monitor:

```text
number of sitemap URLs receiving impressions
P0/P1 owner-page impressions
non-branded query count
crawl/indexation state
average owner-page position
organic landing sessions
```

### 60 days

Monitor:

```text
keywords entering Top 50
keywords entering Top 20
organic clicks
Saudi organic users
commercial-page assisted conversions
new quality referring domains
```

### 90 days

Monitor:

```text
Top 10 P0/P1 keywords
organic leads
organic conversion rate
topic-level share of visibility
earned referring domains
brand-query growth
```

## Important diagnostic rule

Do not use sitewide average position alone.

Track performance by:

```text
keyword
intent
owner URL
cluster
country
device
```

## Create final artifacts

```text
18-FINAL-SEO-AUDIT.md
19-SEO-KPI-BASELINE.csv
20-30-60-90-DAY-ROADMAP.md
21-REMAINING-RISKS.md
```

The final report must explicitly distinguish:

```text
FIXED
IMPROVED
REQUIRES_GOOGLE_RECRAWL
REQUIRES_EXTERNAL_AUTHORITY
REQUIRES_MORE_DATA
NOT_ACTIONABLE_IN_CODE
```

Never label external ranking or authority problems as "fixed" merely because local code changed.

End with the 10 highest-impact remaining actions ranked by:

```text
Impact × Confidence ÷ Effort
```

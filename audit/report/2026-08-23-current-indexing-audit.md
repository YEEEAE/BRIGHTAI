# Current Indexing-Focused Audit — 2026-08-23 (rerun)

## Evidence boundary

- Historical baseline (2026-07-25: 180 tested / 72 indexed / 36 not indexed / 36 crawled-currently-not-indexed / 36 unknown) is **not current truth** and is not used as a current status metric.
- Current GSC export: **N/A**. No Search Console connector or current export was available. URL status, last crawl, GSC canonical, impressions, clicks, and query are therefore **N/A**, not inferred.
- Live HTTP verification: **blocked/unverified**. Local `curl` to all eight target URLs, `/robots.txt`, and `/sitemap.xml` failed with `Could not resolve host: brightai.site`. Web retrieval opened the homepage only (marked “last month” by the retrieval source); all eight targets plus `robots.txt`/`sitemap.xml` returned cache-miss or unsafe-open errors. This is not production HTTP or indexing proof.
- Fresh local build: `npm run build` completed at 2026-08-23 21:57 +03. It emitted 26 Astro route-collision warnings, but generated all eight target HTML files. Build-time FAQ synchronization repaired the generated solution FAQ schema; no source page was edited by this audit.

Required GSC export columns remain: `URL | status | last crawl | canonical | sitemap presence | impressions | clicks | query`.

## Current GSC export

No current GSC connector or export is available. The following is the explicit N/A export placeholder; `local sitemap presence` is reported separately as technical evidence and is not a GSC sitemap-status claim.

| URL | status | last crawl | canonical | sitemap presence | impressions | clicks | query |
|---|---|---|---|---|---:|---:|---|
| `/solutions/ai-governance-platform/` | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| `/hub/ai-governance/` | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| `/assessment/ai-governance-readiness/` | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| `/solutions/ai-risk-classification/` | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| `/solutions/ai-firewall/` | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| `/solutions/ai-audit-trail/` | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| `/solutions/policy-to-control-mapping/` | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| `/solutions/banking-ai-governance/riyadh/` | N/A | N/A | N/A | N/A | N/A | N/A | N/A |

## Target-page matrix

| URL | Content / unique value | Duplication risk | Canonical / sitemap | Links / depth | Schema | Title / H1 | Mobile |
|---|---|---|---|---|---|---|---|
| `/solutions/ai-governance-platform/` | Strong commercial pillar; ~2,084 rendered words; central governance, policy, risk, audit and approval value | Medium template similarity, distinct platform scope | Self-canonical; local sitemap; `lastmod 2026-07-25`; no `noindex` | Exact local BFS depth 1; 247 distinct incoming HTML sources | WebPage, Service, FAQPage, BreadcrumbList; clean-build schema PASS | Title/H1 aligned: منصة حوكمة الذكاء الاصطناعي | Viewport, RTL and initial HTML present; live mobile unverified |
| `/hub/ai-governance/` | Informational hub; ~1,136 words; curated learning path and assessment CTA | Low–medium; distinct from commercial intent | Self-canonical; local sitemap; `lastmod 2026-07-25`; no `noindex` | Exact local BFS depth 2; 26 distinct incoming HTML sources | CollectionPage, WebPage, BreadcrumbList | Title/H1 aligned: حوكمة AI | Viewport and initial HTML present; live mobile unverified |
| `/assessment/ai-governance-readiness/` | Conversion/support page; ~2,017 words; four-step readiness assessment and next action | Medium overlap with hub, different assessment intent | Self-canonical; local sitemap; `lastmod 2026-07-29`; no `noindex` | Exact local BFS depth 1; 245 distinct incoming HTML sources | WebPage, FAQPage, BreadcrumbList | Title/H1 aligned: تقييم جاهزية AI | Viewport and initial HTML present; form/mobile live check pending |
| `/solutions/ai-risk-classification/` | Strong solution; ~2,055 words; risk levels, approvals and use-case classification | Medium with governance/safety content; unique risk intent exists | Self-canonical; local sitemap; `lastmod 2026-07-25`; no `noindex` | Exact local BFS depth 1; 245 distinct incoming HTML sources | WebPage, DefinedTerm, FAQPage, BreadcrumbList; clean-build schema PASS | Title/H1 aligned: تصنيف وتقييم مخاطر الذكاء الاصطناعي | Viewport and initial HTML present; live mobile unverified |
| `/solutions/ai-firewall/` | Strong solution; ~2,055 words; PII/PHI redaction and request-boundary protection | Medium with data-protection articles; product boundary clear | Self-canonical; local sitemap; `lastmod 2026-07-25`; no `noindex` | Exact local BFS depth 1; 250 distinct incoming HTML sources | WebPage, DefinedTerm, FAQPage, BreadcrumbList; clean-build schema PASS | Title/H1 aligned: AI Firewall لحماية البيانات | Viewport and initial HTML present; live mobile unverified |
| `/solutions/ai-audit-trail/` | Strong solution; ~2,024 words; append-only audit, accountability and evidence | Medium with audit/compliance articles | Self-canonical; local sitemap; `lastmod 2026-07-25`; no `noindex` | Exact local BFS depth 1; 248 distinct incoming HTML sources | WebPage, DefinedTerm, FAQPage, BreadcrumbList; clean-build schema PASS | Title/H1 aligned: سجل تدقيق الذكاء الاصطناعي | Viewport and initial HTML present; live mobile unverified |
| `/solutions/policy-to-control-mapping/` | Strong solution; ~1,913 words; policy-to-control operational mapping | Medium with NCA/ECC docs/articles; sharpen product-vs-guide boundary | Self-canonical; local sitemap; `lastmod 2026-07-25`; no `noindex` | Exact local BFS depth 1; 245 distinct incoming HTML sources | WebPage, DefinedTerm, FAQPage, BreadcrumbList; clean-build schema PASS | Title/H1 aligned: ربط السياسات بالضوابط التقنية | Viewport and initial HTML present; live mobile unverified |
| `/solutions/banking-ai-governance/riyadh/` | Strong local commercial page; ~1,748 words; Riyadh banking, SAMA/NCA and answer-first copy | Medium–high local-template risk vs Khobar; Riyadh-specific context exists | Self-canonical; local sitemap; `lastmod 2026-07-29`; no `noindex` | Exact local BFS depth 2; 8 distinct incoming HTML sources | WebPage, Service, City, BreadcrumbList; no FAQ block detected | Title/H1 aligned semantically; H1 is `sr-only` | Viewport and initial HTML present; verify visible H1 at 360px/1440px |

## Local technical evidence

- `dist/client`: 275 HTML files; 269 full pages scanned by `seo:check` after fresh build.
- Local sitemap: 258 URLs; all eight targets are present with trailing slash and self hreflang entries.
- Local `robots.txt`: `Allow: /`, zero `Disallow`, one canonical sitemap declaration. Production Cloudflare output is not verified.
- `seo:hreflang`: **PASS** — 259 sets, zero errors.
- `seo:word-count`: **PASS** — 96 articles, all at least 1,200 words.
- `seo:check`: **PASS** after the fresh build (258 sitemap URLs, 275 HTML, no canonical/path/hreflang errors).
- `seo:schema`: **PASS** after the fresh build; the build regenerated 19 solution FAQ blocks and the check reported 0 out-of-sync files. This is a generated-artifact freshness issue to keep in CI, not proof of production parity.
- `seo:link-graph --strict`: **FAIL** with 276 files scanned. The validator reports root and normal target paths as broken even though those files exist in the same build, indicating a path-normalization/validator issue; retain this as an indexing-gate failure until the validator is corrected or its contract is clarified. Targeted BFS above is a separate direct HTML measurement.
- Targeted rendered checks: each target has one canonical, zero `noindex`, one H1, viewport, `lang="ar"`, initial HTML content, and no missing image `alt` detected by the targeted scan.

## P0 / P1 / P2 remediation

### P0 — before publishing more content

1. Fix or formally scope the `seo:link-graph --strict` path-normalization failure, then make its clean result a publish gate.
2. Obtain a current GSC export for the required columns and the eight target URLs; keep all current GSC metrics as `N/A` until then.
3. Verify production parity and HTTP status from a network that can resolve `brightai.site`: 200/redirects, raw HTML canonical/robots/schema, sitemap, headers, and Cloudflare-managed robots policy.
4. Keep the clean-build FAQ sync check in CI so generated schema cannot drift again; do not treat the current local PASS as live proof.

### P1 — next indexing-quality pass

1. Run an exact BFS crawl-depth calculation from `/` over the clean published graph; target pages should be within three clicks.
2. Tighten intent separation between the governance hub, platform, assessment and overlapping articles; keep one canonical per intent.
3. Review Riyadh vs Khobar and other sector/city differentiation; preserve verifiable local value and avoid mass-generated near-duplicates.
4. Manually verify that the Riyadh `sr-only` H1 remains accessible and that the intended visible hero heading is clear at 360px and 1440px.
5. After production access is restored, run mobile render and performance checks separately from GSC indexing status.

### P2 — ongoing

1. Maintain a monthly URL-level GSC export with status, last crawl, canonical, sitemap presence, impressions, clicks and query.
2. Keep sitemap `lastmod` tied to real content changes and resubmit/inspect the sitemap after clean deployment.
3. Add contextual links from authoritative hub, service, docs and relevant article pages with intent-specific anchors.
4. Recheck schema and title/H1 uniqueness before publishing any new governance, firewall, audit, mapping or city page.

## Decision

**NO-GO for publishing more content until the link-graph gate is trustworthy, current GSC/live HTTP evidence is collected, and route-collision warnings are resolved or explicitly accepted.** The eight targets currently have strong local crawlability/indexability signals, but no current GSC status is known. This is not a claim that any target is deindexed. The old “crawled currently not indexed” snapshot must not trigger bulk deletion or `noindex`.

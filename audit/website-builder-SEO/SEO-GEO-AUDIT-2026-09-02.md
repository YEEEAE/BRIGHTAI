# BrightAI SEO/GEO Audit — 2026-09-02

- **Canonical target:** `https://brightai.live`
- **Audit scope:** live technical SEO/GEO, crawler access, homepage metadata/schema, sitemap coverage, representative internal pages, and local SEO gates.
- **Overall verdict:** **PASS for the live public surface; local generated-output hygiene needs cleanup before the complete local gate can pass.**

## Executive summary

The live BrightAI website is crawlable and indexable. The homepage returns HTTP 200, declares a self-referencing canonical, allows indexing, exposes one H1, includes complete social metadata, and emits a substantial JSON-LD graph. The canonical sitemap returns 262 public URLs on `brightai.live`, with no `brightai.site` references. All 17 tested traditional-search and AI crawler user agents received HTTP 200 and were allowed by `robots.txt`.

No production P0 indexing blocker was found.

## Live homepage

| Check | Result | Evidence |
|---|---:|---|
| HTTP status | ✅ | `200` over HTTP/2 |
| HTTPS | ✅ | Production request completed over HTTPS |
| Title | ✅ | `حوكمة الذكاء الاصطناعي السعودية \| BrightAI` — 42 characters |
| Meta description | ✅ | 158 characters |
| Robots meta | ✅ | `index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1` |
| Canonical | ✅ | `https://brightai.live/` |
| H1 | ✅ | Exactly one H1; contains the AI-governance topic |
| Open Graph | ✅ | Title, description, URL, image, and `ar_SA` locale present |
| Hreflang | ✅ | Three declarations found |
| JSON-LD | ✅ | One consolidated block with multiple graph nodes |
| Synthetic fetch time | ✅ | Skill audit: 0.62s; compressed curl: TTFB 0.317s, total 0.337s |
| Compressed HTML transfer | ℹ️ | 36,828 bytes in the curl sample |

The synthetic transfer measurements above are not field Core Web Vitals and must not be reported as LCP, INP, or CLS.

## Structured data

The live homepage JSON-LD parsed successfully and includes:

- `Organization`
- `WebSite`
- `LocalBusiness` + `ProfessionalService`
- `WebPage` with `SpeakableSpecification`
- `SoftwareApplication` + `WebApplication`
- `FAQPage`
- `DefinedTermSet`

`SearchAction` is intentionally omitted. The source documents that there is no public `/search` route; advertising a search action that resolves to 404 would be misleading and can violate Google's sitelinks search-box guidance. Re-add it only after a real public search route ships.

## robots.txt and AI crawler access

`https://brightai.live/robots.txt` returns 200, declares `Allow: /`, and points to the canonical sitemap. It explicitly includes the key search and AI crawler tokens.

### Runtime crawler test

All 17 agents were both allowed by parsed `robots.txt` rules and returned HTTP 200 from the homepage:

1. Googlebot
2. Googlebot-Image
3. Bingbot
4. Applebot
5. DuckDuckBot
6. GPTBot
7. OAI-SearchBot
8. ChatGPT-User
9. PerplexityBot
10. ClaudeBot
11. anthropic-ai
12. CCBot
13. Bytespider
14. Meta-ExternalAgent
15. Google-Extended
16. Applebot-Extended
17. Amazonbot

**Result:** `17/17 PASS`.

The project's Node-based crawler verifier returned `fetch failed` for all network requests in this sandbox because Node's fetch path did not use the active proxy correctly. Python and curl independently reached the same production endpoints and crawler variants, so this is an execution-environment failure, not evidence of a Cloudflare block.

## Sitemap and public-page coverage

- `https://brightai.live/sitemap.xml`: HTTP 200
- Content type: `application/xml`
- Root: valid sitemap `urlset`
- URL count: **262**
- `brightai.live` URLs: **262**
- `brightai.site` URLs: **0**
- Sitemap URLs with `noindex`: **0**
- Missing canonical tags in the live scan: **0**

A concurrent scan initially encountered transient `URLError` results for `/kernel/reports/` and `/terms/`. Individual retries returned HTTP 200 in 1.90s and 0.54s respectively. The five apparent canonical mismatches on Arabic category URLs were percent-encoded sitemap URLs versus decoded Unicode canonical URLs; they identify the same URLs and are not semantic canonical conflicts.

Representative pages `/about/`, `/services/`, `/solutions/`, `/blog/`, `/trust/`, `/contact/`, and `/en/` all returned 200, had one H1, emitted JSON-LD, had self-referencing canonicals, and did not contain `noindex`.

## AI-readable discovery files

| Resource | Status | Notes |
|---|---:|---|
| `/llms.txt` | ✅ 200 | Canonical high-value reading map; 2,548 bytes |
| `/llms-full.txt` | ✅ 200 | Expanded canonical reading map; 2,671 bytes |
| `/.well-known/ai-plugin.json` | ℹ️ 404 | Optional legacy plugin resource; not required for SEO/GEO crawlability |

Both LLM files were last reviewed on 2026-08-24 and clearly state the product scope and non-legal-advice boundary.

## Local verification gates

| Command | Result | Notes |
|---|---:|---|
| `python3 scripts/seo_audit.py https://brightai.live` | ✅ | Metadata, H1, schema presence, robots, sitemap, and sub-3s synthetic load passed |
| `pnpm seo:schema` | ✅ | Schema audit passed for 62 pages; speakable audit passed for 283 pages |
| `pnpm seo:all` | ❌ local artifact issue | Stopped in `seo:check` because stale ignored files exist in `dist/client` |
| `pnpm seo:gate` | ❌ local artifact issue | 50 errors trace back to duplicate generated files such as `index 2.html` and `kernel 3/index 2.html` |
| `node scripts/verify-crawler-access.mjs` | ❌ environment | Node fetch could not use the sandbox network path; Python/curl replacement passed 17/17 |

The malformed `dist/client` paths are ignored generated output and are not tracked source files. Sample equivalent production URLs containing `%20` returned 404 and none appear in the 262-URL sitemap. This is local build-directory pollution, not a live indexing defect.

## Priorities

### P0 — production blockers

- None found in this audit.

### P1 — local verification hygiene

1. Clean the ignored `dist/` output before the next full production build, then rerun `pnpm build` and `pnpm seo:all`.
2. Do not delete the generated directory automatically without owner approval under the current repository rules.
3. If duplicate suffixed artifacts return after a clean build, investigate the build/sync writer rather than teaching SEO checks to ignore them.

### P2 — monitoring and evidence

1. Record Search Console and Bing Webmaster Tools index coverage; this audit proves crawlability, not actual index inclusion or ranking.
2. Run PageSpeed Insights or Lighthouse mobile to capture LCP, INP, and CLS; transfer time alone is not Core Web Vitals evidence.
3. Monitor AI citations for Saudi queries such as `حوكمة الذكاء الاصطناعي في السعودية`, `AI governance Saudi Arabia`, and `PDPL AI compliance`.
4. Refresh `llms.txt` and `llms-full.txt` when canonical topic owners or major product claims change.

## Final result

- **Live technical SEO:** PASS
- **Live AI crawler access:** PASS — 17/17
- **Sitemap consistency:** PASS — 262/262 on `brightai.live`
- **Homepage metadata and schema:** PASS
- **Local full SEO gate:** BLOCKED by stale ignored `dist/` duplicates
- **Search-engine indexing/rank evidence:** Not measured in this audit
- **Core Web Vitals evidence:** Not measured in this audit

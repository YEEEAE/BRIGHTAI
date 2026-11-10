# P14 — SEO: Canonical, Redirects, Sitemap, Schema

**Date:** 2026-11-10 (local) · **Environment:** macOS / Node v24.20.0, local only, no network, no production secrets
**HEAD at start:** `2eb45b704e1b1aba0110430a878dbab750ec5245` (main) + working-tree changes listed below
**Reference:** `7b1f533f71c7b1f41884790366a4d5967c85a87b` + `Audit/final-360-2026-11-10/`

## Deviation from the reference SHA

HEAD is 12 commits ahead. The SEO plumbing (`redirects.json`, `scripts/server.mjs`, `scripts/seo-build.mjs`, `src/server/seo/redirects.mjs`) is unchanged since `7b1f533`; `BaseLayout`, `AppLayout` and the product pages changed under P04/P12, so every conclusion below was re-measured on HEAD rather than inherited from the report.

## Changes made in this pass

1. **Indexability:** removed the sensitive-query `noindex` rule from `BaseLayout.astro`. It was dead code anyway (public pages are `prerender = true`, so the layout runs at build time with no query). Parameterized public URLs now stay `index, follow` and the clean canonical consolidates them.
2. **`/kernel/` indexed:** dropped `robots="noindex, follow"`, removed it from the sitemap exclusion in `astro.config.mjs`. Sitemap, `llms.txt` and the crawl now include it (55 → 56 pages).
3. **Article schema:** `articleStructuredData` now takes a real `published` date and emits `image`; the helper exports `articleImage`, reused by the six articles that build their own object. `datePublished` values come from the page's creation date in git (`2026-10-31` / `2026-11-03`) and from the guides' declared `2026-11-08`; nothing was guessed.
4. **`iso-42001-saudi`:** its `dateModified` (helper default `2026-10-31`) predated `datePublished` (`2026-11-03`); corrected to `2026-11-03`.
5. **`scripts/verify-routes.mjs`:** public crawl now excludes `/app`, `/auth`, `/healthz` (503 by design under the closed portal) and asserts they are non-public and absent from the sitemap; added `datePublished`+`image` checks for Article, a kernel-indexability assertion, and a guard that the account surface is the only retained `noindex`.

## Commands and results

| Check | Command | Result |
|---|---|---|
| Build + sitemap + alias coverage | `npm run build` | PASS — `PASS: 56 public pages in sitemap and llms.txt; HTML aliases covered` |
| Full route/SEO crawl | `PORT=8094 HOST=127.0.0.1 node scripts/server.mjs` + `node scripts/verify-routes.mjs http://127.0.0.1:8094` | PASS — 56 pages, 2945 references, 79 unique paths, 4 CSS assets, 32 articles, 117 redirects × GET/HEAD, 0 broken refs, 0 orphans |
| Redirect graph | map walk over `redirects.json` | 117 sources, 0 loops, 0 chains |
| Offline HTML audit | node script over `dist/client` | 56 `index, follow`; only `/404.html` noindex; 32 Article, 0 missing `datePublished`, 0 missing `image`, 0 `dateModified < datePublished` |
| Negative cases | curl/fetch | `%ZZ` → 400; `//about.html` → 404; `POST /about.html` → 404; unknown path → 404; `/app/*`, `/healthz/` → 503 noindex and out of sitemap; `/auth/sign-up/` → 200 noindex, `private, no-store` |

## Indexability boundary (explicit)

The user asked that every page be indexed. All **public content** pages are now `index, follow` and in the sitemap, including `/kernel/`.

Retained non-indexable, by necessity rather than choice:

- `/app/*` — private workspace, 503 while the portal is closed (P04). A 503 cannot be indexed, and the pages require an authenticated session.
- `/auth/*` — signed-out account screens; `noindex, nofollow` + `Cache-Control: private, no-store` (asserted by the verifier).
- `/healthz/` — readiness probe, 503/200 JSON, not content.
- `/404/` — error page; a 404 response is never indexed and `noindex` prevents soft-404 indexing.

If the account or workspace surfaces must also be indexed, that is a product/security decision outside P14 and contradicts the private-surface invariant in `src/middleware.ts`.

## SE04 — HTML aliases on the target service

Target is the Render **Node web service** (`render.yaml`: `startCommand: npm start` → `scripts/server.mjs`), which applies `redirects.json` before the Astro/static handler.

Verified on HEAD, single hop, `Location` correct:

| Request | Response |
|---|---|
| `/index.html` | 301 → `/` |
| `/about.html` | 301 → `/about/` |
| `/products/index.html` | 301 → `/products/` |
| `/knowledge/ai-governance-saudi.html` | 301 → `/knowledge/ai-governance-saudi/` |
| `/docs/حوكمة الذكاء الاصطناعي في السعودية` (percent-encoded) | 301 → `/knowledge/ai-governance-saudi/` |
| `/knowledge/`, `/knowledge.html`, `/knowledge.html/` | 301 → `/docs/` |
| `/about.html?a=1&b=2` | 301 → `/about/?a=1&b=2` (query preserved) |
| `/about` (no trailing slash) | 301 → `/about/` |

`verify-routes.mjs` asserts every one of the 117 sources for GET and HEAD with a query, that no source is another entry's destination, and that every destination is a sitemap page except `/404/` and `/sitemap-index.xml`.

The historical **static_site** 404 (`/about.html`) is not reproducible locally and cannot be fixed in this repo: a static host does not read `redirects.json`. It closes only when the operator points the domain at the Node service (P04: unpushed). No push/deploy was performed.

## Acceptance mapping

| ID | Status | Evidence |
|---|---|---|
| SE01 canonical/200 | PASS LOCAL | 56/56 canonical URLs 200, canonical equals page, `og:url` matches |
| SE02 metadata/H1/alt/JSON-LD | PASS LOCAL | unique titles/descriptions, one H1, 0 missing alt, 0 invalid JSON-LD |
| SE03 robots/sitemap/links | PASS LOCAL | robots allows crawl + sitemap ref; sitemap excludes only app/auth/404/healthz; 0 broken refs, 0 orphans; `llms.txt` covers all 56 |
| SE04 aliases 301 | PASS LOCAL / **BLOCKED runtime** | table above; runtime needs owner push+deploy of the Node target |
| SE05 Saudi visibility/GSC | DEFERRED — P25 | no GSC/GBP read attempted; no NAP invented |
| SE06 CWV/rich results | DEFERRED — P25 | no CrUX/Lighthouse run; Article now rich-result eligible, Product intentionally without offers |

UI02–UI05 were not re-measured here; no hero/Constellation change was made.

## Status

**PARTIAL** — SE01–SE03 PASS LOCAL on HEAD, SE04 verified locally and blocked only by the unauthorized deploy, SE05/SE06 owned by P25. `PASS ≠ RELEASED`.

## Rollback

Revert the six changed source files (`src/layouts/BaseLayout.astro`, `src/data/structured-data.ts`, `src/pages/kernel.astro`, `astro.config.mjs`, `src/pages/knowledge/*`, `scripts/verify-routes.mjs`) and rebuild; crawl the same build to compare before/after.

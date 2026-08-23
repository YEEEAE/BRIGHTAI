# Indexation Architecture Cleanup — Local Verification

- Date: 2026-08-23
- Scope: canonical URLs, trailing slashes, redirects, sitemap membership and freshness, hreflang, robots/noindex, duplicate canonical surfaces, internal routes, and URL parameters.
- Production boundary: local build evidence only. No current live HTTP or Google Search Console evidence was available in this workspace.

## Canonical URL contract

`https://brightai.site/<path>/` is the only canonical form for public routes. The home page is the sole exception: `https://brightai.site/`.

- `astro.config.mjs` enforces `trailingSlash: 'always'`.
- `BaseLayout.astro` derives a trailing-slash self-canonical when a page does not provide one.
- `robots.txt` advertises only `https://brightai.site/sitemap.xml` and does not block public paths.

## Before / after

| Check | Before | After | Evidence |
| --- | ---: | ---: | --- |
| Internal navigation links to legacy city redirect URLs | 6 | 0 | `scripts/navigation-canonical-links.test.mjs` and rebuilt HTML |
| Redirect entries | 209 | 209 | No self-redirects, chains, cycles, missing destinations, or `.html` destinations |
| Canonical issues in isolated link-architecture audit | 0 | 0 | 274 built pages |
| Sitemap URLs | 258 | 258 | HTTPS-only, trailing-slash URLs, no parameters or fragments |
| Sitemap URLs without an indexable self-canonical page | 0 | 0 | Normalized canonical-to-rendered-HTML comparison |
| Sitemap URLs represented only by `noindex` pages | 0 | 0 | Normalized canonical-to-rendered-HTML comparison |
| Orphan indexable routes | 0 | 0 | Internal-link architecture audit |
| Pages outside sitemap | 0 | 0 | Internal-link architecture audit |
| Hreflang sets with errors | 0 / 259 | 0 / 259 | Self, return, x-default, and EN contracts checked |

## Change applied

`src/data/navigation.ts` now links each city footer item directly to its final, indexable sector-city URL. The six legacy `/solutions/cities/<city>/` endpoints remain historical redirects only and receive no internal navigation links.

## Noindex and duplicate-surface review

The local build has 16 `noindex` HTML responses: the error page, design utilities, offline/admin utility pages, thank-you page, and six legacy city redirect stubs. None is in the sitemap as its sole canonical page. Strategic public solution, hub, documentation, blog, customer, and assessment pages remain indexable.

The six legacy city redirect stubs carry the canonical URL of their final destination by design, which creates a duplicate *canonical value* in raw build files. They are `noindex` plus meta-refresh redirect stubs and are excluded by the sitemap generator; the corresponding destination pages are indexable self-canonical HTML. This is not sitemap duplication.

## Verified audit artifacts and remaining non-indexation work

- The previously seen mass `canonical_mismatch` report was reproduced as a report-file race caused by concurrent audit writers. Running `scripts/internal-linking-architecture.mjs` alone against `dist/client` reports `0` canonical issues.
- The 103 hash findings are not canonical/sitemap findings. Sample inspection showed the requested anchors are absent from the rendered DOM (some apparent matching IDs occur only inside escaped code examples), so they are genuine in-page navigation defects and should be handled in a dedicated UX/content cleanup.
- The build completes, but Astro still emits its pre-existing route-collision warnings for legacy static paths. They were not changed here because resolving them requires a separate source-route consolidation/deletion decision.

## Fresh verification

- `pnpm build` — completed successfully; sitemap regenerated with 258 URLs.
- `node --test scripts/navigation-canonical-links.test.mjs` — 1/1 pass.
- `pnpm redirects:check` — 209 scanned, 0 chains, 0 cycles, 0 missing destinations.
- `pnpm seo:check` — pass.
- `pnpm seo:hreflang` — 259 sets, 0 errors.
- `pnpm internal-links:audit` — 0 broken links, 0 orphan pages, 0 canonical issues, max click depth 3.

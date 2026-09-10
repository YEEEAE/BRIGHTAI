# 09 — Technical SEO Fixes (verified defects only)

Date (UTC): 2026-09-10
Principle: healthy infra left untouched; one-generator fixes; every schema node matches visible/real content; nothing invented.

## A. Structured data — local validator results

Custom dist-wide validator (274 pages with JSON-LD, 8 without — all 8 are non-indexed utilities: `go/whatsapp` standalone, 6 noindex city stubs, `kernel/admin/quota`).

| Check | Before | After |
|---|---|---|
| Organization.name/logo missing | 0 (verified absent — single source `ORGANIZATION` in `schema-helpers.ts`) | 0 |
| Article.image/author/datePublished missing | 7 (customers×3 image+author+date; pdpl-statement image) | **0** |
| Unverified commercial fields (`priceRange`/`openingHoursSpecification`/`paymentAccepted`/`currenciesAccepted`) | 59 node-instances | **0** |
| Misplaced street address (outside Riyadh) | 0 | 0 |
| Placeholder/relative-URL/JSON errors | 0 | 0 |

Type census (after): WebPage 300, BreadcrumbList 264, Organization 254, WebSite 254, LocalBusiness 231, ProfessionalService 228, FAQPage 105 (all synced per gate), Article 101 (+BlogPosting 97 = blog count), TechArticle 50 (= docs count), Service 42, CollectionPage 18, LegalDocument 11, Person 4 (real registry), Event/ContactPage/AboutPage as appropriate. No HowTo emitted anywhere.

### Fix 1 — `src/components/seo/Schema.astro` (foundation generator, all pages)
Removed `priceRange`/`currenciesAccepted`/`paymentAccepted`/`openingHoursSpecification` from the Riyadh-HQ node. Kept: name, description, url, telephone, image, founder-confirmed address, public city-centre geo, areaServed (KSA + 6 cities), parentOrganization. Reason: the four fields were founder-confirmed for none of them and match no visible content.

### Fix 2 — `src/data/schema-helpers.ts` → `getLocalBusinessLd` (6 city nodes)
Only Riyadh keeps `address` + `LocalBusiness` type. Jeddah/Dammam/Khobar/Mecca/Madinah now emit plain `Service` (mirrors the city-page template's SAB-honesty rule): previously all six stamped the Riyadh street (رويغب الفيحاء) into five wrong cities = fabricated branch offices. Same four commercial fields removed. All `href`s verified pointing at real sector/city pages.

### Fix 3 — `src/pages/about/index.astro`
Emits only `LOCAL_BUSINESS_BY_CITY.riyadh` now (was: all six). Visible content mentions only Riyadh ("مقر التواصل في الرياض") — the other five nodes matched no visible content.

### Fix 4 — `src/pages/solutions/[sector]/[city].astro`
Removed `"priceRange": "$$$"` from the city Service node (unverified garnish).

### Fix 5 — customers×3 + pdpl-statement Article completion
- `src/pages/customers/{bank,hospital,pharma}/index.astro`: added `image` (absolute site OG asset), `author` = Organization `@id` (no invented person), `datePublished: 2026-07-08` + `dateModified: 2026-09-10` (git-verified file birth/edit dates).
- `src/pages/pdpl-statement/index.astro`: added `image` (existing author Org + real dates kept).
- Same three files: one-line illustrative framing appended to each CaseStudy summary (unnamed-bank/hospital/factory stories with precise metrics are now declared illustrative, not documented client results).

### Kept deliberately (verified, documented)
- Foundation `LocalBusiness+ProfessionalService` (single Riyadh HQ `@id`, real address/phone) on content pages; kernel pages already opt out via `omitLocalBusiness`.
- `FAQPage` nodes (105): every one mirrors visible Q&A and passes the sync gate; removal would break `seo-schema-audit` and prior documented decisions.
- City Service nodes: areaServed + public city geo + wikidata (factual reach, no addresses).
- `Offer` (price 0 SAR = free assessment/tool — truthful), `Event` (real events), `Person` (real author registry), `SpeakableSpecification` (h1 + validated selectors).

## B. Image SEO — allegation disproved
Dist-wide scan: **819 `<img>`, 0 without `alt`**. The suspected shared-source gap does not exist (initial grep hit was multi-line `<img>` tags in `TrustBadges.astro`, which carries descriptive Arabic alt + dimensions + eager/async correctly). No fix needed; no keywords stuffed into alt text anywhere per spot-check.

## C. Other checks (dist-wide, 282 pages)
- Canonical: 0 missing, 0 non-trailing-slash ✅
- Hreflang: gate 0 errors ✅ (unchanged)
- `og:url` trailing slash: 0 bad ✅
- `og:title`/`twitter:card`: missing only on 15 answer pages + `go/whatsapp` (standalone minimal templates) → **fixed** in `src/pages/answer/[slug].astro` (one-template fix: favicon + apple-touch + OG + Twitter, locale-aware). Verified `og:title` present post-build.
- Favicon: same 16 standalone pages → fixed by the same edit (logo asset, real file).
- Viewport / `lang`: missing only on 6 noindex legacy city stubs → intentionally untouched (non-indexable).
- Robots directives: `index,follow` default intact; noindex only where previously decided ✅
- Language attributes: `ar` RTL / `en` LTR correct incl. answer EN subset ✅

## D. Files changed (exact)
1. `src/components/seo/Schema.astro` — commercial-field removal
2. `src/data/schema-helpers.ts` — `getLocalBusinessLd` HQ-only address/type + commercial-field removal
3. `src/pages/about/index.astro` — Riyadh node only
4. `src/pages/solutions/[sector]/[city].astro` — drop `priceRange`
5. `src/pages/customers/bank|hospital|pharma/index.astro` — Article completion + illustrative framing
6. `src/pages/pdpl-statement/index.astro` — Article image
7. `src/pages/answer/[slug].astro` — favicon/OG/Twitter head tags

## E. Verification evidence
- `pnpm build` ✅ exit 0 — sitemap 264 (unchanged count)
- `pnpm typecheck` ✅ exit 0, 0 errors
- `node scripts/seo-ci-check.mjs` ✅ 0 errors / 0 warnings
- `node scripts/seo-schema-audit.mjs` ✅ 64 pages
- `node scripts/check-speakable-schema.mjs` ✅ 268 pages
- `node scripts/hreflang-bidirectional-audit.mjs` ✅ 0 errors
- `npm run internal-links:audit` ✅ 0 orphans, depth ≤3
- `node scripts/qa/check-word-count.mjs` ✅ 4/4 PASS
- `npm run redirects:check` ✅ exit 0, no chains/cycles
- `pnpm test` ✅ 16+29+38 pass, 0 fail
- Local JSON-LD validator ✅ 0 issues (was 7 + 59 commercial-field instances)
- Local img-alt scan ✅ 819/819 with alt
- Local head-tag scan ✅ 0 missing canonical; OG/Twitter gaps closed (16 pages fixed)
- `robots.txt` untouched and valid (single Sitemap directive, AI-search allowlist intact)

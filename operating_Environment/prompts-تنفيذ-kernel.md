# BrightAI Audit — Execution Prompts (English)

- **Companion report:** `2026-08-08-brightai-audit-report-ar.md` (Arabic, Saudi dialect)
- **Date:** 2026-08-08
- **Branch:** `brightai-audit`
- **Repo:** `YEEEAE/BRIGHTAI`
- **Site:** https://brightai.site
- **Stack:** Astro 6.4.6 + `@astrojs/node` (standalone) on Render, Cloudflare in front

## How to use this file

Each prompt is **self-contained and copy-pasteable** into a coding agent. Every prompt includes: the measured evidence, the exact scope, hard constraints, and the verification command that must pass before the task is considered done.

**Execution order is mandatory.** `BAI-P0-01` gates everything — do not start content work while search engines are receiving 403.

| ID | Title | Severity | Owner |
|---|---|---|---|
| BAI-P0-01 | Unblock search + AI crawlers at Cloudflare | P0 — Blocker | DevOps |
| BAI-P0-02 | Cut JS bundle from 330 KB to ≤ 60 KB gz | P0 | Frontend |
| BAI-P0-03 | Fix homepage CLS 0.168 / LCP 4.1s / Perf 29 | P0 | Frontend |
| BAI-P1-01 | Link 22 orphan pages | P1 | SEO/Frontend |
| BAI-P1-02 | Index ALL 29 pages outside sitemap (ZERO noindex) | P1 | SEO |
| BAI-P1-03 | Expand 24 thin `docs/` files | P1 | Content |
| BAI-P1-04 | Fix 69 source-level link references | P1 | Frontend |
| BAI-P2-01 | Fix 43 out-of-range titles/descriptions | P2 | SEO |
| BAI-P2-02 | Add `<h2>` to 10 flat pages | P2 | Content |
| BAI-P2-03 | Add HowTo + Dataset schema, shrink City bloat | P2 | SEO |
| BAI-P2-04 | Review 736 empty `alt` attributes | P2 | Frontend |
| BAI-P2-05 | Resolve dead `_headers` config drift | P2 | DevOps |
| BAI-P2-06 | Remove ALL 16 `noindex` directives (ZERO noindex) | P2 | SEO |

---

## Global constraints — apply to EVERY prompt below

Paste this block together with any individual prompt.

```
NON-NEGOTIABLE CONSTRAINTS FOR ALL WORK IN THIS REPO:

1. NEVER modify published Arabic copy to "correct" dialect. The Saudi dialect in
   published content is a deliberate brand decision. Content indexed by Google is
   sacred.

2. NEVER change an existing URL slug, canonical, hreflang pair, or redirect target
   without an explicit instruction to do so. 218 redirect lines and 259 hreflang
   sets depend on current paths.

3. NEVER weaken these production response headers:
   strict-transport-security, content-security-policy, x-content-type-options,
   x-frame-options, referrer-policy, permissions-policy, x-robots-tag.

4. Run the full verification gate before claiming completion:
   pnpm build
   node scripts/seo-health-check.mjs
   node scripts/seo-ci-check.mjs
   node scripts/hreflang-bidirectional-audit.mjs
   node scripts/check-speakable-schema.mjs
   node scripts/check-performance-budget.js
   node scripts/internal-linking-architecture.mjs --source dist/client

5. NO-REGRESSION BASELINE — these numbers must not get worse:
   - hreflang sets with zero errors:        259  (must stay >= 259)
   - pages with canonical+title+desc+H1:    275  (must stay = 275)
   - broken links in dist/client:             0  (must stay = 0)
   - pages with valid Speakable schema:     262  (must stay >= 262)
   - images missing width/height:             0  (must stay = 0)
   - images missing alt attribute entirely:   0  (must stay = 0)
   - max click depth from /:                  3  (must stay <= 3)
   - Lighthouse a11y:                        96  (must stay >= 96)
   - Lighthouse SEO on homepage:            100  (must stay = 100)

6. Write a dated report at report/YYYY-MM-DD-<description>.md in Saudi dialect
   Arabic prose, per the repository AGENTS.md convention.

7. Do not claim "done" without pasting the actual command output that proves it.
   A successful compile is not verification of behavior.
```

---

---

## BAI-P1-02 — Index ALL 29 pages outside sitemap.xml (ZERO noindex allowed)

```
TASK: 29 HTML files exist in dist/client but are absent from sitemap.xml.
DECISION: EVERY page on this site must be indexed. There is NO noindex anywhere.
Every HTML file must appear in sitemap.xml, be free of any noindex directive,
and be reachable via at least one contextual internal link.

MEASURED EVIDENCE — diff of dist/client/**/*.html against <loc> entries:

  Total HTML files:  275
  Sitemap URLs:      251
  Outside sitemap:    29

  ALL 29 MUST BE INDEXED — no exceptions, no exclusions:

    System pages (previously listed as "correctly excluded" — now INDEXED):
      404.html, 500.html, offline/, kernel/offline/, kernel/api/,
      kernel/admin/quota/, thank-you/,
      design/buttons/, design/cards/, design/colors/, design/forms/,
      design/typography/

    Group A — /lp/ (5 pages), ALSO orphaned (see BAI-P1-01):
      lp/banking/  lp/ecc/  lp/government/  lp/healthcare/  lp/pdpl/
      Status: indexable + no sitemap entry + zero inbound links.

    Group B — solutions/cities/ (6 pages):
      solutions/cities/riyadh/  jeddah/  dammam/  khobar/  mecca/  madinah/
      Important signal: scripts/seo-health-check.mjs classified exactly these 6
      as "partial or incomplete HTML files" and skipped detailed checks on them.
      That strongly suggests they are fragments/partials, not real pages. If so,
      FIX them into complete standalone pages (full <html>, <head>, <body>,
      single <h1>, meta title, meta description, canonical, hreflang, JSON-LD)
      and then index them. Do NOT stop building them. Do NOT remove them from
      route generation.

    Group C — blog/category/ (5 pages, non-ASCII Arabic slugs):
      blog/category/ذكاء-اصطناعي/   blog/category/أمن-البيانات/
      blog/category/تحول-رقمي/      blog/category/دراسات-حالة/
      blog/category/رؤية-2030/
      These are indexation assets. Index them. Do NOT treat them as thin
      duplicate-listing pages.

    Group D — events/ (1 page):
      A public-looking page absent from the sitemap. Most likely an oversight.
      Index it.

WHAT TO DO — for EACH page in groups A through D, the ONLY outcome is:

  (1) INDEX IT      -> add to sitemap + ensure >= 1 contextual inbound link

  NOINDEX IS FORBIDDEN. There is no option (2) and no option (3). Every single
  HTML file in dist/client must be:
    - present in sitemap.xml
    - free of any noindex robots directive (meta robots or X-Robots-Tag)
    - reachable via at least one contextual internal link

  Additionally: remove EVERY existing noindex directive from the entire site.
  The final state must have ZERO noindex pages in dist/client.

  Document the rationale for every single decision. "Left as-is" is not an
  acceptable outcome for any page in groups A-D.

WHY AMBIGUITY IS DANGEROUS:
  A page that is simultaneously indexable, absent from the sitemap, and orphaned
  is stranded. Google may discover it via an external link and index it with zero
  internal authority — a thin low-quality URL that dilutes site-level quality
  signals. Leaving any page outside the sitemap or with noindex creates the same
  stranded state.

CONSTRAINTS:
  - NO noindex anywhere. Remove every existing noindex robots directive from
    every page in dist/client. The site must have ZERO noindex pages.
  - noindex and hreflang must never coexist — since noindex is being eliminated
    entirely, this constraint is automatically satisfied.
  - Do NOT URL-encode or transliterate the Arabic category slugs if you keep
    them. Changing them breaks existing links.
  - Coordinate Group A with BAI-P1-01 so the two tasks do not conflict.
  - Every page added to the sitemap must also gain >= 1 contextual inbound link
    (internal linking architecture must not report new orphans).

VERIFICATION:
  pnpm build
  node scripts/seo-health-check.mjs      # 0 issues; ZERO noindex pages
  node scripts/seo-ci-check.mjs          # 0 errors, 0 warnings
  # Recount the gap — it must be ZERO:
  cd dist/client && find . -name "*.html" | wc -l
  grep -c "<loc>" dist/client/sitemap*.xml
  # Both numbers must be EQUAL (every HTML file in the sitemap).
  # Confirm zero noindex anywhere:
  grep -rl "noindex" dist/client/ | wc -l   # must be 0

DELIVERABLE: report/YYYY-MM-DD-sitemap-coverage-decisions.md with a 29-row table:
path | decision | rationale. Every decision must be "INDEX".
```

---

## BAI-P1-03 — Expand the 24 thin `docs/` files to 1200+ words

```
TASK: 24 files under src/content/docs/ are below the project's 1200-word minimum.
The worst offenders are the PDPL and NCA ECC topics — the core of BrightAI's
value proposition.

MEASURED EVIDENCE — node scripts/check-word-count.mjs:

  blog/ articles: ALL PASS (weakest 1543 words, strongest ai-audit-trail-saudi.md
  at 4074). The problem is isolated to docs/.

  File                      Words   Short by
  pdpl-audit.md               383        817   <-- worst
  ecc-vs-iso27001.md          426        774
  pdpl-rights.md              435        765
  pdpl-breach.md              443        757
  ecc-audit.md                444        756
  pdpl-thirdparty.md          446        754
  pdpl-impact.md              447        753
  pdpl-consent.md             450        750
  ecc-supply-chain.md         465        735
  pdpl-ai.md                  483        717
  ecc-mobile.md               484        716
  pdpl-data.md                487        713
  ecc-incident.md             522        678
  ecc-ai-mapping.md           523        677
  ecc-assess.md               538        662
  ecc-2-2024.md               679        521
  sama-cloud.md               814        386
  sama-ai-risk.md             822        378
  sama-ai-implementation.md   835        365
  sama-ai-governance.md       840        360
  sama-cyber.md               857        343
  sama-open.md                857        343
  sama-banking.md             860        340
  sama-ai.md                  947        253

  Corroborating build-level signal: 33 HTML pages in dist/client are under 400
  words, against a site-wide average of 1454 words per page.

PRIORITY ORDER — do not work alphabetically:
  Tier 1 (383-487 words):  all pdpl-* and ecc-* files. Largest gap, highest
                           commercial value. Start here.
  Tier 2 (522-679 words):  ecc-incident, ecc-ai-mapping, ecc-assess, ecc-2-2024
  Tier 3 (814-947 words):  all sama-* files. Closest to threshold; each needs
                           only 253-386 more words.

HOW TO EXPAND — quality bar, not word padding:
  Every added section must earn its place. Use these patterns, which also
  increase AI-citation probability:
    - A concrete Saudi-context worked example per document
    - A control-mapping table (the build already contains 153 tables — follow the
      established table conventions)
    - A "common mistakes" section with specific, non-generic failure modes
    - An FAQ block with 3-5 real questions (the build has 88 FAQPage schemas with
      361 Q/A pairs — match the existing pattern and keep the schema valid)
    - Explicit regulatory citations (PDPL articles, NCA ECC control IDs,
      SAMA framework sections)
  Target 1400-1600 words so a later edit does not drop back below threshold.

CONSTRAINTS:
  - Write in the same Saudi dialect register as existing published content. Do
    NOT switch to MSA and do NOT "correct" existing dialect.
  - Regulatory acronyms stay in English inside Arabic prose: PDPL, NCA, SDAIA,
    SAMA, ECC, ISO, SFDA, ZATCA.
  - Do NOT invent regulatory requirements, article numbers, control IDs,
    deadlines, or penalties. If a specific fact cannot be verified, write around
    it. A fabricated compliance claim is a legal risk for a governance vendor.
  - Do NOT change frontmatter slugs, titles, or canonical fields.
  - Do NOT reduce or restructure existing correct content — add to it.
  - Every document must keep at least one <h2>-level heading structure; site
    average is 9.9 H2 per page. Aim for 6+ in an expanded doc.

VERIFICATION:
  node scripts/check-word-count.mjs      # zero files below 1200
  pnpm build
  node scripts/seo-health-check.mjs      # single H1 per page maintained
  node scripts/seo-ci-check.mjs          # 0 errors
  node scripts/seo-schema-audit.mjs      # any new FAQPage schema must validate

DELIVERABLE: report/YYYY-MM-DD-docs-content-expansion.md with the before/after
word count table.
```

---

## BAI-P1-04 — Fix the 69 source-level link references

```
TASK: The source-file link audit reports 69 breakages. None are auto-fixable.

MEASURED EVIDENCE — node scripts/internal-links-audit.mjs:

  Files scanned:          158
  Total references:       226
  Internal references:     92
  Breakages detected:      69
  Auto-fixable:             0
  Pattern normalizations:   1
  Report: reports/internal-links/broken_links_before.md

CRITICAL CONTEXT — READ BEFORE PANICKING:
  This does NOT contradict seo-ci-check, which reports 0 broken links across
  48,690 references. The two tools have different scopes:
    - seo-ci-check      scans dist/client (built HTML)  -> 100% clean
    - internal-links-audit scans SOURCE files (md/mdx/astro) -> 69 breakages

  Meaning: no visitor and no crawler currently sees a broken link. These are
  dead references inside source files — relative markdown paths, doc-to-doc
  links, asset references. This is technical debt, not a live user-facing bug.
  It detonates the moment someone moves a file or restructures a directory.

  Sample from link-graph-validator output — references from about/index.html:
    /terms/
    /pdpl-statement/
    /data-processing-agreement/
    /privacy-cookies/
  Note that /privacy-cookies/ sits alongside actual built pages
  en/cookie-policy/ and en/privacy-policy/ — a naming-consistency smell worth
  investigating.

WHAT TO DO:
  1. Read reports/internal-links/broken_links_before.md in full and classify all
     69 into buckets:
       - wrong relative path (fix the path)
       - target genuinely renamed/removed (fix or remove the reference)
       - intentional placeholder (remove it or mark it explicitly)
       - false positive from the audit script (fix the script's detection, and
         document why it was a false positive)
  2. Fix by bucket, smallest-risk bucket first.
  3. Apply the 1 pattern normalization opportunity the script identified.
  4. If any bucket turns out to be a systematic script false positive, fixing
     scripts/internal-links-audit.mjs is a legitimate and preferred outcome — but
     you must prove the reference actually resolves.

CONSTRAINTS:
  - Do NOT "fix" a broken reference by deleting content that mentions it.
  - Do NOT rename any target page to match a broken reference. Fix the reference,
    not the URL. 218 redirects depend on current URLs.
  - dist/client broken links must remain exactly 0.

VERIFICATION:
  node scripts/internal-links-audit.mjs         # breakages: 0
  node scripts/link-graph-validator.mjs --strict
  pnpm build
  node scripts/seo-ci-check.mjs                 # still 0 broken of ~48,690
  node scripts/internal-linking-architecture.mjs --source dist/client

DELIVERABLE: report/YYYY-MM-DD-source-link-repair.md with the bucket breakdown
and counts per bucket.
```

---

# P2 — MEDIUM

## BAI-P2-01 — Fix 43 out-of-range titles and descriptions

```
TASK: Metadata averages are excellent; a small set of outliers is out of range.

MEASURED EVIDENCE — analysis of all 275 HTML files in dist/client:

  Average title length:        50 chars   (excellent)
  Titles under 30 chars:       13 pages   (under-optimized)
  Titles over 65 chars:        11 pages   (truncated in SERPs)
  Average description length: 136 chars   (excellent)
  Descriptions under 80:        6 pages
  Descriptions over 170:       13 pages   (truncated in SERPs)

  Total outliers: 43 of 275 pages (15.6%). This is not systemic — the templates
  are right. These are page-level exceptions.

WHAT TO DO:
  1. Write a throwaway script (or extend an existing one) to emit the exact list
     of offending file paths with their current title/description and lengths.
     Do not guess which pages they are.
  2. Rewrite each outlier:
       titles:       30-60 chars, primary keyword front-loaded, brand suffix only
                     if it fits
       descriptions: 120-155 chars, includes a concrete value proposition
  3. Prefer fixing the page's frontmatter over patching the layout. If several
     outliers share a generator, fix the generator.

CONSTRAINTS:
  - Arabic characters count as single characters, but Arabic renders wider in
    SERPs. Target the lower end of each range for Arabic pages.
  - Do NOT touch the <h1>. Every page has exactly one and that must remain true.
  - Homepage Lighthouse SEO is 100 — it must stay 100.
  - Do NOT change slugs or canonicals.

VERIFICATION:
  pnpm build
  node scripts/seo-health-check.mjs     # title/description presence stays 275/275
  node scripts/seo-ci-check.mjs         # 0 errors
  # Re-run your length script: expect 0 titles <30 or >65, 0 descriptions <80 or >170
```

---

## BAI-P2-02 — Add `<h2>` structure to the 10 flat pages

```
TASK: 10 pages contain zero <h2> elements.

MEASURED EVIDENCE — analysis of 275 HTML files:

  Total <h2> across site:  2,728
  Average per page:          9.9   (strong)
  Pages with zero <h2>:       10   <-- target
  Total <ul>/<ol>:         3,251
  Total <table>:             153

WHY IT MATTERS: AI answer engines cite at the passage level. A page with no
subheadings offers no extractable passages, so it is structurally excluded from
AI Overviews and Perplexity citation regardless of content quality. The site
already gets this right on 265 pages — these 10 are the exception.

WHAT TO DO:
  1. Identify the 10 pages programmatically (scan dist/client for files with zero
     /<h2[\s>]/ matches). Do not guess.
  2. For each, determine whether it legitimately needs no subheadings (a very
     short legal page or a form-only page may not) or whether it is an unstructured
     content wall.
  3. For the content walls, add descriptive <h2> headings that mark real semantic
     sections. Headings must describe actual content, not be inserted decoratively.

CONSTRAINTS:
  - Exactly one <h1> per page must be preserved (currently 275/275).
  - Never skip heading levels (h1 -> h2 -> h3).
  - Do NOT rewrite the body copy in this task; only add structure. Content
    expansion is BAI-P1-03.

VERIFICATION:
  pnpm build
  node scripts/seo-health-check.mjs     # single H1 per page maintained
  # Re-scan: expect pages with zero <h2> to be only the intentional exceptions
```

---

## BAI-P2-03 — Add HowTo + Dataset schema, shrink City bloat

```
TASK: Two high-value schema types are entirely absent, and one type is
massively over-emitted.

MEASURED EVIDENCE — 274 JSON-LD blocks across 268 of 275 pages:

  City                      2835   <-- OVER-EMITTED, see below
  ListItem                   772
  PostalAddress              724
  ImageObject                533
  ContactPoint               490
  Country                    487
  WebPage                    485
  Organization               449
  Person                     441
  Question / Answer      361 / 361
  SpeakableSpecification     262
  GeoCoordinates             247
  WebSite                    246
  Brand                      245
  BreadcrumbList             241
  OpeningHoursSpecification  234
  DefinedTerm                105
  Article                    100
  BlogPosting                 96
  FAQPage                     88
  TechArticle                 48
  Offer                       25
  CollectionPage              20
  Service                     17
  DefinedTermSet              12
  LegalDocument               11
  HowTo                        0   <-- MISSING
  Dataset                      0   <-- MISSING

THREE SEPARATE WORK ITEMS:

  A) ADD HowTo (currently 0)
     The content library is inherently procedural: "how to comply with PDPL",
     "steps to implement NCA ECC". HowTo unlocks a rich result and is a strong
     AI-citation format. Identify genuinely step-based content and add valid
     HowTo schema with real, ordered, numbered steps.
     ONLY where the visible page content actually presents steps. Schema that
     does not match visible content is a structured-data violation.

  B) ADD Dataset (currently 0)
     The build contains 153 HTML tables. Regulatory control matrices and
     compliance comparison tables are legitimate datasets. Wrapping the
     substantive numeric/structured tables in Dataset schema makes them
     citable as data sources in AI Overviews.
     Apply only to genuine data tables — not to layout tables.

  C) REDUCE City (currently 2835) — THIS IS A WARNING, NOT A WIN
     2,835 City entities against only 26 solutions/ pages means a large city
     array is being injected into nearly every page. This inflates payload,
     contributes to the JSON-LD weight inside the 21.8 KB of inline scripts on
     the homepage, and can read as a local-spam signal to Google.
     Reduce City emission to the cities each page is genuinely about. A Riyadh
     solutions page should carry Riyadh — not all Saudi cities.
     Same scrutiny applies to the 234 OpeningHoursSpecification and 724
     PostalAddress entities: verify each page genuinely needs them.

CONSTRAINTS:
  - Speakable schema is currently valid on 262 pages. That count must not drop.
  - The 88 FAQPage / 361 Q&A pairs must keep validating.
  - Every schema change must validate. Structured data that does not reflect
    visible page content violates Google's guidelines and risks a manual action.
  - Do NOT remove Organization, WebSite, Person, or BreadcrumbList schema.

VERIFICATION:
  pnpm build
  node scripts/seo-schema-audit.mjs             # must pass
  node scripts/check-speakable-schema.mjs       # >= 262 pages
  node scripts/seo-health-check.mjs             # 0 issues
  node scripts/check-performance-budget.js      # HTML size must not regress
  # Validate a sample of each new type against Google's Rich Results Test.

DELIVERABLE: report/YYYY-MM-DD-schema-expansion.md with the before/after type
distribution table, including the City reduction figure.
```

---

## BAI-P2-04 — Review the 736 empty `alt` attributes

```
TASK: 92.6% of images carry alt="". Some are correctly decorative; most likely
are not.

MEASURED EVIDENCE — 795 images across 275 HTML files:

  Total images:                    795
  Missing alt attribute entirely:    0   <-- EXCELLENT, must stay 0
  alt="" (declared decorative):    736   <-- 92.6%, needs review
  Missing width or height:           0   <-- EXCELLENT, must stay 0
  loading="lazy":                  297
  <picture> elements:               490
  AVIF sources:                     245   <-- modern formats already in place

CONTEXT: alt="" is technically CORRECT for decorative images — screen readers
skip them, which is why Lighthouse a11y sits at 96-97. So this is not an
accessibility failure. It is a missed-opportunity audit: 736 of 795 images being
purely decorative is implausible. Product screenshots, diagrams, and customer
logos need descriptive alt text for Google Images and for content comprehension.

WHAT TO DO:
  1. Enumerate the images using alt="" grouped by the component or page that
     renders them. Group by source, not one-by-one.
  2. Classify each group:
       DECORATIVE  -> keep alt="" (correct; document why)
       INFORMATIVE -> write descriptive alt text
     Informative categories to expect: product/UI screenshots, architecture and
     compliance diagrams, customer logos (4 customers/ pages exist), author
     portraits, chart and data visuals.
  3. Write alt text in the page's own language — Arabic alt text on Arabic pages.
     Describe function and content, not appearance. Do not keyword-stuff. Do not
     prefix with "image of".

CONSTRAINTS:
  - Images missing an alt attribute entirely must remain exactly 0.
  - Images missing width/height must remain exactly 0 (this is a primary reason
    CLS is not image-driven — do not break it).
  - Do NOT add alt text to genuinely decorative images. That makes screen-reader
    UX worse, not better.
  - Lighthouse a11y must stay >= 96.
  - Do NOT change the 490 <picture> / 245 AVIF setup. It is correct.

VERIFICATION:
  pnpm build
  # Re-scan and confirm: 0 images without an alt attribute, 0 without dimensions
  node scripts/seo-health-check.mjs
  # Re-run the a11y check and confirm no regression from the 96-97 baseline
```

---

## BAI-P2-05 — Resolve the dead `public/_headers` config drift

```
TASK: public/_headers is not read by the production platform. It documents this
itself, which makes it a config-drift trap.

MEASURED EVIDENCE — from the file's own header comment:

  # ─── BAI-IDX-02 WARNING (2026-07-25) — DOCUMENTATION ONLY. ───
  # This file is the Netlify / Cloudflare Pages / Render Static style
  # convention. It is NOT read by the current Render Node Web Service
  # (Astro 6.4.6 + @astrojs/node), nor by Cloudflare in front of it.
  # The actual production security header posture is enforced by:
  #   1. src/middleware.ts — HTTP response headers on /api/* SSR
  #   2. injectSecurityMeta() in astro.config.mjs — <meta http-equiv>
  #   3. Cloudflare edge Transform Rule — HSTS on static pages

  So there are FOUR sources of truth for headers, one of which is dead:
    public/_headers          (dead)
    src/middleware.ts        (104 lines, /api/* only)
    astro.config.mjs         injectSecurityMeta()
    Cloudflare Transform Rule

  THE PRODUCTION POSTURE IS ACTUALLY EXCELLENT — verified live on 2026-08-08:
    strict-transport-security: max-age=63072000; includeSubDomains; preload
    content-security-policy:   default-src 'self'; base-uri 'self';
                               object-src 'none'; frame-ancestors 'self';
                               form-action 'self'; ... (explicit allowlists for
                               GTM, GA, Clarity, HubSpot, Bing, Mixpanel,
                               Cloudflare Insights)
    x-content-type-options:    nosniff
    x-frame-options:           SAMEORIGIN
    referrer-policy:           strict-origin-when-cross-origin
    permissions-policy:        camera=(), microphone=(), geolocation=()
    x-robots-tag:              index, follow, max-image-preview:large

  So the risk is NOT security. The risk is that a new engineer edits _headers,
  ships it, and believes production changed. It did not.

WHAT TO DO — pick one and execute it fully:
  Option A (recommended): Keep the file strictly as a migration reference. Make
    the dead-file warning the very first lines, impossible to miss, and add a
    drift-detection check that fails CI if _headers and
    scripts/security-headers.mjs diverge.
  Option B: Delete public/_headers entirely and move its content into
    docs/ as a migration-reference document.

  Either way: write a single authoritative document that states, per header,
  exactly which of the remaining three mechanisms enforces it in production.

CONSTRAINTS:
  - Do NOT weaken any header listed above. CSP allowlists in particular are
    tuned; removing an entry breaks analytics.
  - Note that meta http-equiv CSP would break iframe previews — the current
    split (real headers at the edge, meta as fallback) is deliberate. Do not
    "simplify" it without understanding why it exists.
  - Confirm production headers are byte-identical before and after.

VERIFICATION:
  curl -sSI -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0" \
    https://brightai.site/ | grep -iE \
    "strict-transport|content-security|x-content-type|x-frame|referrer-policy|permissions-policy|x-robots-tag"
  # Output must be identical to the baseline above.
  node scripts/security-headers.mjs      # if it exposes a check mode
  pnpm build
```

---

## BAI-P2-06 — Remove ALL 16 `noindex` directives (ZERO noindex pages)

```
TASK: 16 pages carry noindex. REMOVE every single one. The final state of the
site must have ZERO noindex pages. Every page must be indexable.

MEASURED EVIDENCE:
  - 16 of 275 HTML files contain a noindex robots directive.
  - scripts/seo-health-check.mjs confirms: "noindex pages contain no hreflang"
    PASSES. That is the correct configuration (noindex + hreflang is
    contradictory) and must remain passing.
  - Cross-reference with the 29 pages outside the sitemap (BAI-P1-02): expected
    noindex candidates include 404, 500, offline/, kernel/offline/, kernel/api/,
    kernel/admin/quota/, thank-you/, and the 5 design/* system pages.

WHAT TO DO:
  1. Enumerate the 16 pages programmatically. Do not assume the list.
  2. For EACH of the 16 pages, REMOVE the noindex directive (meta robots and/or
     X-Robots-Tag) so the page becomes indexable.
  3. For every page that had noindex removed, ensure it is:
       - present in sitemap.xml
       - free of any noindex robots directive
       - reachable via at least one contextual internal link
  4. Cross-check against BAI-P1-02 so the two tasks agree on every page.
  5. The final state must have ZERO noindex pages in dist/client.

CONSTRAINTS:
  - NO page may keep a noindex directive. This includes 404, 500, offline pages,
    admin routes, API routes, thank-you pages, and internal design-system pages.
    ALL of them must be indexable.
  - Every page that had noindex removed must also get a sitemap entry AND at
    least one contextual inbound link — otherwise it becomes a new orphan and
    fails BAI-IDX-04.
  - noindex and hreflang must never coexist — since noindex is being eliminated
    entirely, this constraint is automatically satisfied.

VERIFICATION:
  pnpm build
  node scripts/seo-health-check.mjs      # 0 issues; ZERO noindex pages
  node scripts/seo-ci-check.mjs          # 0 errors, 0 warnings
  node scripts/internal-linking-architecture.mjs --source dist/client
                                         # orphan_pages must not increase
  # Confirm zero noindex anywhere:
  grep -rl "noindex" dist/client/ | wc -l   # must be 0

DELIVERABLE: a 16-row table (path | reason | action taken — all actions must be
"REMOVED noindex") inside report/YYYY-MM-DD-noindex-audit.md.
```

---

## Appendix A — Full verification gate

```bash
cd /vercel/share/v0-project

pnpm build

node scripts/seo-health-check.mjs
node scripts/seo-ci-check.mjs
node scripts/hreflang-bidirectional-audit.mjs
node scripts/check-speakable-schema.mjs
node scripts/seo-schema-audit.mjs
node scripts/check-word-count.mjs
node scripts/check-performance-budget.js
node scripts/internal-links-audit.mjs
node scripts/link-graph-validator.mjs --strict
node scripts/internal-linking-architecture.mjs --source dist/client
```

## Appendix B — Production crawler smoke test

Run this after **every** deploy. Local `dist/` checks were entirely green while
production was returning 403 to Googlebot — this test is the gap-closer.

```bash
for ua in "Googlebot/2.1" "bingbot/2.0" "GPTBot/1.1" "OAI-SearchBot/1.0" \
          "PerplexityBot/1.0" "ClaudeBot/1.0"; do
  for path in "/" "/sitemap.xml" "/robots.txt" "/blog/" "/pricing/" "/en/"; do
    printf "%-22s %-14s " "$ua" "$path"
    curl -sS -o /dev/null -w "%{http_code}\n" \
      -A "Mozilla/5.0 (compatible; $ua)" "https://brightai.site$path"
  done
done
```

Every line must read `200`. A single `403` means BAI-P0-01 has regressed and the
site is invisible to search again.

## Appendix C — Baseline snapshot (2026-08-08)

Reference numbers for measuring any future change.

| Metric | Value |
|---|---|
| HTML files in `dist/client` | 275 |
| Sitemap URLs | 251 |
| Indexable pages | 257 |
| Internal links discovered | 16,834 |
| Broken links in build | 0 |
| References scanned by CI | 48,690 |
| Orphan pages | 22 |
| Pages outside sitemap | 29 |
| `noindex` pages | 16 |
| Max click depth from `/` | 3 |
| hreflang sets audited | 259 (0 errors) |
| Pages with JSON-LD | 268 (274 blocks) |
| Speakable pages | 262 |
| `FAQPage` schemas | 88 (361 Q&A pairs) |
| `BreadcrumbList` schemas | 241 |
| Average title length | 50 chars |
| Average description length | 136 chars |
| Average `<h2>` per page | 9.9 (2,728 total) |
| Average words per page | 1,454 |
| Pages under 400 words | 33 |
| Total images | 795 (0 missing alt, 0 missing dimensions) |
| `<picture>` elements / AVIF sources | 490 / 245 |
| Total gzipped JS | 329.99 KB (budget 60 KB) |
| Largest CSS (gzipped) | 19.88 KB (budget 50 KB) |
| `index.html` gzipped | 36.74 KB (budget 80 KB) |
| Lighthouse homepage | Perf 29 / a11y 97 / SEO 100 / BP 73 |
| Homepage LCP / CLS / TBT | 4.1s / 0.168 / 740ms |
| Redirect rules | 218 |
| GEO files | `llms.txt` 153 lines, `llms-full.txt` 372, `ai.txt` 195 |

---

*End of prompts file — 2026-08-08. Companion Arabic report: `2026-08-08-brightai-audit-report-ar.md`*
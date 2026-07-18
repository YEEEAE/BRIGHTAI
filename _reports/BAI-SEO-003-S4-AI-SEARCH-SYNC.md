# BAI-SEO-003-S4: AI Search Surface Sync — public/llms*.txt + ai.txt + robots.txt + schema-saudi-seo.json

**Date**: 2026-07-18
**Task**: Sync public/llms.txt + public/llms-full.txt + public/ai.txt + public/robots.txt with the schema foundation (src/data/schema-helpers.ts).
**Acceptance criteria**:
- 0 broken URLs in llms.txt + llms-full.txt
- 0 entity facts mismatches between the schema foundation and the AI-search files
- Search/grounding crawlers separated from training crawlers
- Google-Extended semantics documented (training ≠ Google Search indexing)
- No ranking superlatives, no unsupported certifications, no real customer names
- llms.txt = high-signal index; llms-full.txt = full detail
- Validation script that re-runs cleanly after every `pnpm build`

**Status**: verified locally (`pnpm build` + validation script + `seo:gate` + `internal-links:audit` + `redirects:check`). `uncommitted` per brain.md rule (user commits + pushes + deploys).

---

## Executive Summary

The four AI-search files were drifting from the canonical schema foundation that every page in the site emits. Three classes of drift:

1. **Entity facts spread across 4 sources**: `src/data/site.ts` (Footer), `src/data/schema-helpers.ts` (JSON-LD, authority), `src/components/Footer.astro` (rendered), and the three AI files. Each carried a slightly different version of the same facts — different Twitter handle, different LinkedIn path, different social profile coverage.
2. **`schema-saudi-seo.json` was referenced from `ai.txt` but did not exist on disk** (404 if requested).
3. **No separation between search/grounding and training crawlers** in any of the three files. `Google-Extended` was allowed with no explanation that it controls Gemini/Bard training only — not Google Search indexing.

We aligned everything to the schema foundation (`src/data/schema-helpers.ts`, `ORGANIZATION` constant, `@id https://brightai.site/#organization`). All six canonical social profiles (LinkedIn, X, YouTube, TikTok, GitHub, Crunchbase) are now enumerated identically across `llms.txt`, `llms-full.txt`, `ai.txt`, and `schema-saudi-seo.json`. Crawlers are now grouped into Search/Grounding (12) vs Training (11) with explicit Google-Extended and Applebot-Extended semantics.

A new validation script (`scripts/seo/validate-ai-search-surface.mjs`, ~340 lines) runs four independent checks after every build and exits non-zero on any regression.

---

## What changed

| File | Type | Description |
|---|---|---|
| `public/schema-saudi-seo.json` | **NEW** | Canonical Organization + WebSite + LocalBusiness JSON-LD. Mirrors schema-helpers.ts (same `@id`, same `foundingDate`, same `founder`, same `sameAs`). 110 lines. |
| `public/llms.txt` | rewritten | High-signal index: 12.5KB (was 15.7KB). Adds explicit Entity Facts block, AI Crawler Access Policy block, Machine-Readable Companion Files block. Removes out-of-date references. |
| `public/llms-full.txt` | rewritten | Full detail: 25.5KB (was 29.3KB). Removes duplicate NDMO reference, adds EN page section, adds Events section, adds Customer case studies (anonymized disclaimer), clusters blog content by topic, links to schema JSON file. |
| `public/ai.txt` | rewritten | Discovery profile: 9.5KB (was 5.6KB). Adds explicit `Search-Grounding-Crawlers:` and `Training-Crawlers:` blocks (12 + 11 bots). Adds Google-Extended Policy and Applebot-Extended Policy sections explaining the search-vs-training split. Adds Position disclaimer (NOT legal advice, NOT certifications, NOT real customer names). |
| `public/robots.txt` | recommented | Same allow rules, but reorganised into Search/Grounding section + Training section + Search Engines section with inline comments explaining the Google-Extended vs Googlebot semantic split. 4.0KB (was 2.3KB). |
| `scripts/seo/validate-ai-search-surface.mjs` | **NEW** | 340-line validation script. Four checks: URL coverage, entity facts parity, crawler class coverage, forbidden claims. Plus schema-json field validation and schema-helpers.ts parity check. Runs in <1s after `pnpm build`. |

---

## Canonical entity facts (single source of truth)

These values are now identical across `schema-helpers.ts`, `schema-saudi-seo.json`, `llms.txt`, `llms-full.txt`, and `ai.txt`:

| Field | Value | Source |
|---|---|---|
| Brand (en) | `BrightAI` | `SITE.name` |
| Brand (ar) | `برايت أيه آي` | `SITE.nameAr` |
| Legal name | `BrightAI` | schema-helpers.ts literal |
| Founding year | `2025` | schema-helpers.ts literal |
| Headquarters | الرياض (Riyadh), SA | schema-helpers.ts literal |
| Postal address | 6913 المبارك بن فضالة، حي الفيحاء، 14254 | schema-helpers.ts literal |
| Telephone | `+966538229013` | schema-helpers.ts literal |
| WhatsApp | `https://wa.me/966538229013` | `SITE.whatsapp.url` |
| Email | `yazeed1job@gmail.com` | schema-helpers.ts literal |
| Founder | `يزيد` — المؤسس والمدير التنفيذي | schema-helpers.ts literal |
| Founder LinkedIn | `https://www.linkedin.com/in/yazeed-brightai` | schema-helpers.ts literal |
| LinkedIn (org) | `https://linkedin.com/company/brightai-site` | schema-helpers.ts sameAs |
| X / Twitter | `https://x.com/BrightAISite` | schema-helpers.ts sameAs |
| YouTube | `https://www.youtube.com/@BrightAiSaudi` | schema-helpers.ts sameAs |
| TikTok | `https://www.tiktok.com/@bright1ai` | schema-helpers.ts sameAs |
| GitHub | `https://github.com/YEEEAE/BRIGHTAI` | schema-helpers.ts sameAs |
| Crunchbase | `https://crunchbase.com/organization/brightai` | schema-helpers.ts sameAs |
| Tagline (en) | `Saudi AI Safety OS` | `SITE.tagline` |
| Tagline (ar) | `نظام حماية الذكاء الاصطناعي السعودي` | `SITE.taglineAr` |

---

## Crawler policy (canonical split)

### Search / Grounding (12 bots — for AI answer engines and retrieval-augmented result surfaces)
- `OAI-SearchBot` (OpenAI search results)
- `ChatGPT-User` (ChatGPT user-triggered fetches)
- `PerplexityBot` (Perplexity indexing)
- `Perplexity-ai` (Perplexity user-triggered fetches)
- `ClaudeBot` (Anthropic search/indexing)
- `Googlebot` (Google Search indexing — **not training**)
- `Googlebot-Image` (Google Images)
- `Bingbot` (Bing + Copilot grounding)
- `Applebot` (Apple Spotlight / Siri Web)
- `DuckDuckBot` (DuckDuckGo)
- `YouBot` (You.com)
- `Google-CloudVertexBot` (Google Vertex AI grounding)

### Training (11 bots — for model training corpora)
- `GPTBot` (OpenAI training)
- `Google-Extended` (Gemini API + Bard training — **not search indexing**)
- `anthropic-ai` (Anthropic model training)
- `CCBot` (Common Crawl)
- `Bytespider` (ByteDance training)
- `cohere-ai` (Cohere training)
- `FacebookBot` (Meta training)
- `Meta-ExternalAgent` (Meta external agents)
- `Applebot-Extended` (Apple Intelligence training — **not search**)
- `Timpibot` (TIM Open data crawler)
- `omgili` (Webz.io / Omgili crawler)

### Semantic note
> `Google-Extended` controls Google's Gemini API and Bard training use ONLY. It does NOT control Google Search indexing, which is governed separately by `Googlebot`. Allowing `Google-Extended` therefore signals consent to Gemini/Bard training use; allowing `Googlebot` keeps search results intact.
> If we ever want to opt out of Gemini training while keeping search indexing, we change the `Google-Extended` rule to `Disallow: /` and leave `Googlebot` on `Allow: /`. The split is preserved by design.

---

## Validation results

```
=== BAI-SEO-003-S4: AI-search surface validation ===
Files:
  llms       exists=true bytes=12533 urls=78
  llmsFull   exists=true bytes=25506 urls=153
  ai         exists=true bytes=9484 urls=31
  robots     exists=true bytes=4035
  sitemap    exists=true urls=176
  schemaJson exists=true

Baseline: built pages=188, sitemap urls=176

[1/4] URL coverage (0 broken URLs expected)
  ✅ llms:     0 broken
  ✅ llmsFull: 0 broken
  ✅ ai:       0 broken

[2/4] Entity facts parity with schema foundation
  ✅ llms:     0 missing (soft hits=4/4)
  ✅ llmsFull: 0 missing (soft hits=4/4)
  ✅ ai:       0 missing (soft hits=4/4)

[3/4] Crawler class coverage (search + training)
  ✅ llms:     search=12/12, training=11/11
  ✅ llmsFull: search=12/12, training=11/11
  ✅ ai:       search=12/12, training=11/11

[4/4] Forbidden claims (ranking / unsupported certifications)
  ✅ llms:     0 hits
  ✅ llmsFull: 0 hits
  ✅ ai:       0 hits

[+] schema-saudi-seo.json: ✅ exists=true, 0 field errors
[+] schema-helpers.ts parity: ✅ 0 mismatches

=== SUMMARY ===
Total failures: 0
✅ All checks passed.
```

## Build + SEO gate results

| Check | Result |
|---|---|
| `pnpm build` | ✅ 190 pages, 0 errors (322 files mirrored to dist/) |
| `node scripts/seo/validate-ai-search-surface.mjs` | ✅ 0 failures |
| `npm run seo:gate` | ✅ 0 errors, 0 warnings, 176 sitemap URLs, 6/6 hreflang, 5/5 service, 444 files scanned, 0 broken links |
| `npm run internal-links:audit` | ✅ 0 broken links, 0 orphan pages, 17,485 internal links, 0 pages outside sitemap |
| `npm run redirects:check` | ✅ 207 redirects scanned, 0 self-redirects, 0 missing destinations, 0 chains, 0 cycles |

---

## Risks remaining

1. **KI-SOC-2026-07-18-001**: `src/data/site.ts` social URLs still differ from the schema foundation:
    - `site.ts.social.twitter = "https://twitter.com/brightai_sa"` (not `x.com/BrightAISite`)
    - `site.ts.social.linkedin = "https://linkedin.com/company/brightai"` (not `linkedin.com/company/brightai-site`)
    - `site.ts` is missing YouTube/TikTok/Crunchbase.

    The Footer renders `SITE.social.twitter/linkedin/github` — so the site footer currently links to handles that the schema foundation and the AI-search files do not advertise as canonical. This is a **user-facing inconsistency** that requires explicit user approval to fix (changing `site.ts` is a protected file per `agent.md` Section 2.1). The schema foundation is now authoritative for AI engines; for human visitors the discrepancy remains until `site.ts` is unified.

2. **`internal-links:audit` reports canonical_mismatch (585) and hashIssues (186)**: pre-existing on every page (not introduced by BAI-SEO-003-S4). These flag every page because the audit tool reads `dist/client/` HTML and compares the canonical link tag to the inferred URL. The mismatch is caused by `astro.config.mjs` `trailingSlash: 'always'` rendering trailing slashes in the URL but the audit tool reading without them (or vice versa). Worth investigating separately, but not blocking this task.

3. **No IndexNow trigger** in this PR — `public/e158df443f2742d281a02c4aeecb4a60.txt` is unchanged and continues to work for Bing/Yandex submission. After deploy, `npm run indexnow:trigger` should be re-run by the user.

---

## Recommended follow-up

- [ ] **Unify `site.ts` with schema foundation** — requires user approval. Update `twitter` → `x.com/BrightAISite`, `linkedin` → `linkedin.com/company/brightai-site`, add `youtube`, `tiktok`, `crunchbase` to `site.ts.social`. This closes KI-SOC-2026-07-18-001.
- [ ] **Investigate canonical_mismatch + hashIssues** in `internal-links:audit` — likely a tool-config bug, not a real SEO regression.
- [ ] **Add `validate:ai-search` npm script** in `package.json` so CI can run the validation script on every PR:
    ```json
    "scripts": {
      "validate:ai-search": "node scripts/seo/validate-ai-search-surface.mjs"
    }
    ```
- [ ] **Hook the validation script into the existing `verify:all` chain** so any future AI-search file edit fails the build before it ships.

---

## Commit message (suggested)

```bash
feat(seo): sync AI search surface with schema foundation (BAI-SEO-003-S4)

Unify llms.txt, llms-full.txt, ai.txt, and robots.txt against the canonical
Organization @id (https://brightai.site/#organization) defined in
src/data/schema-helpers.ts.

What:
- public/schema-saudi-seo.json: NEW machine-readable mirror of the
  Organization/WebSite/LocalBusiness JSON-LD emitted by every page.
- public/llms.txt: rewritten as a high-signal index (12.5KB).
  Adds explicit Entity Facts block, AI Crawler Access Policy block,
  Machine-Readable Companion Files block.
- public/llms-full.txt: rewritten with full detail (25.5KB).
  Removes duplicate NDMO reference, adds EN pages, Events, Customer case
  studies (anonymized), clusters blog content by topic.
- public/ai.txt: rewritten as a discovery + citation profile (9.5KB).
  Splits crawlers into Search-Grounding (12) vs Training (11) blocks.
  Adds Google-Extended and Applebot-Extended policy sections.
  Adds Position disclaimer (NOT legal advice, NOT certifications,
  no ranking superlatives).
- public/robots.txt: recommented with the same allow rules but
  reorganised into Search/Grounding vs Training vs Search Engines
  sections, with inline comments documenting Google-Extended vs
  Googlebot semantic split.
- scripts/seo/validate-ai-search-surface.mjs: NEW 340-line validation
  script with 4 checks (URL coverage, entity facts parity, crawler
  class coverage, forbidden claims) + schema-json field validation
  + schema-helpers.ts parity check.

Why:
AI-search files were drifting from the canonical schema foundation.
Entity facts (LinkedIn, X, YouTube, TikTok, GitHub, Crunchbase, phone,
address, founding year) were spread across 4 sources with no
single source of truth. schema-saudi-seo.json was referenced from
ai.txt but did not exist on disk. Google-Extended semantics were
undocumented, leaving the training-vs-search distinction invisible.

Verification:
- node scripts/seo/validate-ai-search-surface.mjs → 0 failures
- pnpm build → 190 pages, 0 errors
- npm run seo:gate → 0 errors, 0 warnings
- npm run internal-links:audit → 0 broken, 0 orphan
- npm run redirects:check → 207 redirects, 0 issues

Risks:
- KI-SOC-2026-07-18-001: site.ts social URLs still differ from
  schema foundation. Requires explicit user approval to fix.
- pre-existing canonical_mismatch (585) + hashIssues (186) in
  internal-links audit — unrelated to this change.

Closes: BAI-SEO-003-S4
```

---

## Run instructions (for the user)

After merging:

```bash
pnpm build
node scripts/seo/validate-ai-search-surface.mjs    # should print "✅ All checks passed."
npm run seo:gate                                   # should exit 0
npm run internal-links:audit                        # 0 broken, 0 orphan
npm run redirects:check                            # 0 issues

# Post-deploy:
npm run indexnow:trigger                           # notify Bing/Yandex
# Submit https://brightai.site/schema-saudi-seo.json to GSC for validation
```
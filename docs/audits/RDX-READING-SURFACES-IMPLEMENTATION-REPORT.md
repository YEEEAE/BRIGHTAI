# RDX Reading Surfaces — Implementation Report

**Date:** 2026-09-01  
**Status:** CONDITIONAL GO — shared system and priority routes updated; full route-family scan remains blocked by the local preview lifecycle.

## Delivered

- Replaced the broad `main > *` media-background fallback with explicit, normal-flow shell owners: homepage sections, inner sections, the homepage CTA and the answer-first summary.
- Added central semantic reading-surface variants: `hero`, `section`, `prose`, `compact`, `proof`, and `cta`.
- Kept the approved video contract unchanged: a single, unfiltered, fixed 1600×1200 video with no page-wide scrim.
- Reduced the homepage hero from a mandatory `100vh` layout to a content-led `100dvh` cap, with a mobile natural-height override, safe inline sizing and wrapping for the H1, and 16px horizontal mobile padding.
- Updated `/solutions/` so its hero and short answer use named variants and the long choice guidance reads on one prose surface rather than stacked paragraph cards.
- Rewrote the homepage lead and the solutions short answer with an answer-first structure, shorter sentences, and no new compliance or customer claims.

## Ownership

| Concern | Owner |
| --- | --- |
| Named reading-surface system and reduced-transparency/print fallbacks | `src/styles/components.css` |
| Homepage mobile hero flow and answer-first lead | `src/components/SplitHero.astro` |
| Solutions hero, short answer, and long-form prose grouping | `src/pages/solutions/index.astro` |

## Verification

- `pnpm bg:contract` — PASS: background contract **95/95** and contrast verification PASS.
- Worst-frame text ratios: primary **13.45:1**, secondary/muted **5.75:1**, brand teal **5.08:1**, interactive teal **4.84:1**.
- `git diff --check` — PASS.
- `pnpm build` reached Astro build completion; the enclosing root command did not complete within the available runner lifecycle while regenerating sitemap artifacts. Existing duplicate-route warnings appeared before the affected route render and were not caused by this change.

## Remaining evidence required

- Run `layout-audit` over all templates and the mandated 8 viewports, then repeat with reduced-motion, print, and 200% zoom.
- Capture before/after Chrome screenshots at 360×800 and 1440×1000 for every route family.
- Verify QC and Dashboard after their own production servers are available; no workflow or business-rule changes were made here.

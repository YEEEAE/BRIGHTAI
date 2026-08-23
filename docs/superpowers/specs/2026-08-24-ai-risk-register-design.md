# AI Risk Register Template Design

## Goal

Add a standalone, indexable BrightAI page at /tools/ai-risk-register/ that gives Saudi enterprises a practical AI risk register template with a semantic desktop table, mobile card fallback, clear risk badges, and print-friendly output.

## Content boundary

The page will explain that its generic likelihood × impact matrix and labels are BrightAI's implementation template, not an official SDAIA score or regulatory decision. It will link to the existing AI Risk Classification solution and AI Governance Readiness Assessment, while keeping visible instructions in Saudi colloquial Arabic.

## Experience

- Direct-answer hero with a short use guide.
- Compact “before you start” strip explaining who owns the register and when to review it.
- Wide semantic table with all 15 requested fields and two realistic Saudi-enterprise example rows.
- On small screens, each row becomes a labeled card using data-label values; no horizontal overflow is required.
- Badges distinguish likelihood, impact, risk level, and status.
- A small legend explains the generic 1–5 matrix without presenting it as an official framework.
- Print CSS hides navigation/CTA chrome, preserves table headers, and prevents row splitting where supported.

## Technical approach

Use a new Astro page with ArabicLayout; no new dependencies and no client JavaScript. Data stays as a typed local array in the page so the initial HTML contains the content for search and printing. Scoped CSS uses existing design tokens and logical properties.

## Verification

Add a Node contract test for required headings, all 15 field labels, the two internal links, index/follow intent, semantic table attributes, and the BrightAI scoring disclaimer. Run the contract test, Astro build, git diff --check, and a local browser smoke check at 360px and 1440px if the browser harness is available.

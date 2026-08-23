# AI Firewall Commercial Page Design

## Goal

Make `/solutions/ai-firewall/` BrightAI's clearest enterprise product page for an AI security control layer, using Saudi colloquial B2B Arabic and only implementation-supported claims.

## Audience and conversion

Primary readers are CISOs, privacy/data leaders, compliance teams, and technology owners evaluating LLM security, AI data leakage prevention, or enterprise AI controls. The primary conversion is a scoped discovery/demo request through `/contact/`; secondary paths are the AI Firewall docs, Audit Trail, Human Approval Layer, and governance assessment.

## Content truth boundary

The page will describe the currently supported boundary: requests can pass through the chat/firewall path; supported detector patterns identify PII categories; detected content can be redacted/replaced; policy decisions can block or require a follow-up approval path where implemented; non-sensitive event metadata and decisions are recorded for evidence. The page will not claim perfect prevention, universal model/provider coverage, semantic detection of every secret, or regulatory compliance by product alone.

PDPL, NCA, and SDAIA will be framed as implementation context and alignment support. The page will explicitly tell buyers to validate their own legal, regulatory, data residency, vendor, and control requirements.

## Information architecture

1. Product hero with immediate answer to “وش هو AI Firewall؟”, strong CTA, and a console-style visual.
2. Compact trust strip naming the control surface: prompts, responses, sensitive data, policy decisions, destinations/models, evidence.
3. “وش يشوف ووش يسوي؟” capability grid separating inspect, block, flag, log, and route/approval behavior.
4. Input → inspection → decision → output/evidence flow diagram.
5. Example policy cards showing redact, block, flag/review, and route decisions without fabricating hidden runtime behavior.
6. Before/after risk scenario for a Saudi enterprise workflow.
7. AI Firewall vs traditional firewall and AI Firewall vs DLP comparison tables.
8. Integration/limitations and supporting-alignment note.
9. FAQ and high-intent final CTA.

## Visual direction

Industrial security console: charcoal/ink background, restrained teal for allowed/protected states, amber for review, red only for blocked states, mono labels for event metadata, and large Arabic headings. Use a custom scoped design for this slug, preserve RTL, keep all controls at least 44px, and collapse to a single-column flow at 360px. No new dependency or client-side behavior is required.

## SEO/AEO

- H1 targets “AI Firewall” and enterprise AI security without repeating “Saudi Arabia”.
- The first visible answer defines AI Firewall in direct language.
- Metadata targets AI security, LLM security, AI data leakage prevention, and enterprise AI security.
- Content uses question-led headings and visible FAQ answers for citation usefulness.
- Existing Service, BreadcrumbList, canonical, hreflang, and sitemap behavior remain intact.

## Verification

Run a focused content/markup contract check, `pnpm build`, `pnpm seo:check`, `pnpm seo:hreflang`, `pnpm internal-links:audit`, and `git diff --check`. Inspect built HTML for one H1, the direct answer, the two comparison headings, the CTA, and no `noindex`.

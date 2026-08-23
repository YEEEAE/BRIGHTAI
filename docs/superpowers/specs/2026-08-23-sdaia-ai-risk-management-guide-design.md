# SDAIA National AI Risk Management Guide — Design

**Date:** 2026-08-23  
**Route:** `/hub/sdaia-ai-risk-management/`  
**Status:** approved for implementation by the user

## Purpose

Create an Arabic-first, Saudi-focused, high-authority reference guide for SDAIA's National AI Risk Management Framework. The page serves the informational search intent for:

- SDAIA AI Risk Management Framework
- AI risk management Saudi Arabia
- Saudi AI risk framework
- إدارة مخاطر الذكاء الاصطناعي

It must keep a strict boundary between the official framework and BrightAI's operational support. It must not claim regulator approval, endorsement, certification, or guaranteed compliance.

## Official-source baseline

The page identifies the publication as:

- Arabic title: `الإطار الوطني لإدارة مخاطر الذكاء الاصطناعي`
- English title: `National AI Risk Management Framework`
- Publisher: Saudi Data and Artificial Intelligence Authority (SDAIA)
- Document code and edition: `SDAIA-P145`, Version 1.0
- Publication date: April 2026
- Launch announcement: 14 July 2026
- Authoritative language: Arabic

Primary citations displayed on the page:

1. SDAIA's publication listing and direct executive-summary PDF URL.
2. Saudi Press Agency's official launch announcement, which describes the intended government/private-sector audience, lifecycle, principles, risk matrix, and launch date.

If direct PDF retrieval is unavailable in automated verification because of SDAIA WAF controls, the source panel must preserve the official document URL and mark the source-check date. No detail may be attributed to the framework unless corroborated by the primary document or official government announcement.

## Information architecture

Use a dedicated `SdaiaAiRiskManagementGuide.astro` component rendered by the existing dynamic hub route. The component provides a single, static HTML document.

1. Hero and concise answer: name, edition/date, audience, direct answer, and source status.
2. Sticky desktop table of contents; mobile `details` table of contents.
3. Why this matters: government and private-sector audiences; explain why AI risk differs from traditional software risks only with official-source support.
4. What the framework says: its lifecycle displayed only as supported by the official announcement: define context and scope; identify and assess risk; treat risk; continuously monitor and review.
5. Likelihood-impact risk matrix: a neutral visual of the official 4×4 concept. It must not assign thresholds, colours, or risk labels as SDAIA requirements.
6. Practical enterprise workflow: inventory → classify → assess → assign owner → control → approve → monitor → evidence. This is explicitly labelled as BrightAI's operational interpretation, not an SDAIA quote or requirement list.
7. Decision table: common conditions, operational question, suggested evidence, and next action. It must distinguish source-aligned process from BrightAI operational support.
8. Implementation checklist: grouped across inventory, assessment, decisions, operations, and evidence.
9. BrightAI support section: six descriptive internal links, visibly separated from regulatory content.
10. Source and citation panel: official sources, exact source type, date, and an update note; all official links use `target="_blank" rel="noopener noreferrer"`.
11. Closing CTA to the readiness assessment.

## Visual direction

`Saudi regulatory editorial`: deep ink/navy structure, restrained emerald and sand accents, high-contrast Arabic typography, rule lines, numbered process markers, and native SVG/CSS visualisations. The page has no client JavaScript and introduces no dependency.

The content width is comfortable for long Arabic reading. The desktop layout is a sticky navigation rail plus article; mobile collapses into one column and moves navigation into a native disclosure. Tables retain semantic HTML and use an accessible horizontal wrapper at narrow widths. All spacing/direction styles use CSS logical properties.

## SEO and schema

- Exactly one Arabic H1, answer-first first paragraph, self-canonical URL, index/follow through existing layout defaults.
- `CollectionPage` JSON-LD for the guide; existing layout emits organization and breadcrumb schema.
- No new `FAQPage` or `HowTo` schema.
- Saudi Arabic title, description, and source-led claims; all required BrightAI product and assessment links are descriptive anchors.
- The public page is statically prerendered and becomes sitemap-eligible through Astro's existing setup.

## Acceptance criteria

- The route is generated at `/hub/sdaia-ai-risk-management/` and has one H1.
- It visibly contains the official name, SDAIA-P145, Version 1.0, April 2026, and an official source link.
- It contains the four official lifecycle stages, an accurately caveated 4×4 likelihood-impact visual, checklist, decision table, source panel, and sticky/compact TOC.
- It names the eight-step operational workflow as BrightAI implementation guidance, not regulation.
- It links to AI Risk Classification, Human Approval Layer, AI Audit Trail, AI Evidence File, AI Governance Platform, and AI Governance Readiness Assessment.
- It makes no claim that SDAIA endorses or certifies BrightAI and no claim of automatic/full compliance.
- It is responsive at 360px and 1440px with no horizontal page overflow and is keyboard navigable.
- A targeted test checks route/data/content contracts before implementation and passes after the component is added.

## Scope limits

- No external dependency, client-side data collection, analytics change, production deployment, commit, or push.
- No legal opinion and no conversion of the advisory framework into binding obligations.
- No invented framework control codes, risk scoring thresholds, or regulator expectations.

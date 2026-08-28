# Universal SEO website copy-and-paste prompt system

Use this library with [How to use the prompts](HOW-TO-USE.md). Replace every `<placeholder>` before pasting. Run one numbered phase at a time.

These prompts are intentionally business-agnostic and work with the strongest research and coding model available to you. Important context, authority, constraints, deliverables, and success criteria are explicit so the workflow can be repeated without depending on an earlier chat or an example project.

## Required SEO evidence source

Phases 2, 3A, 3B, and 3C require DataForSEO through its official MCP server. Public browsing and official sources supplement DataForSEO for regulations, local facts, and qualitative SERP inspection; they do not replace measured keyword, SERP, competitor, or backlink evidence. If DataForSEO is unavailable, the agent must stop at the Phase 2 connection gate rather than inventing metrics or silently switching providers.

Official server and installation instructions: [dataforseo/mcp-server-typescript](https://github.com/dataforseo/mcp-server-typescript).

## Fill this project variable sheet first

Complete this once and keep it at the top of `docs/00-project-brief.md`. Reuse the exact values in later prompts. Write `unknown—must be researched or approved` instead of inventing an answer.

```text
PROJECT
<PROJECT_NAME> =
<DOMAIN> =
<BUSINESS_NAME> =
<BUSINESS_MODEL> = operator / local provider / referral or lead generation / marketplace / ecommerce / SaaS / professional service / other
<NICHE> =
<PRIMARY_OFFER> =
<SECONDARY_OFFERS> =
<LAUNCH_MARKET> = country, state/region, metro/city, or online market
<LANGUAGE> =

CUSTOMER AND CONVERSION
<PRIMARY_AUDIENCE> =
<PRIMARY_PROBLEM> =
<PRIMARY_CONVERSION> = call / form / booking / purchase / trial / email / other
<LEAD_DESTINATION> = inbox / CRM / spreadsheet / booking system / unknown
<PRIMARY_CTA> =

TRUTH AND PROOF
<ENTITY_THAT_DELIVERS_THE_SERVICE> =
<SERVICE_AREA_OR_AVAILABILITY> =
<PROOF_ASSETS> = reviews, licences, credentials, case studies, photos, data, or none
<PROHIBITED_OR_UNVERIFIED_CLAIMS> =
<LEGAL_OR_COMPLIANCE_CONSTRAINTS> =

SCOPE
<LAUNCH_PAGE_LIMIT> =
<RESEARCH_BUDGET_OR_TASK_LIMIT> =
<DATAFORSEO_STATUS> = connected / account exists but MCP not connected / account needed
<CONTENT_TYPES> = services / locations / products / industries / comparisons / guides / other
<CMS_NEED> = none / blog only / light page editing / full visual editing
<ANALYTICS_NEED> =

DESIGN AND BUILD
<VISUAL_TRAITS> = three to five adjectives
<REFERENCE_URLS> =
<VISUAL_AVOID_LIST> =
<IMAGE_STYLE> = photography / illustration / 3D / mixed / existing assets
<MOTION_LEVEL> = none / restrained / signature scroll story
<STACK> = Astro, strict TypeScript, Cloudflare, or another approved stack
<LAUNCH_DEADLINE> =
```

## How the phases fit together

| Phase | Decision produced | Do not continue until |
| --- | --- | --- |
| 0–2 | Operating rules, business truth, safe tool access | The business model and claim boundary are approved |
| 3 | Search demand, SERP evidence, competitors, and opportunity clusters | Research evidence and limitations are accepted |
| 4 | Launch sitemap, route purpose, and page briefs | Every launch route is explicitly approved |
| 5 | Visual direction, homepage experience, image family, and motion concept | One coherent direction is selected |
| 6 | Reusable build system, templates, content, and optional CMS | The static site works without animation |
| 7 | Optional signature motion or scroll experience | The experience works with reduced motion and on mobile |
| 8–10 | Technical SEO, QA, accessibility, performance, and lead handling | Critical checks and real conversion behavior pass |
| 11–12 | Deployment, live acceptance, measurement, and iteration | The public site matches the approved build |

## Prompt 0: establish the operating contract

### Use when

Paste this once at the start of a new Codex task, including when continuing an existing project.

### Paste this prompt

```text
You are the lead research, content, design, and implementation partner for an SEO-first business website. Work from the actual workspace and connected tools. The workspace files are the source of truth; chat summaries are secondary.

OPERATING POLICY

1. Inspect before acting. Read the relevant existing files, code, configuration, and project state before proposing or making changes.
2. Separate verified facts, source-backed measurements, inferences, recommendations, and unknowns. Never turn an inference or placeholder into a business claim.
3. For review, diagnosis, research, or planning, use read-only actions and report the result. Do not implement unless the current request asks for implementation.
4. For an approved build or fix, make in-scope local changes and run relevant non-destructive validation without asking for routine permission.
5. Ask before an external write, paid call beyond an approved limit, deployment, DNS change, destructive action, credential change, publication, or material expansion of scope.
6. Make reasonable reversible decisions when they follow approved artifacts. Record material assumptions. Ask only when an ambiguity would change the business, claims, architecture, conversion path, budget, or public result.
7. Never expose secrets. Never paste, print, commit, or repeat credentials. Use configured environment variables, apps, CLIs, or MCP connections.
8. Preserve unrelated user changes. Do not delete or overwrite work merely to simplify the task.
9. Use primary and official sources for laws, incentives, licences, standards, platform behavior, and other changing facts. Record source URLs and verification dates.
10. Do not declare a phase complete until its definition of done is met and the requested validation has run. A successful build alone is not proof of visual, business, SEO, accessibility, form, or production correctness.
11. Use DataForSEO through the official MCP server for measured SEO research. If it is not authenticated and available, stop before the SEO research phases. Never substitute guessed search volume, CPC, competition, rankings, or backlink data.

DURABLE PROJECT CONTROL

Inspect the workspace, then create or update these files without erasing prior decisions:
- docs/project-state.md: current phase, completed artifacts, current blockers, validation status, and next action;
- docs/decision-log.md: dated material decisions, alternatives, evidence, owner, and status;
- docs/approval-log.md: dated approvals, approvals with changes, rejections, and deferred decisions.

For every phase, lead with the outcome and finish with this exact report structure:
- Outcome
- Evidence and source files
- Files changed
- Validation and exact results
- Assumptions, risks, and unresolved items
- Approval required
- Recommended next prompt

Do not start a new project phase yet. Reconstruct the current state, identify conflicts or missing control files, and show me the operating contract summary for approval.
```

### Approve with

```text
APPROVE OPERATING CONTRACT
```

---

## Prompt 1: define the business truth and claims boundary

### Prepare

Have the real business name, business model, offer, location, audience, conversion goal, and any evidence files available. Unknown is an acceptable answer.

### Paste this prompt

```text
PHASE 1 — BUSINESS TRUTH AND CLAIMS

Business name: <name>
Domain: <domain or undecided>
Business model: <operator / installer / referral marketplace / agency / ecommerce / other>
Primary offer: <offer>
Launch market: <country, region, city>
Target customer: <audience>
Primary conversion: <call / booking / quote / purchase / intake>
Known proof and source locations: <licences, reviews, projects, credentials, files, URLs>
Known unknowns: <list>
Preferred stack: <STACK>
Visual direction: <short description>

Read the workspace and existing notes. Do not research keywords, write sales copy, or change site code in this phase.

Create or update:
1. docs/00-project-brief.md with the business, audience, offer, conversion path, service area, operational reality, visual goals, technical requirements, success measures, and unresolved decisions.
2. docs/claims-matrix.md with one row per material claim: exact wording, owning entity, evidence required, available evidence, source, last verified date, permitted pages, schema consequence, and status of verified/pending/prohibited/expired.

Cover identity, location, service area, licences, insurance, reviews, years, certifications, partnerships, availability, pricing, warranties, incentives, results, and lead-sharing behavior. Identify where a visitor could mistake this business for another entity type.

QUALITY GATE
- Every public claim is either supported or visibly restricted.
- Business model and conversion path cannot be misunderstood.
- Unknowns remain unknown.
- Decisions needing the owner are grouped into a short approval checklist.

Stop after presenting the brief, claims risks, and approval checklist. Do not proceed to research.
```

### Approval decision

Approve the business identity, offer, audience, conversion, and claim restrictions—not the wording alone.

---

## Prompt 2: verify tool connections without spending or publishing

### Prepare

Install and configure the official DataForSEO MCP server from https://github.com/dataforseo/mcp-server-typescript before this phase. Its required environment variables are `DATAFORSEO_USERNAME` and `DATAFORSEO_PASSWORD`. Keep their values outside the project and prompt. Configure optional design and hosting tools separately.

### Paste this prompt

```text
PHASE 2 — READ-ONLY CONNECTION CHECK

Read the approved brief and claims matrix. Inspect the tools currently available in this environment.

Verify only these connections:
- DataForSEO, required: verify that the active server comes from the official `dataforseo/mcp-server-typescript` project or its published `dataforseo-mcp-server` package; authenticate and use a documented free status or endpoint-list call; do not create a paid task.
- 21st.dev: confirm identity or perform one search-only request; do not install packages or generate code.
- Cloudflare: confirm authentication and list the accessible account/project context; do not create, update, deploy, delete, or change DNS.

For each connection, report:
- connected, unavailable, or misconfigured;
- the safe verification action used;
- account or project identity without secrets;
- available capability relevant to this project;
- any permission or entitlement limitation;
- exact next setup action if blocked.

Never display credentials, tokens, authorization headers, or secret environment values. Stop after the connection matrix and update docs/project-state.md.

DataForSEO is a hard gate. If it is unavailable or misconfigured, mark Phase 2 blocked, point to the official repository installation instructions, and do not begin Phase 3 or replace its measurements with estimates.
```

### Quality gate

The user can see which tools truly work before any billable or external action occurs.

---

## Prompt 3A: design the bounded SEO research plan

### Prepare

Choose a maximum spend or task count. This prompt does not authorize paid calls.

### Paste this prompt

```text
PHASE 3A — SEO RESEARCH PLAN

Research niche: <niche>
Exact launch market: <location>
Language: <language>
Maximum budget: <currency amount or task-count limit>

Read the approved project brief and claims matrix. Use the connected official DataForSEO MCP server plus official public sources. Plan the smallest DataForSEO research set that can determine search demand, SERP fit, competitor patterns, and a launch page architecture.

The plan must specify:
- seed topics and why each matters;
- exact country, region, city, and language settings;
- national directional keyword data versus exact local data;
- live organic SERPs and Maps/Local Finder where relevant;
- recurring competitors and ranked pages;
- competitor content/backlink direction only where it changes a decision;
- official sources for changing local facts;
- proposed endpoint/call, expected cost class, quantity, and decision supported;
- raw evidence paths under research/data/<YYYY-MM-DD>/;
- final decision memo path.

Avoid vanity data and bulk collection. State what the plan will not answer. Do not make a paid call. Present a budget table and an explicit authorization sentence for me to approve.
```

### Approve with

```text
APPROVE PHASE 3A. Execute only the listed calls within <limit>. Stop before any additional paid call.
```

---

## Prompt 3B: execute and synthesize the approved research

### Paste this prompt

```text
PHASE 3B — BOUNDED SEO RESEARCH EXECUTION

Execute only the research plan approved in docs/approval-log.md. If no exact budget and call set are recorded there, stop and request approval.

Rules:
- execute measured SEO calls through the connected official DataForSEO MCP server;
- enforce the approved maximum spend or task count;
- use the exact market and language;
- save bounded raw CSV/JSON evidence with query parameters and date;
- use live SERPs or official sources instead of model memory where available;
- do not combine synonym volumes as if they were independent people;
- explain missing values, close-variant grouping, CPC limitations, and why national difficulty is not a local traffic forecast;
- distinguish measured fact, sourced fact, inference, and recommendation.

Create docs/research/market-and-seo-research.md containing:
1. executive decision summary;
2. methods, location codes, dates, and limitations;
3. demand and intent clusters;
4. actual SERP patterns and recurring competitors;
5. local/map findings where relevant;
6. official market facts;
7. content and conversion implications;
8. recommended launch, deferred, and rejected page concepts with evidence;
9. evidence index linking to raw files and sources.

Reconcile task costs against the approved limit. Stop for approval; do not design or build pages.
```

### Quality gate

Every proposed page concept is traceable to demand, SERP behavior, business strategy, or a clearly labeled combination of them.

---

## Prompt 3C: turn raw keywords into decisions, not a spreadsheet dump

### Use when

The research execution is complete and you need a human-reviewable keyword strategy before choosing pages.

### Paste this prompt

```text
PHASE 3C — KEYWORD CLUSTERING AND OPPORTUNITY DECISIONS

Read the approved business brief, claims matrix, research memo, and raw keyword/SERP evidence. Do not collect new paid data or create site pages in this phase.

Normalize and group the evidence by searcher job, not merely by shared words. Distinguish:
- transactional or commercial investigation;
- service/product category;
- problem or use case;
- location modifier;
- audience or industry;
- comparison or alternative;
- cost, requirements, process, and informational support.

For every meaningful cluster report:
- canonical cluster name and included variants;
- dominant intent and buying stage;
- measured volume, CPC, competition, and location level exactly as supplied;
- representative live SERP result types and recurring domains;
- local-pack presence where relevant;
- whether the existing business can honestly satisfy the intent;
- best destination: homepage, service, location, product, collection, comparison, guide, FAQ/supporting section, or reject;
- priority of launch / later / reject;
- confidence and evidence limitation;
- cannibalization risk with any other cluster.

Do not sum close variants as separate people. Do not create a page merely because a keyword has volume. Separate exact local measurements from national or modeled directional data.

Create:
1. docs/research/keyword-clusters.csv — one row per cluster with the fields above;
2. docs/research/keyword-strategy.md — a concise decision memo with the opportunity hierarchy, SERP patterns, rejected ideas, and evidence limitations;
3. docs/research/keyword-to-page-candidates.csv — a provisional mapping only, clearly marked NOT YET APPROVED.

QUALITY GATE
- Every keyword belongs to a searcher job or is explicitly discarded.
- Every proposed page has one dominant intent.
- Similar queries that can be satisfied together are not split into thin pages.
- High-volume terms that do not fit the business are rejected.

Stop for approval. Do not turn the provisional mapping into routes yet.
```

---

## Prompt 4: create the site structure and formal approval artifact

### Paste this prompt

```text
PHASE 4 — SITE ARCHITECTURE AND SEO PAGE MAP

Read the approved brief, claims matrix, research memo, and raw evidence index. Create docs/seo/page-map.md and docs/seo/site-structure-approval.md. Do not build code.

For every proposed route include:
- route and navigation label;
- page type and hierarchy;
- primary intent and supporting query cluster;
- audience and buying stage;
- unique job the page performs;
- business capability and claim gate;
- evidence and authoritative sources required;
- primary CTA;
- index, preview/noindex, defer, or reject decision;
- internal links in and out;
- potential cannibalization or thin-content risk.

Apply this four-part publication test:
1. proven demand or an explicit strategic purpose;
2. distinct SERP and user intent;
3. real ability to fulfill or route the request;
4. enough unique evidence and useful content.

Reject templated service-by-location combinations that fail the test. Reconcile homepage, service, location, guide, about, contact, legal, and utility routes. Include a Mermaid hierarchy and a route-count summary.

The approval file must contain:
- APPROVE FOR LAUNCH table;
- DEFER table with trigger for reconsideration;
- REJECT table with reason;
- unresolved owner decisions;
- an approval block with date, approver, status, and required changes.

Stop. Do not treat the structure as approved until the owner gives an explicit Phase 4 approval and it is recorded in docs/approval-log.md.
```

### Approval decision

Review the hierarchy, every public route, the navigation, and all deferred/rejected concepts. This is the formal site-structure gate.

---

## Prompt 4B: create unique, evidence-led page briefs

### Use when

The route map is approved. This is especially important when the launch includes multiple services, products, industries, or locations.

### Paste this prompt

```text
PHASE 4B — PAGE BRIEFS AND DIFFERENTIATION PLAN

Read the approved site structure, keyword clusters, SERP notes, business brief, and claims matrix. Create one content brief for every APPROVE FOR LAUNCH route. Do not write final page copy or build code.

Each brief must define:
- route, page type, dominant intent, primary cluster, and supporting questions;
- the one-sentence job of the page and what would make it unnecessary;
- audience situation, objections, and desired next action;
- unique H1 direction and opening answer;
- section outline with the purpose of each section;
- business facts, proof, images, examples, and official/local sources required;
- unique comparison, process, cost factor, use case, regulation, climate, building type, demographic, market condition, or other relevant evidence;
- CTA and internal links in and out;
- metadata direction and eligible schema candidates;
- claims that are permitted, pending, or prohibited;
- overlap risk and a specific distinction from the most similar page.

For repeated page types, create a differentiation matrix. Compare every pair of similar routes across intent, audience, opening, evidence, section order, examples, FAQs, CTA context, metadata, and internal links. Do not use a made-up percentage as proof of uniqueness. A page passes only when its useful information and searcher job are materially distinct.

For location pages, research or assign only locally relevant evidence such as service availability, building stock, utility context, climate, regulations, incentives, transport patterns, project constraints, or neighborhood needs. Do not add generic local trivia, volatile price figures without a dated source, or token city-name swaps.

Create:
- docs/content/page-briefs/<route-slug>.md;
- docs/content/differentiation-matrix.md;
- docs/content/source-requirements.md.

Stop with a list of briefs that are ready, blocked by missing evidence, or should be deferred. Do not manufacture content to rescue a weak route.
```

### Quality gate

Someone unfamiliar with the keyword spreadsheet can explain why every page exists, how it differs from its nearest neighbor, and what evidence it still needs.

---

## Prompt 5A: research design references and choose an experience strategy

### Prepare

Provide any real brand assets and reference URLs. References may indicate qualities you like; they are not permission to clone another site.

### Paste this prompt

```text
PHASE 5A — DESIGN RESEARCH AND EXPERIENCE STRATEGY

Read the approved business brief, audience, page map, content briefs, and existing brand assets. Inspect <REFERENCE_URLS> and research current examples in this niche and adjacent premium industries. Use screenshots or direct page evidence, not memory alone. Do not build code yet.

Extract reusable principles—not a copy—for:
- information hierarchy and first-viewport clarity;
- editorial or conversion rhythm;
- typography, spacing, color, imagery, and material feel;
- navigation, CTAs, cards, proof, process, FAQ, forms, and footer;
- mobile behavior;
- purposeful interaction or motion;
- patterns that feel generic, misleading, inaccessible, or expensive to run.

Propose three genuinely different directions. For each include:
- a memorable name and one-sentence idea;
- why it fits the audience and offer;
- homepage narrative from first viewport to final CTA;
- typography style, palette behavior, layout logic, image language, and interaction level;
- one signature moment that reinforces the service rather than decorating it;
- likely mobile, accessibility, performance, and production risks;
- what to avoid;
- a low-fidelity text wireframe.

Create docs/design/reference-research.md and docs/design/direction-options.md with source links and dated screenshots where allowed. Recommend one direction, but stop for the owner's choice. Do not average the three directions together.
```

### Approve with

```text
APPROVE PHASE 5A DIRECTION <name>. Preserve <specific traits>. Remove or change <specific traits>.
```

---

## Prompt 5B: turn the chosen direction into a homepage experience and design system

### Paste this prompt

```text
PHASE 5B — HOMEPAGE EXPERIENCE AND DESIGN SYSTEM

Read the selected design direction, page briefs, reference research, claims matrix, and brand assets. Do not build production code or generate final images yet.

Create docs/design/homepage-experience.md containing:
1. the page's narrative in one paragraph;
2. a section-by-section wireframe with section purpose, visitor question answered, content, CTA, visual behavior, and mobile adaptation;
3. the exact first-viewport hierarchy: eyebrow, H1 direction, support line, disclosure if needed, primary/secondary CTA, proof, and media role;
4. desktop and mobile layout descriptions;
5. component inventory and which components repeat across other templates;
6. interaction map with essential versus optional behavior;
7. content and asset dependencies;
8. acceptance criteria for clarity, trust, conversion, accessibility, and performance.

Create docs/design/visual-system.md with implementation-ready tokens and rules for:
- font families, weights, size scale, line lengths, and fallbacks;
- semantic colors with contrast targets;
- spacing, containers, breakpoints, grids, radii, borders, shadows, and surfaces;
- buttons, links, navigation, cards, trust blocks, accordions, forms, breadcrumbs, and footer;
- image aspect ratios and crop-safe zones;
- icons, focus, hover, active, error, success, disabled, loading, and reduced-motion states;
- an explicit avoid list.

When proposing a component reference from a library or inspiration site, describe the principle being borrowed, dependency cost, native Astro/CSS alternative, keyboard behavior, and mobile behavior. Do not install or copy it yet.

Create a simple static visual proof or style-tile page if the workspace supports it. Present the first viewport, one content section, one repeated card, one form control, and one CTA at mobile and desktop widths. Stop for visual-system approval.
```

---

## Prompt 5C: create a consistent, realistic image family

### Paste this prompt

```text
PHASE 5C — IMAGE ART DIRECTION AND GENERATION PROMPTS

Read the approved visual system, homepage experience, page briefs, location evidence, and available real assets. Decide first whether each image should be real photography, licensed stock, generated imagery, illustration, product render, data graphic, or no image. Do not generate visuals merely to fill space.

Create docs/design/image-generation-system.md with:
- the visual family's subject, environment, casting, wardrobe, architecture, geography, season, materials, product/hardware rules, camera language, lighting, grade, palette, and realism level;
- composition rules for each required aspect ratio, focal position, text-safe space, and responsive crop tolerance;
- continuity rules for recurring people, locations, objects, vehicles/products, colors, and time of day;
- exclusions for words, logos, watermarks, extra limbs/fingers, duplicate objects, impossible connections, unsafe work, fake credentials, distorted architecture, visual clichés, and unapproved brand marks;
- a master reference-image prompt;
- one detailed prompt per approved asset with route, section, purpose, aspect ratio, subject action, environment, camera, lighting, required details, negative constraints, and alt-text draft;
- a file naming and provenance table.

For each prompt, include this review checklist:
1. Does the anatomy and object interaction make physical sense?
2. Is the equipment/product configuration plausible and singular where required?
3. Does the building, geography, weather, and time of day remain consistent?
4. Is the main action readable at the intended crop and screen size?
5. Are there accidental logos, text, hazards, or unsupported claims?
6. Does it belong to the same visual family?

Generate only one master reference image after presenting the prompt and intended crop. Inspect it at full resolution. If it fails any check, revise the prompt and regenerate rather than accepting the error. Stop for approval before generating the complete asset family.
```

### Quality gate

The image system can generate a coherent family for any approved niche without relying on the case-study subject, and each image has a business purpose and a physical-plausibility check.

---

## Prompt 5D: generate and validate the complete approved image set

### Paste this prompt

```text
PHASE 5D — APPROVED IMAGE PRODUCTION

Use only the approved image-generation system and master reference. Generate the asset list approved in docs/approval-log.md; do not add scenes or change art direction.

For every generated image:
- save the original and web-ready derivative with a descriptive stable filename;
- record the final prompt, model/tool, date, dimensions, crop, intended route/section, and whether it contains generated people or product depictions;
- inspect at full resolution using the Phase 5C checklist;
- test the actual desktop and mobile crop with any planned text overlay;
- reject and regenerate anatomy, continuity, hardware, safety, legibility, or branding failures;
- write accurate alt text based on the final image, not the prompt.

Update the provenance table and create docs/design/image-qa.md with PASS/FAIL for every asset. Do not mark the phase complete while a rejected image remains referenced by a launch page.
```

### Quality gate

Every launch image is purposeful, visually coherent, plausible, responsive, traceable, and approved in its actual page crop.

---

## Prompt 6A: build the Astro foundation and one complete template route

### Paste this prompt

```text
PHASE 6A — ASTRO FOUNDATION AND TEMPLATE PROOF

Implement only from approved artifacts. First inspect the existing project and preserve unrelated work.

Build:
- static-first Astro with strict TypeScript;
- shared BaseLayout with title, description, canonical, robots, social metadata, and favicon;
- typed central content sources for services and guides;
- dynamic routes using getStaticPaths;
- shared DetailPage template;
- global design tokens and responsive base styles;
- package scripts for dev, check, build, and verify;
- one fully implemented approved detail route as the template proof.

The template route needs a unique H1 and opening answer, correct business-model disclosure, responsive image and accurate alt text, useful evidence modules, checklist, FAQs, sources with verification dates, related links, CTA, unique metadata, canonical, robots rule, and eligible truthful JSON-LD.

Constraints:
- no motion, CMS, analytics, production form backend, or deployment yet;
- no React, Tailwind, or large client dependency unless an approved requirement cannot reasonably be met with Astro/CSS;
- no invented proof or unsupported schema;
- no generation of all remaining pages.

Run type/astro checks, production build, and visual checks at mobile and desktop widths. Report generated routes and exact validation. Stop for template approval.
```

### Approval decision

Approve the shared layout, typography, component language, content depth, and mobile template before scaling it.

---

## Prompt 6B: build the approved content set and static homepage

### Paste this prompt

```text
PHASE 6B — APPROVED PAGES AND STATIC HOMEPAGE

Read the approved template, page map, visual system, image system, claims matrix, and approval log. Add only routes marked APPROVE FOR LAUNCH.

For each route:
- use the central typed content source and shared template;
- write a distinct opening, sections, examples, FAQs, CTA, internal links, metadata, sources, and schema inputs;
- preserve index/noindex decisions;
- flag pages that become too similar rather than padding them;
- use the approved image family and accurate alt text.

Build the homepage in semantic Astro/HTML before motion. It must communicate within the first viewport:
- what the business offers;
- who and where it serves;
- the real business model;
- the primary conversion action;
- a useful trust or proof signal.

Then include approved services, process, proof, coverage, FAQs, guides, and CTA in a deliberate narrative. Generate navigation, homepage cards, sitemap data, llms.txt links, and schema manifest from the same content source wherever practical.

Run checks, build, internal-link validation, unique title/description/H1 checks, route inventory comparison against the approved structure, and mobile/desktop visual review. Report indexable/noindex counts and any similarity concern. Do not add animation yet.
```

### Quality gate

The static site is complete, understandable, and conversion-capable with JavaScript and animation removed.

---

## Prompt 6C: choose and integrate only the CMS the editor actually needs

### Use when

The owner needs to add articles or make controlled page edits after handoff. Skip this phase if content will stay in version-controlled files.

### Paste this prompt

```text
PHASE 6C — CMS DECISION AND CONTROLLED EDITING

Editing need: <CMS_NEED>
Expected editors: <number and technical comfort>
Content types: <articles, services, locations, products, authors, global settings>
Hosting and deployment: <STACK>
Budget and account constraints: <details>

Inspect the current content model and approved editor needs. Compare only realistic options, including continuing with Astro content files. Evaluate:
- editor experience and preview;
- structured fields and validation;
- support for relationships, drafts, scheduling, images, authors, redirects, SEO fields, canonicals, and robots controls;
- API/build/runtime behavior on the chosen hosting platform;
- authentication, backups, export/portability, vendor lock-in, limits, and recurring cost;
- effect on performance, security, maintenance, and deployment workflow.

Create docs/architecture/cms-decision.md with a weighted comparison and recommendation. Do not choose a visual page builder merely because it offers unrestricted editing; preserve the approved templates, claims boundaries, metadata rules, and schema model.

Stop for approval before creating an account, installing a package, changing deployment, or migrating content.

After approval, implement only the approved content types and fields. Add validation so required titles, descriptions, canonical behavior, sources, dates, images, alt text, claims status, relationships, and index/noindex state cannot silently disappear. Document the editor workflow, preview/publish path, rollback, and backup/export process. Migrate one representative item and validate its rendered page before migrating the rest.
```

---

## Prompt 7A: decide whether the site needs a signature interaction

### Paste this prompt

```text
PHASE 7A — SIGNATURE INTERACTION CONCEPTS

Motion level: <MOTION_LEVEL>
Core customer transformation: <before state> to <after state>
Physical action or visual metaphor in this niche: <action, object, system, or unknown>

Read the approved static homepage, visual system, business brief, and image family. Inspect the rendered homepage at mobile and desktop widths. Do not implement motion or generate media yet.

First decide whether a signature interaction will improve comprehension, emotional impact, or conversion enough to justify its complexity. If not, recommend restrained interface motion and explain why.

If justified, propose three distinct concepts. Consider scroll-scrubbed video, sequential stills, SVG/line animation, masked transitions, interactive object manipulation, lightweight 3D, typography, or a combination—but choose the lightest medium that can express the idea. For each concept provide:
- concept name and visitor story in one sentence;
- the business idea it makes easier to understand;
- the exact visitor input: scroll, drag, hover, tap, or passive time;
- 4–8 story beats from entry to resolution;
- relationship between background media, interface overlays, headline, proof, and CTA;
- desktop, touch/mobile, keyboard, reduced-motion, no-JavaScript, and slow-network behavior;
- required assets and how they would be produced;
- feasibility, browser support, likely bundle/media weight, LCP/CLS risk, and implementation complexity;
- failure modes, including physical/anatomical continuity for generated media;
- the removal test: what still communicates if the interaction fails.

Create docs/design/motion-concepts.md with a comparison and recommendation. Stop for the owner to select, revise, or reject the signature interaction.
```

### Approval decision

Choose the story and medium, not merely the most technically elaborate option.

---

## Prompt 7B: storyboard a selected scroll-video or generated-media concept

### Use when

The chosen concept uses generated or filmed media. Skip this prompt for a purely CSS/SVG interaction.

### Paste this prompt

```text
PHASE 7B — MEDIA PREPRODUCTION AND CONTINUITY

Read the approved motion concept, image system, visual system, and homepage experience. Do not generate video yet.

Simplify the story to the fewest shots that clearly communicate the action. Prefer one continuous, physically plausible action over a montage. Split it only where a change in camera, environment, subject, or generation constraint requires a separate clip.

Create docs/design/motion-storyboard.md with a table containing:
- scene and shot number;
- narrative purpose;
- approximate seconds and scroll share;
- start-frame description;
- end-frame description;
- subject action and exact object interaction;
- camera attachment or movement, lens, framing, focus, and direction of travel;
- fixed continuity facts: person, hand, clothing, building, product, cable/connector, vehicle/object geometry, weather, lighting, and color;
- overlay copy or interface event, kept separate from generated media;
- transition into and out of the shot;
- mobile crop and reduced-motion poster frame;
- generation risk and rejection criteria.

Then write production-ready prompts for:
1. each high-resolution start image;
2. each matching end image;
3. each image-to-video segment using the approved video model;
4. an optional transition/retime pass;
5. a negative prompt or explicit exclusions.

The prompts must lock the same identity and geometry across frames, name the one permitted action, and prohibit extra ports, duplicate objects, changing architecture, morphing hands, disconnected cables, unreadable product shapes, unintended camera cuts, added text/logos, and new scene elements. Keep generated video free of typography and UI; overlays belong in the webpage.

Create a shot manifest with filename, dimensions, frame rate target, duration, seed/reference where supported, model/tool, and approval status. Present low-cost start/end frame tests first. Stop before video generation.
```

---

## Prompt 7C: generate, inspect, and assemble the approved media

### Paste this prompt

```text
PHASE 7C — MEDIA GENERATION AND QA

Generate only the shots approved in the motion storyboard and manifest. Begin with one proof shot. Do not spend beyond <approved generation budget or attempt limit>.

For every attempt:
- use the approved start/end frames and continuity block;
- save the exact prompt, model, settings, date, cost/credit use where available, and output filename;
- inspect frame-by-frame at the beginning, middle, and end;
- reject extra limbs, ports, cables, objects, geometry changes, architecture changes, morphing, reverse action, unintended slow motion, camera drift, brand text, and continuity breaks;
- verify that the motion is useful across the intended scroll range and mobile crop;
- compare the last frame of one segment to the first frame of the next.

Do not keep a flawed shot because it is visually attractive. Revise one variable at a time and record the reason for each regeneration. If repeated attempts fail, simplify the action, shorten the shot, use a real/still asset, or move the questionable detail into a web overlay.

After all shots pass, assemble a clean master without webpage text or UI. Trim dead frames and excessive slow sections, but do not use optical flow or interpolation if it creates anatomy or object artifacts. Export:
- an archival master;
- a web-optimized primary format;
- a tested fallback if required by browser support;
- a poster frame;
- a reduced-motion still sequence or static fallback.

Create docs/design/motion-media-qa.md with PASS/FAIL evidence, continuity notes, durations, file sizes, codecs, dimensions, and the approved master path. Stop before integrating it into the website.
```

---

## Prompt 7D: implement scroll motion, overlays, and fallbacks

### Paste this prompt

```text
PHASE 7D — SCROLL EXPERIENCE IMPLEMENTATION

Read the approved motion concept, storyboard, media QA, homepage experience, and production constraints. Inspect the current static homepage and preserve its semantic content.

Implement only the approved experience. Requirements:
- the first viewport still states the offer, audience/location, real business model, and primary CTA without waiting for motion;
- scroll progress maps predictably to the approved media or timeline, with no long dead zones;
- overlay moments are short, legible, and synchronized to story beats without being baked into the video;
- calls to action remain reachable and functional;
- media has explicit dimensions and cannot cause layout shift;
- nonessential media does not become the LCP bottleneck where a lighter poster can load first;
- touch/mobile receives an intentionally shortened or alternate experience, not a broken desktop pin;
- prefers-reduced-motion shows the static content and approved poster/sequence;
- keyboard, focus, resize, orientation change, history navigation, and no-JavaScript behavior remain usable;
- playback and scroll logic cleans up correctly and does not run offscreen unnecessarily.

Prefer transforms and opacity. If using an animation library, load only the required modules, scope and clean up timelines, and document why native CSS/JavaScript was insufficient. Do not hide SEO-critical copy inside canvas or inaccessible media.

Add restrained supporting motion only where it improves hierarchy: reveals, one button response, and navigation behavior. Do not animate every section.

Validate at mobile and desktop widths, reduced motion, keyboard navigation, and production build. Compare the static message and CTA before and after. Remove any effect that obscures the offer or creates a measurable layout shift.

Record implementation details, breakpoint behavior, performance evidence, and removal/fallback behavior in docs/design/motion-implementation.md. Stop for experience approval.
```

### Approval decision

Approve comprehension and pacing, not only visual novelty.

---

## Prompt 8: implement technical SEO and truthful structured data

### Paste this prompt

```text
PHASE 8 — TECHNICAL SEO AND SCHEMA

Audit the built routes against the approved page map and claims matrix. Implement the smallest truthful schema graph appropriate to the actual business entity and page content.

Requirements:
- unique title, description, H1, canonical, and robots behavior;
- Organization or LocalBusiness subtype only when eligibility and facts are supported;
- Service, Article, BreadcrumbList, and FAQPage only where the visible page and current search-engine guidance justify them;
- stable IDs and consistent entity references;
- no invented ratings, prices, addresses, licences, areas, reviews, offers, or relationships;
- schema generated from the same trusted content data where practical;
- XML sitemap containing only intended canonical indexable URLs;
- robots.txt with sitemap reference;
- llms.txt with an H1, concise business explanation, and useful canonical links.

Create or update a schema validation manifest listing route, schema types, entity IDs, source fields, claim status, and validation status.

Run build-time audits for route inventory, canonicals, metadata uniqueness, heading count, internal links, sitemap/robots/llms consistency, and JSON parsing. Identify items that still require external rich-results validation. Do not claim that valid JSON guarantees rich-result eligibility.
```

---

## Prompt 9: run production quality, accessibility, and performance QA

### Paste this prompt

```text
PHASE 9 — PRODUCTION QA

Build the production output and audit the actual rendered pages, not only source code.

Test at minimum:
- homepage;
- one service page;
- one guide or informational page;
- contact/conversion page;
- 404 page;
- a representative mobile and desktop viewport;
- reduced-motion and keyboard-only behavior.

Measure or inspect:
- Lighthouse performance, accessibility, best practices, SEO, and agentic browsing where available;
- FCP, LCP, TBT, CLS, and Speed Index;
- image dimensions, format, loading, and responsive delivery;
- render-blocking resources and unused JS/CSS;
- contrast, focus, landmarks, labels, alt text, and heading order;
- layout-shift culprits;
- broken links, canonicals, sitemap, robots, llms.txt, and schema parsing;
- missing files and stale unused assets.

Fix in-scope local issues that do not change approved design or business behavior. For any tradeoff that would materially change the design, report the evidence and request approval.

Create docs/qa/production-readiness.md with before/after evidence, exact commands or tools, remaining risks, and PASS/FAIL for every acceptance criterion. Do not deploy while any critical conversion, claim, indexing, accessibility, or build check is failing.
```

---

## Prompt 10: verify lead handling and production readiness

### Paste this prompt

```text
PHASE 10 — LEAD AND FORM READINESS

Trace every public conversion action from user interaction to the real operational destination.

For each form, phone link, email link, booking link, or quote CTA, document:
- visible promise;
- fields and validation;
- consent and privacy dependencies;
- submission destination;
- spam protection;
- success and failure behavior;
- notification owner;
- retention or CRM behavior if known;
- production status: real, prototype, disabled, or unknown.

Never represent a console log, local mock, placeholder endpoint, or unmonitored inbox as working lead capture. Test local handlers with safe test data where authorized. If production configuration or an external write is required, stop and request the exact approval or credential configuration needed without asking for the secret itself.

Update docs/qa/production-readiness.md and docs/project-state.md. Deployment is blocked unless every primary conversion has an honest visible behavior and an owner-approved operational destination.
```

---

## Prompt 10B: define analytics, consent, and conversion measurement

### Paste this prompt

```text
PHASE 10B — MEASUREMENT PLAN AND IMPLEMENTATION

Primary conversion: <PRIMARY_CONVERSION>
Analytics platform: <platform or undecided>
Advertising platforms: <none or list>
Consent/privacy markets: <locations served>

Read the business brief and trace the real visitor journey. Create docs/analytics/measurement-plan.md before adding tags. Define only events that answer a business decision.

For every event specify:
- event name and purpose;
- exact user action and trigger;
- page/context parameters;
- whether it is a primary conversion, secondary conversion, diagnostic, or unnecessary;
- success condition and deduplication rule;
- data minimization and consent requirement;
- test method and owner.

At minimum consider form_start, form_validation_error, form_submit_success, form_submit_failure, click_to_call, click_to_email, booking_start, purchase/trial completion, and meaningful CTA clicks. Do not count a button click as a successful lead when the backend later fails.

Audit whether a consent mechanism and legal review are required for the chosen tools and markets. Do not invent legal conclusions; document the decision owner and block nonessential tags when required.

Stop for approval before creating external analytics properties, changing account settings, or publishing tags. After approval, implement the smallest approved setup, exclude secrets and personal form values, preserve site performance, and test in browser/debug tools. Record event evidence and PASS/FAIL. Defer Search Console property verification and sitemap submission until the production domain is live and explicitly authorized.
```

---

## Prompt 11: deploy to Cloudflare with an explicit production gate

### Prepare

Confirm the exact Cloudflare account, project name, production branch, and domain. Decide whether this is a preview or production deployment.

### Paste this prompt

```text
PHASE 11 — CLOUDFLARE DEPLOYMENT

Deployment type: <preview / production>
Cloudflare account/project: <non-secret identifier>
Expected public URL or domain: <URL>
Production branch: <branch>

Read the approval log and production-readiness report. Confirm that site-structure, claims, design/template, technical SEO, conversion behavior, and production QA gates are approved. If a required gate is absent or failed, do not deploy.

Before the external write, show:
- exact build command and output directory;
- Cloudflare project/account target;
- whether any resource will be created or changed;
- expected URL;
- rollback or previous-deployment path;
- unresolved warning.

Wait for this exact authorization if it is not already recorded:
AUTHORIZE PHASE 11 <PREVIEW or PRODUCTION> DEPLOYMENT TO <target>.

After authorization, build from a clean production state, deploy only to the approved target, and capture deployment ID/URL without secrets. Do not change DNS unless separately and explicitly authorized. Continue directly to the live acceptance tests; deployment success alone is not completion.
```

---

## Prompt 12: perform live acceptance and create the 90-day plan

### Paste this prompt

```text
PHASE 12 — LIVE ACCEPTANCE AND POST-LAUNCH PLAN

Live URL: <URL>

Test the live public deployment independently of the local build.

Verify:
- HTTP status, redirects, HTTPS, canonical host, and important headers;
- every approved route plus 404 behavior;
- navigation, internal links, images, fonts, video, and responsive layout;
- robots.txt, sitemap.xml, llms.txt, metadata, canonicals, and parsed schema;
- primary conversion from the public origin using safe test data if authorized;
- mobile, desktop, reduced motion, keyboard, and contrast;
- live Lighthouse/Core Web Vitals lab results and layout shift;
- no preview/noindex rules accidentally remain on production;
- the live route inventory matches the approved structure.

Fix only safe in-scope issues covered by the deployment authorization. Ask before DNS, account, paid service, new integration, or scope-expanding changes.

Create docs/qa/live-acceptance.md with PASS/FAIL evidence and create docs/operations/first-90-days.md with:
- analytics and Search Console setup dependencies;
- sitemap submission;
- lead verification cadence;
- weekly technical checks;
- 30/60/90-day query, page, conversion, and content decisions;
- claim/source re-verification dates;
- page expansion rules based on measured demand and operational capability.

Update project-state, decision, and approval logs. Declare launch complete only if all critical live checks pass; otherwise state the blocker and owner.
```

---

## How to adapt the pack to different business types

Keep the same gates and change the evidence, page types, and conversion path:

| Business type | Typical launch pages | Proof and schema caution | Primary conversion |
| --- | --- | --- | --- |
| Local provider | Core services, genuinely distinct locations, about, contact, guides | Verify address/service area, licences, staff, reviews, and who performs the work | Call, booking, quote |
| Referral or lead generation | Problem/service hubs, matching process, coverage, provider standards, disclosures | Never imply the site performs the service; disclose routing, consent, and provider independence | Qualified intake |
| Professional service | Services, industries or client types, people, case studies, insights | Verify credentials, jurisdictions, outcomes, confidentiality, and testimonial rules | Consultation |
| SaaS | Product, use cases, integrations, pricing, comparisons, docs/resources | Avoid unsupported customer/result/security claims; model product/application entities carefully | Trial, demo, signup |
| Ecommerce | Categories, products, buying guides, comparison/support content | Keep price, availability, shipping, returns, reviews, and Product/Offer data synchronized | Purchase |
| Marketplace | Category/location discovery, provider/vendor pages, process, trust/safety | Clarify platform versus vendor responsibility, availability, ranking, reviews, and fees | Booking, transaction, inquiry |

The master variable sheet should change; the operating contract should not. Keyword evidence determines opportunities, approved page briefs determine content, and real operational capability determines what may be published.

---

## Reusable continuation prompt

```text
This is a continuation of an existing website project. Treat workspace files as the source of truth. Read docs/project-state.md, docs/decision-log.md, docs/approval-log.md, the approved brief, claims matrix, page map, and relevant current code. Reconstruct the current phase and validation state. Report conflicts before changing anything. Then continue only the already approved in-scope work.
```

## Reusable correction prompt

```text
The last result does not meet the approved requirement.

Phase: <number and name>
Expected result: <observable acceptance criterion>
Observed result: <specific problem, error, screenshot, URL, or metric>
Authoritative source: <approved file, requirement, source URL, or decision>
Scope allowed: <diagnose only / fix local files and validate / other>

First inspect the relevant source and reproduce or verify the problem. Distinguish the root cause from symptoms. If this is a diagnosis-only request, do not edit. If a fix is authorized, make the smallest in-scope correction, preserve unrelated work, run the exact acceptance test, and report files changed plus before/after evidence. Do not broaden the design or invent missing business facts.
```

## Design basis

The pack is model-agnostic: use the strongest research and coding model available in your environment. The prompt design keeps instructions focused, supplies domain context and hard constraints, defines autonomy and approval boundaries, specifies observable success criteria, and validates behavior on representative routes. Durable project artifacts—not chat memory—carry decisions from one phase to the next.

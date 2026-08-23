# Strategic AI Answer Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make BrightAI's priority governance, security, compliance, banking, and readiness content citation-ready for Google AI answers, Bing/Copilot, ChatGPT Search, Perplexity, and comparable systems without crawler-only or unsupported marketing copy.

**Architecture:** Reuse the existing Astro hub, solution, content-collection, and migrated-page rendering paths. Introduce one narrowly scoped Agentic AI Security hub component and a single static contract test; update each existing canonical owner in place with visible answer, official-source, freshness, official-versus-BrightAI, and structured-content signals. Reduce the machine-readable files to the same canonical routes and visible claims.

**Tech Stack:** Astro static rendering, TypeScript, Markdown content collections, JSON migrated-page source, Node test runner, pnpm.

---

## File map

- Modify: `src/components/hub/AiGovernancePillar.astro` — strengthen the visible answer, official Saudi source panel, freshness, and implementation boundary for the informational governance owner.
- Modify: `src/components/hub/SdaiaAiRiskManagementGuide.astro` — make the existing SDAIA source proof and BrightAI boundary consistently explicit.
- Create: `src/components/hub/AgenticAiSecurityPillar.astro` — the new security-focused canonical page.
- Modify: `src/components/hub/AgenticAiGovernancePillar.astro`, `src/pages/hub/[slug].astro`, and `src/pages/hub/index.astro` — register, link, and index the new security hub while retaining the governance/security distinction.
- Modify: `src/pages/solutions/[slug].astro` and `src/data/solutions.ts` — enrich the dedicated governance-platform and AI-Firewall render branches using their current verified product capability copy.
- Modify: `src/content/docs/pdpl-ai-complete-guide.md`, `src/content/blog/nca-cybersecurity-requirements-saudi.md`, and `src/content/blog/iso-42001-saudi-implementation-guide.md` — apply the same visible source/date/boundary/structure pattern to the three canonical regulatory guides.
- Modify: `src/data/migrated-pages/local-banking-ai-governance-riyadh.json` — add Saudi banking/Riyadh citation structure and source distinctions without changing the city route's canonical identity.
- Modify: `src/pages/assessment/ai-governance-readiness/index.astro` — add supporting, server-rendered context and a transparent assessment boundary.
- Modify: `public/llms.txt`, `public/llms-full.txt`, and `public/ai.txt` — synchronize to the high-value canonical set and visible on-page claims.
- Create: `scripts/strategic-ai-answer-content.test.mjs` — source and built-output regression checks.
- Modify: `.agents/mind/01-mind-latest.md` — prepend the required task ledger only after all verification completes.

### Task 1: Add the content contract before changing page copy

**Files:**
- Create: `scripts/strategic-ai-answer-content.test.mjs`
- Test: `scripts/strategic-ai-answer-content.test.mjs`

- [ ] **Step 1: Write failing source assertions for every canonical page and machine-readable file.**

  Define the exact route/file map in the test: governance hub, SDAIA risk hub, new Agentic security hub, Agentic governance hub, governance platform, AI Firewall, PDPL guide, NCA guide, ISO guide, Riyadh banking page, and readiness assessment. Assert each source includes an answer marker, `المصدر الرسمي`, `آخر تحديث`, both boundary labels, a structured HTML marker (`table`, `ol`, `ul`, or `figure`), and at least one `https://` official-domain link. Assert all three machine-readable files contain the new canonical security URL and exclude noncanonical/legacy variants.

- [ ] **Step 2: Run the test before implementation.**

  Run: `node --test scripts/strategic-ai-answer-content.test.mjs`

  Expected: FAIL because the new component, route registration, and uniform content markers do not exist.

### Task 2: Build the Agentic AI Security canonical page

**Files:**
- Create: `src/components/hub/AgenticAiSecurityPillar.astro`
- Modify: `src/pages/hub/[slug].astro`
- Modify: `src/pages/hub/index.astro`
- Test: `scripts/strategic-ai-answer-content.test.mjs`

- [ ] **Step 1: Register `/hub/agentic-ai-security/` as a static indexable hub page.**

  Add the slug, Arabic title/description, and selected component branch beside `agentic-ai-governance` in `src/pages/hub/[slug].astro`; add it to the hub index cards and `hasPart` list in `src/pages/hub/index.astro`. Preserve the shared Arabic layout, self-canonical metadata, breadcrumb, and sitemap generation path.

- [ ] **Step 2: Create the semantic Agentic security content.**

  Write a server-rendered component that opens with a direct Saudi-enterprise answer and a visible `المصدر الرسمي` panel linking first to an authoritative NCA cybersecurity source, with an optional SDAIA source only when it supports a different point. Include an explicit `آخر تحديث: 2026-08-24`, a five-boundary matrix (identity, tool permissions, data egress, prompt/output safety, monitoring/incident evidence), and an original accessible lifecycle figure from inventory to incident review.

- [ ] **Step 3: Separate official guidance from BrightAI implementation.**

  Add adjacent, visually distinct sections labeled `متطلب أو إرشاد رسمي` and `منهج BrightAI للتنفيذ`. The first describes security guidance without calling it a universal AI-specific mandate; the second describes capability patterns (least privilege, policy checks, approvals, logs, evidence) without asserting NCA/SDAIA approval, legal advice, certification, or guaranteed prevention.

- [ ] **Step 4: Run the focused contract test.**

  Run: `node --test scripts/strategic-ai-answer-content.test.mjs`

  Expected: the Agentic security route assertions pass; unrelated targets remain red until their tasks are complete.

### Task 3: Normalize informational governance and regulatory owners

**Files:**
- Modify: `src/components/hub/AiGovernancePillar.astro`
- Modify: `src/components/hub/SdaiaAiRiskManagementGuide.astro`
- Modify: `src/components/hub/AgenticAiGovernancePillar.astro`
- Modify: `src/content/docs/pdpl-ai-complete-guide.md`
- Modify: `src/content/blog/nca-cybersecurity-requirements-saudi.md`
- Modify: `src/content/blog/iso-42001-saudi-implementation-guide.md`
- Test: `scripts/strategic-ai-answer-content.test.mjs`

- [ ] **Step 1: Add the visible source/date/boundary pattern to the three hub components.**

  Keep each page's current original matrix or lifecycle. Add/update a near-top official-source panel with the authoritative source first, use `آخر تحديث: 2026-08-24`, and add visibly labelled official-guidance and BrightAI-implementation sections where they are not already explicit. Link one additional official source only when it corroborates a distinct claim.

- [ ] **Step 2: Apply the pattern to PDPL, NCA, and ISO guides.**

  Preserve current frontmatter, canonical URLs, and existing source citations. Add a 40–60 word direct answer after the opening, Saudi-specific framing, a primary-source panel (SDAIA/NDMO for PDPL, NCA for cybersecurity, ISO for ISO/IEC 42001), last-updated date, and a topic-specific checklist/table/framework. State which rows are official requirement/guidance and which are BrightAI operating approach.

- [ ] **Step 3: Remove or soften unsupported regulatory certainty encountered in these files.**

  Replace categorical compliance, approval, certification, fixed-timeline, or mandatory-status language unless directly supported by the cited primary source and correctly scoped. Do not invent article numbers, penalties, dates, or source claims.

- [ ] **Step 4: Run the focused contract test.**

  Run: `node --test scripts/strategic-ai-answer-content.test.mjs`

  Expected: all informational and regulatory target assertions pass.

### Task 4: Update commercial and sector pages without inflating claims

**Files:**
- Modify: `src/pages/solutions/[slug].astro`
- Modify: `src/data/solutions.ts`
- Modify: `src/data/migrated-pages/local-banking-ai-governance-riyadh.json`
- Modify: `src/pages/assessment/ai-governance-readiness/index.astro`
- Test: `scripts/strategic-ai-answer-content.test.mjs`

- [ ] **Step 1: Enrich the dedicated governance-platform and AI-Firewall render branches.**

  Add visible `المصدر الرسمي` panels, `آخر تحديث: 2026-08-24`, source-versus-implementation split, and a compact original control-to-evidence matrix. Reuse only current on-page BrightAI capabilities: governance platform maps policy, risk, control, enforcement, and evidence; AI Firewall inspects configured AI interactions and applies policy actions. Retain existing statements that neither product guarantees compliance or prevention.

- [ ] **Step 2: Add a Riyadh banking decision matrix to the migrated page data.**

  Use a Saudi banking context that names SAMA and PDPL as sources/context without claiming endorsement or approval. Make the first source row official and separate the BrightAI operating route (approved use case, data boundary, human approval, evidence) into its own labelled section. Add an accessible table/list and original process diagram data that the migrated page renderer exposes to users.

- [ ] **Step 3: Strengthen the readiness assessment's supporting copy.**

  Keep all questions, results, and data handling unchanged. Add server-rendered explanatory copy linking the eight readiness dimensions to a visible source/context panel and clearly state the assessment is an indicative BrightAI diagnostic, not a regulatory finding, certification, or legal opinion.

- [ ] **Step 4: Run the focused contract test.**

  Run: `node --test scripts/strategic-ai-answer-content.test.mjs`

  Expected: all page targets pass and the assertions find no prohibited certification/guarantee language added by this task.

### Task 5: Synchronize the machine-readable discovery files

**Files:**
- Modify: `public/llms.txt`
- Modify: `public/llms-full.txt`
- Modify: `public/ai.txt`
- Test: `scripts/strategic-ai-answer-content.test.mjs`

- [ ] **Step 1: Reduce `llms.txt` to the canonical high-value routes.**

  Keep entity facts supported by visible site content and list only the eleven scope routes plus essential organization/contact references. Describe each destination in wording already present on that page; remove broad inventories, noncanonical city variants, unverified deployment claims, and marketing phrases not supported on-page.

- [ ] **Step 2: Make `llms-full.txt` a fuller reading map, not a competing inventory.**

  Organize the same priority pages by governance, regulation, products, agentic security, banking, and readiness. Point to the official source panels on the destination pages rather than recharacterizing official requirements in the file.

- [ ] **Step 3: Update `ai.txt` to the same canonical claims and dates.**

  Preserve the crawler policy and entity fields only when they remain publicly supported. Replace its authoritative-page map with the scope's canonical pages, add the Agentic security hub, and align `Last-Major-Update`/topic review date to `2026-08-24`.

- [ ] **Step 4: Run the contract test.**

  Run: `node --test scripts/strategic-ai-answer-content.test.mjs`

  Expected: PASS for all source and machine-readable assertions.

### Task 6: Build and verify the rendered surface

**Files:**
- Modify: `.agents/mind/01-mind-latest.md`
- Test: `scripts/strategic-ai-answer-content.test.mjs`

- [ ] **Step 1: Run a production build.**

  Run: `pnpm build`

  Expected: exit 0; record only pre-existing warnings separately from this scope.

- [ ] **Step 2: Run source and built HTML checks.**

  Run: `node --test scripts/strategic-ai-answer-content.test.mjs && pnpm seo:check && pnpm seo:schema && pnpm seo:hreflang && pnpm internal-links:audit`

  Expected: exit 0; target pages have one H1, self-canonical/indexable HTML, visible direct answer/source/date/boundary/structure, and no broken or orphaned links.

- [ ] **Step 3: Inspect mobile and desktop rendering.**

  Use local built HTML at 360px and 1440px to confirm no horizontal overflow, readable source panels/tables, logical RTL order, and keyboard-visible focus for links/details. Record any environment limitation honestly.

- [ ] **Step 4: Prepend the task ledger entry only after evidence is collected.**

  Add the date, scope routes, page/machine-readable files, verification commands and results, and any remaining external blocker to `.agents/mind/01-mind-latest.md`. Do not edit archived mind files.

- [ ] **Step 5: Check the final diff.**

  Run: `git -c core.fsmonitor=false diff --check && git -c core.fsmonitor=false status --short`

  Expected: no whitespace errors; report only files changed by this task and preserve unrelated working-tree changes.

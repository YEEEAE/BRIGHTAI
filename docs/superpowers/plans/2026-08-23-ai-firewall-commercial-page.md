# AI Firewall Commercial Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated, truthful, conversion-focused `/solutions/ai-firewall/` page for enterprise AI security buyers.

**Architecture:** Keep the existing dynamic solution route and add a slug-specific Astro branch beside the existing governance-platform branch. Add all visual styling in the route's scoped style block, preserve the shared `ArabicLayout` metadata/schema pipeline, and update only the AI Firewall solution metadata needed for accurate SEO copy and internal links.

**Tech Stack:** Astro, TypeScript, existing BrightAI layout/components, scoped CSS, Node test/build scripts.

---

### Task 1: Add a focused contract test for the dedicated page

**Files:**
- Create: `scripts/ai-firewall-commercial-page.test.mjs`
- Modify: `package.json` only if an existing test script convention requires registration; otherwise run directly with `node --test`.

- [ ] **Step 1: Write assertions against source markup**

Assert that `src/pages/solutions/[slug].astro` contains the slug branch and required visible section IDs/text: direct definition, `ai-firewall-flow`, `ai-firewall-capabilities`, `ai-firewall-vs-network-firewall`, `ai-firewall-vs-dlp`, `ai-firewall-scenario`, and the contact CTA. Assert the page copy contains “مو ضمان مثالي” or equivalent limitation language and does not contain the unsupported absolute claims `يعمل مع جميع نماذج` or `يضمن التوافق` in the AI Firewall source content.

- [ ] **Step 2: Run the test before implementation**

Run: `node --test scripts/ai-firewall-commercial-page.test.mjs`

Expected: FAIL because the slug-specific branch and required IDs do not exist yet.

### Task 2: Update accurate AI Firewall metadata

**Files:**
- Modify: `src/data/solutions.ts:216-226`

- [ ] **Step 1: Replace overbroad title/description copy**

Use a title and description that mention AI Firewall, enterprise AI security, LLM security, and data leakage prevention naturally. Remove the phrase claiming direct NCA ECC compatibility and replace it with supporting implementation/alignment language. Keep the existing canonical, docs, blog, kernel, and related solution links.

- [ ] **Step 2: Keep the generated content data untouched unless the route no longer consumes it**

The dedicated branch owns visible AI Firewall copy. Do not rewrite the auto-generated file as part of this page unless a metadata/type change requires it; this avoids changing unrelated product pages.

### Task 3: Build the dedicated AI Firewall page branch

**Files:**
- Modify: `src/pages/solutions/[slug].astro` near the `isGovernancePlatform` conditional and the route-scoped style block.

- [ ] **Step 1: Add slug-specific data constants**

Define typed arrays for capabilities, flow steps, policy examples, and comparison rows in the frontmatter. Each item must distinguish `inspect`, `block`, `flag`, `log`, or `route` behavior and must use implementation-safe language.

- [ ] **Step 2: Add the hero and direct answer**

Render a dedicated `ai-firewall-page` main with an H1, a visible first answer beginning with “وش هو AI Firewall؟”, primary `/contact/` CTA, secondary docs CTA, and a console visual that shows a prompt, inspection signal, decision, and evidence metadata. Keep all important text server-rendered.

- [ ] **Step 3: Add the capability surface**

Render cards for prompts, responses, sensitive data, policy violations, risky destinations/models, and evidence/logging. Explicitly say that actual coverage depends on configured patterns, policies, and integration path.

- [ ] **Step 4: Add the four-stage flow diagram**

Render a semantic ordered list with `input`, `inspection`, `decision`, and `output/evidence` stages. Include route labels for allow, redact, block, flag/review, and log where applicable.

- [ ] **Step 5: Add policy cards, scenario, and comparisons**

Render example policies with a “when detected” and “possible action” pattern, one before/after scenario, and two responsive comparison tables: AI Firewall vs traditional network firewall, and AI Firewall vs DLP. Explain that AI Firewall operates at the AI interaction boundary while DLP is a broader data-movement control; they can complement each other.

- [ ] **Step 6: Add limitations, regulatory context, FAQ, and CTA**

State that the layer reduces and operationalizes risk but does not guarantee catching every harmful prompt, model output, or hidden channel. Frame PDPL/NCA/SDAIA as supporting implementation/alignment context. Add visible FAQ answers and the final CTA.

- [ ] **Step 7: Add scoped responsive styling**

Use the existing route style block with unique `ai-firewall-*` classes. Cover 360px and 1440px layouts, RTL logical properties, focus-visible states, reduced motion, readable contrast, and no new JS.

### Task 4: Verify the page and update the live mind ledger

**Files:**
- Modify: `.agents/mind/01-mind-latest.md` at the top.

- [ ] **Step 1: Run focused contract test**

Run: `node --test scripts/ai-firewall-commercial-page.test.mjs`

Expected: PASS with all assertions green.

- [ ] **Step 2: Run project verification**

Run: `pnpm build`; `pnpm seo:check`; `pnpm seo:hreflang`; `pnpm internal-links:audit`; `git diff --check`.

Expected: build completes; SEO/hreflang/link audits report zero new errors; diff check is clean. Record any pre-existing route-collision warning honestly.

- [ ] **Step 3: Inspect built output**

Check `dist/client/solutions/ai-firewall/index.html` for exactly one H1, the direct answer, both comparison headings, contact CTA, canonical, and absence of `noindex`.

- [ ] **Step 4: Add the ledger entry**

Add a dated entry at the top of `.agents/mind/01-mind-latest.md` listing changed files, truth-boundary decisions, verification results, and the no-commit/no-push status.


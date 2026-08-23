# AI Governance Readiness Assessment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/assessment/ai-governance-readiness/` into a crawlable Saudi-enterprise readiness assessment that gives an on-device, transparent directional summary and converts qualified visitors to a consultation.

**Architecture:** Keep explanatory and trust content server-rendered in the Astro route, including all eight assessment dimensions and the non-legal/non-certification boundary. Load one small same-origin progressive-enhancement module that turns the semantic fieldsets into a multi-step form, derives descriptive strengths/gaps/control suggestions without a numeric score, and emits allow-listed anonymous analytics events through the existing unified analytics runtime.

**Tech Stack:** Astro, semantic HTML/CSS, vanilla browser JavaScript, Node test runner, existing BrightAI analytics runtime.

---

### Task 1: Define and test the local assessment interpreter

**Files:**
- Create: `public/js/ai-governance-readiness.js`
- Create: `scripts/assessment-readiness.test.mjs`

- [ ] Write a failing Node test for `summarizeReadiness()` that supplies selected dimension states and expects a strength, a gap, and a next-control recommendation without a numeric score.
- [ ] Run `node --test scripts/assessment-readiness.test.mjs` and confirm it fails because the browser module does not yet exist.
- [ ] Implement a pure exported `summarizeReadiness(answers)` using only the eight visible dimension IDs and fixed, descriptive recommendation copy; do not persist answers or calculate a compliance score.
- [ ] Re-run the focused test and confirm it passes.

### Task 2: Replace the marketing preview with an accessible progressive-enhancement form

**Files:**
- Modify: `src/pages/assessment/ai-governance-readiness/index.astro`

- [ ] Replace unsupported claims, the disabled visual-only form, and fixed sample results with a truthful title/description, audience, what-you-receive copy, privacy note, and eight visible assessment dimensions.
- [ ] Use fieldsets, legends, labels, required radio inputs, an inline error summary, large previous/next controls, and a no-JS fallback that shows every group.
- [ ] Render a hidden completion region containing separate strengths, gaps, recommended next controls, and consultation/demo CTAs.
- [ ] Attach explicit `data-cta` metadata to the start and completion CTAs and load the same-origin module without adding dependencies or inline scripts.

### Task 3: Add interaction, analytics, and responsive form styling

**Files:**
- Modify: `public/js/ai-governance-readiness.js`
- Modify: `src/styles/pages.css`

- [ ] Enhance only when JavaScript is available: show one group at a time, update a textual and visual progress state, validate the active group, and focus its error/heading.
- [ ] Emit only allow-listed aggregate events: `assessment_start`, `assessment_step_progress`, `assessment_complete`, `assessment_abandon`, and CTA events. Event payloads may contain step/dimension identifiers only—never answer text, contact data, or identifiers.
- [ ] Add focused assessment styles for 44px controls, visible focus rings, mobile single-column inputs, reduced-motion behavior, and result grouping.

### Task 4: Verify source, build output, and interaction behavior

**Files:**
- Modify: `scripts/assessment-readiness.test.mjs`
- Modify: `.agents/mind/01-mind-latest.md`

- [ ] Extend the focused test with source assertions for crawlable dimensions, privacy boundary, and the absence of numeric readiness claims.
- [ ] Run the focused Node test, `pnpm build`, `pnpm seo:check`, `pnpm seo:hreflang`, and `git diff --check`; report existing unrelated failures separately.
- [ ] Add a dated top-of-file project ledger entry that records changed files, local evidence, and the production-verification boundary.

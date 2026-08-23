# Saudi AI Governance Control Matrix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a citation-worthy, Saudi-focused practical AI governance control matrix to the canonical `/hub/ai-governance/` page.

**Architecture:** Keep the page static and indexable. Add typed matrix data and a semantic table/card view inside `AiGovernancePillar.astro`; use CSS media queries for RTL desktop, mobile cards, and print output. Add one focused contract test that reads the source and built HTML without introducing a dependency.

**Tech Stack:** Astro, TypeScript in `.astro`, scoped CSS, Node `node:test`, existing BrightAI SEO/build scripts.

---

### Task 1: Establish the matrix contract with a failing test

**Files:**
- Create: `scripts/saudi-ai-governance-control-matrix.test.mjs`
- Reference: `src/components/hub/AiGovernancePillar.astro`

- [ ] **Step 1: Write the failing contract test**

  The test should read the component source and assert that the implementation exposes a named matrix with exactly 13 rows, the required field names (`objective`, `risk`, `control`, `owner`, `evidence`, `capability`, `reference`), the practical BrightAI disclaimer, at least one local capability link, and a visible section heading containing `Saudi AI Governance Control Matrix`.

- [ ] **Step 2: Run the contract test and confirm RED**

  Run:

  ```bash
  node --test scripts/saudi-ai-governance-control-matrix.test.mjs
  ```

  Expected: FAIL because the matrix data and section do not exist yet.

### Task 2: Add typed matrix content and semantic markup

**Files:**
- Modify: `src/components/hub/AiGovernancePillar.astro`

- [ ] **Step 1: Add the typed row shape and 13 practical control rows**

  Define a local `GovernanceControlRow` type and a `governanceControlMatrix` array. Keep row text concise, operational, and original. Use only existing internal capability paths. For regulatory/standard context, use source notes that distinguish official references from BrightAI implementation guidance; do not copy requirements text or promise compliance.

- [ ] **Step 2: Add the visible section after `#controls` and before `#roadmap`**

  Render a direct-answer paragraph, a small usage/disclaimer callout, and a `<table>` with `<caption>`, `<thead>`, `scope="col"`, and all required columns. Add a `data-label` attribute to each mobile cell so the CSS card layout stays understandable without horizontal scrolling.

- [ ] **Step 3: Add contextual internal links**

  Link the matrix section from the existing controls section and link capability names to existing BrightAI routes. Keep external references in the sources area or as clearly labeled reference notes with `target="_blank"` and `rel="noopener noreferrer"` when applicable.

- [ ] **Step 4: Run the focused contract test and confirm GREEN**

  Run:

  ```bash
  node --test scripts/saudi-ai-governance-control-matrix.test.mjs
  ```

  Expected: PASS with all matrix contract assertions green.

### Task 3: Style desktop, mobile, RTL, and print behavior

**Files:**
- Modify: `src/components/hub/AiGovernancePillar.astro`

- [ ] **Step 1: Add scoped matrix styles**

  Use existing BrightAI tokens and logical properties. Desktop uses a readable wide table with a restrained control-room header; mobile hides the desktop table presentation and renders each row as a labeled card; print removes decorative backgrounds and preserves headings, links, and repeated table headers.

- [ ] **Step 2: Add accessibility and focus treatment**

  Keep visible focus styles, sufficient contrast, semantic table markup, and comfortable tap targets for capability links. Ensure English identifiers and URLs do not break Arabic line flow.

- [ ] **Step 3: Run the focused test again**

  Run:

  ```bash
  node --test scripts/saudi-ai-governance-control-matrix.test.mjs
  ```

  Expected: PASS; CSS changes must not alter the semantic contract.

### Task 4: Build and verify SEO/indexability and responsive output

**Files:**
- Modify: `.agents/mind/01-mind-latest.md`

- [ ] **Step 1: Build the static site**

  Run:

  ```bash
  node_modules/.bin/astro build
  ```

  Expected: Complete, with only the already documented route-collision/Vite warnings if they recur.

- [ ] **Step 2: Run project SEO checks**

  Run:

  ```bash
  pnpm seo:check
  pnpm seo:hreflang
  ```

  Expected: the existing gates pass; if Corepack/network prevents `pnpm`, record that limitation and use the local Astro binary plus targeted HTML checks.

- [ ] **Step 3: Inspect the built governance page**

  Confirm `/hub/ai-governance/` has one H1, no `noindex`, self-canonical, visible matrix text without JavaScript, 13 matrix rows, and no accidental horizontal overflow in the 360px/1440px local browser check when available.

- [ ] **Step 4: Run diff hygiene checks**

  Run:

  ```bash
  git -c core.fsmonitor=false diff --check
  ```

  Expected: no whitespace errors.

- [ ] **Step 5: Add the newest ledger entry at the top of `01-mind-latest.md`**

  Record the changed files, the practical/non-official content boundary, build/SEO results, and any environment limitation. Do not modify `02-mind-mid.md`, `03-mind-earliest.md`, or `brain.md`.

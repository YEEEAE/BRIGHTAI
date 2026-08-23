# Indexation Architecture Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verify and enforce one canonical, indexable URL architecture for BrightAI without removing strategic public pages.

**Architecture:** Canonical URLs use HTTPS on `brightai.site` with a trailing slash for every route except `/`. Astro configuration, rendered HTML, redirect manifests, sitemap generation, and hreflang mapping remain the sources of truth. Changes are permitted only when fresh local evidence shows a real architectural defect.

**Tech Stack:** Astro static output, Node.js audit scripts, XML sitemap, Render redirects, HTML hreflang.

---

### Task 1: Establish a verified baseline

**Files:**
- Read: `astro.config.mjs`, `src/layouts/BaseLayout.astro`, `src/components/SEOHead.astro`
- Read: `redirects.json`, `render.yaml`, `public/robots.txt`, `public/sitemap.xml`
- Read: `src/data/hreflang-pairs.ts`, `scripts/generate-sitemap-all-pages.mjs`

- [ ] **Step 1: Run the canonical and redirect checks**

Run: `pnpm redirects:check && pnpm seo:check && pnpm seo:hreflang`

Expected: no redirect chains, loops, missing final destinations, canonical mismatches, or hreflang return-tag errors.

- [ ] **Step 2: Run the internal-link architecture audit in isolation**

Run: `node scripts/internal-linking-architecture.mjs --source dist/client --sitemap public/sitemap.xml --verbose`

Expected: `canonicalIssues: 0`, `orphanPages: 0`, and `pagesOutsideSitemap: 0`.

### Task 2: Repair only evidence-backed indexation defects

**Files:**
- Modify only if required: `astro.config.mjs`, `redirects.json`, `render.yaml`, `src/layouts/BaseLayout.astro`, `src/components/SEOHead.astro`, `src/data/hreflang-pairs.ts`, `scripts/generate-sitemap-all-pages.mjs`

- [ ] **Step 1: Add a focused regression test before any behavior change**

Use the existing Node test convention to assert the exact failing URL, canonical, redirect, sitemap, or hreflang contract.

- [ ] **Step 2: Confirm the new test fails for the intended defect**

Run the focused test command and confirm the failure is the missing contract, not a test setup error.

- [ ] **Step 3: Apply the smallest source-level repair**

Keep all strategic public pages indexable. Never add `Disallow`; do not add `noindex` unless the route is already a true utility/confirmation/error page.

- [ ] **Step 4: Re-run the focused test**

Expected: the new regression test passes.

### Task 3: Regenerate and verify the final surface

**Files:**
- Generated/verified: `public/sitemap.xml`, `dist/client/sitemap.xml`, `reports/sitemap-quality-report.md`
- Create: `audit/report/2026-08-23-indexation-architecture-cleanup.md`
- Modify: `.agents/mind/01-mind-latest.md`

- [ ] **Step 1: Regenerate the sitemap from the rendered canonical HTML**

Run: `pnpm sitemap:generate`

Expected: a non-empty sitemap containing only canonical, indexable, HTTPS URLs.

- [ ] **Step 2: Re-run post-change checks serially**

Run: `pnpm redirects:check && pnpm seo:check && pnpm seo:hreflang && pnpm internal-links:audit`

Expected: no redirect chains or loops; all sitemap URLs canonical; no sitemap noindex pages; no orphan routes.

- [ ] **Step 3: Record the before/after evidence**

Document verified counts, all source changes, and any non-indexation findings that remain intentionally out of scope.

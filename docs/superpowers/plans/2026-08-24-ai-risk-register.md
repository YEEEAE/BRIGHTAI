# AI Risk Register Template Implementation Plan

> For agentic workers: This plan is being executed inline in the current session. No commit or push will be performed.

Goal: Build an indexable Saudi-Arabic AI risk register template with semantic table, mobile cards, badges, internal links, and print styles.

Architecture: Add one standalone Astro page at /tools/ai-risk-register/ using the existing ArabicLayout. Keep all sample data server-rendered in the page and use scoped CSS for responsive table-to-card behavior and print output.

Tech Stack: Astro, TypeScript-in-Astro frontmatter, existing BrightAI CSS tokens, Node node:test contract test.

---

### Task 1: Add the failing page contract test

Files:
- Create: scripts/ai-risk-register.test.mjs

- [ ] Write a test that reads src/pages/tools/ai-risk-register/index.astro and asserts the page contains the 15 requested labels, the two internal links, a generic/BrightAI scoring disclaimer, a semantic table with caption, thead, and tbody, mobile-card data labels, print CSS, and exactly one h1.
- [ ] Run node --test scripts/ai-risk-register.test.mjs and verify it fails because the page does not exist.

### Task 2: Build the server-rendered page

Files:
- Create: src/pages/tools/ai-risk-register/index.astro

- [ ] Add ArabicLayout metadata with self-canonical /tools/ai-risk-register/, Arabic hreflang, breadcrumbs, and WebPage JSON-LD.
- [ ] Add a direct-answer hero and Saudi colloquial instructions explaining: create one row per use case, name the accountable owner, score likelihood and impact consistently, record evidence, and review after changes/incidents or on a defined cadence.
- [ ] Mark the matrix as “قالب تنفيذ من BrightAI” and explicitly state it is not an official SDAIA score or regulatory classification.
- [ ] Add links to /solutions/ai-risk-classification/ and /assessment/ai-governance-readiness/.
- [ ] Render two sample rows covering customer-service chatbot and HR CV screening, with all 15 fields represented.
- [ ] Use table headers and scope="col"; add data-label attributes to cells for mobile fallback.
- [ ] Add visual badges for likelihood, impact, risk level, and status with text labels that do not rely on color alone.
- [ ] Add scoped responsive CSS that turns each row into a card below the mobile breakpoint and print CSS that hides nonessential controls, preserves headers, and avoids row splitting.

### Task 3: Verify the implementation

Files:
- Modify: .agents/mind/01-mind-latest.md

- [ ] Run node --test scripts/ai-risk-register.test.mjs and confirm PASS.
- [ ] Run node_modules/.bin/astro build and confirm the route is emitted.
- [ ] Inspect built HTML for one H1, no noindex, the field labels, and both internal links.
- [ ] Run git diff --check.
- [ ] If the local browser harness is available, smoke-check 360px and 1440px for no horizontal overflow and a visible mobile-card fallback; otherwise report the skipped check honestly.
- [ ] Add a dated ledger entry at the top of 01-mind-latest.md; do not edit archived brain files and do not commit or push.

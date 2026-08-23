# AI Governance Platform Page Implementation Plan

> **For agentic workers:** This plan is executed inline in the current workspace; no commit or push is part of the task.

**Goal:** Reposition `/solutions/ai-governance-platform/` as BrightAI’s primary commercial AI governance page for Saudi enterprise buyers.

**Architecture:** Keep the existing shared `src/pages/solutions/[slug].astro` route and add a dedicated render branch for `ai-governance-platform`. Update only that solution’s metadata/content, use a service schema with visible FAQ data, and scope the premium visual system to a page class so other solution pages retain their current behavior.

**Tech Stack:** Astro, TypeScript data objects, existing ArabicLayout/Schema pipeline, scoped CSS, native CSS/SVG visuals, existing internal links.

---

### Task 1: Replace governance positioning and unsupported copy

**Files:**
- Modify: `src/data/solutions.ts` in the `ai-governance-platform` record.
- Modify: `src/pages/solutions/[slug].astro` governance mockup/flow data.

- [ ] Make the title, H1, description, lead, FAQs, and final CTA answer the operational governance intent in natural Saudi Arabic.
- [ ] Remove legal-certainty language and unsupported claims of official approval, guaranteed compliance, fixed timelines, or data residency.
- [ ] Keep PDPL, NCA ECC, SDAIA, and ISO/IEC 42001 references framed as alignment/readiness context, not certification or legal advice.

### Task 2: Add the dedicated commercial page structure

**Files:**
- Modify: `src/pages/solutions/[slug].astro`.

- [ ] Render a custom governance hero with one value proposition, primary readiness/demo CTA, secondary learning CTA, and a lightweight governance console visual.
- [ ] Add direct-answer blocks, the Regulation → Risk → Control → Enforcement → Evidence flow, problem cards, control cards, personas, sectors, and evidence outcomes.
- [ ] Add visible internal links to AI Firewall, AI Risk Classification, Human Approval Layer, AI Audit Trail, Evidence File, and Readiness Assessment.
- [ ] Keep the existing shared footer/related content and visible FAQ path available for the dedicated page.

### Task 3: Style the page for enterprise RTL and mobile hierarchy

**Files:**
- Modify: `src/pages/solutions/[slug].astro` scoped style block.

- [ ] Use a dark graphite/teal control-room direction with one accent, no heavy animation, and no new dependency or asset.
- [ ] Use logical CSS properties, mobile-first breakpoints, visible focus states, and 44px minimum CTA/link targets.
- [ ] Ensure the governance flow and console visual remain readable at 360px and 1440px.

### Task 4: Verify SEO, build, and visual contracts

**Files:**
- Modify: `.agents/mind/01-mind-latest.md` with the completed ledger entry.

- [ ] Run targeted source checks for canonical/H1/visible FAQ/schema/internal links.
- [ ] Run the project build and applicable SEO checks; record existing unrelated blockers separately.
- [ ] Run `git diff --check` and inspect the final diff; do not commit or push.

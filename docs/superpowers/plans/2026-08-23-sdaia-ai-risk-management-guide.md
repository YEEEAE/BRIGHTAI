# SDAIA AI Risk Management Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an authoritative Arabic-first guide at `/hub/sdaia-ai-risk-management/` that accurately presents SDAIA's National AI Risk Management Framework and separately explains BrightAI's operational support.

**Architecture:** Add a static hub-path record and a dedicated Astro component, preserving the current dynamic hub route and its metadata, canonical, breadcrumb, and related-post pattern. The component contains all educational content, native process/matrix visuals, tables, checklist, citations, and product links in server-rendered HTML with scoped logical CSS; no dependency or client JavaScript is added.

**Tech Stack:** Astro, TypeScript, semantic HTML, scoped CSS, Node test runner, existing BrightAI SEO and internal-link checks.

---

### Task 1: Add the guide contract test

**Files:**
- Create: `scripts/sdaia-ai-risk-management-guide.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('SDAIA guide route and component expose the regulatory-content contract', async () => {
  const [route, component] = await Promise.all([
    readFile(new URL('../src/pages/hub/[slug].astro', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/hub/SdaiaAiRiskManagementGuide.astro', import.meta.url), 'utf8'),
  ]);

  assert.match(route, /slug: 'sdaia-ai-risk-management'/);
  assert.match(route, /SdaiaAiRiskManagementGuide/);
  for (const text of [
    'SDAIA-P145', 'الإصدار 1.0', 'أبريل 2026',
    'تحديد السياق والنطاق', 'تحديد المخاطر وتقييمها', 'معالجة المخاطر', 'المتابعة والمراجعة',
    'inventory', 'classify', 'assess', 'assign owner', 'control', 'approve', 'monitor', 'evidence',
    '/solutions/ai-risk-classification/', '/solutions/human-approval-layer/',
    '/solutions/ai-audit-trail/', '/solutions/ai-evidence-file/',
    '/solutions/ai-governance-platform/', '/assessment/ai-governance-readiness/',
  ]) assert.match(component, new RegExp(text.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')));
  assert.doesNotMatch(component, /endorsed by SDAIA|معتمد من سدايا|ضمان امتثال/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test scripts/sdaia-ai-risk-management-guide.test.mjs`  
Expected: failure because `SdaiaAiRiskManagementGuide.astro` and its route record do not exist.

### Task 2: Register the static route and render boundary

**Files:**
- Modify: `src/pages/hub/[slug].astro`

- [ ] **Step 1: Add a `sdaia-ai-risk-management` page record** with title, description, tag, and category link that match the guide's Arabic search intent.
- [ ] **Step 2: Import the component** using `import SdaiaAiRiskManagementGuide from '../../components/hub/SdaiaAiRiskManagementGuide.astro';`.
- [ ] **Step 3: Add one render branch** so only the new slug renders `SdaiaAiRiskManagementGuide`, preserving the existing `AiGovernancePillar` branch and generic fallback.

### Task 3: Create the static regulatory guide component

**Files:**
- Create: `src/components/hub/SdaiaAiRiskManagementGuide.astro`

- [ ] **Step 1: Render a semantic, Arabic-first hero** containing the official framework name, `SDAIA-P145`, `الإصدار 1.0`, `أبريل 2026`, a concise answer, and a non-legal/non-endorsement boundary.
- [ ] **Step 2: Implement the responsive navigation and official-framework sections** using desktop sticky `aside`, a mobile `details` navigation, the four official phases, and a caveated 4×4 likelihood-impact matrix. Use only neutral labels in the matrix and cite the source panel.
- [ ] **Step 3: Add the BrightAI-labelled operating workflow** with the eight requested English operational tokens, an enterprise decision table, and a checklist. Each section must explicitly distinguish operational implementation guidance from the regulation.
- [ ] **Step 4: Add the separate BrightAI help section** with descriptive anchors to all six required internal routes and no regulator endorsement or automatic-compliance claims.
- [ ] **Step 5: Add a primary-source citation panel** linking to SDAIA's publication page, the official executive-summary PDF URL, and SPA's announcement using `target="_blank" rel="noopener noreferrer"`.
- [ ] **Step 6: Add scoped CSS** for an accessible Saudi-regulatory editorial visual system, keyboard-visible navigation, logical RTL spacing, responsive tables, 360px single-column behaviour, and 1440px sticky TOC behaviour. Do not add assets, inline scripts, or a dependency.

### Task 4: Verify GREEN and route output

**Files:**
- Modify: `scripts/sdaia-ai-risk-management-guide.test.mjs`

- [ ] **Step 1: Run the focused guide test**

Run: `node --test scripts/sdaia-ai-risk-management-guide.test.mjs`  
Expected: PASS with one test and zero failures.

- [ ] **Step 2: Build the site**

Run: `pnpm build`  
Expected: Astro emits `dist/client/hub/sdaia-ai-risk-management/index.html` with the known unrelated route-collision warnings only.

- [ ] **Step 3: Validate built page contract and links**

Run:

```bash
node --test scripts/sdaia-ai-risk-management-guide.test.mjs
pnpm seo:check
pnpm seo:hreflang
pnpm internal-links:audit
git diff --check
```

Expected: focused content contract passes; report any unrelated project-wide validator failure without masking it.

### Task 5: Perform visual and source verification, then record project state

**Files:**
- Modify: `.agents/mind/01-mind-latest.md`

- [ ] **Step 1: Inspect the built route at 360px and 1440px** through the project's existing local browser harness, checking one H1, no horizontal document overflow, keyboard-visible TOC links, readable matrix/table fallbacks, and all required product links.
- [ ] **Step 2: Recheck official source metadata** against SDAIA's publication entry and the official SPA launch release; record that SDAIA's direct PDF is WAF-blocked in automated fetches if this remains true.
- [ ] **Step 3: Add a dated top-of-file ledger entry** describing the route, component, primary sources, verification evidence, and production-verification boundary. Do not edit archive mind files.

## Self-review

- Spec coverage: Tasks 2–3 implement every visual/content requirement; Task 4 covers static build, SEO and link integrity; Task 5 covers responsive a11y checks, source freshness, and the mandatory project ledger.
- Placeholder scan: No deferred behavior, unspecified files, or generic test steps remain.
- Type consistency: the route uses the exact `sdaia-ai-risk-management` slug and component/test paths asserted in Task 1.
- Project instruction adjustment: do not commit any plan, code, or documentation; the workspace policy requires the user to do commits.

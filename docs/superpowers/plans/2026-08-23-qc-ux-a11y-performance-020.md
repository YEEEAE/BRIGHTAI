# QC UX A11y Performance Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the QC laboratory workspace interaction hierarchy, role-focused landing content, controlled-document and change-request clarity, responsive behavior, and accessibility without changing authorization or domain transition rules.

**Architecture:** Keep server-rendered Astro pages as the source of truth and reuse `permissions.ts`, existing read-only laboratory overview queries, existing workflow handlers, and existing URL filters. Consolidate presentation-only status/action primitives in shared Astro components and add focused static/domain/browser checks; do not add speculative database indexes or a UI framework.

**Tech Stack:** Astro 6, React 19 islands, Tailwind CSS, TypeScript, SQLite/better-sqlite3, existing Playwright/axe scripts.

---

### Task 1: Add shared presentation primitives and characterization checks

**Files:**
- Create: `apps/qc-task-manager/src/components/lab/LabDocumentStatusBadge.astro`
- Create: `apps/qc-task-manager/src/components/lab/LabActionButton.astro`
- Create: `apps/qc-task-manager/src/components/lab/LabResponsiveTable.astro`
- Modify: `apps/qc-task-manager/src/pages/lab/documents/index.astro`
- Modify: `apps/qc-task-manager/src/pages/lab/documents/[id].astro`
- Modify: `apps/qc-task-manager/src/pages/lab/documents/[id]/versions.astro`
- Test: `apps/qc-task-manager/scripts/test-lab-ux-presentation.mjs`

- [ ] Write checks that require the five document states, consistent labels, distinct class tokens, focus-visible styles, and a mobile fallback marker in the affected pages.
- [ ] Run `node scripts/test-lab-ux-presentation.mjs` and confirm the new checks fail before presentation code changes.
- [ ] Implement the shared badge/action/table presentation primitives without changing any permission or POST handler.
- [ ] Replace duplicated document status markup and normalize Primary/Secondary/Destructive action classes with 44px minimum block-size.
- [ ] Run the focused check and existing badge contrast check.

### Task 2: Make `/lab` role-focused with existing permission and query authority

**Files:**
- Modify: `apps/qc-task-manager/src/lib/lab/overview.ts`
- Modify: `apps/qc-task-manager/src/pages/lab/index.astro`
- Modify: `apps/qc-task-manager/scripts/test-lab-overview.mjs`
- Modify: `apps/qc-task-manager/scripts/e2e-a11y.mjs`

- [ ] Add read-only, scoped overview rows for returned tests and requester-owned WI content using the already indexed test/document ownership fields; do not change lifecycle semantics.
- [ ] Add unit-style assertions for employee, supervisor, manager, and admin section visibility and scope.
- [ ] Run the focused overview test and confirm the new assertions fail before the page is changed.
- [ ] Render role-specific priority sections: employee work, supervisor review/risk queues, and manager/admin governance/data-quality queues, with Quick New Test as the employee primary action.
- [ ] Give each empty state an explicit reason (`No data`, `No permission`, `Pending review`, `Missing content`, or `Filter returned no results`) and keep system failures as alerts.
- [ ] Add mobile cards/list fallback for major tables while retaining a scrollable table for long sample-like registers.
- [ ] Add keyboard/focus/console-error checks for the role home at 360/768/1440 widths.

### Task 3: Clarify Change Request review UX without inventing domain semantics

**Files:**
- Modify: `apps/qc-task-manager/src/lib/lab/changeRequests.ts`
- Modify: `apps/qc-task-manager/src/pages/lab/change-requests/index.astro`
- Modify: `apps/qc-task-manager/src/pages/lab/change-requests/[id].astro`
- Modify: `apps/qc-task-manager/src/pages/lab/change-requests/new.astro`
- Modify: `apps/qc-task-manager/scripts/test-lab-change-requests.mjs`

- [ ] Add presentation-level audit correlation from the existing `qc_audit_log` rows and expose canonical target/conflict/changed-fields data already derived by `getChangeRequestPresentation`.
- [ ] Make requester, timestamp, before, after, changed fields, conflict state, canonical target, review reason, and audit correlation visible in both desktop and mobile layouts.
- [ ] Add resubmission affordance for rejected requests by reusing the existing proposal form with a safe prefill; preserve server-side validation and authorization.
- [ ] Do not map Withdraw Request to `REJECTED`; if the current schema cannot represent withdrawal distinctly, expose the gap in the report instead of silently changing audit meaning.
- [ ] Add accessible form grouping, required review-note guidance, error focus, and 44px actions.

### Task 4: Verify performance and interaction regressions

**Files:**
- Create: `apps/qc-task-manager/scripts/test-lab-ux-performance.mjs`
- Modify: `apps/qc-task-manager/package.json`
- Modify: `apps/qc-task-manager/scripts/e2e-a11y.mjs`
- Modify: `apps/qc-task-manager/src/styles/global.css`

- [ ] Add deterministic static checks for React island count on the role home, no inline CSP relaxation, reduced-motion rules, table overflow/fallback markers, and no `transition: all`.
- [ ] Add a read-only query instrumentation path for the existing overview functions and assert query counts remain bounded per page load; do not add indexes without evidence.
- [ ] Add keyboard E2E assertions for skip link, focus order, first-error focus, dialog semantics, and no console errors across representative pages.
- [ ] Run the focused performance/accessibility checks and record baseline query counts and timings before claiming an optimization.

### Task 5: Full local verification and handoff

**Files:**
- Modify: `.agents/mind/01-mind-latest.md`

- [ ] Run focused domain tests, `pnpm typecheck`, `NODE_ENV=production pnpm build`, `pnpm test:architecture`, `pnpm test:badge-contrast`, and `git diff --check` from `apps/qc-task-manager`.
- [ ] Run the relevant browser suites at 360px, 768px, and 1440px where the local server permits; distinguish local verification from production verification.
- [ ] Review the diff for business-rule, permission, migration, CSP, and secret changes.
- [ ] Add a dated ledger entry at the top of `01-mind-latest.md` with exact verification results and blockers.
- [ ] Report changed files, evidence, remaining gaps, and the fact that commit/push/deploy remain with the user.

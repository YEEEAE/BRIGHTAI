# QC Route and Reporting Source Truth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the QC reporting route inventory and tests derive from the current Astro source tree, with explicit middleware-route documentation and complete report transport coverage.

**Architecture:** Keep the existing canonical reporting endpoint and reporting services unchanged unless tests expose a defect. Add a Node-only route manifest that normalizes file routes from `src/pages`, records middleware short-circuits separately, and validates required UI references against the manifest. Make the architecture test invoke that validator and make the reporting E2E matrix cover all catalog types, supported formats, roles, invalid inputs, transport metadata, bodies, and audit rows.

**Tech Stack:** Astro 6 SSR pages/endpoints, Node.js `node:test`-style scripts, Playwright request contexts, existing `src/lib/reporting` catalog/authorization/filter/writer/audit services.

---

### Task 1: Establish source-truth route manifest and architecture guard

**Files:**
- Create: `apps/qc-task-manager/scripts/route-manifest.mjs`
- Modify: `apps/qc-task-manager/scripts/architecture-guard.mjs`
- Modify: `apps/qc-task-manager/package.json`
- Test: `apps/qc-task-manager/scripts/route-manifest.mjs --check`

- [ ] Write the manifest normalization and required-route/UI-reference assertions first.
- [ ] Run `node scripts/route-manifest.mjs --check` and confirm it fails before the validator exists.
- [ ] Implement file-route discovery, separate documented middleware routes, and report route assertions.
- [ ] Run the checker and architecture test until both pass.

### Task 2: Expand reporting E2E coverage from the live catalog

**Files:**
- Modify: `apps/qc-task-manager/scripts/e2e-reports.mjs`

- [ ] Replace stale hard-coded report lists with the current 24-type catalog source or an exact source-derived list.
- [ ] Add the required anonymous, employee, supervisor, manager, and admin transport matrix for supported formats and the audit route.
- [ ] Assert invalid report, invalid format, unsupported filters, content type, filename, non-empty body, and audit rows.
- [ ] Ensure every created browser/context is closed in a final cleanup path.

### Task 3: Verify build, route inventory, unit suites, and reproducible E2E

**Files:**
- Modify: `.agents/mind/01-mind-latest.md`

- [ ] Record `git status --porcelain` and `git rev-parse HEAD` immediately before E2E.
- [ ] Run route-manifest, architecture, focused reporting tests, typecheck, production build, and E2E against that exact worktree.
- [ ] Treat untracked source files or any failed/blocked command as non-reproducible or unverified.
- [ ] Add the task ledger entry at the top of `01-mind-latest.md` with exact evidence and blockers.

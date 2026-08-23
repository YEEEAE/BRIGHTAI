# QC Test Completeness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the QC unit-test aggregate mechanically complete and make every acceptance child bounded, observable, and cleaned up.

**Architecture:** Store the canonical `test:*` suite names in one manifest module. A manifest guard reads `package.json` and fails when a non-meta test script is absent; the aggregate runner executes that manifest without recursively invoking `test`. The acceptance runner will run each child with a timeout, captured output, exit status, and process cleanup.

**Tech Stack:** Node.js ESM, pnpm scripts, Playwright, better-sqlite3, Astro standalone server.

---

### Task 1: Canonical unit-test manifest and guard

**Files:**
- Create: `apps/qc-task-manager/scripts/test-manifest.mjs`
- Create: `apps/qc-task-manager/scripts/test-manifest-guard.mjs`
- Create: `apps/qc-task-manager/scripts/run-full-tests.mjs`
- Modify: `apps/qc-task-manager/package.json`

- [ ] Define one explicit ordered list of canonical suite names, excluding only `test`, `test:manifest`, and `test:architecture` meta aliases.
- [ ] Make the guard compare package `test:*` keys against the explicit manifest and reject duplicate/missing entries without invoking `test`.
- [ ] Make the runner execute each manifest entry through `pnpm run`, preserving the first non-zero exit code.
- [ ] Add the guard to the aggregate before suites run and include `test:lab-print` and `test:lab-retention`.

### Task 2: E2E lifecycle and acceptance-runner bounds

**Files:**
- Modify: `apps/qc-task-manager/scripts/e2e-task-search.mjs`
- Modify: `apps/qc-task-manager/scripts/e2e-acceptance.mjs`
- Modify any Playwright suite whose browser/database cleanup is not in `finally`.

- [ ] Close all pages, contexts, browsers, and opened databases in `finally` blocks.
- [ ] Capture child stdout/stderr and exit code, enforce a finite timeout, label timed-out suites `TIMEOUT`, and kill child/server processes during cleanup.
- [ ] Print HEAD SHA, dirty/untracked status, Node, pnpm, and each isolated DB path before acceptance execution.

### Task 3: Verification and project ledger

**Files:**
- Modify: `.agents/mind/01-mind-latest.md`

- [ ] Run `pnpm test`, `pnpm typecheck`, `pnpm build`, and `pnpm e2e:acceptance`.
- [ ] Report suite names, assertions, duration, timeout, and failures from fresh command output; do not call E2E green unless the parent exits zero.

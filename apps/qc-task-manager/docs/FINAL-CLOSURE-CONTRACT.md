# FINAL CLOSURE CONTRACT — QC Task Manager

**Task:** QC-FINAL-CLOSURE-BASELINE (first task of the final closure program)
**Date:** 2026-09-04 · **Author role:** closure-program baseline (documentation only — no product code changed by this task)
**Repository:** YEEEAE/BRIGHTAI · **Application:** `apps/qc-task-manager/`
**Companion file:** [`FINAL-100-DOMAIN-COVERAGE.md`](./FINAL-100-DOMAIN-COVERAGE.md)

> This contract is the **binding source of truth** for every remaining closure task.
> Where any prior report, percentage, PASS claim, implementation summary, or the project mind
> conflicts with CURRENT SOURCE + CURRENT DB + CURRENT RUNTIME evidence, the current evidence wins.

---

## 1. Frozen Baseline (authoritative as of this task)

Frozen read-only at task start. These values were re-derived fresh in this session (marked ✱) or
frozen from the working tree exactly as found. The uncommitted working tree is **authoritative**
and must never be discarded, reset, or checked out over.

| Item | Frozen value |
|---|---|
| HEAD | `394be485cc2c32301cb4b5dea866520fe18e5a61` (branch `main`, `update site`) |
| Working tree (tracked) | 1 modified file: `.agents/mind/01-mind-latest.md` (+54 lines — two task records 016/015 from 2026-09-04) |
| Working tree (untracked) | `apps/qc-task-manager/14-OPERATIONAL-100-EVIDENCE.md`; `audit/qc/QC-Task-Manager/ULTIMATE-AUDIT-2026-09-02/15-FINAL-100-PERCENT-SYSTEM-REPORT.md`; `audit/qc/QC-Task-Manager/prompt11.md` |
| Product code delta | **Zero** — no file under `apps/qc-task-manager/src/**`, `db/**`, or `scripts/**` is modified vs HEAD |
| Node / pnpm | Node `v22.22.3` (satisfies engines ≥20) · pnpm `10.19.0` |
| Route manifest (fresh ✱) | **115 file routes · 25 middleware routes · 6 guards — PASS** |
| Test manifest (fresh ✱) | **87 canonical unit/integration suites · 28 canonical E2E suites · 3 classified non-runnable · 4 classified E2E — PASS (orphan-free)** |
| Migrations | 40 (`001_initial.sql` … `040_dashboard_created_at_index.sql`); parity 40/40 sha256 (per QC-FINAL-100-016 re-run 2026-09-04) |
| Schema objects | 166 (per QC-FINAL-100-016 re-run 2026-09-04) |
| `astro check` (per 016) | 0 errors / 0 warnings / 2 hints (dead vars, P3) |
| Full unit aggregate (per 016) | 87/87 exit 0 — but **acceptance gate is RED** (see §3) |
| Skills | 366 skill directories under `.agents/skills/` · `skills-lock.json` lists 365 |
| Last independent verdict | **NO-GO** — strict overall 76% (34-domain scoreboard, `15-FINAL-100-PERCENT-SYSTEM-REPORT.md`) |

**Re-freeze rule for every subsequent closure task:** record HEAD, `git status --short`,
`git diff --stat`, and re-run the cheap read-only gates (route-manifest, test-manifest-guard) before
touching anything. If HEAD moved since the last task's freeze, re-verify the drift before continuing.

---

## 2. Trust Rules (what may be cited as evidence)

1. **Authoritative:** current source code, current database schema/migrations, current runtime output
   produced fresh in the verifying session.
2. **Not evidence:** old reports, old percentages, old PASS claims, old implementation summaries,
   the project mind (`.agents/mind/*`) — these are *history/navigation aids*, never proof.
3. **Stale by default:** any test result not re-run in the current session at the current HEAD is
   stale. The 2026-09-01 "30/30 acceptance" claim is **explicitly stale** (superseded by the
   2026-09-04 crash at `e2e-task-search`).
4. **No borrowing across sessions:** a green suite yesterday does not certify today's tree.
5. **No invented values:** scientific, test, regulatory, or coverage numbers must never be invented.
   Missing controlled WI pages (2/3, 3/3) stay missing until a real source supplies them.

---

## 3. Known Blockers Inherited at Baseline (do NOT re-litigate — verify, then fix)

From the fresh 2026-09-04 independent verification (QC-FINAL-100-016), the release gate is RED:

- **P0-1 — stale E2E assertion:** `scripts/e2e-task-search.mjs:298` expects literal
  `13 tasks found`; product renders `Showing {start} to {end} of {total} results`
  (`src/pages/search.astro:299`). String exists nowhere in `src/`.
- **P0-2 — `per=10` contract broken:** `scripts/e2e-task-search.mjs:357-361` requires
  `?per=10` → 10 rows + `Page 1 of 2` + `Next`; canonical `parsePageSize`
  (`src/lib/pagination.ts`) accepts only `[25,50,100]`, so `per=10` falls back to 25,
  `Pagination` renders no `Next` (totalPages ≤ 1) → 3 failures + 30s timeout aborts the runner.
  Root cause: ARCHITECTURE-002 pagination unification narrowed page sizes without updating the
  canonical E2E suite. **Fix requires a product decision** (re-admit 10 for search registers, or
  rewrite scenario D at 25 with larger fixtures + update the summary/footer wording assertions).
- **Consequence:** ~19 E2E suites + 2 restart-persistence stages never executed at this HEAD.
- **Human/external evidence: zero** — UAT (26 scenarios), NVDA/VoiceOver, staging deploy, live
  restore drill, rotation receipts, production telemetry — all open (see
  `14-OPERATIONAL-100-EVIDENCE.md` worksheets).

The first closure task after this baseline should be P0-1/P0-2 under `superpowers:systematic-debugging`
(root cause is already documented; confirm it against current source before fixing — no symptom edits),
then a full `e2e:acceptance` to 28/28 + persistence green.

---

## 4. Project Invariants (absolute — every closure task must uphold)

| # | Invariant |
|---|---|
| 1 | Astro SSR remains (never static deploy; `@astrojs/node` standalone) |
| 2 | SQLite remains (WAL, `better-sqlite3`) |
| 3 | Single writable instance remains (in-process scheduler + in-memory rate limits forbid replicas) |
| 4 | `src/lib/permissions.ts` remains THE authorization authority — no duplicated authorization rules anywhere |
| 5 | `qc_audit_log` remains THE canonical QC/Lab audit trail — no second audit system |
| 6 | One notifications table |
| 7 | Approved/void/final controlled records remain immutable (DB triggers + app policy) |
| 8 | Immutable approval snapshots preserved (sealed e-signatures, sha256, tamper detection) |
| 9 | Self-review/self-approval prevented per current policy (Segregation of Duties) |
| 10 | Sequential migrations only; never modify an already-applied migration to make a test green |
| 11 | All unsafe writes require canonical request security/CSRF (`withRequestSecurity` / api-security) |
| 12 | CSP never weakened; no `unsafe-inline` / `unsafe-eval` |
| 13 | Never invent scientific/test/regulatory values; never invent missing controlled WI pages |
| 14 | UI remains English; final communication to the user in Saudi Arabic |
| 15 | No heavy UI framework; no PostgreSQL/Redis/microservices without a verified requirement |
| 16 | No `git push`, no `git commit` (user commits), no deploy — working tree handoff only |
| 17 | Never discard/reset/checkout over the uncommitted working tree |

---

## 5. Verification Gates (what every closure task must run before claiming PASS)

Per `superpowers:verification-before-completion` — evidence before claims, always. A closure task
claims PASS for a domain only with fresh output at the current HEAD:

**Cheap (every task, read-only or near-read-only):**
```bash
node scripts/route-manifest.mjs --check        # 115/25/6
node scripts/test-manifest-guard.mjs           # 87 unit + 28 E2E, orphan-free
pnpm --filter @brightai/qc-task-manager typecheck   # expect 0 errors (2 known P3 hints allowed until cleared)
```

**Standard (any task touching app code, tests, or DB shape):**
```bash
pnpm --filter @brightai/qc-task-manager build        # NODE_ENV=production
pnpm --filter @brightai/qc-task-manager test         # 87/87 canonical suites
node scripts/architecture-guard.mjs                 # via test:architecture
node scripts/verify-security-hygiene.mjs
```

**Acceptance (before any domain whose denominator includes live browser behavior):**
```bash
pnpm --filter @brightai/qc-task-manager e2e:acceptance   # 28/28 suites + 2 persistence stages, 0 failures, 0 timeouts
```

**Domain-specific:** the canonical suite(s) named in the coverage file's row for that domain,
fresh at the current HEAD.

**Human/external rows:** closed ONLY by real signed human/operator evidence recorded in
`14-OPERATIONAL-100-EVIDENCE.md` — automated E2E is never UAT/AT evidence.

---

## 6. Domain Status Vocabulary (enforced in the coverage file)

Each of the 100 domains carries exactly one status. No domain starts at PASS. Transitions are
one-directional and each requires fresh evidence:

| Status | Meaning |
|---|---|
| `UNVERIFIED` | No fresh evidence gathered for this domain in the closure program yet (default) |
| `SOURCE_VERIFIED` | Source-level inspection done fresh (code/schema/manifests read and confirmed at current HEAD) |
| `TEST_VERIFIED` | Named canonical suite(s) re-run green at current HEAD |
| `RUNTIME_VERIFIED` | Verified against a running production build (E2E, health/readiness, server behavior) |
| `HUMAN_VALIDATION_REQUIRED` | Automation maxed; the remaining denominator is human/operator evidence (UAT, AT, staging, rotation, live restore) |
| `BLOCKED` | Cannot proceed until an upstream blocker clears (e.g., P0-1/P0-2 blocks the E2E-dependent rows) |

A domain reaches 100% **only** when every denominator item in its row is freshly proven at the
current HEAD — including, where the row says so, the human/external evidence.

---

## 7. Skills Protocol (per project rule 9 + Superpowers process rigor)

- 366 skills are available under `.agents/skills/`; `skills-lock.json` (365) tracks their
  installed set. Before each closure task, consult the coverage file's `Skills` column and READ
  the named `SKILL.md` files completely before implementation.
- **Process skills are mandatory at their trigger points:**
  - `superpowers:systematic-debugging` — before proposing any fix for a defect (four phases;
    root cause before fix; the P0s already carry documented root causes — verify, don't re-derive).
  - `superpowers:test-driven-development` — every fix/feature: failing test first, watch it fail,
    minimal code to pass, no test edits to force green.
  - `superpowers:verification-before-completion` — before ANY PASS/complete claim: run the proving
    command fresh, read full output, count failures; "should/probably/seems" are prohibited.
  - `superpowers:requesting-code-review` / `receiving-code-review` — after major features or before
    declaring a domain RUNTIME_VERIFIED.
- Domain skills: the coverage file names the applicable repository skills per domain (SEO/a11y
  skills of the main site do not apply to the QC app; QC-relevant skills are the process, forms,
  a11y, design-system, dashboard, and architecture families listed per row).

---

## 8. Working Rules for the Closure Program

1. **One domain cluster per task** — do not mix unrelated repairs into one task (this baseline
   task repairs nothing).
2. **Scope discipline:** a closure task must not repair unrelated findings it discovers; log them
   in the coverage file's `Current gap` column and continue.
3. **Every task ends with:** fresh gate evidence + updated coverage-file row(s) + a new record at
   the top of `.agents/mind/01-mind-latest.md` (summary bullets, files, verification, outcome,
   decisions) per project rule 3.
4. **No commit / no push / no deploy** — the user reviews and commits.
5. **Honesty over progress:** a domain that cannot reach 100% stays at its true status with the
   gap named. Cosmetic completion is a contract violation.

---

## 9. Entry Conditions for the Next Closure Task

The closure program **may continue safely** from this baseline (see assessment in the final reply):
the tree is intact, product code is untouched, and the blockers are precisely characterized. The
next task should be:

1. **CLOSURE-01 (P0 repair):** confirm P0-1/P0-2 against current source (systematic-debugging
   Phase 1), take the page-size product decision, apply TDD (red → green), re-run
   `e2e:acceptance` to 28/28 + persistence green, then update coverage rows for every
   E2E-dependent domain.
2. Then the human/operator wave per `14-OPERATIONAL-100-EVIDENCE.md` (staging → UAT → AT →
   restore drill → rotation → telemetry), closing only what real evidence closes.

---

*End of contract. This file is versioned documentation; update it only with a new dated record in
the project mind — never silently.*

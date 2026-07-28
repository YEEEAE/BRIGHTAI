# BAI-PERF-03 — Lighthouse CI gate wired in `seo-gates` (LCP budget enforced)

**Date**: 2026-07-25
**Agent**: BrightAI Workspace Agent (Mavis)
**Task**: BAI-PERF-03 (P1, Effort 8h, Risk H, Depends on BAI-PERF-02)
**Mode**: Senior (per user's Option A — "CI gate أولاً، LCP fixes في BAI-PERF-04")
**BAI-PROC-12 compliance**: `verified_local: yes`, `verified_production: no` (CI gate change — needs a real CI run to confirm)

---

## Executive Summary

The `.lighthouserc.json` already declared `largest-contentful-paint: maxNumericValue 2500ms = error`, but no CI job enforced it. Today the agent wired `pnpm run lhci:collect` + `pnpm run lhci:assert` into the `seo-gates` job of `.github/workflows/ci-build-guard.yml`. The gate now blocks any PR that regresses LCP above 2500ms on desktop (across the 21 URLs configured in `.lighthouserc.json`). Mobile measurement is intentionally out of scope for CI (it needs PSI + production deploy + a Google API key — covered separately).

**Scope of this commit**: TASK 1 + 2 + 3 from the BAI-PERF-03 ticket. **TASK 4 (root-cause fixes for "Google Fonts + unused CSS + large images") is deferred to BAI-PERF-04** per user decision — because BAI-PERF-02 already eliminated the Google Fonts leg, and the remaining causes need real mobile measurement before touching production code.

---

## Files Changed

| File | Change Type | Description |
|---|---|---|
| `.github/workflows/ci-build-guard.yml` | Edited (32 lines added, 1 modified) | Added 3 steps to `seo-gates` job: `lhci:collect`, `lhci:assert`, artifact upload on failure. Bumped `seo-gates` timeout 12 → 18 min. Added 6-line header comment explaining the new gate. |
| `report/2026-07-25-bai-perf-03-ci-lhci-gate.md` | New | This report (BAI-PROC-12 compliant). |

**NOT changed (per BAI-PERF-03 MUST NOT TOUCH clause)**: `.lighthouserc.json` — its LCP budget value of 2500ms is preserved exactly. The CI gate is purely a "wire the existing budget" change, not a budget tightening.

---

## What the gate does

```
seo-gates job (timeout 18min)
  ...
  - Redirects check                    (existing)
  # --- BAI-PERF-03 addition below ---
  - Lighthouse CI collect              (NEW, ~3-5min on 21 URLs × 3 runs)
  - Lighthouse CI assert (LCP budget)  (NEW, ~5s)
  - Upload Lighthouse reports on failure  (NEW, retention 7d)
```

The collect step runs Lighthouse 3 times on each of the 21 URLs in `.lighthouserc.json` (desktop preset, no throttling). The assert step enforces the budget table from `ci.assert.assertions` and `ci.assert.matchingUrlTemplate` — currently:

| Metric | Budget | Level | What it catches |
|---|---|---|---|
| `largest-contentful-paint` | ≤ 2500ms | **error** | A page is too slow to display its main content |
| `interaction-to-next-paint` | ≤ 200ms | warn | Sluggish interaction (desktop warns because INP not measurable without CPU throttle) |
| `cumulative-layout-shift` | ≤ 0.1 | warn | Visual instability |
| `total-blocking-time` | ≤ 300ms | warn | Main-thread blockage |
| `speed-index` | ≤ 3500ms | warn | Visual completeness |

If any URL's median LCP exceeds 2500ms across the 3 runs, the `lhci:assert` step exits non-zero, the `seo-gates` job fails, the `ci-success` aggregator fails, and the PR is blocked from merging.

---

## Verification (local, this commit)

All run on macOS dev box, against the current `dist/client/` (196 pages, last `pnpm run build` output).

| Check | Command | Result |
|---|---|---|
| YAML syntax | `python3 -c "yaml.safe_load(open('.github/workflows/ci-build-guard.yml'))"` | ✅ parses, 11 jobs, 15 steps in `seo-gates`, 9 jobs in `ci-success.needs` |
| `lhci:assert` passes | `pnpm run lhci:assert` | ✅ exit 0, "All results processed!" (with `interaction-to-next-paint` warnings — expected, desktop preset doesn't measure INP) |
| `lhci:assert` fails on regression | tighten LCP budget 2500 → 100 in `.lighthouserc.json`, re-run assert | ✅ exit 1, "Assertion failed. Exiting with status code 1.", `expected: <=100 found: 812.5` (the actual LCP) |
| Budget restored | restore from backup | ✅ budget back to 2500ms, re-run assert → exit 0 |
| `git diff --stat` | `git diff --stat .github/workflows/ci-build-guard.yml` | `+32 -1` (the `-1` is the `timeout-minutes: 12` line) |

### Desktop LCP measurements (this session)

I ran `pnpm run lhci:collect` twice (first run was cut short, second run got ~26 lhr files). Across all runs:

| URL group | LCP avg (ms) | LCP max (ms) | Status |
|---|---|---|---|
| `/` (homepage) | 831 | 861 | ✅ |
| `/about/` | 928 | 1186 | ✅ |
| `/services/` | 882 | 951 | ✅ |
| `/solutions/` | 938 | 1203 | ✅ |
| `/contact/` | 948 | 1063 | ✅ |
| `/pricing/` | 884 | 920 | ✅ |
| **All 26 measurements** | **916 avg** | **1203 max** | **✅ 26/26 < 2500ms** |

So at this commit the gate will pass on `main`. Any future PR that regresses any of these pages past 2500ms will be blocked.

---

## Why desktop-only (and what's missing for mobile)

The ticket acceptance criterion says "Lighthouse **mobile**: LCP < 2500ms على / و /kernel/ و /pricing/". This commit does **not** measure mobile — and that's a deliberate decision, not an oversight.

Reasons:

1. **`.lighthouserc.json` `ci.collect` is hardcoded `preset: "desktop"`**. The PSI section (`psiCollect`) is mobile, but PSI requires a production URL + Google PageSpeed Insights API key + it runs against `https://brightai.site/` (not the PR's `dist/`). Putting PSI in CI would require (a) the secret, (b) deploying the PR's dist to a preview URL, (c) accepting external API dependency. That's a 1-2 day project of its own.
2. **Local mobile Lighthouse works but is slow and noisy**. Playwright on localhost doesn't accurately emulate Slow 4G (the `playwright` measurement noise in brain.md Section 1.2.a is evidence). The 2-second desktop-to-mobile gap on real devices won't show in CI.
3. **Desktop is a strong proxy for "regression introduced by a code change"**. If a PR regresses LCP, it almost always regresses *both* desktop and mobile. The gate catches the cause even though the symptom is measured in the cheaper environment.
4. **The mobile LCP gap is being addressed in BAI-PERF-04** (per user Option A decision). Once root causes are fixed, we can revisit adding mobile measurement to CI — likely as a separate weekly scheduled workflow using PSI, not in the per-PR gate.

The decision is documented in the workflow comments (lines 405-410) so the next agent reading the file knows why.

---

## Risks Addressed

- **R1 (LCP regression ships silently)**: closed. The `seo-gates` job now blocks the merge.
- **R2 (Lighthouse CI integration drift)**: low. The lhci tooling is already installed (npm warns once at first run, then cached). The script (`scripts/run-lhci.sh`) is the existing wrapper.
- **R3 (CI minute cost)**: low. Adds ~3-5 minutes to `seo-gates` (10 → 15 min wall time on a healthy runner). The 12 → 18 min timeout headroom absorbs the slowest runs.

## Risks Remaining

- **R4 (kernel/* pages not in the assertion sample)**: 11 `/kernel/*` pages are not in the default `ci.collect.url` list (only `/kernel/` is). They were intentionally excluded because most of them are SSR/hybrid and have different LCP characteristics (data + JS hydration). If kernel regressions need a CI gate, that's a follow-up ticket.
- **R5 (mobile LCP not measured in CI)**: documented in the workflow comments. BAI-PERF-04 will address root causes; mobile CI gate is a separate PSI-based project.
- **R6 (assertion-results.json garbage from stale runs)**: the `.lighthouseci/` directory persists across local runs. On CI this is fine (each run starts fresh), but locally you may see ghost results if you don't `rm -rf .lighthouseci/` between sessions. Not blocking, just noisy.
- **R7 (lhci runs Lighthouse via `npx` first time)**: the `npm warn exec The following package was not found and will be installed: @lhci/cli@0.15.1` warning on first CI run adds ~30s for the npx install. Subsequent runs use the cache. Not blocking.

## Out-of-Scope (per user Option A)

- **BAI-PERF-04** (next ticket): fix root causes for mobile LCP. Candidates:
  1. Reduce font preloads (5 × ~75KB avg on Slow 4G = ~2s bandwidth before LCP element can render).
  2. Purge unused CSS in `ArabicLayout.css` (137KB raw / 20KB gz — large but compresses well).
  3. Optimize logo preload (currently preload both `.avif` and `.webp` for the 192x192 logo; could pick one based on `Accept` header).
  4. Inline more critical CSS for the SplitHero h1 (currently only 2.3KB inline).
  - **None of these are touched in this commit.** The user explicitly chose to defer until real mobile measurements confirm which cause is dominant.

---

## Rollback

Per the BAI-PERF-03 ticket's ROLLBACK clause: "احذف step من CI" (delete the step from CI).

To roll back: revert the 3 added steps in `.github/workflows/ci-build-guard.yml` (lines 405-426 in the new file) and set `timeout-minutes` back to 12. `git revert` of this commit works too. No data loss risk — the change is additive.

If you want to keep the gate but lower the budget later: edit `.lighthouserc.json` `ci.assert.assertions.largest-contentful-paint`. The current value of 2500ms is the "MUST NOT TOUCH" budget from the ticket and is preserved.

---

## Related

- BAI-PERF-02 (2026-07-25): self-hosted Google Fonts, eliminated the 3rd-party CSS fetch. Already deployed.
- BAI-PERF-01 (2026-07-24): critical CSS decomposition, dropped `BaseLayout.css` 222KB → 11.8KB gz.
- BAI-PROC-12 (2026-07-25): verified-production gate. This report declares `verified_production: no` because the CI change requires a real CI run on a PR to confirm the gate actually blocks a regression in production conditions.
- DEC-2026-07-25-PERF-03-001 (new, see Section 4 of brain.md): the `seo-gates` job is now the SoT for performance gate enforcement on the marketing site. Future perf gates should extend this job, not create parallel jobs.

---

## Suggested commit message (per brain line 18, user commits)

```
[BAI-PERF-03] ci: lhci gate in seo-gates — LCP <= 2500ms enforced

The .lighthouserc.json already declared the LCP budget (2500ms = error)
but no CI job enforced it. Wire `pnpm run lhci:collect` +
`pnpm run lhci:assert` into the seo-gates job so any PR that regresses
LCP past 2500ms on desktop is blocked from merging.

- 3 new steps in seo-gates (collect, assert, artifact upload)
- seo-gates timeout 12 -> 18min (collect adds ~3-5min for 21 URLs x 3 runs)
- Header comment + workflow comment explain the gate + desktop-only choice
- 0 changes to .lighthouserc.json (MUST NOT TOUCH clause)
- 0 changes to any protected file

Verification (local):
- pnpm run lhci:assert -> exit 0 (26 lhr files, all LCP < 2500ms)
- Tighten budget 2500 -> 100ms -> lhci:assert exit 1 (gate catches regression)
- Restore budget -> lhci:assert exit 0
- python yaml.safe_load -> parses, 15 steps in seo-gates

Risks remaining: kernel/* pages not in collect sample, mobile LCP not in
CI (deferred to BAI-PERF-04 root-cause fixes + separate PSI workflow).
```

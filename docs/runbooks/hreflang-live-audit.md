# Hreflang Live Audit Runbook

**Ticket:** BAI-IDX-14
**Owner:** BrightAI Workspace Agent
**Last updated:** 2026-07-25

## Overview

The `scripts/hreflang-bidirectional-audit.mjs` script validates 5 hreflang contracts on every page:

1. **Self hreflang** — every page declares its own language via `hreflang="X-SA"`.
2. **Reciprocity** — for every `hreflang="X"` alternate, the target page returns `hreflang="Y"` to the source.
3. **x-default sanity** — `hreflang="x-default"` does NOT point to `/en/`.
4. **EN page contract** — EN pages (canonical contains `/en/`) have `en-SA=self` + `ar-SA` pointing to the AR counterpart.
5. **AR-only invariant** — AR pages not in the bilingual pair map do not invent `en-SA` (BAI-SEO-003-S3).

The script supports two modes:

| Mode | Source | Use case |
|------|--------|----------|
| `--local` (default) | `dist/client/**/*.html` (filesystem) | PRs, post-build local validation, `verify:all` |
| `--live` | Playwright fetches `https://brightai.live/<page>` | Production drift detection, scheduled CI Job 10 |

## Running locally

```bash
# Local mode (default, post-build)
node scripts/hreflang-bidirectional-audit.mjs

# Live mode (production)
node scripts/hreflang-bidirectional-audit.mjs --live

# Live mode, custom host (staging)
node scripts/hreflang-bidirectional-audit.mjs --live --host=https://staging.brightai.live

# Sample 50 pages with JSON report
node scripts/hreflang-bidirectional-audit.mjs --live --sample=50 --report=report/hreflang-live.json

# Help
node scripts/hreflang-bidirectional-audit.mjs --help
```

## CI integration

### PRs (secrets-free)

The script runs via `pnpm run verify:all` (added in `package.json:83`). Workflow: `ci-build-guard.yml` → `seo-gates` job → `verify:all`. Mode = filesystem.

### Push to main / schedule (daily 03:00 UTC) / workflow_dispatch

Workflow: `ci-build-guard.yml` → `hreflang-live` job (Job 10). Mode = live via Playwright. Runs against `https://brightai.live` (or `host` input on dispatch).

The job is gated by `if: push || schedule || workflow_dispatch` — it does NOT run on pull requests (PRs use the filesystem audit via `verify:all`).

## Exit codes

| Code | Meaning | CI action |
|-----------|---------|-----------|
| 0 | All checks passed | pass |
| 1 | One or more hreflang violations detected | fail |
| 2 | Internal error (browser launch, network, parse failure) | fail |

## Common failures + fixes

### `x-default points to /en/`

**Symptom:** `Missing x-default: 0` + `AR-only invented en: N` violations across multiple pages.

**Cause:** The `src/data/hreflang-pairs.ts` `xDefault` field is wrong, or a page's SEOHead/SEOHead-derived JSON-LD emits a wrong x-default.

**Fix:** Open `src/data/hreflang-pairs.ts` and verify the `xDefault` field points to the AR URL. For a new bilingual pair, ensure both `ar` and `en` URLs are present in the `HreflangPair` object.

### `Missing return tag` (reciprocity failure)

**Symptom:** `Missing return tags: N` violations.

**Cause:** Page P has `hreflang="ar-SA" href="<ar-url>"` and `<ar-url>` does NOT have `hreflang="en-SA" href="<P.canonical>"` back.

**Fix:** Either (a) add the return alternate in the page's SEOHead, or (b) check that the page is registered in `EXPLICIT_HREFLANG_PAIRS` (bidirectional keying — BAI-SEO-003-S3 invariant).

### `EN page contract` failure

**Symptom:** `EN page contract (S3): N` — N EN pages missing `en-SA=self` or `ar-SA` pointing to AR counterpart.

**Fix:** Open `src/pages/en/<slug>.astro` and verify the page uses `ArabicLayout` or `EnglishLayout` with `hreflang` set correctly. The pair map in `src/data/hreflang-pairs.ts` must include the EN page.

### `AR-only invented en` (BAI-SEO-003-S3 invariant)

**Symptom:** `AR-only invented en: N` — N AR pages not in the bilingual pair map are emitting `en-SA` alternates.

**Fix:** Open the page's `Layout.astro` and remove the `en-SA` alternate. If the page actually has an EN counterpart, add the page to `EXPLICIT_HREFLANG_PAIRS` in `src/data/hreflang-pairs.ts`.

### Live audit catches production defect

**Symptom:** The filesystem audit (`node scripts/hreflang-bidirectional-audit.mjs`) reports 0 errors, but the live audit (`--live`) reports violations. This is the WHOLE POINT of BAI-IDX-14.

**Cause:** Production HTML differs from `dist/client/` (stale build, Cloudflare cache, or runtime injection via `injectSecurityMeta` integration).

**Fix:** (1) Check the CI artifact: `report/hreflang-live-*.json` shows the exact URLs with violations. (2) Re-deploy with the latest commit (Render auto-deploy from main). (3) `pnpm run cloudflare:purge` to clear stale cache. (4) If still failing, check `astro.config.mjs` `injectSecurityMeta` integration for any recent changes that could affect the hreflang emission.

## Rollback

If the script must be reverted (rare — usually only if Playwright becomes a dependency problem):

1. `git revert <commit-hash>` on the 3 commits that added the script changes (Tasks 1, 2, 3).
2. `git revert <commit-hash>` on the test file (Task 4).
3. `git revert <commit-hash>` on `package.json` (Task 5).
4. `git revert <commit-hash>` on `ci-build-guard.yml` (Task 6).
5. `git rm docs/runbooks/hreflang-live-audit.md` (Task 7).

Total: 5 revert commits, ~5 minutes. The original `seo:hreflang` script behavior is preserved (filesystem-only) after rollback.

## CI follow-up (not implemented in initial PR)

The test file at `scripts/hreflang-bidirectional-audit.test.mjs` runs locally via `node --test scripts/hreflang-bidirectional-audit.test.mjs`. It is **not** auto-discovered by the current `vitest.config.js` (which scopes root tests to chat-session + CSRF only). For CI integration of the test:

1. Add to `ci-build-guard.yml` → `seo-gates` job (after `pnpm run verify:all`):
   ```yaml
   - name: Run hreflang audit tests
     run: node --test scripts/hreflang-bidirectional-audit.test.mjs
   ```
2. Or add to `package.json:91-95` root test scripts and re-run.

This is a follow-up tracked here, not in the initial BAI-IDX-14 PR.

## Related

- Spec: `docs/superpowers/specs/2026-07-25-hreflang-live-audit-design.md`
- Plan: `docs/superpowers/plans/2026-07-25-hreflang-live-audit.md`
- Brain entry (post-completion): Section 2 of `.agents/brain.md`
- Related decisions: DEC-HREFLANG-LIVE-001 (Playwright over curl), DEC-HREFLANG-LIVE-002 (Job 10 in ci-build-guard)
- Related brain change ledger: BAI-IDX-14 (after deployment)
- Pair map source of truth: `src/data/hreflang-pairs.ts`
- Audit script: `scripts/hreflang-bidirectional-audit.mjs`
- Test file: `scripts/hreflang-bidirectional-audit.test.mjs`
- CI workflow: `.github/workflows/ci-build-guard.yml`

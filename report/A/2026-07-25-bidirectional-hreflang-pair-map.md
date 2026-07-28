# BAI-SEO-003-S3 — Bidirectional hreflang pair map + /en/ pattern fix

**Date**: 2026-07-25
**Task**: BAI-IDX-01 (Priority P0) — Make `/` and `/en/` reciprocal, apply the same contract to every genuine AR/EN pair, and extend the audit with a regression fixture for the exact broken `/en/` pattern.
**Mode**: Senior (autonomous)
**Status**: Verified locally — pending user commit (per brain line 18)

---

## Executive Summary

البق كان إن `EXPLICIT_HREFLANG_PAIRS` في `src/data/hreflang-pairs.ts` كان مفهرس بالـ AR URL بس. لما `SEOHead.astro` يستدعي `getHreflangLinks('https://brightai.site/en/')`، الـ lookup يفشل → يسقط على الـ synthetic AR-only default → يطلع `ar-SA=self + x-default=self` ويضيع الـ `en-SA` self والـ `ar-SA` اللي يرجع للـ AR counterpart.

هذا أثّر على **7 EN pages كاملة** (الـ `/en/` + 5 legal + sales-deck). الـ audit قبل الإصلاح كان يعطي **21 خطأ** (14 missing-return + 7 canonical-mismatch).

الحل: عملت الـ map bidirectional — كل bilingual pair ينسجّل بمفتاحين (AR URL + EN URL) كلهم يشيرون لنفس الـ `HreflangPair`. أضفت كمان regression fixture في الـ audit باسم `checkEnPageContract` يلتقط بالضبط نفس الـ pattern لو رجع في المستقبل + invariant `checkArOnlyPageNoEnAlternate` يضمن إن ما في AR-only page يطلع en-SA مُخترَع. وأصلحت bug قديم في `checkReciprocity` كان يفحص الـ self-references كأنها تحتاج return tag (false positive ظهر بعد إصلاح الـ /en/ pattern).

النتيجة: `node scripts/hreflang-bidirectional-audit.mjs` يطلع 0 errors + exit 0. كل الـ 7 EN pages صارت تطلع `en-SA=self + ar-SA=↗AR counterpart + x-default=↗AR`. ما في AR-only page أخذ EN counterpart مُخترَع (`/privacy-cookies/` وغيره، اللي S1 نظفها في 2026-07-18، ثابتة).

---

## Files Changed

| File | Change Type | Description |
|---|---|---|
| `src/data/hreflang-pairs.ts` | Modified | Bidirectional keying via `makeBidirectionalEntries()` + new `HREFLANG_PAIRS_LIST` const; updated header docstring with S3 section; `getHreflangLinks` and `isExplicitBilingualPair` unchanged (they now work correctly because the map has both keys). |
| `scripts/hreflang-bidirectional-audit.mjs` | Modified | Added `checkEnPageContract()` regression fixture (named, with the /en/ pattern documented inline); added `checkArOnlyPageNoEnAlternate()` invariant (imports `isExplicitBilingualPair` from the pair map); fixed pre-existing `checkReciprocity` self-reference false positive (skip `href === canonical`); wired both into `main()` + console output. |
| `.agents/brain.md` | Modified | New change-ledger entry for BAI-SEO-003-S3 / BAI-IDX-01 with the fix, the regression fixture, and the DEC. |
| `report/2026-07-25-bidirectional-hreflang-pair-map.md` | Created | This report. |

No protected files touched (per Section 2.1 of agent.md: `astro.config.mjs`, `public/_redirects`, `public/_headers`, `public/robots.txt`, `src/data/site.ts`, etc.). No published Arabic text changed.

---

## Verification Results

| Check | Before | After | Status |
|---|---|---|---|
| `node scripts/hreflang-bidirectional-audit.mjs` exit code | 1 | **0** | ✓ |
| `node scripts/hreflang-bidirectional-audit.mjs` TOTAL ERRORS | 21 | **0** | ✓ |
| `node scripts/hreflang-bidirectional-audit.mjs` Canonical mismatch | 7 | **0** | ✓ |
| `node scripts/hreflang-bidirectional-audit.mjs` Missing return tags | 14 | **0** | ✓ (after self-ref fix) |
| `node scripts/hreflang-bidirectional-audit.mjs` EN page contract (S3) | — | **0** | ✓ (new fixture) |
| `node scripts/hreflang-bidirectional-audit.mjs` AR-only invented en | — | **0** | ✓ (new invariant) |
| `/en/` emits en-SA=self | ❌ (missing) | ✓ | ✓ |
| `/en/` emits ar-SA=↗/ | ❌ (was self) | ✓ | ✓ |
| `/en/` emits x-default=/ | ✓ | ✓ | ✓ |
| `/cookie-policy/` ↔ `/en/cookie-policy/` (5 legal + sales-deck + /) | ❌ (all 7 broken) | ✓ | ✓ |
| `/solutions/ai-governance-platform/` (AR-only) has NO en-SA invented | ✓ | ✓ | ✓ |
| `/privacy-cookies/` (S1 AR-only, was the 2026-07-18 fix) | ✓ | ✓ | ✓ |
| `node scripts/verify-all.mjs` (5/5 checks) | ✓ | ✓ | ✓ |
| `node scripts/seo-ci-check.mjs` (seo:gate) | ✓ (6/6 hreflang pages passed) | ✓ | ✓ |
| `ASTRO_TELEMETRY_DISABLED=1 pnpm build` | 196 pages, 0 errors | 196 pages, 0 errors | ✓ |

---

## Root Cause Analysis

### What broke (S2 / 2026-07-18 → before S3)

`EXPLICIT_HREFLANG_PAIRS` was a `Map<string, HreflangPair>` keyed by the **AR URL** of each bilingual pair:

```ts
export const EXPLICIT_HREFLANG_PAIRS: ReadonlyMap<string, HreflangPair> = new Map(
  [
    { key: url('/'), pair: { ar: url('/'), en: url('/en/'), xDefault: url('/') } },
    { key: url('/privacy-policy/'), pair: { ar: ..., en: ..., xDefault: ... } },
    // ... 5 more (all keyed by AR URL)
  ].map(({ key, pair }) => [key, pair] as const),
);
```

`getHreflangPair(canonical)` does a single lookup by `toKey(canonical)`. When called with the EN canonical:

- For `/en/`: `EXPLICIT_HREFLANG_PAIRS.get('https://brightai.site/en/')` → `undefined`.
- The synthetic AR-only default fires: `{ ar: canonical, xDefault: canonical }` = `{ ar: 'https://brightai.site/en/', xDefault: 'https://brightai.site/en/' }`.
- `getHreflangLinks('https://brightai.site/en/')` then sees `canonical === pair.ar` (true, because `pair.ar` was just set to the EN canonical) and emits:
  - `ar-SA` → `https://brightai.site/en/` (self, **wrong**)
  - `x-default` → `https://brightai.site/en/` (self, **wrong**)
  - **No `en-SA` self-reference** (the lang was `ar-SA`, not `en-SA`)
  - **No `ar-SA` pointing to `/`** (the AR counterpart)

Same shape applied to all 7 EN pages.

### Why SEOHead's `hreflang` prop didn't help

`SEOHead.astro` accepts a `hreflang` prop from pages but **uses the canonical instead** when one is provided:

```ts
const explicitHreflang = canonical ? getHreflangLinks(canonical) : [...hreflang];
```

Every EN page passes a hardcoded `hreflang` array (e.g. `/en/index.astro` has `[en-SA, ar-SA, x-default]`). The prop is dead code today — SEOHead ignores it. The single source of truth is the pair map.

### Why no other script caught this earlier

`seo-ci-check.mjs` (the `seo:gate` script) checks the **6** core bilingual pairs against `getHreflangLinks` in isolation and reports "6/6 passed" because the function signature works correctly for AR canonicals. It does NOT exercise the EN canonicals path that was broken. The S2 audit was the first script to look at the **built HTML** for both sides, and it caught 21 errors.

---

## The Fix

### `src/data/hreflang-pairs.ts` — bidirectional keying

Replaced the single-key `.map()` with a two-key expansion via `makeBidirectionalEntries`:

```ts
function makeBidirectionalEntries(
  pairs: readonly HreflangPair[],
): Array<[string, HreflangPair]> {
  const out: Array<[string, HreflangPair]> = [];
  for (const pair of pairs) {
    out.push([pair.ar, pair]);
    if (pair.en) out.push([pair.en, pair]);
  }
  return out;
}

const HREFLANG_PAIRS_LIST: readonly HreflangPair[] = [
  { ar: url('/'), en: url('/en/'), xDefault: url('/') },
  // ... 6 more (one entry per bilingual pair)
];

export const EXPLICIT_HREFLANG_PAIRS: ReadonlyMap<string, HreflangPair> = new Map(
  makeBidirectionalEntries(HREFLANG_PAIRS_LIST),
);
```

The result: 7 `HreflangPair` objects → 14 `Map` entries (2 keys per pair, both pointing to the same pair). `getHreflangPair('https://brightai.site/en/')` now hits the EN key and returns the full pair. `getHreflangLinks` then sees `canonical === pair.en` and emits the correct EN page contract.

`isExplicitBilingualPair` is unchanged — its logic (`Boolean(pair?.en)`) now works correctly for both AR and EN canonicals because the lookup succeeds for both.

### `scripts/hreflang-bidirectional-audit.mjs` — regression fixture + invariant + reciprocity fix

**1. New regression fixture: `checkEnPageContract(index)`**

Catches the exact /en/ pattern (no en-SA self, no ar-SA pointing to AR counterpart) and labels it `REGRESSION BAI-SEO-003-S3` in the error log so a future regression of the same shape is immediately identifiable. The function iterates every page whose canonical contains `/en/`, asserts `en-SA` self equals canonical, and asserts `ar-SA` is present (the return-tag URL is verified by `checkReciprocity`).

**2. New invariant: `checkArOnlyPageNoEnAlternate(index)`**

Symmetric to the above — enforces the "No AR-only page gets an invented English counterpart" acceptance criterion. Imports `isExplicitBilingualPair` from the pair map (the single source of truth) and asserts that any page not in the bilingual map does NOT emit an `en-SA` alternate. This catches the class of regression that S1 fixed for `/privacy-cookies/` in 2026-07-18.

**3. Bug fix: `checkReciprocity` self-reference false positive**

Before S3, every AR page had `ar-SA=self` and every EN page had `en-SA=self`. The reciprocity loop iterated these self-references and asked "does the target (which is the page itself) have the return lang?" — the target's return lang href legitimately points to the OTHER page, not back to the self, so the check failed for every bilingual page. This was a pre-existing bug masked by the /en/ pattern. Fix: skip self-references (`if (href === canonical) continue;`). Reciprocity is a cross-page contract; self-references are verified by `checkCanonicalSelfMatch`.

---

## Acceptance Criteria (from the task spec)

- ✓ `node scripts/hreflang-bidirectional-audit.mjs` exits 0.
- ✓ `/en/` contains self `en-SA` and an `ar-SA` alternate pointing to `/` (verified via `grep hreflang dist/client/en/index.html`).
- ✓ No AR-only page gets an invented English counterpart (verified via `checkArOnlyPageNoEnAlternate` against all 182 audited pages; `/solutions/ai-governance-platform/`, `/privacy-cookies/`, etc. all still AR-only with no `en-SA` alternate).

---

## Risks Remaining

- **`/en/index.astro` and `/en/sales-deck/index.astro` still pass a hardcoded `hreflang` prop** that SEOHead ignores when canonical is set. This is **dead code** today. Out of scope for this commit (the bug was in the map, not the prop), but a follow-up cleanup could remove the redundant prop + import to reduce confusion. Tracked in DEC-HREFLANG-BIDI-2026-07-25-001.
- **`getLegalAlternates` in `src/data/i18n-pairs.ts` is still used by the 5 legal pages** to pass a `hreflang` prop. Same dead-code situation — SEOHead ignores it. Out of scope for this fix but worth flagging.
- **No tests added for `getHreflangPair` / `getHreflangLinks` unit-level invariants.** The audit script is the integration test. A future iteration could add a `node --test` file under `scripts/__fixtures__/` for direct unit coverage. The regression fixture in the audit is the high-signal guard for now.
- **The audit reads `dist/client/`** which means it requires a build to run. If the build is stale, the audit can pass against an outdated snapshot. Mitigation: the build is fast (~5s) and the audit is part of `seo:all` / `verify:all`, which run after the build in CI.

---

## Decisions

### DEC-HREFLANG-BIDI-2026-07-25-001

`EXPLICIT_HREFLANG_PAIRS` is bidirectionally keyed. Each bilingual pair is registered under TWO keys (the AR URL AND the EN URL) both pointing to the same `HreflangPair`. The map is the single source of truth for which pages have an en-SA alternate.

**Rules**:
- To add a new bilingual pair, add ONE entry to `HREFLANG_PAIRS_LIST` in `src/data/hreflang-pairs.ts`. Do NOT edit `SEOHead.astro` logic or hand-write alternates in a page. The map is rebuilt bidirectionally by `makeBidirectionalEntries()`.
- To remove a bilingual pair, remove the entry from `HREFLANG_PAIRS_LIST`. Do NOT pass a `hreflang` prop from a page (it's ignored).
- No code should call `getHreflangPair` and then check `pair.en` to decide whether to emit `en-SA` — `getHreflangLinks` already handles that branch and never invents an English counterpart for an AR-only page.

**Reversal cost**: Low — restructure to single-key with a separate `Map<string, HreflangPair>` for EN URLs. Would require changing every consumer of the map and re-running the audit.

### DEC-HREFLANG-BIDI-2026-07-25-002

The `checkEnPageContract` and `checkArOnlyPageNoEnAlternate` checks in `scripts/hreflang-bidirectional-audit.mjs` are **non-optional** — they gate `seo:all` / `verify:all`. The S3 regression fixture's error message references `BAI-SEO-003-S3` by ID so a future agent reading the audit log can trace the regression to this commit + report.

---

## Suggested Commit Message

```
fix(seo): BAI-SEO-003-S3 — bidirectional hreflang pair map + /en/ fix

The hreflang pair map (src/data/hreflang-pairs.ts) was keyed only by the
AR URL, so EN canonicals like /en/ missed the map lookup and fell
through to the synthetic AR-only default. Effect: 7 EN pages
(/, /cookie-policy, /data-processing-agreement, /pdpl-statement,
/privacy-policy, /sales-deck, /terms) emitted only ar-SA=self +
x-default=self — no en-SA self, no ar-SA pointing to the AR counterpart.
The bidirectional audit caught 21 errors (14 missing-return +
7 canonical-mismatch).

Fix: make the map bidirectionally keyed. Each bilingual pair is now
registered under TWO keys (the AR URL AND the EN URL) both pointing
to the same HreflangPair, so getHreflangPair() resolves correctly
whether the canonical is the AR or the EN side.

Also:
  - scripts/hreflang-bidirectional-audit.mjs: add checkEnPageContract()
    regression fixture (the exact /en/ pattern, labeled REGRESSION
    BAI-SEO-003-S3 in the error log) + checkArOnlyPageNoEnAlternate()
    invariant (symmetric: no AR-only page gets an invented en-SA).
  - scripts/hreflang-bidirectional-audit.mjs: fix pre-existing
    checkReciprocity self-reference false positive (skip href === canonical;
    reciprocity is a cross-page contract).

Verification:
  - node scripts/hreflang-bidirectional-audit.mjs → exit 0 (0 errors)
  - node scripts/verify-all.mjs → 5/5 checks pass
  - node scripts/seo-ci-check.mjs → 6/6 hreflang pages, 0 errors
  - pnpm build → 196 pages, 0 errors
  - grep hreflang dist/client/en/index.html → en-SA=self + ar-SA=↗/ + x-default=/
  - grep hreflang dist/client/cookie-policy/index.html → ar-SA=self + en-SA=↗/en/cookie-policy/ + x-default=self
  - grep hreflang dist/client/solutions/ai-governance-platform/index.html → ar-SA=self + x-default=self (NO en-SA)

Out-of-scope (tracked in DEC-HREFLANG-BIDI-2026-07-25-001):
  - /en/index.astro + /en/sales-deck/index.astro + 5 legal pages still
    pass a hardcoded hreflang prop that SEOHead.astro ignores when
    canonical is set. Dead code, harmless, cleanup follow-up.
```

---

## Related

- `src/data/hreflang-pairs.ts` — the fix
- `scripts/hreflang-bidirectional-audit.mjs` — the regression fixture + invariant
- `src/components/SEOHead.astro` — consumer (unchanged)
- `scripts/seo-ci-check.mjs` — consumer (unchanged, but now passes cleanly)
- `scripts/generate-sitemap-all-pages.mjs` — consumer (unchanged, but now produces correct alternates for EN URLs)
- `report/2026-07-18-...` (BAI-SEO-003-S1 + S2 historical context) — the same hreflang lineage
- `brain.md` Section 1.1 (Build & Pages, EN pages) — unchanged (still 5 legal + / + sales-deck = 7 EN)

---

## Verification Status (BAI-PROC-12)

- **verified_local**: yes
  - `node scripts/hreflang-bidirectional-audit.mjs` — 0 errors (was 21) ✓
  - `node scripts/verify-all.mjs` — 5/5 checks pass ✓
  - `node scripts/seo-ci-check.mjs` — 6/6 hreflang pages, 0 errors ✓
  - `grep hreflang dist/client/en/index.html` — `en-SA=self + ar-SA=↗/ + x-default=/` ✓
  - `pnpm build` — 196 pages, 0 errors ✓
- **verified_production**: no
- **verified_production_blocker**: awaiting user commit + Render auto-deploy + `pnpm run cloudflare:purge` per BAI-DEPLOY-11. Without these, the live `/en/` page still emits the broken `ar-SA=self + x-default=self` (no en-SA self, no return tag) that Google penalizes.

> To promote this report to `verified_production: yes`, run after deploy: `pnpm run verify:production` — the `hreflang contract` probe must pass for both `/en/` and `/`. Update the report with `verified_production_commit: <SHA>`.

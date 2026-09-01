# Global Video Background — Implementation Report

**Task ID:** BAI-BG-VIDEO-001
**Date:** 2026-08-29
**Working tree base:** `6ee711c5` (clean at start — verified with `git status --untracked-files=all`)
**Scope:** what was actually implemented and measured. Remaining defects live in
`REPOSITORY-DESIGN-UX-AUDIT.md`; this file does not mix the two.

---

## 1. Headline outcome

Three things were done, in this order, because the second could not be measured
until the first was fixed:

1. **A P0 CSS-delivery regression was found and fixed.** 52 of 273 main-site
   routes were shipping without `components.css` (105 KB) and `pages.css`
   (164 KB). 29 of them rendered with collapsed grids, unstyled buttons and
   surface-less cards. This — not the background — is what the reference
   screenshots showed.
2. **A P0 content-visibility defect was found and fixed.** Every
   `.card--feature` / `.feature-card` / `.inner-card` / `.home-faq-item` /
   `.inner-reveal` / `.home-stat-card` on the site sat at `opacity: 0` until a
   dynamically imported reveal script finished — a chain that runs no earlier
   than `load` + `requestIdleCallback(2500ms)`, swallows all its own errors, and
   has no non-JS fallback. On `/about/` alone, 104 text nodes across 26 cards
   measured effectively invisible.
3. **`9.mp4` became the single page-level background** on every visible surface
   of the main site and the dashboard, matching the contract already shipping in
   `apps/qc-task-manager`, and the previous page-level background stack was
   removed.

---

## 2. Asset identity

`9.mp4` is committed once at the repo root and fanned out at prebuild by
`scripts/sync-background-media.mjs`, which fails the build on any hash mismatch.
`pnpm bg:verify` re-checks without writing.

| Role | Path | Bytes | SHA-256 (first 16) |
|---|---|---|---|
| source video | `9.mp4` | 7,958,354 | `2ea48871471a43fe` |
| site | `public/media/brightai-background.mp4` | 7,958,354 | `2ea48871471a43fe` |
| dashboard | `apps/dashboard/public/media/brightai-background.mp4` | 7,958,354 | `2ea48871471a43fe` |
| qc (committed) | `apps/qc-task-manager/public/media/qc-system-background.mp4` | 7,958,354 | `2ea48871471a43fe` |
| source poster | `apps/qc-task-manager/public/media/qc-system-background-poster.jpg` | 144,321 | `ae20f8f0c0d2c015` |
| site poster | `public/media/brightai-background-poster.jpg` | 144,321 | `ae20f8f0c0d2c015` |
| dashboard poster | `apps/dashboard/public/media/brightai-background-poster.jpg` | 144,321 | `ae20f8f0c0d2c015` |

`ffprobe 9.mp4`: h264, **1600×1200**, 60 fps, 301 frames, 5.016667 s,
12,691,062 bps, **no audio stream**. Not re-encoded, compressed, cropped or
recoloured — the site copy is byte-identical to the file supplied.

The two generated copies are gitignored (`.gitignore:137-140`), so the video's
weight in git history is unchanged at 2 committed copies rather than 4.

---

## 3. Files changed

**New**

| File | Purpose |
|---|---|
| `src/components/SiteBackground.astro` | main-site background layer |
| `apps/dashboard/components/SiteBackground.tsx` + `.module.css` | dashboard background layer |
| `scripts/sync-background-media.mjs` | one-source-of-truth media fan-out + SHA-256 gate |
| `scripts/qa/verify-background-contract.mjs` | 95-check source guard (contract + CSS delivery + no duplication) |
| `scripts/qa/route-inventory.mjs` | route/template/CSS-delivery inventory generator |
| `scripts/qa/layout-audit.mjs` | Chromium measurement harness |
| `scripts/qa/qc-login-state.mjs` | authenticated storage state for QC route coverage |

**Modified — background and CSS delivery**

| File | Change |
|---|---|
| `src/layouts/BaseLayout.astro` | mounts `SiteBackground`; now imports `components.css` + `pages.css` |
| `src/layouts/ArabicLayout.astro` | stopped owning those two imports |
| `src/styles/base.css` | removed the fixed full-viewport `body::before` grain overlay |
| `src/styles/components.css` | deleted the `.dotted-bg` name collision; removed the hero-canvas mobile kill-switches; gated 4 reveal entry states behind `html.reveal-ready` |
| `src/components/SplitHero.astro` | removed canvas + 4 beams + spotlight + vignette, their CSS, the spotlight rAF script, and the `dotted-surface.js` dynamic import |
| `public/js/scroll-reveal.js` | sets `html.reveal-ready` as its first action |
| `public/500.html` | background contract reproduced inline (hand-maintained file outside Astro) |
| `src/pages/answer/[slug].astro`, `src/pages/lp/[slug].astro`, `src/pages/kernel/admin/quota.astro` | own their `<html>` shell → own mount + own stacking rule; `lp` page-level fill made transparent |
| `apps/dashboard/app/layout.tsx`, `styles/globals.css`, `app/page.module.css`, `app/(app|auth|onboarding)/layout.module.css` | mount + stacking rule + 4 opaque page fills made transparent |
| 26 page/component files | `BackgroundGrid` import + usage removed |
| `package.json` | `prebuild` runs `bg:sync`; added `bg:sync` / `bg:verify` |

**Incidental:** `public/sitemap.xml` and `sitemap.xml` were rewritten by
`sitemap:generate` during the builds — a reordering (1200 lines in, 1200 out),
not a content change. The committed copies were stale relative to the generator.

---

## 4. Coverage

From `download/qa/global-bg-audit/route-inventory.json`:

| | Count |
|---|---|
| Visible HTML routes | **369** (site 273, qc-task-manager 76, dashboard 20) |
| Unique templates | **176** |
| Excluded non-HTML endpoints (API / JSON / XML / RSS / sitemap) | **62** |

`Route Coverage` and `Template Coverage` are reported separately because they were
measured differently, per the agreed strategy:

| Surface | Route Coverage (automated) | Template Coverage (Chromium) | Method |
|---|---|---|---|
| Main site | **273/273 = 100%** | **80/80 = 100%** | 2,184 runs (273 × 8 viewports), production build served by the patched standalone entry |
| qc-task-manager | 53/76 = 69.7% | **53/53 = 100%** | 424 runs, authenticated as `admin`; the 23 uncovered routes are `[id]`-parameterised detail/print views with no seeded fixture id |
| dashboard | **0/20 = 0%** | 0/20 = 0% | **BLOCKED** — see §7 |

Viewports measured everywhere: `360×800, 375×812, 768×1024, 1024×900,
1440×1000, 1600×1200, 1920×1080, 2048×1178`.

Full-page screenshots were captured at `360×800`, `1440×1000` and `1920×1080`
(818 baseline + 818 after). Capturing all eight would have cost ~1 GB and ~1 hour
per pass; the three chosen sizes are the ones a human compares. Numeric
measurements cover all eight.

**Screenshot provenance.** The 818 baseline images are in
`download/qa/global-bg-audit/baseline-site/shots`. `before-site/` holds
measurements only. `baseline-site` ran before the harness filters were tightened,
so its counts (escapees 255, clipped 89) are **not comparable** with the
`before-site` → `after-site` numeric pair; both ran against the same unmodified
build, so the images are valid for visual comparison but no number in this report
comes from `baseline-site`. Captures also use `animations: 'disabled'`, which
forces CSS transitions to their end state — a screenshot is evidence of layout,
not of visibility.

---

## 5. Before / after — main site

Both passes ran against a production build served by `dist/server/entry.mjs`,
with identical harness filters. 2,184 runs each.

| Metric | Before | After | Δ |
|---|---|---|---|
| Runs with no background video | **2184** | **0** | ✅ −2184 |
| Runs with exactly one background video | 0 | **2184** | ✅ |
| Structural background-contract violations | n/a | **0** | ✅ |
| Video actually playing | n/a | **fixed after measurement** — see the correction below | ⚠️ |
| Duplicate video downloads in one page | 0 | **0** | ✅ |
| Global scrim detected | 0 | **0** | ✅ |
| Routes missing `pages.css` selectors | 416 (52 routes) | **192 (24 routes)** | ✅ −224 |
| Horizontal overflow | 0 | **0** | — |
| Missing assets (4xx/5xx) | 0 | **0** | — |
| Pages with more than one `h1` | 0 | **0** | — |
| Content escaping the viewport | 48 | 48 | — |
| Content clipped by an overflow ancestor | 33 | 33 | — |
| Leftover animation state on leaf text | 5 | 3 | ✅ −2 |
| Heading split from its group | 41 | **43** | ⚠️ **+2 — a regression** |
| Runs that errored | 0 | **1** | ⚠️ +1 (screenshot timeout; the after run used `--shots`, the before run did not, so the two are not flag-identical) |

**Two honest caveats on this table.** `groupSplits` got worse by 2. The corrected
empty-band metric reports 10, but it was written *after* the change, so there is
no corrected "before" figure and the +2 is neither reproduced nor refuted. And
three nominally identical 640-run template passes reported `stuck` = 3, 4 and 5,
so single-digit movements in that column are within measurement noise.

The residual **192** is 24 routes × 8 viewports and is **correct, not a defect**:
`answer/[slug]` (17), `lp/[slug]` (5), `kernel/admin/quota` (1) and `500.html` (1)
own their own `<html>` shell and their own scoped stylesheets. They never used
`pages.css`. Every route that was supposed to receive it now does.

**Contract verified on all 2,184 after-runs:** CSS box exactly `1600px × 1200px`,
`opacity: 1`, `filter: none`, `object-fit: contain` (never `cover`),
`pointer-events: none` on both video and wrapper, wrapper `position: fixed`,
`mix-blend-mode: normal`, inside `aria-hidden="true"`, `transform` a pure
centring offset (`matrix(1, 0, 0, 1, -800, -600)` — no scale).

### Correction — the video was not playing, and an earlier draft claimed it was

An independent verification pass caught a false claim in the first draft of this
report, which stated the video was "playing" and reported intrinsic dimensions of
`1600×1200` on all after-runs. Recomputed from
`download/qa/global-bg-audit/after-site/measurements.json`:

| | main site (2,184 runs) | qc-task-manager (424 runs) |
|---|---|---|
| `paused: true` | **2184** | 0 |
| `readyState: 0` | 2178 | 0 |
| intrinsic `0×0` | 2178 | 0 |

Two separate problems were hiding behind those numbers, and both were then
diagnosed with a dedicated Playwright probe that loads one page and waits 6 s:

1. **`readyState: 0` was a harness artifact.** The audit harness measures 1–2 s
   after `load` with 4–6 pages in parallel, before a 7.96 MB media buffer can
   fill. With a 6 s wait the site reports `readyState: 4`, intrinsic
   `1600×1200`, HTTP `206`, no media error. The reported `readyState` and
   intrinsic figures in the earlier draft were measurement noise presented as
   verification.
2. **`paused: true` was real.** Even after full load, the main site's video sat
   at `currentTime: 0` and never started, while the byte-identical component in
   `apps/qc-task-manager` played (`paused: false`, `currentTime: 0.94`).
   **Root cause:** Astro's `ClientRouter` re-inserts body nodes on
   `astro:page-load`, and Chromium only honours the `autoplay` attribute for an
   element inserted during parsing. A re-inserted `<video>` stays paused with a
   full buffer. QC has no `ClientRouter`, which is why the same code played there.

**Fix (`BAI-BG-VIDEO-002`).** A play kick was added to all three
implementations — an Astro `<script>` in `src/components/SiteBackground.astro`
bound to `astro:page-load`, a `useEffect` in the dashboard component, and an
inline script in `public/500.html`. A rejected `play()` is ignored on purpose:
blocked autoplay and `prefers-reduced-motion` are both legitimate, and the poster
is the designed fallback for both.

**Verified after the fix**, same probe, 6 s wait:

| Surface | mp4 response | readyState | paused | currentTime |
|---|---|---|---|---|
| site `/about/` | 206 | 4 | **false** | 1.68 |
| site `/500.html` | 206 | 4 | **false** | > 0 |
| qc `/login` | 206 | 4 | false | 0.94 |

The dashboard's equivalent fix is source-only — that app still does not build (§7).

### CSS delivery, proved three ways

| Route group | CSS rules reachable before → after | Document height @1440 before → after |
|---|---|---|
| `/` homepage | 562 → **1509** | 19,959 → 19,487 px |
| `/en/*` (7) | 388 → **1350** | 3,216 → 2,593 px |
| `/kernel/*` (20) | 1,781 → **2,743** | 6,186 → 5,452 px |
| `/about/` (control, already worked) | 1,366 → 1,345 | 5,758 → 7,432 px |

`/kernel/` itself went from **29,712 px to 9,875 px** — its `k-units` card grid
finally lays out as a grid instead of one stacked column.

The control's small rule drop (−21) is the dead CSS this task removed. Its height
increase is the reveal fix: cards that used to occupy space while invisible are
now rendered.

### Other conditions — 80 templates × 8 viewports = 640 runs each

| Condition | escaping | clipped | stuck | heading split from group | overflow | no video | scrim |
|---|---|---|---|---|---|---|---|
| default | 20 | 30 | 3 | 10 | 0 | 0 | 0 |
| `prefers-reduced-motion: reduce` | 20 | 30 | 3 | 10 | 0 | 0 | 0 |
| print media | 21 | 27 | 3 | 10 | 0 | 0 | 0 |
| text zoom 200% | **123** | **88** | 7 | **90** | 0 | 0 | 0 |

RTL and LTR are both covered by the route set itself: 266 Arabic routes render
`dir="rtl"`, the 7 `/en/*` routes render `dir="ltr"`.

Zoom 200% is materially worse than every other condition. That is a real WCAG
1.4.4 / 1.4.10 finding and it is logged in the audit report, not fixed here.

---

## 6. qc-task-manager

The reference implementation was left alone except where the shared guard needed
it. 53 templates × 8 viewports = **424 runs**, authenticated:

`0` errored · `0` non-2xx · `0` horizontal overflow · `0` escaping content ·
`0` clipped content · `0` stuck animation state · `0` global scrims ·
`0` background-contract violations · `1` video per run · `0` missing assets ·
exactly one `h1` per page.

`pnpm --dir apps/qc-task-manager test:ui-consistency` → **207/207**.
`pnpm --dir apps/qc-task-manager typecheck` → 0 errors, 0 warnings, 27 pre-existing hints.

**Correction worth recording:** an earlier QC pass against the *dev* server
reported 12 horizontal-overflow runs and 16 missing assets. That was the dev
server returning HTTP 500 for its own stylesheets
(`[vite] Internal server error: Missing field moduleType`), so the page rendered
with no CSS at all. Against the production build the same routes are clean. The
QC dev server is broken in this environment; the app is not.

---

## 7. Blocked: apps/dashboard

The dashboard background is implemented at source level and passes the source
guard, but **could not be verified at runtime**. `apps/dashboard` does not build
or serve — on any route, before this task touched anything:

```
⨯ node:crypto
Module build failed: UnhandledSchemeError: Reading from "node:crypto" is not handled by plugins.
Import trace:
  app/api/firewall/redact/route.ts
  → lib/firewall/audit/durable.ts
  → lib/observability/sentry.ts
  → @sentry/nextjs → @sentry/opentelemetry
  → @opentelemetry/instrumentation → require-in-the-middle → node:crypto
```

`next dev` returns HTTP 500 for `/`, `/sign-in`, `/dashboard` and a 404 path
alike; `next build` exits 1 with the same error.

**This is pre-existing.** `git status apps/dashboard` was empty before any
dashboard file was touched, and the trace runs entirely through dependency code
plus `lib/observability/sentry.ts`, which this task never modified.

The conventional fix is one line in `apps/dashboard/next.config.mjs` —
`serverExternalPackages` already exists and simply does not list the Sentry /
OpenTelemetry chain. That is a change to how a production app bundles its
observability layer, which is outside a visual task's remit, so it was **not
applied**. It is written up as prompt `RDX-P0-DASH-BUILD` in
`REPOSITORY-DESIGN-EXECUTION-PROMPTS.md`.

Consequence for acceptance: criterion "the video appears on every visible
surface" is **satisfied for 349 of 369 routes and NOT VERIFIED for the 20
dashboard routes.**

---

## 8. Performance — measured, not estimated

The video was kept byte-identical on instruction, so it was not compressed.
Stating the cost plainly:

- **7,958,354 bytes for a 5-second loop at 12.7 Mbps.** The project page-weight
  budget is 2 MB. This single asset is **~4× the entire budget** and now loads on
  every visible route of the main site and the dashboard.
- It is served with HTTP 206 range responses and requested **once per page** —
  `duplicateVideoRequests` is 0 across all 2,184 after-runs.
- `preload="auto"` was kept from the approved QC contract. `preload="metadata"`
  would cut the initial cost substantially but delays first frame; changing it
  is a contract change and was not made unilaterally.
- The poster (144 KB, same 1600×1200) covers first paint, autoplay-blocked
  browsers, and `prefers-reduced-motion`.
- Print output excludes it (`@media print { display: none !important }`).
- No animation library, canvas, or third-party script was added. Net JavaScript
  went **down**: the 321-line `dotted-surface.js` dynamic import and the hero
  spotlight rAF loop were both removed from the homepage.

**Not measured:** LCP, INP and CLS before/after. The harness records layout and
contract facts, not Core Web Vitals, and no Lighthouse run was performed in this
session. Any claim that the video did or did not move LCP would be invented.
Recorded as `NOT VERIFIED` and assigned to prompt `RDX-PERF-001`.

---

## 9. Removed background stack

| Old background | Files | Routes affected | Replacement | Removal status | Evidence |
|---|---|---|---|---|---|
| `DottedBackground.astro` (6 CSS layers, fixed inset-0 z-index −1) | `src/layouts/BaseLayout.astro:364` | ~219 | `SiteBackground` | unmounted; **file retained on disk** pending your confirmation | `verify-background-contract.mjs` asserts no `<DottedBackground` in BaseLayout |
| `.dotted-bg` name collision (slate 32px dot grid painted over the intended layers) | `src/styles/components.css:3047` | ~219 | — | rule deleted | guard asserts `^\.dotted-bg\s*\{` absent |
| Hero canvas + `dotted-surface.js` | `src/components/SplitHero.astro`, `src/scripts/dotted-surface.js` | 1 | `SiteBackground` | markup, CSS and dynamic import removed; **script file retained on disk** | guard asserts no `<canvas` in SplitHero |
| Hero beams ×4, spotlight (+ rAF script), vignette | `src/components/SplitHero.astro` | 1 | `SiteBackground` | removed | guard asserts `.split-hero__beams`/`__vignette` absent |
| Fixed full-viewport body grain (`body::before`, `mix-blend-mode: overlay`) | `src/styles/base.css:496` | all | `SiteBackground` | removed — blend mode over the video would alter its colours | guard asserts `^body::before\s*\{` absent |
| `BackgroundGrid.astro` → `<div class="bg-grid">` with **no CSS anywhere** | 26 files | 25 | — | unmounted everywhere; **file retained on disk** | guard asserts 0 importers |
| Opaque page fills on 4 dashboard shells | `apps/dashboard/app/**/*.module.css` | 20 | `SiteBackground` | set to `transparent` | source diff |
| `.lp-page` opaque fill | `src/pages/lp/[slug].astro` | 5 | `SiteBackground` | set to `transparent` | source diff |

**Kept deliberately** (they are the local surfaces that carry text contrast, and
the agreed scope was page-layer-only removal): section gradients in `pages.css`,
`.bg-ambient-teal-top` / `-indigo-bottom` / `-dots` (10 usages), section-scoped
grain overlays (6 usages), all card/table/panel surfaces. **No global overlay or
scrim was introduced anywhere** — verified at runtime on 2,184 + 424 runs.

Three files are unmounted but still on disk — `DottedBackground.astro`,
`src/scripts/dotted-surface.js`, `BackgroundGrid.astro`. Deleting files needs
your confirmation, so they were left in place and a deletion prompt was written
instead.

---

## 10. Verification results

| Gate | Result |
|---|---|
| `pnpm build` (main site) | ✅ exit 0 |
| `pnpm --dir apps/qc-task-manager build` | ✅ exit 0 |
| `node scripts/qa/verify-background-contract.mjs` | ✅ **95/95** |
| `pnpm bg:verify` | ✅ 7 assets byte-identical |
| `pnpm test` (chat-session, csrf, pii) | ✅ **38/38** |
| `pnpm --dir apps/qc-task-manager test:ui-consistency` | ✅ **207/207** |
| `pnpm --dir apps/qc-task-manager typecheck` | ✅ 0 errors, 0 warnings |
| `pnpm headers:check` | ✅ no CSP drift |
| `git diff --check` | ✅ clean |
| `pnpm lint:tokens` | ❌ **fails — pre-existing** |
| `pnpm exec astro check` (main site) | ❌ **126 errors — pre-existing pattern** |
| `apps/dashboard` build | ❌ **fails — pre-existing** (§7) |

**On the two failures that are not blockers:**

`lint:tokens` fails on raw hex colours in
`src/pages/tools/ai-risk-register/index.astro:145`. Proven untouched:
`git show HEAD:…` compared byte-for-byte with the working copy → identical. The
failure predates this task.

`astro check` reports 126 errors across the site. The ones in files this task
edited are all in `SplitHero.astro` and are pre-existing implicit-`any` on
`scheduleIdle(work)` parameters; the one error this task did clear was
`ts(2306) File 'dotted-surface.js' is not a module`, which disappeared with the
import. The root `typecheck` script is `pnpm -r --parallel typecheck`, which does
not run `astro check` on the root site, so this gate was not previously green.

**Not run:** `pnpm e2e:acceptance`, `pnpm a11y:scan`, `pnpm seo:gate`,
`pnpm lhci:*`. Recorded as `NOT VERIFIED` rather than assumed passing.

---

## 11. What is still not verified

- The 20 dashboard routes at runtime (§7), including its `play()` fix.
- 23 `[id]`-parameterised QC routes with no seeded fixture. Because
  `layout-audit.mjs` skips any route pattern containing `[`, those 23 count
  against **both** QC route coverage and QC template coverage: 53/76 = 69.7% each.
- LCP / INP / CLS before and after.
- `e2e:acceptance`, `a11y:scan`, `seo:gate`, Lighthouse.
- Human UAT, screen readers (VoiceOver/NVDA), real devices, production analytics.
- Whether print media truly hides the video **at runtime**. The source guard
  asserts the `@media print { display: none !important }` rule exists in all four
  background implementations; the harness counts video *elements*, which a CSS
  `display: none` does not remove, so the print pass reports the element as
  present. Source-verified, runtime-unverified.
- Whether the reveal architecture is sound. 170 of 640 template runs still report
  hidden content after the `html.reveal-ready` gate, and that residual is **not**
  a harness artifact — the harness waits up to 6 s for the gate class and then
  sweeps the page in 90%-viewport steps. Logged as `RDX-P0-002`, still open.

## 12. Where this report was wrong before correction

An independent verification pass was run against these documents specifically to
find unsupported claims. It found four, all now fixed above:

1. **"playing"** — the video was paused on 2,184 of 2,184 runs. Real defect,
   diagnosed (`ClientRouter` re-insertion) and fixed (`BAI-BG-VIDEO-002`).
2. **"intrinsic 1600×1200" on all after-runs** — 2,178 runs had `readyState: 0`
   and no intrinsic size to read. Measurement noise reported as verification.
3. **"no regression was introduced"** — `groupSplits` rose 41 → 43.
4. **"818 before shots"** — those images are in `baseline-site/`, a run with
   different harness filters, not in `before-site/`.

The same pass also corrected the audit report's arithmetic (overall 54.1% → 54.3%,
Evidence Confidence 50% → 33.3%) and its QC template coverage (100% → 69.7%,
which had been produced by removing the un-audited templates from the
denominator). Those corrections are recorded in
`REPOSITORY-DESIGN-UX-AUDIT.json` under `metadata.corrections`.

No commit, push or deploy was performed.

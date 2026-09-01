# BRIGHTAI — Repository Design & UX Execution Prompts

Generated from `REPOSITORY-DESIGN-UX-AUDIT.md` (RDX-2026-08-29). Grouped by root
cause, ordered by dependency. Each prompt is self-contained and copy-pasteable
into a fresh session.

**Every prompt inherits these constraints. They are not restated below.**

- Read `AGENTS.md` and `.agents/mind/01-mind-latest.md` before starting; add a
  structured record to `01-mind-latest.md` when finished.
- **No `git commit`, no `git push`, no deploy.** Show `git status` and `git diff`.
- Do not touch `.github/workflows/`, `.env*`, or any secret.
- Do not change RBAC, business rules, API contracts, or the database inside a
  visual or accessibility fix.
- Do not change SEO, canonical URLs or schema unless the prompt is about them.
- Do not add a dependency without documenting why no existing option works.
- Do not delete a file without explicit user confirmation.
- Do not disable, skip or edit a failing test to make it pass. Diagnose it.
- Do not claim success without running the acceptance checks in the prompt and
  pasting their output.
- The background contract is fixed: `1600×1200`, `position: fixed`, centred,
  `object-fit: contain`, `opacity: 1`, `filter: none`, no scrim, no scale/zoom,
  `pointer-events: none`, poster fallback, hidden under `prefers-reduced-motion`
  and in print. `scripts/qa/verify-background-contract.mjs` must stay at 95/95.

**Shared tooling.** `node scripts/qa/route-inventory.mjs` regenerates the route
and template inventory. `node scripts/qa/layout-audit.mjs --label=<name> --app=site
--base-site=<url> [--templates-only] [--shots] [--reduced-motion] [--print]
[--zoom=2]` measures layout and background facts in real Chromium. Audit a
**production build**, never a dev server — both dev servers are broken in this
environment (see the audit's §3).

---

# Tier 1 — P0

## RDX-P0-DASH-BUILD · Unblock the dashboard build

**Objective:** `apps/dashboard` builds and serves so its 20 routes can be audited.
**Closes:** `RDX-P0-001`. **Blocks:** every dashboard prompt below.

**Root cause.** `apps/dashboard/next.config.mjs` declares
`serverExternalPackages: ['@huggingface/transformers', 'onnxruntime-node']` but not
the Sentry / OpenTelemetry chain. Webpack therefore tries to bundle Node built-ins
and fails on `node:crypto`:

```
app/api/firewall/redact/route.ts → lib/firewall/audit/durable.ts
  → lib/observability/sentry.ts → @sentry/nextjs → @sentry/opentelemetry
  → @opentelemetry/instrumentation → require-in-the-middle → node:crypto
```

**In scope:** `apps/dashboard/next.config.mjs` only.
**Out of scope:** removing or reconfiguring Sentry, changing instrumentation
behaviour, upgrading dependencies, touching `lib/observability/`.

**Steps.** Add the Sentry/OpenTelemetry chain to `serverExternalPackages` so Node
resolves it at runtime instead of bundling it. Verify Sentry still initialises —
`instrumentation.ts` must still call `initServerSentry()` on the Node runtime, and
error capture must not silently stop.

**Acceptance.**
- `pnpm --dir apps/dashboard build` exits 0.
- `pnpm --dir apps/dashboard dev` returns HTTP 200 for `/`, `/sign-in`,
  `/dashboard`, and 404 (not 500) for an unknown path.
- `pnpm --dir apps/dashboard typecheck` and `test` are no worse than before.
- Sentry initialisation is confirmed present in the built server output.

**Evidence:** build output, four HTTP status codes, test output.
**Effort:** S · **Regression risk:** medium — this changes how a production app
bundles observability. If Sentry stops reporting, revert the config line; nothing
else was touched.

---

## RDX-P0-REVEAL-ARCH · Stop entrance animation from gating content visibility

**Objective:** no visitor, crawler or assistive technology can ever receive a page
where primary content is present in the DOM, occupies layout space, and renders
nothing.
**Closes:** `RDX-P0-002`. **Depends on:** nothing.

**Root cause.** The design system's reveal pattern is subtractive: the entry state
is `opacity: 0` and visibility is *granted* by JavaScript. `public/js/scroll-reveal.js`
is imported by `public/js/noncritical-init.js` inside `import(url).catch(() => {})`
— every failure is swallowed — and only after `load` plus
`requestIdleCallback(timeout: 2500)`. Elements are then revealed only if they
intersect after the observer boots.

Two mitigations already landed and must be preserved, not reverted:
- `html.reveal-ready` gates the four entry-state blocks in `src/styles/components.css`;
  `initReveal()` sets it as its first action. A never-booting script now leaves
  content visible.
- `.gsap-fade`'s entry state was removed because it revealed on `[data-revealed]`,
  an attribute nothing in the repository sets.

**Still open.** Visibility is still conditional. The root class can be lost across
Astro `ClientRouter` view transitions, the boot delay exceeds 2.5 s, and a reader
who scrolls fast can outrun the observer. Measured: under a slow realistic scroll
all 26 revealable cards on `/about/` reveal and 0 stay hidden; under a fast
programmatic sweep 170 of 640 template runs still report hidden content.

**Required approach.** Invert it. Content is visible in its resting state and the
animation is additive — animate *from* a transform/opacity offset toward the
resting state rather than *to* it. Prefer a CSS-only mechanism (`@starting-style`,
or `animation` with `animation-fill-mode: none` so no state persists on failure)
so no JavaScript is load-bearing. If an observer is still wanted for staggering,
it may only *add* animation, never *remove* invisibility.

**Out of scope:** changing which elements animate, animation durations or easing,
adding an animation library, changing `prefers-reduced-motion` behaviour.

**Constraints.** Respect `prefers-reduced-motion: reduce` (no motion, content
visible). Content must be visible with JavaScript fully disabled — verify with
`--disable-javascript`. Do not introduce a scrim or alter the background contract.

**Acceptance.**
- With JavaScript disabled, `/`, `/about/`, `/services/`, `/pricing/`,
  `/solutions/`, `/kernel/`, `/demo/`, `/trust/` show **0** elements whose
  cumulative ancestor opacity is `< 0.05` while occupying ≥ 12 px of height.
- `node scripts/qa/layout-audit.mjs --label=reveal-fix --app=site --templates-only`
  reports `invisibleContent: 0` and `invisibleContentNodes: 0`.
- Same run under `--reduced-motion` reports `invisibleContent: 0`.
- `groupSplits`, `escapees`, `clipped`, `horizontalOverflow` and `noVideo` do not
  regress against `download/qa/global-bg-audit/verify-site/summary.json`.
- `verify-background-contract.mjs` still 95/95.

**Evidence:** the two harness summaries, plus a full-page screenshot of `/about/`
with JavaScript disabled.
**Effort:** M · **Regression risk:** low — the failure mode of an additive
animation is "no animation", not "no content".
**Rollback:** revert `src/styles/components.css` and `public/js/scroll-reveal.js`;
no markup changes are required by this prompt.

---


## RDX-P0-GUARD-STRENGTH · Make the background guard able to fail

**Objective:** turn `scripts/qa/verify-background-contract.mjs` from a tripwire into
a real gate. **Closes:** `RDX-P3-005`.

An independent review found the guard cannot fail a behavioural regression:

- `const total = pass + failures.length;` derives the denominator from the checks
  that ran, so 95/95 can never become 93/95. Pin an expected count.
- `const src = bgRules || raw;` falls back to scanning the whole file when the
  rule-extraction regex misses, letting `position: fixed` pass from an unrelated rule.
- `width: 1600px` and `height: 1200px` are checked as independent substrings in a
  merged blob, with nothing tying them to one element.
- The scrim check matches the *word* scrim; any differently named full-viewport
  overlay passes.
- The reduced-motion and print checks only prove the at-rule text exists somewhere
  in the file — not that the video is hidden inside it.
- Nothing asserts stacking order or `z-index`, which is the one property whose
  failure visibly breaks every page.
- `<SiteBackground />` is matched with exact spacing, so `<SiteBackground/>` breaks it.

**Add a runtime companion** that asserts, in a real browser: computed
`z-index`/stacking puts the background behind content; the video is `paused: false`
with `currentTime > 0` after load; under `prefers-reduced-motion` the video's
computed `display` is `none` and the poster is visible; under print media the
wrapper's computed `display` is `none`. Parse the CSS rather than grepping it.

**Acceptance.** Deliberately break each contract clause one at a time — set
`object-fit: cover`, drop `pointer-events`, add a full-viewport overlay named
something other than scrim, remove the print rule, pause the video — and show
the guard failing for each. A guard that passes every mutation is not a guard.
**Effort:** M · **Regression risk:** none (test-only).

---

# Tier 2 — Accessibility

## RDX-P1-ZOOM · Reflow at 200% text zoom

**Objective:** meet WCAG 2.2 **1.4.4 Resize Text** and **1.4.10 Reflow**.
**Closes:** `RDX-P1-A11Y-001`.

**Measured baseline** (80 templates × 8 viewports, only the zoom factor changed):

| | default | zoom 200% |
|---|---|---|
| escaping viewport | 20 | **123** |
| clipped | 30 | **88** |
| heading split from group | 10 | **90** |

**Root cause to confirm first, then fix:** fixed-width containers, `ch`-based
measures, and `px` gaps that do not scale. Find them before changing anything —
run the harness with `--zoom=2` and read the reported element names.

**Fix with:** logical properties, `max-inline-size` with fluid fallbacks,
`clamp()`, `min-width: 0` inside grid/flex children, `max-width: 100%` on images
and SVG, and `gap` rather than stacked margins.
**Never:** `zoom`, `transform: scale()`, global font-size reduction, hiding
content, or deleting copy to make it fit.

**Acceptance.** At `--zoom=2`: `escapees ≤ 25`, `clipped ≤ 35`, `groupSplits ≤ 15`,
`horizontalOverflow = 0`. Default-zoom numbers do not regress. No new
`horizontalOverflow` at 320 px CSS width.
**Effort:** L · **Regression risk:** medium — touches shared layout primitives.

---

## RDX-P1-A11Y-EVIDENCE · Produce real accessibility evidence

**Objective:** replace `NOT VERIFIED` with measurements for keyboard, axe and a
screen reader. **Closes:** `RDX-P1-A11Y-002`.

This prompt **gathers evidence and fixes only what it proves**. Do not
speculatively refactor.

**Steps.** Run `pnpm a11y:scan` (axe) across the template set and record every
violation with its WCAG criterion and severity. Tab from the address bar through
`/`, `/contact/`, `/pricing/`, `/demo/`, and QC `/login` + `/dashboard`,
documenting unreachable controls, wrong order, invisible focus and keyboard traps.
Run one screen reader (VoiceOver or NVDA) over the same set and record what is
announced for landmarks, headings, form errors and dialogs. Then fix P0/P1
violations only; log the rest as new `RDX-` issues.

**Acceptance.** An axe report committed under `docs/audits/`, a keyboard traversal
log, a screen-reader log, and a re-run showing every P0/P1 violation closed.
Report the honest pass rate; do not round up.
**Effort:** M · **Regression risk:** low.

---

# Tier 3 — Layout

## RDX-P1-CLIP · Stop clipping information inside cards and tables

**Closes:** `RDX-P1-CLIP` (30 runs). **Worst offenders, measured:**
`span.kernel-activity-item__time`, `span.kernel-activity-item__trace-id` and
`span.kernel-risk-row__value` clipped by `article.kernel-card`; `th` clipped by
`thead`/`tr`; anchors clipped by `section.brightai-raw-internal-links`.

Timestamps and trace ids are truncated with no ellipsis, so information is lost
without any signal. Either let the content wrap, or truncate deliberately with
`text-overflow: ellipsis` **and** a `title`/`aria-label` carrying the full value.
Do not simply widen a fixed card until it happens to fit.

**Acceptance.** `clipped ≤ 5` on `--templates-only`, with each remaining case
listed and justified as intentional. No new `escapees` or `horizontalOverflow`.
**Effort:** M.

## RDX-P1-ESCAPE · Keep content inside the viewport

**Closes:** `RDX-P1-LAYOUT-002` (20 runs). These are elements outside the viewport
with **no scrollable ancestor** — wide tables in scroll wrappers are already
excluded from the count and are correct. Document-level horizontal overflow is
already 0, so nothing here is reachable by scrolling.

**Acceptance.** `escapees ≤ 3` on `--templates-only`, each remaining case
justified. `horizontalOverflow` stays 0 at every viewport including 320 px.
**Effort:** M.

## RDX-P2-SPACING · Fix doubled spacing and empty heading gaps

**Closes:** `RDX-P2-003`, `RDX-P2-004`. `.section__header { margin-block-end: 48px }`
plus `.mt-12` on the following grid yields 96 px where one value was intended.
Ten heading-to-content gaps exceed 200 px with a genuinely empty band — worst
719 px on `/kernel/api/`, 428–492 px on `/`.

Replace stacked child margins with a single `gap` on the section container. Use
`clamp()` where the gap should scale.

**Acceptance.** `groupSplits ≤ 3` on `--templates-only`; no section loses its
intended rhythm at 360 px or 1920 px (compare screenshots).
**Effort:** S.

---

# Tier 4 — Design System hygiene

## RDX-P2-GATES · Make the main site's static-analysis gates green

**Closes:** `RDX-P2-001`, `RDX-P2-002`, `RDX-P3-003`.

Three pre-existing failures, none introduced by the background work:
- `pnpm lint:tokens` fails on raw hex in
  `src/pages/tools/ai-risk-register/index.astro:145` (proven byte-identical to
  `HEAD`). Replace the hex values with tokens; add scale steps if a token is missing.
- `pnpm exec astro check` reports 126 errors. The root `typecheck` script is
  `pnpm -r --parallel typecheck`, which never runs it. Either fix the errors and
  wire it in, or document explicitly why the root site is exempt.
- `style-src-elem` in `scripts/security-headers.mjs` contains `'unsafe-inline'`
  twice. Remove the duplicate; `pnpm headers:check` must stay green.

**Acceptance.** `lint:tokens` exits 0; `astro check` error count is 0 or the
exemption is documented with a rationale; `headers:check` green; no CSP drift.
**Effort:** M.

## RDX-P2-ROUTES · Resolve duplicate route definitions

**Closes:** `RDX-P2-006`. Astro warns that `/services/kpi-dashboard-guide` and
`/services/power-bi-saudi-guide` are each defined twice (with and without a
trailing slash) and that this will become a hard error.

Keep one definition per route, matching `build.format: 'directory'`. Preserve the
canonical URL and add a 301 for the dropped form if it is externally linked — do
not silently change an indexed URL.

**Acceptance.** Zero router collision warnings in `pnpm build`; both URLs still
return 200 or 301 to the canonical form; `pnpm seo:gate` and
`pnpm redirects:check` green.
**Effort:** S.

## RDX-P1-XFO-META · Drop the ineffective `X-Frame-Options` meta tag

**Closes:** `RDX-P1-SEC-001`. `injectSecurityMeta()` in `astro.config.mjs` emits
`X-Frame-Options` as a `<meta http-equiv>`, which browsers ignore and warn about
on all 2,184 measured runs. The real header is set by `patch-server-entry.mjs`, so
removing the meta tag changes no protection.

**Do not** remove the HTTP header. Confirm it is still present on a built response
before and after.

**Acceptance.** Zero `X-Frame-Options may only be set via an HTTP header` console
messages across a `--templates-only` run; `curl -I` still shows the header;
`headers:check` green.
**Effort:** S.

## RDX-P3-DEADCODE · Delete confirmed-dead files (needs user confirmation)

**Closes:** `RDX-P3-001`, `RDX-P3-002`. **Ask the user before deleting anything.**

| File | Why it is dead |
|---|---|
| `src/layouts/BaseLayout.astro.noapp` | 20.5 KB dead layout; the CSS-delivery and reveal-observer regressions were both lost against it |
| `src/components/DottedBackground.astro` | unmounted; replaced by `SiteBackground` |
| `src/scripts/dotted-surface.js` | its canvas and its dynamic import are both gone |
| `src/components/BackgroundGrid.astro` | rendered `<div class="bg-grid">` with no CSS anywhere in the repo |
| `src/layouts/ArabicLayout 2.astro` | stray duplicate from 2026-08-05 that still carries the old `components.css`/`pages.css` imports this task relocated |

Re-prove each is unreferenced immediately before deleting.

**Acceptance.** `pnpm build` exits 0; `verify-background-contract.mjs` 95/95; a
`--templates-only` run shows no metric regression.
**Effort:** S.

---

# Tier 5 — Performance

## RDX-PERF-001 · Measure the background video's real cost

**Objective:** replace an assumption with numbers. **Closes:** `RDX-P2-005`.

`9.mp4` is 7,958,354 bytes — **3.8× the 2 MB page budget** — and now loads on
every visible route. It was kept byte-identical on instruction, so this prompt
does **not** compress or re-encode it. It measures.

**Steps.** Capture LCP, INP and CLS on `/`, `/about/`, `/blog/` and QC `/login`,
on a mid-range mobile profile over throttled 4G, both with the background present
and with it removed locally for comparison. Report the delta. Then evaluate
`preload="metadata"` versus the current `preload="auto"`: measure its effect on
first-frame latency and on LCP, and present the trade-off rather than choosing
unilaterally — `preload` is part of the approved contract.

**Out of scope:** compressing, re-encoding, cropping or shortening the video;
changing its dimensions; adding a scrim; lazy-loading it behind an interaction.

**Acceptance.** A table of LCP/INP/CLS with and without the video, per route and
per profile, from a real Lighthouse or CrUX-style run. No invented numbers. A
written recommendation on `preload` with its measured trade-off.
**Effort:** M · **Regression risk:** none (measurement only, unless `preload`
changes, which requires user sign-off).

---

# Tier 6 — Evidence gaps

## RDX-P1-RBAC-EVIDENCE · Exercise every role and every 403 path

**Closes:** `RDX-P1-RBAC-EVIDENCE`, fills §12 of the audit. Only `admin` was
exercised, and only for rendering.

Build a `Role × Route × View/Create/Edit/Approve/Delete/Export` matrix for
Visitor, Employee, Supervisor, Manager, Lab roles, Admin and dashboard
tenant-user, by **observation** — log in as each role and record what is reachable.

**This prompt must not change a single permission.** If navigation and server
authorisation disagree, record it as a new `RDX-` finding with evidence and stop.
Hiding a link is not access control; verify the server rejects the request too.

**Acceptance.** A completed matrix with no `NOT VERIFIED` cells for roles that
have seeded credentials; every 403 path screenshotted; any mismatch filed as a new
issue rather than fixed here.
**Effort:** L · **Regression risk:** none if the no-change rule holds.

## RDX-QC-COVERAGE · Close the 23 uncovered QC routes

**Closes** the QC route-coverage gap (53/76 = 69.7%). The uncovered routes are
`[id]`-parameterised detail and print views with no seeded fixture id.

Seed deterministic fixtures — a task, finding, test, retest, product, template,
equipment, calibration, document, change request, maintenance record — and re-run
the harness with `--storage-state`. Fixtures must be deterministic; no
timestamp-dependent or network-dependent data.

**Acceptance.** QC Route Coverage = 100% (76/76) with the same clean metrics
already achieved on 424 runs: 0 overflow, 0 escapees, 0 clipped, 0 scrims,
0 contract violations, 1 video per run.
**Effort:** M.

## RDX-DASH-AUDIT · Audit the dashboard (blocked)

**Depends on:** `RDX-P0-DASH-BUILD`. Once the dashboard builds, run the harness
over all 20 routes at all eight viewports plus reduced motion, print and 200% zoom,
and verify the background contract at runtime. `apps/dashboard/components/SiteBackground.tsx`
and its CSS module are already implemented and pass the source guard; only runtime
verification is missing.

Also check what the audit could not: KPI definitions, time-period controls, units,
legends, axes, empty/loading/error states, drill-down, export, print and mobile
presentation on `/dashboard`, `/audit`, `/settings/usage` and `/settings/billing`.
`apps/dashboard` has no `error.tsx` or `global-error.tsx` and no 500 page — log
that as a finding.

**Acceptance.** Route and Template Coverage = 100% for the dashboard;
`noVideo = 0`; 0 background-contract violations; a findings list for the data-viz
items above.
**Effort:** M.

---

# FINAL REPOSITORY DESIGN & UX VERIFICATION

Run this only after every prompt above is closed or explicitly deferred with a
reason. It re-derives the verdict from scratch; it does not trust this document.

**Steps.**

1. Rebuild every workspace: root, `apps/qc-task-manager`, `apps/dashboard`. All
   three must exit 0.
2. Regenerate the inventory (`scripts/qa/route-inventory.mjs`). If the route or
   template count changed, explain why before continuing.
3. Serve each app from its production build. Never audit a dev server.
4. Re-run `scripts/qa/layout-audit.mjs` for all three apps at **100% of routes**
   × 8 viewports, plus `--reduced-motion`, `--print` and `--zoom=2` on
   `--templates-only`, with `--shots`.
5. Re-run every gate: `verify-background-contract.mjs`, `bg:verify`, `test`,
   `test:ui-consistency`, `typecheck`, `lint`, `lint:tokens`, `headers:check`,
   `e2e:acceptance`, `a11y:scan`, `seo:gate`, `git diff --check`.
6. Measure Core Web Vitals per `RDX-PERF-001`.
7. **Recompute every percentage from raw counts.** Do not copy a number from this
   audit. Markdown and JSON must agree arithmetically.
8. Re-open each closed issue and confirm the fix holds — and confirm the defect
   did not move to another route. For every count that improved, name the routes
   that changed.
9. Diff against `download/qa/global-bg-audit/verify-site/summary.json` and
   `before-site/summary.json`. Any metric that got worse is a regression and must
   be explained or reverted.
10. Issue `GO`, `CONDITIONAL GO` or `NO-GO` with the measurable reason for each.

**Refuse to issue GO if** any workspace fails to build · any `NOT VERIFIED` was
converted to a pass without new evidence · Human Validation Coverage is still 0%
while the verdict claims UX quality · any percentage in the Markdown disagrees
with the JSON · a before/after comparison is shown for a route with no captured
baseline.

**Do not** commit, push or deploy. Update `.agents/mind/01-mind-latest.md` with
the recomputed figures and the final verdict.

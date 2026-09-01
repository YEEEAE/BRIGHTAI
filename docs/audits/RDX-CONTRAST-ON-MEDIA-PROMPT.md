# RDX-CONTRAST-ON-MEDIA · Guarantee text contrast over the background video, on every page

**Objective:** every piece of text on every visible route sits on a surface with a
**known** alpha, so its contrast ratio is a fixed, computable number instead of a
per-frame accident. No text may sit bare on the background video.

**Closes:** the reported symptom that section text, hero copy, trust rows and
paragraphs are hard to read against `9.mp4`.

---

## Why this is not an ordinary contrast fix

`9.mp4` is 301 frames of isometric line-art. Behind any single glyph the
background luminance swings from near-black to pure white as the loop plays. A
contrast measurement taken from one screenshot is therefore meaningless — it
certifies one frame, not the page.

**So do not measure contrast against the video.** Give text a surface whose alpha
you control, then compute the worst case analytically: composite the surface over
`#000000` and over `#ffffff` and require both to pass. That is the only claim that
holds for all 301 frames.

Worst-case ratios for `rgba(10,16,32,α)` over a pure-white frame, already computed:

| Text token | α = 0.80 | α = 0.86 | α = 0.90 |
|---|---|---|---|
| `--text-primary` `#f1f5f9` | 9.46 | 11.85 | 13.45 |
| secondary `rgba(255,255,255,.85)` | 7.34 | 9.19 | 10.44 |
| `--text-muted` `#94a3b8` | 4.04 ✗ | 5.06 ✓ | 5.75 ✓ |
| brand teal `#4ba69c` | 3.57 ✗ | **4.47 ✗** | 5.08 ✓ |

**Use α = 0.90.** At 0.86 the brand teal lands at 4.47:1 — 0.03 short of AA for
normal-size body text, which is exactly the kind of near-miss that gets waved
through. 0.90 clears every token with margin and still lets 10% of the video read
through, so the atmosphere survives. If a designer insists on 0.86, teal must be
restricted to large or bold text only, and that restriction must be enforced by
the verification script, not by a comment.

---

## What already exists in the working tree — start from here, do not redo it

1. **`src/styles/tokens.css`** defines the surface contract:
   ```css
   --surface-on-media: rgba(10,16,32,0.86);
   --surface-on-media-blur: blur(14px) saturate(140%);
   --surface-on-media-border: rgba(255,255,255,0.09);
   --surface-on-media-radius: 1.25rem;
   ```
   **Your first change:** raise the alpha to `0.90` and update the comment's
   worked example (`rgb(44,49,63)` becomes `rgb(34,40,54)`).

2. **`src/styles/components.css`** already applies it to `.section__header` and
   `.inner-section__header`, including a `prefers-reduced-transparency: reduce`
   branch that swaps to a fully opaque `var(--bg-surface)`. Reuse that exact
   pattern everywhere else — including the reduced-transparency branch. A thinner
   surface is not an acceptable fallback; the point is legibility.

Everything below is still to do.

---

## Scope — every page family, not just the homepage

Audit each family in a real browser and give a surface to every text block that
currently paints straight onto the video. Confirmed bare blocks (zero `background`
declarations today):

| Family | Blocks with no surface |
|---|---|
| Homepage hero | `.split-hero__main`, `.split-hero__lead`, the eyebrow/chip, the trailing microcopy line |
| Homepage sections | `.home-evidence-label`, `.home-evidence-value`, `.home-comparison-table`, `.home-flow-*` |
| Trust row | `.home-trust__logos`, `.home-trust__badges` (currently a fading gradient that reaches 0 alpha — not a surface) |
| Citable definition | `.home-citable-definition` (same fading-gradient problem) |
| Inner pages | `.page-hero__title`, `.page-hero__description`, `.inner-section__lead` |
| Blog / docs | the article body wrapper and `.prose` |
| Legal / policy | `.legal-page` body |
| Kernel (21 routes) | `.k-section-title`, `.k-section-intro`, `.k-unit-card__*` |
| Standalone `<html>` pages | `answer/[slug]` (`.answer-hero`, `.answer-body`), `lp/[slug]` (`.lp-hero`, `.lp-body`) — these own their own `<style>`, so they need the tokens too |
| Error pages | `src/pages/404.astro`, `public/500.html` |
| `apps/qc-task-manager` | `PageHeader.astro` — its `type-page-title` H1, eyebrow and subtitle sit directly on the video with no surface |
| `apps/dashboard` | headings outside cards **(source-only — the app does not build; see `RDX-P0-DASH-BUILD`)** |

Work from `download/qa/global-bg-audit/route-inventory.json` (369 visible routes,
176 templates) so nothing is missed. Every template must be opened, not inferred.

---

## Hard constraints

- **No global scrim.** The background contract forbids any fixed full-viewport
  layer over the video. Surfaces are per-block and live in normal flow.
  `scripts/qa/verify-background-contract.mjs` must stay at 95/95.
- **Do not touch the video**: no re-encode, resize, crop, `opacity`, `filter`,
  `mix-blend-mode`, or `object-fit: cover`. It stays 1600×1200, `opacity: 1`,
  `filter: none`.
- **Logical properties only** — `padding-inline`, `margin-inline-start`,
  `inset-inline-*`. The site is RTL-first with 7 LTR routes; both must be correct.
- **`prefers-reduced-transparency: reduce`** → opaque `var(--bg-surface)`,
  `backdrop-filter: none`.
- **`prefers-reduced-motion: reduce`** → unchanged behaviour; the poster already
  replaces the video and the surfaces stay.
- **`@media print`** → surfaces must not print as dark boxes over black text.
  Force `background: transparent` and `border-color: transparent` in print.
- **No new dependency.** Tokens plus CSS only.
- **Do not reduce font sizes, hide content, or delete copy** to solve contrast.
- **Do not change** RBAC, business rules, API contracts, schema, SEO, canonicals
  or schema.org output.
- **No `git commit`, no `git push`, no deploy.**

## Performance guard

`backdrop-filter` on many simultaneous elements is expensive. Apply it only to
blocks that actually overlap the video, never to elements already inside an opaque
card, and never to a scrolling container's every row. If a template ends up with
more than ~8 blurred surfaces in one viewport, drop `backdrop-filter` there and
raise the alpha to 0.94 instead — same legibility, no compositing cost.

---

## Deliverable: a verification script that can fail

Create `scripts/qa/verify-contrast-on-media.mjs`. It must:

1. Parse `--surface-on-media` out of `tokens.css` — do not hardcode the alpha.
2. Composite that surface over `#000000` **and** `#ffffff`.
3. For every text token used on a media-backed surface (`--text-primary`,
   `--text-secondary`, `--text-muted`, brand teal, link colour, eyebrow colour),
   compute the WCAG 2.x ratio against both composites.
4. Fail if any pair is below **4.5:1** for normal text or **3:1** for text ≥ 18.66px
   bold or ≥ 24px. Print the actual ratio for every pair — pass or fail.
5. Assert that the surface rule set includes the reduced-transparency and print
   branches, and that no rule introduces a `position: fixed` full-viewport layer.
6. Wire it into `package.json` and into the same gate chain as
   `verify-background-contract.mjs`.

Then extend `scripts/qa/layout-audit.mjs` with a runtime check: for every text node
taller than 12px, walk up to the nearest ancestor with a non-transparent
`background-color`; if that walk reaches `<body>` without finding one **and** the
element overlaps the background layer's box, record it. Add
`bareTextOnMedia` to the summary. The target is **0** on all 640 template runs.

---

## Acceptance — numeric, not visual

- `node scripts/qa/verify-contrast-on-media.mjs` exits 0 with every ratio printed.
- `node scripts/qa/layout-audit.mjs --label=contrast --app=site --templates-only`
  reports `bareTextOnMedia: 0`.
- Same run with `--reduced-motion`, `--print`, and `--zoom=2`: `bareTextOnMedia: 0`,
  and `escapees` / `clipped` / `horizontalOverflow` no worse than
  `download/qa/global-bg-audit/verify-site/summary.json`.
- `verify-background-contract.mjs` still 95/95; `bg:verify` still 7/7 identical.
- `pnpm build` and `pnpm --dir apps/qc-task-manager build` exit 0.
- `pnpm test` 38/38; qc `test:ui-consistency` 207/207; qc `typecheck` 0 errors.
- `pnpm headers:check` green; `git diff --check` clean.
- Full-page screenshots at 360×800, 1440×1000 and 1920×1080 for the homepage, one
  inner page, one blog post, one kernel page, `answer/*`, `lp/*`, `404`, `500`,
  and qc `/login` — before and after, from the **same** harness flags.

**Evidence to paste:** the contrast table with real ratios, the four harness
summaries, and the before/after screenshot pairs. A screenshot alone is not
evidence of contrast — captures use `animations: 'disabled'` and show one frame.

---

## Regression risk and rollback

Medium. This touches shared primitives (`.section__header`, `.page-hero__*`,
`.prose`) that appear on all 273 main-site routes, so a padding mistake shows up
everywhere at once. Check 360×800 as carefully as 1920×1080 — added
`padding-inline` on a narrow viewport is the likeliest way to introduce
`horizontalOverflow`, which is currently **0** and must stay 0.

Rollback is one revert of `tokens.css` + `components.css` + `pages.css`; no markup
changes are required by this prompt, and none should be made unless a template has
no wrapper to attach a surface to.

---

## Close-out

Add a structured record to `.agents/mind/01-mind-latest.md` with the measured
ratios, the chosen alpha and why, the template count covered, and anything left
unverified. Do not commit, push or deploy.

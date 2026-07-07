# RHYMING-PATTERNS.md

**The 6 rhyming patterns that make every page on BrightAI feel like the same product.**

This is the playbook. It is short on purpose — every rule is one paragraph, every recipe is one CSS snippet, and the forbidden list is the same as the report's §6.

> Use this file when you ship a new page, a new section, or a new component. The rule is: **if you cannot point to one of the six patterns below, do not introduce a new shape.**

---

## 1. The Six Patterns

| # | Pattern | One-liner |
|---|---|---|
| 1 | **Shape language** | Cards 12 px, content blocks 16 px, marketing CTAs 24 px, buttons 8 px, glow buttons 16–24 px, chips pills. |
| 2 | **Glow signature** | One cyan (`rgba(6,182,212,…)`), one recipe, on every interactive surface. |
| 3 | **3-dot ambient separator** | One cyan dot, 4 px, between every pair of top-level sections. |
| 4 | **Dotted texture** | The same 32 × 32 px radial-dot grid recurs on card edges, section dividers, and footer. |
| 5 | **12° corner tilt** | Every decorative corner shape (sparkles, accents) is rotated 12° clockwise. |
| 6 | **Icon family** | One sprite: `public/icons.svg#mdi-*`. No exceptions. |

---

## 2. Pattern 1 — Shape Language

**The corner of a surface is a sentence about what kind of surface it is.** Pick the right corner from the table; never invent a new one.

| Surface class | Token | Value | CSS |
|---|---|---|---|
| Default card | `--radius-lg` | 12 px | `border-radius: var(--radius-lg);` |
| Content block (feature, metric, pricing, testimonial) | `--radius-xl` | 16 px | `border-radius: var(--radius-xl);` |
| Marketing CTA panel, glass panel | `--radius-2xl` | 24 px | `border-radius: var(--radius-2xl);` |
| Button (base) | `--radius-md` | 8 px | `border-radius: var(--radius-md);` |
| Button (glow / WhatsApp) | `--radius-xl` or `--radius-2xl` | 16 / 24 px | `border-radius: var(--radius-xl);` or `var(--radius-2xl);` |
| Chip / badge / status dot | `--radius-full` | 9999 px | `border-radius: var(--radius-full);` |
| Input / field | `--radius-md` | 8 px | `border-radius: var(--radius-md);` |
| Icon tile (48 × 48) | `--radius-lg` | 12 px | `border-radius: var(--radius-lg);` |
| Code chip (inline `<code>`) | `--radius-sm` | 6 px | `border-radius: var(--radius-sm);` |

### Forbidden

- `border-radius: 9999px` on anything that is not a chip, badge, or status dot.
- `rounded-md` (Tailwind class) on a card surface.
- `rounded-3xl` on a card surface — the design system does not have a 32 px corner.
- Hard-coded pixel values (`8px`, `16px`, `12px`) when a token exists.

### How to apply

```css
.my-new-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);   /* 12 px — default card */
  padding: var(--space-6);
}
```

If you are tempted to write a different number, the answer is to use a different *token*, not a different number.

---

## 3. Pattern 2 — Glow Signature

One colour, one recipe. The brand cyan is `rgba(6, 182, 212, …)`. Every glow in the system is built from it.

### 3.1 The five recipes

| Recipe | Use | Snippet |
|---|---|---|
| **Soft halo (rest)** | glow buttons, featured pricing | `box-shadow: 0 0 20px rgba(6,182,212,.30);` |
| **Lift halo (hover)** | cards, glow buttons, large CTAs | `box-shadow: 0 0 28px -8px rgba(6,182,212,.18); border-color: rgba(34,211,238,.35);` + `translateY(-2px … -4px)` |
| **Breathe pulse (attention)** | glow buttons at rest, before hover | `animation: glow-breathe 3.6s var(--ease-in-out) infinite;` (existing keyframes) |
| **Focus ring** | any interactive element | `outline: 2px solid var(--interactive-primary); outline-offset: 2px;` |
| **Field focus** | inputs only | `box-shadow: 0 0 0 3px rgba(6,182,212,.15);` |

### 3.2 Hover-lift cadence

| Element | `translateY` |
|---|---|
| Glow button, WhatsApp button | `-2px` |
| Default card | `-3px` |
| Feature card | `-3px` |
| Pricing card | `-4px` |

The 1 px cadence is the rhyme. Do not skip from `-2px` to `-5px` on a new component.

### 3.3 How to apply

```css
.btn--glow:hover {
  box-shadow:
    0 0 32px rgba(6, 182, 212, 0.55),
    0 0 0 1px rgba(255, 255, 255, 0.08) inset;
  transform: translateY(-2px);
  filter: brightness(1.08);
  animation: none;     /* stop the breathing on hover */
}
```

### 3.4 Forbidden

- A new glow colour (no purple, no red, no white). The single exception is `.wa-btn` green halo (`rgba(37,211,102,.3)`) for the WhatsApp brand affordance.
- A new glow recipe. If the five above don't cover your case, the surface is probably not interactive.
- Lift > `-4px`. Anything bigger feels jumpy next to the rest of the system.

---

## 4. Pattern 3 — The 3-Dot Ambient Separator

**One cyan dot, between every pair of top-level sections.**

### 4.1 Markup

```html
<div class="ambient-separator" aria-hidden="true">
  <span class="ambient-separator-node"></span>
</div>
```

The node is a 4 × 4 px circle, cyan-500 at 20 % alpha, with a 40 px halo at 10 % alpha. The wrapper is `display: flex` centered horizontally; it is decorative only (`aria-hidden`).

### 4.2 When to insert

Insert exactly once, between any two adjacent `<section>` elements that are not a child of another section. Do not insert inside a card. Do not insert inside the footer.

### 4.3 Forbidden

- A second, third, or fourth node inside one separator (it is **one** dot, not three).
- A different colour.
- A line, a wave, a slash, a star, a chevron. The system has a separator; it is a dot.
- Removing `aria-hidden` — the dot is decoration, screen readers ignore it.

---

## 5. Pattern 4 — Dotted Texture

**The same 32 × 32 px radial-dot grid recurs in three places: card edges, section dividers, footer.**

### 5.1 Recipe

```css
background-image: radial-gradient(rgba(148, 163, 184, 0.15) 1px, transparent 1px);
background-size: 32px 32px;
```

### 5.2 Where it lives

| Location | Implementation |
|---|---|
| Card edges / glass panels | `<DottedBackground class="dotted-bg--inset" />` (the `DottedBackground.astro` component, fine + coarse layers with top/bottom fade mask) |
| Section dividers | mount `<DottedBackground />` once at the section root, `position: absolute; inset: 0; pointer-events: none; z-index: 0;` |
| Footer | mount a final instance with `dotted-bg--bottom` mask anchor behind `.footer__grid` |

### 5.3 How to apply

```astro
---
import DottedBackground from "~/components/DottedBackground.astro";
---

<section class="relative">
  <DottedBackground />
  <!-- section content here, with z-index: 1 on the content layer -->
</section>
```

### 5.4 Forbidden

- A different `background-size` (no 16 px, no 48 px, no 24 px — the system dot is 32 px).
- A different dot colour (no pure white, no pure black, no brand cyan).
- Dot density above `rgba(148,163,184,.15)` — it stops being subtle and starts competing with text.
- A `repeating-linear-gradient` substitute — the *radial* dot is the rhyme.

---

## 6. Pattern 5 — The 12° Corner Tilt

**Every decorative corner shape (sparkles, accents, the 4-point BrightStar satellites) is rotated 12° clockwise.**

### 6.1 Recipe

```css
.deco-corner {
  transform: rotate(12deg);
  transform-origin: center;
}
```

### 6.2 Where to apply

- `BrightStar.astro` — the four satellite sparkles around the central shield.
- `DottedBackground.astro` — the four `.dotted-bg__anchor--*` corner accents.
- Any new SVG corner ornament.

### 6.3 Forbidden

- 15°, 18°, 22°. The angle is **12°**, not "around 12°."
- A counter-clockwise rotation on a right-hand corner. Mirroring is allowed only when the shape is mirrored along with it.
- A 0° rotation "for now, I'll add it later." The tilt is the rhyme; un-tilted corners look like an error.

### 6.4 Note — this is *not* the hero panel 3D tilt

`SplitHero.astro` has a dynamic mouse-tilt that ranges ±6° and is killed on reduced-motion and on touch. That is a different system. The 12° rule applies only to **static** decorative corner shapes.

---

## 7. Pattern 6 — Icon Family

**One sprite. One name space.**

### 7.1 The only legal icon tag

```html
<svg class="icon" aria-hidden="true" width="1em" height="1em">
  <use href="/icons.svg#mdi-shield"></use>
</svg>
```

…or via the helper component:

```astro
<Icon name="mdi:shield" class="w-5 h-5" />
```

### 7.2 Forbidden

- `<iconify-icon icon="...">` (deprecated; the sprite replaced it).
- `lucide-*`, `heroicons-*`, `font-awesome`, `feather-*`, `tabler-*`.
- Inline `<svg>` definitions that bypass the sprite.
- Hard-coded `<path>` for an icon that already exists in `public/icons.svg`.

### 7.3 How to add a new icon

1. Add the icon's SVG body to `public/icons.svg` with `id="mdi-<kebab-name>"`.
2. Run `node scripts/build-icon-sprite.mjs` (if it is not a static file).
3. Use `<Icon name="mdi:<kebab-name>" />`.

### 7.4 Self-check

`grep -rn "iconify-icon\|lucide-\|heroicons-\|font-awesome" src/ public/` should return **zero matches**. If it does not, that is a P1 bug.

---

## 8. The Quick Test (for any new page)

Before you ship a new page, run through this list. If you cannot tick all six, the page is not ready.

- [ ] **Shape:** every card uses `var(--radius-lg)` or `var(--radius-xl)`, never a hard-coded value.
- [ ] **Glow:** every interactive surface that hovers uses one of the five recipes. No new colour.
- [ ] **Separator:** every two adjacent top-level sections has exactly one `.ambient-separator`.
- [ ] **Texture:** at least one `<DottedBackground />` mounted behind a section.
- [ ] **Corner tilt:** every decorative corner SVG has `transform: rotate(12deg)`.
- [ ] **Icons:** every icon resolves to `/icons.svg#mdi-*`.

If you tick all six, the page will look and feel like every other page on the site, even before the user reads a word.

---

## 9. The Forbidden List (read this twice)

The forbidden list is the same as the report's §6. It is short, by design.

1. **No copy change.** This file and the parent report do not, and must not, change any text on the site.
2. **No new shape.** If the six patterns do not cover your surface, you are probably designing the wrong surface.
3. **No new colour.** Cyan halo, white text, dark surface. Green halo is reserved for the WhatsApp affordance.
4. **No new glow recipe.** Use one of the five in §3.1.
5. **No pattern that harms reading.** A `text-shadow` on body copy is a bug. A `text-shadow` on a hover link is fine. The line is the *target* of the effect, not the *size* of the effect.
6. **No 32 px corner.** The system stops at 24 px (`--radius-2xl`). If you think you need 32 px, you probably need a different *shape*, not a bigger corner.

---

*End of RHYMING-PATTERNS.md.*

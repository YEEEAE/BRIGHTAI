# QC Task Manager — UI Design System

> **Version:** 2.0 · **Status:** Active — applies to every user-facing screen.
> **Scope:** `apps/qc-task-manager/` (Astro SSR + Tailwind + React islands). The application UI is **English only**.
> **Rule:** a screen that cannot follow this system must document why, next to the deviation.

This is a small, deliberately boring system. Internal enterprise UI: clarity over decoration,
calm by default, problems prominent when they exist.

---

## 1. Foundations

### 1.0 Canonical token tiers

Every new or edited visual rule uses one of three tiers, in order: foundation
custom properties in `global.css`, semantic aliases in `tailwind.config.mjs`, then
the component recipe that owns the pattern. Raw Tailwind palettes, arbitrary spacing,
and ad-hoc shadows are legacy-only and are never acceptable in a shared primitive.

| Foundation family | Semantic roles | Rule |
| --- | --- | --- |
| Typography, spacing, radius, border, elevation, icons, containers, breakpoints, motion, focus | `content`, `surface`, `border`, `accent`, `neutral`, `success`, `warning`, `danger`, `info`, `disabled`, `overlay`, `glass`, `chart` | Components consume semantic roles only. |
| Status | default/neutral, primary/accent, secondary/content-secondary, success, warning, danger, info, disabled | Status includes visible text; color is never the only signal. |
| Data visualisation | `chart-primary`, `chart-secondary`, `chart-success`, `chart-warning`, `chart-danger` | Chart colors are not reused as UI workflow status. |

`--color-overlay` and `--color-glass` are reserved for legitimate layered surfaces;
they are not a substitute for contrast. The default product surface remains opaque.

### 1.0 Semantic token contract

The visual language has three tiers: the Tailwind palette is the primitive tier, CSS custom
properties in `src/styles/global.css` are the semantic tier, and component class maps are the
component tier. New or edited shared components use semantic aliases (`surface-*`, `content-*`,
`border-*`, `accent`, `focus`, and status roles) rather than applying raw palette values.

| Role | Tailwind alias | Current meaning |
| --- | --- | --- |
| Page / surface / muted surface | `surface-page` / `surface` / `surface-muted` | Canvas, cards, quiet fills |
| Border / strong border | `border` / `border-strong` | Default and emphasized separation |
| Primary / secondary / muted text | `content` / `content-secondary` / `content-muted` | Text hierarchy and metadata |
| Accent / focus | `accent`, `accent-hover`, `focus` | Primary action, links, keyboard focus |
| Status roles | `success-*`, `warning-*`, `danger-*`, `info-*` | State communication |

Spacing uses the constrained `qc-*` scale (`qc-1` = 4px through `qc-16` = 64px), radius
uses `qc-sm`, `qc-md`, `qc-lg`, and `qc-pill`, and motion uses `qc-fast` / `qc-standard`.
Typography roles are available as `.type-page-title`, `.type-page-eyebrow`,
`.type-page-subtitle`, `.type-section-heading`, `.type-card-heading`, `.type-body`,
`.type-secondary`, `.type-caption`, and `.type-data-id`; `qc-focus` is the shared keyboard
focus contract. Existing Tailwind utilities remain supported for compatibility while routes
are migrated incrementally.

### 1.1 Typography scale

| Token | Classes | Used for |
| --- | --- | --- |
| `page-title` | `text-2xl font-semibold tracking-tight text-slate-900` | One H1 per page (via `PageHeader`) |
| `page-eyebrow` | `text-xs font-semibold uppercase tracking-wide text-brand-600` | Section context above the H1 (via `PageHeader`) |
| `page-subtitle` | `mt-1 max-w-3xl text-sm text-slate-600` | Supporting description under the H1 |
| `section-heading` | `text-base font-semibold text-slate-900` | Card/section headings (h2) |
| `card-heading` | `text-sm font-semibold text-slate-900` | Inner card blocks |
| `body` | `text-sm text-slate-700` | Table cells, form text, default content |
| `secondary` | `text-sm text-slate-600` | Descriptions, helper text |
| `caption` | `text-xs text-slate-500` | Timestamps, metadata, table footers |
| `data-id` | `font-medium text-slate-900` (+ `tabular-nums` when columns align) | Record identifiers (Test #, LOT, codes) |

Rules: no arbitrary font sizes (`text-[13px]` etc.) on new code. H1 is unique per page. Timestamps
in tables use `caption`; record identifiers never render smaller than `text-sm`.

### 1.2 Spacing rhythm

| Context | Standard |
| --- | --- |
| Page container | `max-w-6xl px-4 py-8` (owned by `BaseLayout` — pages never add a second wrapper) |
| Vertical rhythm between page blocks | `space-y-6` |
| Card padding | `p-5` standard · `p-4` dense/toolbars · `p-6` empty states / hero cards |
| Table cell padding | `px-4 py-2.5` (th and td alike) |
| Form field spacing | `grid gap-3` (toolbar grids) / `space-y-4` (stacked forms) |
| Button group gap | `gap-2` (inline) · `gap-3` (page-level action rows) |
| Header → content | first block after `PageHeader` sits in the page `space-y-6` flow |

### 1.3 Radius scale

| Token | Classes | Used for |
| --- | --- | --- |
| small | `rounded-md` | inputs, selects, pagination items, small inline controls |
| medium | `rounded-lg` | buttons, banners, filter toolbars, dropdown panels inner items |
| large | `rounded-xl` | cards, tables-as-panels, dialogs, nav card |
| pill | `rounded-full` | status pills and badges only |

Never mix `rounded-2xl` or arbitrary radii. Nested radius follows the parent (control inside a
`rounded-xl` card uses `rounded-md`/`rounded-lg`).

### 1.4 Shadow & depth

- Cards: `shadow-sm` at most. Shadows never replace borders — a card is `border border-slate-200` first.
- Overlays only (dialogs, dropdowns): `shadow-lg`.
- No glow, no colored shadows, no marketing elevation. If a hierarchy needs more depth, use
  spacing and heading weight, not bigger shadows.

### 1.5 Focus & interaction states

- **One focus scheme everywhere:** `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600`
  (destructive: `outline-red-700`). Legacy `focus:ring-*` classes are not used in new/edited code.
- Hover: `hover:bg-*` surface shift only. No scale/translate on operational controls.
- Disabled: `opacity-50` + `cursor-not-allowed` + `aria-disabled` (or native `disabled`).
- Loading (buttons): disabled + label swap to an explicit gerund ("Submitting…", "Saving…").
- Transitions: named properties only (`transition-colors` or `transition-shadow`) where feedback
  helps; never `transition-all`. Operational controls and data cards do not move on hover. Motion
  uses `duration-qc-fast`/`duration-qc-standard`/`duration-qc-moderate` and the shared easing tokens, with a 240ms maximum
  for routine UI feedback. `prefers-reduced-motion` is globally honored (see `src/styles/global.css`).

### 1.6 Motion language

Motion is reserved for feedback and state comprehension. High-frequency keyboard and data-entry
flows stay immediate; occasional surfaces may use a short color or shadow transition. The current
system uses 120ms for fast feedback, 180ms for standard feedback, and 240ms for moderate entry, never animates layout
dimensions, and never uses hover translate/scale, decorative loops, parallax, page entrance motion,
or animated KPI values. Reduced-motion users receive the same state change without movement.

---

## 2. Color semantics

Brand is the existing `brand-*` (blue) scale. Neutrals are the Tailwind `slate` scale. One gray
family, one accent. Semantics:

| Tone | Soft pill (default) | Border/banner | Means |
| --- | --- | --- | --- |
| `neutral` | `bg-surface-muted text-content-secondary ring-border` | `border-border bg-surface` | No action or unknown |
| `info` | `bg-info-soft text-info ring-info-border` | `border-info-border bg-info-soft text-info` | Informational or newly available |
| `pending` | `bg-warning-soft text-warning ring-warning-border` | `border-warning-border bg-warning-soft text-warning` | Waiting, in progress, verification |
| `success` | `bg-success-soft text-success ring-success-border` | `border-success-border bg-success-soft text-success` | Accepted, valid, compliant, complete |
| `warning` | `bg-warning-soft text-warning ring-warning-border` | `border-warning-border bg-warning-soft text-warning` | Attention required |
| `danger` | `bg-danger-soft text-danger ring-danger-border` | `border-danger-border bg-danger-soft text-danger` | Failed, rejected, overdue, critical |
| `blocked` | `bg-border text-content-secondary ring-border-strong` | — | Archived, withdrawn, void, cancelled, disabled |

Task status labels and priority formatting remain domain-owned for compatibility, but visible task
status badges now delegate to `StatusPill` through the `task` adapter. Chart colors remain a
separate visualization concern and must not be reused as UI status tokens.

**Status never relies on color alone:** every status pill renders its text label (and status dots
are always paired with text). Emoji/dots are decorative (`aria-hidden`).

---

## 3. Components (primitives)

Shared primitives live in `src/components/ui/`. Audit existing components before creating new ones;
`EmptyState.astro`, `StatusBadge.astro`, `QcStatusBadge.astro`, `LabDocumentStatusBadge.astro` and
`LabActionButton.astro` remain valid per-domain consumers of the same rules.

### 3.1 PageHeader

```astro
<PageHeader eyebrow="QC Laboratory — Testing" title="Laboratory Test Register"
            description="Searchable register of all AIR and VACUUM laboratory tests.">
  <fragment slot="actions"> …buttons… </fragment>
</PageHeader>
```

Owns: eyebrow + H1 (`text-2xl`) + optional description + right-aligned responsive action row
(`flex-wrap items-end justify-between gap-4`). Every top-level page uses it — no hand-rolled
`<header>` blocks. Breadcrumbs render above it (`Breadcrumbs.astro`, lab pattern) — detail/register
pages inside a section must include them.

Migration note: older hand-rolled headings remain compatible while routes are migrated in
risk-ranked batches. New top-level screens use `PageHeader`; auth, print, and special
detail/error headers are documented exceptions. Do not delete legacy markup until its route
has adopted the primitive and its route-level tests pass.

### 3.2 Buttons (`AppButton`)

| Variant | Look | Use for |
| --- | --- | --- |
| `primary` | `bg-brand-600 text-white hover:bg-brand-700` | One per view: Save, Create, Submit for Review, Approve, Apply filters |
| `secondary` | `border border-slate-300 bg-white text-slate-700 hover:bg-slate-50` | Edit, Export, Back, Cancel, Save Draft |
| `tertiary` | plain text `text-brand-700 hover:underline` (or quiet slate) | Low-frequency inline actions, "clear all" |
| `destructive` | `bg-red-700 text-white hover:bg-red-800` | Delete/Void/Archive — never beside a primary in the same group; lives in a separate danger zone or overflow |
| `link` (icon-only) | inline icon button | Row actions — MUST have `aria-label` + `title`, min 40px target |

Sizes: `md` (default `px-4 py-2 text-sm`, min-height 40px; standalone page CTAs get `min-h-11`
44px like `LabActionButton`) and `sm` (`px-2.5 py-1.5 text-xs`) for dense table rows.

Placement rules:

- Create/edit forms: `[Cancel] [Save Draft] [Submit for Review]` — primary right-most.
- Detail pages: normal actions together in the header; destructive actions separated
  (danger zone block or right-isolated group), never interleaved: `[Edit] [Print] [Approve] ··· [Void]`.
- Labels are verbs with context: "Submit for Review", "Approve Test", "Add Equipment",
  "Generate PDF" — not bare "Submit"/"OK".
- Disabled buttons keep their label (no label swap to "Disabled").

### 3.3 StatusPill

```astro
<StatusPill status="APPROVED" />            <!-- central map: tone + label -->
<StatusPill tone="warning" label="Hold" />  <!-- explicit escape hatch -->
```

Central map (`src/components/ui/statusTones.ts`) covers workflow, result, account, evidence,
equipment, calibration, maintenance, retest, notification, and AI presentation through explicit
domain adapters. Text is always visible; dots are decorative. `StatusBadge`, `QcStatusBadge`,
and `LabDocumentStatusBadge` remain compatibility wrappers over this primitive.

### 3.4 Pagination

```astro
<Pagination page={result.page} totalPages={result.total_pages} hrefFor={pageHref} label="Test register pagination" />
```

One implementation for the whole app: `nav[aria-label="…"]`, numbered window (up to 7),
Prev/Next as links when available and inert `<span>`s at bounds, `aria-current="page"` on the
active number. No SVG chevrons, no text-only variants. Lists that don't paginate yet (LIMIT-capped
registers) may stay as-is but must not invent a second pattern.

### 3.5 Banner

`<Banner tone="info|success|warning|error" title?>` — `role="alert"` when `tone="error"`.
Replaces ad-hoc `rounded-lg border-*-200 bg-*-50 px-4 py-3 text-sm` alert divs; `FlashNotice`
keeps its one-shot contract and consumes the same visual language.

### 3.6 EmptyState

Existing `EmptyState.astro` (dashed card + icon + title + hint + CTA) is the only empty-state
pattern. It distinguishes: nothing exists (offer creation CTA) vs. no search results (offer
"Clear filters"). Never a bare centered `<div>` or a `<td colspan>` — registers use the component.

### 3.7 Tables

Panel: `rounded-xl border border-slate-200 bg-white shadow-sm` + inner `overflow-x-auto`.
Header: `bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500`,
`th scope="col" class="px-4 py-2.5"`, body `divide-y divide-slate-100 text-sm`,
`td class="px-4 py-2.5"`, optional `hover:bg-slate-50/75` rows. Sortable headers are links with
`▲/▼` markers (existing pattern). Numeric columns right-aligned; identifiers first, actions last
(one primary row link + at most one small menu — action buttons never fill every row). Mobile:
registers may scroll horizontally by design; simple lists may switch to card fallbacks — never
shrink text/buttons to force fit.

### 3.8 Forms & filters

- Every control has a visible `<label>`; help text via `text-xs text-slate-500`; errors are
  specific sentences ("Lot number must look like LOT-0001"), tied with `aria-describedby`,
  invalid fields get `aria-invalid`.
- Filter toolbar pattern (register pages): one `form method="get"` in a `rounded-xl` panel,
  grid of labeled controls, `Apply filters` (primary) + `Reset` (secondary, only when filters
  active) on the toolbar row. Active filters are announced by a result-count line
  ("13 documents found (filtered — clear all)").
- Primary action right-most in action rows; destructive controls never live inside forms that
  also carry a primary submit.

### 3.9 Ownership and deprecation

`AppButton`, `StatusPill`, `Banner`, `OperationalState`, `PageHeader`, `Pagination`, and
`ContextualHelp` are the canonical shared primitives. `LabActionButton`, `StatusBadge`,
`QcStatusBadge`, and `EmptyState` remain compatibility/domain adapters and must consume the
same token language. Legacy equivalents are deprecated by documentation first, migrated by
route, and removed only after their consumers and consistency checks are gone.

---

## 4. Canonical component catalogue

| Component | Canonical owner / contract |
| --- | --- |
| Button / IconButton | `AppButton` / `IconButton`; use a semantic action variant and a 44px target for standalone actions. |
| Input / Textarea / Select / Checkbox / Radio / Switch | `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch`, backed by `controls.ts`. |
| Date / Search / Form field | `DateControl`, `SearchInput`, `FormField`; the route owns validation and descriptive text. |
| Badge / Alert / Banner / Toast | `StatusPill`, `Banner`, `Toast`; `FlashNotice` and domain badges are adapters, not alternatives. |
| Card / data card / table | `Card`, `DATA_CARD`, `TABLE_PANEL`; table semantics and column scope remain native HTML. |
| Modal / dialog / drawer / dropdown / tooltip | Existing React dialogs and native `<details>` stay behavior owners; their shell must use card, overlay, focus, and action contracts. Do not add a second interaction framework. |
| Tabs / pagination / breadcrumb | Native tablist contract when needed, `Pagination`, and `Breadcrumbs`; no per-route pagination variants. |
| Empty / loading / notification | `EmptyState`, `Skeleton`, `OperationalState`, `Toast`, and `NotificationCard`; each has a distinct operational meaning. |
| Page / section headers | `PageHeader` owns the H1; `SectionHeader` owns H2 section hierarchy. |

### Legacy migration boundary

The application contains legacy page markup that predates v2.0. It is inventoried by
`test:design-system-100` and may retain raw palette classes only until its route is
migrated. This is a controlled compatibility boundary, not a new-code exception:

- Shared files in `src/components/ui/` are a zero-raw-palette zone, enforced in CI.
- New shared controls must use `controls.ts` or a documented component recipe.
- Existing pages migrate route-by-route only with their workflow, responsive, and access
  regression tests; no visual sweep may change forms, RBAC, URLs, or audit behavior.
- A raw palette in a new shared primitive fails the guard. A legacy page is reported as
  outstanding migration work rather than silently treated as canonical.

## 5. Page skeleton

```text
Breadcrumbs (section pages)
↓
PageHeader (eyebrow · H1 · description · primary actions)
↓
Banners (errors/warnings first)
↓
Filters / toolbar (registers)
↓
Primary content (table / cards / form)
↓
Secondary & historical content (audit, versions — visually quieter)
↓
Danger zone (if any — last, separated)
```

Long forms: breadcrumb → title/status → section navigation → content → sticky action bar
(existing lab form pattern). Detail pages: identity block (id, title, status, owner, key date,
actions) → overview → workflow → related data → history.

---

## 5. Navigation

- Global nav: **Dashboard · Tasks · Search · Findings · Laboratory · Reports** as primary links
  (role-filtered), everything administrative (Delete Requests, Templates, Settings, System
  Health) under a **More** menu; bell + Account + Sign out in the right cluster. No
  unauthorized destinations are ever rendered (filters come from role, same as today).
- Active section: `aria-current="page"` + brand-tinted pill on the active link.
- Mobile: the menu collapses into a grouped full-width panel (44px targets, sections labeled),
  not a wrapped row of small links.
- Laboratory secondary nav keeps the domain groups (Overview / Testing / Master Data /
  Controlled Documents / Operations), server-filtered per role (`labNavForRole`), with
  `aria-current` on the active entry.

---

## 6. Accessibility contract

- Keyboard: every action reachable; dialogs trap focus and restore it on close (existing
  pattern in `Navbar`/dialogs is the reference).
- Headings: one H1, logical order; section headings are real elements, not styled paragraphs.
- Tables are semantic (`table/thead/tbody/th[scope]`).
- Contrast ≥ WCAG AA at all sizes; the existing documented contrast choices (red-600 badge,
  slate-600 on slate-100) are preserved.
- `prefers-reduced-motion` respected globally; no decorative motion in operational screens.

---

## 7. Guardrails for future screens

1. Use a primitive before inventing markup; extend the primitive before duplicating it.
2. One primary action per view; destructive actions isolated.
3. Status text is mandatory; color is decoration.
4. Every screen must survive 390px and 1440px without horizontal page overflow (data tables
   may scroll inside their panel intentionally).
5. UI components never import `src/lib/permissions.ts` (architecture guard) — authorization is
   resolved server-side and passed in as props/flags.
6. English-only UI copy; same concept = same word everywhere (Test Register, Work Instruction,
   Submit for Review).

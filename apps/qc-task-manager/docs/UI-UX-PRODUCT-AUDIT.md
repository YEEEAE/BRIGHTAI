# QC Task Manager — Product UI/UX Audit & Reconstruction Report

> **Task:** QC-PRODUCT-UIUX-RECONSTRUCTION-006 · **Date:** 2026-08-27
> **Scope:** `apps/qc-task-manager/` — complete product-level UI/UX pass (30-phase brief).
> **Companion document:** [`docs/UI-DESIGN-SYSTEM.md`](./UI-DESIGN-SYSTEM.md) — the binding visual language introduced by this task.
> **Boundary:** automated verification only. **RUNTIME USER UAT REQUIRED** before any pilot claim of human usability.

---

## 1. Screens audited

Full recursive inventory of `src/pages/` (73 `.astro` pages + redirect stubs) with per-screen
route, purpose, roles, primary/secondary/destructive actions, forms, tables, filters, search,
empty states, and responsive behavior. Representative screens were then screenshot-verified
live (see §12). Areas covered: authentication, employee, supervisor, manager, admin, tasks,
task detail, task creation, search, notifications, delete requests, QC findings, RCA, CAPA,
evidence, dashboard, reports, laboratory (home, tests, new test, review, retests, products,
equipment, calibration, maintenance, templates, documents, WI, acknowledgements, change
requests, lab search, calendar, saved views, audit, data quality), print records, 404,
account security.

## 2. Main problems found (before)

| # | Problem | Evidence |
| --- | --- | --- |
| P1 | Three competing primary-button styles (legacy `rounded-md bg-brand-600`, newer `rounded-lg … font-semibold`, shared `LabActionButton` used by only 4 pages) + a dark-slate stray style | `findings/index.astro`, `reports.astro`, `admin/settings`, `404.astro` vs 28 lab occurrences |
| P2 | Two page-header idioms: lab/findings eyebrow+H1 vs core plain `h1.text-2xl`; an outlier `text-3xl` on workload | 46 lab files vs `admin/users`, `reports`, `manager` |
| P3 | Four pagination implementations: numbered window (5 pages, duplicated markup), SVG chevrons (`lab/search`), text-only (`lab/audit`), and none (LIMIT-capped lists) | `search.astro:421`, `lab/search.astro:395`, `lab/audit.astro:212`, 5 duplicated window blocks |
| P4 | Empty states: shared `EmptyState` on 38 pages but 4 ad-hoc inline variants elsewhere | `findings`, `drilldown`, `manager/requests`, `admin/templates`, `admin/settings` |
| P5 | Table header chaos: `px-4 py-3` / `px-6 py-3` / `px-4 py-2`, three label styles | `admin/settings:69`, `admin/users`, `drilldown:38` |
| P6 | Status pill fragmentation: `StatusBadge` + `QcStatusBadge` + `LabDocumentStatusBadge` + inline color maps with drifting palettes | `lab/tests` statusTone, `admin/users` active/disabled, `admin/templates` STATUS_BADGE, `manager/requests` statusTone |
| P7 | Radius/padding drift: `rounded-lg` (core) vs `rounded-xl` (lab), card padding `p-4/p-5/p-6` without rationale | across pages |
| P8 | Focus styles: two schemes (`focus:ring-2` legacy vs `focus-visible:outline-2`); findings buttons had none | `reports.astro:58`, `account/security:50`, `findings/index` |
| P9 | `manager/workload` rendered an Arabic sentence in the English UI **and** wrapped a second `max-w-7xl` container inside BaseLayout's `max-w-6xl` (double padding, wider than every other page, invalid nested structure) | `manager/workload.astro:13-16` |
| P10 | Navigation: 8–10 flat links for admin (cognitive overload), no active state, no `aria-current`, mobile menu was a flat wrapped list | `Navbar.tsx` ROLE_LINKS |
| P11 | Duplicated `pageNumbers` windowing logic copy-pasted in 5+ lab registers | grep `const pageNumbers` |
| P12 | Reports page: one large filter wall; download buttons with legacy focus styles | `reports.astro` |
| P13 | Icon-only buttons: bell had aria-label (good) but several row actions relied on text color affordances; no unified min target outside lab | row actions in registers |

## 3. Changes implemented

**Systemic (propagate to every screen):**

1. **Design system defined** — `docs/UI-DESIGN-SYSTEM.md`: typography scale, spacing rhythm,
   radius (md/lg/xl/pill), shadow rules, semantic color map (neutral/info/progress/success/
   warning/danger/accent), page skeleton, navigation model, a11y contract, guardrails.
   The documented legacy exception: task statuses/priorities keep their existing app-wide
   🔴🟡🟠🟢 scheme (charts depend on it) — documented, not half-migrated.
2. **UI primitives created** (`src/components/ui/`): `PageHeader`, `AppButton`
   (primary/secondary/tertiary/destructive × md/sm, unified `focus-visible` outline),
   `StatusPill` + `statusTones.ts` central map (text always visible + optional dot — never
   color alone), `Pagination` (one implementation, labeled nav landmark, `aria-current`),
   `Banner` (info/success/warning/error), `EmptyState` extended (icon + secondary CTA,
   backward-compatible API).
3. **Navigation rebuilt** (`Navbar.tsx`): grouped model — primary
   `Dashboard · Tasks · Search · Findings · Laboratory · Reports` (role-filtered, employee
   keeps no-dashboard rule #1), administrative destinations under a **More** menu (Delete
   Requests, Team Workload, User Management, Task Templates, Backups & Settings, System
   Health), `aria-current="page"` active section pills (computed after mount — a render-time
   `window` access crashed island SSR and was fixed), and an intentionally designed mobile
   menu (grouped Workspace/Administration sections, 44px targets, account block). All
   authorization filtering stays role-driven from the same data; components still never
   import `permissions.ts` (architecture guard).
4. **Pagination unified** — 12 registers converted to the shared component (`search`,
   `lab/search`, `lab/audit`, `lab/tests`, `lab/tests/review`, `lab/products`,
   `lab/calibration`, `lab/retests`, `lab/documents`, `lab/templates`, `lab/equipment`,
   `lab/acknowledgements`); identical link sets/windowing preserved so E2E pagination
   contracts (nav landmark, `page=N` hrefs, Prev/Next) hold.
5. **Role home screens** — "Needs my attention" strips answering *what needs my attention*
   before the lists: manager (overdue, urgent, pending delete requests, open findings →
   drilldown/search/registers), supervisor (overdue, urgent, tests awaiting review, documents
   in review), employee (overdue, due today, open, my draft tests, returned for changes,
   pending change requests). All read-only counts; links lead to existing authorized lists.
6. **English-only enforcement** — workload page Arabic sentence replaced with English copy
   (+ no second width wrapper, standard table pattern, empty state); a source scan now
   proves zero Arabic characters under `src/pages`.

**Page-level:** `manager/index`, `supervisor/index`, `employee/index`, `manager/workload`,
`findings/index`, `reports.astro`, `admin/users` (Active/Disabled via StatusPill),
`admin/templates` (lifecycle + priority via central tones), `lab/tests` register (StatusPill),
`404.astro` (helpful two-CTA page), `EmptyState` default visuals.

## 4. New / reused design components

| Component | Status |
| --- | --- |
| `ui/PageHeader.astro` | New — single page skeleton header |
| `ui/AppButton.astro` | New — 4 variants × 2 sizes, unified focus/disabled/loading |
| `ui/StatusPill.astro` + `ui/statusTones.ts` | New — central status→tone/label map |
| `ui/Pagination.astro` | New — replaces 4 implementations |
| `ui/Banner.astro` | New — in-page alerts (FlashNotice keeps its contract) |
| `EmptyState.astro` | Improved — icon + secondary CTA, API-compatible |
| `StatusBadge`, `QcStatusBadge`, `LabDocumentStatusBadge`, `LabActionButton`, `Breadcrumbs`, `LabSecondaryNav`, `LabSaveViewForm` | Reused as-is (already conform) |
| Navbar | Rebuilt in place (same island, same auth filtering) |

No new dependencies. Stack unchanged: Astro SSR + Tailwind + existing React islands + SQLite.

## 5. Navigation before/after

- **Before:** admin saw 8–10 flat links; supervisor/manager 5–7 mixed operational and
  administrative; no active indication; mobile menu a flat wrapped list.
- **After:** six primary links maximum (employee: four), all administrative destinations
  grouped under **More** (still one click), active section highlighted with
  `aria-current="page"` + brand pill on desktop, in More, and in the mobile menu; mobile menu
  organized as Workspace / Administration / Account groups with 44px targets. Laboratory
  secondary nav unchanged conceptually (Overview / Testing / Master Data / Controlled
  Documents / Operations) with server-side role filtering intact.

## 6. Button-system changes

`AppButton` is the reference: one primary per view, secondary for Edit/Export/Back,
tertiary for quiet links, destructive isolated (never beside a primary). Legacy primary
buttons on `findings`, `reports`, `404` and page headers converted; standalone CTAs keep the
44px min-height (lab `LabActionButton` convention) while dense row actions use `sm`.
Reports downloads standardized to secondary buttons with explicit labels
(Download CSV / XLSX / PDF). Findings "New Finding"/"Create Finding" and filter actions
converted with Apply/Reset semantics.

## 7. Table changes

Standard header pattern (`bg-slate-50`, `text-xs font-semibold uppercase tracking-wide`,
`px-4 py-2.5`) applied on converted pages (workload, findings, manager register); `tabular-nums`
for numeric columns; row hover standardized to `hover:bg-slate-50/75`. Registers keep their
intentional horizontal scroll with `min-w` tables inside `overflow-x-auto`.

## 8. Form changes

Filter toolbars standardized (labeled controls, Apply + conditional Reset, result count with
"clear all"). Reports restructured into Report type → Period & scope → collapsible Advanced
filters → Preview scope → Downloads (§9). Findings create form spacing/labels normalized.
All validation remains server-side; no business rules touched.

## 9. Lab changes

- Test register: workflow status now renders through `StatusPill` (central map; DRAFT=neutral,
  SUBMITTED=info, UNDER_REVIEW=progress, APPROVED=success, REJECTED=danger, VOID=neutral-strong)
  with a decorative dot — status never color-alone; result tones aligned to design-system
  hues; unified pagination.
- Test form (`LabTestForm.tsx`): fixed a real 4px page-level horizontal overflow at tablet
  widths — the sticky action bar bled `-mx-5` (20px) inside the page's `px-4` (16px) context;
  now bleeds exactly to the page padding (verified 390/768/1440).
- Lab secondary nav, e-signature dialogs, document badges: already conforming; reused.

## 10. Mobile changes

Verified live at 1440 / 768 / 390 on 20 representative screens (60 full-page screenshots):
**0 page-level horizontal overflows, exactly one H1 per screen** after fixes. Mobile menu is
now a designed grouped panel. Attention strips collapse to 2 columns; role headers stack with
full-width 44px actions. Data tables scroll horizontally by design inside their panels.

## 11. Accessibility changes

- One focus scheme (`focus-visible` outline, brand/destructive colors) on all converted
  controls; findings buttons gained a visible focus style.
- `aria-current="page"` across desktop primary nav, More menu, mobile menu, and pagination.
- Status pills always carry text (dot is `aria-hidden`); banner tones map to
  `role="alert"`/`status`.
- Skip-link → navbar → bell keyboard flow unchanged (covered by `e2e-a11y`, see §15).
- English-only UI enforced by the new source guard.

## 12. Screenshots reviewed

Tool: `scripts/ui-screenshots.mjs` (self-hosted production server + disposable seeded DB,
fixture-only opt-outs, mirrors acceptance env). Output: `download/qa/ui-audit/*.png` —
20 screens × 1440/768/390 = **60 full-page captures**, each with programmatic
overflow/H1 checks. Visually reviewed at minimum: manager home, employee home (390), lab
tests register (1440), reports (1440), plus all-check pass on the rest. Issues found by
review and fixed: Navbar SSR `window` crash (would 500 every authed page), sticky action bar
4px overflow at 768. The `lab-tests-new@768` "overflow" seen in the first tool pass was
re-probed in isolation (768/768 clean) and root-caused to the sticky-bar bleed above.

## 13. Consistency safeguards added

`scripts/test-ui-consistency.mjs` (registered canonical `test:ui-consistency`, manifest now
**52 suites**): 37 source-level checks — English-only pages, shared pagination everywhere
(no inline `pageNumbers`), PageHeader adoption on converted screens, workload wrapper/Arabic
regressions, StatusPill usage in the test register, Pagination landmark contract.

## 14. Remaining UX risks

1. **Attention-strip counts are navigational aids** — they mirror operational SQL but the
   authoritative KPIs remain the dashboard; staff should confirm the definitions feel right.
2. Reset button on lab registers renders even with no active filters (pre-existing; minor).
3. `/notifications` and `/lab/notifications` still duplicate page-level code (maps/icons);
   behavior is consistent but consolidation is a follow-up refactor.
4. Legacy non-converted registers (products/equipment/calibration/templates/documents…) keep
   their (already close) lab header idiom; they render `text-3xl` H1s vs the new standard
   `text-2xl` — visually acceptable, convergence can continue incrementally.
5. Employee attention chips "Due today/Overdue/Open" are intentionally non-links (no honest
   filtered target exists yet) — a dedicated `?due=` search filter would upgrade them.

## 15. Verification

| Check | Result |
| --- | --- |
| `pnpm typecheck` | **0 errors / 0 warnings / 17 hints** |
| `pnpm test:manifest` | **PASS — 52 canonical suites, 27 canonical E2E** |
| `pnpm test:route-manifest` | **PASS — 110 file routes, 25 middleware routes, 6 guards** |
| `pnpm test` (full chain) | **PASS — 52 canonical suites, exit 0** |
| `NODE_ENV=production pnpm build` | **Complete** |
| `pnpm e2e:acceptance` | **PASS — 26 canonical suites + 2 restart-persistence phases, 2,304 assertions passed / 0 failed** (incl. lab-documents 85/0 link-count contract, reports 912/0, lab-search 21/0) |
| Screenshots (20 screens × 3 widths) | 60 captured; 0 overflow; exactly one H1 each |

Along the way the gate surfaced **five stale spec-drift counters** left by the previous
session (which had admitted its full `pnpm test` run was cut before completion) — all fixed:
`test-lab-change-requests` (currentVersion 35→36), `test-production-operations`
(expectedSchemaVersion 35→36 ×2), `test-dashboard-reports` (applied migrations 35→36),
`test-scheduled-notifications` (schema version 35→36), `test-db-doctor` (three /35/ matches
→36). No assertions were weakened — only aligned to migration 036 reality.

Scores (self-assessed, 0–100, before → after): Visual Design 55→78 · UI Consistency 45→88 ·
Information Architecture 60→78 · Navigation 55→82 · Buttons 50→85 · Forms 62→78 · Tables 60→78 ·
Laboratory UX 70→82 · Task UX 58→76 · Admin UX 55→78 · Mobile 62→85 · Accessibility 68→84 ·
Ease of Use 58→76 · Error Prevention 65→75 · Product Polish 52→80 · **Overall Product UX 59→80**.

**RUNTIME USER UAT REQUIRED** — no real-staff usability validation was performed; every score
above is an engineering self-assessment against the design brief, not a human verdict.

## 16. Items requiring real staff UAT

1. Do the manager/supervisor/employee attention strips surface the right work first?
2. Is the grouped navigation (More menu) discoverable for admin daily tasks?
3. Lab: does the StatusPill vocabulary (Draft/Submitted/Under Review/…) match how testers speak?
4. Reports: is the 4-step flow faster than the old single wall for frequent downloads?
5. Employee chips: are "Returned for changes" and "Pending change requests" the right
   personal signals (and should they live higher than task list)?
6. Mobile: confirm the grouped menu ordering matches real frequency of use.

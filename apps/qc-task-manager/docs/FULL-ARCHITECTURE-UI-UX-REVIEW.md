# QC Task Manager — Full Architecture + UI/UX Review

**Scope:** `apps/qc-task-manager/` at the current working tree on 2026-08-28.
**Mode:** Analysis only. No production fixes, refactors, commits, or pushes were performed.
**Evidence labels:** `SOURCE-CONFIRMED` means verified from current source; `RUNTIME-CONFIRMED` means verified against the production build and live disposable database; `NEEDS-RUNTIME-VERIFICATION` means a source signal exists but the exact browser behavior still needs a focused interaction test.

## 1. Executive Assessment

The application is a credible Astro SSR enterprise QC system with clear server-side authorization, real domain libraries, a reusable UI layer, controlled print views, and unusually strong automated guards. The main risk is not a missing framework capability; it is drift as the product grows: pages, domain modules, and presentation maps have several parallel conventions, while the manager dashboard and laboratory test form have become very large operational surfaces.

| Area | Score | Evidence-based justification |
|---|---:|---|
| Architecture | 84/100 | Astro SSR, API routes, middleware, domain libraries, SQLite, and an architecture guard are coherent. Boundaries are stressed by mega-modules and broad shared modules such as `taskUpdates.ts`, `validation.ts`, and `lab/tests.ts`. |
| UI consistency | 78/100 | The documented system and `src/components/ui/` are useful, and `test:ui-consistency` passes 164/164. Many pages still hand-roll headers, buttons, alerts, status badges, and focus styles. |
| UX usability | 76/100 | Core flows are discoverable and runtime pages were stable at all sampled widths. The manager dashboard is very long and the lab test form is highly dense, increasing scanning and data-entry cost. |
| Design-system maturity | 75/100 | There are canonical `AppButton`, `PageHeader`, `StatusPill`, `Banner`, `EmptyState`, pagination, tone maps, and a written contract. Adoption is incomplete and task/lab/legacy maps still coexist. |
| Accessibility | 82/100 | Automated keyboard/axe-oriented infrastructure, labels, semantic headings, focus styles, reduced motion, and contrast checks are strong. Several raw controls are below the documented 44px touch target and focus/interaction patterns are not fully canonicalized. |
| Responsive behavior | 86/100 | Runtime screenshot coverage produced 60 screens at 390/768/1440 with no reported page overflow or H1-count failures. The mobile dashboard and lab form remain dense; table and long-value behavior needs focused human verification. |
| Frontend maintainability | 72/100 | Strict TypeScript and guards help, but `LabTestForm.tsx` (1,288 lines), `dashboard.astro` (804), `TaskLifecycle.tsx` (799), and `DashboardCharts.tsx` (685) carry multiple responsibilities. |
| Frontend performance | 78/100 | Build succeeds and most nonessential islands use `client:visible`; however, `Navbar` and dashboard charts use `client:load`, and Vite reports that dynamic imports of `db.ts` and `validation.ts` cannot form separate chunks. No production-browser performance budget was measured in this review. |

**Overall judgment: CONDITIONAL GO for continued pilot development.** The current foundation should be preserved. Remediation should focus first on operational density, canonical status/action primitives, and the largest ownership boundaries—not a rewrite.

## 2. Current Architecture Map

The actual request/data path is:

```text
Astro route in src/pages/
  → BaseLayout / PrintLayout / page-local shell
  → Astro server data loading and POST handlers
  → optional React island (client:visible/client:load)
  → src/lib domain/service modules
  → auth/permissions/policy helpers
  → better-sqlite3 via src/lib/db.ts
  → audit/activity/notification side effects
```

- **Astro pages:** 114 file routes, including role homes, task/findings/reporting surfaces, and a large `/lab` route family. Pages own server-side loading and many POST workflows.
- **Layouts:** `BaseLayout.astro` owns the document shell, global stylesheet, flash notice, notification query, and the hydrated navbar. `PrintLayout.astro` isolates controlled print output and metadata.
- **React islands:** interactive controls include `Navbar`, `TaskLifecycle`, `TaskUpdatePanel`, `LabTestForm`, charts, AI panels, uploaders, and notification actions. Most are `client:visible`; `Navbar` and the main dashboard chart are `client:load`.
- **UI components:** `src/components/ui/` contains primitives and pure presentation maps. There are also older/domain-level components beside it, including `StatusBadge`, `QcStatusBadge`, and lab-specific controls.
- **Lab components:** `src/components/lab/` contains forms, lab navigation, status controls, and charts. Lab domain services live mainly under `src/lib/lab/`.
- **Domain libraries:** tasks, findings, CAPA, workflows, SLA, evidence, reporting, AI, audit, notifications, and lab modules are separated conceptually. SQLite access is centralized in `src/lib/db.ts`.
- **APIs:** file-based Astro API routes under `src/pages/api/` cover notifications, tasks, findings, lab, reports, exports, AI, health, and filters. Server authorization is rechecked at the API/domain boundary.
- **Middleware:** `src/middleware.ts` supplies authentication/session handling, route protection, CSRF/origin checks, security headers, and path-level guards.
- **DB layer:** `better-sqlite3`, migrations/schema checks, audit/event writes, backup/restore, and operational scripts are all present. This is appropriate for the current internal deployment model.

## 3. Folder Structure Review

### What is good

- The route tree reflects the product domains and makes the SSR entry points easy to locate.
- `src/lib/lab/`, `src/lib/reporting/`, `src/lib/ai/`, `src/lib/workflows/`, and `src/lib/evidence/` are meaningful boundaries rather than a single generic utilities folder.
- `src/components/ui/` is a sensible location for pure, authorization-free primitives; the architecture guard explicitly protects that trust boundary.
- Tests and operational scripts are colocated with the application and expose focused checks for UI consistency, responsive behavior, contrast, architecture, and domain behavior.
- Print views are separated from application chrome instead of being simulated by a CSS toggle on the main layout.

### What is problematic

- The top-level `src/pages/` layer still owns substantial UI composition, filtering, status presentation, and workflow branching. This is visible in `dashboard.astro`, `tasks/[id].astro`, and several lab detail pages.
- There are two presentation locations: the canonical `src/components/ui/` maps and numerous local class maps/inline classes in pages and domain components.
- Feature boundaries are not symmetrical: task features are partly top-level (`tasks.ts`, `taskUpdates.ts`, `taskDetails.ts`) while lab features have deeper subfolders. That makes ownership less obvious for cross-domain concepts such as status, notifications, and evidence.
- The repository contains a large generated font data module (`src/lib/reporting/writers/fonts/fontData.ts`, 3,152 lines) in the same conceptual area as reporting logic, which makes reporting discovery noisier even though the generated asset itself is legitimate.

### Scalability risks

1. Changes to shared status, form, or action semantics can require edits across pages, `components/ui`, lab maps, and legacy task helpers.
2. Large pages combine query orchestration, page composition, and interaction wiring, raising regression risk when another role or workflow is added.
3. Cross-cutting rules such as formatting and validation are broad enough that unused imports/parameters are already surfaced as 26 typecheck hints.
4. The current architecture guard prevents certain boundary violations, but it does not yet enforce adoption of the canonical page/header/button/status primitives.

### Recommended conceptual structure

Keep the current Astro architecture, but make ownership more explicit incrementally:

```text
src/
  pages/                    route adapters + server orchestration only
  layouts/                  document/app/lab/print shells
  components/ui/            app-wide primitives and semantic presentation
  components/features/      task, findings, lab, reporting interaction surfaces
  lib/domain/               task, lab, finding, workflow, evidence services
  lib/application/          use-case orchestration for route handlers
  lib/presentation/         shared labels, formatting, status contracts
```

This is a conceptual target, not a request for a bulk move. Existing paths can remain while new boundaries are extracted around the highest-change modules.

## 4. Astro / Component Architecture Review

Astro is being used appropriately as the server-rendered shell. Core records, role-specific pages, filters, and most forms render in the initial response. React is reserved for interactions that need local state: menus, charts, dynamic form rows, upload state, AI requests, and task updates.

The strongest architectural choices are the server-owned auth/permissions boundary, the use of `client:visible` for many secondary controls, and the dedicated print layout. The main weaknesses are boundary pressure rather than a wrong Astro model:

- `BaseLayout.astro` runs notification counting and recent-notification queries for every signed-in page, then hydrates a 573-line navbar with `client:load` (`BaseLayout.astro:22-30,45-51`; `Navbar.tsx:141-500`). This makes global navigation a high-cost dependency of every route.
- `dashboard.astro` combines dashboard query loading, filter form, navigation, KPI construction, lab KPI construction, errors, charts, and many secondary sections (`dashboard.astro:240-704`). This is a valid Astro page, but it is now a page controller plus a view model plus a large template.
- `LabTestForm.tsx` owns form state, draft persistence/unload protection, focus movement, validation presentation, section rendering, reference lookup, and submit behavior in one component (`LabTestForm.tsx:1-1288`). It is the clearest candidate for incremental feature extraction.
- `TaskLifecycle.tsx` and `TaskUpdatePanel.tsx` mix interactive state, fetch calls, optimistic/local state updates, field locking, checklist/dependency editing, and presentation. These are functional but expensive to reason about and test as a unit.
- Vite reports that dynamic imports of `db.ts` and `validation.ts` are also statically imported widely, so the intended lazy boundary does not produce separate chunks. This is an architecture/performance signal, not a build failure.
- Inline Astro scripts are used for dashboard filters and external script tags for form productivity and e-signature behavior. They are CSP-aware, but ownership is split between page markup and standalone scripts; future interaction work should choose one canonical pattern per feature.

**Recommended ownership rule:** Astro route files should assemble a server view model and compose shells; interactive components should own browser state and events; domain modules should own policy and use cases; pure presentation maps should own labels/tone/formatting. The current system mostly follows this rule, but the largest files visibly cross two or more boundaries.

## 5. UI/UX Review

### Dashboard and role homes

The manager dashboard has a clear top-to-bottom structure: filters, section links, AI advisory panel, KPI cards, charts, laboratory register summaries, findings/CAPA/workforce links, then operational lists. Runtime screenshots confirm stable rendering at 390 and 1440. The issue is operational prioritization: the 1440px capture is approximately 6,752px tall and contains a large number of KPI cards and chart panels before the lower-priority audit/activity blocks. On mobile, two-column KPI grids remain usable but create a very tall scan path.

The employee and supervisor home screens are more task-oriented and better aligned with daily work. Their attention summaries and action queues are a good pattern to preserve.

### Task workflows

Task details expose lifecycle actions, evidence requirements, QC metadata, checklist/dependencies, comments, attachments, and activity. This supports traceability. The risk is that multiple panels and action states compete for attention, especially when a task is blocked by evidence/dependencies. The primary next action should remain visually dominant and the reason for a block should be adjacent to that action.

### Laboratory workflows

The lab secondary navigation and breadcrumbs provide strong wayfinding. The lab test creation screen has explicit sections, contextual help, reference panels, authorization data, result controls, and a sticky action bar. That is appropriate for QC data capture. Runtime at 390px shows no page overflow, but the form is approximately 6,086px tall and places many reference values and fields into a long single-column journey. This is a usability cost, not evidence that information should be removed: section completion state, jump navigation, and progressive reveal should carry the density.

### Review/approval and controlled documents

The source makes state, authorship, e-signature, and self-review restrictions visible. Controlled documents have explicit lifecycle states and separate version/print routes. This is good compliance-oriented UX. The remaining concern is consistency: some detail pages use `PageHeader`, others build their own header, and raw status text can appear beside canonical pills.

### Search, reporting, notifications, and administration

Search has a powerful filter surface and saved filters; it is appropriate for an internal system but dense. Reports and admin/system-health pages favor direct utility over decoration, which is correct. Notifications are grouped and have readable labels, but the global bell/menu is implemented as a large hydrated component and needs continued focus/target-size testing.

## 6. Design System Review

| Element | Current implementations | Problem | Recommended canonical pattern | Priority |
|---|---|---|---|---|
| Buttons | `AppButton.astro`; `LabActionButton.astro`; raw classes in dashboard, search, admin, forms | Same semantic action receives different radius, height, focus, and loading treatment | Use `AppButton` for app-wide actions; retain `LabActionButton` only where lab-specific semantics are proven; enforce adoption in new/edited screens | P1 |
| Statuses | `statusTones.ts`, `StatusPill`, legacy `StatusBadge`, `QcStatusBadge`, `labBadgeClasses.ts`, inline maps | Same concepts have different label casing, tones, and raw-code fallback behavior | One semantic status contract with domain aliases; keep task legacy mapping behind one adapter until migrated | P1 |
| Cards | `rounded-xl border ... shadow-sm`, `rounded-lg`, inline colored KPI cards | Card anatomy is broadly similar but padding and tone choices drift | Define card roles: panel, KPI, warning, empty; avoid creating a generic card abstraction without repeated behavior | P2 |
| Forms | `formPresets.ts`, `AppButton`, direct labels/classes, React and Astro forms | Field spacing, error wiring, focus style, and button heights vary | Canonical field/error/help contract, with composition rather than a large form framework | P1 |
| Tables | Several semantic tables, register-specific wrappers, mobile fallbacks | Good semantics exist, but responsive strategy is per-register and some lists remain custom | Preserve table semantics; standardize wrapper/header/cell density and explicit mobile fallback policy | P2 |
| Page headers | `PageHeader` plus many hand-rolled `<header>` blocks | Written design system says every top-level page uses `PageHeader`, but source adoption is partial | Make `PageHeader` the default route shell; document justified exceptions such as print and 404 | P2 |
| Navigation | `Navbar.tsx`, `LabSecondaryNav.astro`, local tabs/section navs | Global and lab nav are coherent, but hydration and target-size conventions differ | Keep role filtering server-owned; centralize interaction/target/focus rules in nav primitives | P1 |
| Alerts | `Banner`, `FlashNotice`, `OperationalState`, raw role-alert divs | Error/success/empty/conflict states use multiple APIs and tones | Use `Banner`/`OperationalState` by state semantics; keep flash as a transport mechanism | P2 |

The UI consistency guard passing 164/164 is valuable, but it currently validates selected contracts rather than proving full source adoption. The next guard should detect drift in high-frequency screens without forcing abstraction for one-off layouts.

## 7. QC Workflow UX Review

- **Task → Finding → CAPA → Evidence:** The data model and detail page expose the relationship, audit trail, and evidence gate. The UX should make the relationship graph more visible at the point of work; currently the user often needs to scan multiple sections or navigate to another record.
- **Product → Test → Review → Retest → Report:** The lab route structure and records support the sequence. The test form clearly separates data capture from authorization/result, and review/approval restrictions are explicit. The main risk is high form length and the amount of reference data shown inline.
- **Equipment → Calibration → Maintenance:** Dedicated routes, status maps, and print views support traceability. Due/overdue states are visible, but semantic tone duplication means the same operational risk can look different across registers.
- **Draft → Submit → Review → Approve/Reject:** The system communicates the lifecycle and uses e-signature boundaries. The primary action hierarchy needs to be standardized across all forms so users do not have to relearn whether “Save Draft”, “Save and Continue”, and “Submit for Review” are primary or secondary.
- **Error/recovery:** `OperationalState` provides a useful vocabulary for no records, no results, forbidden, system error, conflict, and stale record. The remaining gap is consistent use at route level and consistent association of inline errors with the field and a summary.

## 8. Responsive & Accessibility Review

### RUNTIME-CONFIRMED

- Production build succeeded and the screenshot runner visited 60 role/screen/viewport combinations at 390, 768, and 1440 widths.
- The runner reported no page-level horizontal overflow and no incorrect H1 counts for the captured surfaces.
- Mobile navigation, lab forms, dashboard cards, and admin screens rendered without a page collapse in the captured states.
- Badge contrast guard passed all 13 checked pairs; the focused lab UX and performance checks passed 14 and 7 checks respectively.

### SOURCE-CONFIRMED findings

- `Navbar.tsx:351-359` and `Navbar.tsx:485-489` use icon controls with `p-2` around 20px icons. Their nominal box is about 36px before browser styling, below the 44px mobile target documented by the project.
- The design system requires the canonical focus outline, but many screens still use `focus:ring-*` or `focus:outline-none focus:ring-*`, e.g. `dashboard.astro:261`, `dashboard.astro:436`, and the search filter controls. These are not automatically inaccessible, but they are inconsistent and harder to audit as one contract.
- The notification and “More” dropdowns use `role="menu"` with tab trapping but do not implement a full menu keyboard model such as arrow-key navigation. This needs a deliberate pattern decision; it is not a reason to replace native links with a custom widget by default.

### NEEDS-RUNTIME-VERIFICATION

- 200% zoom/reflow and Windows high-contrast behavior were not tested.
- Full keyboard traversal of every long lab form, table fallback, and print view was not manually exercised in this review; existing automated gates cover representative flows, not every route.
- Long identifiers, Arabic/English mixed values, and extreme numeric measurement strings need representative data testing at 320/375/430px.
- Screen-reader announcements for async save, AI advisory results, notification marking, and server-returned validation errors need a focused VoiceOver/NVDA pass.

## 9. Maintainability Review

Concrete hotspots:

| Hotspot | Evidence | Why it matters |
|---|---|---|
| Lab test form | `src/components/lab/LabTestForm.tsx` — 1,288 lines | State, validation, focus, draft lifecycle, reference data, sections, and submit semantics change together. A small rule change can regress unrelated capture sections. |
| Task update service | `src/lib/taskUpdates.ts` — 1,556 lines | Multiple task mutations and policy-adjacent concerns are concentrated in one module, making targeted tests and ownership less obvious. |
| Validation | `src/lib/validation.ts` — 1,359 lines | Shared validation is valuable, but its breadth and mixed domain ownership make lazy boundaries ineffective and make terminology drift likely. |
| Dashboard route | `src/pages/dashboard.astro` — 804 lines | Server view-model construction, filters, KPI composition, navigation, and many sections live in one route adapter. |
| Task lifecycle/detail surfaces | `TaskLifecycle.tsx` — 799 lines; `tasks/[id].astro` — 761 lines | Business actions, UI state, and detail composition are tightly coupled across Astro and React. |
| Presentation maps | `statusTones.ts`, `labBadgeClasses.ts`, `StatusBadge.astro`, `QcStatusBadge.astro`, local maps | High probability of semantic drift even though selected guards currently pass. |

The typecheck result is clean but reports 26 hints, mostly unused parameters/imports and one deprecation. These are not blockers, but they are useful signals that ownership boundaries are carrying abandoned or transitional paths.

## 10. Prioritized Findings

| ID | Severity | Area | Finding | Evidence | Impact | Recommendation |
|---|---|---|---|---|---|---|
| UX-001 | P1 | Dashboard UX | Manager dashboard presents too many operational blocks in one continuous scan path. | RUNTIME-CONFIRMED screenshot `download/qa/ui-audit/dashboard@1440.png` is ~6,752px tall; `dashboard.astro:411-704` defines filters, 8 section links, KPI grids, charts, lab groups, and lower operational lists. | Slower prioritization and higher chance that urgent QC work is buried below analytics. | Keep the information, but establish a priority-first home: urgent queue/KPIs first, analytics behind clearly labeled sections or a separate report surface; preserve deep links and filters. | 
| UX-002 | P1 | Lab data entry | New lab test is a very long, dense capture journey on mobile. | RUNTIME-CONFIRMED `lab-tests-new@390.png` is ~6,086px tall; `LabTestForm.tsx:560-1288` renders 8 sections plus reference data and results. | More scrolling, context loss, and entry errors during repetitive testing. | Add completion state and reliable section navigation/progressive reveal; keep required QC information visible and preserve server-side validation. |
| ARCH-001 | P1 | Component boundaries | `LabTestForm` is a multi-responsibility island rather than a focused form coordinator. | SOURCE-CONFIRMED `src/components/lab/LabTestForm.tsx` (1,288 lines), including draft lifecycle, browser events, focus movement, validation, reference rendering, and submit handling. | High regression surface and difficult isolated testing. | Extract stable subcomponents/hooks by responsibility: draft/session lifecycle, section fields, reference panel, sample results, authorization/result, and submit state. Keep domain rules outside the island. |
| ARCH-002 | P1 | Global hydration/performance | The global navbar is hydrated with `client:load` on every BaseLayout page and includes notification menu logic. | SOURCE-CONFIRMED `BaseLayout.astro:45-51`; `Navbar.tsx:141-500`. | Adds global JS/hydration work to every route and couples all pages to one large interactive component. | Keep server-rendered links and identity as the default; isolate only the dropdown/menu behavior and use the least aggressive client directive compatible with the required interaction. |
| DS-001 | P1 | Status semantics | Status presentation is split across central tones, task legacy maps, QC badge logic, lab maps, and raw inline labels. | SOURCE-CONFIRMED `statusTones.ts:22-78`, `labBadgeClasses.ts:14-67`, `StatusBadge.astro:1-16`, `QcStatusBadge.astro:1-5`, plus inline maps in `dashboard.astro:220-235`. | A user can see the same operational concept represented with different tone, label, or casing; this is risky for Pass/Fail/Overdue/Review decisions. | Define one semantic status vocabulary with domain adapters and migrate consumers incrementally; retain task compatibility through one explicit legacy adapter. |
| DS-002 | P1 | Action consistency | Canonical `AppButton` exists, but frequent screens still use raw button/link class strings. | SOURCE-CONFIRMED `AppButton.astro:34-59`; raw actions in `dashboard.astro:389-401`, `dashboard.astro:469`, `search.astro:280`, and many forms. | Loading, minimum height, destructive separation, and focus behavior drift. | Make AppButton the default for new/edited action rows and add a lightweight adoption guard for high-frequency routes. |
| A11Y-001 | P1 | Touch accessibility | Navbar bell and mobile menu controls are likely below the documented 44px target. | SOURCE-CONFIRMED `Navbar.tsx:351-359,485-489` use `p-2` with 20px SVGs; no `min-h-11 min-w-11`. | Harder operation on touch devices, especially in a dense header. | Give icon controls explicit 44px hit areas while preserving visual icon size; verify at 390px and with keyboard focus. |
| ARCH-003 | P2 | Page ownership | The written design system requires `PageHeader` for every top-level page, but many routes hand-roll headers. | SOURCE-CONFIRMED canonical `PageHeader.astro:1-27`; hand-rolled examples `dashboard.astro:241-246`, `search.astro:92-95`, `admin/users/index.astro:58-62`, `manager/new.astro:21-24`. | Header spacing, action placement, breadcrumbs, and title hierarchy drift as routes grow. | Adopt PageHeader incrementally on standard application screens; document explicit exceptions for print, auth, and special detail headers. |
| ARCH-004 | P2 | Domain module boundaries | Large task/validation/dashboard modules and large React panels combine orchestration with presentation. | SOURCE-CONFIRMED line counts: `taskUpdates.ts` 1,556; `validation.ts` 1,359; `dashboard.astro` 804; `TaskLifecycle.tsx` 799; `DashboardCharts.tsx` 685. | Slower code review and larger regression surface for future workflow additions. | Split by stable responsibility/use case, not by arbitrary file size; add focused tests around extracted pure functions. |
| PERF-001 | P2 | Bundle boundaries | Intended dynamic imports do not create chunks for `db.ts` and `validation.ts`. | RUNTIME-CONFIRMED `astro build` Vite warning: modules are dynamically and statically imported across many domain modules. | Lazy-loading assumptions are false; server bundle and future client boundaries may remain broader than expected. | Profile the built output and remove ineffective dynamic imports or establish genuinely separable boundaries; do not optimize without measured route/bundle data. |
| UX-003 | P2 | Error/recovery UX | Error, empty, conflict, and alert surfaces have several overlapping APIs. | SOURCE-CONFIRMED `OperationalState.astro:3-21`, `EmptyState.astro:7-45`, `Banner.astro`, `FlashNotice.astro`, and raw alert blocks such as `dashboard.astro:421-429`. | Recovery copy and action affordances can vary between domains, increasing user interpretation cost. | Use OperationalState for stateful route outcomes and Banner for inline notices; reserve FlashNotice for transport-level one-shot messages. |
| A11Y-002 | P2 | Focus system | Focus styling is not fully canonical even though the project has a documented scheme. | SOURCE-CONFIRMED `dashboard.astro:261,414,436` and search controls use `focus:ring-*`/`focus:outline-none`; `AppButton.astro:51-52` uses the canonical outline. | Makes visual keyboard QA inconsistent and can produce weaker focus visibility on some themes/browsers. | Standardize the focus utility contract in shared primitives and high-frequency controls; verify contrast and visibility on all interactive states. |
| UX-004 | P2 | Menu interaction | Custom menu roles are implemented with tab trapping but without a complete menu interaction model. | SOURCE-CONFIRMED `Navbar.tsx:317-340,374-443`; `role="menu"`, `role="menuitem"`, Tab trap, Escape handling, no arrow-key handling. | Keyboard users may experience an unfamiliar or incomplete menu model. | Either use disclosure navigation with native links and no menu role, or implement and test the complete chosen menu pattern; avoid mixing semantics. |
| DS-003 | P2 | Page/card density | Dashboard and lab surfaces use many local tones, arbitrary text sizes, and card variants despite a written scale. | SOURCE-CONFIRMED examples `dashboard.astro:436-439,488-493` use `text-[11px]`, local tones, and motion; `LabTestForm.tsx:592-760` uses multiple local panel treatments. | Makes visual hierarchy harder to evolve and increases CSS/design drift. | Treat the design-system tokens as a constrained vocabulary; add a token only when a repeated operational need is demonstrated. |
| A11Y-003 | P3 | Runtime coverage | Existing automated checks cover representative pages, but not all route/form combinations, zoom, mixed-language extreme values, or screen-reader behavior. | NEEDS-RUNTIME-VERIFICATION; screenshot runner covered 60 screens, while route manifest reports 114 file routes. | A passing representative gate can miss a defect in a less-used lab/admin route. | Add a risk-based manual matrix and a small set of targeted runtime checks for long forms, tables, async status, and print views; avoid blanket screenshot expansion. |

## 11. Quick Wins

- Raise navbar icon controls to explicit 44px hit areas and rerun responsive/a11y checks.
- Replace raw action classes in the dashboard and search filter toolbars with `AppButton` variants where the semantics already match.
- Add `PageHeader` to the dashboard, search, admin list, and task-creation routes first; record explicit exceptions.
- Make every status fallback use a human label and a canonical semantic tone; remove raw-code-only badges.
- Add a visible dashboard “urgent work” summary before the analytics blocks without removing existing data.
- Add section completion markers and a persistent section jump control to the lab form, preserving all current fields.
- Clear the 26 typecheck hints in touched modules to make future review signals more meaningful.

## 12. Structural Improvements

- Extract the lab test form into responsibility-based components/hooks while keeping one server-owned submission contract.
- Separate dashboard view-model construction from page markup and let charts consume a stable, typed analytics view model.
- Reduce global navbar hydration by server-rendering navigation and hydrating only menu/notification interactions.
- Establish one status vocabulary with domain adapters for task, lab tests, documents, equipment, calibration, findings, and notifications.
- Establish one form field/help/error contract and one action hierarchy; do not introduce a heavyweight form library unless measured requirements justify it.
- Define the mobile table policy per data type: card fallback for short records, contained horizontal scroll with sticky identifier for wide scientific registers.
- Add a feature-oriented component boundary gradually, starting with lab testing, dashboard analytics, and task detail/update flows.

## 13. What Should NOT Be Changed

- Do not replace Astro SSR with Next.js, a React SPA, or a client-rendered dashboard. The current Astro server boundary is appropriate.
- Do not move authorization into UI components. Server middleware/API/domain checks must remain authoritative.
- Do not remove the dedicated `PrintLayout.astro`; controlled print views are a correct isolated concern.
- Do not remove the lab secondary navigation or role filtering; it is a good wayfinding and least-privilege pattern.
- Do not flatten the lab domain back into generic task modules. Laboratory tests, equipment, calibration, maintenance, documents, and retests have distinct operational semantics.
- Do not hide QC fields merely to make forms shorter. Improve navigation, grouping, completion state, and validation while preserving traceability.
- Do not replace SQLite or the current migration/backup/audit approach without evidence that the current deployment model has outgrown it.
- Do not treat passing guards as a reason to stop UX review, but also do not duplicate their coverage without identifying a new failure mode.

## 14. IMPLEMENTATION PROMPTS

### PROMPT 01 — Normalize operational status semantics

**Goal**

Create one status presentation contract for task, lab test, document, equipment/calibration, findings, notifications, and account states, with explicit domain adapters where legacy task semantics must remain temporarily.

**Findings covered**

`DS-001`, `DS-003`

**Scope**

`src/components/ui/statusTones.ts`, `src/components/ui/labBadgeClasses.ts`, `src/components/StatusBadge.astro`, `src/components/QcStatusBadge.astro`, `src/components/lab/LabDocumentStatusBadge.astro`, and consumers under `src/pages/` and `src/components/`.

**Required skills**

Read `.agents/skills/design-system-governance/SKILL.md`, `.agents/skills/better-colors/SKILL.md`, `.agents/skills/accessibility-audit/SKILL.md`, and `.agents/skills/table-accessibility/SKILL.md`.

**Implementation requirements**

- Define labels, tone, optional icon, and domain meaning once.
- Preserve text labels; color must not be the only state signal.
- Keep task legacy mapping behind an explicit adapter during migration.
- Update the guard/tests to detect raw-code-only status presentation and conflicting mappings.

**Must preserve**

Server authorization, task legacy appearance where intentionally documented, WCAG AA contrast, and all current lifecycle meanings.

**Tests / verification**

`typecheck`, `test:ui-consistency`, `test:badge-contrast`, relevant domain tests, and runtime scans of task/lab/finding/document screens.

**Definition of done**

No duplicate semantic mapping remains for the same code without an explicit adapter; every visible status has text and the documented tone.

**Dependencies**

None.

### PROMPT 02 — Canonicalize page headers, buttons, alerts, and focus states

**Goal**

Bring high-frequency application screens onto the existing `PageHeader`, `AppButton`, `Banner`, `OperationalState`, and focus conventions without introducing a new UI framework.

**Findings covered**

`DS-002`, `ARCH-003`, `UX-003`, `A11Y-002`

**Scope**

Start with `src/pages/dashboard.astro`, `src/pages/search.astro`, task creation pages, admin lists/settings, and common alert/empty-state consumers; then migrate only justified adjacent screens.

**Required skills**

Read `.agents/skills/design-system-adoption/SKILL.md`, `.agents/skills/design-system-governance/SKILL.md`, `.agents/skills/form-design/SKILL.md`, and `.agents/skills/keyboard-review/SKILL.md`.

**Implementation requirements**

- Use the existing primitives and extend them only for repeated behavior.
- Preserve route-specific content and server form behavior.
- Standardize primary/secondary/destructive ordering and explicit loading labels.
- Add a small adoption guard for new raw action/header patterns in the selected surfaces.

**Must preserve**

Print/auth exceptions, existing URLs, form POST contracts, and the current English product language.

**Tests / verification**

`test:ui-consistency`, `typecheck`, `e2e:responsive`, keyboard/a11y checks, and screenshots at 390/1440.

**Definition of done**

Selected routes use canonical headers/actions/alerts, every interactive control retains visible focus, and no primary/destructive action semantics regress.

**Dependencies**

Prompt 01 should run first if statuses are touched.

### PROMPT 03 — Fix global navigation interaction and touch targets

**Goal**

Make global navigation accessible and efficient while reducing unnecessary global hydration.

**Findings covered**

`ARCH-002`, `A11Y-001`, `UX-004`

**Scope**

`src/layouts/BaseLayout.astro`, `src/components/Navbar.tsx`, navigation-related tests/scripts, and `src/components/lab/LabSecondaryNav.astro` only where contract alignment is needed.

**Required skills**

Read `.agents/skills/astro-developer/SKILL.md`, `.agents/skills/keyboard-review/SKILL.md`, `.agents/skills/responsive-design/SKILL.md`, and `.agents/skills/accessibility-audit/SKILL.md`.

**Implementation requirements**

- Preserve role-filtered server-rendered links.
- Give bell, mobile toggle, and other icon-only controls at least 44px hit areas.
- Choose one correct semantic pattern for “More” and notifications: disclosure navigation or a fully implemented menu pattern.
- Hydrate only the interaction surface that requires it, after measuring behavior and bundle impact.

**Must preserve**

Notification marking, Escape/focus restoration, role-based link visibility, and no page-level overflow at 390px.

**Tests / verification**

Existing a11y keyboard scenarios, `e2e:responsive`, route/architecture guards, and runtime keyboard tests at 390/1440.

**Definition of done**

All global controls meet target size, keyboard behavior follows the chosen native/custom pattern, and global hydration is no broader than required.

**Dependencies**

None.

### PROMPT 04 — Decompose the laboratory test form

**Goal**

Reduce the responsibility and regression surface of `LabTestForm` while preserving the exact QC data model and server submission contract.

**Findings covered**

`ARCH-001`, `UX-002`, `A11Y-003`

**Scope**

`src/components/lab/LabTestForm.tsx`, related lab form types/validation, `src/pages/lab/tests/new.astro`, and existing lab form tests.

**Required skills**

Read `.agents/skills/astro-developer/SKILL.md`, `.agents/skills/form-design/SKILL.md`, `.agents/skills/accessible-content-structure/SKILL.md`, `.agents/skills/responsive-design/SKILL.md`, and `.agents/skills/table-accessibility/SKILL.md`.

**Implementation requirements**

- Separate draft/unload lifecycle, section field groups, reference data, sample results, authorization/result, and submit/action state.
- Add reliable section navigation and completion/error summaries.
- Preserve all required fields, units, scientific values, sample rows, and server-side validation.
- Keep browser behavior progressively usable before hydration where possible.

**Must preserve**

No removal or hiding of QC-required information, no client-only validation authority, no change to lifecycle or e-signature rules.

**Tests / verification**

`test:lab-form`, `test:form-productivity`, `test:lab-ux-presentation`, `e2e:responsive`, a11y keyboard scenarios, and manual 320/390/1440 data-entry walkthrough.

**Definition of done**

The form has stable typed sub-boundaries, clear section/error navigation, equivalent persisted payloads, and no regression in draft/submit/review flows.

**Dependencies**

Prompt 02 should run first if action/header primitives are changed.

### PROMPT 05 — Refactor dashboard view-model and priority layout

**Goal**

Keep the dashboard’s complete analytics while improving daily QC prioritization and separating route orchestration from presentation.

**Findings covered**

`UX-001`, `ARCH-004`, `PERF-001`

**Scope**

`src/pages/dashboard.astro`, `src/lib/dashboard.ts`, `src/components/DashboardCharts.tsx`, `src/components/LabDashboardCharts.tsx`, and dashboard runtime tests.

**Required skills**

Read `.agents/skills/information-architecture/SKILL.md`, `.agents/skills/better-layout/SKILL.md`, `.agents/skills/astro-developer/SKILL.md`, and `.agents/skills/responsive-design/SKILL.md`.

**Implementation requirements**

- Define a typed dashboard view model separate from markup.
- Put urgent/overdue/blocker/action queues before lower-frequency analytics.
- Preserve filter scope, drill-down URLs, role visibility, and all existing metrics.
- Measure chart hydration and built output before changing client directives.

**Must preserve**

Server-side filtering, role-specific dashboard visibility, pure SVG chart behavior, and deep-link anchors.

**Tests / verification**

Dashboard E2E, route manifest, `typecheck`, performance script, screenshots at 390/1440, and a representative filter/drill-down workflow.

**Definition of done**

The route is a thin server adapter, urgent work is prominent, analytics remain reachable, and measured hydration/bundle behavior is equal or better.

**Dependencies**

Prompt 03 for shared navigation changes; otherwise independent.

### PROMPT 06 — Establish shared error, empty, and form feedback behavior

**Goal**

Make route states and form errors predictable across tasks, lab, search, reports, and administration.

**Findings covered**

`UX-003`, `A11Y-003`

**Scope**

`src/components/OperationalState.astro`, `src/components/EmptyState.astro`, `src/components/ui/Banner.astro`, `src/components/FlashNotice.astro`, `src/components/ui/formPresets.ts`, and representative route consumers.

**Required skills**

Read `.agents/skills/error-handling-ux/SKILL.md`, `.agents/skills/error-prevention-recovery/SKILL.md`, `.agents/skills/form-design/SKILL.md`, and `.agents/skills/accessibility-audit/SKILL.md`.

**Implementation requirements**

- Define when each state component is used.
- Ensure error text names recovery and is associated with the relevant control.
- Preserve one-shot flash transport semantics.
- Add result-count and active-filter messaging where the screen has filters.

**Must preserve**

Existing server redirects, CSRF/auth behavior, and no sensitive data in client messages.

**Tests / verification**

Form/product/lab tests, a11y structural checks, empty/error/conflict runtime scenarios, and screenshots.

**Definition of done**

Equivalent states use the same semantics and all tested errors have a visible recovery path and accessible association.

**Dependencies**

Prompt 02 if Banner/Button APIs change.

### PROMPT 07 — Standardize dense tables and mobile data access

**Goal**

Make registers and data-dense QC screens predictable at mobile widths without hiding scientific or audit data.

**Findings covered**

`DS-003`, `A11Y-003`

**Scope**

Lab registers, task/search/results tables, `src/components/ui/Pagination.astro`, and table-related page consumers.

**Required skills**

Read `.agents/skills/table-accessibility/SKILL.md`, `.agents/skills/responsive-review/SKILL.md`, `.agents/skills/responsive-design/SKILL.md`, and `.agents/skills/information-architecture/SKILL.md`.

**Implementation requirements**

- Keep semantic table markup and header associations.
- Choose card fallback or contained scroll with sticky identifier per register type.
- Preserve access to every value, status, filter, sort, and row action.
- Keep identifiers and numeric measurement alignment readable.

**Must preserve**

Server pagination/filter URLs, audit traceability, and full data availability.

**Tests / verification**

Table accessibility checks, responsive E2E, 320/390/768/1440 runtime checks, and long identifier/numeric fixture data.

**Definition of done**

Every targeted register has an explicit mobile policy, no important value is clipped or hidden without access, and keyboard/screen-reader table semantics remain valid.

**Dependencies**

Prompt 01 for status presentation and Prompt 02 for action primitives.

### PROMPT 08 — Split task and validation ownership incrementally

**Goal**

Reduce maintenance risk in the largest task/validation modules without changing task lifecycle behavior.

**Findings covered**

`ARCH-004`, `PERF-001`

**Scope**

`src/lib/taskUpdates.ts`, `src/lib/validation.ts`, `src/components/TaskLifecycle.tsx`, `src/components/TaskUpdatePanel.tsx`, and their direct tests.

**Required skills**

Read `.agents/skills/astro-developer/SKILL.md`, `.agents/skills/receiving-code-review/SKILL.md`, `.agents/skills/design-qa-checklist/SKILL.md`, and `.agents/skills/accessibility-test-plan/SKILL.md`.

**Implementation requirements**

- Split by use case and stable responsibility, not arbitrary line count.
- Extract pure validation/policy functions before moving I/O.
- Preserve transaction boundaries, audit writes, evidence gates, workflow invariants, and authorization checks.
- Remove ineffective dynamic imports only after measuring build/runtime impact.

**Must preserve**

All task lifecycle semantics, server-side policy authority, API payloads, and current database invariants.

**Tests / verification**

Full domain test chain, architecture guard, typecheck, production build, task E2E, and a before/after route/bundle measurement.

**Definition of done**

Each extracted module has a clear owner and focused tests; behavior and server trust boundaries are unchanged.

**Dependencies**

Prompt 01 if validation/status presentation is changed; otherwise independent.


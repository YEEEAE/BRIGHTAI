# BrightAI Kernel: Master UI/UX and Frontend Audit

**Repository:** [YEEEAE/BRIGHTAI](https://github.com/YEEEAE/BRIGHTAI)  
**Branch audited:** `main`  
**Head observed:** `4cc1e9845b63da2395c001c71687e70a8f88068e`, pushed 2026-08-09 00:05 UTC  
**Audit mode:** source-first static audit, no repository modifications

## Executive verdict

**WORLD-CLASS STATUS: NO**  
**FINAL KERNEL EXPERIENCE SCORE: 78%**  
**DESIGN MATURITY: LEVEL 3 / 5, Design System**

Kernel is materially better than a generic prototype. The shared shell, Arabic-first content, RTL-aware CSS, explicit demo labeling, governance vocabulary, trace drawer, command palette, scenario handoff, skeleton and empty-state components, and mobile drawer work show real product intent. It is not yet world-class enterprise UX because production truth is mixed with seeded demo behavior, the shell is visually dense, page-specific code is oversized, interaction semantics are uneven, and runtime evidence is missing.

**Evidence labels:** `MEASURED` means directly countable from repository metadata or source. `OBSERVED` means directly visible in source. `INFERRED` means reasoned risk from source patterns. `NOT MEASURED` means browser, Lighthouse, screen-reader, screenshot, or runtime evidence was unavailable.

## Scope and limitations

Inspected current `main` metadata, recent Kernel commits, `src/pages/kernel/**`, `KernelLayout.astro`, `kernel.css`, `src/data/kernel.ts`, representative high-value page sources, shared Kernel component inventory, and existing production-vs-demo documentation. The complete route tree contains 21 Kernel routes including `admin/quota`. Current source is authoritative; historical recommendations were not treated as proof of completion.

`NOT MEASURED`: browser execution, screenshots at requested widths, pixel diffs, Lighthouse, Core Web Vitals, JS/CSS transfer sizes, axe/WAVE, keyboard-only runtime testing, VoiceOver/NVDA, network throttling, API latency, real production data behavior, and Arabic review by a native Saudi language specialist.

The percentages below are **source-audit heuristics**, not test results. For each category, score = weighted review of implementation evidence, consistency across inspected sources, and completeness of explicit states. Runtime-dependent categories are capped when runtime evidence is absent.

## Route inventory

| Route | Source | Purpose | Key evidence | Cognitive load | Overall |
|---|---|---|---|---:|---:|
| `/kernel/` | `src/pages/kernel/index.astro` | Dashboard and Kernel onboarding | KPI grid, status strip, risk chart, activity, 5-step journey, demo disclaimer | High | 84 |
| `/kernel/playground/` | `playground.astro`, `kernel/assets/css/pages/playground.css` | Local governance pipeline experiment | 3-column editor, 10 stages, A/B, recipes, policies | Critical | 82 |
| `/kernel/chat/` | `chat.astro` | Governed AI conversation | 3 panes, seeded thread, streaming simulator, provider status, policy banners | High | 79 |
| `/kernel/scenarios/` | `scenarios.astro` | Saudi scenario catalog and launch | Scenario cards and handoff to chat | Medium | 82 |
| `/kernel/redteam/` | `redteam.astro` | Adversarial testing | Attack/test workflow | High | 76 |
| `/kernel/policies/` | `policies.astro` | Policy inspection and editing | Policy list and controls | High | 77 |
| `/kernel/audit/` | `audit.astro` | Audit log investigation | Filters, table/cards, hash copy, drawer, exports | High | 83 |
| `/kernel/approvals/` | `approvals.astro` | Human review queue | Decision workflow, delegation, trace links | High | 81 |
| `/kernel/replay/` | `replay.astro` | Replay and reconstruction | Trace-based replay | High | 77 |
| `/kernel/compliance/` | `compliance.astro` | Compliance packs and gaps | 6 packs, progress controls, Saudi map, print export | High | 80 |
| `/kernel/evidence/` | `evidence.astro` | Evidence files and verification | Large source, evidence browsing and actions | High | 78 |
| `/kernel/reports/` | `reports.astro` | Governance reports | Report generation and export | High | 78 |
| `/kernel/stats/` | `stats.astro` | Operational metrics | KPI/chart dashboard | High | 76 |
| `/kernel/models/` | `models.astro` | Model/provider management | Model list and configuration | Medium | 79 |
| `/kernel/connectors/` | `connectors.astro` | Integration management | Connector cards/configuration | Medium | 80 |
| `/kernel/api/` | `api.astro` | Developer integration | API guidance and code | High | 81 |
| `/kernel/datasets/` | `datasets.astro` | Dataset management | Dataset list/actions | High | 77 |
| `/kernel/scorers/` | `scorers.astro` | Output scorers | Scorer definitions | High | 77 |
| `/kernel/eval/` | `eval.astro` | Evaluation workflow | Create/run/analyze evaluation | Critical | 76 |
| `/kernel/offline/` | `offline.astro` | Offline/degraded state | Offline messaging | Low | 74 |
| `/kernel/admin/quota/` | `admin/quota.astro` | Administration and quotas | Quota control | High | 75 |

**Discovery note:** the requested conceptual categories `Dashboard`, `Playground`, `Chat`, `Scenarios`, `Red Team`, `Policies`, `Audit`, `Approvals`, `Replay`, `Compliance`, `Evidence`, `Reports`, `Stats`, `Models`, `Connectors`, `API`, `Datasets`, `Scorers`, `Evaluation`, `Offline`, and `Admin` all map to discovered routes.

## Current Kernel frontend dependency map

```text
Kernel pages
  -> KernelLayout.astro
      -> BaseLayout.astro
      -> KernelSidebar.astro
      -> KernelJourneyProgress.astro
      -> KernelJourneyContext.astro
      -> public/js/kernel-eval-store.js
      -> public/js/kernel-shell.js
      -> public/js/kernel-drawer.js
      -> src/styles/kernel.css
  -> shared Kernel components
      -> KernelCard, KernelBadge, KernelMetricCard, KernelStatusStrip
      -> KernelEmptyState, KernelSkeleton, KernelDemoPill
      -> KernelAiAssistant, KernelLeadForm, KernelContactCta
      -> KernelContextLinks, KernelSeoSection
      -> KernelActivityList, KernelActivityItem, KernelRiskChart
  -> page-specific inline markup/scripts/styles
      -> especially chat.astro, audit.astro, evidence.astro, index.astro
  -> data layer
      -> src/data/kernel.ts
      -> src/data/kernel-journey.ts
      -> src/data/kernel-policies.ts
      -> schema helpers
  -> global visual system
      -> BaseLayout imports and global tokens
      -> kernel.css scoped overrides on body.kernel-shell
```

**Architecture finding:** `OBSERVED`, good shell centralization exists, but the system still has two competing layers: older generic Kernel primitives near the top of `kernel.css` and the later KRN-DS-2026-07-31 shell override. This is a maintenance seam, not just a styling detail.

**Oversized/tightly coupled candidates:** `chat.astro` contains seeded data, scenario runtime mirroring, UI, error handling, analytics, session management, and streaming behavior. `evidence.astro` is 67KB and `index.astro` is 53KB. `KernelAiAssistant.astro` is 39KB. These should be split by domain behavior, not merely by visual section.

**Reusable opportunities:** one canonical `KernelButton`, `KernelIconButton`, `KernelField`, `KernelDataTable`, `KernelDrawer`, `KernelDialog`, `KernelStatus`, `KernelToolbar`, `KernelExportMenu`, and `KernelEntityCard` would remove repeated page-specific interaction vocabulary.

## Reverse-engineered design tokens

| Token family | Current source evidence | Audit read |
|---|---|---|
| Base | `#080d16` | Strong dark ink base, but hardcoded hex rather than perceptual token scale |
| Surface | `#131c30`, `#1b2740` | Clear 3-step elevation intent |
| Text | `#f2f6ff`, `#a7b4cc`, `#7a8ba5` | Good hierarchy intent; contrast still needs runtime verification |
| Accent | `#2dd4a7`, `#5be8c0`, `#22b593`, `#1b9e80` | Distinctive mint system, stronger than the usual blue AI palette |
| Layout | max 1400px, 260px desktop sidebar, 72px collapsed, 320px mobile drawer | Enterprise shell is plausible; fixed width needs viewport testing |
| Spacing | `--space-1` through `--space-8` | Semantic usage is good, but page-local values still appear |
| Radius | `--radius-sm/md/lg/full` | Consistent vocabulary exists |
| Motion | `--duration-fast/base`, `--ease-out`, shimmer, reveal observer | Reduced-motion handling is present in several places, not proven global |
| Touch | 44px minimum patterns | Strong intent, full button inventory still required |
| Typography | `--text-xs` through `--text-4xl`, `--font-mono`, leading tokens | Good scale, but source audit cannot confirm rendered Arabic metrics |
| Z-index | values such as 60, 70, 200 | Needs semantic scale, current values are scattered |

**Missing or risky tokens:** semantic button sizes, control heights, focus ring, overlay/backdrop, drawer/modal layers, table density, chart colors, status background pairs, input error/success, and explicit `--motion-reduced` behavior. The system uses gradients and alpha colors in the shell, which need contrast and visual consistency review.

## Findings by discipline

### UI design and visual hierarchy

`OBSERVED`: the mint-on-ink direction is coherent, the sidebar/topbar hierarchy is recognizable, and the dashboard has a credible operational shape. `OBSERVED`: page headers, KPI cards, status strips, cards, tables, badges, trace concepts, and Arabic labels are repeatedly represented. `INFERRED`: the overall experience is too card-heavy and too information-forward for first contact. The dashboard adds a 5-step onboarding route above an already dense operational dashboard, while the shell exposes Trace, commands, role, Demo, inference, DB, and latency signals at once.

**Strong advice:** stop adding panels. Make the first screen answer one question: â€œWhat needs attention now?â€ Put the journey behind a compact â€œStart hereâ€ affordance for first-time users, and give returning operators the queue, risk, and unresolved actions immediately.

### Information architecture

`OBSERVED`: the command palette groups quick commands, pages, policies, scenarios, and reports. `OBSERVED`: cross-links and route metadata are centralized in `src/data/kernel.ts`. `INFERRED`: the navigation taxonomy is still feature-based rather than task-based. CISO, compliance, developer, and operator workflows all see essentially the same surface. `INFORMATION ARCHITECTURE: 79%`, source heuristic.

Role-aware navigation would materially improve the product. Default groups should be: Monitor, Investigate, Govern, Evaluate, Integrate, Admin. Keep the full route inventory discoverable, but do not make every role parse every module.

### Interaction design

`OBSERVED`: audit has filter application, empty-state reset, hash copy, drawer opening, keyboard row activation, Escape close, and exports. Chat has error classes, fake streaming, scenario context, mobile drawers, and a live-region strategy. Compliance has expandable controls. These are strong foundations.

`INFERRED`: interaction semantics are not yet unified. Some page actions are buttons, some are button-like links, some row interactions depend on `tabindex` and key handlers, and export PDF is explicitly a print stub. The shell's overlay and drawer code needs a single modal/drawer contract with focus return, inert background, scroll lock, and focus trap verification.

`INTERACTION QUALITY: 78%`, source heuristic. `BUTTON UX: 76%`, `BUTTON CONSISTENCY: 72%`, `BUTTON ACCESSIBILITY: 74%`, all source heuristics, not a complete runtime count.

### Responsive and mobile UX

`OBSERVED`: CSS uses mobile-first grids, logical properties, 44px touch targets, `dvh`, mobile chat drawers, and table overflow/card transformation patterns. `OBSERVED`: breakpoints cluster around 640, 768, 1024, and 1280. `INFERRED`: 3-column Playground, dense Evidence, Audit exports, charts, map, and command palette are high-risk at 320px to 414px. No screenshot or browser validation was available.

`MOBILE UX: 72%`, `DESKTOP UX: 84%`, `RESPONSIVE QUALITY: 76%`, source heuristics. **NOT MEASURED** at 320, 360, 375, 390, 414, 768, 1024, 1280, 1440, or 1920px.

### Accessibility

`OBSERVED`: skip link, RTL logical properties, 44px patterns, `aria-expanded`, `aria-hidden`, reduced-motion branches, labels and live-region comments exist. `OBSERVED`: audit rows are keyboard-activated in JS and chat avoids announcing every streamed token. `INFERRED`: source comments are not a WCAG result. Focus trapping, dialog semantics, heading hierarchy, label association, color contrast, chart alternatives, and state announcements remain unverified.

`ACCESSIBILITY: 78%`, source heuristic. `NOT MEASURED`: WCAG 2.2 AA, axe, screen readers, keyboard-only runtime, contrast calculator, or mobile assistive technology.

### Performance and perceived performance

`OBSERVED`: Astro server rendering is used, Kernel CSS is loaded at the shared layout, and several pages expose skeletons. `OBSERVED`: chat includes inline runtime logic and fake streaming; page sources are large, with chat around 100KB, evidence around 68KB, and dashboard around 53KB by repository metadata. `INFERRED`: inline page scripts and duplicated browser-side scenario metadata increase maintenance and possibly page weight; actual JS transfer and hydration are not known.

`PERFORMANCE: 69%`, `PERCEIVED PERFORMANCE: 78%`, source heuristics. All LCP, INP, CLS, FCP, TTFB, JS size, CSS size, page weight, request count, and bundle measurements are `NOT MEASURED`.

### Product honesty and demo transparency

`OBSERVED`: `KernelDemoPill`, â€œØ¨ÙŠØ§Ù†Ø§Øª ØªØ¬Ø±ÙŠØ¨ÙŠØ©â€, the chat disclaimer, static seeded rows, seeded compliance packs, and fake responses are present. This is a major strength. `OBSERVED`: audit export PDF downloads a text file, compliance PDF calls `window.print()`, and chat can fall back to fake responses when the API is unavailable. `INFERRED`: an enterprise buyer can still mistake realistic values, dates, audit records, provider metadata, and compliance percentages for live evidence if the warning is not adjacent to each affected widget.

`PRODUCT HONESTY: 71%`. Required fix: every seeded widget needs an always-visible local label, an explanation of data origin, and a production capability state such as â€œDemo datasetâ€, â€œConnectedâ€, â€œUnavailableâ€, or â€œNot configuredâ€. Never show a realistic compliance percentage without an explicit demo/data provenance label beside it.

### Saudi, Arabic, and RTL UX

`OBSERVED`: Arabic is the primary content language, Saudi frameworks are named directly, dates and numerals use Arabic formatting in places, and logical CSS properties are used. `INFERRED`: Saudi dialect in product microcopy is warm and accessible for demos, but regulated enterprise workflows need a dual register: plain Arabic for action labels and formal Arabic for policy, audit, compliance, and legal-adjacent text. `SAUDI UX: 82%`, source heuristic. Native linguistic review, RTL browser testing, Arabic number/date consistency, and government usability are `NOT MEASURED`.

### Enterprise UX and trust

`OBSERVED`: trace IDs, hash chain, approvals, evidence, compliance packs, provider status, session metadata, and explicit human review concepts are exactly the right enterprise primitives. `INFERRED`: trust is weakened by static demo values, stubbed exports, â€œvisually validâ€ hash language, and a shell that can look more certain than its data state. `ENTERPRISE UX: 77%`.

## User journey audit

| Journey | Source assessment | Efficiency |
|---|---|---:|
| First visit to first meaningful action | Onboarding exists, but dashboard density competes with it | 78 |
| Playground prompt to result | Powerful, but 3 columns, 10 stages, policies, model, dataset, context, A/B create decision overload | 72 |
| Chat prompt to governed result | Strong governance narrative and feedback, but demo/API fallback ambiguity | 78 |
| Policies inspect, modify, save | Route exists; runtime save semantics require validation | 72 |
| Audit locate and inspect | Strong filters, drawer, trace/hash concepts; seeded/static behavior limits trust | 82 |
| Approvals review and decide | Good human gate direction; destructive/irreversible decision semantics need runtime confirmation | 78 |
| Evidence inspect and export | Valuable enterprise object, but source size and export truth are risks | 73 |
| Compliance identify gap | Pack and controls model is clear, but high scores can overstate readiness | 76 |
| Evaluation create, run, analyze | Correct concept, highest cognitive load; needs guided task flow | 68 |
| Developer API integrate | High-value route; needs a clear time-to-first-call path | 79 |

`JOURNEY EFFICIENCY: 75%`, source heuristic. `TIME-TO-FIRST-VALUE: 76%`, source heuristic. The fastest path to improvement is one guided task per role, not more dashboard content.

## Page scorecard

| Page | UI | UX | A11y | Mobile | Perf | Interaction | Consistency | Load | States | Overall |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Dashboard | 88 | 84 | 79 | 78 | 72 | 83 | 86 | High | 80 | 84 |
| Playground | 86 | 78 | 76 | 64 | 66 | 84 | 78 | Critical | 78 | 82 |
| Chat | 84 | 80 | 77 | 70 | 65 | 86 | 78 | High | 82 | 79 |
| Scenarios | 84 | 82 | 78 | 80 | 76 | 78 | 84 | Medium | 78 | 82 |
| Red Team | 80 | 75 | 74 | 72 | 72 | 78 | 78 | High | 74 | 76 |
| Policies | 80 | 76 | 75 | 73 | 73 | 77 | 79 | High | 74 | 77 |
| Audit | 86 | 84 | 80 | 76 | 72 | 86 | 84 | High | 82 | 83 |
| Approvals | 84 | 81 | 79 | 75 | 73 | 84 | 82 | High | 80 | 81 |
| Replay | 80 | 75 | 75 | 72 | 72 | 78 | 78 | High | 74 | 77 |
| Compliance | 85 | 79 | 77 | 72 | 72 | 80 | 83 | High | 78 | 80 |
| Evidence | 82 | 77 | 76 | 70 | 64 | 78 | 80 | High | 74 | 78 |
| Reports | 81 | 77 | 76 | 72 | 70 | 77 | 80 | High | 74 | 78 |
| Stats | 80 | 75 | 74 | 72 | 71 | 75 | 79 | High | 72 | 76 |
| Models | 82 | 79 | 77 | 76 | 74 | 78 | 82 | Medium | 76 | 79 |
| Connectors | 83 | 80 | 77 | 77 | 75 | 79 | 83 | Medium | 78 | 80 |
| API | 84 | 81 | 78 | 74 | 75 | 80 | 82 | High | 77 | 81 |
| Datasets | 80 | 76 | 75 | 72 | 70 | 77 | 79 | High | 74 | 77 |
| Scorers | 80 | 76 | 75 | 72 | 70 | 77 | 79 | High | 74 | 77 |
| Evaluation | 79 | 72 | 73 | 68 | 66 | 77 | 77 | Critical | 70 | 76 |
| Offline | 78 | 78 | 78 | 80 | 78 | 70 | 78 | Low | 80 | 74 |
| Admin Quota | 79 | 73 | 74 | 70 | 71 | 75 | 77 | High | 72 | 75 |

**Best:** Audit, Dashboard, Scenarios.  
**Weakest:** Admin Quota, Evaluation, Stats, Red Team. The weakness is not visual ugliness. It is operational clarity, state completeness, and density.

## Final scorecard

| Metric | Score | Method |
|---|---:|---|
| UI Design | 84 | Visual language and hierarchy review of shared shell and representative pages |
| UX Design | 78 | Task clarity, friction, recovery, and prioritization review |
| Visual Hierarchy | 80 | Page header to content rhythm, contrast, density review |
| Design Consistency | 79 | Cross-page token and component consistency review |
| Design System | 78 | Token coverage, shared primitives, variants, and duplication review |
| Interaction | 78 | Source review of states, handlers, keyboard paths, feedback |
| Navigation | 80 | Shell, sidebar, breadcrumbs, command palette, cross-links |
| Information Architecture | 79 | Findability and task grouping review |
| Cognitive Load | 70 | Density, decision count, terminology, competing actions |
| Role UX | 70 | Role needs mapped against current shared navigation |
| Journey Efficiency | 75 | Ten journey paths, inferred steps and friction |
| Time-to-First-Value | 76 | Entry-to-result path review |
| Accessibility | 78 | Source evidence only, runtime capped |
| Responsive | 76 | CSS and markup intent, no browser verification |
| Mobile UX | 72 | Mobile transformations and high-risk layouts |
| Desktop UX | 84 | Desktop shell and data-dense workflows |
| Performance | 69 | Source and file-size signals, no runtime metrics |
| Perceived Performance | 78 | Skeleton, fake streaming, feedback, empty states |
| Motion | 77 | Motion and reduced-motion source review |
| Component Quality | 78 | Reuse, state design, coupling, source sizes |
| Frontend Architecture | 74 | Astro composition, inline logic, boundaries, duplication |
| Maintainability | 68 | Oversized files, duplicated metadata, CSS layers, inline scripts |
| State Completeness | 75 | Loading, empty, error, offline, demo, permission state evidence |
| Microcopy | 80 | Arabic/English labels, clarity, enterprise tone |
| Enterprise UX | 77 | Auditability, control, trust, recovery |
| Saudi UX | 82 | Arabic, RTL, Saudi frameworks, local context |
| Product Honesty | 71 | Demo labels versus realistic seeded/stubbed behavior |
| Design Maturity | 78 | Maturity rubric: system present, but not production-hardened |

**FINAL KERNEL EXPERIENCE SCORE: 78%**. This is a weighted source-audit score, not a measured product score. No category is allowed to claim 95% without runtime validation.

## Top 10 blockers to 95%+

1. Demo data, fake responses, stubbed exports, and production states are not consistently separated at widget level.
2. Shared shell exposes too many high-salience signals before the user has a task.
3. Three-column Playground is powerful but cognitively overloaded.
4. Large Astro pages mix data, markup, CSS, analytics, and interaction logic.
5. Button, field, drawer, table, export, and status primitives are not fully canonical.
6. Accessibility is thoughtfully annotated but not runtime-proven.
7. Mobile layouts are designed in CSS but not validated at the requested widths.
8. Compliance percentages risk implying legal or production readiness.
9. Role-aware navigation and dashboard prioritization are missing.
10. Performance cannot be defended because runtime budgets and measurements are absent.

## Top 10 strengths, DO NOT BREAK

1. Arabic-first Kernel content.
2. RTL logical properties.
3. Distinctive mint-on-ink visual direction.
4. Shared `KernelLayout`.
5. Skip-link and keyboard intent.
6. Trace drawer as a cross-page mental model.
7. Command palette as a fast navigation layer.
8. Demo labeling and disclaimers.
9. Human approval as a first-class governance concept.
10. Saudi regulatory framing: PDPL, NCA ECC, SDAIA, SFDA, SAMA, ISO 42001.

## Top 20 quick wins

1. Put â€œDemo datasetâ€ beside every realistic KPI, row, chart, map, and compliance score.
2. Replace â€œPDFâ€ stub labels with â€œPrint summaryâ€ until real PDF generation exists.
3. Add one canonical button and icon-button component with all eight states.
4. Add `aria-label` and tooltip rules for every icon-only control.
5. Add a compact first-visit mode that collapses secondary dashboard widgets.
6. Make the primary CTA unique per page.
7. Add a persistent page-level â€œYou are hereâ€ breadcrumb on mobile drawers.
8. Add â€œwhy this was blockedâ€ and â€œwhat nextâ€ to every governance decision.
9. Convert Audit row click into an explicit â€œView detailsâ€ action while preserving row keyboard support.
10. Add `aria-live` success text for copy/export actions.
11. Add a clear â€œnot connectedâ€ state to provider badges.
12. Add production/demo provenance to the compliance map.
13. Use `font-variant-numeric: tabular-nums` for metrics and tables.
14. Add `text-wrap: balance` to page titles.
15. Create semantic z-index tokens.
16. Remove duplicate scenario metadata from client code by serializing one sanitized blob.
17. Add a â€œReset all filtersâ€ action to every filter-heavy page.
18. Make mobile table cards show labels before values, not just hide columns.
19. Add a visible cancel action to fake and real streaming.
20. Add a role switch explanation, not just a role switch control.

## UX debt register

| ID | Page/component | Evidence | Impact | Priority | Effort | Recommendation |
|---|---|---|---|---|---|---|
| K-P0-01 | All demo widgets | Seeded data and realistic values across pages | Enterprise trust failure | P0 | M | Add provenance state beside every widget |
| K-P0-02 | Audit exports | PDF path downloads `.txt` summary | Misleading action | P0 | S | Rename to print summary or implement real PDF |
| K-P0-03 | Compliance | High compliance scores with demo packs | Legal/compliance misinterpretation | P0 | M | Add readiness disclaimer and source timestamp |
| K-P1-01 | KernelLayout | Dense topbar plus sidebar plus trace concepts | High first-use load | P1 | M | Add role/task mode and progressive disclosure |
| K-P1-02 | Playground | Three columns and 10 stages | Critical cognitive load | P1 | L | Guided mode first, expert mode second |
| K-P1-03 | chat.astro | Mixed UI, session, analytics, fake streaming, scenario mirror | Regression risk | P1 | L | Split into data, controller, view, states |
| K-P1-04 | evidence.astro | 67KB source | Slow iteration and unclear boundary | P1 | L | Split evidence list, detail, export, verification |
| K-P1-05 | kernel.css | Legacy primitives plus later shell overrides | Token drift | P1 | M | Consolidate into one canonical layer |
| K-P1-06 | Mobile Audit/Playground | No runtime screenshots | Unknown overflow and touch defects | P1 | M | Add viewport matrix visual regression suite |
| K-P1-07 | All buttons | No single canonical button contract | Inconsistent states | P1 | M | Create button primitive and inventory |
| K-P2-01 | Navigation | Feature taxonomy dominates | Role friction | P2 | M | Add role-aware grouped nav |
| K-P2-02 | Stats | Metrics without action context | Low decision value | P2 | M | Add â€œso whatâ€ callouts and drill-down actions |
| K-P2-03 | Evaluation | Dense create/run/analyze path | Slow time-to-value | P2 | L | Turn into 3-step workflow |
| K-P2-04 | Arabic copy | Saudi dialect and formal register mixed | Enterprise tone inconsistency | P2 | M | Define microcopy register rules |
| K-P2-05 | Charts/maps | Accessibility alternatives unverified | Screen-reader exclusion | P2 | M | Add data tables and text summaries |
| K-P3-01 | Motion | Inline reveal/shimmer patterns vary | Motion inconsistency | P3 | S | Centralize motion tokens and reduced-motion rules |
| K-P3-02 | Z-index | Numeric values scattered | Overlay bugs | P3 | S | Semantic layering tokens |
| K-P3-03 | Admin Quota | Admin route isolated from nav mental model | Findability | P3 | S | Add Admin group and permission state |

## 50-point strength and problem register

### Strength register, 50 concise points

1 shared shell, 2 RTL logical CSS, 3 Arabic-first copy, 4 mint identity, 5 trace ID concept, 6 hash chain concept, 7 approval gate, 8 demo pill, 9 demo disclaimer, 10 command palette, 11 skip link, 12 mobile drawer intent, 13 44px touch intent, 14 `dvh`, 15 reduced motion branches, 16 skeleton component, 17 empty state component, 18 seeded scenario handoff, 19 policy context, 20 Audit filters, 21 Audit drawer, 22 hash copy, 23 CSV/JSON export intent, 24 compliance packs, 25 control expansion, 26 Saudi map context, 27 chat provider status, 28 chat policy banner, 29 chat error taxonomy, 30 live-region caution, 31 Playground local-first promise, 32 10-stage pipeline, 33 A/B comparison, 34 recipes, 35 code export intent, 36 API route, 37 connectors route, 38 model route, 39 evidence route, 40 report route, 41 role switch intent, 42 cross-links, 43 SEO metadata centralization, 44 FAQ schema intent, 45 Storybook-style component stories, 46 logical direction-aware layout, 47 explicit PII warnings, 48 human-in-the-loop language, 49 offline route, 50 route discovery completeness.

### Problem register, 50 concise points

1 demo truth ambiguity, 2 PDF stub naming, 3 print-only export, 4 seeded audit timestamps, 5 static compliance scores, 6 static provider metadata, 7 fake chat streaming, 8 fake response fallback, 9 no widget provenance standard, 10 no production connection state, 11 dense topbar, 12 feature-first nav, 13 no role dashboard, 14 3-column Playground, 15 10-stage choice overload, 16 large chat page, 17 large evidence page, 18 large dashboard page, 19 inline scripts, 20 duplicate scenario map, 21 competing CSS eras, 22 page-local styles, 23 page-local buttons, 24 no canonical data table, 25 no canonical field, 26 no canonical drawer, 27 no canonical export menu, 28 no canonical status, 29 focus trap unverified, 30 focus return unverified, 31 inert background unverified, 32 chart alternatives unverified, 33 contrast unverified, 34 screen reader unverified, 35 keyboard runtime unverified, 36 mobile overflow unverified, 37 touch target runtime unverified, 38 orientation unverified, 39 performance unmeasured, 40 Core Web Vitals unmeasured, 41 state matrix incomplete, 42 permissions state inconsistent, 43 provider outage path inconsistent, 44 offline recovery thin, 45 admin findability, 46 evaluation flow density, 47 stats actionability, 48 Arabic register mixing, 49 legal-sounding certainty, 50 no regression baseline.

## Redesign roadmap

| Phase | Objective | Primary files | Effort | Expected impact |
|---|---|---|---:|---:|
| 0 Critical fixes | Truth labels, export honesty, compliance disclaimers | `chat.astro`, `audit.astro`, `compliance.astro`, shared demo components | 1 week | +5 trust, lower P0 risk |
| 1 UX consistency | Canonical buttons, fields, tables, drawers, statuses | `src/components/kernel/**`, `kernel.css` | 1-2 weeks | +5 consistency |
| 2 Design system | Consolidate tokens and remove legacy cascade seams | `src/styles/kernel.css`, token sources | 1-2 weeks | +4 maintainability |
| 3 Mobile | Viewport matrix and page-specific mobile redesign | Playground, Chat, Audit, Evidence, Eval | 2 weeks | +8 mobile/responsive |
| 4 Interaction | Complete states, focus, feedback, cancel/retry/recovery | all interactive pages | 2 weeks | +6 interaction/a11y |
| 5 Performance | Measure, split oversized pages, reduce duplicate scripts | `chat.astro`, `evidence.astro`, `index.astro`, JS assets | 1-2 weeks | unknown until measured |
| 6 Enterprise polish | Roles, permissions, provenance, audit language | layout, nav, compliance, admin | 2 weeks | +7 enterprise |
| 7 Production hardening | Playwright, axe, Lighthouse, visual baselines, regression gates | tests and CI | 2 weeks | converts claims into evidence |

## Executable AI coding prompt pack

The prompts below are based on evidence above. Each is scoped to audit findings. â€œNO ACTION REQUIREDâ€ means no source evidence justified a change category.

### 01 Design System Unification

**ROLE:** Principal frontend architect. **OBJECTIVE:** unify Kernel primitives without changing routes or APIs. **SCOPE:** `src/styles/kernel.css`, `src/components/kernel/**`, `KernelLayout.astro`. **ACTUAL PROBLEM:** legacy primitive CSS and later shell overrides coexist. **EVIDENCE:** the file contains both generic Kernel primitives and KRN-DS-2026-07-31 overrides. **REQUIRED CHANGES:** create one token layer, semantic z-index, control heights, focus ring, status pairs, and documented variants. **DO NOT CHANGE:** route URLs, Arabic content, APIs, RTL direction, security behavior. **ACCEPTANCE:** no duplicate definitions for the same semantic primitive; visual snapshots remain equivalent or improve. **TESTS:** build, lint, component stories, visual regression.

### 02 Typography and Spacing

**ROLE:** design systems engineer. **OBJECTIVE:** normalize type scale and rhythm. **SCOPE:** `kernel.css`, `KernelLayout.astro`, page headers. **PROBLEM:** page-local density and mixed hierarchy. **EVIDENCE:** shared tokens exist but page sources add local spacing and large dense sections. **CHANGES:** define heading/lead/body/meta roles, `text-wrap`, tabular numerals, 4pt spacing aliases. **DO NOT CHANGE:** copy meaning or routes. **ACCEPTANCE:** all page headers use the same rhythm and Arabic wrapping remains readable. **TESTS:** screenshots at requested widths and RTL review.

### 03 Button System

**ROLE:** interaction and accessibility engineer. **OBJECTIVE:** create canonical buttons and icon buttons. **SCOPE:** `src/components/kernel/**`, `kernel.css`, all `src/pages/kernel/**`. **PROBLEM:** no single button contract. **EVIDENCE:** page-specific controls and icon buttons appear across Audit, Chat, Compliance, Playground, and shell. **CHANGES:** variants primary/secondary/ghost/danger, sizes, loading/disabled/success/error, icon labels, 44px targets. **ACCEPTANCE:** every interactive action has correct semantics and visible focus. **TESTS:** keyboard, axe, visual states.

### 04 Cards and Surfaces

**ROLE:** product designer. **OBJECTIVE:** reduce nested card fatigue. **SCOPE:** `index.astro`, `compliance.astro`, `KernelCard.astro`, `KernelMetricCard.astro`, `kernel.css`. **PROBLEM:** card-heavy dashboard and packs. **EVIDENCE:** dashboard, onboarding, units, packs, map, and metrics all use boxed surfaces. **CHANGES:** reserve cards for actionable boundaries; use dividers and spacing for secondary content. **ACCEPTANCE:** fewer nested surfaces and clearer primary content. **TESTS:** desktop/mobile visual snapshots.

### 05 Forms and Inputs

**ROLE:** form UX engineer. **OBJECTIVE:** unify fields, selects, textareas, validation, and help. **SCOPE:** Playground, Chat, Policies, API, Admin Quota. **PROBLEM:** form vocabulary is not canonical. **EVIDENCE:** multiple pages contain independent controls and settings. **CHANGES:** labels, descriptions, errors, required state, disabled/loading, keyboard and mobile behavior. **ACCEPTANCE:** every field has an associated label and recovery message. **TESTS:** keyboard and screen-reader checks.

### 06 Tables and Data Density

**ROLE:** data UX architect. **OBJECTIVE:** make dense data scannable. **SCOPE:** `audit.astro`, evidence, reports, stats, datasets, scorers. **PROBLEM:** table/card transformations and density are page-specific. **EVIDENCE:** Audit explicitly transforms table to cards under 1024px; other data pages need comparable contracts. **CHANGES:** canonical table, column priority, mobile cards, sticky headers, empty/filter states. **ACCEPTANCE:** no critical field disappears without an alternative. **TESTS:** widths 320 to 1440px.

### 07 Navigation and Sidebar

**ROLE:** IA architect. **OBJECTIVE:** add task groups and role-aware prioritization. **SCOPE:** `KernelLayout.astro`, `KernelSidebar.astro`, `src/data/kernel.ts`. **PROBLEM:** feature-first navigation exposes too much. **EVIDENCE:** 20+ modules and command palette page grouping. **CHANGES:** Monitor, Investigate, Govern, Evaluate, Integrate, Admin groups; preserve full discoverability. **ACCEPTANCE:** CISO, compliance, developer, and operator paths reach top tasks within two actions. **TESTS:** keyboard, mobile drawer, deep links.

### 08 Command Palette

**ROLE:** accessibility-focused interaction designer. **OBJECTIVE:** make command search a real navigation surface. **SCOPE:** `KernelLayout.astro`, `public/js/kernel-shell.js`. **PROBLEM:** palette exists but runtime semantics are unverified. **CHANGES:** native dialog/popover semantics, focus trap, escape, focus return, no-results guidance, shortcut labeling. **ACCEPTANCE:** fully operable without pointer. **TESTS:** keyboard and axe.

### 09 Dashboard UX

**ROLE:** enterprise dashboard designer. **OBJECTIVE:** prioritize attention over feature showcase. **SCOPE:** `src/pages/kernel/index.astro`, shared dashboard components. **PROBLEM:** onboarding and operations compete above the fold. **CHANGES:** first-visit/returning-operator modes; top actions: approvals, high-risk, unresolved, last incident. **ACCEPTANCE:** one primary CTA and one clear next action per mode. **TESTS:** first-use task walkthrough.

### 10 Playground UX

**ROLE:** AI product interaction architect. **OBJECTIVE:** reduce critical cognitive load. **SCOPE:** `playground.astro`, `kernel-playground.js`, `playground.css`. **PROBLEM:** three columns, ten stages, policies, models, datasets, context, A/B, settings, and export compete. **CHANGES:** guided mode with prompt, run, result; expert mode reveals controls progressively. **ACCEPTANCE:** first result possible without understanding all ten stages. **TESTS:** task timing and mobile screenshots.

### 11 Chat UX

**ROLE:** conversational UX architect. **OBJECTIVE:** separate real, demo, unavailable, and blocked states. **SCOPE:** `chat.astro`, `KernelChatError.astro`, chat JS. **PROBLEM:** fake streaming and API fallback can look real. **CHANGES:** state badge adjacent to message composer and response; cancel/retry; source and policy explanation. **ACCEPTANCE:** user always knows what happened, what is happening, and next action. **TESTS:** provider failure, timeout, offline, keyboard, screen reader.

### 12 Scenarios UX

**ROLE:** workflow designer. **OBJECTIVE:** make scenario-to-chat handoff explicit. **SCOPE:** `scenarios.astro`, `kernel-journey.ts`, chat scenario banner. **PROBLEM:** runtime metadata is mirrored in browser code. **CHANGES:** one sanitized serialized source, clear â€œRun this scenarioâ€ CTA, preflight summary. **ACCEPTANCE:** no drift between scenario card and chat banner. **TESTS:** all scenario IDs and invalid ID recovery.

### 13 Red Team UX

**ROLE:** security UX specialist. **OBJECTIVE:** distinguish safe test simulation from production attack activity. **SCOPE:** `redteam.astro` and related JS. **PROBLEM:** page purpose and state behavior require validation. **CHANGES:** test scope, authorization notice, attack result taxonomy, evidence link, reset. **ACCEPTANCE:** users cannot confuse simulation with live exploitation. **TESTS:** permission, empty, error, completion states.

### 14 Policies UX

**ROLE:** governance product designer. **OBJECTIVE:** make policy editing safe and explainable. **SCOPE:** `policies.astro`, policy data, shared forms. **PROBLEM:** inspect/modify/save journey not source-proven end to end. **CHANGES:** draft state, unsaved changes, diff, validation, publish confirmation, rollback. **ACCEPTANCE:** no silent policy mutation. **TESTS:** save failure, conflict, keyboard.

### 15 Audit UX

**ROLE:** audit workflow architect. **OBJECTIVE:** make investigation trustworthy. **SCOPE:** `audit.astro`, drawer JS, shared export component. **PROBLEM:** seeded data and PDF stub undermine enterprise trust. **CHANGES:** provenance label, real export state or honest rename, focus trap/return, filter URL state, explicit details action. **ACCEPTANCE:** every exported artifact states source and timestamp. **TESTS:** filters, copy, drawer, export, no results.

### 16 Approvals UX

**ROLE:** human-in-the-loop safety designer. **OBJECTIVE:** prevent accidental approvals and clarify delegation. **SCOPE:** `approvals.astro`, approval modal and ledger components. **PROBLEM:** high-impact decision semantics need runtime proof. **CHANGES:** decision summary, policy reason, consequence, comment required for reject, confirmation for approve, audit receipt. **ACCEPTANCE:** decision is reversible or explicitly irreversible. **TESTS:** keyboard and failure recovery.

### 17 Replay UX

**ROLE:** incident response UX architect. **OBJECTIVE:** make replay comparison understandable. **SCOPE:** `replay.astro`, trace drawer, replay JS. **PROBLEM:** reconstruction can be cognitively dense. **CHANGES:** original/current timeline, changed inputs, policy version, model version, side-by-side result, export evidence. **ACCEPTANCE:** user can identify why outcome changed. **TESTS:** missing trace, partial replay, provider failure.

### 18 Compliance UX

**ROLE:** Saudi enterprise compliance designer. **OBJECTIVE:** distinguish readiness from legal compliance. **SCOPE:** `compliance.astro`, `KernelDemoPill`, cards/map. **PROBLEM:** realistic scores and â€œcompliantâ€ labels can overstate production/legal status. **CHANGES:** â€œdemo readiness scoreâ€, source timestamp, control evidence link, gap-first ordering. **ACCEPTANCE:** no score can be mistaken for certification. **TESTS:** demo/connected/unconfigured states, Arabic review.

### 19 Evidence UX

**ROLE:** evidence and records UX architect. **OBJECTIVE:** split and simplify the 67KB evidence page. **SCOPE:** `evidence.astro`, evidence components, export/verification logic. **PROBLEM:** oversized source and likely mixed responsibilities. **CHANGES:** list, detail, verification, export, empty/error modules. **ACCEPTANCE:** each evidence item has provenance, integrity, source trace, and next action. **TESTS:** large lists, failed verification, offline.

### 20 Reports UX

**ROLE:** reporting product designer. **OBJECTIVE:** make report creation task-led. **SCOPE:** `reports.astro`, report components. **PROBLEM:** report route needs clear audience, period, framework, and output state. **CHANGES:** 3-step wizard with preview and provenance. **ACCEPTANCE:** report status is draft/generating/ready/failed, never ambiguous. **TESTS:** retry, cancel, empty, permission.

### 21 Stats UX

**ROLE:** analytics UX architect. **OBJECTIVE:** connect metrics to decisions. **SCOPE:** `stats.astro`, chart components. **PROBLEM:** metrics without obvious action context. **CHANGES:** trend explanation, threshold, owner, drill-down, accessible table alternative. **ACCEPTANCE:** each metric answers â€œso what?â€ **TESTS:** no data, partial data, screen reader.

### 22 Models UX

**ROLE:** platform UX architect. **OBJECTIVE:** make provider state and model selection safe. **SCOPE:** `models.astro`, provider components. **PROBLEM:** model choice affects governance and trust. **CHANGES:** connected/unavailable/degraded labels, data residency, policy compatibility, test connection. **ACCEPTANCE:** no model looks healthy unless verified. **TESTS:** timeout, invalid credentials, permission.

### 23 Connectors UX

**ROLE:** enterprise integrations designer. **OBJECTIVE:** improve connector setup and recovery. **SCOPE:** `connectors.astro`. **PROBLEM:** connection lifecycle needs explicit states. **CHANGES:** setup steps, scopes, test, last sync, revoke, error recovery. **ACCEPTANCE:** destructive revoke requires clear confirmation. **TESTS:** connect failure and retry.

### 24 API Developer UX

**ROLE:** developer experience architect. **OBJECTIVE:** optimize time-to-first-call. **SCOPE:** `api.astro`, code blocks, API docs. **PROBLEM:** API route should lead with one working request. **CHANGES:** copyable request, auth placeholder, response, error examples, language tabs, sandbox warning. **ACCEPTANCE:** developer can identify endpoint, auth, request, response, and next step in under one minute. **TESTS:** code copy feedback and mobile wrapping.

### 25 Datasets UX

**ROLE:** AI evaluation UX designer. **OBJECTIVE:** make dataset lifecycle explicit. **SCOPE:** `datasets.astro`. **PROBLEM:** dataset actions can be high-impact and data-sensitive. **CHANGES:** provenance, schema, sensitivity, version, preview, import validation, delete confirmation. **ACCEPTANCE:** no dataset is used without visible version and source. **TESTS:** empty/import/error/permission.

### 26 Scorers UX

**ROLE:** evaluation product designer. **OBJECTIVE:** explain scorer logic and thresholds. **SCOPE:** `scorers.astro`. **PROBLEM:** scorer configuration is technical and high-load. **CHANGES:** human-readable summary, examples, threshold preview, versioning. **ACCEPTANCE:** user can predict a scorer result before running. **TESTS:** invalid config and no results.

### 27 Evaluation UX

**ROLE:** AI evaluation workflow architect. **OBJECTIVE:** turn create/run/analyze into a guided flow. **SCOPE:** `eval.astro`, eval store, related components. **PROBLEM:** critical cognitive load and likely too many decisions. **CHANGES:** 3 steps, saved defaults, run progress, result interpretation, compare versions. **ACCEPTANCE:** first evaluation is runnable with safe defaults. **TESTS:** cancel, retry, partial, provider failure.

### 28 Admin UX

**ROLE:** enterprise admin UX architect. **OBJECTIVE:** make quota and permissions safe and discoverable. **SCOPE:** `admin/quota.astro`, sidebar data, permission states. **PROBLEM:** isolated admin route and high-impact settings. **CHANGES:** Admin group, scope, usage, limits, warning thresholds, confirmation, audit receipt. **ACCEPTANCE:** user sees who is affected before saving. **TESTS:** permission denied and concurrent update.

### 29 Mobile Optimization

**ROLE:** responsive UX specialist. **OBJECTIVE:** validate and redesign high-risk layouts. **SCOPE:** Playground, Chat, Audit, Evidence, Eval, shared shell. **PROBLEM:** no runtime evidence at requested widths. **CHANGES:** define mobile information priority, scroll ownership, sticky actions, card alternatives. **ACCEPTANCE:** no horizontal overflow and all primary actions remain reachable at 320px. **TESTS:** 320/360/375/390/414/768/1024/1280/1440/1920 screenshots.

### 30 Accessibility Hardening

**ROLE:** WCAG 2.2 AA engineer. **OBJECTIVE:** convert source intent into tested compliance. **SCOPE:** all Kernel routes and shared components. **PROBLEM:** runtime accessibility is `NOT MEASURED`. **CHANGES:** semantic landmarks, labels, focus trap/return, live regions, chart alternatives, contrast. **ACCEPTANCE:** axe has no critical violations and manual keyboard flow passes. **TESTS:** axe, keyboard, NVDA/VoiceOver, reduced motion.

### 31 Motion System

**ROLE:** motion designer. **OBJECTIVE:** centralize useful motion and reduce noise. **SCOPE:** `kernel.css`, reveal observers, drawers, skeletons. **PROBLEM:** multiple motion patterns and durations exist. **CHANGES:** semantic durations/easing and reduced-motion policy. **ACCEPTANCE:** motion communicates state, not decoration. **TESTS:** reduced-motion screenshots and timing review.

### 32 Loading, Empty, Error States

**ROLE:** state design architect. **OBJECTIVE:** make every route honest and recoverable. **SCOPE:** `KernelSkeleton`, `KernelEmptyState`, all Kernel pages. **PROBLEM:** state coverage is uneven and runtime unverified. **CHANGES:** loading/empty/error/partial/offline/permission/provider/timeout/validation/success matrix. **ACCEPTANCE:** every primary action has feedback and recovery. **TESTS:** forced state fixtures.

### 33 Performance Optimization

**ROLE:** frontend performance engineer. **OBJECTIVE:** measure before optimizing. **SCOPE:** `chat.astro`, `evidence.astro`, `index.astro`, shared JS/CSS. **PROBLEM:** oversized sources and inline scripts, but actual metrics are unknown. **CHANGES:** establish budgets, split modules, remove duplicate serialized data, defer noncritical scripts. **ACCEPTANCE:** improvements are backed by before/after bundle and runtime measurements. **TESTS:** Lighthouse, Web Vitals, throttled mobile.

### 34 Microcopy

**ROLE:** Arabic enterprise UX writer. **OBJECTIVE:** define Arabic register and bilingual terminology. **SCOPE:** all Kernel labels, warnings, errors, CTAs. **PROBLEM:** Saudi dialect and formal compliance language mix. **CHANGES:** plain action labels, formal governance copy, consistent glossary, honest demo terminology. **ACCEPTANCE:** native Saudi reviewer approves key flows. **TESTS:** glossary lint and content review.

### 35 Enterprise UX

**ROLE:** enterprise SaaS product architect. **OBJECTIVE:** raise trust, control, auditability, and recovery. **SCOPE:** shell, approvals, audit, evidence, reports, compliance. **PROBLEM:** demo certainty and incomplete provenance. **CHANGES:** source, timestamp, owner, permission, decision receipt, retention, export truth. **ACCEPTANCE:** every consequential action explains impact and produces an audit reference. **TESTS:** role/permission/error scenarios.

### 36 Saudi, Arabic, RTL

**ROLE:** Saudi localization and RTL specialist. **OBJECTIVE:** validate RTL and local enterprise language. **SCOPE:** all Kernel CSS and pages. **PROBLEM:** intent exists but runtime and native-language validation are missing. **CHANGES:** formal terminology for regulated areas, date/number consistency, mirrored drawers, mixed-direction code/IDs. **ACCEPTANCE:** no clipping, direction errors, or ambiguous regulatory wording. **TESTS:** RTL screenshots and native review.

### 37 Demo and Live Transparency

**ROLE:** product trust designer. **OBJECTIVE:** make data provenance impossible to miss. **SCOPE:** `KernelDemoPill`, dashboard, Audit, Chat, Compliance, Reports. **PROBLEM:** realistic static values and fake/stubbed outputs. **CHANGES:** widget-level provenance, connected state, simulated state, source timestamp, unavailable state. **ACCEPTANCE:** user can classify every visible data point without guessing. **TESTS:** demo mode and production-configured fixtures.

### 38 Component Deduplication

**ROLE:** frontend architect. **OBJECTIVE:** replace repeated interaction markup with shared components. **SCOPE:** `src/components/kernel/**`, all pages. **PROBLEM:** repeated buttons, fields, drawers, tables, exports, statuses. **CHANGES:** canonical primitives with variants and stories. **ACCEPTANCE:** page code contains composition, not duplicated primitive state logic. **TESTS:** stories and visual regression.

### 39 Frontend Architecture

**ROLE:** Astro architecture specialist. **OBJECTIVE:** split page-level god components. **SCOPE:** `chat.astro`, `evidence.astro`, `index.astro`, `KernelAiAssistant.astro`. **PROBLEM:** large mixed-responsibility sources. **CHANGES:** extract data, view, controller, state fixtures, and utilities. **ACCEPTANCE:** each module has one reason to change and no behavior regression. **TESTS:** build, route smoke tests, interaction tests.

### 40 Cognitive Load Reduction

**ROLE:** HCI specialist. **OBJECTIVE:** reduce decisions on dense routes. **SCOPE:** Playground, Eval, Dashboard, Chat, Evidence. **PROBLEM:** high/critical load inferred from control count and competing sections. **CHANGES:** progressive disclosure, guided defaults, summaries, tabs/drawers. **ACCEPTANCE:** first meaningful task can be completed without expert vocabulary. **TESTS:** task walkthrough with novice and expert users.

### 41 Information Density Optimization

**ROLE:** information designer. **OBJECTIVE:** establish a density policy. **SCOPE:** tables, cards, metrics, charts, trace views. **PROBLEM:** high density is not consistently prioritized. **CHANGES:** summary first, details on demand, critical columns preserved on mobile. **ACCEPTANCE:** each section answers one operational question. **TESTS:** squint test, mobile snapshots, usability review.

### 42 Role-Based UX

**ROLE:** enterprise IA architect. **OBJECTIVE:** support CISO, CIO, compliance, DPO, analyst, developer, executive, admin. **SCOPE:** shell, nav, dashboard, permissions. **PROBLEM:** shared feature navigation serves all roles. **CHANGES:** role presets, role landing pages, task-based nav. **ACCEPTANCE:** role top tasks are visible without searching. **TESTS:** role journey matrix.

### 43 Time-to-First-Value

**ROLE:** product growth UX architect. **OBJECTIVE:** shorten entry-to-first-governed-result. **SCOPE:** dashboard, scenarios, chat, Playground, API. **PROBLEM:** onboarding competes with operations and Playground has expert-first setup. **CHANGES:** one-click scenario run, safe demo input, visible result interpretation, next-step CTA. **ACCEPTANCE:** first-time user reaches a meaningful result with minimal decisions. **TESTS:** timed usability study.

### 44 Visual Regression Hardening

**ROLE:** visual QA engineer. **OBJECTIVE:** establish current baseline and prevent regressions. **SCOPE:** all routes and shared shell. **PROBLEM:** no screenshots or pixel comparisons were available. **CHANGES:** Playwright matrix, named fixtures, RTL/LTR snapshots, diff thresholds. **ACCEPTANCE:** baseline committed in test infrastructure, not source code. **TESTS:** all requested viewport widths.

### 45 Pixel-Level Visual Polish

**ROLE:** senior product designer. **OBJECTIVE:** align header, title, description, CTA, and content rhythm. **SCOPE:** shared page header and top 5 routes. **PROBLEM:** source shows varied page-local sections and dense shell. **CHANGES:** consistent max measure, baseline, spacing, wrapping, and CTA hierarchy. **ACCEPTANCE:** no awkward title wrapping or misaligned primary action in baseline screenshots. **TESTS:** pixel review at 1280 and 1440 plus mobile.

### 46 Design Maturity Upgrade

**ROLE:** design systems lead. **OBJECTIVE:** move Level 3 toward Level 4/5. **SCOPE:** tokens, components, states, documentation, tests. **PROBLEM:** system exists but is not fully governed or tested. **CHANGES:** contribution rules, component contracts, accessibility and visual gates, versioned tokens. **ACCEPTANCE:** new page can be built from primitives without local interaction reinvention. **TESTS:** build a new fixture route from system only.

### 47 Trust and Confidence UX

**ROLE:** AI safety UX specialist. **OBJECTIVE:** explain decisions and uncertainty. **SCOPE:** Chat, Audit, Approvals, Compliance, Evidence. **PROBLEM:** static/demo certainty and incomplete next-step guidance. **CHANGES:** decision reason, evidence source, confidence/limitations, action, recovery. **ACCEPTANCE:** each governance outcome answers what happened, why, and what next. **TESTS:** blocked, allowed, pending, error, unavailable.

### 48 User Journey Optimization

**ROLE:** service designer. **OBJECTIVE:** optimize ten documented journeys. **SCOPE:** route links, CTA labels, trace, scenario, evidence, reports. **PROBLEM:** routes exist but journey efficiency is inferred at 75%. **CHANGES:** map entry, action, feedback, result, next step, recovery for each journey. **ACCEPTANCE:** no journey ends at a dead-end page. **TESTS:** end-to-end route walkthroughs.

### 49 Cross-Page Consistency

**ROLE:** design QA lead. **OBJECTIVE:** enforce shared vocabulary and behavior. **SCOPE:** every Kernel route. **PROBLEM:** page-specific controls and state patterns. **CHANGES:** consistency checklist for header, CTA, filters, tables, empty/error/loading, drawers, export. **ACCEPTANCE:** every route passes the same checklist. **TESTS:** automated DOM assertions plus snapshots.

### 50 Final Pixel-Level QA

**ROLE:** principal visual QA architect. **OBJECTIVE:** verify the finished system without subjective claims. **SCOPE:** all routes, all shared components, all viewports. **PROBLEM:** current browser evidence is `NOT MEASURED`. **CHANGES:** execute visual, keyboard, accessibility, performance, and regression matrix; record failures. **ACCEPTANCE:** publish evidence-backed before/after report; never claim 95% without measurements. **TESTS:** Playwright, axe, Lighthouse, Web Vitals, RTL, reduced motion, offline.

## Before/after validation framework

The current baseline is **source-audit only**:

| Area | Before | After | Delta |
|---|---:|---:|---:|
| UI | 84% | NOT MEASURED | NOT MEASURED |
| UX | 78% | NOT MEASURED | NOT MEASURED |
| Mobile | 72% | NOT MEASURED | NOT MEASURED |
| Accessibility | 78% | NOT MEASURED | NOT MEASURED |
| Performance | 69% | NOT MEASURED | NOT MEASURED |
| Consistency | 79% | NOT MEASURED | NOT MEASURED |
| Enterprise UX | 77% | NOT MEASURED | NOT MEASURED |
| Overall | 78% | NOT MEASURED | NOT MEASURED |

After implementation, use the same fixtures, routes, viewports, role matrix, and task scripts. Record every regression as: page, component, problem, before, after, severity, impact. A score increase without runtime evidence is not a valid improvement claim.

## Required documentation paths

The audit-only phase must not modify the repository. Proposed report outputs are:

```text
docs/kernel/final-ui-ux-audit.md
docs/kernel/design-system-audit.md
docs/kernel/page-by-page-audit.md
docs/kernel/button-and-component-audit.md
docs/kernel/mobile-responsive-audit.md
docs/kernel/accessibility-audit.md
docs/kernel/performance-audit.md
docs/kernel/ux-debt-register.md
docs/kernel/kernel-scorecard.md
docs/kernel/kernel-improvement-prompts.md
docs/kernel/visual-regression-audit.md
docs/kernel/role-based-ux-audit.md
docs/kernel/cognitive-load-audit.md
docs/kernel/time-to-first-value-audit.md
docs/kernel/design-maturity-audit.md
docs/kernel/final-validation-prompt.md
```

## Master validation prompt

**ROLE:** Principal UI/UX architect, frontend architect, accessibility specialist, responsive QA engineer, performance engineer, and Saudi RTL product reviewer.

**OBJECTIVE:** Re-run the BrightAI Kernel audit after selected improvements and compare against the source-audit baseline in this document.

**SCOPE:** recursively discover every route in `src/pages/kernel/**`; inspect imports, layouts, components, CSS, scripts, data, assets, and configuration; run the application; test every route at 320, 360, 375, 390, 414, 768, 1024, 1280, 1440, and 1920px; test RTL and reduced motion; inspect every interactive button and component.

**REQUIRED VALIDATION:** capture screenshots and pixel diffs; run Playwright smoke flows; run axe/WCAG checks; manually test keyboard, focus, dialogs, drawers, live regions, tables, charts, forms, loading, empty, error, offline, permission, timeout, provider failure, partial, success, and destructive states; measure LCP, INP, CLS, FCP, TTFB, JS/CSS/page weight; distinguish demo, connected, unavailable, and simulated data; validate Arabic terminology with a native Saudi reviewer; run role journeys for CISO, CIO, Compliance Officer, DPO, Security Analyst, Developer, Executive, and Administrator.

**DO NOT CLAIM:** pixel perfection, WCAG compliance, Lighthouse scores, Core Web Vitals, performance improvements, or 95% targets without actual evidence.

**ACCEPTANCE TARGETS:** UI, UX, Accessibility, Responsive, Mobile, Consistency, Performance, Enterprise UX all at least 95% only when backed by reproducible evidence. If a target is missed, report the exact blocker and keep the score below target.

**OUTPUT:** route inventory, dependency map, token audit, complete button/component audit, page scorecard, top strengths, top problems, UX debt register, quick wins, roadmap, before/after deltas, regressions, final score, maturity level, and explicit YES/NO/CLOSE verdict.

**Expected result:** a defensible engineering and design QA report, not a confidence claim.

## Final answer

**Is BrightAI Kernel currently at a world-class enterprise SaaS UI/UX level? NO.**

Current overall score: **78%**, source-audit heuristic.  
Design maturity: **Level 3 / 5, Design System**.  
Fastest path to 95%+: fix product honesty and export semantics first, then unify primitives, simplify Playground and role navigation, validate mobile/accessibility, split oversized sources, and add automated visual/runtime gates.  
Must not change: Arabic-first RTL foundation, mint-on-ink identity, trace/hash/approval/evidence mental model, explicit demo labeling, local Saudi regulatory framing, and existing route/API contracts.  
Should be redesigned: first-use dashboard prioritization, Playground guided mode, role-aware navigation, evidence/report flows, button/form/table/drawer primitives, and production/demo state boundaries.  
Can be postponed: decorative motion, broader visual novelty, secondary SEO polish, and non-critical chart embellishment.

**FINAL KERNEL EXPERIENCE SCORE: 78%**  
**DESIGN MATURITY: LEVEL 3 / 5**  
**WORLD-CLASS STATUS: NO**
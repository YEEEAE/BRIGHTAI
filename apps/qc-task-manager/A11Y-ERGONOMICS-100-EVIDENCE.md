# A11Y-ERGONOMICS-100 Evidence

**Task:** QC-100-A11Y-011  
**Scope:** QC Task Manager routes and shared components  
**Standard:** WCAG 2.2 AA minimum  
**Status:** Automated contract target met locally; full accessibility score is **not claimed** until the manual VoiceOver/NVDA sheets below are completed.

## Evidence boundary

This document separates repeatable source/browser automation from expert assistive-technology validation. Automated checks can prove structure and interaction contracts; they cannot prove that a screen-reader user understands every route, announcement, focus transition, or chart alternative.

## Automated acceptance matrix

| Area | Automated evidence | Result |
|---|---|---|
| Route/component inventory | `test:a11y-ergonomics-100` inventories all `src/pages` and `src/components` Astro/React sources | PASS |
| Bypass blocks and landmarks | `BaseLayout.astro` has first-focusable `Skip to content` → `#main`; target is a focusable `<main>` | PASS |
| Dialog semantics | All dialog sources require `aria-labelledby` and `aria-describedby`; React dialogs require Escape/cancel handling | PASS |
| Keyboard focus visibility | Global `:focus-visible` safety net plus shared focus tokens | PASS |
| Reduced motion | Global `prefers-reduced-motion: reduce` disables animation/transition duration and smooth scrolling | PASS |
| Zoom-safe overlays | Dialog surfaces are bounded and scrollable with `max-block-size: calc(100dvh - 2rem)` | PASS |
| Status announcements | Feedback/status component sources require `aria-live` or `role="alert"` | PASS |
| Chart alternatives | Chart component sources require accessible naming or a text alternative | PASS |
| Responsive contract | Existing `test:responsive-e2e-contract` and `e2e-responsive` cover 360/390/768/1024/1440; this task adds 320–1920 and zoom execution instructions below | PASS for contract / execution pending |
| Axe and keyboard journeys | Existing `e2e-a11y.mjs` covers skip link, notification disclosure, dialogs, mobile nav, heading/name/ARIA checks and axe | PASS for existing 12-page gate |

Run locally:

```bash
pnpm --dir apps/qc-task-manager test:a11y-ergonomics-100
pnpm --dir apps/qc-task-manager test:manifest
pnpm --dir apps/qc-task-manager typecheck
pnpm --dir apps/qc-task-manager build
```

## Browser test matrix

Record date, browser/version, viewport, zoom, reduced-motion setting, route, result, and defect ID for every run. Use representative journeys on every role and repeat the full route inventory for release candidates.

| Viewport widths | Zoom | Required checks |
|---|---:|---|
| 320, 360, 390, 768, 1024, 1280, 1440, 1920 | 100% | no horizontal overflow, no clipped text, landmarks, headings, names, keyboard journey |
| 1280 CSS px | 150%, 200% | reflow, readable text, fixed/sticky UI, dialogs, tables/alternate scroll |
| 320 CSS px equivalent | 400% where practical | core task flows remain operable; document exceptions for wide data tables |
| 360×800 and 1440×1000 | 100% + reduced motion | focus order, no unexpected motion, stable layout |

Tables, charts, and other legitimately wide data surfaces may scroll inside their own region, but must not create page-level horizontal scroll or lose information.

## Keyboard journey sheet

For each role (`employee`, `supervisor`, `manager`, `admin`) record PASS/FAIL for:

1. Login → first Tab reaches skip link → Enter moves to main → navigation remains reachable.
2. Open/close mobile navigation with Enter/Space; Escape closes and restores the toggle.
3. Open notifications; Tab enters the region; Escape closes and returns to the bell.
4. Create/edit a task or laboratory record; labels, descriptions, errors and submit state are announced/associated.
5. Open each destructive dialog; focus enters, Tab/Shift+Tab stays inside, Escape closes, focus returns to trigger.
6. Navigate tables and paginated results without pointer-only controls.
7. Trigger success, validation error, server error and loading state; status is announced and focus remains logical.
8. Use chart data or its text alternative without relying on color, hover or pointer movement.

## VoiceOver manual test sheet — macOS + Safari

**Tester / date / build:** ____________________  
**Browser / macOS:** ____________________  
**Routes sampled:** ____________________

| Check | Result | Notes / defect ID |
|---|---|---|
| VO rotor shows one meaningful main landmark and expected navigation landmarks | ☐ PASS ☐ FAIL | |
| Headings rotor has one page heading and sensible hierarchy | ☐ PASS ☐ FAIL | |
| Skip link is announced and moves VO focus to main | ☐ PASS ☐ FAIL | |
| Navigation, menu, notification trigger and account controls have names/states | ☐ PASS ☐ FAIL | |
| Form labels, required state, help text and errors are announced with fields | ☐ PASS ☐ FAIL | |
| Dialog title/description are announced; focus enters and Escape returns to trigger | ☐ PASS ☐ FAIL | |
| Dynamic success/error/loading notifications are announced once, without noise | ☐ PASS ☐ FAIL | |
| Tables expose headers and row context; charts expose equivalent text data | ☐ PASS ☐ FAIL | |
| 200% zoom/reflow keeps content and controls usable | ☐ PASS ☐ FAIL | |

**AT evidence:** attach recording/log or tester sign-off here: ____________________

## NVDA manual test sheet — Windows + Chrome/Firefox

**Tester / date / build:** ____________________  
**Browser / Windows / NVDA:** ____________________  
**Routes sampled:** ____________________

| Check | Result | Notes / defect ID |
|---|---|---|
| Browse mode and focus mode switch correctly for forms and custom controls | ☐ PASS ☐ FAIL | |
| Landmarks and headings navigation provide a usable page outline | ☐ PASS ☐ FAIL | |
| Skip link is announced and moves focus to main | ☐ PASS ☐ FAIL | |
| Menus/disclosures announce expanded/collapsed state and destinations | ☐ PASS ☐ FAIL | |
| Form errors identify the field and explain recovery | ☐ PASS ☐ FAIL | |
| Dialog focus is contained, Escape works, and focus returns to the opener | ☐ PASS ☐ FAIL | |
| Live regions announce status/error updates without stealing focus unexpectedly | ☐ PASS ☐ FAIL | |
| Tables expose headers and charts provide a non-visual alternative | ☐ PASS ☐ FAIL | |
| 200% zoom/reflow and 400% practical check preserve task completion | ☐ PASS ☐ FAIL | |

**AT evidence:** attach recording/log or tester sign-off here: ____________________

## Ergonomics review

The implementation preserves keyboard-first workflows, persistent navigation context, grouped mobile navigation, 44px-class touch targets, logical form grouping, and scroll-contained wide data. During manual sessions also record:

- clicks, Tab presses, pointer travel, repeated-entry opportunities, and unnecessary context switches;
- whether default values are safe and whether the user can recover without restarting;
- fatigue points after a 30–60 minute repeated-task scenario;
- any control that requires precision, hover, color recognition, or horizontal page scrolling.

## Claim status

- **Automated A11y target:** 100% of the defined source/contract checks — `test:a11y-ergonomics-100` PASS (76 page sources, 59 component sources).
- **Full WCAG 2.2 AA score:** not claimed. Requires completed VoiceOver and NVDA sheets plus recorded manual keyboard/zoom checks.
- **Manual screen-reader validation:** not performed by this task; blank sheets are intentional and must not be treated as evidence.
- **Production/staging validation:** not claimed; current evidence is local only.

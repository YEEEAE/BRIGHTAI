# PROMPT 09 — ACCESSIBILITY, KEYBOARD ERGONOMICS & SEMANTIC UX

TASK ID:
QC-REMEDIATION-009

PRIORITY:
P1 (Core Accessibility & Compliance)

ROLE:
Lead Accessibility Engineer (CPACC / WAS), Semantic HTML Architect, Assistive Technology Specialist.

DEPENDS ON:
PROMPT-06.

BLOCKS:
GATE C.

SOURCE FINDINGS:
- P1-1: Lack of complete programmatic accessibility across all 76 UI views (WCAG 2.2 AA).
- Audit Sections 15, 26, 55, 56.

AFFECTED DOMAINS:
Domain 26 (Accessibility Design - A11y), Domain 55 (Keyboard UX / Focus Management), Domain 56 (Screen Reader / Semantic UX), Domain 28 (Human Factors / Ergonomics).

MISSION:
Remediate all locally fixable accessibility barriers across all 76 UI pages to achieve 100% WCAG 2.2 AA automated compliance: establish flawless keyboard focus traps in modal dialogs, ensure 100% keyboard navigability without mouse, provide skip links (`تخطي إلى المحتوى الرئيسي`), enforce color contrast >= 4.5:1 across all badges and interactive elements, attach semantic landmarks, and wire `aria-live` regions for dynamic status updates.

CURRENT-REALITY REQUIREMENT:
Before modifications:
* read `.agents/mind/01-mind-latest.md`
* read finding P1-1 and Accessibility Deep Dive (Section 15)
* inspect `apps/qc-task-manager/src/layouts/BaseLayout.astro`
* inspect all dialogs, dropdowns, and interactive widgets
* run automated accessibility scans.

MANDATORY SOURCE INSPECTION:
- `apps/qc-task-manager/src/layouts/BaseLayout.astro`
- `apps/qc-task-manager/src/layouts/Layout.astro`
- `apps/qc-task-manager/src/components/ReviewDeleteRequestDialog.tsx`
- `apps/qc-task-manager/src/components/Header.astro`
- `apps/qc-task-manager/scripts/test-a11y-ergonomics-100.mjs`
- `apps/qc-task-manager/scripts/test-keyboard-ux-100.mjs`

MANDATORY SKILLS:
- `.agents/skills/verification-before-completion/SKILL.md`
- `.agents/skills/better-accessibility/SKILL.md`
- `.agents/skills/keyboard-navigation/SKILL.md`

REQUIREMENTS:
1. Global Skip Links & Landmarks:
   - In `BaseLayout.astro`:
     - Add top-level skip link: `<a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:start-4 focus:z-50 focus:bg-amber-500 focus:text-slate-900 focus:px-4 focus:py-2 focus:rounded">تخطي إلى المحتوى الرئيسي</a>`.
     - Ensure `<main id="main-content" tabindex="-1">` wraps the core content.
     - Ensure `<header>`, `<nav>`, `<main>`, and `<footer>` are used as landmark regions.
2. Dialog Focus Traps & ARIA Attributes:
   - Audit all modal dialogs:
     - Must include `role="dialog"`, `aria-modal="true"`, and `aria-labelledby="dialog-title-id"`.
     - When opened, focus must automatically move to the first focusable element.
     - Pressing `Tab` must cycle exclusively within the dialog.
     - Pressing `Escape` must close the dialog and restore focus to the triggering element.
3. Contrast & Focus Indicators:
   - Verify all text has contrast >= 4.5:1 against its background (and >= 3:1 for large text).
   - In `global.css`, enforce high-visibility focus rings:
     - `*:focus-visible { outline: 2px solid var(--color-primary-500); outline-offset: 2px; }`.
4. Dynamic Updates via `aria-live`:
   - Notification badges and asynchronous form submit states must announce via `<div aria-live="polite" class="sr-only">`.

NON-NEGOTIABLE BUSINESS RULES:
- Zero interactive elements may be unreachable by keyboard (Tab, Shift+Tab, Enter, Space, Escape, Arrows).
- Icons conveying meaning must have alternative text or `aria-label`; decorative icons must have `aria-hidden="true"`.

IMPLEMENTATION REQUIREMENTS:
- Native HTML semantics (`<button>`, `<a href>`, `<fieldset>`, `<legend>`) over `div` with click handlers.
- RTL awareness (`start` / `end` logical focus positioning).

DO NOT:
- Do NOT use `outline: none` without providing an enhanced `:focus-visible` alternative.
- Do NOT trap keyboard focus permanently in any non-modal page element.

TEST-FIRST / DEBUGGING REQUIREMENT:
Run axe-core or Playwright accessibility assertions across all 76 pages -> log contrast and ARIA violations -> apply fixes -> re-run until 0 violations.

TEST QUALITY REQUIREMENT:
Automated axe-core scan with 0 critical, 0 serious violations; programmatic verification of focus restoration on dialog close.

REQUIRED AUTOMATED TESTS:
- `pnpm run test:a11y-ergonomics-100`
- `pnpm run test:keyboard-ux-100`
- `pnpm run test:screen-reader-semantic-100`

REQUIRED BROWSER TESTS:
- Playwright keyboard-only navigation test through employee creation flow without firing mouse click events.

REQUIRED DATABASE TESTS:
None for frontend a11y.

REQUIRED SECURITY TESTS:
- Ensure focus traps cannot be exploited to crash or freeze the browser window.

REQUIRED ACCESSIBILITY TESTS:
- Full axe-core automated rule check across all 115 routes.

REQUIRED ROLE TESTS:
- Test keyboard navigation across role-specific dashboards.

REQUIRED NEGATIVE TESTS:
- Pressing Escape while a dialog is closed must not throw unhandled errors.

REGRESSION REQUIREMENT:
All 74 unit tests and 28 E2E suites must pass.

ACCEPTANCE CRITERIA:
- AC-01: Global skip link present and functional across all pages.
- AC-02: All dialogs implement proper focus trap, Escape to close, and focus restoration.
- AC-03: High-visibility focus indicators active across all interactive elements.
- AC-04: Color contrast meets or exceeds 4.5:1 for all text and badges.
- AC-05: `aria-live` regions communicate asynchronous state transitions.
- AC-06: Evidence file written to `audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-09-EVIDENCE.md`.

TARGET:
All applicable AC = PASS (6/6).

EVIDENCE OUTPUT:
`audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-09-EVIDENCE.md`

FINAL VERIFICATION:
Run `pnpm run test:a11y-ergonomics-100` and `pnpm run test:keyboard-ux-100`.

FINAL RESPONSE FORMAT:
Status: PASS / PARTIAL / BLOCKED
Criteria: 6/6
Tests: ...
Remaining: ...

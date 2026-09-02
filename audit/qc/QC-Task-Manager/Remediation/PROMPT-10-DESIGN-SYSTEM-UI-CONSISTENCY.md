# PROMPT 10 — DESIGN SYSTEM, UI CONSISTENCY & VISUAL POLISH

TASK ID:
QC-REMEDIATION-010

PRIORITY:
P2 / P3

ROLE:
Design Systems Lead, Enterprise UI Architect, CSS/Layout Specialist.

DEPENDS ON:
PROMPT-07, PROMPT-09.

BLOCKS:
PROMPT-13, GATE C.

SOURCE FINDINGS:
- P3-2: Design tokens legacy aliases (`duration-150`, etc.) retained in config.
- P3-3: Minor visual discrepancies in table cell alignment and reflow at 400% zoom on mobile viewports.
- Audit Sections 14, 41, 51, 52, 53, 54, 91, 92, 93, 94.

AFFECTED DOMAINS:
Domain 41 (Design System), Domain 51 (UI Design), Domain 52 (Visual Design), Domain 53 (Visual Hierarchy), Domain 54 (Responsive / Adaptive Design), Domain 91 (Design Tokens), Domain 92 (Typography / Spacing), Domain 93 (Color System).

MISSION:
Clean up design token legacy aliases in the Tailwind / CSS token architecture, eliminate random inline utility classes, ensure all interactive targets meet the 44x44px touch ergonomic minimum, and guarantee flawless responsive reflow up to 400% zoom without horizontal clipping or overlapping text.

CURRENT-REALITY REQUIREMENT:
Before modifications:
* read `.agents/mind/01-mind-latest.md`
* read findings P3-2, P3-3, and Design System Deep Dive (Section 14)
* inspect `apps/qc-task-manager/src/styles/global.css`
* inspect `apps/qc-task-manager/tailwind.config.mjs`
* run `pnpm run test:design-system-100` and `pnpm run test:ui-visual-100`.

MANDATORY SOURCE INSPECTION:
- `apps/qc-task-manager/src/styles/global.css`
- `apps/qc-task-manager/src/components/`
- `apps/qc-task-manager/scripts/test-design-system-100.mjs`
- `apps/qc-task-manager/scripts/test-ui-visual-100.mjs`
- `apps/qc-task-manager/scripts/test-ui-consistency.mjs`

MANDATORY SKILLS:
- `.agents/skills/verification-before-completion/SKILL.md`
- `.agents/skills/design-taste-frontend/SKILL.md`
- `.agents/skills/responsive-design/SKILL.md`

REQUIREMENTS:
1. Token Cleanup (P3-2):
   - Deprecate and remove redundant legacy aliases (e.g. `duration-150` vs canonical tokens) while ensuring all references in components use the canonical design token tokens.
   - Run `pnpm run test:design-system-100` to verify 100% token adherence and zero unauthorized color or spacing values.
2. 400% Zoom Responsive Reflow (P3-3):
   - In table and card views, ensure containers use `min-width: 0` and `overflow-x: auto` so that zooming to 400% (320 CSS px viewport) does not break layout or cause overlapping text.
   - Stack table rows into vertical key-value cards on extra small viewports (`@media (max-width: 640px)`).
3. Touch Target Ergonomics:
   - Ensure all buttons, icon triggers, checkboxes, and menu links have a minimum hit area of 44x44 CSS pixels.
4. Consistent Component States:
   - Audit all buttons and inputs to guarantee visual differentiation across all 6 core interactive states: Default, Hover, Focus-Visible, Active, Disabled, and Loading.

NON-NEGOTIABLE BUSINESS RULES:
- The design system must strictly reflect Saudi enterprise aesthetics: clean, professional, high-contrast, RTL-first.
- Zero horizontal scrolling on the root viewport at any screen width >= 320px.

IMPLEMENTATION REQUIREMENTS:
- Pure CSS / Tailwind token enforcement without hardcoded pixel overrides.

DO NOT:
- Do NOT introduce breaking CSS changes that regress visual consistency score (212/212).
- Do NOT use arbitrary Tailwind values like `w-[37px]`.

TEST-FIRST / DEBUGGING REQUIREMENT:
Set viewport to 320x640 in Playwright -> test all core pages -> verify `document.documentElement.scrollWidth <= window.innerWidth`.

TEST QUALITY REQUIREMENT:
Run `pnpm run test:ui-consistency` and verify 212/212 consistency checks pass.

REQUIRED AUTOMATED TESTS:
- `pnpm run test:design-system-100`
- `pnpm run test:ui-visual-100`
- `pnpm run test:ui-consistency`

REQUIRED BROWSER TESTS:
- Responsive screenshot comparison across mobile (375px), tablet (768px), and desktop (1440px).

REQUIRED DATABASE TESTS:
None for CSS/UI prompt.

REQUIRED SECURITY TESTS:
- Ensure CSS classes cannot be injected dynamically from untrusted user inputs.

REQUIRED ACCESSIBILITY TESTS:
- WCAG 2.2 Success Criterion 1.4.10 (Reflow) at 400% zoom.
- WCAG 2.2 Success Criterion 2.5.8 (Target Size Minimum: 24x24 / 44x44).

REQUIRED ROLE TESTS:
- Verify visual polish on supervisor, manager, and lab technician viewports.

REQUIRED NEGATIVE TESTS:
- Extremely long sample names (e.g. 100 characters) must wrap cleanly or truncate with tooltip, never break the layout.

REGRESSION REQUIREMENT:
All 74 unit tests and 28 E2E suites must pass.

ACCEPTANCE CRITERIA:
- AC-01: Design tokens cleaned up with zero legacy deprecated aliases.
- AC-02: 100% token compliance verified by `test:design-system-100`.
- AC-03: Responsive reflow passes at 400% zoom without horizontal root overflow.
- AC-04: Touch targets meet 44x44px minimum hit area across all primary actions.
- AC-05: Component states (hover, focus, disabled, loading) consistently styled.
- AC-06: Evidence file written to `audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-10-EVIDENCE.md`.

TARGET:
All applicable AC = PASS (6/6).

EVIDENCE OUTPUT:
`audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-10-EVIDENCE.md`

FINAL VERIFICATION:
Run `pnpm run test:design-system-100` and `pnpm run test:ui-consistency`.

FINAL RESPONSE FORMAT:
Status: PASS / PARTIAL / BLOCKED
Criteria: 6/6
Tests: ...
Remaining: ...

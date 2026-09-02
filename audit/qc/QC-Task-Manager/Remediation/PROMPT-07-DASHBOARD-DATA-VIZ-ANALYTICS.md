# PROMPT 07 — DASHBOARD, DATA VISUALIZATION & ACTIONABLE ANALYTICS

TASK ID:
QC-REMEDIATION-007

PRIORITY:
P1 / P2

ROLE:
Principal Analytics Engineer, Data Visualization Architect, Accessibility Data Specialist.

DEPENDS ON:
GATE B (PROMPT-02, PROMPT-04).

BLOCKS:
PROMPT-10, GATE C.

SOURCE FINDINGS:
- P1-4: Dashboard & Lab filter misalignment; SVG charts lack 1-to-1 HTML table alternatives.
- P2-2: Duplicate KPI definitions between "Average Completion Time" and "Average Resolution Time".
- Audit Sections 17, 45, 46, 47.

AFFECTED DOMAINS:
Domain 45 (Dashboard Design), Domain 46 (Data Visualization Design), Domain 47 (Data-Driven Design), Domain 48 (Advanced Table Design), Domain 26 (Accessibility).

MISSION:
Unify the analytical filters across the Dashboard and Laboratory modules, eliminate redundant/confusing KPI definitions, provide accessible, semantic HTML data table equivalents for all SVG charts with a clean "عرض كجدول" toggle, and display clear denominators, sample sizes, and calculation periods on every executive metric.

CURRENT-REALITY REQUIREMENT:
Before modifications:
* read `.agents/mind/01-mind-latest.md`
* read findings P1-4, P2-2, and Dashboard Deep Dive (Section 17)
* inspect `apps/qc-task-manager/src/pages/dashboard.astro`
* inspect `apps/qc-task-manager/src/pages/reports.astro`
* inspect `apps/qc-task-manager/src/components/DashboardCharts.tsx` (or chart components)
* inspect KPI calculation functions in `src/lib/`.

MANDATORY SOURCE INSPECTION:
- `apps/qc-task-manager/src/pages/dashboard.astro`
- `apps/qc-task-manager/src/pages/lab/reports.astro`
- `apps/qc-task-manager/src/lib/taskMetrics.ts`
- `apps/qc-task-manager/scripts/test-dashboard-reports.mjs`

MANDATORY SKILLS:
- `.agents/skills/verification-before-completion/SKILL.md`
- `.agents/skills/data-visualization/SKILL.md`
- `.agents/skills/table-accessibility/SKILL.md`

REQUIREMENTS:
1. Unified Filter Architecture (P1-4):
   - In `src/pages/dashboard.astro`:
     - Ensure date range, unit, priority, and status filters apply consistently across BOTH Task metrics AND Laboratory test metrics on the dashboard.
     - If lab metrics are filtered by a different dimension, provide explicit tabbed scope indicators (e.g. "مؤشرات المهام العامة" vs "مؤشرات التحاليل المخبرية") rather than silent disjointed filtering.
2. KPI Canonical Definition (P2-2):
   - Reconcile "Average Completion Time" vs "Average Resolution Time":
     - Clearly label "Average Completion Time" as the duration from task creation to technician completion.
     - Clearly label "Average Review & Resolution Time" as the duration from technician completion to final manager sign-off.
     - Document formulas and metadata tooltips with exact denominators (e.g., `N = 142 مهام مكتملة خلال آخر 30 يوماً`).
3. Accessible 1-to-1 HTML Table Equivalents for Charts:
   - For every SVG chart on the dashboard (bar charts, completion trends, priority distribution):
     - Provide an accessible toggle button: `<button aria-expanded="false">عرض كجدول بيانات</button>`.
     - When toggled, render a semantic `<table>` containing exact figures, percentages, headers (`<th scope="col">`), and summary footer.
     - For screen readers, provide `aria-label` summarizing the chart takeaway (e.g., `aria-label="رسم بياني يوضح نسبة إنجاز المهام، أعلى نسبة في قسم الكيمياء بنسبة 94%"`).

NON-NEGOTIABLE BUSINESS RULES:
- Executive metrics must NEVER display misleading zeros when data exists or display 100% when based on a sample size of zero (N=0 must display "لا توجد بيانات للفترة").
- Calculations must be deterministic and verifiable directly via SQL queries.

IMPLEMENTATION REQUIREMENTS:
- Fast, SSR-rendered markup without client-side hydration overhead where possible.
- Responsive chart containers that don't overflow on tablet viewports.

DO NOT:
- Do NOT install heavy chart libraries like Chart.js or D3 if lightweight SVGs already exist.
- Do NOT hide table alternatives with `display:none` from screen readers when the user toggles them on.

TEST-FIRST / DEBUGGING REQUIREMENT:
Create an automated test querying the dashboard with zero completed tasks and assert that KPIs display "N/A (N=0)" instead of "0 hours" or "100%".

TEST QUALITY REQUIREMENT:
Assert actual table row counts, column headers, and KPI calculated numbers against seeded database fixtures.

REQUIRED AUTOMATED TESTS:
- `pnpm run test:dashboard-reports`
- New: chart-to-table equivalence test.

REQUIRED BROWSER TESTS:
- E2E test: Click "عرض كجدول بيانات" -> verify table displays in DOM -> click again -> verify table hides.

REQUIRED DATABASE TESTS:
- Verify underlying SQL queries execute in < 20ms using proper indexes on `created_at` and `status`.

REQUIRED SECURITY TESTS:
- Ensure manager dashboard metrics do not leak restricted tasks to lower role viewports.

REQUIRED ACCESSIBILITY TESTS:
- Check table markup: `<caption>`, `<th scope="col">`, `<th scope="row">`, and keyboard toggleability.

REQUIRED ROLE TESTS:
- Compare Dashboard view as Employee vs Supervisor vs Manager vs Admin.

REQUIRED NEGATIVE TESTS:
- Filtering by date range with 0 records renders clean Empty State illustration with actionable reset filter link.

REGRESSION REQUIREMENT:
All 74 unit tests and 28 E2E suites must pass.

ACCEPTANCE CRITERIA:
- AC-01: Filter consistency unified between task metrics and lab indicators.
- AC-02: Completion Time vs Resolution Time KPIs disambiguated with clear formulas and denominators.
- AC-03: Every SVG chart provides an accessible, toggleable HTML table equivalent.
- AC-04: Empty state gracefully handles N=0 without NaN or misleading 0% indicators.
- AC-05: Chart summaries provide screen reader descriptions via `aria-label`.
- AC-06: Evidence file written to `audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-07-EVIDENCE.md`.

TARGET:
All applicable AC = PASS (6/6).

EVIDENCE OUTPUT:
`audit/qc/QC-Task-Manager/Remediation/Evidence/PROMPT-07-EVIDENCE.md`

FINAL VERIFICATION:
Run `pnpm run test:dashboard-reports`.

FINAL RESPONSE FORMAT:
Status: PASS / PARTIAL / BLOCKED
Criteria: 6/6
Tests: ...
Remaining: ...

# QC-100 Dashboard Data Visualization Evidence

**Task:** QC-100-DATA-VIZ-012  
**Role:** Principal Analytics Product Designer  
**Scope:** Every QC dashboard, KPI, chart, report surface, drilldown, and analytical table in `apps/qc-task-manager`.  
**Review date:** 2026-09-02  
**Status:** **PARTIAL — audit complete; remediation backlog remains.**

## Decision standard

The product should help a QC user decide what to do next. A metric is retained only when it has a named question, owner, action, comparison/context, period, and an explicit good/bad interpretation. Counts without an operational decision are supporting context, not top-level KPIs.

This is a source and contract audit. It does not claim live production data quality, human UAT, VoiceOver/NVDA success, or that every visualization is already accessible at 100%.

## Inventory audited

| Surface | Evidence location | What was audited |
|---|---|---|
| Management dashboard | `src/pages/dashboard.astro`, `src/lib/dashboard.ts`, `src/components/DashboardCharts.tsx` | Filters, 20 dashboard KPI definitions, 6 chart widgets, action cards, 5 analytical tables, loading/error/empty/zero states |
| Laboratory command center | `src/pages/lab/index.astro`, `src/lib/lab/overview.ts` | Role-prioritized alerts, 13 base KPIs plus role-gated master-data KPIs, recent/pending/alert tables |
| Laboratory analytics | `src/pages/lab/reports.astro`, `src/components/lab/LabFailRateChart.tsx` | FAIL-rate trend, current/previous comparison, product breakdown, report filters and downloads |
| Laboratory dashboard charts | `src/components/LabDashboardCharts.tsx`, `src/lib/lab/dashboard.ts` | 6 widgets: tests trend, type, result, equipment, calibration, document status |
| Employee / supervisor / manager dashboards | `src/pages/employee/index.astro`, `src/pages/supervisor/index.astro`, `src/pages/manager/index.astro`, `src/pages/manager/workload.astro` | Attention queues, workload table, completion/overdue/risk fields, role-specific scope |
| Task reports | `src/pages/reports.astro`, `src/lib/reporting/catalog.ts`, `src/lib/reporting/queries.ts` | 8 report types, period/scope/advanced filters, preview, CSV/XLSX/PDF, audit trail |
| Laboratory reports | `src/pages/lab/reports.astro`, `src/lib/reporting/catalog.ts` | 16 report types, filters, preview, exports, audit trail |
| KPI drilldown | `src/pages/dashboard/drilldown.astro`, `src/lib/reporting/drilldown.ts` | KPI-to-register links, authorized task table, empty state, scope preservation |

## Executive verdict

| Goal | Finding | Verdict |
|---|---|---|
| Support decisions | Overdue, blockers, missing evidence, urgent work, CAPA, calibration, review queues and FAIL trends are present and drillable. | **Pass with prioritization work** |
| KPI hierarchy | The main dashboard exposes a large mixed grid: status counts, duplicates, rates, SLA states, lab inventory counts and data-quality counts. | **Major issue** |
| Metric integrity | Definitions are mostly explicit in `dashboard.ts`, `lab/dashboard.ts`, and `reporting/queries.ts`; period semantics differ between dashboard, lab and reports. | **Minor/major issue** |
| Trend context | Completion and FAIL rate have previous-period comparison; most counts and charts do not have target, baseline, delta, or alert threshold. | **Major issue** |
| Drilldowns | Dashboard KPI links and lab KPI links are broadly mapped to existing registers; the drilldown table is capped at 500 with no pagination. | **Minor issue** |
| Accessibility | Charts expose names, titles, legends, and some live summaries; several charts lack a true accessible table and employee status detail is summarized only at total level. | **Major issue** |
| Misleading visuals | Bar scales are zero-based or full 0–100% for FAIL rate; no 3D/rainbow charts found. The main risk is missing denominator/period/target context, not geometry. | **Pass on scale; fail on context** |
| Vanity metrics | Total tasks, AIR/VACUUM mix, recent activity, contributor changes today, and some inventory totals are useful context but not decision KPIs by themselves. | **Demote/remove from KPI tier** |

## KPI contract review

“Good/bad” below is the decision interpretation that should be shown in the UI. Where the source has no target or policy threshold, the review marks it as **not defined** instead of inventing one.

### Main `/dashboard` task KPIs

| KPI | Question / user | Trigger | Context + period | Good / bad |
|---|---|---|---|---|
| Total Tasks | How much work is in the selected scope? Manager/supervisor. | Use to size the queue; do not act on this alone. | Same filters; selected created-at range or All time. | Context only; no intrinsic good/bad. |
| Not Started | Which assigned work has not begun? Supervisor/manager. | Assign, clarify priority, or escalate. | Count of tasks with `not_started`; same scope/period. | Lower is generally better, but target depends on intake. |
| In Progress | How much work is actively being processed? Supervisor. | Rebalance workload and check aging. | Status count; same scope/period. | No fixed good/bad without age or SLA context. |
| On Hold / Blocked | Which work cannot move? Supervisor/manager. | Remove blocker, reassign dependency, or escalate. | Status count plus blocker note table; same scope/period. | Lower is better; any critical blocker needs action. |
| Completed | How much work finished? Manager. | Validate throughput against demand. | Status count; created-at filter, not necessarily completion period. | Higher is not automatically good without incoming volume and quality. |
| Overdue | Which open work missed its due date? Supervisor/manager. | Open overdue queue, assign owner, recover SLA. | `due_date < today`, excluding completed/cancelled; current date. | Zero is good; any overdue item is actionable. |
| Urgent Open | Which urgent work remains open? Supervisor/manager. | Immediate triage and ownership confirmation. | Urgent + not completed/cancelled; current scope/period. | Zero is good; any item needs review. |
| Completed Without Evidence | Which completed tasks lack proof-of-work? Supervisor/QA reviewer. | Request evidence or reopen review before acceptance. | Completed tasks with no `is_evidence=1` attachment; same scope/period. | Zero is good; non-zero is a compliance gap. |
| Average Completion Time | How long does completed work take after start? Manager. | Investigate cycle-time outliers and capacity. | `completed_at - started_at`; completed records with both timestamps; same scope. | Lower is not always better; compare to task class/SLA and show sample size. |
| SLA Compliance | Did completed SLA-tracked work finish within SLA? Manager/QA. | Investigate breaches and change capacity/process. | Completed + SLA-started tasks, `sla_percent_used <= 100`; same scope/period. | Higher is better; target is not defined in the UI. |
| SLA At Risk | Which tasks are nearing the SLA warning boundary? Supervisor. | Intervene before breach. | `sla_status=AT_RISK`; current live snapshot. | Zero is good; non-zero is a pre-breach queue. |
| SLA Critical | Which tasks crossed the critical warning boundary? Supervisor/manager. | Escalate and assign recovery action. | `sla_status=CRITICAL`; current live snapshot. | Zero is good; non-zero is urgent. |
| SLA Breached | Which tasks exceeded SLA? Manager/QA. | Root-cause breach and CAPA where repeated. | `sla_status=BREACHED`; current live snapshot. | Zero is good; non-zero requires documented action. |
| Average SLA Consumption | How much SLA budget is being consumed on average? Manager. | Detect systemic capacity pressure. | Average `sla_percent_used` on SLA-started tasks; current snapshot. | <100% is necessary but not sufficient; no target/denominator shown. |
| Completion Rate | What share of tasks completed, and is it moving? Manager. | Compare against previous equal-length period and adjust capacity. | Current vs previous period; filters except status/overdue are retained. | Up is generally good, but only with quality and demand context. |
| Critical Findings | Which tasks have an open critical finding? QA manager. | Open investigation/CAPA and escalate risk. | Open finding where severity or classification is critical; same scope/period. | Zero is good; any item is high priority. |
| Open CAPA | Which tasks have unresolved corrective/preventive action? QA manager. | Review owner, due date and effectiveness. | CAPA status not `CLOSED`; same scope/period. | Zero is not always realistic; overdue/open age is required. |
| Evidence Compliance | What share of completed tasks have evidence? QA reviewer. | Close evidence gaps and prevent unsupported completion. | Completed tasks with evidence / completed tasks; same scope/period. | Higher is better; denominator must remain visible. |
| QC Checklist Progress | How much checklist work is complete? Supervisor/employee. | Finish remaining checklist items before submission. | Completed checklist items / all checklist items in current filter scope. | 100% is good for ready-to-close work; zero with no checklist rows is ambiguous. |

### Laboratory KPIs and operational metrics

| KPI group | Question / user | Trigger | Context + period | Good / bad |
|---|---|---|---|---|
| Tests Today / This Week | How much testing entered the lab recently? Lab supervisor. | Compare demand and staffing to capacity. | Created-at calendar day/week; no prior-period comparison. | Context only; volume is not quality. |
| Draft Tests | Which test records are unfinished? Lab operator/supervisor. | Complete or delete/void according to policy; investigate aging. | Current records; age is missing from card. | Lower aged backlog is better; count alone lacks age. |
| Awaiting Review | What is waiting for reviewer attention? Reviewer/supervisor. | Work the review queue by age/risk. | `UNDER_REVIEW`; current records. | Lower queue/shorter age is better; age/SLA missing. |
| Approved Tests | How many tests reached approval? Lab manager. | Confirm throughput and release decisions. | `APPROVED`; current records. | Context only unless compared with submitted volume and time. |
| PASS / FAIL / HOLD | What are the final test outcomes? Lab reviewer/manager. | Investigate FAIL, disposition HOLD, confirm PASS release. | Non-VOID tests with final result; current records. | PASS is not sufficient without denominator; FAIL/HOLD trigger review. |
| Equipment Requiring Attention | Which equipment may threaten valid testing? Lab operator. | Stop use, maintain, calibrate, or document disposition. | Derived equipment/calibration state; current snapshot. | Zero is good; non-zero actionable. |
| Calibration Due | Which equipment is due/overdue for calibration? Lab manager. | Schedule calibration and prevent use if policy requires. | Latest due date; attention includes due soon/today/overdue. | Zero overdue is good; due-soon needs planned action. |
| Documents Due for Review | Which controlled documents need review? Document owner/reviewer. | Review/approve before due date. | Active docs where due date is today/past; current snapshot. | Zero overdue is good; due-soon window should be explicit. |
| Retests Open | Which retests remain unresolved? Lab reviewer/manager. | Complete disposition and link root cause. | Retest status `OPEN`; current records. | Lower aged open retests is better; age and repeat-failure link missing. |
| Data Quality Issues | What records cannot be trusted for decisions? Data steward/admin. | Correct source data or assign remediation. | Open detector findings; current snapshot. | Zero open issues is good; severity/impact should be visible. |
| Pending Master Data Changes | What governed changes await approval? Lab manager/admin. | Review and approve/reject. | Pending change requests; current snapshot. | Zero aged requests is good; age missing. |
| Contributor Changes Today | What master-data activity happened today? Admin/manager. | Audit unusual volume; no routine action. | Today only. | Activity context, not a KPI; demote from primary KPI tier. |
| Rejected Changes | What proposed changes were rejected? Admin/manager. | Review rejection reasons and recurring causes. | Rejected change requests; current snapshot. | Not intrinsically good/bad; pair with reason and repeat rate. |
| Changes Waiting >24h | Which governed changes are aging? Admin/manager. | Escalate reviewer and clear queue. | Pending requests older than 24 hours. | Zero is good; non-zero actionable. |

## Visualization audit

| Visualization | Current encoding | Decision value | Issues / required improvement |
|---|---|---|---|
| Tasks by status donut | Part-to-whole donut with legend and counts. | Shows queue composition. | Keep only as secondary context; status counts already appear as KPI cards. Add accessible table and period/total label. |
| Completion rate card | Percent, previous percent, delta in percentage points, current/previous dates. | Strong decision metric. | Keep prominent; show numerator/denominator and target. Never communicate direction by arrow/color alone. |
| Tasks by priority bars | Horizontal bars with count and share. | Helps triage urgent/high work. | Good simple encoding; add explicit filter/drilldown per priority and selected period in the card. |
| Completed per week line | 8-week line with point titles and total summary. | Shows throughput trend. | Add y-axis unit “tasks completed”, previous-period comparison and accessible table. Current filter is not clearly restated in chart title. |
| Tasks per employee stacked bars | Stacked status bars, zero-based y scale, legend, horizontal scroll. | Workload/status imbalance. | Labels truncate names; chart accessible label exposes totals but not every status segment. Add sortable table with employee/status counts and overdue rate. |
| Overdue by employee bars | Horizontal red bars, only employees with overdue work. | Directly actionable queue ownership. | Good decision value; explicitly state excluded zero-overdue users and add days overdue/age, not just count. |
| Lab tests by date | 8-week line. | Detects demand/throughput movement. | Count is not outcome; add comparison and link to review queue. Add table alternative. |
| AIR vs VACUUM | Two horizontal bars. | Mix/context for workload. | Not a KPI by itself; demote. Show period and link filters. |
| Final results | PASS/FAIL/HOLD bars. | Quality outcome mix. | Add denominator, FAIL/HOLD rates, and repeat-failure/CAPA link. Counts alone can mislead when volume changes. |
| Equipment status | Horizontal status bars. | Shows availability/maintenance state. | Add “as of” timestamp and separate calibration attention; current chart is inventory context. |
| Calibration donut | Calibration state donut including unknown. | Surfaces compliance risk. | Good inclusion of unknown; add total equipment, threshold definition, and accessible table. |
| Document review status | Lifecycle status bars. | Shows controlled-document backlog. | Add due/overdue and acknowledgement coverage; lifecycle counts alone do not show risk. |
| FAIL-rate trend | Full 0–100% line, decided non-VOID tests, current vs previous period. | Strong quality signal. | Keep; add sample-size warning for small denominators, target/alert threshold, and accessible table. |
| FAIL rate by product | Ranked analytical table with decided, FAIL, rate, drilldown. | Direct investigation queue. | Good table; add minimum sample-size rule, time range in heading, and repeat-failure/CAPA columns where available. |

## Reports, drilldowns, and analytical tables

### Strengths confirmed

- Report filters include period, scope and advanced dimensions; the preview repeats resolved scope, period, filters and matching rows.
- The server re-authorizes report generation and records report ID, actor, filters, format and data scope in the audit trail.
- Report catalog covers overdue, findings, CAPA, evidence, SLA, performance, lab tests/results/retests, equipment/calibration/maintenance, SOP/WI, review due, acknowledgements, data quality and retention.
- KPI drilldowns preserve filters and authorized scope and expose a text table with status, priority, SLA and due date.
- Operational tables surface overdue tasks, blockers, missing evidence, pending reviews, equipment alerts, calibration alerts, document review due, open retests and recent activity.

### Findings and changes required

| Priority | Finding | Remediation |
|---|---|---|
| P0 | KPI cards are not consistently decision-complete: many lack denominator, target, “as of”, or comparison. | Make each card show unit, period, numerator/denominator where relevant, target/threshold, delta and a named action link. |
| P0 | Main dashboard duplicates concepts: `Average Completion Time` and `Average Resolution` use the same value; task status counts are repeated as cards and donut. | Remove duplicate card; demote donut/status counts to context; reserve top tier for overdue, urgent, SLA risk/breach, evidence, critical findings, CAPA and completion rate. |
| P1 | Employee stacked chart has an accessible total summary but not an accessible representation of every status segment. | Add a real HTML table or expandable per-employee breakdown with status counts, overdue, workload and period. |
| P1 | Several charts have no explicit y-axis unit or visible period/“as of” label. | Add axis/unit labels and period text to every chart; avoid requiring tooltip/aria-label discovery. |
| P1 | Hover tooltip is not the primary accessible route and is not clearly associated with focused marks. | Use focusable controls with `aria-describedby` or rely on a visible data table; never make tooltip the only detail path. |
| P1 | Dashboard laboratory cards ignore the task dashboard filter state and represent a live all-time/current snapshot while the page says filters scope every widget. | Either apply the same period/scope contract to lab widgets or label the lab section explicitly as “current lab snapshot, independent of task filters.” |
| P1 | FAIL-rate trend shows a threshold constant in product-row coloring but does not display the threshold or a target line. | Show the alert threshold numerically and in text; add a target/threshold annotation and denominator warning. |
| P2 | Drilldown result is capped at 500 and has no pagination or “showing X of Y” context. | Add cursor pagination and total/limit disclosure, or make the cap a deliberate filterable report action. |
| P2 | Empty/zero states are present but not consistently differentiated from “not calculated” or “no denominator”. | Use explicit states: no records, zero records, not applicable, insufficient sample, failed to load. |
| P2 | Reports offer export formats but the UI does not explain which columns/decision question each report answers at the point of selection. | Add report purpose, owner, period basis, grain, and recommended action to every catalog item. |

## Accessibility and non-color requirements

### Confirmed in source

- SVG charts use `role="img"`, descriptive `aria-label`, and native `<title>` elements on marks.
- Donut and line points/segments are focusable; chart legends and bar counts are rendered as text.
- Tables and registers are available for operational queues and product FAIL breakdown.
- Status semantics use labels and shared semantic tones; the project has an automated status/contrast/a11y contract.
- Loading, error, empty and zero paths exist for dashboard and lab surfaces.

### Not yet proven / required before “100%”

- VoiceOver/NVDA behavior for every chart and focused mark is not recorded.
- No HTML table alternative exists for every chart, especially stacked employee status detail and some lab distributions.
- Color is supplemented by text in most places, but visual hierarchy still uses color to signal urgency; the text label/action must remain the authoritative signal.
- Chart labels can truncate employee/document/product names; truncation must not remove identity from the accessible or tabular representation.
- Automated a11y PASS is not equivalent to human assistive-technology validation.

## Recommended target dashboard hierarchy

1. **Act now:** overdue, urgent open, SLA breached/critical, critical findings, open CAPA, missing evidence, calibration overdue, review queue, open retests.
2. **Decide today:** completion rate vs previous period/target, FAIL rate vs previous period/threshold, workload imbalance, documents due, changes waiting >24h.
3. **Investigate:** overdue-by-owner, FAIL rate by product/lot, repeat failures, failure reasons, evidence compliance, average resolution with sample size.
4. **Context:** total volume, status mix, AIR/VACUUM mix, equipment inventory, recent activity, contributor changes today.

Vanity rule: a volume or activity count stays only when it changes a decision, has a period, and links to the next action. Otherwise it belongs in a report or supporting table, not the primary KPI tier.

## Required KPI card contract

Every retained KPI card must expose:

- question-shaped label or supporting sentence;
- unit and numerator/denominator when it is a rate;
- period and “as of” time;
- comparison period, delta and direction in text;
- target/threshold or explicit “no target defined”;
- plain-language good/bad interpretation;
- owner and action link;
- accessible text summary and an equivalent table for visual-only detail;
- explicit no-data / zero / insufficient-sample / error state.

## Verification performed

| Check | Result |
|---|---|
| Source inventory of dashboard/report/chart/drilldown/table surfaces | PASS |
| KPI definitions traced to read models and SQL predicates | PASS |
| Chart type/encoding/scale/legend/unit review | PASS with findings above |
| Actionability review against overdue, completion, rejects, failures, CAPA, calibration, maintenance, acknowledgements and workload | PASS with prioritization gaps |
| Automated project a11y/design contracts | Existing PASS recorded in `A11Y-ERGONOMICS-100-EVIDENCE.md`; not rerun as part of this documentation-only audit |
| Human VoiceOver/NVDA and production data validation | NOT RUN / required |

## Final claim

The QC application has a credible analytical foundation and many actionable queues, but it does **not** yet meet the requested “zero misleading, zero unlabeled, zero inaccessible, zero meaningless” standard. The remaining gap is primarily decision context and accessible equivalence: reduce KPI clutter, remove duplicate/vanity prominence, expose periods/denominators/targets, and provide a real tabular alternative for every chart.

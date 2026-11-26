---
name: accessibility-testing-strategy
description: Use when planning accessibility QA, choosing automated and manual coverage, preparing assistive-technology testing, or organizing sessions with disabled participants.
---

# Accessibility Testing Strategy and Test Planning

Plan evidence-based accessibility testing that combines automation, expert review, assistive technology, and testing with disabled people. Select only the layers and participants appropriate to the product, risk, and release; do not treat a checklist or automated scan as proof of conformance.

## Choose the scope

- **Test strategy:** decide what to test, by whom, with which methods, and when.
- **Test plan:** turn an agreed strategy into flows, environments, assistive-technology combinations, participant criteria, session protocol, and reporting fields.
- **Regression plan:** identify repeatable checks for changed components, critical paths, and known defects.

Use `accessibility-audit` to assess an existing interface and report current findings. Use `accessibility-decisions-document` for the decision lifecycle. This skill plans testing; it does not claim that testing has happened or that a product conforms.

## 1. Define goals and risk

Record the product, user groups, critical tasks, platforms, supported input methods, applicable standard and level (if specified), release timing, constraints, and evidence needed. Prioritize barriers that block core tasks, cause harm, prevent recovery, or affect many users. Mark unknowns explicitly rather than inventing coverage.

## 2. Select complementary testing layers

| Layer | Useful coverage | Limits | Typical timing |
|---|---|---|---|
| Automated checks | Missing names/labels, invalid ARIA patterns, contrast flags, duplicate IDs, basic semantics | Cannot judge meaning, task usability, logical focus/order, or full conformance | During development and CI, on representative states |
| Manual expert checks | Keyboard operation, focus order/visibility, zoom/reflow, content clarity, state announcements, preference settings | Depends on tester skill and may miss real-world workflows | Before release and after high-impact changes |
| Assistive-technology checks | Screen-reader names, roles, states, announcements; voice/switch/magnification paths when relevant | Results vary by OS, browser, AT version, and user configuration | On supported platform combinations and critical paths |
| Sessions with disabled people | Real task completion, workarounds, compatibility, unexpected barriers | Small samples are qualitative, not prevalence estimates or certification | During discovery, major redesigns, and high-risk launches |

Use automation as one layer, never as a substitute for manual or user testing. Avoid generic percentages for issues detected; results depend on product and test design.

## 3. Choose flows, states, and combinations

Start with primary tasks and high-risk journeys, then include navigation/input, content comprehension, and edge states. Cover relevant loading, empty, validation, error, success, permission, offline, destructive, and recovery states. Include responsive layouts, zoom/reflow, high contrast or forced colors, reduced motion, and text enlargement where supported.

Build a matrix with one row per critical flow and columns for platform/browser, keyboard, screen reader, zoom/reflow, contrast/preferences, automated checks, and owner. Select combinations from actual support commitments and risk; do not attempt every permutation blindly. Include VoiceOver on supported Apple platforms and NVDA on supported Windows configurations where applicable; add TalkBack, switch control, voice control, magnification, or braille workflows when they match users and product support.

## 4. Plan participant sessions when needed

Define participant criteria around the relevant tasks and access needs, not diagnosis alone. Include people with varied experience using their own devices and assistive technology when feasible. State recruitment constraints and gaps. Obtain informed consent, protect personal data, compensate fairly where applicable, and make participation accessible.

Prepare a neutral protocol:

1. Explain the purpose, recording, privacy, and right to stop.
2. Ask the participant to complete realistic tasks without teaching the interface.
3. Observe task outcome, errors, pauses, workarounds, and participant interpretation.
4. Ask open follow-up questions; distinguish observed behavior from opinion and researcher inference.
5. Close with a debrief and accessible way to share later feedback.

Do not frame participants as testers of their own ability. Do not infer broad prevalence from a small qualitative sample.

## 5. Write executable test cases

For each case record: ID, user task, preconditions, platform/browser/AT versions, steps, expected result, observed result, evidence, severity/impact, reproducibility, and status. For screen readers, check accessible name/role/state, reading and focus order, dynamic announcements, and recovery after actions. For keyboard, check all controls, visible focus, no traps, logical movement, and operable alternatives. For zoom/reflow, check content and functionality without unintended two-dimensional scrolling where applicable.

Separate automated assertions from expert judgments and participant observations. Map cases to WCAG criteria only when the criterion is applicable; a test mapping is not itself a conformance claim.

## 6. Report and prioritize

Report each issue with location, affected task and users, environment, steps, evidence, applicable criterion (if assessed), severity, workaround, and actionable remediation. Prioritize by user impact and task blockage, not criterion level alone. Track unresolved issues, owners, retest conditions, and accepted risks without inventing owners or deadlines.

Deliver the mode-appropriate artifact:

- **Strategy:** scope, risk-based layers, responsibilities, timing, and evidence limits.
- **Test plan:** flow/environment matrix, case list, participant criteria, session protocol, and reporting template.
- **Regression plan:** repeatable checks linked to changed areas, critical paths, and known issues.

## Quality checks

- Critical tasks and failure/recovery states are covered.
- Keyboard and relevant assistive technologies are represented.
- Automated, expert, and participant evidence are clearly distinguished.
- Test environments and AT versions are recorded.
- Gaps and unsupported combinations remain visible.
- No testing, WCAG conformance, or user-research result is claimed without evidence.

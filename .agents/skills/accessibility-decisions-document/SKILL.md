---
name: accessibility-decisions-document
description: Use when documenting, reviewing, or handing off accessibility decisions for a feature, including tradeoffs, implicit assumptions, WCAG mapping, engineering requirements, or test criteria.
---

# Accessibility Decisions: Document, Review, and Handoff

Use this as the single workflow for the accessibility-decision lifecycle. It supports three modes: **document** a feature being designed or shipped; **review** an existing feature for implicit or undocumented decisions; and **handoff** a settled design to engineering. Select the mode from the user's request; do not claim a conformance audit unless that scope was actually assessed.

## 1. Choose the mode

- **Document:** Capture deliberate design and implementation choices, alternatives, evidence, affected users, tradeoffs, standards impact, and open items.
- **Review:** Inspect the existing feature and surface both deliberate and default decisions; assess intent, evidence, users served or excluded, current gaps, and accessibility debt.
- **Handoff:** Translate approved decisions into implementable requirements and executable acceptance tests. Keep unresolved decisions and risks visible rather than silently deciding them.

## 2. Inventory and assess decisions

Consider interaction and keyboard behavior, screen-reader names/states/announcements, visual contrast and color independence, motion, content and language, errors, user preferences, zoom/reflow, and what was deferred. For each decision record:

- **Context** — the feature need or constraint.
- **Decision** — what was chosen and whether it was intentional or inherited.
- **Alternatives** — material options considered or still open.
- **Impact** — who benefits, who encounters friction, and who may be blocked.
- **Evidence** — research, standards, testing, or rationale; label assumptions as assumptions.
- **Tradeoff** — competing needs, severity asymmetry, and a remediation or review plan.

Use `decision-documentation` for decision records, `tradeoff-analysis` for conflicting accessibility needs, and `accessibility-debt-tracking` when review identifies deferred issues. Do not treat those references as proof of compliance.

## 3. Map standards and implementation

When requested or needed, map each decision to applicable WCAG success criteria and state conformance risks or unknowns. For handoff, specify per interactive element: semantic HTML/role, keyboard behavior, focus movement, accessible name/role/state, and visual states. For content, specify heading level, alt-text strategy, link text, and language. For adaptive behavior, specify the relevant preference, expected response, and reflow/zoom behavior.

Use `compliance-mapping` for standards mapping. State the standard and conformance level actually assessed; do not infer full compliance from partial mapping.

## 4. Define verification

For each implementable requirement, give a testable expected result. Include relevant keyboard, screen-reader, visual/contrast, zoom/reflow, preference, and automated checks. Use `accessibility-testing-strategy` for the test approach and assistive-technology participant/session planning when needed. Distinguish automated checks from manual testing and unverified assumptions.

## 5. Deliver the mode-appropriate artifact

- **Document:** Feature summary; decision log; tradeoff register; standards map; unresolved/deferred items.
- **Review:** Decision inventory marked intentional/inherited; undocumented tradeoffs and user impact; assessed conformance gaps; debt register with severity/owner/timeline where known; prioritized recommendations.
- **Handoff:** Element-by-element engineering specification; test cases; standards mapping; risk/dependency register; definition of done.

Keep decisions, evidence, risks, and open questions distinct. Do not invent an owner, deadline, test result, or compliance claim. For more general accessibility testing, use `accessibility-testing-strategy`; for an interface audit without a decision-lifecycle deliverable, use `accessibility-audit`.

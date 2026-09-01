# QC Task Manager — 100% Closure & World-Class Product Upgrade

**Target Model:** Codex 5.6 Luna  
**Repository:** `/Users/yzydalshmry/Desktop/BRIGHTAI`  
**Primary Application:** `apps/qc-task-manager/`  
**Audit Root:** `audit/qc/QC-Task-Manager/`  
**Canonical Mind:** `.agents/mind/01-mind-latest.md`  
**Skills Root:** `.agents/skills/`  
**Skills Registry:** `skills-lock.json`  
**Canonical Permission Authority:** `apps/qc-task-manager/src/lib/permissions.ts`

> كل برومبت موجود داخل Code Block. في GitHub / ChatGPT / أغلب محررات Markdown سيظهر زر **Copy** تلقائيًا أعلى البلوك.

---

# Master Execution Checklist

- [✅] PROMPT 00 — Freeze Reality + 100% Gap Matrix
- [✅] PROMPT 01 — Architecture + Code Quality
- [ ] PROMPT 02 — Database + Migrations + Data Integrity
- [ ] PROMPT 03 — Security + Auth + RBAC + Privacy UX
- [ ] PROMPT 04 — Testing + E2E + CI + Observability + Performance
- [ ] PROMPT 05 — Design System
- [ ] PROMPT 06 — Visual Design + UI
- [ ] PROMPT 07 — UX + Information Architecture + Service Design
- [ ] PROMPT 08 — Interaction Design + Motion & Digital Art
- [ ] PROMPT 09 — UX Writing + Microcopy + UX Research
- [ ] PROMPT 10 — Accessibility Design + Ergonomics
- [ ] PROMPT 11 — Dashboard + Data Visualization
- [ ] PROMPT 12 — Advanced Form Design
- [ ] PROMPT 13 — Information Architecture & Permissions
- [ ] PROMPT 14 — Real UAT + Production Operations Closure
- [ ] PROMPT 15 — Final Independent 100% Verification

## Execution Order

`00 → 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12 → 13 → 14 → 15`

> **قاعدة صارمة:** لا يتم اعتبار أي مجال 100% إلا إذا كان لديه Evidence فعلي وقابل لإعادة التحقق.  
> Human UAT / Production / Live Backup-Restore / Real User Performance لا يجوز احتسابها 100% بالكود فقط.

---

# PROMPT 00 — Freeze Reality + Build the 100% Gap Matrix

## Checklist
- [ ] قراءة mind + AGENTS + CLAUDE + audit docs
- [ ] جرد skills ذات الصلة
- [ ] تجميد HEAD / branch / status / runtime
- [ ] جرد الملفات والمسارات والـAPIs والـDB والاختبارات
- [ ] إنشاء scoring methodology
- [ ] إنشاء gap matrix
- [ ] عدم تنفيذ أي إصلاح في هذه المرحلة
- [ ] تحديث mind

```text
@GitHub @Superpowers

TASK ID:
QC-100-BASELINE-001

You are operating as a Principal Software Architect, Staff QA Engineer, Product Design Auditor, Security Engineer, Accessibility Specialist, and QC Compliance Systems Reviewer.

Your mission is to establish the CURRENT truth of the QC Task Manager before any remediation.

Do not trust any previous:
- PASS
- percentage
- readiness score
- audit
- report
- completion claim
- implementation summary
- production-ready claim

unless independently verified against the CURRENT repository state.

MANDATORY FIRST STEPS

Read completely:

1. .agents/mind/01-mind-latest.md
2. AGENTS.md
3. .agents/AGENTS.md
4. CLAUDE.md
5. audit/qc/QC-Task-Manager/*
6. apps/qc-task-manager/README.md
7. apps/qc-task-manager/SECURITY.md
8. relevant architecture/database/deployment documentation
9. skills-lock.json

Then inspect .agents/skills/.

Discover and read every applicable SKILL.md covering:
- systematic debugging
- verification before completion
- test driven development
- architecture
- Astro
- TypeScript
- SQLite
- database migrations
- security
- authentication
- RBAC
- accessibility
- responsive design
- UX
- UI
- forms
- performance
- testing
- E2E
- observability
- documentation
- design systems

Do not blindly load irrelevant skills.

FREEZE REALITY

Capture:
- HEAD SHA
- branch
- git status
- tracked/untracked state
- diff
- Node version
- pnpm version
- OS/runtime
- application architecture
- database architecture
- number of tracked QC files
- routes
- APIs
- middleware routes
- middleware guards
- DB migrations
- DB tables
- schema objects
- unit/integration suites
- E2E suites
- documentation files
- registered skills

Create:
audit/qc/QC-Task-Manager/100-PERCENT-BASELINE.md

BUILD A RIGOROUS SCORING MODEL

Score these domains individually:

1. Architecture
2. Database / migrations
3. Security
4. Authentication
5. RBAC / authorization
6. Functional workflows
7. Testing
8. UI
9. UX
10. Visual Design
11. Design System
12. Information Architecture
13. Interaction Design
14. Motion & Digital Art
15. UX Writing / Microcopy
16. UX Research Evidence
17. Accessibility / A11y
18. Ergonomics
19. Responsive Design
20. Service Design
21. Dashboard Design
22. Data Visualization
23. Privacy UX
24. Security UX
25. Advanced Forms
26. Information Architecture & Permissions
27. Performance
28. Observability
29. Deployment
30. Backup / Restore
31. Documentation
32. Maintainability
33. QC Compliance readiness
34. Company operational readiness

For EACH domain define:
- exact denominator
- exact pass criteria
- evidence required
- current score
- missing requirements
- blockers
- remediation owner
- automated or human/external
- verification command

CRITICAL SCORING RULE

Never assign 100% merely because code exists.

100% requires every defined criterion to have evidence.

Examples:
- automated A11y != complete manual A11y
- deployment config != deployed production
- backup script != verified restore
- E2E != human UAT
- performance contract != production telemetry
- responsive CSS != tested viewport matrix
- role checks != complete authorization matrix verification

Do not round 98% or 99% to 100%.

OUTPUT

Create:
100-PERCENT-BASELINE.md
100-PERCENT-GAP-MATRIX.md
100-PERCENT-EVIDENCE-MATRIX.md

Do NOT implement fixes in this task.

Update .agents/mind/01-mind-latest.md with a concise baseline entry.

No commit.
No push.
No merge.
No deploy.

Stop only when the baseline can be independently reproduced.
```

---

# PROMPT 01 — Architecture + Code Quality → 100%

## Checklist
- [ ] تحليل بنية المشروع
- [ ] إزالة duplication غير المبرر
- [ ] إزالة dead/orphan code
- [ ] مراجعة boundaries
- [ ] إصلاح warnings/hints الفعلية
- [ ] التحقق من clean build
- [ ] توثيق before/after

```text
@GitHub @Superpowers

TASK ID:
QC-100-ARCHITECTURE-002

Use the CURRENT outputs of PROMPT 00.

Mission:

Bring:
- Architecture
- Code Quality
- Maintainability
- Separation of Concerns
- Dependency Boundaries
- Type Safety
- Error Handling

to evidence-backed 100%.

REQUIRED WORK

Audit the complete:
apps/qc-task-manager/

Identify:
- oversized files
- duplicated logic
- duplicated authorization
- duplicated validation
- circular dependencies
- hidden coupling
- unclear module ownership
- dead code
- orphan routes
- unreachable code
- stale imports
- duplicated constants
- magic values
- inconsistent error handling
- unsafe casts
- broad any
- unhandled promises
- side effects in presentation components
- business rules inside UI components
- route logic that belongs in services
- DB logic leaking into pages
- inconsistent API response contracts

Preserve behavior.

Refactor only where evidence justifies it.

Use TDD for behavior-changing fixes.

HARD TARGETS

- typecheck: 0 errors
- typecheck: 0 warnings
- typecheck: 0 actionable hints
- build: clean
- architecture guard: PASS
- zero unexplained dead code
- zero duplicated permission authority
- zero unresolved architectural violations
- zero known Vite import warnings unless formally justified and documented

Do not hide warnings.

Do not suppress errors just to turn tests green.

Update architecture documentation.

Produce:
ARCHITECTURE-100-EVIDENCE.md

End with before/after metrics and actual evidence.
```

---

# PROMPT 02 — Database + Migrations + Data Integrity → 100%

## Checklist
- [ ] Fresh DB init
- [ ] Migration parity
- [ ] Schema parity
- [ ] FK/integrity
- [ ] WAL
- [ ] Backup
- [ ] Restore
- [ ] Restart persistence
- [ ] Index review
- [ ] Evidence report

```text
@GitHub @Superpowers

TASK ID:
QC-100-DATABASE-003

Mission:

Bring Database / Migrations / Integrity / Backup / Restore design to 100%.

Inspect:
- db/
- schema
- all migrations
- embedded migrations
- DB initialization
- DB doctor
- backup
- restore
- SQLite settings
- transaction handling
- foreign keys
- indexes
- uniqueness
- data constraints
- audit data
- retention behavior

MANDATORY VALIDATION

Create isolated fresh databases and test:

1. fresh initialization
2. migration 001 → latest
3. migration checksum parity
4. embedded migration parity
5. schema-reference parity
6. foreign key integrity
7. SQLite integrity check
8. WAL configuration
9. transactional rollback behavior
10. duplicate prevention
11. invalid state prevention
12. downgrade/failure behavior where applicable
13. restart persistence
14. backup creation
15. backup validation
16. restore into clean environment
17. restored DB integrity
18. restored DB FK check
19. restored schema version
20. critical record equality before/after restore

Audit indexing for actual query patterns.

Add missing indexes only with evidence.

Never modify the user's production DB during local verification.

Required automated result:
- migrations: 100%
- parity: 100%
- schema reference: 100%
- integrity: 100%
- foreign keys: 100%
- backup/restore isolated verification: 100%

Generate:
DATABASE-100-EVIDENCE.md

Do not claim live production restore until PROMPT 14 produces real evidence.
```

---

# PROMPT 03 — Security + Auth + RBAC + Privacy UX → 100%

## Checklist
- [ ] Auth audit
- [ ] Session/cookie audit
- [ ] CSRF/XSS/CSP
- [ ] IDOR
- [ ] Role bypass
- [ ] Entity ownership
- [ ] Permission matrix
- [ ] Privacy UX
- [ ] Sensitive action UX
- [ ] Security evidence

```text
@GitHub @Superpowers

TASK ID:
QC-100-SECURITY-004

Mission:

Make every automatable Security, Authentication, Authorization, Privacy, and Permission contract reach 100%.

Canonical authorization source:
src/lib/permissions.ts

No page/API may create a parallel permission truth.

AUDIT ALL ATTACK SURFACES

Inspect:
- login
- sessions
- cookies
- passwords
- password reset
- logout
- CSRF
- XSS
- CSP
- injection
- SQL usage
- IDOR
- privilege escalation
- role bypass
- entity ownership
- horizontal access
- vertical access
- file uploads
- MIME validation
- filename handling
- path traversal
- export endpoints
- reports
- AI endpoints
- admin operations
- backup endpoint
- rate limiting
- request size limits
- Fetch Metadata
- security headers
- error leakage
- stack traces
- secrets
- logs
- audit events

RBAC MATRIX

Test every sensitive operation as:
- anonymous
- employee
- supervisor
- manager
- admin

Test both ALLOWED and DENIED behavior.

Include entity-level authorization.

Verify segregation of duties for:
- tests
- reviews
- approvals
- controlled documents
- CAPA
- findings
- templates
- signatures
- change requests

No user may approve/review their own record where prohibited.

PRIVACY & SECURITY UX

Improve UX for:
- session expiry
- permission denied
- destructive actions
- sensitive exports
- password handling
- confirmation dialogs
- security errors
- access-denied messaging
- privacy-sensitive information
- audit visibility
- elevated actions

Do not leak whether inaccessible records exist.

TARGET

Zero known:
- critical
- high
- medium exploitable authorization defects
- tracked secrets
- insecure cookie settings
- CSP exceptions without justification
- missing CSRF protection on state-changing requests
- permission bypasses

Run all security tests.

Create:
SECURITY-RBAC-PRIVACY-100-EVIDENCE.md

Any external credential requiring human rotation remains an explicit blocker until actual rotation evidence exists.
```

---

# PROMPT 04 — Testing + E2E + CI + Observability + Performance → 100%

## Checklist
- [ ] Test inventory
- [ ] Classify every test script
- [ ] Full canonical suite
- [ ] Full E2E
- [ ] CI reproducibility
- [ ] Observability
- [ ] Local performance budgets
- [ ] No skipped assertions
- [ ] Evidence report

```text
@GitHub @Superpowers

TASK ID:
QC-100-VERIFICATION-005

Mission:

Make the entire automated verification system deterministic, complete, reproducible, and trustworthy.

TESTS

Inventory EVERY:
- unit test
- integration test
- contract test
- database test
- security test
- UI source guard
- E2E test
- performance test
- manual diagnostic

Every script must be classified.

No orphan test scripts.

No test command may silently skip important suites.

REQUIRED EXECUTION

Run:
- manifest guard
- route manifest
- typecheck
- architecture
- database
- migrations
- schema reference
- domain tests
- security
- RBAC
- lab
- reports
- audit integrity
- notifications
- e-signatures
- controlled documents
- responsive
- accessibility automation
- performance
- build
- complete canonical test chain
- complete E2E acceptance

Fix root causes.

Never:
- remove assertions
- weaken expectations
- skip tests
- mark failures ignored
- reduce coverage to obtain PASS

CI

Audit GitHub workflow contracts.

Ensure CI can reproduce:
- install
- typecheck
- build
- tests
- DB verification
- security verification

Do not push.

OBSERVABILITY

Verify:
- structured logging
- request IDs
- error categorization
- sensitive-field redaction
- health endpoint
- readiness behavior
- startup errors
- DB errors
- security events
- audit events

PERFORMANCE

Establish measurable local performance budgets.

Test representative:
- dashboard
- reports
- large tables
- search
- lab tests
- exports
- forms

Find actual bottlenecks before optimizing.

Target zero known local performance budget failures.

Generate:
AUTOMATED-VERIFICATION-100-EVIDENCE.md

Production p95 / real-user CWV remain external evidence until PROMPT 14.
```

---

# PROMPT 05 — Design System → 100%

## Checklist
- [ ] Token audit
- [ ] Typography scale
- [ ] Spacing/radius/shadow tokens
- [ ] Semantic colors
- [ ] Button normalization
- [ ] Form controls normalization
- [ ] Modal/table/card normalization
- [ ] Interactive state consistency
- [ ] Automated design-system guards
- [ ] Evidence report

```text
@GitHub @Superpowers

TASK ID:
QC-100-DESIGN-SYSTEM-006

Act as a Staff Product Designer + Design Systems Engineer.

Mission:

Transform QC Task Manager into one coherent enterprise-grade design system without changing its product identity or business behavior.

Do NOT redesign randomly page-by-page.

First create a canonical system.

AUDIT

Inspect every:
- page
- component
- card
- panel
- modal
- drawer
- table
- form
- button
- badge
- empty state
- notification
- header
- nav
- chart
- dropdown
- tooltip

Detect every visual inconsistency.

CANONICAL TOKENS

Create/normalize tokens for:
- typography
- font scale
- line height
- font weight
- spacing
- radius
- borders
- shadows
- elevation
- surfaces
- overlays
- glass/translucency
- icon sizes
- container widths
- breakpoints
- motion durations
- easing
- focus rings
- semantic status colors

Define semantic roles:
- default
- primary
- secondary
- success
- warning
- danger
- info
- neutral
- disabled

COMPONENTS

Normalize reusable primitives:
- Button
- IconButton
- Input
- Textarea
- Select
- Checkbox
- Radio
- Switch
- Date control
- Search input
- Form field
- Badge
- Alert
- Banner
- Tooltip
- Card
- Data card
- Modal
- Dialog
- Dropdown
- Tabs
- Table
- Pagination
- Breadcrumb
- Empty state
- Skeleton
- Toast
- PageHeader
- SectionHeader

Remove one-off design variants unless they have a real semantic purpose.

VERIFICATION

Create automated consistency guards where practical.

Target:
- 100% semantic token usage
- 100% standardized interactive controls
- zero unexplained visual primitive duplication
- zero inaccessible color tokens
- zero conflicting component patterns

Generate:
DESIGN-SYSTEM-100-EVIDENCE.md
```

---

# PROMPT 06 — Visual Design + UI → 100%

## Checklist
- [ ] Review every page
- [ ] Improve hierarchy
- [ ] Improve typography
- [ ] Improve readable surfaces
- [ ] Improve tables/cards
- [ ] Preserve background identity
- [ ] Test all viewport widths
- [ ] Eliminate overflow/clipping
- [ ] Evidence by route

```text
@GitHub @Superpowers

TASK ID:
QC-100-UI-VISUAL-007

Act as a Principal UI Designer and Senior Frontend Engineer.

Mission:

Improve EVERY QC Task Manager page to a polished enterprise quality level.

Preserve:
- global background identity
- existing functionality
- data
- routes
- permissions
- workflows

Improve:

VISUAL HIERARCHY

Every page must have obvious:
1. page identity
2. primary task
3. important status/KPI
4. secondary actions
5. supporting information

Fix:
- weak hierarchy
- flat sections
- excessive borders
- low contrast surfaces
- unclear grouping
- inconsistent whitespace
- inconsistent page widths
- oversized/undersized headings
- dense tables
- noisy cards

TYPOGRAPHY

Optimize:
- heading hierarchy
- paragraph measure
- table typography
- label clarity
- metadata
- numbers
- timestamps
- status text

SURFACES

Use readable translucent/solid surfaces over the existing background.

Content must remain readable under all background regions.

Avoid decorative effects that reduce clarity.

RESPONSIVE UI

Verify:
320
360
375
390
430
768
1024
1280
1440
1920

No:
- horizontal overflow
- clipped content
- inaccessible actions
- unusable tables
- broken dialogs
- overlapping text
- tiny tap targets

Create:
UI-VISUAL-100-EVIDENCE.md

Include route coverage proving every page was reviewed.
```

---

# PROMPT 07 — UX + Information Architecture + Service Design → 100%

## Checklist
- [ ] Role-based journeys
- [ ] Navigation audit
- [ ] Breadcrumbs
- [ ] Route grouping
- [ ] Feature discoverability
- [ ] End-to-end service journeys
- [ ] Remove dead ends
- [ ] Reduce context switching
- [ ] Document journey maps

```text
@GitHub @Superpowers

TASK ID:
QC-100-UX-IA-008

Act as a Principal UX Architect specializing in internal enterprise/QC systems.

Audit the whole product from the perspective of:
- employee
- supervisor
- manager
- admin

Do not organize navigation around code structure.

Organize around user mental models and jobs-to-be-done.

INFORMATION ARCHITECTURE

Audit:
- global navigation
- lab secondary navigation
- breadcrumbs
- page titles
- grouping
- route hierarchy
- feature discoverability
- cross-links
- dashboard entry points
- search
- reports
- notifications
- settings
- admin areas

Reduce cognitive load.

Users should know:
- Where am I?
- What can I do?
- What needs attention?
- What happens next?
- How do I go back?
- Why can/can't I perform an action?

SERVICE DESIGN

Map critical end-to-end journeys:
- task creation → assignment → work → review → completion
- finding → RCA → CAPA → approval → closure
- lab test → submit → review → approve
- equipment → maintenance → calibration
- SOP/WI → revision → approval → acknowledgement
- change request → review → apply
- notification → action → resolution

Remove:
- unnecessary transitions
- duplicate entry
- dead ends
- unclear ownership
- unnecessary context switching

Generate user journey maps in documentation.

Target:
- zero orphan destinations
- zero dead-end journeys
- zero unexplained duplicated workflows
- complete route/navigation traceability

Create:
UX-IA-SERVICE-DESIGN-100-EVIDENCE.md
```

---

# PROMPT 08 — Interaction Design + Motion & Digital Art → 100%

## Checklist
- [ ] Interaction states
- [ ] Motion tokens
- [ ] Loading states
- [ ] Feedback states
- [ ] Status-change animation
- [ ] Reduced motion
- [ ] No distracting motion
- [ ] No inaccessible movement

```text
@GitHub @Superpowers

TASK ID:
QC-100-INTERACTION-MOTION-009

Act as a Senior Interaction Designer and Motion Systems Designer.

Mission:

Make the system feel responsive, premium, and intentional without becoming distracting.

This is an enterprise QC system, not an entertainment website.

INTERACTION STATES

Every interactive component must support appropriate:
- default
- hover
- focus
- active
- selected
- loading
- success
- error
- disabled
- destructive
- pending

No silent interaction.

MOTION SYSTEM

Create consistent durations and easing tokens.

Use motion for:
- navigation transitions
- expand/collapse
- dialogs
- dropdowns
- toast entry/exit
- loading
- button feedback
- status change
- progress updates
- chart transitions
- skeletons

Motion should communicate:
- hierarchy
- causality
- completion
- state change

Avoid:
- gratuitous movement
- long animation
- parallax that harms usability
- motion behind dense data
- GPU-heavy effects

REDUCED MOTION

Fully support:
prefers-reduced-motion

Essential content must never depend on animation.

Target:
- 100% interactive feedback coverage
- 100% reduced-motion compatibility
- zero inaccessible motion
- zero interaction without a perceivable result

Create:
INTERACTION-MOTION-100-EVIDENCE.md
```

---

# PROMPT 09 — UX Writing + Microcopy + UX Research → 100%

## Checklist
- [ ] Audit all visible strings
- [ ] Buttons/labels
- [ ] Error messages
- [ ] Empty states
- [ ] Permission messages
- [ ] Destructive action copy
- [ ] UX research plan
- [ ] No fake research claims

```text
@GitHub @Superpowers

TASK ID:
QC-100-CONTENT-UX-010

Act as a Senior UX Writer + Enterprise UX Researcher.

Audit every visible string.

Improve:
- page headings
- descriptions
- button labels
- form labels
- helper text
- placeholders
- tooltips
- validation
- warnings
- confirmation dialogs
- empty states
- permission errors
- success messages
- failure messages
- destructive action language

Rules:

Use plain professional English appropriate for QC staff.

Prefer:
Create task

over vague:
Submit

Prefer precise:
Archive equipment

over:
Continue

Never use technical implementation terminology in user-facing text.

ERROR CONTENT

Every error should explain:
1. what happened
2. what the user can do
3. whether data was saved
4. whether retry is safe

UX RESEARCH

Do not fabricate user research.

Instead:

Create:
docs/PILOT-UX-RESEARCH.md

containing:
- research goals
- role-based participant plan
- scenarios
- observation sheet
- task success criteria
- time-on-task
- assistance count
- error count
- confusion points
- SUS-style questionnaire
- qualitative questions

Use existing analytics/test evidence only where legitimately applicable.

Automatable content quality must reach 100%.

Actual human research remains incomplete until participants perform it.

Create:
UX-WRITING-RESEARCH-EVIDENCE.md
```

---

# PROMPT 10 — Accessibility Design + Ergonomics → 100%

## Checklist
- [ ] WCAG 2.2 AA
- [ ] Keyboard
- [ ] Focus
- [ ] Labels
- [ ] ARIA
- [ ] Tables/charts
- [ ] Contrast
- [ ] Reduced motion
- [ ] Zoom matrix
- [ ] VoiceOver/NVDA manual plan
- [ ] Ergonomics

```text
@GitHub @Superpowers

TASK ID:
QC-100-A11Y-011

Act as a WCAG-focused Accessibility Engineer and Ergonomic UX Designer.

Target:
WCAG 2.2 AA minimum across the full application.

Audit every route/component for:
- semantic HTML
- headings
- landmarks
- labels
- descriptions
- keyboard navigation
- focus order
- focus visibility
- skip navigation
- dialog focus trapping
- escape handling
- error association
- aria relationships
- accessible names
- table semantics
- chart alternatives
- status announcements
- live regions
- color contrast
- non-color indicators
- touch target size
- zoom
- text resizing
- reduced motion

ERGONOMICS

Optimize for employees who may use this system repeatedly for long shifts.

Reduce:
- unnecessary clicks
- excessive pointer travel
- repetitive entry
- excessive scrolling
- dense controls
- tiny targets
- frequent context switching

Support:
- keyboard workflows
- logical tab sequence
- reasonable defaults
- persistent context
- clear grouping

TEST MATRIX

Automate where possible:

320–1920 widths

100%
150%
200%
400% zoom where practical

Test keyboard-only journeys.

Prepare explicit manual test sheets for:
- VoiceOver
- NVDA

Do NOT claim manual screen-reader validation unless actually performed.

Create:
A11Y-ERGONOMICS-100-EVIDENCE.md

Automated A11y target = 100%.

Full A11y score may reach 100 only after recorded manual assistive-technology evidence.
```

---

# PROMPT 11 — Dashboard + Data Visualization → 100%

## Checklist
- [ ] KPI usefulness
- [ ] Time periods
- [ ] Comparisons
- [ ] Trends
- [ ] Drilldowns
- [ ] Legends/axes
- [ ] Accessible chart alternatives
- [ ] Remove misleading charts
- [ ] QC priorities surfaced

```text
@GitHub @Superpowers

TASK ID:
QC-100-DATA-VIZ-012

Act as a Principal Analytics Product Designer.

Audit every:
- dashboard
- KPI
- chart
- report
- drilldown
- analytical table

The dashboard must support decisions, not decorate the application.

FOR EVERY KPI ANSWER

- What question does this metric answer?
- Who needs it?
- What action should it trigger?
- What comparison/context is required?
- What time period applies?
- What does good/bad mean?

Remove vanity metrics.

IMPROVE

- KPI hierarchy
- trend indicators
- units
- time ranges
- comparison periods
- filters
- drilldowns
- legends
- axis labels
- tooltip clarity
- empty states
- zero states
- loading states

Avoid:
- unnecessary pie charts
- 3D charts
- rainbow palettes
- visual clutter
- misleading scales
- truncated axes without justification

ACCESSIBILITY

All visualization information must also be available through:
- accessible text summaries
or
- accessible tabular representations

Never rely only on color.

QC-SPECIFIC INFORMATION PRIORITY

Surface actionable insights around:
- overdue tasks
- completion
- rejects
- failure trends
- CAPA
- repeat failures
- calibration status
- maintenance
- document acknowledgements
- workload
- review queues

Target:
- zero misleading visualization
- zero unlabeled metrics
- zero inaccessible charts
- zero meaningless metrics

Create:
DASHBOARD-DATA-VIZ-100-EVIDENCE.md
```

---

# PROMPT 12 — Advanced Form Design → 100%

## Checklist
- [ ] All forms inventoried
- [ ] Logical grouping
- [ ] Required/optional clarity
- [ ] Defaults/autofill where safe
- [ ] Validation
- [ ] Pending/success/error
- [ ] Unsaved changes
- [ ] Duplicate-submit protection
- [ ] Mobile input modes
- [ ] No data loss

```text
@GitHub @Superpowers

TASK ID:
QC-100-FORMS-013

Act as an Enterprise Form UX Specialist.

Audit EVERY form.

Include:
- task
- findings
- RCA
- CAPA
- lab test
- product
- template
- equipment
- maintenance
- calibration
- controlled document
- acknowledgement
- retest
- change request
- user management
- settings
- filters
- search

IMPROVE

STRUCTURE

Group fields by user intent rather than database schema.

Use:
- sections
- progressive disclosure
- conditional fields
- clear required/optional indication

PRODUCTIVITY

Where safe:
- defaults
- remembered selections
- autofill
- lookup
- search
- keyboard navigation
- date helpers
- numeric input protection

VALIDATION

Validation must be:
- field-specific
- immediate where useful
- server-authoritative
- human-readable
- non-destructive

Never clear valid entered data after an error.

SUBMISSION

Every submission must have:
- visible pending state
- duplicate-submit protection
- success result
- error recovery
- unsaved change protection where appropriate

DESTRUCTIVE OPERATIONS

Require contextual confirmation.

Avoid confirmation fatigue for low-risk actions.

MOBILE

No tiny controls.

Correct keyboard/inputmode for field type.

TARGET

- 100% field label coverage
- 100% validation clarity
- 100% submission feedback
- 100% keyboard usability
- zero known data-loss form flows
- zero ambiguous required fields

Create:
ADVANCED-FORMS-100-EVIDENCE.md
```

---

# PROMPT 13 — Information Architecture & Permissions → 100%

## Checklist
- [ ] Role × route matrix
- [ ] Role × action matrix
- [ ] Visible navigation alignment
- [ ] Deep-link checks
- [ ] Server/UI parity
- [ ] No information leakage
- [ ] No predictable 403 controls
- [ ] Evidence report

```text
@GitHub @Superpowers

TASK ID:
QC-100-PERMISSION-IA-014

Act as a Security UX Architect.

Mission:

Align what users SEE with what users can actually DO.

Canonical security authority remains:
src/lib/permissions.ts

Never replace server-side authorization with UI hiding.

BUILD A COMPLETE MATRIX

For:
- employee
- supervisor
- manager
- admin

Map:
- visible navigation
- visible pages
- visible actions
- allowed operations
- denied operations
- approval authority
- ownership restrictions
- sensitive data visibility

Every server permission must have an intentional UI representation.

RULES

If user cannot perform an action:

Either:
- hide it when irrelevant

or:
- disable/explain it when discovering the capability is useful

Never show clickable controls that will predictably produce a 403 unless the workflow explicitly requires it.

Do not leak hidden capabilities or record existence.

Audit deep links.

A user must not gain access by manually entering URLs.

Test all role × route × action combinations.

Generate:
PERMISSION-IA-100-EVIDENCE.md

Target:
- 100% route authorization mapping
- 100% action authorization mapping
- 100% UI/server permission alignment
- zero authorization UX contradictions
```

---

# PROMPT 14 — Real UAT + Production Operations Closure

## Checklist
- [ ] Staging deployment
- [ ] Exact commit recorded
- [ ] Role-based Human UAT
- [ ] Keyboard/responsive/zoom observations
- [ ] Backup
- [ ] Restore drill
- [ ] Integrity/FK checks
- [ ] Production telemetry
- [ ] Credential rotation evidence
- [ ] Operational evidence report

```text
@GitHub @Superpowers

TASK ID:
QC-100-OPERATIONS-015

This is the HUMAN / OPERATOR closure phase.

Do not fabricate evidence.

The goal is to close the remaining items that code alone cannot honestly validate.

STAGE 1 — STAGING

Deploy the exact audited build to a staging environment using the documented deployment process.

Record:
- commit SHA
- build identifier
- environment
- database path
- persistent storage
- health
- readiness
- migration version

STAGE 2 — HUMAN UAT

Execute role-based UAT with real QC users:
- Employee
- Supervisor
- Manager
- Admin

Each role must perform representative workflows.

Capture:
- task success
- task failure
- time on task
- confusion
- assistance required
- navigation errors
- data-entry errors
- recovery behavior
- user comments

Include:
- keyboard-only
- responsive
- zoom
- accessibility observations

Do not convert automated E2E into UAT evidence.

STAGE 3 — BACKUP & RESTORE

With operator approval:
- generate staging/live-safe backup
- validate artifact
- restore into isolated recovery environment
- compare schema version
- compare critical row counts
- run integrity check
- run foreign key check
- restart restored environment
- run smoke test

Do not destroy production data.

STAGE 4 — PRODUCTION TELEMETRY

Collect actual:
- health
- readiness
- error rate
- response latency
- p50
- p95
- p99 where available
- memory
- CPU
- DB behavior

For browser-facing performance gather where practical:
- LCP
- CLS
- INP

STAGE 5 — SECURITY CLOSURE

Verify all previously exposed credentials have actually been revoked/rotated by the owner.

Do not record secret values.

Produce:
OPERATIONAL-100-EVIDENCE.md

Only verified human/operator evidence may close these rows.
```

---

# PROMPT 15 — Final Independent 100% Verification

## Checklist
- [ ] Re-freeze current reality
- [ ] Ignore previous PASS claims
- [ ] Re-run all automated gates
- [ ] Re-verify human evidence
- [ ] Re-score all 34 domains
- [ ] No rounding
- [ ] Final findings P0-P3
- [ ] Claims vs Reality
- [ ] Final verdict
- [ ] Update mind

```text
@GitHub @Superpowers

TASK ID:
QC-FINAL-100-016

PRIORITY:
ABSOLUTE FINAL INDEPENDENT VERIFICATION

Ignore every earlier percentage and completion claim.

Do not trust PROMPT 01–14 outputs merely because they say PASS.

Verify them.

Freeze current reality again.

RE-RUN COMPLETE SYSTEM VALIDATION

Recalculate:
- tracked files
- routes
- APIs
- middleware
- guards
- migrations
- tables
- schema objects
- tests
- E2E
- docs
- skills

Run fresh:
- typecheck
- build
- architecture
- route manifest
- test manifest
- migrations
- embedded migration parity
- schema reference
- database integrity
- foreign keys
- domain tests
- security
- authentication
- RBAC
- request security
- lab security
- audit integrity
- reports
- exports
- documents
- e-signatures
- notifications
- responsive
- accessibility automation
- UI consistency
- interaction feedback
- UX writing
- performance
- complete unit/integration aggregate
- complete E2E acceptance

Verify manual evidence for:
- human UAT
- screen reader
- production deployment
- production/staging restore
- credential rotation
- production telemetry

RE-SCORE ALL DOMAINS

1. Architecture
2. Database / migrations
3. Security
4. Authentication
5. RBAC
6. Functional workflows
7. Testing
8. UI
9. UX
10. Visual Design
11. Design System
12. Information Architecture
13. Interaction Design
14. Motion & Digital Art
15. UX Writing
16. UX Research
17. Accessibility
18. Ergonomics
19. Responsive
20. Service Design
21. Dashboard Design
22. Data Visualization
23. Privacy UX
24. Security UX
25. Advanced Forms
26. Permissions IA
27. Performance
28. Observability
29. Deployment
30. Backup / Restore
31. Documentation
32. Maintainability
33. QC Compliance readiness
34. Company operational readiness

ABSOLUTE SCORING RULE

For a domain to receive 100%:

EVERY denominator item must be proven.

No rounding.
No optimistic interpretation.
No partial evidence.
No stale evidence.
No "implemented therefore verified."

If:
99/100 criteria pass

the score is:
99%

not 100%.

If external/manual evidence is missing, state exactly what blocks 100%.

FINAL REPORT

Create:
audit/qc/QC-Task-Manager/FINAL-100-PERCENT-SYSTEM-REPORT.md

It must contain:

Executive Summary

Frozen Baseline

Complete Scoreboard

| Domain | Before | Final | Evidence | Remaining |
|---|---:|---:|---|---|

Test Summary

E2E Summary

Database Evidence

Security Evidence

RBAC Evidence

UX Evidence

UI Evidence

Design System Evidence

Accessibility Evidence

Responsive Evidence

Performance Evidence

UAT Evidence

Production Evidence

Backup/Restore Evidence

Findings

P0
P1
P2
P3

Claims vs Reality

Evidence Ledger

Final Verdict

The only valid verdicts:

100% VERIFIED — FULL GO

CONDITIONAL GO

NO-GO

You may output:

100% VERIFIED — FULL GO

ONLY when every one of the 34 domains is independently supported by complete current evidence.

Anything less must retain its actual percentage.

Finally update:
.agents/mind/01-mind-latest.md

with:
- what changed
- what passed
- what remains
- exact final percentages
- evidence paths
- exact HEAD

Do not commit.
Do not push.
Do not merge.
Do not publish.
Do not deploy unless the operator explicitly authorized the deployment phase.

Evidence before assertion.
Reality before documentation.
No fake 100%.
```

---

# Final Closure Checklist

## Technical Closure
- [ ] Architecture = 100%
- [ ] Database / migrations = 100%
- [ ] Security = 100%
- [ ] Authentication = 100%
- [ ] RBAC = 100%
- [ ] Functional workflows = 100%
- [ ] Testing = 100%
- [ ] Performance automated contracts = 100%
- [ ] Observability = 100%
- [ ] Maintainability = 100%

## Product Design Closure
- [ ] UI = 100%
- [ ] UX = 100%
- [ ] Visual Design = 100%
- [ ] Design System = 100%
- [ ] Information Architecture = 100%
- [ ] Interaction Design = 100%
- [ ] Motion & Digital Art = 100%
- [ ] UX Writing / Microcopy = 100%
- [ ] Advanced Forms = 100%
- [ ] Dashboard Design = 100%
- [ ] Data Visualization = 100%
- [ ] Privacy UX = 100%
- [ ] Security UX = 100%
- [ ] Permissions IA = 100%

## Accessibility & Human Validation
- [ ] Automated A11y = 100%
- [ ] Keyboard validation completed
- [ ] Zoom matrix completed
- [ ] VoiceOver validation completed
- [ ] NVDA validation completed where applicable
- [ ] Ergonomics review completed
- [ ] Human UX Research completed
- [ ] Human UAT completed for all roles

## Operations Closure
- [ ] Staging deployment validated
- [ ] Production deployment validated
- [ ] Health/readiness validated
- [ ] Backup generated
- [ ] Restore drill validated
- [ ] Restart persistence validated
- [ ] p50/p95/p99 measured
- [ ] LCP/CLS/INP measured where applicable
- [ ] Credential rotation verified
- [ ] Final independent audit completed

## Final Verdict
- [ ] `100% VERIFIED — FULL GO`
- [ ] `CONDITIONAL GO`
- [ ] `NO-GO`

> لا تحدد `100% VERIFIED — FULL GO` إلا بعد تحقق جميع البنود أعلاه بأدلة حديثة.

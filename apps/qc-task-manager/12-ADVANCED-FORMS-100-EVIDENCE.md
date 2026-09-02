# QC-100-FORMS-013 — Advanced Forms Evidence

**Scope:** Enterprise Form UX audit of every user-input surface in `apps/qc-task-manager`.
**Audit date:** 2026-09-02
**Auditor:** Enterprise Form UX Specialist
**Evidence basis:** source inventory, server schemas, existing form-productivity contract, and existing automated test contracts. No human UAT, VoiceOver/NVDA session, or production telemetry was available during this audit.

## Executive result

The form estate is broad and functionally mature, but it does **not** currently prove the requested 100% targets. The strongest implementation is `LabTestForm`; the shared native-form contract covers six major create/edit forms. Search, filters, settings, user management, acknowledgement assignment, change requests, destructive archive/delete actions, and several embedded forms remain outside or only partly inside that contract.

| Target | Current evidence | Status | Required closure |
|---|---|---:|---|
| 100% persistent field labels | Many explicit labels; nested-label and icon/hidden-control cases remain | Partial | Automated label/association inventory plus manual screen-reader pass |
| 100% validation clarity | Server Zod schemas are centralized, but some client messages are generic/native and not always field-associated | Partial | Map every schema issue to field + recovery copy |
| 100% submission feedback | `data-qc-form` and `LabTestForm` provide feedback; GET/search/filter and small POST forms do not share it | Partial | Shared mutation state for every POST/action form |
| 100% keyboard usability | Global focus contracts and E2E coverage exist; full form-by-form keyboard evidence is absent | Partial | Keyboard matrix for all 51 source files and dialogs |
| Zero known data-loss flows | Unsaved protection exists on `data-qc-form`; non-contract forms can navigate/submit without the same guard | Fail | Apply one dirty-state/submit contract to every mutable form |
| Zero ambiguous required fields | Required markers are inconsistent; optional text is often visible, but some schemas require fields without equivalent UI copy | Partial | Canonical required/optional vocabulary and schema/UI parity check |

## Inventory and user-intent structure

The audit found **51 source files containing `<form`**. The inventory below groups them by the user’s intent rather than database tables.

| User intent | Included surfaces | Current evidence | Main risk |
|---|---|---|---|
| Create or update work | Task create, task update, checklist, dependencies, comments, attachments, lifecycle | `NewTaskForm`, `TaskUpdatePanel`, `TaskLifecycle`, `CommentBox`, `AttachmentUploader` | Long form and multiple save/submit semantics can be confused |
| Record a quality finding and response | Findings, RCA, CAPA, evidence | `/findings`, task detail panels, `rcaSchema`, `capaSchema`, `evidenceSchema` | RCA/CAPA fields are domain-shaped rather than intent-stepped |
| Run and review laboratory work | Lab test, review, void, retest | `LabTestForm`, test review, retest create | High consequence; needs review, preserved measurements, and recovery |
| Maintain laboratory master data | Product, template, equipment, maintenance, calibration | Shared lab form components and maintenance page | Lookup/conditional fields and archive confirmations are inconsistent |
| Control documents and acknowledgement | Controlled document, versions, acknowledgement assignment | `LabDocumentEditor`, document version forms, acknowledgement assign | Immutable/approved state needs stronger contextual confirmation |
| Request and approve changes | Change request create/review/withdraw | `/lab/change-requests/new`, detail review forms | One broad form exposes irrelevant fields for four entity types |
| Manage people and access | User create/edit/reset, account password/security | Admin users and account security | Security-sensitive; password, role, and active-state feedback must be explicit |
| Configure the product | Admin settings, saved views | Admin settings, `LabSaveViewForm`, saved-view delete | Settings need grouped intent and safe defaults; delete needs contextual confirmation |
| Find and narrow records | Search, lab search, dashboard/report filters, saved filters | `/search`, `/lab/search`, report/dashboard GET forms | No common pending/error/keyboard/clear-state contract |

### Required target structure

Every mutable form should use a consistent single-column, intent-first structure:

1. **What are you trying to do?** — record identity or selection.
2. **What happened / what should happen?** — observation, result, or requested change.
3. **What controls the outcome?** — owner, dates, risk, references, or attachments.
4. **Review and submit** — consequence summary, validation summary, and one primary action.

Database-only fields should be hidden behind progressive disclosure or conditionally shown. Entity-specific fields must not appear until the entity type and operation are selected.

## Findings, RCA, CAPA, lab test, and task workflows

### F-001 — Task creation mixes planning, recurrence, quality metadata, checklist, and dependencies

**Evidence:** `src/components/NewTaskForm.astro:52-208` has template selection, title/description, department/priority, assignment/due date, recurrence, quality details, checklist, and dependencies in one continuous form.

**Finding:** The form has useful field labels and a quality `<fieldset>`, but user intent is not fully staged. `Department`, `Priority`, `Assign to`, `Due date`, and recurrence are planning decisions; inspection metadata and evidence requirements are a separate QC intent.

**RCA:** The form grew by appending domain fields to the create flow. The database/schema shape is visible in the UI instead of a task-creation decision sequence.

**CAPA:**

- P0: Split into `Task basics`, `Planning`, and optional `Quality context`; keep `Checklist` and `Dependencies` collapsed until requested.
- P1: When a template is selected, show a compact “will copy / will override” summary and mark only overrideable fields editable.
- P1: Make recurrence end date appear only when recurrence is not `none`; validate end date against due date server-side and inline.
- P2: Add lookup/search for assignees and dependencies once lists exceed a practical scan limit.

### F-002 — Findings/RCA/CAPA lack a consistent review boundary

**Evidence:** server schemas exist for `findingCreateSchema`, `rcaSchema`, `capaSchema`, and `evidenceSchema` in `src/lib/validation.ts`; task detail contains multiple mutation surfaces in `TaskUpdatePanel` and lifecycle controls.

**Finding:** The server boundary is authoritative, but the user-facing journey is not consistently grouped as `describe finding → explain cause → define action → attach proof → verify effectiveness`.

**RCA:** RCA and CAPA were implemented as separate operational records and controls rather than one staged response journey.

**CAPA:**

- P0: Add a visible step/section sequence and a review summary before approval/closure.
- P0: Associate every server issue with the exact field and preserve all valid entries after a failed save.
- P1: Show CAPA due date, owner, evidence, and effectiveness check only when the selected finding classification/risk requires them.
- P1: Require a meaningful reason for reject/return actions and place it beside the action, not only in a remote banner.

### F-003 — Lab test is the reference implementation, not yet estate-wide standard

**Evidence:** `LabTestForm.tsx:227-247` tracks dirty/submitting/save state; the existing form productivity test verifies review confirmation, explicit save states, and section statuses.

**Finding:** This form already has progressive sections, duplicate/paste recovery, explicit review, and preserved measurements. It should be promoted as the canonical contract for high-consequence forms.

**RCA:** The lab test received a dedicated UX workstream; other forms still use native POST or smaller local patterns.

**CAPA:**

- P0: Extract the behavioral contract, not the visual markup: dirty state, pending lock, error summary, focus return, success result, and safe retry.
- P1: Add a test matrix for draft, continue, submit, failed save, expired session, duplicate submit, and browser back/navigation.
- P1: Keep “measurements are re-taken, never copied” visible in retest and review contexts.

## Master-data and laboratory forms

| Form | Finding | RCA | CAPA |
|---|---|---|---|
| **Product** — `LabProductForm.astro` | Labels and sections are present, but related equipment is a checkbox list and SOP/WI/template choices are long selects; active/archive behavior is separate from the edit intent. | Master-data references are rendered as direct foreign-key controls. | Use searchable lookup with selected-item summaries; show `Activation` as a deliberate status section; contextual confirmation for archive/restore; preserve selections on server errors. |
| **Template** — `LabTemplateForm.astro`, admin template new/edit | Template identity, test configuration, parameters, references, equipment and checklist rules are all exposed together. Free-text JSON fields (`checklist_text`, `finding_defaults_json`) are error-prone. | Versioning and runtime defaults are represented directly as form fields. | Progressive disclosure by `test type`; replace raw JSON entry with structured repeaters or an advanced disclosure with syntax/format help; show immutable identity and version impact before save. |
| **Equipment** — `LabEquipmentForm.astro` | Strongest native grouping: identity, status/calibration, notes. `Status` is free text and archive is a second POST form without the shared productivity contract. | Company-specific verbatim status values were preserved for data compatibility. | Keep verbatim storage server-side but offer controlled suggestions/lookup; add `data-qc-form` to archive/restore or use a contextual confirmation dialog; label calibration as “registry flag” plus link to dated records. |
| **Maintenance** — `/lab/equipment/[id]/maintenance.astro` | Maintenance is a consequential record but is not visibly covered by the six-form productivity inventory. | It was implemented as a route-specific form. | Add equipment context, maintenance intent, date, provider, outcome, next action, attachment/evidence, and review state; use date helper and numeric protection where applicable; test pending/retry/duplicate submit. |
| **Calibration** — `LabCalibrationForm.astro` | Clear required equipment and optional-date copy; “dates are YYYY-MM-DD” is useful. Date relationships are not visibly enforced in the source component. | Schema deliberately allows incomplete calibration data. | Keep incomplete drafts valid, but validate chronology and explain precedence (`next_due_at` vs due date) inline; use date controls with min/max where safe and contextual confirmation for non-compliant/archived equipment. |
| **Controlled document** — `LabDocumentEditor.astro`, document versions | The approved-version immutability rule is explained and change summary becomes required when revising approved content. | Document governance rules are embedded in editor copy and server logic. | Split metadata/content/change rationale; show version diff or summary before submit; require contextual confirmation when creating a new controlled version; preserve draft after rejection. |
| **Acknowledgement** — `/lab/acknowledgements/assign.astro` | Multi-select employee assignment uses checkboxes, but the primary intent (which document/version, who must acknowledge, deadline) should be stated before the recipient list. | Assignment is modeled around repeated `user_ids` FormData entries. | Add selected-count summary, search/filter recipients, select-all/clear-all with confirmation only when it changes many records, and success result listing count/version. |
| **Retest** — `/lab/retests/new.astro` | Good explanatory boundary: original test is preserved and reason is required. The reason note is not conditionally required for `OTHER` in the visible form. | Retest reason enum and note are separate schema fields. | Make note required for `OTHER` and any reason needing explanation; show original test summary, carried context, and fields that will be re-entered; add review confirmation and safe retry. |
| **Change request** — `/lab/change-requests/new.astro` and review | One form exposes Equipment/Product/Calibration/Retest fields simultaneously, including raw IDs and irrelevant inputs. This is the clearest database-shaped form in the estate. | A single payload supports four entity types and two operations. | P0: conditionally render a dedicated intent form after `Entity` + `Operation`; use lookups instead of raw IDs; show a change summary and approval route. P1: review form must show exact before/after values and require meaningful rejection note. |

## User management, settings, filters, and search

### User management

**Evidence:** `src/pages/admin/users/index.astro:56-107` has create-user fields; `src/lib/validation.ts` has `userCreateSchema`, `userEditSchema`, `passwordResetSchema`; account security uses `passwordChangeSchema`.

**Findings:** Labels and password autocomplete are present. `Username` and `Full name` use `autocomplete="off"`, preventing safe browser autofill for identity data. Role, department, task-creation capability, and active state are security-impacting choices but are not grouped by access intent. User edit/reset forms are route/table actions rather than a unified user-management journey.

**RCA:** The UI follows the users table and API action names, while the user’s intent is `identity → access → account state → credentials`.

**CAPA:**

- P0: Group create/edit into `Identity`, `Access`, and `Account status`; explain role impact and employee-only task creation before submission.
- P0: Add visible pending, success, and recovery feedback to create/edit/reset/deactivate actions.
- P1: Use safe autocomplete tokens (`username`, `name`) where appropriate; never autocomplete passwords from another account.
- P1: Require contextual confirmation for deactivation/reset, with target username and consequence; no generic confirmation fatigue for ordinary edits.

### Settings and account security

**Finding:** Settings and password forms are security-sensitive mutation surfaces but are not guaranteed by the shared `data-qc-form` contract. Password change has server-authoritative matching and minimum-length validation, but the UI must visibly preserve entered values and identify the exact field on failure.

**CAPA:** Add `Current password`, `New password`, `Confirm new password` sections with requirement help, show/hide controls with accessible names, pending lock, success state, and safe retry. For admin settings, group by `Defaults`, `Notifications`, `Retention/operations`, and `Security`; include a change summary for high-impact settings.

### Filters

**Evidence:** `/search` contains a GET filter form plus saved-filter POST forms; it includes status, priority, department, assignee, creator, recurrence, multiple date ranges, result count, and checkboxes (`src/pages/search.astro:101-237`). Lab pages repeat filter toolbars.

**Findings:** Labels are generally present, but the filter surface is dense and uses small text controls. It lacks one shared pending state, “filters applied” summary, date-range validation copy, and a predictable keyboard path to clear/reset. Saved-filter delete is a destructive POST action and should be contextual rather than an unlabeled table action.

**RCA:** Search filters were added incrementally per query parameter, so the UI mirrors query schema.

**CAPA:**

- P0: Group into `What`, `Who`, `When`, and `Quality/risk`; hide advanced filters behind disclosure.
- P0: Add `Apply filters`, `Clear all`, result count, and applied-filter chips with keyboard-accessible removal.
- P1: Validate `from ≤ to` per date pair and preserve all filters after errors.
- P1: Confirm only saved-filter deletion, naming the filter; do not confirm applying/clearing low-risk filters.

### Search

**Finding:** Search is functionally available, but GET forms are outside the mutation productivity helper and therefore have no common pending/duplicate-submit/success/error contract. Search suggestion/lookup controls need a standard keyboard interaction and announcement contract.

**CAPA:** Use a persistent labeled search input with correct `type="search"`, `inputmode="search"` where supported, autocomplete suggestions with arrow-key selection, Escape to dismiss, and a live result-count update. Keep the query and filters in the URL and restore them after server errors.

## Cross-cutting validation and submission audit

### What is already good

- Server schemas are centralized in `src/lib/validation.ts`; `parseFormData()` is the authoritative boundary.
- Native constraints (`required`, `maxlength`, `minlength`, `pattern`, `type=date`) prevent many avoidable submissions.
- `form-productivity.js` preserves values, marks invalid controls, focuses an error summary, prevents duplicate submission, disables submit buttons, and installs unsaved-change protection for `data-qc-form`.
- Existing copy explicitly protects important data: approved document versions, original lab tests, and calibration audit history.

### Systemic gaps

1. **Helper mismatch:** `form-productivity.js` renders field errors on every `input`; this is noisy for users still typing and conflicts with the project form principle of blur-based validation.
2. **Error association gap:** the helper creates `id="<field>-error"` but does not set `aria-describedby`/`aria-errormessage` on the field. A field can be visibly invalid without guaranteed screen-reader association.
3. **Focus sequencing gap:** the helper focuses the summary and then immediately focuses the first invalid field, so the summary is not reliably the next announced object.
4. **Generic client copy:** native `validationMessage` and the hard-coded English summary do not guarantee the field-specific, human-readable product language required by this task.
5. **Scope gap:** only forms with `data-qc-form` receive the shared contract. Small POST forms, search/filter GET forms, archive/restore, acknowledgement assignment, settings, and table actions need an explicit policy.
6. **Required parity gap:** server schemas can require a field conditionally or by action while the UI only shows a generic required marker or no marker.
7. **Non-destructive recovery gap:** server-side field errors must return the submitted values; this is not proven for every route and was not tested here with malformed/expired sessions.

## CAPA roadmap and ownership

| Priority | Action | Owner | Acceptance evidence |
|---|---|---|---|
| P0 | Create a canonical `FormContract` for all POST/PATCH/PUT/DELETE-like forms: dirty, pending, duplicate lock, success, error recovery, focus return | Frontend platform | Every mutation form in inventory references the contract; source guard passes |
| P0 | Add schema-to-field error mapping and `aria-describedby` for every invalid field | Frontend + API | 100% schema issue paths map to visible copy and preserved value |
| P0 | Refactor change request into conditional intent forms | Lab product owner | No irrelevant fields rendered for selected entity/operation; E2E covers all four entity types |
| P0 | Cover destructive archive/delete/deactivate/withdraw actions with contextual confirmation | Product + security | Confirmation names target and consequence; low-risk actions do not confirm |
| P1 | Add automated label/required/keyboard inventory across all 51 source files | Accessibility | 0 unlabeled controls; 0 ambiguous required fields |
| P1 | Add lookup/autocomplete/date/numeric helpers for large lists and structured values | Frontend | Keyboard and mobile tests for lookup, date, numeric, and suggestion states |
| P1 | Add filter/search interaction contract | Search owner | Apply/clear/pending/result-count/error/recovery tests pass |
| P1 | Add browser-back, reload, session-expiry, and double-submit E2E cases | QA | No valid data lost; retry is safe and documented |
| P2 | Add human UAT by role plus VoiceOver/NVDA and 360/1440/200% zoom evidence | QA/UX | Signed evidence matrix; automation not used as a substitute |

## Lab test plan

The following tests are required before claiming the target is met. They are a test plan, not completed results.

| ID | Scenario | Expected result |
|---|---|---|
| LAB-F-01 | Submit each form with one missing required field | Inline field-specific message; valid entries remain; focus lands predictably |
| LAB-F-02 | Submit malformed date, number, ID, code, and long text | Human-readable recovery; no silent coercion that changes meaning |
| LAB-F-03 | Server rejects a valid-looking but unauthorized/stale submission | Server message appears in context; no duplicate record; entered data is preserved |
| LAB-F-04 | Double click / press Enter twice | One request only; visible pending state; controls lock without losing values |
| LAB-F-05 | Network/server failure after submit | Error says whether save status is known; retry is safe; no blind duplicate creation |
| LAB-F-06 | Edit then navigate back, cancel, reload, or close tab | Unsaved-change protection appears where appropriate; deliberate discard is explicit |
| LAB-F-07 | Keyboard-only completion | Logical Tab order, visible focus, Enter submit, Escape dialog close, no trap |
| LAB-F-08 | Mobile 360px and 1440px desktop | No tiny controls or horizontal form overflow; correct virtual keyboard/inputmode |
| LAB-F-09 | 200% zoom and text scaling | Form reflows; fixed action bars/dialogs remain reachable and scrollable |
| LAB-F-10 | Screen reader labels/errors | Every control has persistent name; error is announced and associated with field |
| LAB-F-11 | Conditional fields | Irrelevant fields are hidden and not submitted; revealed fields receive focus/help |
| LAB-F-12 | Destructive actions | Confirmation is contextual and names object/consequence; low-risk actions avoid confirmation fatigue |

## Evidence status

| Evidence source | Result |
|---|---|
| Source inventory | **PASS** — 51 files containing `<form` identified |
| Server validation | **PASS** — centralized Zod/FormData boundary exists; route-by-route parity still required |
| Existing `test:form-productivity` | **PASS** for its current six shared forms and LabTestForm contract |
| Existing Lab form tests | **PASS** per current project mind record; not a substitute for all-form coverage |
| Full all-form label/required audit | **NOT RUN** — no dedicated guard currently proves 100% |
| Full submission-feedback audit | **NOT PROVEN** — GET and small POST forms sit outside the common helper |
| Keyboard-only manual audit | **NOT RUN** |
| VoiceOver/NVDA | **NOT RUN** |
| 360/1440/200% form-by-form validation | **NOT PROVEN** |
| Production/staging telemetry and UAT | **NOT AVAILABLE** |

## Final disposition

**Status: PARTIAL / CONDITIONAL GO for documentation.** The audit and remediation plan are complete, but the product should not claim 100% form UX, zero data-loss flows, or zero ambiguous required fields until the P0 contract gaps and LAB-F-01 through LAB-F-12 evidence are closed.

No product behavior was changed by this document-only audit.

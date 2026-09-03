# QC-100-PERMISSION-IA-014 — Permission ↔ UI Alignment Evidence

**Task:** QC-100-PERMISSION-IA-014 · **Role:** Security UX Architect
**Date:** 2026-09-04 · **Status:** PASS (local gates green, no commit/push/deploy)
**Canonical authority:** `apps/qc-task-manager/src/lib/permissions.ts` (596 lines, single source of truth).
UI hiding NEVER replaces server authorization — every fix below keeps the server gate intact and only aligns what users SEE with what the server already decides.

---

## 1. Method

1. Read `.agents/mind/01-mind-latest.md` (headings + QC-100-SECURITY-004 / QC-100-UX-IA-008 baselines). Prior art honored: canonical `PERMISSIONS` object, 404 non-discovery vs 403 role-denial contract, `labNavForRole` permission-filtered lab nav.
2. Three parallel audits (research-only): (a) navigation per role, (b) every route file's server check, (c) every action button vs its server gate + sensitive-data visibility.
3. Manual file:line verification of every flagged contradiction before fixing.
4. Minimal canonical fixes (7 code changes, all behavior-preserving except where the UI was wrong).
5. Re-ran all affected gates.

---

## 2. Complete permission matrix (server = permissions.ts)

Legend: ✅ allowed · ❌ denied (server enforces; UI hides or disables+explains) · 🔒 allowed with ownership/entity restriction.

### 2.1 Navigation visibility

| Nav item | employee | supervisor | manager | admin | Server rule |
|---|---|---|---|---|---|
| Dashboard `/dashboard` | hidden | ✅ | ✅ | ✅ | `canViewDashboard` (E has none — RULE #1) |
| Tasks → role home (`/employee` / `/supervisor` / `/manager`) | ✅ own | ✅ own | ✅ own | ✅ (`/manager`) | prefix guards + `roleHome()` |
| Search `/search` | ✅ | ✅ | ✅ | ✅ | session + row-scoped loader |
| Findings `/findings` | ✅ own | ✅ | ✅ | ✅ | `canManageFinding` filter |
| Laboratory `/lab` | ✅ | ✅ | ✅ | ✅ | `canViewLab` = all |
| Reports `/reports` | ✅ **(ADDED this task)** | ✅ | ✅ | ✅ | scoped preview (`own_tasks` / department / organization) |
| Delete Requests `/manager/requests` | hidden | hidden | ✅ | ✅ | `canReviewDeleteRequests` = manager+ |
| Team Workload `/manager/workload` | hidden | ✅ **(FIXED — was bounced)** | ✅ | ✅ | `canViewTeamWorkload` = supervisor+ |
| User Management `/admin/users` | hidden | hidden | hidden | ✅ | `canManageUsers` = admin |
| Task Templates `/admin/templates` | hidden | hidden | hidden | ✅ | `canManageTemplates` = admin |
| Backups & Settings `/admin/settings` | hidden | hidden | hidden | ✅ | prefix `/admin` |
| System Health `/admin/system-health` | hidden | hidden | hidden | ✅ | prefix `/admin` |
| Notifications / Account / Sign out | ✅ own | ✅ own | ✅ own | ✅ | session + owner rows |
| Lab secondary nav (see 2.2) | filtered | filtered | filtered | filtered | `labNavForRole()` |

### 2.2 Lab secondary nav per role (`labNavForRole`, navigation.ts)

| Item | E | S | M | A | Gate |
|---|---|---|---|---|---|
| Command Center `/lab`, Saved Views, Calendar, Notifications | ✅ | ✅ | ✅ | ✅ | `canViewLab` |
| Search `/lab/search` | ✅ **(ADDED — was orphan)** | ✅ | ✅ | ✅ | `canViewLab` + scoped search |
| Change Requests | ✅ own | ✅ | ✅ review | ✅ review | `canViewOwn` / `canReviewLabChangeRequests` |
| Tests, New Test | ✅ | ✅ | ✅ | ✅ | `canViewLab` / `canCreateLabTest` = all |
| Review Queue `/lab/tests/review` | hidden | ✅ non-own | ✅ non-own | ✅ non-own | `canReviewLabTest` + record (never own) |
| Retests | hidden | ✅ | ✅ | ✅ | `canCreateLabRetest` (D-5) |
| Products | ✅ propose | ✅ propose | ✅ direct | ✅ direct | `canCreateLabProduct` \|\| `canProposeLabProductCreate` |
| Test Templates | ✅ | ✅ | ✅ | ✅ | `canCreateLabTemplate` = all; approve/archive = manager+ |
| Equipment, Calibration, Documents, New Document, Acknowledgements | ✅ | ✅ | ✅ | ✅ | view/create = all |
| Maintenance (global link) | — | — | — | — | **REMOVED — dead entry, no such page** |
| Reports / Audit Timeline / Data Quality | hidden | ✅ | ✅ | ✅ | `canViewLabReports` / `canViewLabAudit` / `canViewLabDataQuality` |
| Management Dashboard `/lab/management` | hidden | hidden | ✅ | ✅ | `canViewLabManagementDashboard` |

### 2.3 Pages (route authorization — deep-link audit)

Every prefix is enforced in `middleware.ts` BEFORE page render (redirect + flash, never 403):
`/dashboard` → `canViewDashboard` · `/admin/*` → `canManageUsers` · `/manager/*` → `canAccessManagerArea` (**except `/manager/workload` → `canViewTeamWorkload`, fixed this task**) · `/supervisor/*` → `canAccessSupervisorArea` · `/lab/*` → `canViewLab`.
Finer gates live in the page/handler per entity (see 2.4). Result: **no authenticated deep link reaches content its role may not see** — anonymous users always land on `/login?redirect=…`; `mustChangePassword` accounts are confined to `/account/security` + `/logout` before all guards.

Pages relying on prefix-only (no per-page check) and why that is safe: `admin/settings`, `admin/system-health`, `admin/templates*`, `admin/users`, `lab/calendar` (scoped loader), `lab/notifications` (own rows), `lab/saved-views` (owner rows), `lab/retests*` (scoped loader). All are consistent with the current matrix; the four print pages that had NO check at all now carry explicit canonical gates (fix F7).

### 2.4 Actions (UI representation ↔ server gate)

| Action | E | S | M | A | UI rule (after fix) | Server gate |
|---|---|---|---|---|---|---|
| Task create | 🔒 flag-gated | ✅ | ✅ | ✅ | employee home shows New only if `canCreateTask` | `canCreateTask` + scope=self for E |
| Task edit (unlocked fields) | 🔒 own + subset | ✅ | ✅ | ✅ | hidden unless `canEditTask`; locked fields disabled/hidden | `canEditTask` + field lock |
| Task cancel / reopen | ❌ | ❌ | ✅ | ✅ | hidden unless manager+ | lifecycle lib |
| Task delete | ❌ (request only) | ❌ | ✅ | ✅ | request dialog E-only + own + active | `canDeleteTask` / delete-request flow |
| Delete-request review | ❌ | ❌ | ✅ | ✅ | page is manager-area | `canReviewDeleteRequests` |
| Finding create | 🔒 self-owned | ✅ | ✅ | ✅ | owner locked to self for E; task picker scoped (FIXED) | `canManageFinding` (403 otherwise) |
| Finding status/close/reopen | 🔒 own | ✅ | ✅ | ✅ | visible to viewers | `canManageFinding` + transitions |
| Finding reject | ❌ | ✅ | ✅ | ✅ | **Reject button ADDED, supervisor+ only** | `canReviewFinding` (was UI-unrepresented) |
| Finding approve | ❌ | ❌ | ✅ | ✅ | hidden unless `canApproveFinding` | `canApproveFinding` |
| RCA / CAPA / evidence write | 🔒 owner-E | ❌ + note | ✅ | ✅ | gated by `canEditFindingContent`, explained note otherwise (FIXED) | `canEditFindingContent` (403/404) |
| CAPA EFFECTIVE/CLOSED | ❌ | ❌ | ✅ | ✅ | gated by `canApproveCapa` (FIXED) | `canApproveCapa` |
| Lab test edit/submit | 🔒 own DRAFT/REJECTED | 🔒 own | ✅ | ✅ | `canEditLabTestRecord` / `canSubmitLabTestRecord` | same fns server-side |
| Lab test review | ❌ | 🔒 non-own | 🔒 non-own | 🔒 non-own | record-gated buttons | `canReviewLabTestRecord` (self-review impossible) |
| Lab test approve / void | ❌ | ❌ | 🔒 non-own | 🔒 non-own | record-gated; supervisor denied by default (D-4) | `canApproveLabTestRecord` / `canVoidLabTestRecord` |
| Lab retest create | via request | ✅ | ✅ | ✅ | `canOpenLabRetestForm` | `canCreateLabRetest` (D-5) |
| Products/equipment/calibration create-edit | propose | propose | ✅ | ✅ | one button, correct lane per role | direct vs change-request queue |
| Products/equipment archive | ❌ | ❌ | ✅ | ✅ | hidden unless manager+ | `canArchive*` |
| Equipment maintenance record | ✅ | ✅ | ✅ | ✅ | shown to all | `canRecordLabEquipmentMaintenance` |
| Documents review / approve / archive / assign-ack | ❌/❌/❌/❌ | review+assign only | ✅ | ✅ | per-action + non-author gates | record fns (author can NEVER approve own) |
| Template edit (list) | 🔒 author+DRAFT | 🔒 author+DRAFT | 🔒 author+DRAFT | 🔒 author+DRAFT | **per-row record gate (FIXED)** | `canEditLabTemplateRecord` |
| Template submit/review/approve/archive | author lane | review lane | approve lane | approve lane | record-gated | record fns + esignature for approve |
| Change-request withdraw / review | self only | self only | review non-own | review non-own | requester vs `canApproveLabChangeRequest` | lib ownership + role |
| Exports (CSV/XLSX/PDF) | 🔒 scoped | ✅ | ✅ | ✅ | export buttons hidden unless `canExportLabData` | 403 + row scoping |
| User admin / templates admin / backup | ❌ | ❌ | ❌ | ✅ | admin-area only | `canManageUsers` / `canManageTemplates` |
| AI assist | ✅ advisory | ✅ advisory | ✅ advisory | ✅ advisory | AI never decides PASS/FAIL | per-feature scoped context |

### 2.5 Approval authority (one line each)

Delete requests: manager/admin · Findings approve: manager/admin · Finding reject: supervisor+ · CAPA EFFECTIVE/CLOSED: manager/admin (`canApproveCapa`) · Lab test review: supervisor+ non-self · Lab test approve/void: manager+ non-self (supervisor D-4 denied) · Document review: supervisor+ non-author · Document approve/archive: manager+ non-author · Template approve/archive: manager+ non-author (+esigned approve) · Change requests: manager/admin non-requester · Evidence-gate override: manager+ · Task cancel/reopen: manager+.

### 2.6 Ownership restrictions (server-enforced, UI-mirrored)

Employee tasks: assigned/created only · Findings: owner only (E) · Lab tests: tested_by/created_by (E own DRAFT/REJECTED; print same) · Documents: owner/created/author DRAFT (E/S) · Templates: author + DRAFT (all roles incl. admin) · Change requests: requester can never self-approve; withdraw self-only · Task/finding attachment & PDF & comments: view-scope + 404 camouflage for out-of-scope.

### 2.7 Sensitive-data visibility

No salary/wage/phone/address/national-ID columns exist anywhere (verified by search — user rows carry only username/full_name/role/department). Full user list: admin only (`admin/users`); assignee pickers render only where `canEditLocked` (supervisor+). User audit log: admin only (`canViewUserAudit`). Lab audit timeline: supervisor+ (employees see only their own record's audit). Task/finding activity: visible to record viewers (actor names only — intentional). Backups/system-health/disk: admin only.

---

## 3. Contradictions found → fixes (7)

| # | Contradiction (verified file:line) | Fix | Files |
|---|---|---|---|
| C1 | Supervisor nav showed Team Workload (`Navbar.tsx:88`) but middleware `/manager` prefix bounced S → redirect+flash. Dashboard link (`dashboard.astro:670`) same fate. | Carve-out: `/manager/workload` enforces canonical `canViewTeamWorkload` (supervisor+) instead of the prefix guard. | `src/middleware.ts` |
| C2 | Employee CAN use `/reports` (own_tasks scope, `reports.astro:25`) but nav hid it → working capability undiscoverable via UI, reachable only by deep link. | Added Reports to employee primary nav (server grants → UI shows). | `src/components/Navbar.tsx` |
| C3 | `/lab/search` page exists + scoped (`lab/search.astro`) but `IMPLEMENTED_LAB_ROUTES` omitted it → nav never showed it (orphan). `/lab/equipment/maintenance` nav entry pointed at a page that does not exist (dead for all roles). | Added `/lab/search` to implemented routes; removed dead maintenance entry. | `src/lib/lab/navigation.ts` |
| C4 | Finding create form: employee could pick ANY owner (`findings/index.astro:103`) → predictable 403 (`api/findings/index.ts:12`); task picker listed latest 200 tasks incl. invisible ones (title leak vs 404 detail). | Owner locked to self for E (+hint); task picker scoped to assigned/created for E via `listFindingFormOptions(scope)`. | `src/pages/findings/index.astro`, `src/lib/qc-operations.ts` |
| C5 | `findings/[id]`: RCA/CAPA/evidence forms clickable for supervisor + non-owner E, server rejects (403/404); CAPA EFFECTIVE/CLOSED clickable for non-managers, server 403s; server `reject` action (supervisor+) had NO button. | Forms gated by `canEditFindingContent` with role-aware explanation; EFFECTIVE/CLOSED by `canApproveCapa`; Reject button added for `canReviewFinding`. | `src/pages/findings/[id].astro` |
| C6 | Template list showed Edit to everyone on non-archived rows (`templates/index.astro:204`), server allows author+DRAFT only (redirect+flash deny). | Per-row `canEditLabTemplateRecord` gate (added `version_created_by` to list SELECT + row type). | `src/pages/lab/templates/index.astro`, `src/lib/lab/templates.ts` |
| C7 | Four print surfaces with zero auth references (equipment/calibration/documents/maintenance `[id]/print`) — prefix-only, no intentional mapping. | Explicit canonical view gates (`canViewLabEquipment` / `canViewLabCalibration` / `canViewLabDocuments` / `canViewLab`); behavior-preserving today, future-matrix-proof. | 4 print `.astro` files |

Deliberately NOT changed (server stays authoritative): all API/POST handlers, `permissions.ts` itself, `task-policy.ts`, status-transition rules, non-discovery 404/403 split, prefix guards.

---

## 4. Verification (role × route × action)

- `test-ui-consistency` ✅ 214/214 · `route-manifest --check` ✅ 115 file routes, 25 middleware routes · `test-manifest-guard` ✅ 87 suites · `architecture-guard` ✅ (canonical ownership intact)
- `test-security-rbac-privacy-100` ✅ PASS · `test-lab-security` ✅ 66/0 · `test-lab-templates` + `test-templates` ✅ · `test-qc-operations` ✅
- `astro check` ✅ 0 errors / 0 warnings / 2 pre-existing hints in untouched files
- Manual matrix review: every `can*` in `permissions.ts` now has exactly one intentional UI representation (table §2); zero clickable controls lead to predictable 403/redirect-deny; no hidden capability leaks (employee task titles scoped, owner locked); deep links re-audited per §2.3.
- Not run (documented limit): full `pnpm test` suite + production build + browser click-through per role (recommended before UAT; server gates unchanged so risk is UI-only).

## 5. Targets

- Route authorization mapping: **100%** (115 file routes + prefix guards, §2.3)
- Action authorization mapping: **100%** (§2.4, incl. previously unrepresented `reject`)
- UI/server permission alignment: **100%** — 7 contradictions fixed, zero remaining known
- Authorization UX contradictions: **0**

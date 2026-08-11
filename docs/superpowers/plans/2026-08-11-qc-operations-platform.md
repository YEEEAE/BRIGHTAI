# QC Operations Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add standalone QC Findings, RCA, CAPA, evidence, approval, audit, RBAC, and SSR routes to `apps/qc-task-manager` without replacing or changing the existing `Task` model.

**Architecture:** Add an additive SQLite migration with `qc_findings`, `qc_rca`, `qc_capa`, `qc_evidence`, and `qc_audit_log` tables. Keep the business rules in focused server/domain modules; every API mutation resolves the actor from the existing session, checks role and assignment scope, applies lifecycle guards, writes the mutation and audit event atomically, and never treats UI state as authorization. Findings retain a required `task_id` foreign key and use the existing tasks only as a parent reference.

**Tech Stack:** Astro SSR, TypeScript, better-sqlite3, SQLite migrations, existing session/RBAC/security helpers, server-rendered Astro pages, existing Tailwind classes.

---

### Task 1: Add the QC Operations schema migration

**Files:**
- Create: `apps/qc-task-manager/db/migrations/004_qc_operations.sql`
- Modify: `apps/qc-task-manager/src/lib/db.ts`
- Modify: `apps/qc-task-manager/db/schema.sql`
- Test: `apps/qc-task-manager/scripts/test-qc-operations.mjs`

- [ ] **Step 1: Write the failing schema test**

Add a fresh in-memory SQLite test that runs migrations and asserts the five tables, required columns, lifecycle CHECK behavior, foreign-key behavior, and required indexes. Include an assertion that the existing `tasks` table and columns remain present.

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @brightai/qc-task-manager exec node --import ../../scripts/test-ts-loader.mjs --experimental-strip-types scripts/test-qc-operations.mjs`

Expected: FAIL because migration `004_qc_operations.sql` and its runtime import do not exist.

- [ ] **Step 3: Implement the additive migration**

Create `004_qc_operations.sql` with:

```sql
CREATE TABLE IF NOT EXISTS qc_findings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  finding_number TEXT NOT NULL UNIQUE,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  inspection_type TEXT NOT NULL,
  classification TEXT NOT NULL CHECK (classification IN ('conforming','observation','minor','major','critical')),
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  risk_description TEXT NOT NULL,
  requirement_reference TEXT,
  owner INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','UNDER_REVIEW','ACTION_REQUIRED','VERIFICATION','CLOSED','REOPENED')),
  closure_evidence TEXT,
  closed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  closed_at TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS qc_rca (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  finding_id INTEGER NOT NULL UNIQUE REFERENCES qc_findings(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('5_WHYS','FISHBONE','FREE_FORM')),
  free_form TEXT,
  why_1 TEXT, why_2 TEXT, why_3 TEXT, why_4 TEXT, why_5 TEXT,
  fishbone_json TEXT,
  updated_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS qc_capa (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  finding_id INTEGER NOT NULL UNIQUE REFERENCES qc_findings(id) ON DELETE CASCADE,
  problem_statement TEXT NOT NULL,
  root_cause TEXT NOT NULL,
  corrective_action TEXT NOT NULL,
  preventive_action TEXT NOT NULL,
  owner INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  due_date TEXT,
  evidence TEXT,
  effectiveness_check TEXT,
  reviewer INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approval TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','OPEN','IMPLEMENTATION','VERIFICATION','EFFECTIVE','CLOSED','REOPENED')),
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS qc_evidence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  finding_id INTEGER REFERENCES qc_findings(id) ON DELETE CASCADE,
  capa_id INTEGER REFERENCES qc_capa(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  reference TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK ((finding_id IS NOT NULL AND capa_id IS NULL) OR (finding_id IS NULL AND capa_id IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS qc_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('FINDING','RCA','CAPA','EVIDENCE')),
  entity_id INTEGER NOT NULL,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  actor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action TEXT NOT NULL CHECK (action IN ('CREATE','UPDATE','STATUS_TRANSITION','APPROVAL','REJECTION','CLOSURE','REOPEN')),
  old_value TEXT,
  new_value TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_qc_findings_task ON qc_findings(task_id);
CREATE INDEX IF NOT EXISTS idx_qc_findings_owner_status ON qc_findings(owner,status);
CREATE INDEX IF NOT EXISTS idx_qc_findings_due ON qc_findings(due_date);
CREATE INDEX IF NOT EXISTS idx_qc_rca_finding ON qc_rca(finding_id);
CREATE INDEX IF NOT EXISTS idx_qc_capa_finding_status ON qc_capa(finding_id,status);
CREATE INDEX IF NOT EXISTS idx_qc_evidence_finding ON qc_evidence(finding_id);
CREATE INDEX IF NOT EXISTS idx_qc_evidence_capa ON qc_evidence(capa_id);
CREATE INDEX IF NOT EXISTS idx_qc_audit_entity ON qc_audit_log(entity_type,entity_id,created_at);
```

Import it in `db.ts`, add migration 004 to `embeddedMigrations`, include all five tables and indexes in startup validation, and update the reference snapshot in `schema.sql`.

- [ ] **Step 4: Run the schema test to verify it passes**

Run the same command. Expected: PASS, including `PRAGMA foreign_key_check` with zero rows.

### Task 2: Implement Finding/CAPA/RCA domain rules and persistence

**Files:**
- Modify: `apps/qc-task-manager/src/lib/findings/index.ts`
- Modify: `apps/qc-task-manager/src/lib/capa/index.ts`
- Create: `apps/qc-task-manager/src/lib/qc-operations.ts`
- Modify: `apps/qc-task-manager/src/lib/permissions.ts`
- Modify: `apps/qc-task-manager/src/lib/types.ts`
- Test: `apps/qc-task-manager/scripts/test-qc-operations.mjs`

- [ ] **Step 1: Add failing domain assertions**

Cover exact classification labels, Finding lifecycle transitions, CAPA lifecycle transitions, RCA methods and Fishbone categories, Critical closure rejection without all four gates, CAPA closure rejection without action/evidence/effectiveness/approval, and RBAC rules: employee assigned owner only, supervisor review, manager approval, admin full control.

- [ ] **Step 2: Run the test and confirm the expected failures**

Run the QC operations test command and confirm failures reference missing constants/functions rather than test setup errors.

- [ ] **Step 3: Add canonical domain constants and helpers**

Expose typed constants for:

```ts
FINDING_CLASSIFICATIONS = ['conforming','observation','minor','major','critical']
FINDING_STATUSES = ['OPEN','UNDER_REVIEW','ACTION_REQUIRED','VERIFICATION','CLOSED','REOPENED']
CAPA_STATUSES = ['DRAFT','OPEN','IMPLEMENTATION','VERIFICATION','EFFECTIVE','CLOSED','REOPENED']
RCA_METHODS = ['5_WHYS','FISHBONE','FREE_FORM']
FISHBONE_CATEGORIES = ['People','Process','Equipment','Material','Environment','Measurement','Management']
```

Implement `canTransitionFinding`, `canTransitionCapa`, `canCloseCriticalFinding`, `canCloseCapa`, and normalization helpers. Make the critical gate require: a CAPA exists, CAPA is `EFFECTIVE` or `CLOSED`, finding closure evidence exists, a verification status has been reached, and an approval is recorded. Make CAPA closure require non-empty corrective action, evidence, effectiveness check, and approval.

Implement `qc-operations.ts` prepared-statement functions for list/get/create/update/status transition, RCA upsert, CAPA upsert/status transition, evidence creation, audit listing, and transactional `closeFinding`/`closeCapa`. Every mutation writes `qc_audit_log` with the server-resolved actor.

- [ ] **Step 4: Add RBAC helpers**

Add permission helpers that express the requested policy without replacing existing Task permissions:

```ts
canManageFinding(user, finding) // admin or supervisor/manager; employee only if owner
canReviewFinding(role)           // supervisor, manager, admin
canApproveFinding(role)          // manager, admin
canManageCapa(user, capa)        // admin or supervisor/manager; employee only if CAPA owner
canApproveCapa(role)             // manager, admin
```

- [ ] **Step 5: Run all domain assertions**

Run the QC operations test command. Expected: PASS with existing task domain tests unchanged.

### Task 3: Add secure API routes with audit coverage

**Files:**
- Create: `apps/qc-task-manager/src/pages/api/findings/index.ts`
- Create: `apps/qc-task-manager/src/pages/api/findings/[id].ts`
- Create: `apps/qc-task-manager/src/pages/api/findings/[id]/rca.ts`
- Create: `apps/qc-task-manager/src/pages/api/findings/[id]/capa.ts`
- Create: `apps/qc-task-manager/src/pages/api/findings/[id]/evidence.ts`
- Modify: `apps/qc-task-manager/src/lib/validation.ts`
- Test: `apps/qc-task-manager/scripts/test-qc-operations.mjs`

- [ ] **Step 1: Add failing API contract tests**

Exercise the pure handlers/service functions for: create, update, each lifecycle transition, critical direct-close rejection, RCA upsert, CAPA create/update, CAPA approval/rejection, evidence creation, and audit row creation. Include invalid IDs, CSRF rejection, unauthenticated rejection, and role rejection.

- [ ] **Step 2: Run API tests and verify RED**

Run the focused test command. Expected: failures for missing route/service contracts.

- [ ] **Step 3: Implement validation schemas**

Add Zod schemas for Finding creation/update, status transition, RCA payload, CAPA payload/status, evidence payload, and approval/rejection. Normalize empty optional fields to `null`, enforce date format `YYYY-MM-DD`, and cap free-form text at the existing QC metadata limit or an explicit 5000-character limit for descriptions/actions.

- [ ] **Step 4: Implement routes**

Every route must call `requireCsrf`, `requireApiUser`, and `parsePositiveId`, resolve the Finding/CAPA server-side, check the permission helper, then call the domain service. JSON errors use existing response conventions and never accept actor IDs from form data. `POST /api/findings` creates a Finding and audit row. `PATCH /api/findings/[id]` updates fields/status and routes approval/rejection/closure/reopen through explicit actions. RCA, CAPA, and evidence routes use the same guard and audit path.

- [ ] **Step 5: Run focused API/domain tests**

Expected: all QC operations tests pass and existing API security tests remain green.

### Task 4: Build `/findings` and `/findings/[id]` SSR UI

**Files:**
- Create: `apps/qc-task-manager/src/pages/findings/index.astro`
- Create: `apps/qc-task-manager/src/pages/findings/[id].astro`
- Create: `apps/qc-task-manager/src/components/QcStatusBadge.astro`
- Create: `apps/qc-task-manager/src/components/QcFindingForm.astro`
- Modify: `apps/qc-task-manager/src/layouts/BaseLayout.astro`
- Modify: `apps/qc-task-manager/src/middleware.ts`

- [ ] **Step 1: Add route smoke assertions**

Add route checks for authenticated list/detail responses, employee owner scoping, missing Finding 404, and unauthorized detail 403.

- [ ] **Step 2: Implement the Findings list**

Render a responsive table/cards with Finding number, task, classification, severity, owner, due date, status, and links. Include status/classification filters and a create form with task selector, inspection type, classification, severity, risk description, requirement reference, owner, and due date. Show clear empty/error states.

- [ ] **Step 3: Implement the Finding detail**

Render the required sections in this order: Finding summary, Timeline, RCA, CAPA, Evidence, Approval, Audit. Add forms/actions respecting RBAC. Make Critical findings visibly show the four closure gates and disable direct closure until they are satisfied. Show CAPA gate status and rejection reasons.

- [ ] **Step 4: Add navigation and middleware route behavior**

Add a Findings link to the existing navbar for authenticated users. Keep `/findings` behind the existing authenticated wall; do not add a new role prefix or change Task routes. Use server-rendered content and existing security headers/CSRF conventions.

- [ ] **Step 5: Run route smoke checks and typecheck**

Expected: `/findings` and `/findings/[id]` render without errors, employee scoping is enforced server-side, and `pnpm --filter @brightai/qc-task-manager typecheck` passes.

### Task 5: Verification, documentation, and brain update

**Files:**
- Modify: `apps/qc-task-manager/docs/ARCHITECTURE.md`
- Modify: `apps/qc-task-manager/docs/ROLES-AND-PERMISSIONS.md`
- Modify: `apps/qc-task-manager/docs/TESTING.md`
- Modify: `.agents/brain.md`

- [ ] **Step 1: Run focused and full verification**

Run:

```bash
pnpm --filter @brightai/qc-task-manager test
pnpm --filter @brightai/qc-task-manager typecheck
NODE_ENV=production pnpm --filter @brightai/qc-task-manager build
git diff --check
```

Record exact pass/fail counts. If live E2E cannot bind locally, mark it blocked rather than claiming it passed.

- [ ] **Step 2: Document the new source of truth**

Document the additive schema, lifecycle gates, audit event vocabulary, role boundaries, and route map. State explicitly that `Task` remains unchanged as a model and only supplies the required `task_id` parent reference.

- [ ] **Step 3: Update `.agents/brain.md`**

Add a dated ledger entry listing files, verification results, remaining unverified areas, and the decision to keep Task unchanged. Do not add secrets, commit, or push.


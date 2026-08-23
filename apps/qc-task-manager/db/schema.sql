-- QC Task Manager — production database schema (SQLite).
--
-- The executable schema history lives in db/migrations/. This file is retained
-- for SQLTools/manual inspection and compatibility, but it is not used to
-- decide or record schema history. Application startup and db:init use the
-- sequential migration runner instead.
--
-- Referential-integrity policy:
--   * ON DELETE CASCADE  — child records whose life is tied to the parent
--                          (comments/attachments/activity/checklists/
--                          dependencies of a task, sessions/notifications/
--                          saved filters of a user).
--   * ON DELETE RESTRICT — audit-critical user references that must never
--                          dangle (task creator, commenter, uploader, actor).
--   * ON DELETE SET NULL — optional user references that lose meaning when the
--                          user is gone (assignee, completer, reviewer, …).

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ────────────────────────────── 1. users ──────────────────────────────
-- role ∈ admin | manager | supervisor | employee (CORE BUSINESS RULE #1).
-- Passwords are stored ONLY as bcrypt hashes (never plaintext).
CREATE TABLE IF NOT EXISTS users (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  username              TEXT NOT NULL UNIQUE,
  password_hash         TEXT NOT NULL,
  full_name             TEXT NOT NULL,
  role                  TEXT NOT NULL
                          CHECK (role IN ('admin', 'manager', 'supervisor', 'employee')),
  department            TEXT NOT NULL DEFAULT 'QC',
  can_create_tasks      INTEGER NOT NULL DEFAULT 0 CHECK (can_create_tasks IN (0, 1)),
  is_active             INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until          TEXT,
  last_login_at         TEXT,
  created_by            INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at            TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
  ,skills_json          TEXT
);

-- ────────────────────────────── 2. tasks ──────────────────────────────
-- status / progress flow per CORE BUSINESS RULES #2 and #3.
CREATE TABLE IF NOT EXISTS tasks (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  title                   TEXT NOT NULL,
  description             TEXT,
  department              TEXT NOT NULL DEFAULT 'QC',
  status                  TEXT NOT NULL DEFAULT 'not_started'
                            CHECK (status IN ('not_started', 'in_progress', 'on_hold', 'completed', 'cancelled')),
  priority                TEXT NOT NULL DEFAULT 'medium'
                            CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  progress_percent        INTEGER NOT NULL DEFAULT 0
                            CHECK (progress_percent BETWEEN 0 AND 100),
  created_by              INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_to             INTEGER REFERENCES users(id) ON DELETE SET NULL,
  due_date                TEXT,
  blocker_note            TEXT,
  recurrence              TEXT NOT NULL DEFAULT 'none'
                            CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly')),
  recurrence_end_date     TEXT,
  parent_recurring_task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  started_at              TEXT,
  completed_at            TEXT,
  completed_by            INTEGER REFERENCES users(id) ON DELETE SET NULL,
  completion_comment_id   INTEGER,
  cancelled_at            TEXT,
  cancelled_by            INTEGER REFERENCES users(id) ON DELETE SET NULL,
  inspection_type         TEXT,
  finding_classification  TEXT,
  risk_level              TEXT,
  corrective_action_required INTEGER CHECK (corrective_action_required IN (0, 1)),
  reference_number        TEXT,
  audit_batch_or_work_order TEXT,
  task_type               TEXT,
  template_id             INTEGER REFERENCES task_templates(id) ON DELETE SET NULL,
  template_snapshot       TEXT,
  sla_policy_id           INTEGER REFERENCES sla_policies(id) ON DELETE SET NULL,
  sla_started_at          TEXT,
  sla_due_at              TEXT,
  sla_paused_at           TEXT,
  sla_elapsed_seconds     INTEGER NOT NULL DEFAULT 0 CHECK (sla_elapsed_seconds >= 0),
  sla_remaining_seconds   INTEGER,
  sla_percent_used        REAL NOT NULL DEFAULT 0 CHECK (sla_percent_used >= 0),
  sla_status              TEXT NOT NULL DEFAULT 'NORMAL' CHECK (sla_status IN ('NORMAL','AT_RISK','CRITICAL','BREACHED','PAUSED')),
  created_at              TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at              TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sla_policies (
  id INTEGER PRIMARY KEY AUTOINCREMENT, priority TEXT, department TEXT, task_type TEXT,
  target_duration_seconds INTEGER NOT NULL CHECK (target_duration_seconds > 0),
  warning_percent INTEGER NOT NULL DEFAULT 70 CHECK (warning_percent BETWEEN 0 AND 99),
  critical_percent INTEGER NOT NULL DEFAULT 90 CHECK (critical_percent BETWEEN 1 AND 100),
  pause_on_hold INTEGER NOT NULL DEFAULT 0 CHECK (pause_on_hold IN (0,1)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (critical_percent > warning_percent)
);
CREATE TABLE IF NOT EXISTS escalation_policies (
  id INTEGER PRIMARY KEY AUTOINCREMENT, threshold_percent INTEGER NOT NULL CHECK (threshold_percent > 0),
  recipient_roles TEXT NOT NULL, is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE (threshold_percent, recipient_roles)
);
CREATE TABLE IF NOT EXISTS escalation_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT, task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  escalation_policy_id INTEGER NOT NULL REFERENCES escalation_policies(id) ON DELETE RESTRICT,
  idempotency_key TEXT NOT NULL UNIQUE, trigger_rule TEXT NOT NULL,
  recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT, triggered_at TEXT NOT NULL,
  delivery_status TEXT NOT NULL CHECK (delivery_status IN ('PENDING','DELIVERED','FAILED')),
  delivered_at TEXT, retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0), last_error TEXT
);

CREATE TABLE IF NOT EXISTS workflow_definitions (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, applies_to TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, is_active INTEGER NOT NULL DEFAULT 1, created_by INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(code, version));
CREATE TABLE IF NOT EXISTS workflow_steps (id INTEGER PRIMARY KEY AUTOINCREMENT, definition_id INTEGER NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE, step_key TEXT NOT NULL, label TEXT NOT NULL, role TEXT NOT NULL, step_order INTEGER NOT NULL, is_required INTEGER NOT NULL DEFAULT 1, approval_type TEXT NOT NULL, sla_seconds INTEGER, UNIQUE(definition_id, step_order), UNIQUE(definition_id, step_key));
CREATE TABLE IF NOT EXISTS workflow_instances (id INTEGER PRIMARY KEY AUTOINCREMENT, task_id INTEGER NOT NULL UNIQUE REFERENCES tasks(id) ON DELETE CASCADE, definition_id INTEGER, definition_code TEXT NOT NULL, definition_version INTEGER NOT NULL, definition_snapshot TEXT NOT NULL, current_step_order INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'ACTIVE', created_by INTEGER NOT NULL REFERENCES users(id), created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), completed_at TEXT);
CREATE TABLE IF NOT EXISTS workflow_actions (id INTEGER PRIMARY KEY AUTOINCREMENT, instance_id INTEGER NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE, step_order INTEGER NOT NULL, action TEXT NOT NULL, previous_state TEXT NOT NULL, next_state TEXT NOT NULL, reason TEXT, actor_id INTEGER NOT NULL REFERENCES users(id), acted_at TEXT NOT NULL DEFAULT (datetime('now')));

-- ─────────────────────────── task_templates ─────────────────────────────
-- Reusable task configuration with lifecycle DRAFT → ACTIVE → ARCHIVED.
-- Only ACTIVE templates may be instantiated. The JSON columns carry the
-- structured configuration; instantiateTemplate() freezes a snapshot onto the
-- task so later edits here never mutate existing tasks.
CREATE TABLE IF NOT EXISTS task_templates (
  id                         INTEGER PRIMARY KEY AUTOINCREMENT,
  code                       TEXT NOT NULL UNIQUE,
  title                      TEXT NOT NULL,
  description                TEXT,
  department                 TEXT NOT NULL DEFAULT 'QC',
  priority                   TEXT NOT NULL DEFAULT 'medium'
                               CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  task_type                  TEXT,
  sla_policy_id              INTEGER REFERENCES sla_policies(id) ON DELETE SET NULL,
  checklist_json             TEXT NOT NULL DEFAULT '[]',
  evidence_requirements_json TEXT NOT NULL DEFAULT '[]',
  recurrence                 TEXT NOT NULL DEFAULT 'none'
                               CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly')),
  finding_defaults_json      TEXT NOT NULL DEFAULT '{}',
  assignment_rules_json      TEXT NOT NULL DEFAULT '{}',
  lifecycle_status           TEXT NOT NULL DEFAULT 'DRAFT'
                               CHECK (lifecycle_status IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),
  version                    INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_by                 INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at                 TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at                 TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─────────────────────────── 3. task_comments ───────────────────────────
-- The completion comment (CORE BUSINESS RULE #3) is flagged with
-- is_completion_comment; the closure flow itself is enforced at the app layer.
CREATE TABLE IF NOT EXISTS task_comments (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id              INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id              INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  comment              TEXT NOT NULL,
  is_completion_comment INTEGER NOT NULL DEFAULT 0 CHECK (is_completion_comment IN (0, 1)),
  created_at           TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ──────────────── 4. task_attachments (stored as BLOBs) ────────────────
-- CORE BUSINESS RULE #5: file content lives INSIDE the database (file_data
-- BLOB) — never on disk. file_hash enables dedupe/integrity checks.
CREATE TABLE IF NOT EXISTS task_attachments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id     INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  file_name   TEXT NOT NULL,
  mime_type   TEXT NOT NULL,
  file_size   INTEGER NOT NULL,
  file_hash   TEXT,
  file_data   BLOB NOT NULL,
  is_evidence INTEGER NOT NULL DEFAULT 0 CHECK (is_evidence IN (0, 1)),
  -- Evidence-platform metadata (added by migration 005). Populated for
  -- completion-evidence rows (is_evidence=1); nullable/default for generic
  -- attachment rows so legacy data is unaffected.
  evidence_type       TEXT,
  evidence_label      TEXT,
  description         TEXT,
  source              TEXT NOT NULL DEFAULT 'manual_upload',
  collected_by        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  collected_at        TEXT,
  verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED'
                    CHECK (verification_status IN ('UNVERIFIED', 'AI_PENDING', 'VALID', 'REJECTED', 'AI_REVIEWED', 'HUMAN_VERIFIED')),
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ────────────────────── 5. task_activity_log ──────────────────────────
-- CORE BUSINESS RULE #6: every action is recorded (who / what / old / new /
-- when / from where). Rows cascade away with their task but the acting user is
-- RESTRICTed so an audit actor can never disappear.
CREATE TABLE IF NOT EXISTS task_activity_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id    INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action     TEXT NOT NULL,
  field      TEXT,
  old_value  TEXT,
  new_value  TEXT,
  note       TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  previous_hash TEXT,
  event_hash TEXT
);

-- ──────────────────── 6. task_delete_requests ─────────────────────────
-- CORE BUSINESS RULE #4: employees cannot delete; they request, manager/admin
-- review. Per the production spec the request is a child of its task:
-- task_id is ON DELETE CASCADE — approving a request hard-deletes the task and
-- the request row goes with it (the task's deletion is its own audit event).
-- The unique partial index blocks duplicate pending requests atomically.
CREATE TABLE IF NOT EXISTS task_delete_requests (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id      INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  requested_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reason       TEXT,
  review_note  TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at  TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─────────────────────────── 7. task_checklists ────────────────────────
CREATE TABLE IF NOT EXISTS task_checklists (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id      INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  is_completed INTEGER NOT NULL DEFAULT 0 CHECK (is_completed IN (0, 1)),
  completed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  completed_at TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ───────────────────────── 8. task_dependencies ────────────────────────
CREATE TABLE IF NOT EXISTS task_dependencies (
  task_id             INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id  INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, depends_on_task_id),
  CHECK (task_id != depends_on_task_id)
);

-- ─────────────────────────── 9. notifications ──────────────────────────
-- Persisted in-app notifications. user_id rows are children of the user;
-- task_id is SET NULL when the task disappears so notifications survive it.
-- entity_href (migration 022) carries the real source-record link written by
-- the same transaction as the notification (lab events have task_id NULL, so
-- without it every lab alert would link back to the notifications page).
CREATE TABLE IF NOT EXISTS notifications (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id    INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  is_read    INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  entity_href TEXT,
  -- Scheduled-job idempotency key (migration 025): user + kind + entity +
  -- run date for the daily reminder job; NULL for interactive notifications.
  dedupe_key TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_notifications_dedupe_key
  ON notifications(dedupe_key)
  WHERE dedupe_key IS NOT NULL;

-- ─────────────────────────── 10. sessions ──────────────────────────────
-- Opaque token → user_id. Cookie only holds the token; the row is the source
-- of truth. Child of the user (CASCADE).
CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

-- ───────────────────────── 11. login_attempts ──────────────────────────
-- Security audit of login attempts. Stores username + IP + outcome only —
-- never passwords or password hashes.
CREATE TABLE IF NOT EXISTS login_attempts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  username   TEXT,
  ip_address TEXT,
  succeeded  INTEGER NOT NULL CHECK (succeeded IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ───────────────────────── 12. saved_filters ───────────────────────────
-- Per-user saved dashboard filters. Child of the user (CASCADE).
CREATE TABLE IF NOT EXISTS saved_filters (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  filter_json TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─────────────────────────── Indexes ───────────────────────────────
-- Dashboard filters + FK columns (queries never scan these tables).

CREATE INDEX IF NOT EXISTS idx_tasks_status          ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority        ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to     ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by      ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date        ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at    ON tasks(completed_at);
CREATE INDEX IF NOT EXISTS idx_tasks_recurrence      ON tasks(recurrence);

CREATE INDEX IF NOT EXISTS idx_comments_task_id      ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id      ON task_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_attachments_task_id   ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by ON task_attachments(uploaded_by);

-- Composite (task_id, created_at) serves both the FK lookup and the
-- "activity of a task, newest first" timeline.
CREATE INDEX IF NOT EXISTS idx_activity_task_created ON task_activity_log(task_id, created_at);
CREATE INDEX IF NOT EXISTS idx_activity_user_id      ON task_activity_log(user_id);

CREATE INDEX IF NOT EXISTS idx_delreq_task_id        ON task_delete_requests(task_id);
CREATE INDEX IF NOT EXISTS idx_delreq_requested_by   ON task_delete_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_delreq_reviewed_by    ON task_delete_requests(reviewed_by);
-- One pending deletion request per task, enforced at the database level
-- (CORE BUSINESS RULE #4: duplicate pending requests are blocked).
CREATE UNIQUE INDEX IF NOT EXISTS idx_delreq_one_pending
  ON task_delete_requests(task_id) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_checklists_task_id    ON task_checklists(task_id);
CREATE INDEX IF NOT EXISTS idx_checklists_completed_by ON task_checklists(completed_by);

-- PK is (task_id, depends_on_task_id); this index covers reverse lookups.
CREATE INDEX IF NOT EXISTS idx_dependencies_depends_on ON task_dependencies(depends_on_task_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user    ON notifications(user_id, is_read, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_task    ON notifications(task_id);

CREATE INDEX IF NOT EXISTS idx_sessions_expires      ON sessions(expires_at);

-- ─────────────────────── QC Operations Platform ───────────────────────
-- These tables extend the Task Manager without replacing the tasks model.
CREATE TABLE IF NOT EXISTS qc_findings (
  id INTEGER PRIMARY KEY AUTOINCREMENT, finding_number TEXT NOT NULL UNIQUE,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  inspection_type TEXT NOT NULL, classification TEXT NOT NULL CHECK (classification IN ('conforming','observation','minor','major','critical')),
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')), risk_description TEXT NOT NULL,
  requirement_reference TEXT, owner INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT, due_date TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','UNDER_REVIEW','ACTION_REQUIRED','VERIFICATION','CLOSED','REOPENED')),
  closure_evidence TEXT, closed_by INTEGER REFERENCES users(id) ON DELETE SET NULL, closed_at TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS qc_rca (
  id INTEGER PRIMARY KEY AUTOINCREMENT, finding_id INTEGER NOT NULL UNIQUE REFERENCES qc_findings(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('5_WHYS','FISHBONE','FREE_FORM')), free_form TEXT,
  why_1 TEXT, why_2 TEXT, why_3 TEXT, why_4 TEXT, why_5 TEXT, fishbone_json TEXT,
  updated_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS qc_capa (
  id INTEGER PRIMARY KEY AUTOINCREMENT, finding_id INTEGER NOT NULL UNIQUE REFERENCES qc_findings(id) ON DELETE CASCADE,
  problem_statement TEXT NOT NULL, root_cause TEXT NOT NULL, corrective_action TEXT NOT NULL, preventive_action TEXT NOT NULL,
  owner INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT, due_date TEXT, evidence TEXT, effectiveness_check TEXT,
  reviewer INTEGER REFERENCES users(id) ON DELETE SET NULL, approval TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','OPEN','IMPLEMENTATION','VERIFICATION','EFFECTIVE','CLOSED','REOPENED')),
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS qc_evidence (
  id INTEGER PRIMARY KEY AUTOINCREMENT, finding_id INTEGER REFERENCES qc_findings(id) ON DELETE CASCADE,
  capa_id INTEGER REFERENCES qc_capa(id) ON DELETE CASCADE, description TEXT NOT NULL, reference TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT, created_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK ((finding_id IS NOT NULL AND capa_id IS NULL) OR (finding_id IS NULL AND capa_id IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS qc_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  -- Extended by migration 011 (guarded row-preserving rebuild) so laboratory
  -- entities/actions share the SAME audit system. Legacy FINDING/RCA/CAPA/
  -- EVIDENCE rows are preserved verbatim.
  entity_type TEXT NOT NULL CHECK (entity_type IN ('FINDING','RCA','CAPA','EVIDENCE','LAB_TEST','LAB_RETEST','LAB_PRODUCT','LAB_TEMPLATE','LAB_EQUIPMENT','LAB_EQUIPMENT_MAINTENANCE','LAB_EQUIPMENT_CALIBRATION','LAB_DOCUMENT','LAB_DOCUMENT_VERSION','LAB_CHANGE_REQUEST')),
  entity_id INTEGER NOT NULL, task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  actor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action TEXT NOT NULL CHECK (action IN ('CREATE','UPDATE','STATUS_TRANSITION','APPROVAL','REJECTION','CLOSURE','REOPEN','SUBMIT','REQUEST_CHANGES','VOID','SUPERSEDE','ACKNOWLEDGE','LINK','UNLINK','VERSION')),
  old_value TEXT, new_value TEXT, note TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_qc_findings_task ON qc_findings(task_id);
CREATE INDEX IF NOT EXISTS idx_qc_findings_owner_status ON qc_findings(owner,status);
CREATE INDEX IF NOT EXISTS idx_qc_findings_due ON qc_findings(due_date);
CREATE INDEX IF NOT EXISTS idx_qc_rca_finding ON qc_rca(finding_id);
CREATE INDEX IF NOT EXISTS idx_qc_capa_finding_status ON qc_capa(finding_id,status);
CREATE INDEX IF NOT EXISTS idx_qc_evidence_finding ON qc_evidence(finding_id);
CREATE INDEX IF NOT EXISTS idx_qc_evidence_capa ON qc_evidence(capa_id);
CREATE INDEX IF NOT EXISTS idx_qc_audit_entity ON qc_audit_log(entity_type,entity_id,created_at);

CREATE INDEX IF NOT EXISTS idx_login_attempts_user   ON login_attempts(username, created_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_failure
  ON login_attempts(ip_address, succeeded, created_at);

CREATE INDEX IF NOT EXISTS idx_saved_filters_user    ON saved_filters(user_id);

CREATE INDEX IF NOT EXISTS idx_users_created_by      ON users(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_sla_status      ON tasks(sla_status);
CREATE INDEX IF NOT EXISTS idx_tasks_sla_due         ON tasks(sla_due_at);
CREATE INDEX IF NOT EXISTS idx_sla_policies_match    ON sla_policies(priority, department, task_type, is_active);
CREATE INDEX IF NOT EXISTS idx_escalation_events_task ON escalation_events(task_id, triggered_at);
CREATE INDEX IF NOT EXISTS idx_escalation_events_retry ON escalation_events(delivery_status, triggered_at);

CREATE INDEX IF NOT EXISTS idx_task_templates_status     ON task_templates(lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_task_templates_department ON task_templates(department);
CREATE INDEX IF NOT EXISTS idx_attachments_evidence_type ON task_attachments(evidence_type);
CREATE INDEX IF NOT EXISTS idx_tasks_template            ON tasks(template_id);

-- ─────────────────────── Report generation audit ───────────────────────
CREATE TABLE IF NOT EXISTS report_audit_log (
  report_id TEXT PRIMARY KEY,
  report_type TEXT NOT NULL,
  generated_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  filters_json TEXT NOT NULL,
  generated_at TEXT NOT NULL DEFAULT (datetime('now')),
  format TEXT NOT NULL CHECK (format IN ('csv', 'xlsx', 'pdf')),
  data_scope_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  row_count INTEGER,
  failure_reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_report_audit_actor_time ON report_audit_log(generated_by, generated_at);
CREATE INDEX IF NOT EXISTS idx_report_audit_type_time ON report_audit_log(report_type, generated_at);

-- ─────────────────────── QC Laboratory (migrations 011–014) ─────────────────
-- Laboratory workspace tables. equipment_id is the canonical equipment
-- relationship (never a name); approved tests keep approval-time snapshots so
-- history stays correct when master data changes later.

-- Test template identity; versioned content in lab_test_template_versions.
CREATE TABLE IF NOT EXISTS lab_test_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  test_type TEXT NOT NULL CHECK (test_type IN ('air','vacuum')),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ACTIVE','ARCHIVED')),
  current_version_id INTEGER REFERENCES lab_test_template_versions(id) ON DELETE SET NULL,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS lab_test_template_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL REFERENCES lab_test_templates(id) ON DELETE CASCADE,
  version INTEGER NOT NULL CHECK (version > 0),
  default_sample_count INTEGER CHECK (default_sample_count IS NULL OR default_sample_count > 0),
  parameters_json TEXT NOT NULL DEFAULT '{}',
  connector_choices_json TEXT,
  applicable_product_id INTEGER REFERENCES lab_products(id) ON DELETE SET NULL,
  applicable_equipment_id INTEGER REFERENCES lab_equipment(id) ON DELETE SET NULL,
  sop_id INTEGER REFERENCES lab_documents(id) ON DELETE SET NULL,
  wi_id INTEGER REFERENCES lab_documents(id) ON DELETE SET NULL,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  effective_date TEXT,
  UNIQUE (template_id, version)
);

-- Equipment registry. status_raw stores the supplied business value verbatim;
-- the UI maps it for display only. Retirement is is_archived, never hard delete.
CREATE TABLE IF NOT EXISTS lab_equipment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  location TEXT,
  status_raw TEXT NOT NULL,
  calibration_status_raw TEXT,
  serial_number TEXT,
  notes TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0,1)),
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS lab_equipment_maintenance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipment_id INTEGER NOT NULL REFERENCES lab_equipment(id) ON DELETE CASCADE,
  maintenance_date TEXT, issue TEXT, maintenance_type TEXT, description TEXT,
  technician_vendor TEXT, status TEXT, completed_date TEXT, notes TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS lab_equipment_calibration (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipment_id INTEGER NOT NULL REFERENCES lab_equipment(id) ON DELETE CASCADE,
  last_calibrated_at TEXT, calibration_due_at TEXT, provider TEXT,
  certificate_reference TEXT, result TEXT, next_due_at TEXT, notes TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Product Master.
CREATE TABLE IF NOT EXISTS lab_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  connector_type TEXT,
  default_test_type TEXT CHECK (default_test_type IN ('air','vacuum')),
  default_template_id INTEGER REFERENCES lab_test_templates(id) ON DELETE SET NULL,
  applicable_sop_id INTEGER REFERENCES lab_documents(id) ON DELETE SET NULL,
  applicable_wi_id INTEGER REFERENCES lab_documents(id) ON DELETE SET NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  notes TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Product Master ↔ Equipment link ("Related Equipment", by canonical id).
CREATE TABLE IF NOT EXISTS lab_product_equipment (
  product_id INTEGER NOT NULL REFERENCES lab_products(id) ON DELETE CASCADE,
  equipment_id INTEGER NOT NULL REFERENCES lab_equipment(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (product_id, equipment_id)
);

-- Test Template ↔ Equipment link ("Equipment compatibility", by canonical id).
CREATE TABLE IF NOT EXISTS lab_template_equipment (
  template_id INTEGER NOT NULL REFERENCES lab_test_templates(id) ON DELETE CASCADE,
  equipment_id INTEGER NOT NULL REFERENCES lab_equipment(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (template_id, equipment_id)
);

-- AIR/VACUUM test records. Measurement columns are TEXT (printed-form values,
-- no invented unit semantics). Authorization identities and snapshots are
-- written by the service layer; final_result stays NULL until a human decides.
CREATE TABLE IF NOT EXISTS lab_test_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_number TEXT NOT NULL UNIQUE,
  test_type TEXT NOT NULL CHECK (test_type IN ('air','vacuum')),
  product_id INTEGER REFERENCES lab_products(id) ON DELETE RESTRICT,
  equipment_id INTEGER REFERENCES lab_equipment(id) ON DELETE RESTRICT,
  lot_number TEXT, sampling_area TEXT, medium_used TEXT, connector_type TEXT,
  sample_count INTEGER NOT NULL DEFAULT 5 CHECK (sample_count BETWEEN 1 AND 20),
  actual_pressure TEXT, torque_in_lb TEXT, time_sec TEXT, angle TEXT,
  temperature_measured TEXT, remarks TEXT,
  testing_date TEXT, actual_force TEXT, torque_value TEXT, humidity_measured TEXT,
  final_result TEXT CHECK (final_result IN ('PASS','FAIL','HOLD')),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SUBMITTED','UNDER_REVIEW','REJECTED','APPROVED','VOID')),
  template_id INTEGER REFERENCES lab_test_templates(id) ON DELETE RESTRICT,
  template_version_id INTEGER REFERENCES lab_test_template_versions(id) ON DELETE RESTRICT,
  sop_version_id INTEGER REFERENCES lab_document_versions(id) ON DELETE RESTRICT,
  wi_version_id INTEGER REFERENCES lab_document_versions(id) ON DELETE RESTRICT,
  tested_by INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  reviewed_by INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  approved_by INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  submitted_at TEXT, reviewed_at TEXT, approved_at TEXT,
  rejected_reason TEXT, void_reason TEXT,
  product_snapshot_json TEXT, template_snapshot_json TEXT, parameters_snapshot_json TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS lab_test_samples (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_id INTEGER NOT NULL REFERENCES lab_test_records(id) ON DELETE CASCADE,
  sample_no INTEGER NOT NULL CHECK (sample_no > 0),
  sample_identifier TEXT, part_name TEXT, set_pressure TEXT, actual_pressure TEXT,
  volume_sec TEXT, pressure_difference TEXT, holding_time_sec TEXT, leakage_rate TEXT,
  applied_pressure TEXT, volume_liter TEXT,
  result TEXT CHECK (result IN ('PASS','FAIL','HOLD')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','TESTED','APPROVED','VOID')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (test_id, sample_no)
);
-- Sample identifiers are immutable forever; approved/voided tests freeze the
-- sample rows entirely (migration 020).
CREATE TRIGGER IF NOT EXISTS lab_sample_identifier_immutable
BEFORE UPDATE ON lab_test_samples
WHEN OLD.sample_identifier IS NOT NEW.sample_identifier
BEGIN
  SELECT RAISE(ABORT, 'lab_test_samples.sample_identifier is immutable');
END;
CREATE TRIGGER IF NOT EXISTS lab_sample_frozen_after_approval_update
BEFORE UPDATE ON lab_test_samples
WHEN EXISTS (SELECT 1 FROM lab_test_records t
             WHERE t.id = OLD.test_id AND t.status IN ('APPROVED','VOID'))
BEGIN
  SELECT RAISE(ABORT, 'lab_test_samples rows are frozen after test approval');
END;
CREATE TRIGGER IF NOT EXISTS lab_sample_frozen_after_approval_delete
BEFORE DELETE ON lab_test_samples
WHEN EXISTS (SELECT 1 FROM lab_test_records t
             WHERE t.id = OLD.test_id AND t.status IN ('APPROVED','VOID'))
BEGIN
  SELECT RAISE(ABORT, 'lab_test_samples rows are frozen after test approval');
END;
CREATE TABLE IF NOT EXISTS lab_test_retests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  retest_number TEXT NOT NULL UNIQUE,
  original_test_id INTEGER NOT NULL REFERENCES lab_test_records(id) ON DELETE RESTRICT,
  new_test_id INTEGER REFERENCES lab_test_records(id) ON DELETE SET NULL,
  reason TEXT NOT NULL CHECK (reason IN ('FAIL','HOLD','SAMPLE_ISSUE','EQUIPMENT_ISSUE','PROCEDURAL_ISSUE','OTHER')),
  reason_note TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN',
  original_result TEXT,
  original_status TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS lab_test_findings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_id INTEGER NOT NULL REFERENCES lab_test_records(id) ON DELETE RESTRICT,
  finding_id INTEGER NOT NULL REFERENCES qc_findings(id) ON DELETE RESTRICT,
  note TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (test_id, finding_id)
);
CREATE TABLE IF NOT EXISTS lab_test_equipment_snapshots (
  test_id INTEGER NOT NULL UNIQUE REFERENCES lab_test_records(id) ON DELETE CASCADE,
  equipment_id INTEGER REFERENCES lab_equipment(id) ON DELETE SET NULL,
  equipment_name TEXT, equipment_code TEXT, serial_number TEXT, location TEXT,
  calibration_state TEXT, calibration_reference TEXT,
  captured_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Session environmental readings log (PROMPT 026 / prompt5 PROMPT 51):
-- supplementary timestamped observations; frozen after test approval/void.
CREATE TABLE IF NOT EXISTS lab_test_environment_readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_id INTEGER NOT NULL REFERENCES lab_test_records(id) ON DELETE RESTRICT,
  reading_at TEXT NOT NULL,
  temperature TEXT NOT NULL,
  humidity TEXT,
  notes TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TRIGGER IF NOT EXISTS lab_env_reading_frozen_after_approval_update
BEFORE UPDATE ON lab_test_environment_readings
WHEN EXISTS (SELECT 1 FROM lab_test_records t
             WHERE t.id = OLD.test_id AND t.status IN ('APPROVED','VOID'))
BEGIN
  SELECT RAISE(ABORT, 'lab_test_environment_readings rows are frozen after test approval');
END;
CREATE TRIGGER IF NOT EXISTS lab_env_reading_frozen_after_approval_delete
BEFORE DELETE ON lab_test_environment_readings
WHEN EXISTS (SELECT 1 FROM lab_test_records t
             WHERE t.id = OLD.test_id AND t.status IN ('APPROVED','VOID'))
BEGIN
  SELECT RAISE(ABORT, 'lab_test_environment_readings rows are frozen after test approval');
END;

CREATE TABLE IF NOT EXISTS lab_test_document_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_id INTEGER NOT NULL REFERENCES lab_test_records(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('SOP','WI')),
  document_id INTEGER, document_code TEXT, document_type TEXT,
  version_number INTEGER, title TEXT,
  captured_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (test_id, role)
);

-- Controlled SOP/WI documents: identity + immutable numbered versions.
CREATE TABLE IF NOT EXISTS lab_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('SOP','WI')),
  description TEXT,
  product_id INTEGER REFERENCES lab_products(id) ON DELETE SET NULL,
  owner_id INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  reviewer_id INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  approver_id INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  current_version_id INTEGER REFERENCES lab_document_versions(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','IN_REVIEW','APPROVED','SUPERSEDED','ARCHIVED')),
  effective_date TEXT, review_due_date TEXT,
  approved_at TEXT,
  source_revision INTEGER,
  source_date TEXT,
  source_register_code TEXT,
  source_class TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS lab_document_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL REFERENCES lab_documents(id) ON DELETE CASCADE,
  version INTEGER NOT NULL CHECK (version > 0),
  content_md TEXT NOT NULL,
  content_html_sanitized TEXT,
  change_summary TEXT,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL, reviewed_at TEXT,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL, approved_at TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','IN_REVIEW','APPROVED','SUPERSEDED','ARCHIVED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (document_id, version)
);
CREATE TABLE IF NOT EXISTS lab_document_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL REFERENCES lab_documents(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('EQUIPMENT','PRODUCT','TEMPLATE')),
  entity_id INTEGER NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS lab_document_acknowledgements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_version_id INTEGER NOT NULL REFERENCES lab_document_versions(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
  acknowledged_at TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','ACKNOWLEDGED')),
  UNIQUE (document_version_id, user_id)
);

-- User-scoped saved lab views (same shape as saved_filters).
CREATE TABLE IF NOT EXISTS lab_saved_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filter_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS lab_change_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('EQUIPMENT','PRODUCT','CALIBRATION','RETEST_REQUEST')),
  operation TEXT NOT NULL CHECK (operation IN ('CREATE','UPDATE')),
  entity_id INTEGER,
  base_updated_at TEXT,
  base_snapshot_json TEXT,
  proposed_snapshot_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  requested_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  review_note TEXT,
  applied_entity_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_lab_products_code ON lab_products(code);
CREATE INDEX IF NOT EXISTS idx_lab_products_active ON lab_products(is_active);
CREATE INDEX IF NOT EXISTS idx_lab_product_equipment_equipment ON lab_product_equipment(equipment_id);
CREATE INDEX IF NOT EXISTS idx_lab_template_equipment_equipment ON lab_template_equipment(equipment_id);
CREATE INDEX IF NOT EXISTS idx_lab_equipment_code ON lab_equipment(code);
CREATE INDEX IF NOT EXISTS idx_lab_equipment_archived ON lab_equipment(is_archived);
CREATE INDEX IF NOT EXISTS idx_lab_equip_maint_equipment ON lab_equipment_maintenance(equipment_id, maintenance_date);
CREATE INDEX IF NOT EXISTS idx_lab_equip_cal_equipment ON lab_equipment_calibration(equipment_id, calibration_due_at);
CREATE INDEX IF NOT EXISTS idx_lab_equip_cal_due ON lab_equipment_calibration(calibration_due_at);
CREATE INDEX IF NOT EXISTS idx_lab_templates_code ON lab_test_templates(code);
CREATE INDEX IF NOT EXISTS idx_lab_template_versions_template ON lab_test_template_versions(template_id, version);
CREATE INDEX IF NOT EXISTS idx_lab_tests_status ON lab_test_records(status);
CREATE INDEX IF NOT EXISTS idx_lab_tests_type ON lab_test_records(test_type);
CREATE INDEX IF NOT EXISTS idx_lab_tests_product ON lab_test_records(product_id);
CREATE INDEX IF NOT EXISTS idx_lab_tests_equipment ON lab_test_records(equipment_id);
CREATE INDEX IF NOT EXISTS idx_lab_tests_tested_by ON lab_test_records(tested_by);
CREATE INDEX IF NOT EXISTS idx_lab_tests_created_at ON lab_test_records(created_at);
CREATE INDEX IF NOT EXISTS idx_lab_tests_final_result ON lab_test_records(final_result);
CREATE INDEX IF NOT EXISTS idx_lab_tests_lot ON lab_test_records(lot_number);
CREATE INDEX IF NOT EXISTS idx_lab_tests_sampling_area ON lab_test_records(sampling_area);
CREATE INDEX IF NOT EXISTS idx_lab_samples_test ON lab_test_samples(test_id, sample_no);
CREATE INDEX IF NOT EXISTS idx_lab_retests_original ON lab_test_retests(original_test_id);
CREATE INDEX IF NOT EXISTS idx_lab_retests_new ON lab_test_retests(new_test_id);
CREATE INDEX IF NOT EXISTS idx_lab_test_findings_test ON lab_test_findings(test_id);
CREATE INDEX IF NOT EXISTS idx_lab_test_findings_finding ON lab_test_findings(finding_id);
CREATE INDEX IF NOT EXISTS idx_lab_test_env_readings_test ON lab_test_environment_readings(test_id);
CREATE INDEX IF NOT EXISTS idx_lab_documents_code ON lab_documents(code);
CREATE INDEX IF NOT EXISTS idx_lab_documents_type_status ON lab_documents(type, status);
CREATE INDEX IF NOT EXISTS idx_lab_documents_review_due ON lab_documents(review_due_date);
CREATE INDEX IF NOT EXISTS idx_lab_doc_versions_document ON lab_document_versions(document_id, version);
CREATE INDEX IF NOT EXISTS idx_lab_doc_links_document ON lab_document_links(document_id);
CREATE INDEX IF NOT EXISTS idx_lab_doc_links_entity ON lab_document_links(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_lab_doc_ack_version ON lab_document_acknowledgements(document_version_id);
CREATE INDEX IF NOT EXISTS idx_lab_doc_ack_user ON lab_document_acknowledgements(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_saved_views_user ON lab_saved_views(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_tests_updated_at ON lab_test_records(updated_at);
CREATE INDEX IF NOT EXISTS idx_lab_tests_created_by ON lab_test_records(created_by);
CREATE INDEX IF NOT EXISTS idx_lab_tests_template ON lab_test_records(template_id);
CREATE INDEX IF NOT EXISTS idx_lab_tests_template_version ON lab_test_records(template_version_id);
CREATE INDEX IF NOT EXISTS idx_lab_retests_status ON lab_test_retests(status);
CREATE INDEX IF NOT EXISTS idx_lab_retests_updated_at ON lab_test_retests(updated_at);
CREATE INDEX IF NOT EXISTS idx_lab_equip_cal_equipment_created ON lab_equipment_calibration(equipment_id, created_at);
CREATE INDEX IF NOT EXISTS idx_lab_doc_ack_status ON lab_document_acknowledgements(status);
CREATE INDEX IF NOT EXISTS idx_lab_doc_ack_assigned_at ON lab_document_acknowledgements(assigned_at);
CREATE INDEX IF NOT EXISTS idx_lab_documents_owner ON lab_documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_lab_documents_product ON lab_documents(product_id);
CREATE INDEX IF NOT EXISTS idx_lab_documents_updated_at ON lab_documents(updated_at);
CREATE INDEX IF NOT EXISTS idx_lab_documents_source_register ON lab_documents(source_register_code, type, source_revision);
CREATE INDEX IF NOT EXISTS idx_lab_change_requests_status_created ON lab_change_requests(status, created_at);
CREATE INDEX IF NOT EXISTS idx_lab_change_requests_requester_status ON lab_change_requests(requested_by, status);
CREATE INDEX IF NOT EXISTS idx_lab_change_requests_target ON lab_change_requests(entity_type, entity_id, status);

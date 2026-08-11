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
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
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
CREATE TABLE IF NOT EXISTS notifications (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id    INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  is_read    INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

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

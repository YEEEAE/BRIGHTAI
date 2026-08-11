-- Canonical initial schema for QC Task Manager.
-- This migration is intentionally idempotent so it can be used for fresh
-- databases and as the baseline definition for legacy databases.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL, full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','manager','supervisor','employee')),
  department TEXT NOT NULL DEFAULT 'QC', can_create_tasks INTEGER NOT NULL DEFAULT 0 CHECK (can_create_tasks IN (0,1)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)), failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT, last_login_at TEXT, created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT,
  department TEXT NOT NULL DEFAULT 'QC', status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','on_hold','completed','cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT, assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  due_date TEXT, blocker_note TEXT, recurrence TEXT NOT NULL DEFAULT 'none' CHECK (recurrence IN ('none','daily','weekly','monthly')),
  recurrence_end_date TEXT, parent_recurring_task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  started_at TEXT, completed_at TEXT, completed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  completion_comment_id INTEGER, cancelled_at TEXT, cancelled_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  inspection_type TEXT, finding_classification TEXT, risk_level TEXT, corrective_action_required INTEGER CHECK (corrective_action_required IN (0,1)),
  reference_number TEXT, audit_batch_or_work_order TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS task_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT, task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT, comment TEXT NOT NULL,
  is_completion_comment INTEGER NOT NULL DEFAULT 0 CHECK (is_completion_comment IN (0,1)), created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS task_attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT, task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT, file_name TEXT NOT NULL, mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL, file_hash TEXT, file_data BLOB NOT NULL, is_evidence INTEGER NOT NULL DEFAULT 0 CHECK (is_evidence IN (0,1)),
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS task_activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT, task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT, action TEXT NOT NULL, field TEXT, old_value TEXT,
  new_value TEXT, note TEXT, ip_address TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS task_delete_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT, task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  requested_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT, reason TEXT, review_note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL, reviewed_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS task_checklists (
  id INTEGER PRIMARY KEY AUTOINCREMENT, task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0, is_completed INTEGER NOT NULL DEFAULT 0 CHECK (is_completed IN (0,1)),
  completed_by INTEGER REFERENCES users(id) ON DELETE SET NULL, completed_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS task_dependencies (
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE, depends_on_task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, depends_on_task_id), CHECK (task_id != depends_on_task_id)
);
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL, type TEXT NOT NULL, title TEXT NOT NULL, message TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0,1)), created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, ip_address TEXT, succeeded INTEGER NOT NULL CHECK (succeeded IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS saved_filters (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, filter_json TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);
CREATE INDEX IF NOT EXISTS idx_tasks_recurrence ON tasks(recurrence);
CREATE INDEX IF NOT EXISTS idx_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_attachments_task_id ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by ON task_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_activity_task_created ON task_activity_log(task_id, created_at);
CREATE INDEX IF NOT EXISTS idx_activity_user_id ON task_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_delreq_task_id ON task_delete_requests(task_id);
CREATE INDEX IF NOT EXISTS idx_delreq_requested_by ON task_delete_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_delreq_reviewed_by ON task_delete_requests(reviewed_by);
CREATE UNIQUE INDEX IF NOT EXISTS idx_delreq_one_pending ON task_delete_requests(task_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_checklists_task_id ON task_checklists(task_id);
CREATE INDEX IF NOT EXISTS idx_checklists_completed_by ON task_checklists(completed_by);
CREATE INDEX IF NOT EXISTS idx_dependencies_depends_on ON task_dependencies(depends_on_task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_task ON notifications(task_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_user ON login_attempts(username, created_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_failure ON login_attempts(ip_address, succeeded, created_at);
CREATE INDEX IF NOT EXISTS idx_saved_filters_user ON saved_filters(user_id);
CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);

-- QC Task Manager — database schema
-- SQLite, WAL mode enabled at runtime by db.ts.
-- Run via `pnpm --filter qc-task-manager db:init`.

PRAGMA foreign_keys = ON;

-- ───────────────────────────── Users ─────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  username        TEXT NOT NULL UNIQUE,
  full_name       TEXT NOT NULL,
  email           TEXT UNIQUE,
  password_hash   TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'supervisor', 'employee')),
  can_create_tasks INTEGER NOT NULL DEFAULT 0 CHECK (can_create_tasks IN (0, 1)),
  is_active       INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ───────────────────────────── Tasks ─────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  title            TEXT NOT NULL,
  description      TEXT,
  status           TEXT NOT NULL DEFAULT 'Open'
                     CHECK (status IN ('Open', 'In Progress', 'Blocked', 'Completed', 'Cancelled')),
  priority         TEXT NOT NULL DEFAULT 'Medium'
                     CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  progress_percent INTEGER NOT NULL DEFAULT 0
                     CHECK (progress_percent >= 0 AND progress_percent <= 100),
  assigned_to      INTEGER,
  created_by       INTEGER NOT NULL,
  due_date         TEXT,                          -- ISO 8601, nullable
  blocker_note     TEXT,                          -- employee-added, nullable
  completed_at     TEXT,                          -- set when status -> Completed
  completed_by     INTEGER,                       -- user id of completer
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by)  REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_status      ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_priority    ON tasks(priority);

-- ───────────────────────── Comments ──────────────────────────────
CREATE TABLE IF NOT EXISTS task_comments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id     INTEGER NOT NULL,
  user_id     INTEGER NOT NULL,
  body        TEXT NOT NULL,
  is_closure  INTEGER NOT NULL DEFAULT 0 CHECK (is_closure IN (0, 1)), -- marks the mandatory completion comment
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (task_id) REFERENCES tasks(id)        ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_task ON task_comments(task_id);

-- ─────────────────────── Attachments (BLOBs) ─────────────────────
-- Stored inside the database per CORE BUSINESS RULE #5.
CREATE TABLE IF NOT EXISTS task_attachments (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id       INTEGER NOT NULL,
  uploaded_by   INTEGER NOT NULL,
  filename      TEXT NOT NULL,
  mime_type     TEXT NOT NULL DEFAULT 'application/octet-stream',
  size_bytes    INTEGER NOT NULL,
  content       BLOB NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (task_id)     REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_attachments_task ON task_attachments(task_id);

-- ─────────────────────── Activity log ────────────────────────────
-- Every mutation is recorded here (CORE BUSINESS RULE #6).
CREATE TABLE IF NOT EXISTS task_activity_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id     INTEGER NOT NULL,
  user_id     INTEGER,                            -- nullable for system actions
  action      TEXT NOT NULL,                      -- e.g. 'status_changed', 'task_created'
  field       TEXT,                               -- which field changed (if any)
  old_value   TEXT,
  new_value   TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_task ON task_activity_log(task_id);
CREATE INDEX IF NOT EXISTS idx_activity_time ON task_activity_log(created_at);

-- ─────────────────────── Delete requests ─────────────────────────
-- Employees cannot delete tasks; they submit a request (CORE BUSINESS RULE #4).
CREATE TABLE IF NOT EXISTS task_delete_requests (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id      INTEGER NOT NULL,
  requested_by INTEGER NOT NULL,
  reason       TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by  INTEGER,
  reviewed_at  TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (task_id)      REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by)  REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_delete_req_status ON task_delete_requests(status);
CREATE INDEX IF NOT EXISTS idx_delete_req_task   ON task_delete_requests(task_id);

-- ─────────────────────────── Sessions ────────────────────────────
-- Cookie session store. `data` holds JSON { userId, role, ... }.
CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,                   -- random session token
  data        TEXT NOT NULL,                      -- JSON payload
  expires_at  TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

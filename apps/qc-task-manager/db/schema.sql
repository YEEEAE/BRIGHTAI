-- QC Task Manager — database schema.
-- SQLite. WAL mode + PRAGMA foreign_keys = ON are applied at runtime in src/lib/db.ts.
-- Idempotent: every statement uses IF NOT EXISTS so this file is safe to exec on every boot.

-- ────────────────────────────── Users ──────────────────────────────
-- role ∈ admin | manager | supervisor | employee (CORE BUSINESS RULE #1).
-- can_create_tasks gates employee task creation (CORE BUSINESS RULE #1).
CREATE TABLE IF NOT EXISTS users (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  username         TEXT UNIQUE NOT NULL,
  password_hash    TEXT NOT NULL,
  full_name        TEXT NOT NULL,
  role             TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'supervisor', 'employee')),
  department       TEXT NOT NULL DEFAULT 'QC',
  can_create_tasks INTEGER NOT NULL DEFAULT 0,
  is_active        INTEGER NOT NULL DEFAULT 1,
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ────────────────────────────── Tasks ──────────────────────────────
-- status / progress flow per CORE BUSINESS RULES #2 and #3.
CREATE TABLE IF NOT EXISTS tasks (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  title           TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'not_started'
                    CHECK (status IN ('not_started', 'in_progress', 'on_hold', 'completed')),
  priority        TEXT NOT NULL DEFAULT 'medium'
                    CHECK (priority IN ('low', 'medium', 'high')),
  progress_percent INTEGER NOT NULL DEFAULT 0
                    CHECK (progress_percent BETWEEN 0 AND 100),
  created_by      INTEGER NOT NULL REFERENCES users(id),
  assigned_to     INTEGER REFERENCES users(id),
  due_date        TEXT,
  blocker_note    TEXT,
  completed_at    TEXT,
  completed_by    INTEGER REFERENCES users(id),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─────────────────────────── Task comments ─────────────────────────
-- The completion comment (CORE BUSINESS RULE #3) is stored here too; the
-- closure flow is enforced at the application layer, not via a flag column.
CREATE TABLE IF NOT EXISTS task_comments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id     INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  comment     TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ──────────────── Task attachments (stored as BLOBs) ───────────────
-- CORE BUSINESS RULE #5: attachments live INSIDE the database.
CREATE TABLE IF NOT EXISTS task_attachments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id     INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  uploaded_by INTEGER NOT NULL REFERENCES users(id),
  file_name   TEXT NOT NULL,
  mime_type   TEXT,
  file_data   BLOB NOT NULL,
  file_size   INTEGER,
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ────────────────────── Task activity log ──────────────────────────
-- CORE BUSINESS RULE #6: every action is recorded (who / what / old / new / when).
CREATE TABLE IF NOT EXISTS task_activity_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id     INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  action      TEXT NOT NULL,
  old_value   TEXT,
  new_value   TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ──────────────────── Task delete requests ─────────────────────────
-- CORE BUSINESS RULE #4: employees cannot delete; they request, manager/admin review.
--
-- Deliberately NO `ON DELETE CASCADE` on task_id: when a request is APPROVED the
-- task is hard-deleted but the request row must survive as the audit record
-- (status='approved'). task_id therefore becomes a historical reference that may
-- point at a deleted task; task_title snapshots the task name so the requests
-- page can render it even after the task is gone.
CREATE TABLE IF NOT EXISTS task_delete_requests (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id      INTEGER NOT NULL,
  task_title   TEXT NOT NULL,
  requested_by INTEGER NOT NULL REFERENCES users(id),
  reason       TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by  INTEGER REFERENCES users(id),
  reviewed_at  TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─────────────────────────── Sessions ──────────────────────────────
-- Opaque token → user_id. Cookie only holds the token; the row is the source of truth.
CREATE TABLE IF NOT EXISTS sessions (
  token       TEXT PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at  TEXT NOT NULL
);

-- ─────────────────────────── Indexes ───────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status      ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_activity_task_id  ON task_activity_log(task_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires  ON sessions(expires_at);
-- One pending deletion request per task, enforced at the database level
-- (CORE BUSINESS RULE #4: duplicate pending requests are blocked).
CREATE UNIQUE INDEX IF NOT EXISTS idx_delreq_one_pending
  ON task_delete_requests(task_id) WHERE status = 'pending';

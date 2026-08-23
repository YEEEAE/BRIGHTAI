-- brightai:allow-destructive
-- Preserve task deletion evidence outside task-owned cascades and keep task
-- activity rows (and their chain) after the task itself is removed.
CREATE TABLE IF NOT EXISTS task_deletion_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  task_title TEXT NOT NULL,
  requested_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reason TEXT,
  reviewed_by INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  review_note TEXT,
  requested_at TEXT NOT NULL,
  reviewed_at TEXT,
  outcome TEXT NOT NULL CHECK (outcome IN ('approved', 'rejected')),
  recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_task_deletion_history_task ON task_deletion_history(task_id, reviewed_at);
CREATE INDEX IF NOT EXISTS idx_task_deletion_history_reviewed ON task_deletion_history(reviewed_at, id);
CREATE TRIGGER IF NOT EXISTS task_deletion_history_no_update
BEFORE UPDATE ON task_deletion_history
BEGIN
  SELECT RAISE(ABORT, 'task deletion history is immutable');
END;
CREATE TRIGGER IF NOT EXISTS task_deletion_history_no_delete
BEFORE DELETE ON task_deletion_history
BEGIN
  SELECT RAISE(ABORT, 'task deletion history is immutable');
END;

INSERT INTO task_deletion_history (id, task_id, task_title, requested_by, reason, reviewed_by, review_note, requested_at, reviewed_at, outcome)
SELECT r.id, r.task_id, COALESCE(t.title, 'Deleted task #' || r.task_id), r.requested_by, r.reason, r.reviewed_by,
       r.review_note, r.created_at, r.reviewed_at, r.status
FROM task_delete_requests r LEFT JOIN tasks t ON t.id = r.task_id
WHERE r.status IN ('approved', 'rejected')
  AND NOT EXISTS (SELECT 1 FROM task_deletion_history h WHERE h.id = r.id);

CREATE TABLE task_activity_log_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action TEXT NOT NULL, field TEXT, old_value TEXT, new_value TEXT, note TEXT, ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), previous_hash TEXT, event_hash TEXT
);
INSERT INTO task_activity_log_new (id, task_id, user_id, action, field, old_value, new_value, note, ip_address, created_at, previous_hash, event_hash)
SELECT id, task_id, user_id, action, field, old_value, new_value, note, ip_address, created_at, previous_hash, event_hash
FROM task_activity_log;
DROP TABLE task_activity_log;
ALTER TABLE task_activity_log_new RENAME TO task_activity_log;
CREATE INDEX IF NOT EXISTS idx_activity_task_created ON task_activity_log(task_id, created_at);
CREATE INDEX IF NOT EXISTS idx_activity_user_id ON task_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_event_hash ON task_activity_log(event_hash);

ALTER TABLE qc_audit_log ADD COLUMN previous_hash TEXT;
ALTER TABLE qc_audit_log ADD COLUMN event_hash TEXT;
